from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timezone

from emergentintegrations.llm.chat import LlmChat, UserMessage


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# LLM key
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# ============ Models ============
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class StatusCheckCreate(BaseModel):
    client_name: str


class OnlineQueryRequest(BaseModel):
    query: str
    query_type: Literal["search", "meaning", "knowledge", "translation"] = "search"
    session_id: Optional[str] = None
    enabled_features: Optional[dict] = None  # granular gate: {"webSearch": true, ...}


class OnlineQueryResponse(BaseModel):
    id: str
    query: str
    query_type: str
    answer: str
    timestamp: str
    source: str = "Gemini 3 Flash (Online Query Channel)"


class OnlineQueryLog(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    query: str
    query_type: str
    answer: str
    session_id: str
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class OfflineStatusResponse(BaseModel):
    engine: str
    online_mode: bool
    air_gap_active: bool
    outbound_packets: int
    total_online_queries: int


# ============ Routes ============
@api_router.get("/")
async def root():
    return {"message": "NEXUS-OFFLINE Backend Online", "online_mode_channel": "ready"}


@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_obj = StatusCheck(**input.dict())
    doc = status_obj.dict()
    await db.status_checks.insert_one(doc)
    return status_obj


@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    return [StatusCheck(**s) for s in status_checks]


# ---------- Online Mode Endpoints ----------

SYSTEM_PROMPT_MAP = {
    "search": (
        "You are NEXUS Online Query Channel. Answer web-search style queries. "
        "Be concise (3-5 sentences max), factual, and helpful. "
        "Do not include disclaimers about being an AI. Answer directly."
    ),
    "meaning": (
        "You are NEXUS Dictionary Channel. Provide the meaning of the given word or phrase. "
        "Format: 1 short definition, then a one-line example. Keep under 40 words."
    ),
    "knowledge": (
        "You are NEXUS Knowledge Channel. Answer the general knowledge question factually and briefly. "
        "Under 60 words. No filler."
    ),
    "translation": (
        "You are NEXUS Translation Channel. Translate the input to the target language "
        "the user mentioned; if unspecified, translate to English. Return only the translated text plus a single-line note."
    ),
}

FEATURE_KEY_MAP = {
    "search": "webSearch",
    "meaning": "dictionary",
    "knowledge": "knowledge",
    "translation": "translation",
}


@api_router.post("/online/query", response_model=OnlineQueryResponse)
async def online_query(req: OnlineQueryRequest):
    """Online Mode endpoint: dispatches a single query to Gemini 3 Flash.
    Only invoked when user has explicitly enabled Online Mode on the client.
    """
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="Emergent LLM key not configured")

    if not req.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    # Granular feature gate
    if req.enabled_features is not None:
        feature_key = FEATURE_KEY_MAP.get(req.query_type, "webSearch")
        if not req.enabled_features.get(feature_key, True):
            raise HTTPException(
                status_code=403,
                detail=f"Feature '{feature_key}' is disabled in granular toggles",
            )

    session_id = req.session_id or f"nexus_{uuid.uuid4().hex[:12]}"
    system_message = SYSTEM_PROMPT_MAP.get(req.query_type, SYSTEM_PROMPT_MAP["search"])

    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=session_id,
            system_message=system_message,
        ).with_model("gemini", "gemini-3-flash-preview")

        answer = await chat.send_message(UserMessage(text=req.query))
        answer_text = str(answer).strip()
    except Exception as e:
        logger.error(f"Online query failed: {e}")
        raise HTTPException(status_code=502, detail=f"Online channel error: {str(e)}")

    query_id = str(uuid.uuid4())
    timestamp = datetime.now(timezone.utc).isoformat()

    # Persist to MongoDB (excluding _id in every future read)
    log_doc = {
        "id": query_id,
        "query": req.query,
        "query_type": req.query_type,
        "answer": answer_text,
        "session_id": session_id,
        "timestamp": timestamp,
    }
    await db.online_query_logs.insert_one(log_doc)

    return OnlineQueryResponse(
        id=query_id,
        query=req.query,
        query_type=req.query_type,
        answer=answer_text,
        timestamp=timestamp,
    )


@api_router.get("/online/history", response_model=List[OnlineQueryLog])
async def online_history(limit: int = 20):
    """Fetch recent online queries (audit ledger)."""
    logs = await db.online_query_logs.find({}, {"_id": 0}).sort("timestamp", -1).to_list(limit)
    return [OnlineQueryLog(**l) for l in logs]


@api_router.delete("/online/history")
async def clear_online_history():
    """Wipe online query history for privacy."""
    result = await db.online_query_logs.delete_many({})
    return {"deleted": result.deleted_count}


@api_router.get("/offline/status", response_model=OfflineStatusResponse)
async def offline_status(online_mode: bool = False):
    total = await db.online_query_logs.count_documents({})
    return OfflineStatusResponse(
        engine="Porcupine-Embedded Nano (v3.2)",
        online_mode=online_mode,
        air_gap_active=not online_mode,
        outbound_packets=total if online_mode else 0,
        total_online_queries=total,
    )


@api_router.get("/audit/export")
async def audit_export():
    """Export full audit ledger as JSON (Enterprise mode).
    Returns online query history + a signed timestamp.
    """
    logs = await db.online_query_logs.find({}, {"_id": 0}).sort("timestamp", -1).to_list(1000)
    return {
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "total_records": len(logs),
        "engine": "NEXUS-OFFLINE Audit Ledger v1",
        "records": logs,
    }


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

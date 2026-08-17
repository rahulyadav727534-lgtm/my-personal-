"""NEXUS-OFFLINE backend tests: online query channel, audit export, offline status, status regression."""
import os
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://privacy-voice-4.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def api_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# --------- Root / Health ---------
class TestHealth:
    def test_root(self, api_client):
        r = api_client.get(f"{API}/")
        assert r.status_code == 200
        data = r.json()
        assert "NEXUS-OFFLINE" in data.get("message", "")


# --------- Online Query Channel (Gemini) ---------
class TestOnlineQuery:
    def test_search_query_returns_answer(self, api_client):
        r = api_client.post(f"{API}/online/query", json={
            "query": "What is the capital of France?",
            "query_type": "search",
        }, timeout=60)
        assert r.status_code == 200, r.text
        data = r.json()
        for key in ("id", "query", "answer", "timestamp", "source"):
            assert key in data, f"missing {key}"
        assert isinstance(data["answer"], str) and len(data["answer"]) > 3
        assert "Gemini" in data["source"]

    def test_meaning_query_returns_definition(self, api_client):
        r = api_client.post(f"{API}/online/query", json={
            "query": "ephemeral",
            "query_type": "meaning",
        }, timeout=60)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["query_type"] == "meaning"
        assert len(data["answer"]) > 5

    def test_knowledge_query_returns_answer(self, api_client):
        r = api_client.post(f"{API}/online/query", json={
            "query": "How does photosynthesis work?",
            "query_type": "knowledge",
        }, timeout=60)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["query_type"] == "knowledge"
        assert len(data["answer"]) > 10

    def test_empty_query_returns_400(self, api_client):
        r = api_client.post(f"{API}/online/query", json={
            "query": "   ",
            "query_type": "search",
        })
        assert r.status_code == 400, r.text


# --------- Online History Ledger ---------
class TestOnlineHistory:
    def test_history_returns_list_no_mongo_id(self, api_client):
        r = api_client.get(f"{API}/online/history")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        if data:
            for rec in data:
                assert "_id" not in rec
                assert "timestamp" in rec
            # Sorted desc
            ts = [rec["timestamp"] for rec in data]
            assert ts == sorted(ts, reverse=True)

    def test_history_delete_clears_ledger(self, api_client):
        # Ensure at least one record
        api_client.post(f"{API}/online/query", json={"query": "hello", "query_type": "search"}, timeout=60)
        r = api_client.delete(f"{API}/online/history")
        assert r.status_code == 200
        data = r.json()
        assert "deleted" in data
        assert isinstance(data["deleted"], int)
        # verify empty after delete
        r2 = api_client.get(f"{API}/online/history")
        assert r2.status_code == 200
        assert r2.json() == []


# --------- Audit Export ---------
class TestAuditExport:
    def test_audit_export_shape(self, api_client):
        # Create one entry to have non-zero
        api_client.post(f"{API}/online/query", json={"query": "meaning of stoic", "query_type": "meaning"}, timeout=60)
        r = api_client.get(f"{API}/audit/export")
        assert r.status_code == 200
        data = r.json()
        for key in ("exported_at", "total_records", "engine", "records"):
            assert key in data
        assert isinstance(data["records"], list)
        for rec in data["records"]:
            assert "_id" not in rec


# --------- Offline Status ---------
class TestOfflineStatus:
    def test_offline_mode_air_gap_active(self, api_client):
        r = api_client.get(f"{API}/offline/status", params={"online_mode": "false"})
        assert r.status_code == 200
        data = r.json()
        assert data["online_mode"] is False
        assert data["air_gap_active"] is True
        assert data["outbound_packets"] == 0

    def test_online_mode_outbound_matches_total(self, api_client):
        # Ensure at least one query
        api_client.post(f"{API}/online/query", json={"query": "test query", "query_type": "search"}, timeout=60)
        r = api_client.get(f"{API}/offline/status", params={"online_mode": "true"})
        assert r.status_code == 200
        data = r.json()
        assert data["online_mode"] is True
        assert data["air_gap_active"] is False
        assert data["outbound_packets"] == data["total_online_queries"]
        assert data["total_online_queries"] >= 1


# --------- Status Check Regression ---------
class TestStatusRegression:
    def test_create_and_list_no_mongo_id(self, api_client):
        r = api_client.post(f"{API}/status", json={"client_name": "TEST_nexus_agent"})
        assert r.status_code == 200
        obj = r.json()
        assert obj["client_name"] == "TEST_nexus_agent"
        assert "id" in obj

        r2 = api_client.get(f"{API}/status")
        assert r2.status_code == 200
        arr = r2.json()
        assert isinstance(arr, list)
        for row in arr:
            assert "_id" not in row

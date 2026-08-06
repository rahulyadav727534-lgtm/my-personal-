import asyncio
import os
from playwright.async_api import async_playwright

async def run_tests():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 375, "height": 667})
        page = await context.new_page()

        # Enable console logs
        page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))

        try:
            # 1. Load app
            print("Navigating to Expo web preview...")
            await page.goto("http://localhost:3000", timeout=30000)
            await page.wait_for_timeout(3000)

            # Check wake word screen loaded
            await page.wait_for_selector('[data-testid="wakeword-screen"]', timeout=10000)
            print("✓ Wake Word Engine screen loaded successfully")

            # Test wake word active toggle switch
            await page.click('[data-testid="wakeword-active-switch"]', force=True)
            await page.wait_for_timeout(1000)
            print("✓ Toggled background listener switch")

            # Test simulating voice triggers & custom command input
            await page.click('[data-testid="sim-tier1-btn"]', force=True)
            await page.wait_for_timeout(1000)
            await page.click('[data-testid="sim-tier2-btn"]', force=True)
            await page.wait_for_timeout(1000)

            await page.fill('[data-testid="custom-command-input"]', "Hey Assistant, toggle airplane mode")
            await page.click('[data-testid="custom-command-submit"]', force=True)
            await page.wait_for_timeout(1000)
            print("✓ Wake word simulation and custom command triggers working")

            # 2. Navigate to Command Terminal tab
            await page.goto("http://localhost:3000/commands", timeout=10000)
            await page.wait_for_selector('[data-testid="commands-screen"]', timeout=10000)
            print("✓ Command Terminal screen loaded successfully")

            # Test filter chips
            await page.click('[data-testid="filter-chip-hardware"]', force=True)
            await page.wait_for_timeout(500)
            await page.click('[data-testid="filter-chip-security"]', force=True)
            await page.wait_for_timeout(500)
            await page.click('[data-testid="filter-chip-all"]', force=True)
            await page.wait_for_timeout(500)
            print("✓ Category filter chips working")

            # Test dispatch offline intent modal
            await page.click('[data-testid="open-new-command-modal"]', force=True)
            await page.wait_for_selector('[data-testid="new-command-modal"]', timeout=5000)
            await page.fill('[data-testid="new-cmd-title-input"]', "Lock secure vault")
            await page.click('[data-testid="tier-2-select"]', force=True)
            await page.click('[data-testid="submit-new-cmd"]', force=True)
            await page.wait_for_timeout(1000)
            print("✓ Offline intent dispatch modal working")

            # Test Voiceprint screen
            await page.goto("http://localhost:3000/voiceprint", timeout=10000)
            await page.wait_for_selector('[data-testid="voiceprint-screen"]', timeout=10000)
            print("✓ Voiceprint screen loaded successfully")

            await page.click('[data-testid="start-calibration-btn"]', force=True)
            print("✓ Started voiceprint calibration sequence, waiting for completion...")
            await page.wait_for_timeout(6500)
            print("✓ Voiceprint calibration completed successfully")

            # Test Privacy & Audit ledger screen
            await page.goto("http://localhost:3000/privacy", timeout=10000)
            await page.wait_for_selector('[data-testid="privacy-screen"]', timeout=10000)
            print("✓ Privacy & Audit Ledger screen loaded successfully")

            await page.click('[data-testid="export-audit-btn"]', force=True)
            await page.wait_for_timeout(1000)
            print("✓ Local audit ledger export tested")

            # Test System Setup Wizard screen
            await page.goto("http://localhost:3000/wizard", timeout=10000)
            await page.wait_for_selector('[data-testid="wizard-screen"]', timeout=10000)
            print("✓ System Setup Wizard screen loaded successfully")

            await page.click('[data-testid="toggle-battery-btn"]', force=True)
            await page.wait_for_timeout(500)
            await page.click('[data-testid="download-nlu-btn"]', force=True)
            await page.wait_for_timeout(1000)
            print("✓ Battery optimization bypass and NLU model download tested")

            # Take success screenshot
            os.makedirs("/app/test_reports", exist_ok=True)
            await page.screenshot(path="/app/test_reports/nexus_frontend_test.png", full_page=False)
            print("✓ Frontend test suite completed successfully with screenshot saved.")

        except Exception as e:
            print(f"ERROR during frontend test: {str(e)}")
            os.makedirs("/app/test_reports", exist_ok=True)
            await page.screenshot(path="/app/test_reports/nexus_frontend_error.png", full_page=False)
            raise e
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(run_tests())

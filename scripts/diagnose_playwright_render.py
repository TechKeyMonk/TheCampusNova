import time
import sys
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(channel="msedge", headless=True)
    page = browser.new_page()
    page.on("console", lambda msg: print(f"[CONSOLE {msg.type}] {msg.text.encode('ascii', 'replace').decode()}", flush=True))
    page.on("request", lambda req: print(f"[NET REQ] {req.method} {req.url}", flush=True) if "events" in req.url or "news" in req.url else None)
    page.on("response", lambda res: print(f"[NET RES] {res.status} {res.url}", flush=True) if "events" in res.url or "news" in res.url else None)
    
    print("Navigating to index.html...", flush=True)
    page.goto("http://localhost:8000/index.html", wait_until="domcontentloaded")
    print("DOMContentLoaded reached. Waiting 3 seconds...", flush=True)
    time.sleep(3)
    
    res = page.evaluate("""() => {
        return {
            eventsContainer: !!document.getElementById('homeEventsFeedContainer'),
            eventsCountBadge: document.getElementById('homeEventsCountBadge')?.textContent,
            newsCountBadge: document.getElementById('homeNewsCountBadge')?.textContent,
            cachedEvents: window._liveEventsCache?.length,
            renderedEvents: document.querySelectorAll('#homeEventsFeedContainer > div').length,
            renderedButtons: document.querySelectorAll('#homeEventsFeedContainer button').length
        };
    }""")
    print("PAGE STATE AFTER 3s:", res, flush=True)
    
    browser.close()




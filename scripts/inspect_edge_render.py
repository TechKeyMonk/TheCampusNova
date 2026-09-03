import subprocess
import time
import json
import urllib.request

edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

# Start Edge with remote debugging
proc = subprocess.Popen([
    edge_path,
    "--headless=new",
    "--remote-debugging-port=9222",
    "http://127.0.0.1:8000/#mentors"
])
time.sleep(3)

try:
    req = urllib.request.urlopen("http://127.0.0.1:9222/json")
    pages = json.loads(req.read().decode("utf-8"))
    print("Open pages:", len(pages))
    target_page = None
    for p in pages:
        print("Page:", p.get("title"), p.get("url"))
        if "8000" in p.get("url", ""):
            target_page = p
            break
except Exception as e:
    print("Error getting CDP pages:", e)
finally:
    proc.terminate()

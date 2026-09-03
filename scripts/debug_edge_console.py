import subprocess
import time
import json
import urllib.request

def run_debug():
    edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
    # Start Edge headless with remote debugging
    cmd = [
        edge_path,
        "--headless=new",
        "--remote-debugging-port=9222",
        "http://127.0.0.1:8000/#mentors"
    ]
    proc = subprocess.Popen(cmd)
    time.sleep(3)

    try:
        # Get targets from CDP
        req = urllib.request.urlopen("http://127.0.0.1:9222/json")
        targets = json.loads(req.read().decode("utf-8"))
        print("CDP Targets:", len(targets))
        for t in targets:
            print("Target URL:", t.get("url"))
    except Exception as e:
        print("CDP Connect Error:", e)
    finally:
        proc.terminate()

if __name__ == '__main__':
    run_debug()

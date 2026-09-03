import asyncio
import json
import subprocess
import time
import urllib.request
import websockets

async def check():
    edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
    proc = subprocess.Popen([
        edge_path,
        "--headless=new",
        "--remote-debugging-port=9225",
        "http://127.0.0.1:8000/#mentors"
    ])
    await asyncio.sleep(4)

    try:
        req = urllib.request.urlopen("http://127.0.0.1:9225/json")
        pages = json.loads(req.read().decode("utf-8"))
        target = next((p for p in pages if "8000" in p.get("url", "")), None)
        if not target:
            print("Target not found")
            return

        async with websockets.connect(target["webSocketDebuggerUrl"]) as ws:
            await ws.send(json.dumps({"id": 1, "method": "Runtime.enable"}))
            
            # Poll every 500ms until loading text disappears or 5s timeout
            for i in range(10):
                await asyncio.sleep(0.5)
                req_id = 10 + i
                await ws.send(json.dumps({
                    "id": req_id,
                    "method": "Runtime.evaluate",
                    "params": {
                        "expression": "document.getElementById('mentorsGrid') ? document.getElementById('mentorsGrid').innerHTML : ''"
                    }
                }))
                
                found = False
                while True:
                    resp = await ws.recv()
                    msg = json.loads(resp)
                    if msg.get("id") == req_id:
                        html = msg.get("result", {}).get("result", {}).get("value", "")
                        if "Loading verified" not in html:
                            print("\n[FINAL RENDER DETECTED!]")
                            print("Contains JeganKumar:", "JeganKumar" in html)
                            print("Contains TechKeyMonk:", "TechKeyMonk" in html)
                            print("Contains View Profile:", "View Profile" in html)
                            print("Contains Unable to load:", "Unable to load" in html)
                            print("HTML Snippet:\n", html[:600])
                            found = True
                            break
                        else:
                            print(f"Poll {i+1}: Still loading...")
                            break
                if found:
                    break
    except Exception as e:
        print("Error:", e)
    finally:
        proc.terminate()

if __name__ == '__main__':
    asyncio.run(check())

import asyncio
import json
import subprocess
import time
import urllib.request
import websockets

async def inspect():
    edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
    proc = subprocess.Popen([
        edge_path,
        "--headless=new",
        "--remote-debugging-port=9224",
        "http://127.0.0.1:8000/#mentors"
    ])
    await asyncio.sleep(4)

    try:
        req = urllib.request.urlopen("http://127.0.0.1:9224/json")
        pages = json.loads(req.read().decode("utf-8"))
        target = None
        for p in pages:
            if "8000" in p.get("url", ""):
                target = p
                break
        
        if not target:
            print("Target page not found!")
            return

        ws_url = target["webSocketDebuggerUrl"]
        
        async with websockets.connect(ws_url) as ws:
            await ws.send(json.dumps({"id": 1, "method": "Runtime.enable"}))
            await ws.send(json.dumps({"id": 2, "method": "Console.enable"}))
            
            # Wait for fetch to finish
            await asyncio.sleep(2)

            eval_req = {
                "id": 3,
                "method": "Runtime.evaluate",
                "params": {
                    "expression": "document.getElementById('mentorsGrid') ? document.getElementById('mentorsGrid').innerHTML : 'NO_GRID'"
                }
            }
            await ws.send(json.dumps(eval_req))

            while True:
                resp = await ws.recv()
                msg = json.loads(resp)
                if msg.get("id") == 3:
                    print("\n--- Current Grid innerHTML (After Page Load) ---")
                    val = msg.get("result", {}).get("result", {}).get("value", "")
                    print("Length:", len(val))
                    print("Contains JeganKumar:", "JeganKumar" in val)
                    print("Contains Unable to load:", "Unable to load" in val)
                    print("Snippet:\n", val[:500])
                    break
                elif msg.get("method") == "Runtime.consoleAPICalled":
                    print("[Browser Console]", msg.get("params", {}).get("type"), msg.get("params", {}).get("args"))
    except Exception as e:
        print("Inspect Error:", e)
    finally:
        proc.terminate()

if __name__ == '__main__':
    asyncio.run(inspect())

import json
import re

transcript_path = r'C:\Users\SHYAM GANESH\.gemini\antigravity-ide\brain\f89c5b65-00ec-444c-a7d6-502c6edc2763\.system_generated\logs\transcript.jsonl'

with open(transcript_path, 'r', encoding='utf-8') as f:
    for i, line in enumerate(f):
        try:
            item = json.loads(line)
            content = str(item.get('content', ''))
            if '19' in content and ('field' in content.lower() or 'blueprint' in content.lower()):
                step = item.get('step_index')
                src = item.get('source')
                print(f"--- MATCH at line {i}, step {step}, source {src} ---")
                # find all lines containing 19 in content
                for sub in content.split('\n'):
                    if '19' in sub or 'field' in sub.lower():
                        print("  ", sub.strip()[:140])
        except Exception as e:
            pass

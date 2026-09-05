import urllib.request
import json
import sys
import re

print("==================================================")
print("TEST SUITE: MENTOR EMAIL PRIVACY & MASKING WITH STARS")
print("==================================================")

import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from server import mask_email_public, mask_mobile_public

test_cases = [
    ("jegan@techkeymonk.com", "j*****n@techkeymonk.com"),
    ("shyam@gmail.com", "s*****m@gmail.com"),
    ("arun.kumar@microsoft.com", "a*****r@microsoft.com"),
    ("priya@amazon.com", "p*****a@amazon.com"),
    ("admin@iisc.ac.in", "a*****n@iisc.ac.in"),
    ("contact@startup.io", "c*****t@startup.io"),
    ("a@test.com", "a*****@test.com"),
    ("ai@test.com", "a****i@test.com"),
    ("", "m*****r@campusnova.in"),
    (None, "m*****r@campusnova.in")
]

print("1. Testing Server-side mask_email_public across arbitrary mentor emails:")
for raw, expected in test_cases:
    masked = mask_email_public(raw)
    assert masked == expected, f"Failed for '{raw}': got '{masked}', expected '{expected}'"
    print(f"  [PASS] '{raw}' -> '{masked}'")

# 2. Test Live /api/mentors HTTP Endpoint
print("\n2. Testing Live HTTP GET /api/mentors response:")
req = urllib.request.Request("http://127.0.0.1:8000/api/mentors")
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode())
    assert data.get("success") == True, "Failed to get mentors"
    mentors = data.get("mentors", [])
    assert len(mentors) > 0, "No mentors returned"
    
    for m in mentors:
        name = m.get('name')
        comp = m.get('company_name')
        email = m.get("email")
        mobile = m.get("mobile_number")
        print(f"  Mentor: {name} ({comp})")
        print(f"    Masked Email : {email}")
        print(f"    Masked Mobile: {mobile}")
        assert "*****" in email or "****" in email, f"Email not masked with stars: '{email}'"
        assert "@" in email, f"Email missing domain: '{email}'"
        assert "jega***" not in email, f"Found obsolete 'jega***' in '{email}'"
        assert "shya***" not in email, f"Found obsolete 'shya***' in '{email}'"
        print("    [PASS] Email is securely masked with middle stars across public API.")

# 3. Test script.js client-side helper & index.html bindings
print("\n3. Testing Frontend JS and HTML integrity:")
with open("script.js", "r", encoding="utf-8") as f:
    js = f.read()

assert "maskEmailPublic" in js, "maskEmailPublic missing in script.js"
assert "emailEl.textContent = maskEmailPublic(mentor.email)" in js, "maskEmailPublic not hooked in openMentorDetailsModal"
print("  [PASS] script.js contains maskEmailPublic and uses it in openMentorDetailsModal")

with open("index.html", "r", encoding="utf-8") as f:
    html = f.read()

assert re.search(r'id=["\']modalMentorEmail["\']', html), "modalMentorEmail element missing in index.html"
assert "maskEmailPublic(mentor.email)" in js, "Mentor email is not populated through maskEmailPublic"
assert "shya***@gmail.com" not in html, "Obsolete shya***@gmail.com placeholder still found in index.html"
print("  [PASS] Mentor email modal is dynamically populated through maskEmailPublic")

print("\n==================================================")
print("ALL MENTOR EMAIL MASKING CHECKS PASSED!")
print("==================================================")

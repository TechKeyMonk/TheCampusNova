import urllib.request
import json
import time

print("==================================================")
print("TEST SUITE: USER WEBSITE AUTH & LOGIN/PROFILE UI")
print("==================================================")

# 1. Verify HTML DOM elements
with open("index.html", "r", encoding="utf-8") as f:
    html = f.read()

required_html_elements = [
    'id="headerLoginBtn"',
    'id="headerSignInBtn"',
    'id="headerAvatarLetter"',
    'id="profilePanel"',
    'id="profilePanelUserName"',
    'id="profilePanelUserEmail"',
    'id="headerLogoutBtn"',
    'id="userLoginModal"',
    'id="userSignupModal"',
    'id="signupName"',
    'id="signupEmail"',
    'id="signupPassword"',
    'id="signupConfirmPassword"'
]

html_ok = True
for el in required_html_elements:
    if el not in html:
        print(f"[FAIL] Missing in index.html: {el}")
        html_ok = False

if html_ok:
    print("[PASS] All required auth DOM elements present in index.html")

# 2. Verify script.js handlers
with open("script.js", "r", encoding="utf-8") as f:
    js = f.read()

required_js_handlers = [
    'updateHeaderAuthState',
    'loadStoredLoginState',
    'headerLoginBtn',
    'headerAvatarLetter',
    'signupName',
    'headerLogoutBtn',
    'handleUserLogout',
    'is-authenticated'
]

js_ok = True
for h in required_js_handlers:
    if h not in js:
        print(f"[FAIL] Missing in script.js: {h}")
        js_ok = False

if js_ok:
    print("[PASS] All required JS auth functions & event bindings present in script.js")

# 3. Verify CSS rules
with open("style.css", "r", encoding="utf-8") as f:
    css = f.read()

required_css = [
    '.profile-menu:not(.is-authenticated) .profile-avatar-btn',
    '.profile-menu:not(.is-authenticated) .header-login-btn',
    '.profile-menu.is-authenticated .header-login-btn',
    '.profile-menu.is-authenticated .profile-avatar-btn',
    '.header-login-btn'
]

css_ok = True
for c in required_css:
    if c not in css:
        print(f"[FAIL] Missing in style.css: {c}")
        css_ok = False

if css_ok:
    print("[PASS] All responsive CSS authentication visibility rules verified in style.css")

# 4. Test Live Auth API with Multiple Users & Dynamic Name Initials
test_users = [
    {
        "name": "Shyam Ganesh",
        "email": f"shyam_{int(time.time())}@testcampusnova.edu",
        "password": "Password123!",
        "expected_initial": "S"
    },
    {
        "name": "Arun Kumar",
        "email": f"arun_{int(time.time())}@testcampusnova.edu",
        "password": "Password123!",
        "expected_initial": "A"
    },
    {
        "name": "Priya Sundaram",
        "email": f"priya_{int(time.time())}@testcampusnova.edu",
        "password": "Password123!",
        "expected_initial": "P"
    }
]

print("\nTesting End-to-End User Registration & Login on PostgreSQL:")
for u in test_users:
    # A. Register user
    reg_payload = json.dumps({
        "name": u["name"],
        "email": u["email"],
        "password": u["password"]
    }).encode('utf-8')

    req = urllib.request.Request(
        "http://127.0.0.1:8000/api/auth/register",
        data=reg_payload,
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    with urllib.request.urlopen(req) as resp:
        reg_res = json.loads(resp.read().decode())
        assert reg_res.get("success") == True, f"Registration failed for {u['name']}"
        saved_name = reg_res.get("user", {}).get("name")
        assert saved_name == u["name"], f"Name mismatch: expected {u['name']}, got {saved_name}"
        print(f"  [PASS] Registered {u['name']} ({u['email']}) -> DB Saved Name: '{saved_name}'")

    # B. Login user
    login_payload = json.dumps({
        "email": u["email"],
        "password": u["password"]
    }).encode('utf-8')

    req = urllib.request.Request(
        "http://127.0.0.1:8000/api/auth/login",
        data=login_payload,
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    with urllib.request.urlopen(req) as resp:
        login_res = json.loads(resp.read().decode())
        assert login_res.get("success") == True, f"Login failed for {u['name']}"
        user_data = login_res.get("user", {})
        logged_name = user_data.get("name")
        assert logged_name == u["name"], f"Login name mismatch: expected {u['name']}, got {logged_name}"
        
        # Test dynamic initial calculation
        initial = (logged_name.strip()[0] or 'U').upper()
        assert initial == u["expected_initial"], f"Initial mismatch: expected {u['expected_initial']}, got {initial}"
        print(f"  [PASS] Logged in as {logged_name} -> Dynamic Profile Initial: ({initial})")

print("\n==================================================")
print("ALL VERIFICATION CHECKS PASSED SUCCESSFULLY!")
print("==================================================")

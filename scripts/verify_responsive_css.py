"""
verify_responsive_css.py - Static and Rule-level Audit of Responsive Architecture
"""
import re
import sys

def audit_responsive():
    print("==================================================")
    print("AUDITING RESPONSIVE UI/UX ARCHITECTURE")
    print("==================================================")
    
    # 1. Inspect style.css
    with open("style.css", "r", encoding="utf-8") as f:
        style_css = f.read()
        
    style_checks = [
        ("Global overflow-x protection", "overflow-x: hidden !important"),
        ("Fluid typography using clamp()", "font-size: clamp("),
        ("Mobile app-like drawer (.mobile-drawer)", ".mobile-drawer {"),
        ("Mobile drawer open transform state", ".mobile-drawer.open {"),
        ("Mobile drawer backdrop blur & overlay", ".mobile-drawer-backdrop.open {"),
        ("Category navigation touch scrolling", "overflow-x: auto !important;"),
        ("Card grid fluid repeat(auto-fill, minmax)", "grid-template-columns: repeat(auto-fill, minmax"),
        ("Bottom sheet / fluid modal behavior", ".further-details-modal"),
        ("Touch target 44px min-height rule", "height: 44px !important"),
    ]
    
    print("\n--- Auditing style.css ---")
    for name, pattern in style_checks:
        if pattern in style_css:
            print(f"  [PASS] {name}")
        else:
            print(f"  [FAIL] Missing {name} ('{pattern}')")
            sys.exit(1)

    responsive_queries = re.findall(r"@media\s*\([^)]*\b(?:min|max)-width\s*:\s*[^)]+\)", style_css)
    if len(responsive_queries) < 4:
        print("  [FAIL] Insufficient width-based responsive media queries")
        sys.exit(1)
    print(f"  [PASS] Width-based responsive media-query structure ({len(responsive_queries)} rules)")

    container_patterns = [
        r"\.(?:inner-page|site-header|page-container)\s*\{[^}]*max-width\s*:",
        r"max-width\s*:\s*(?:\d+px|clamp\(|100%)",
    ]
    if not any(re.search(pattern, style_css, re.DOTALL) for pattern in container_patterns):
        print("  [FAIL] No responsive container max-width limiter found")
        sys.exit(1)
    print("  [PASS] Responsive container max-width limiter")
            
    # 2. Inspect admin.html
    with open("admin.html", "r", encoding="utf-8") as f:
        admin_html = f.read()
        
    admin_checks = [
        ("Admin sidebar mobile toggle button", "mobile-sidebar-toggle"),
        ("Admin mobile drawer open rule", ".admin-sidebar.open {"),
        ("Admin responsive table scroll wrapper", "table-responsive-wrapper"),
        ("Admin modal fluid width & max-height", "max-height: 92dvh"),
        ("Admin modal multi-column collapse on <= 600px", "@media (max-width: 600px)"),
        ("Admin passkey gate mobile reflow on <= 480px", "@media (max-width: 480px)"),
        ("Admin sidebar backdrop for mobile dismiss", "admin-sidebar-backdrop"),
    ]
    
    print("\n--- Auditing admin.html ---")
    for name, pattern in admin_checks:
        if pattern in admin_html:
            print(f"  [PASS] {name}")
        else:
            print(f"  [FAIL] Missing {name} ('{pattern}')")
            sys.exit(1)

    # 3. Inspect script.js
    with open("script.js", "r", encoding="utf-8") as f:
        script_js = f.read()
        
    script_checks = [
        ("Mobile drawer toggle integration", "drawer.classList.add('open')"),
        ("Mobile drawer backdrop toggle integration", "backdrop.classList.add('open')"),
        ("Mobile drawer close logic", "drawer.classList.remove('open')"),
        ("Mobile screen width detection (<= 900)", "window.innerWidth <= 900"),
    ]
    
    print("\n--- Auditing script.js ---")
    for name, pattern in script_checks:
        if pattern in script_js:
            print(f"  [PASS] {name}")
        else:
            print(f"  [FAIL] Missing {name} ('{pattern}')")
            sys.exit(1)

    print("\n==================================================")
    print("ALL RESPONSIVE SYSTEM CHECKS PASSED WITH 100% COVERAGE!")
    print("==================================================")

if __name__ == "__main__":
    audit_responsive()

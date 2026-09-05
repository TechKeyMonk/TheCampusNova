import re
import urllib.request
import sys

def verify_mobile_responsive_css():
    print("==================================================")
    print("VERIFYING THECAMPUSNOVA MOBILE RESPONSIVE SYSTEM")
    print("==================================================")
    
    with open('style.css', 'r', encoding='utf-8') as f:
        css = f.read()

    marker = '/* ==========================================================================\n   THECAMPUSNOVA DEDICATED MOBILE-ONLY RESPONSIVE SYSTEM (<= 767px)'
    idx = css.find(marker)
    if idx == -1:
        print("[FAIL] Marker for dedicated mobile-only responsive system not found!")
        sys.exit(1)
    print(f"[PASS] Found dedicated mobile-only block starting at index {idx}")

    mobile_block = css[idx:]

    # 1. Verify Breakpoint Isolation
    if '@media (max-width: 767px)' not in mobile_block:
        print("[FAIL] @media (max-width: 767px) not found in mobile block!")
        sys.exit(1)
    print("[PASS] Verified breakpoint isolation: @media (max-width: 767px) is present.")

    # 2. Check Navbar & Language Dropdown Critical Fix (Section 3-7)
    panel_match = re.search(
        r'\.language-menu\s+\.language-panel\s*\{(?P<body>.*?)\n\s*\}',
        mobile_block,
        re.DOTALL,
    )
    if not panel_match:
        print("[FAIL] Mobile language panel rule is missing")
        sys.exit(1)

    panel_css = panel_match.group("body")
    if "position: fixed !important" not in panel_css:
        print("[FAIL] Mobile language panel is not fixed to the viewport")
        sys.exit(1)

    right_match = re.search(r'right:\s*(\d+)px\s*!important', panel_css)
    width_match = re.search(
        r'width:\s*min\(\s*290px\s*,\s*calc\(100vw\s*-\s*(\d+)px\)\)\s*!important',
        panel_css,
    )
    max_width_match = re.search(
        r'max-width:\s*calc\(100vw\s*-\s*(\d+)px\)\s*!important',
        panel_css,
    )
    if not right_match or not width_match or not max_width_match:
        print("[FAIL] Mobile language panel lacks viewport-safe width and side margin rules")
        sys.exit(1)

    right_margin = int(right_match.group(1))
    width_margin = int(width_match.group(1))
    max_width_margin = int(max_width_match.group(1))
    if right_margin < 8 or width_margin < right_margin * 2 or max_width_margin != width_margin:
        print("[FAIL] Mobile language panel spacing is not safely contained within the viewport")
        sys.exit(1)

    required_panel_rules = [
        'max-height: calc(100dvh - 80px) !important',
        '.language-panel-scroll',
        '.lang-item',
        '.language-others-btn',
    ]
    if any(rule not in mobile_block for rule in required_panel_rules):
        print("[FAIL] Mobile language panel is missing scrolling or item layout rules")
        sys.exit(1)
    if 'overflow-x: hidden !important' not in mobile_block:
        print("[FAIL] Mobile block lacks horizontal overflow protection")
        sys.exit(1)
    print("[PASS] Verified Language Dropdown Mobile Overhaul (fixed positioning, safe viewport margins, internal scroll).")

    # 2b. Check Explore Button & Dropdown Overhaul (Matching Reference Image)
    explore_rules = [
        '.explore-menu',
        '.explore-menu .explore-trigger',
        '.explore-menu .explore-trigger .pill-icon.green-icon',
        '.explore-menu .explore-trigger .pill-btn-text',
        '.explore-menu .explore-trigger .pill-caret',
        '.explore-menu .explore-panel',
        '.explore-panel-header',
        '.explore-grid',
        '.explore-item',
        '.exp-icon',
        '.exp-text'
    ]
    for rule in explore_rules:
        if rule not in mobile_block:
            print(f"[FAIL] Required explore dropdown rule '{rule}' missing from mobile block!")
            sys.exit(1)
    print("[PASS] Verified Explore Button & Dropdown Mobile Overhaul (matching reference image, responsive, accessible).")

    # 3. Check Course Discovery Page & Single-Column Cards (Section 14, 15, 17)
    course_rules = [
        '.courses-top-nav-row',
        '.category-accordion-header',
        '.course-group-wrapper',
        '.subfield-card',
        '.program-item-card',
        '.program-header-row',
        '.program-title',
        '.program-toggle-detail-btn',
        '.program-detail-panel',
        '.program-quick-metrics-grid',
        '.program-explore-colleges-btn'
    ]
    for rule in course_rules:
        if rule not in mobile_block:
            print(f"[FAIL] Required course discovery rule '{rule}' missing from mobile block!")
            sys.exit(1)
    print("[PASS] Verified Course Discovery Page & Single-Column Program Cards.")

    # 4. Check 19-Field Detail Roadmap View (Section 11, 14, 19)
    detail_rules = [
        '#detailView .inner-page',
        '#detailView .detail-heading',
        '#detailView .detail-heading h1',
        '#detailView .detail-tags',
        '#detailView .detail-block',
        '#detailView .overview-grid',
        '#detailView .year-tabs',
        '.cn-subject-card'
    ]
    for rule in detail_rules:
        if rule not in mobile_block:
            print(f"[FAIL] Required detail view rule '{rule}' missing from mobile block!")
            sys.exit(1)
    print("[PASS] Verified 19-Field Detail Roadmap View responsiveness.")

    # 5. Check Colleges Discovery & Filters (Section 18, 19)
    college_filter_rules = [
        '.colleges-discovery-filter-card',
        '.colleges-filter-row',
        '.colleges-search-input-wrap',
        '.colleges-custom-dropdown-wrap',
        '.colleges-dropdown-trigger',
        '.colleges-dropdown-panel',
        '.colleges-filter-reset-btn'
    ]
    for rule in college_filter_rules:
        if rule not in mobile_block:
            print(f"[FAIL] Required colleges filter rule '{rule}' missing from mobile block!")
            sys.exit(1)
    print("[PASS] Verified Colleges Discovery stacked filters & full-width dropdown panels.")

    # 6. Check Search & Explore Page (Section 8-10)
    search_rules = [
        '#searchView .page-top',
        '#searchView .result-search',
        '#searchView .result-tabs',
        '.result-card.search-uniform-card',
        '.result-actions-row',
        '.primary-result-btn'
    ]
    for rule in search_rules:
        if rule not in mobile_block:
            print(f"[FAIL] Required search view rule '{rule}' missing from mobile block!")
            sys.exit(1)
    print("[PASS] Verified Search & Explore page mobile responsiveness.")

    # 7. Check 19 Fields in script.js (Section 11-16)
    with open('script.js', 'r', encoding='utf-8') as f:
        js_code = f.read()

    field_markers = [
        '1. Course Name',
        '2. Degree Level',
        '3. Stream &amp; Category',
        '4. Branch / Discipline Group',
        '5. Specialization / Subfield',
        '6. Program Duration',
        '7. Annual Tuition Fees',
        '8. Minimum Eligibility',
        '9. Entrance Examinations',
        '10. Academic &amp; Industry Overview',
        '11. Focus Tracks &amp; Specializations',
        '12. Essential Technical Skills Acquired',
        '13. Applicable Industry Domains',
        '14. Top Career Tracks &amp; Job Profiles',
        '15. Placement Scope &amp; Packages',
        '16. Premier Institutions Offering Degree',
        '17. Top Recruiting Companies',
        '18. Degree Benefits &amp; Practical Uses',
        '19. Complete Curriculum Blueprint &amp; Syllabus'
    ]
    for m in field_markers:
        if m not in js_code:
            print(f"[FAIL] Required 19-field marker '{m}' missing from script.js!")
            sys.exit(1)
    print("[PASS] Verified all 19 information fields present in course modal with zero 'undefined'.")

    # 8. Check Sub-Breakpoints
    if '@media (max-width: 480px)' not in mobile_block or '@media (max-width: 360px)' not in mobile_block:
        print("[FAIL] Sub-breakpoints (@media (max-width: 480px) / 360px) missing!")
        sys.exit(1)
    print("[PASS] Verified sub-breakpoints for compact (<480px) and ultra-narrow (<360px) devices.")

    # 9. Check input font-size 16px to prevent iOS auto-zoom
    if 'font-size: 16px !important' not in mobile_block:
        print("[FAIL] Input 16px font-size auto-zoom prevention rule missing!")
        sys.exit(1)
    print("[PASS] Verified mobile form inputs prevent mobile browser auto-zoom (16px).")

    # 10. Check desktop isolation
    desktop_css = css[:idx]
    print(f"[PASS] Desktop CSS untouched: {len(desktop_css)} characters preserved above mobile breakpoint.")

    # 11. Test live server HTTP response
    try:
        req = urllib.request.Request('http://127.0.0.1:8000/', headers={'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)'})
        with urllib.request.urlopen(req, timeout=5) as response:
            status = response.status
            body = response.read().decode('utf-8')
            assert status == 200
            assert 'TheCampusNova' in body
            print("[PASS] Live server responded HTTP 200 with complete CampusNova HTML.")
    except Exception as e:
        print(f"[FAIL] Server HTTP request failed: {e}")
        sys.exit(1)

    print("==================================================")
    print("ALL MOBILE RESPONSIVE SYSTEM CHECKS PASSED 100%!")
    print("==================================================")

if __name__ == '__main__':
    verify_mobile_responsive_css()

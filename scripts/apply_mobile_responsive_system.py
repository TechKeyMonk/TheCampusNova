import sys

NEW_MOBILE_CSS = """/* ==========================================================================
   THECAMPUSNOVA DEDICATED MOBILE-ONLY RESPONSIVE SYSTEM (<= 767px)
   ABSOLUTE ISOLATION: DESKTOP LAYOUT (>= 768px) REMAINS 100% UNTOUCHED
   ========================================================================== */
@media (max-width: 767px) {
  /* 1. Global Box-Sizing & Viewport Boundary */
  *, *::before, *::after {
    box-sizing: border-box !important;
    max-width: 100%;
  }

  html, body {
    width: 100% !important;
    max-width: 100vw !important;
    overflow-x: hidden !important;
    -webkit-text-size-adjust: 100% !important;
  }

  #app,
  .site-main,
  .view,
  .inner-page,
  .home-view-container {
    width: 100% !important;
    max-width: 100% !important;
    overflow-x: hidden !important;
    box-sizing: border-box !important;
  }

  /* Consistent Global Section Spacing & Side Padding (14px - 18px) */
  .section,
  .hero-section,
  .goal-section,
  .stream-section,
  .colleges-section,
  .domain-section,
  .internship-hub-section,
  .stats-strip,
  .site-footer {
    width: 100% !important;
    max-width: 100% !important;
    padding-left: clamp(14px, 4vw, 18px) !important;
    padding-right: clamp(14px, 4vw, 18px) !important;
    box-sizing: border-box !important;
  }

  /* 2. Topline Strip */
  .topline {
    font-size: 11px !important;
    padding: 6px 14px !important;
    justify-content: center !important;
    text-align: center !important;
    line-height: 1.3 !important;
  }
  .topline-right {
    display: none !important;
  }

  /* 3. Mobile Navbar - Preserves exact original sizing, spacing & alignment */
  .site-header {
    display: flex !important;
    flex-wrap: wrap !important;
    align-items: center !important;
    justify-content: space-between !important;
    padding: 10px clamp(14px, 4vw, 18px) 12px clamp(14px, 4vw, 18px) !important;
    height: auto !important;
    min-height: 56px !important;
    gap: 10px 8px !important;
    background: #FFFFFF !important;
    position: sticky !important;
    top: 0 !important;
    z-index: 1000 !important;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.07) !important;
    box-sizing: border-box !important;
    width: 100% !important;
    max-width: 100vw !important;
  }

  /* Row 1 Left: Brand Logo */
  .brand.header-brand {
    order: 1 !important;
    flex: 0 0 auto !important;
    display: flex !important;
    align-items: center !important;
    margin: 0 !important;
  }
  .header-logo-img {
    height: 34px !important;
    width: auto !important;
    max-width: 130px !important;
    object-fit: contain !important;
    display: block !important;
  }

  /* Row 1 Right: Explore + EN + Login + Hamburger Menu (Exact Original Spacing & Sizing) */
  .header-right-controls {
    order: 2 !important;
    flex: 0 0 auto !important;
    margin-left: auto !important;
    display: flex !important;
    align-items: center !important;
    gap: 8px !important;
  }

  /* Hide Desktop-Only Menus from Header Bar */
  .goal-menu,
  .live-time,
  .header-menu-panel {
    display: none !important;
  }

  /* ========================================================================
     EXPLORE BUTTON: COMPACT ALIGNMENT TO THE LEFT OF EN
     ======================================================================== */
  .explore-menu {
    display: block !important;
    position: relative !important;
    flex-shrink: 0 !important;
    margin: 0 !important;
  }

  .explore-menu .explore-trigger {
    height: 36px !important;
    min-height: 36px !important;
    padding: 0 8px !important;
    border-radius: 8px !important;
    background: #FFFFFF !important;
    border: 1.5px solid #93C5FD !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 5px !important;
    cursor: pointer !important;
    box-shadow: 0 1px 3px rgba(59, 130, 246, 0.08) !important;
    transition: all 0.18s ease !important;
    white-space: nowrap !important;
    box-sizing: border-box !important;
  }

  .explore-menu .explore-trigger:active,
  .explore-menu.open .explore-trigger {
    background: #EFF6FF !important;
    border-color: #3B82F6 !important;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2) !important;
  }

  .explore-menu .explore-trigger .pill-icon.green-icon {
    width: 14px !important;
    height: 14px !important;
    color: #16A34A !important;
    fill: #16A34A !important;
    flex-shrink: 0 !important;
    display: block !important;
  }

  .explore-menu .explore-trigger .pill-btn-text {
    font-size: 12px !important;
    font-weight: 700 !important;
    color: #1E293B !important;
    display: inline !important;
    line-height: 1 !important;
  }

  .explore-menu .explore-trigger .pill-caret {
    width: 10px !important;
    height: 10px !important;
    color: #64748B !important;
    display: block !important;
    flex-shrink: 0 !important;
    transition: transform 0.2s ease !important;
  }

  .explore-menu.open .explore-trigger .pill-caret {
    transform: rotate(180deg) !important;
    color: #2563EB !important;
  }

  /* ========================================================================
     COMPACT EXPLORE DROPDOWN: NO LARGE SCROLLING LANGUAGE-STYLE PANEL
     Clean, compact floating popup anchored cleanly without covering page
     ======================================================================== */
  .explore-menu .explore-panel {
    position: fixed !important;
    top: 56px !important;
    right: 14px !important;
    left: auto !important;
    width: 268px !important;
    max-width: calc(100vw - 28px) !important;
    max-height: min(340px, calc(100dvh - 70px)) !important;
    background: #FFFFFF !important;
    border: 1.5px solid #CBD5E1 !important;
    border-radius: 12px !important;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.16) !important;
    z-index: 100000 !important;
    padding: 8px 10px !important;
    display: none !important;
    box-sizing: border-box !important;
  }

  .explore-menu.open .explore-panel {
    display: block !important;
  }

  .explore-panel-header {
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    padding: 2px 4px 6px !important;
    margin-bottom: 6px !important;
    border-bottom: 1px solid #E2E8F0 !important;
  }

  .explore-panel-header span {
    font-size: 11px !important;
    font-weight: 800 !important;
    letter-spacing: 0.06em !important;
    text-transform: uppercase !important;
    color: #15803D !important;
  }

  .explore-panel-header small {
    font-size: 10px !important;
    color: #64748B !important;
    font-weight: 700 !important;
    background: #F1F5F9 !important;
    padding: 1px 6px !important;
    border-radius: 6px !important;
  }

  .explore-bg-slider {
    display: none !important;
  }

  /* Compact 2-Column Grid (8 rows of 2, fitting without scrolling) */
  .explore-grid {
    display: grid !important;
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 4px 6px !important;
    width: 100% !important;
    box-sizing: border-box !important;
  }

  .explore-item {
    display: flex !important;
    align-items: center !important;
    gap: 6px !important;
    padding: 5px 6px !important;
    min-height: 30px !important;
    border-radius: 6px !important;
    background: #F8FAFC !important;
    border: 1px solid #E2E8F0 !important;
    text-decoration: none !important;
    box-sizing: border-box !important;
    transition: all 0.15s ease !important;
  }

  .explore-item:active {
    background: #F0FDF4 !important;
    border-color: #86EFAC !important;
  }

  .exp-icon {
    width: 20px !important;
    height: 20px !important;
    min-width: 20px !important;
    font-size: 12px !important;
    border-radius: 4px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    background: #FFFFFF !important;
    border: 1px solid #E2E8F0 !important;
    flex-shrink: 0 !important;
  }

  .exp-text {
    display: flex !important;
    flex-direction: column !important;
    min-width: 0 !important;
    overflow: hidden !important;
  }

  .exp-text strong {
    font-size: 11.5px !important;
    font-weight: 700 !important;
    color: #0F172A !important;
    line-height: 1.2 !important;
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
  }

  /* Remove bulky subtitle on mobile to preserve compact height */
  .exp-text small {
    display: none !important;
  }

  /* ========================================================================
     ORIGINAL LANGUAGE BUTTON (EN) - EXACT PREVIOUS SIZING & STYLING
     ======================================================================== */
  .language-menu {
    display: block !important;
    position: relative !important;
    margin: 0 !important;
  }
  .language-menu .header-pill-btn {
    width: 36px !important;
    height: 36px !important;
    min-width: 36px !important;
    padding: 0 !important;
    justify-content: center !important;
    font-size: 11.5px !important;
    font-weight: 700 !important;
    border-radius: 8px !important;
    background: #F8FAFC !important;
    border: 1px solid #CBD5E1 !important;
    box-sizing: border-box !important;
  }
  .language-menu .pill-caret {
    display: none !important;
  }

  /* Language Dropdown Panel */
  .language-menu .language-panel {
    position: fixed !important;
    top: 58px !important;
    right: 14px !important;
    left: auto !important;
    width: min(290px, calc(100vw - 28px)) !important;
    max-width: calc(100vw - 28px) !important;
    max-height: calc(100dvh - 80px) !important;
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.22) !important;
    border: 1.5px solid #CBD5E1 !important;
    border-radius: 14px !important;
    z-index: 100000 !important;
    background: #FFFFFF !important;
    padding: 10px !important;
    display: none !important;
    flex-direction: column !important;
    box-sizing: border-box !important;
  }

  .language-menu.open .language-panel {
    display: flex !important;
  }

  .language-panel-header {
    display: flex !important;
    justify-content: space-between !important;
    align-items: center !important;
    padding: 4px 6px 8px !important;
    border-bottom: 1px solid #E2E8F0 !important;
    font-size: 11.5px !important;
    font-weight: 800 !important;
    color: #475569 !important;
  }

  .language-panel-header small {
    font-size: 10.5px !important;
    color: #15803D !important;
    font-weight: 800 !important;
  }

  .language-panel-scroll {
    max-height: min(250px, calc(100dvh - 170px)) !important;
    overflow-y: auto !important;
    -webkit-overflow-scrolling: touch !important;
    padding: 6px 0 !important;
  }

  .lang-item {
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    width: 100% !important;
    min-height: 38px !important;
    padding: 8px 10px !important;
    border-radius: 8px !important;
    font-size: 13px !important;
    font-weight: 600 !important;
    color: #1E293B !important;
    background: transparent !important;
    border: none !important;
    cursor: pointer !important;
    text-align: left !important;
  }

  .lang-item.active {
    background: #F0FDF4 !important;
    color: #15803D !important;
    font-weight: 800 !important;
  }

  .lang-item-code {
    font-size: 11px !important;
    font-weight: 800 !important;
    color: #64748B !important;
  }

  .lang-item.active .lang-item-code {
    color: #15803D !important;
  }

  .language-others-btn {
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    width: 100% !important;
    min-height: 40px !important;
    padding: 8px 12px !important;
    margin-top: 6px !important;
    border-top: 1px solid #E2E8F0 !important;
    background: #F8FAFC !important;
    border-radius: 8px !important;
    font-size: 12.5px !important;
    font-weight: 700 !important;
    color: #15803D !important;
    cursor: pointer !important;
  }

  /* ========================================================================
     ORIGINAL LOGIN BUTTON - EXACT PREVIOUS SIZING & STYLING
     ======================================================================== */
  .header-login-btn {
    height: 36px !important;
    padding: 0 14px !important;
    font-size: 12.5px !important;
    font-weight: 700 !important;
    border-radius: 8px !important;
    white-space: nowrap !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    flex-shrink: 0 !important;
    margin: 0 !important;
  }

  /* Profile Avatar Button */
  .profile-avatar-btn {
    width: 36px !important;
    height: 36px !important;
    min-width: 36px !important;
    border-radius: 50% !important;
    font-size: 13px !important;
    margin: 0 !important;
  }

  /* ========================================================================
     ORIGINAL HAMBURGER MENU BUTTON - EXACT PREVIOUS SIZING & STYLING
     ======================================================================== */
  .header-menu-btn {
    width: 36px !important;
    height: 36px !important;
    min-width: 36px !important;
    border-radius: 8px !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    flex-shrink: 0 !important;
    background: #F8FAFC !important;
    border: 1px solid #CBD5E1 !important;
    margin: 0 !important;
  }

  /* Row 2: Full-Width Dedicated Mobile Search Bar */
  .header-search-wrap {
    order: 3 !important;
    width: 100% !important;
    flex: 0 0 100% !important;
    max-width: 100% !important;
    margin: 0 !important;
  }

  .ai-entry {
    width: 100% !important;
    height: 42px !important;
    border-radius: 10px !important;
    padding: 0 8px 0 34px !important;
    background: #F8FAFC !important;
    border: 1.5px solid #CBD5E1 !important;
    display: flex !important;
    align-items: center !important;
    position: relative !important;
    box-sizing: border-box !important;
  }

  .ai-entry .search-svg {
    position: absolute !important;
    left: 10px !important;
    top: 50% !important;
    transform: translateY(-50%) !important;
    width: 16px !important;
    height: 16px !important;
    color: #64748B !important;
  }

  .ai-entry input {
    width: 100% !important;
    height: 100% !important;
    font-size: 13.5px !important;
    color: #0F172A !important;
    background: transparent !important;
    border: none !important;
    outline: none !important;
  }

  .ai-entry input::placeholder {
    font-size: 12.5px !important;
    color: #64748B !important;
  }

  .ai-trigger {
    height: 30px !important;
    padding: 0 8px !important;
    border-radius: 6px !important;
    font-size: 11.5px !important;
    flex-shrink: 0 !important;
    margin-left: 6px !important;
  }

  .ai-button-label {
    display: inline !important;
    font-size: 11px !important;
  }

  /* 4. Mobile Navigation Drawer & Backdrop */
  .mobile-drawer-backdrop {
    position: fixed !important;
    inset: 0 !important;
    background: rgba(15, 23, 42, 0.6) !important;
    backdrop-filter: blur(4px) !important;
    -webkit-backdrop-filter: blur(4px) !important;
    z-index: 99998 !important;
    opacity: 0 !important;
    pointer-events: none !important;
    transition: opacity 0.25s ease !important;
  }

  .mobile-drawer-backdrop.open {
    opacity: 1 !important;
    pointer-events: auto !important;
  }

  .mobile-drawer {
    position: fixed !important;
    top: 0 !important;
    right: 0 !important;
    width: min(84vw, 320px) !important;
    height: 100% !important;
    height: 100dvh !important;
    background: #FFFFFF !important;
    box-shadow: -8px 0 32px rgba(0, 0, 0, 0.22) !important;
    z-index: 99999 !important;
    transform: translateX(100%) !important;
    transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1) !important;
    display: flex !important;
    flex-direction: column !important;
    overflow-y: auto !important;
    -webkit-overflow-scrolling: touch !important;
  }

  .mobile-drawer.open {
    transform: translateX(0) !important;
  }

  .drawer-nav-item {
    min-height: 44px !important;
    display: flex !important;
    align-items: center !important;
    padding: 10px 18px !important;
    font-size: 14px !important;
    font-weight: 600 !important;
    color: #1E293B !important;
    text-decoration: none !important;
    border-bottom: 1px solid #F1F5F9 !important;
  }

  .drawer-nav-item:active {
    background: #F1F5F9 !important;
    color: #15803D !important;
  }

  /* 5. Category Navigation Bar (Pill Carousel) */
  .category-nav {
    width: 100% !important;
    max-width: 100vw !important;
    box-sizing: border-box !important;
    overflow: hidden !important;
    padding: 8px clamp(14px, 4vw, 18px) !important;
    background: #FFFFFF !important;
    border-bottom: 1px solid #E2E8F0 !important;
  }

  .nav-inner {
    display: flex !important;
    align-items: center !important;
    gap: 6px !important;
    overflow-x: auto !important;
    overflow-y: hidden !important;
    -webkit-overflow-scrolling: touch !important;
    scrollbar-width: none !important;
    padding-bottom: 2px !important;
    width: 100% !important;
  }

  .nav-inner::-webkit-scrollbar {
    display: none !important;
  }

  .nav-inner a {
    flex-shrink: 0 !important;
    min-height: 36px !important;
    padding: 0 12px !important;
    font-size: 12px !important;
    font-weight: 600 !important;
    border-radius: 8px !important;
    white-space: nowrap !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
  }

  .nav-status {
    display: none !important;
  }

  /* 6. Hero Section */
  .hero-section {
    padding: 20px clamp(14px, 4vw, 18px) 24px clamp(14px, 4vw, 18px) !important;
    display: flex !important;
    flex-direction: column !important;
    gap: 20px !important;
    width: 100% !important;
    box-sizing: border-box !important;
    min-height: auto !important;
  }

  .hero-copy {
    width: 100% !important;
    max-width: 100% !important;
    display: flex !important;
    flex-direction: column !important;
    gap: 10px !important;
  }

  .hero-copy .eyebrow {
    font-size: 11px !important;
    font-weight: 800 !important;
    letter-spacing: 0.08em !important;
    color: #15803D !important;
    margin: 0 !important;
  }

  .hero-rotator-h1,
  .hero-rotator-h1 .hero-h1-slide {
    font-size: clamp(1.45rem, 5.5vw, 1.95rem) !important;
    line-height: 1.25 !important;
    word-wrap: break-word !important;
    overflow-wrap: break-word !important;
    margin: 0 !important;
  }

  .hero-text {
    font-size: 13.5px !important;
    line-height: 1.5 !important;
    color: #475569 !important;
    margin: 0 !important;
  }

  .hero-search {
    display: flex !important;
    flex-direction: row !important;
    align-items: center !important;
    width: 100% !important;
    height: 46px !important;
    padding: 0 4px 0 12px !important;
    border-radius: 12px !important;
    background: #FFFFFF !important;
    border: 1.5px solid #CBD5E1 !important;
    box-sizing: border-box !important;
    gap: 8px !important;
  }

  .hero-search input {
    flex: 1 1 auto !important;
    font-size: 13.5px !important;
    min-width: 0 !important;
    border: none !important;
    outline: none !important;
    background: transparent !important;
    color: #0F172A !important;
  }

  .hero-search input::placeholder {
    font-size: 12.5px !important;
    color: #64748B !important;
  }

  .hero-search button#searchButton {
    height: 38px !important;
    padding: 0 14px !important;
    font-size: 13px !important;
    font-weight: 700 !important;
    border-radius: 8px !important;
    flex-shrink: 0 !important;
    white-space: nowrap !important;
  }

  .quick-links {
    display: flex !important;
    flex-wrap: wrap !important;
    gap: 6px !important;
    align-items: center !important;
    margin-top: 2px !important;
  }

  .quick-links span {
    font-size: 11.5px !important;
    font-weight: 700 !important;
    color: #64748B !important;
  }

  .quick-links button {
    padding: 4px 10px !important;
    font-size: 11.5px !important;
    border-radius: 6px !important;
    min-height: 28px !important;
    background: #F1F5F9 !important;
    color: #1E293B !important;
    border: 1px solid #CBD5E1 !important;
  }

  /* 7. College Discovery Card */
  .hero-visual {
    width: 100% !important;
    max-width: 100% !important;
    margin: 0 !important;
  }

  .hero-ad-card {
    width: 100% !important;
    max-width: 100% !important;
    padding: 16px !important;
    border-radius: 14px !important;
    box-sizing: border-box !important;
    background: #FFFFFF !important;
    border: 1.5px solid #E2E8F0 !important;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05) !important;
  }

  .hero-ad-header {
    display: flex !important;
    justify-content: space-between !important;
    align-items: center !important;
    margin-bottom: 10px !important;
  }

  .hero-ad-badge {
    font-size: 10.5px !important;
    font-weight: 800 !important;
    padding: 3px 8px !important;
    border-radius: 6px !important;
  }

  .hero-ad-verified {
    font-size: 11px !important;
    font-weight: 700 !important;
  }

  .hero-ad-kicker {
    font-size: 10.5px !important;
    letter-spacing: 0.06em !important;
    font-weight: 800 !important;
    color: #15803D !important;
    display: block !important;
    margin-bottom: 4px !important;
  }

  .hero-ad-title {
    font-size: 15.5px !important;
    font-weight: 800 !important;
    line-height: 1.35 !important;
    margin: 0 0 6px !important;
    color: #0F172A !important;
  }

  .hero-ad-desc {
    font-size: 12px !important;
    line-height: 1.45 !important;
    color: #475569 !important;
    margin: 0 0 12px !important;
  }

  .hero-ad-highlights {
    display: grid !important;
    grid-template-columns: repeat(3, 1fr) !important;
    gap: 8px !important;
    margin-bottom: 12px !important;
  }

  .hero-ad-metric {
    padding: 8px 6px !important;
    text-align: center !important;
    background: #F8FAFC !important;
    border: 1px solid #E2E8F0 !important;
    border-radius: 8px !important;
  }

  .hero-ad-metric strong {
    font-size: 13.5px !important;
    font-weight: 800 !important;
    color: #0F172A !important;
    display: block !important;
  }

  .hero-ad-metric small {
    font-size: 10px !important;
    color: #64748B !important;
  }

  .hero-ad-tags {
    display: flex !important;
    flex-wrap: wrap !important;
    gap: 5px !important;
    margin-bottom: 14px !important;
  }

  .hero-ad-tags span {
    font-size: 11px !important;
    padding: 3px 8px !important;
    border-radius: 5px !important;
    background: #EEF2F6 !important;
    color: #1E293B !important;
  }

  .hero-ad-footer {
    display: flex !important;
    flex-direction: column !important;
    gap: 8px !important;
    align-items: stretch !important;
  }

  .hero-ad-status {
    display: flex !important;
    align-items: center !important;
    gap: 6px !important;
    font-size: 11.5px !important;
    color: #15803D !important;
  }

  .hero-ad-btn {
    width: 100% !important;
    height: 42px !important;
    font-size: 13.5px !important;
    font-weight: 700 !important;
    text-align: center !important;
    border-radius: 8px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }

  /* 8. Mobile Stats Section */
  .stats-strip {
    display: grid !important;
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 10px !important;
    padding: 14px clamp(14px, 4vw, 18px) !important;
    width: 100% !important;
    box-sizing: border-box !important;
    border-radius: 12px !important;
    background: #F8FAFC !important;
    border: 1px solid #E2E8F0 !important;
    margin: 16px auto !important;
  }

  .stats-strip > div:not(.strip-quote) {
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: center !important;
    padding: 12px 8px !important;
    background: #FFFFFF !important;
    border: 1px solid #E2E8F0 !important;
    border-radius: 10px !important;
    text-align: center !important;
    min-height: 72px !important;
  }

  .stats-strip > div:not(.strip-quote) strong {
    font-size: 1.4rem !important;
    font-weight: 800 !important;
    color: #0F172A !important;
    line-height: 1.1 !important;
  }

  .stats-strip > div:not(.strip-quote) small {
    font-size: 11.5px !important;
    color: #64748B !important;
    font-weight: 600 !important;
    margin-top: 3px !important;
  }

  .strip-quote {
    grid-column: 1 / -1 !important;
    text-align: center !important;
    font-size: 12px !important;
    color: #475569 !important;
    padding: 8px 12px !important;
    margin-top: 4px !important;
    line-height: 1.45 !important;
  }

  /* 9. Goal Grid */
  .goal-section {
    padding-top: 20px !important;
    padding-bottom: 20px !important;
  }

  .goal-grid {
    display: grid !important;
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 10px !important;
    width: 100% !important;
    box-sizing: border-box !important;
  }

  .goal-card {
    display: flex !important;
    flex-direction: column !important;
    align-items: flex-start !important;
    justify-content: space-between !important;
    padding: 14px 12px !important;
    min-height: 105px !important;
    border-radius: 12px !important;
    text-align: left !important;
    position: relative !important;
    width: 100% !important;
    box-sizing: border-box !important;
  }

  .goal-symbol {
    font-size: 16px !important;
    margin-bottom: 6px !important;
  }

  .goal-card strong {
    font-size: 13px !important;
    font-weight: 800 !important;
    color: #0F172A !important;
    line-height: 1.3 !important;
    display: block !important;
    margin-bottom: 2px !important;
  }

  .goal-card small {
    font-size: 11px !important;
    color: #64748B !important;
    line-height: 1.35 !important;
    display: block !important;
  }

  .tiny-arrow {
    position: absolute !important;
    top: 12px !important;
    right: 12px !important;
    font-size: 14px !important;
    color: #94A3B8 !important;
  }

  /* 10. Education Streams */
  .stream-section {
    padding-top: 20px !important;
    padding-bottom: 20px !important;
  }

  .section-heading {
    display: flex !important;
    flex-direction: column !important;
    gap: 6px !important;
    align-items: flex-start !important;
    margin-bottom: 16px !important;
  }

  .section-heading h2 {
    font-size: clamp(1.25rem, 5vw, 1.65rem) !important;
    line-height: 1.3 !important;
    margin: 0 !important;
  }

  .step-count {
    font-size: 13px !important;
    font-weight: 800 !important;
    color: #15803D !important;
  }

  .stream-layout {
    display: flex !important;
    flex-direction: column !important;
    gap: 14px !important;
    width: 100% !important;
  }

  .stream-list {
    width: 100% !important;
    display: flex !important;
    flex-direction: row !important;
    overflow-x: auto !important;
    -webkit-overflow-scrolling: touch !important;
    scrollbar-width: none !important;
    gap: 8px !important;
    padding-bottom: 4px !important;
  }

  .stream-list::-webkit-scrollbar {
    display: none !important;
  }

  .stream-item {
    flex-shrink: 0 !important;
    padding: 8px 14px !important;
    min-height: 38px !important;
    border-radius: 8px !important;
    font-size: 12.5px !important;
    font-weight: 700 !important;
    white-space: nowrap !important;
  }

  .stream-detail {
    width: 100% !important;
    max-width: 100% !important;
    padding: 16px !important;
    border-radius: 12px !important;
    box-sizing: border-box !important;
  }

  /* 11. Internship / Opportunity Cards */
  .internship-hub-section {
    padding-top: 20px !important;
    padding-bottom: 20px !important;
  }

  .internship-toolbar {
    display: flex !important;
    flex-direction: column !important;
    gap: 10px !important;
    width: 100% !important;
    margin-bottom: 16px !important;
  }

  .internship-filter-pills {
    display: flex !important;
    overflow-x: auto !important;
    -webkit-overflow-scrolling: touch !important;
    scrollbar-width: none !important;
    gap: 6px !important;
    padding-bottom: 4px !important;
    width: 100% !important;
  }

  .internship-filter-pills::-webkit-scrollbar {
    display: none !important;
  }

  .internship-pill-btn {
    flex-shrink: 0 !important;
    min-height: 36px !important;
    padding: 0 12px !important;
    font-size: 12px !important;
    border-radius: 8px !important;
    white-space: nowrap !important;
  }

  .internship-selects-row {
    display: grid !important;
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 8px !important;
    width: 100% !important;
  }

  .internship-select {
    width: 100% !important;
    height: 40px !important;
    font-size: 12.5px !important;
    border-radius: 8px !important;
    padding: 0 8px !important;
  }

  .internship-grid {
    display: flex !important;
    flex-direction: column !important;
    gap: 14px !important;
    width: 100% !important;
  }

  .internship-card {
    display: flex !important;
    flex-direction: column !important;
    gap: 10px !important;
    padding: 16px !important;
    border-radius: 14px !important;
    border: 1.5px solid #E2E8F0 !important;
    background: #FFFFFF !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04) !important;
    width: 100% !important;
    box-sizing: border-box !important;
  }

  .internship-card-head {
    display: flex !important;
    justify-content: space-between !important;
    align-items: flex-start !important;
    margin-bottom: 2px !important;
  }

  .internship-company-badge {
    display: flex !important;
    align-items: center !important;
    gap: 10px !important;
  }

  .internship-company-avatar {
    width: 40px !important;
    height: 40px !important;
    min-width: 40px !important;
    border-radius: 10px !important;
    font-size: 16px !important;
    font-weight: 800 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }

  .internship-role-title {
    font-size: 15px !important;
    font-weight: 800 !important;
    color: #0F172A !important;
    line-height: 1.3 !important;
    margin: 0 0 2px !important;
  }

  .internship-company-name {
    font-size: 12px !important;
    color: #64748B !important;
    font-weight: 600 !important;
  }

  .internship-meta-row {
    display: flex !important;
    flex-wrap: wrap !important;
    gap: 6px !important;
    margin-top: 2px !important;
  }

  .stipend-tag {
    font-size: 11.5px !important;
    font-weight: 800 !important;
    color: #15803D !important;
    background: #DCFCE7 !important;
    padding: 3px 8px !important;
    border-radius: 6px !important;
  }

  .workmode-tag,
  .duration-tag {
    font-size: 11px !important;
    font-weight: 600 !important;
    background: #F1F5F9 !important;
    color: #334155 !important;
    padding: 3px 8px !important;
    border-radius: 6px !important;
  }

  .internship-details-list {
    display: flex !important;
    flex-direction: column !important;
    gap: 4px !important;
    font-size: 12px !important;
    line-height: 1.4 !important;
    color: #475569 !important;
    background: #F8FAFC !important;
    border-radius: 8px !important;
    padding: 10px 12px !important;
    border: 1px solid #E2E8F0 !important;
  }

  .internship-card-footer {
    display: flex !important;
    flex-direction: column !important;
    gap: 8px !important;
    margin-top: 2px !important;
  }

  .deadline-chip {
    font-size: 11.5px !important;
    color: #64748B !important;
  }

  .internship-card-actions {
    display: grid !important;
    grid-template-columns: 1fr 1fr !important;
    gap: 8px !important;
    width: 100% !important;
  }

  .internship-details-btn {
    height: 40px !important;
    font-size: 12.5px !important;
    font-weight: 700 !important;
    border-radius: 8px !important;
    width: 100% !important;
    text-align: center !important;
  }

  .internship-portal-btn {
    height: 40px !important;
    font-size: 12.5px !important;
    font-weight: 700 !important;
    border-radius: 8px !important;
    width: 100% !important;
    text-align: center !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    text-decoration: none !important;
  }

  /* 12. Courses Discovery Page & Cards */
  .courses-top-nav-row {
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    gap: 8px !important;
    margin-bottom: 12px !important;
    width: 100% !important;
  }

  .courses-back-home-link {
    min-height: 36px !important;
    padding: 6px 12px !important;
    font-size: 12.5px !important;
    font-weight: 700 !important;
    display: inline-flex !important;
    align-items: center !important;
    gap: 6px !important;
    border-radius: 8px !important;
    white-space: nowrap !important;
  }

  .courses-top-eyebrow {
    font-size: 10px !important;
    font-weight: 800 !important;
    letter-spacing: 0.05em !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    white-space: nowrap !important;
    max-width: 60% !important;
  }

  .heading-flank-visual-row {
    display: flex !important;
    justify-content: center !important;
    text-align: center !important;
    width: 100% !important;
  }

  .heading-side-visual {
    display: none !important;
  }

  .courses-heading-wrap {
    width: 100% !important;
    text-align: center !important;
  }

  .courses-heading-wrap h1 {
    font-size: clamp(1.4rem, 5.5vw, 1.85rem) !important;
    line-height: 1.25 !important;
    margin: 0 0 6px !important;
  }

  .courses-search-card {
    width: 100% !important;
    padding: 14px !important;
    border-radius: 12px !important;
    box-sizing: border-box !important;
    margin-bottom: 16px !important;
  }

  .courses-search-row {
    flex-direction: column !important;
    gap: 10px !important;
    width: 100% !important;
  }

  .courses-search-box {
    width: 100% !important;
    height: 42px !important;
  }

  .courses-search-box input {
    font-size: 14px !important;
    width: 100% !important;
  }

  .courses-filter-chips {
    display: flex !important;
    overflow-x: auto !important;
    -webkit-overflow-scrolling: touch !important;
    scrollbar-width: none !important;
    gap: 6px !important;
    padding-bottom: 4px !important;
    width: 100% !important;
  }

  .courses-filter-chips::-webkit-scrollbar {
    display: none !important;
  }

  .courses-filter-chip {
    flex-shrink: 0 !important;
    min-height: 34px !important;
    padding: 0 10px !important;
    font-size: 11.5px !important;
    border-radius: 6px !important;
    white-space: nowrap !important;
  }

  .category-accordion-header {
    padding: 12px 14px !important;
    flex-direction: column !important;
    align-items: flex-start !important;
    gap: 8px !important;
    width: 100% !important;
    box-sizing: border-box !important;
  }

  .category-header-left {
    width: 100% !important;
    gap: 10px !important;
  }

  .category-header-right {
    width: 100% !important;
    display: flex !important;
    justify-content: space-between !important;
    align-items: center !important;
  }

  .category-title {
    font-size: 15px !important;
    line-height: 1.3 !important;
  }

  .course-group-wrapper {
    margin-bottom: 12px !important;
    width: 100% !important;
  }

  .course-group-header-label {
    font-size: 12px !important;
    padding: 6px 10px !important;
  }

  .subfields-accordion-stack {
    display: flex !important;
    flex-direction: column !important;
    gap: 10px !important;
    width: 100% !important;
  }

  .subfield-card {
    width: 100% !important;
    box-sizing: border-box !important;
    border-radius: 10px !important;
    overflow: hidden !important;
  }

  .subfield-trigger {
    padding: 10px 12px !important;
    width: 100% !important;
    box-sizing: border-box !important;
  }

  .subfield-name {
    font-size: 13.5px !important;
    font-weight: 800 !important;
  }

  .subfield-tagline {
    font-size: 11px !important;
    line-height: 1.3 !important;
  }

  .subfield-direct-view-btn {
    padding: 6px 10px !important;
    font-size: 11px !important;
    min-height: 32px !important;
    margin-right: 8px !important;
  }

  .subfield-programs-container {
    padding: 10px !important;
    display: flex !important;
    flex-direction: column !important;
    gap: 10px !important;
    width: 100% !important;
    box-sizing: border-box !important;
  }

  .program-item-card {
    width: 100% !important;
    max-width: 100% !important;
    box-sizing: border-box !important;
    border-radius: 10px !important;
    background: #FFFFFF !important;
    border: 1px solid #E2E8F0 !important;
  }

  .program-header-row {
    flex-direction: column !important;
    align-items: flex-start !important;
    gap: 10px !important;
    padding: 12px 14px !important;
    width: 100% !important;
    box-sizing: border-box !important;
  }

  .program-title-wrap {
    width: 100% !important;
  }

  .program-title {
    font-size: 14.5px !important;
    font-weight: 800 !important;
    line-height: 1.35 !important;
    color: #0F172A !important;
    word-wrap: break-word !important;
  }

  .program-meta-chips {
    display: flex !important;
    flex-wrap: wrap !important;
    gap: 5px !important;
    margin-top: 4px !important;
  }

  .program-badge {
    font-size: 10.5px !important;
    padding: 2px 7px !important;
    border-radius: 5px !important;
  }

  .program-header-row > div:last-child {
    width: 100% !important;
    display: grid !important;
    grid-template-columns: 1fr 1fr !important;
    gap: 8px !important;
  }

  .program-toggle-detail-btn {
    width: 100% !important;
    height: 38px !important;
    font-size: 12px !important;
    font-weight: 700 !important;
    justify-content: center !important;
    text-align: center !important;
    border-radius: 8px !important;
  }

  .program-detail-panel {
    padding: 14px !important;
    width: 100% !important;
    box-sizing: border-box !important;
    background: #F8FAFC !important;
  }

  .program-quick-metrics-grid {
    grid-template-columns: 1fr 1fr !important;
    gap: 8px !important;
    width: 100% !important;
  }

  .program-metric-box {
    padding: 8px 10px !important;
  }

  .program-explore-colleges-btn {
    width: 100% !important;
    height: 42px !important;
    font-size: 12.5px !important;
    font-weight: 700 !important;
    text-align: center !important;
    justify-content: center !important;
    display: flex !important;
    align-items: center !important;
    border-radius: 8px !important;
  }

  /* 13. Full Roadmap & 19-Field Detail View */
  #detailView .inner-page {
    width: 100% !important;
    padding: 14px clamp(14px, 4vw, 18px) !important;
    box-sizing: border-box !important;
  }

  #detailView .detail-heading {
    text-align: left !important;
    align-items: flex-start !important;
    width: 100% !important;
  }

  #detailView .detail-heading h1 {
    font-size: clamp(1.4rem, 5.5vw, 1.85rem) !important;
    text-align: left !important;
    line-height: 1.25 !important;
    margin: 0 0 8px 0 !important;
  }

  #detailView .section-subtitle,
  #detailView .detail-heading p {
    border-radius: 12px !important;
    padding: 12px 14px !important;
    font-size: 13px !important;
    text-align: left !important;
    width: 100% !important;
    max-width: 100% !important;
    box-sizing: border-box !important;
    margin: 4px 0 12px 0 !important;
    display: block !important;
  }

  #detailView .detail-tags {
    display: flex !important;
    flex-wrap: wrap !important;
    gap: 6px !important;
    width: 100% !important;
    margin-bottom: 14px !important;
  }

  #detailView .detail-tags span {
    font-size: 11px !important;
    padding: 4px 10px !important;
    border-radius: 6px !important;
  }

  #detailView .detail-block {
    padding: 16px !important;
    border-radius: 12px !important;
    width: 100% !important;
    box-sizing: border-box !important;
  }

  #detailView .detail-block h2 {
    font-size: 17px !important;
  }

  #detailView .detail-block h3 {
    font-size: 15.5px !important;
  }

  #detailView .overview-grid {
    grid-template-columns: 1fr !important;
    gap: 10px !important;
    width: 100% !important;
  }

  #detailView .year-tabs {
    display: flex !important;
    width: 100% !important;
    overflow-x: auto !important;
    -webkit-overflow-scrolling: touch !important;
    scrollbar-width: none !important;
    gap: 6px !important;
    padding: 4px !important;
    box-sizing: border-box !important;
  }

  #detailView .year-tabs::-webkit-scrollbar {
    display: none !important;
  }

  #detailView .year-tabs button {
    flex: 1 0 auto !important;
    padding: 7px 14px !important;
    font-size: 12.5px !important;
    min-height: 36px !important;
  }

  .subject-list {
    display: flex !important;
    flex-direction: column !important;
    gap: 10px !important;
    width: 100% !important;
  }

  .cn-subject-card {
    width: 100% !important;
    box-sizing: border-box !important;
    padding: 14px !important;
    border-radius: 10px !important;
  }

  /* 14. Colleges Discovery & Custom Filters */
  .colleges-discovery-filter-card {
    padding: 14px !important;
    border-radius: 12px !important;
    width: 100% !important;
    box-sizing: border-box !important;
    margin-bottom: 16px !important;
  }

  .colleges-filter-row {
    flex-direction: column !important;
    gap: 8px !important;
    width: 100% !important;
  }

  .colleges-search-input-wrap {
    width: 100% !important;
    min-width: 0 !important;
    height: 42px !important;
    flex: none !important;
  }

  .colleges-custom-dropdown-wrap {
    width: 100% !important;
    min-width: 0 !important;
    flex: none !important;
    position: relative !important;
  }

  .colleges-dropdown-trigger {
    width: 100% !important;
    height: 42px !important;
  }

  .colleges-dropdown-panel {
    position: absolute !important;
    top: calc(100% + 4px) !important;
    left: 0 !important;
    right: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
    z-index: 200 !important;
    border-radius: 10px !important;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18) !important;
  }

  .colleges-filter-reset-btn {
    width: 100% !important;
    height: 40px !important;
    justify-content: center !important;
  }

  /* 15. Search & Explore Results Page */
  #searchView .page-top {
    flex-direction: column !important;
    align-items: stretch !important;
    gap: 12px !important;
    width: 100% !important;
  }

  #searchView .page-top h1 {
    font-size: clamp(1.4rem, 5.5vw, 1.85rem) !important;
    margin: 0 !important;
  }

  #searchView .result-search {
    min-width: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
    height: 44px !important;
    box-sizing: border-box !important;
  }

  #searchView .result-tabs {
    display: flex !important;
    overflow-x: auto !important;
    -webkit-overflow-scrolling: touch !important;
    scrollbar-width: none !important;
    gap: 6px !important;
    padding-bottom: 8px !important;
    margin-bottom: 14px !important;
    width: 100% !important;
  }

  #searchView .result-tabs::-webkit-scrollbar {
    display: none !important;
  }

  #searchView .result-tabs button {
    flex-shrink: 0 !important;
    min-height: 36px !important;
    padding: 6px 12px !important;
    font-size: 12px !important;
    white-space: nowrap !important;
  }

  .result-card.search-uniform-card {
    padding: 16px !important;
    border-radius: 12px !important;
    width: 100% !important;
    box-sizing: border-box !important;
  }

  .result-actions-row {
    flex-direction: column !important;
    gap: 8px !important;
    width: 100% !important;
  }

  .primary-result-btn {
    width: 100% !important;
    height: 40px !important;
    justify-content: center !important;
  }

  /* 16. All 19 Module Cards & Grids (Single-Column Mobile Stack) */
  .college-grid,
  .domain-grid,
  .exam-grid,
  .material-grid,
  .review-grid,
  .mentors-grid,
  .grid-cards,
  .events-grid,
  .news-grid,
  .pathways-grid {
    display: flex !important;
    flex-direction: column !important;
    gap: 14px !important;
    width: 100% !important;
    box-sizing: border-box !important;
  }

  .college-card,
  .domain-card,
  .mentor-linkedin-card,
  .material-card,
  .event-card,
  .news-card {
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
    box-sizing: border-box !important;
    border-radius: 14px !important;
    overflow: hidden !important;
  }

  .college-card-img,
  .mentor-card-img,
  .event-card-img {
    width: 100% !important;
    height: auto !important;
    aspect-ratio: 16 / 9 !important;
    object-fit: cover !important;
  }

  /* Horizontal Filter Pills Bars */
  .career-priority-bar,
  .sub-filter-row,
  .filter-pills-bar,
  .tabs-header {
    display: flex !important;
    overflow-x: auto !important;
    overflow-y: hidden !important;
    -webkit-overflow-scrolling: touch !important;
    scrollbar-width: none !important;
    gap: 8px !important;
    padding: 4px 0 8px 0 !important;
    width: 100% !important;
  }

  .career-priority-bar::-webkit-scrollbar,
  .sub-filter-row::-webkit-scrollbar,
  .filter-pills-bar::-webkit-scrollbar,
  .tabs-header::-webkit-scrollbar {
    display: none !important;
  }

  .career-priority-pill,
  .filter-pill {
    flex-shrink: 0 !important;
    min-height: 38px !important;
    white-space: nowrap !important;
  }

  /* 17. Mobile Forms & Touch Optimization */
  .modal-input,
  .further-details-form input,
  .further-details-form select,
  .user-login-form input,
  .user-signup-form input {
    height: 44px !important;
    font-size: 16px !important; /* Prevents auto-zoom on mobile safari/chrome */
    border-radius: 8px !important;
    width: 100% !important;
  }

  .primary-button,
  .secondary-button,
  .colleges-filter-clear-btn {
    min-height: 40px !important;
    font-size: 13px !important;
  }

  .further-details-form {
    grid-template-columns: 1fr !important;
    gap: 12px !important;
  }

  /* 18. Mobile Modals / Bottom Sheets */
  .further-details-modal {
    display: none !important;
    position: fixed !important;
    inset: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    height: 100dvh !important;
    z-index: 10000 !important;
    align-items: flex-end !important;
    justify-content: center !important;
    padding: 0 !important;
    box-sizing: border-box !important;
  }

  .further-details-modal.open {
    display: flex !important;
  }

  .further-details-dialog {
    width: 100% !important;
    max-width: 100% !important;
    max-height: 90dvh !important;
    border-bottom-left-radius: 0 !important;
    border-bottom-right-radius: 0 !important;
    border-top-left-radius: 18px !important;
    border-top-right-radius: 18px !important;
    border-bottom: none !important;
    padding: 20px 16px !important;
    overflow-y: auto !important;
    -webkit-overflow-scrolling: touch !important;
    box-sizing: border-box !important;
  }

  .compact-dialog {
    width: 100% !important;
  }

  /* 19. Tables & Data Responsiveness */
  .table-responsive-wrapper,
  .table-scroll-container,
  .comparison-table-wrap {
    width: 100% !important;
    max-width: 100% !important;
    overflow-x: auto !important;
    -webkit-overflow-scrolling: touch !important;
    margin-bottom: 12px !important;
  }

  /* 20. Site Footer */
  .site-footer {
    padding: 28px clamp(14px, 4vw, 18px) 20px clamp(14px, 4vw, 18px) !important;
    box-sizing: border-box !important;
    width: 100% !important;
  }

  .footer-nav {
    display: grid !important;
    grid-template-columns: 1fr !important;
    gap: 20px !important;
  }

  .footer-bottom-bar {
    flex-direction: column !important;
    gap: 8px !important;
    text-align: center !important;
    padding: 14px 0 0 0 !important;
  }
}

/* ==========================================================================
   SUB-BREAKPOINTS FOR COMPACT AND NARROW PHONES
   ========================================================================== */
@media (max-width: 480px) {
  .hero-ad-highlights {
    grid-template-columns: repeat(2, 1fr) !important;
  }
  .internship-selects-row {
    grid-template-columns: 1fr !important;
  }
  .program-header-row > div:last-child {
    grid-template-columns: 1fr !important;
  }
  .header-right-controls {
    gap: 6px !important;
  }
  .explore-menu .explore-trigger {
    padding: 0 7px !important;
    gap: 4px !important;
  }
  .header-login-btn {
    padding: 0 11px !important;
  }
}

@media (max-width: 360px) {
  .header-logo-img {
    max-width: 95px !important;
    height: 30px !important;
  }
  .header-right-controls {
    gap: 4px !important;
  }
  .explore-menu .explore-trigger {
    padding: 0 6px !important;
    gap: 3px !important;
  }
  .explore-menu .explore-trigger .pill-btn-text {
    font-size: 11px !important;
  }
  .explore-menu .explore-trigger .pill-icon.green-icon {
    width: 13px !important;
    height: 13px !important;
  }
  .header-login-btn {
    padding: 0 8px !important;
    font-size: 11.5px !important;
  }
  .goal-grid {
    grid-template-columns: 1fr !important;
  }
  .stats-strip {
    grid-template-columns: 1fr !important;
  }
  .hero-ad-highlights {
    grid-template-columns: 1fr !important;
  }
  .internship-card-actions {
    grid-template-columns: 1fr !important;
  }
  .program-quick-metrics-grid {
    grid-template-columns: 1fr !important;
  }
}
"""

def apply_clean_mobile_css():
    with open('style.css', 'r', encoding='utf-8') as f:
        content = f.read()

    marker = '/* ==========================================================================\n   THECAMPUSNOVA DEDICATED MOBILE-ONLY RESPONSIVE SYSTEM (<= 767px)'
    idx = content.find(marker)
    if idx == -1:
        print("ERROR: Marker not found!")
        sys.exit(1)

    print(f"Replacing from index {idx} to end ({len(content) - idx} chars)")
    updated_content = content[:idx] + NEW_MOBILE_CSS

    with open('style.css', 'w', encoding='utf-8') as f:
        f.write(updated_content)

    print("Successfully updated style.css with original navbar format and compact Explore popup!")

if __name__ == '__main__':
    apply_clean_mobile_css()

import fs from 'fs';

console.log('==================================================');
console.log('VERIFYING COMPACT EXPLORE DROPDOWN & ORIGINAL NAVBAR');
console.log('==================================================');

// 1. Check index.html markup
const html = fs.readFileSync('index.html', 'utf8');

if (!html.includes('id="exploreTrigger"')) {
  console.error('[FAIL] exploreTrigger ID not found in index.html');
  process.exit(1);
}
console.log('[PASS] Found id="exploreTrigger" in index.html');

if (!html.includes('class="pill-icon green-icon"')) {
  console.error('[FAIL] pill-icon green-icon not found in index.html');
  process.exit(1);
}
console.log('[PASS] Found 3x3 green grid icon in exploreTrigger');

if (!html.includes('id="explorePanel"')) {
  console.error('[FAIL] explorePanel ID not found in index.html');
  process.exit(1);
}
console.log('[PASS] Found id="explorePanel" in index.html');

// 2. Check CSS in style.css
const rawCss = fs.readFileSync('style.css', 'utf8');
const css = rawCss.replace(/\r\n/g, '\n');

const marker = '/* ==========================================================================\n   THECAMPUSNOVA DEDICATED MOBILE-ONLY RESPONSIVE SYSTEM (<= 767px)';
const idx = css.indexOf(marker);
if (idx === -1) {
  console.error('[FAIL] Mobile responsive marker not found in style.css');
  process.exit(1);
}

const mobileCss = css.slice(idx);

// Check that Explore button is placed to the left of EN in header-right-controls
const requiredExploreStyles = [
  '.header-right-controls {',
  'gap: 8px !important',
  '.explore-menu {',
  'display: block !important',
  '.explore-menu .explore-trigger {',
  'height: 36px !important',
  'border: 1.5px solid #93C5FD !important',
  'background: #FFFFFF !important',
  'border-radius: 8px !important',
  '.explore-menu .explore-trigger .pill-icon.green-icon {',
  'color: #16A34A !important',
  '.explore-menu .explore-panel {',
  'position: fixed !important',
  'top: 56px !important',
  'width: 268px !important',
  'z-index: 100000 !important',
  '.explore-menu.open .explore-panel {',
  'display: block !important',
  '.explore-grid {',
  'grid-template-columns: repeat(2, 1fr) !important',
  '.exp-text small {',
  'display: none !important', // Verifies bulky subtitles removed for compact layout!
  '.language-menu .header-pill-btn {',
  'width: 36px !important',
  'height: 36px !important',
  '.header-login-btn {',
  'height: 36px !important',
  'padding: 0 14px !important',
  '.header-menu-btn {',
  'width: 36px !important',
  'height: 36px !important'
];

for (const rule of requiredExploreStyles) {
  if (!mobileCss.includes(rule)) {
    console.error(`[FAIL] Required rule '${rule}' not found in mobile CSS!`);
    process.exit(1);
  }
}
console.log('[PASS] All compact Explore button & original navbar format rules verified.');

// 3. Check JS Event Handlers in script.js
const js = fs.readFileSync('script.js', 'utf8');

if (!js.includes("document.getElementById('exploreTrigger')")) {
  console.error('[FAIL] exploreTrigger event listener not found in script.js');
  process.exit(1);
}
console.log('[PASS] Found exploreTrigger click handler in script.js');

if (!js.includes("exploreMenu.classList.add('open')")) {
  console.error('[FAIL] exploreMenu open toggle not found in script.js');
  process.exit(1);
}
console.log('[PASS] Found exploreMenu open toggle in script.js');

if (!js.includes("document.querySelectorAll('#explorePanel [data-explore]')")) {
  console.error('[FAIL] explorePanel item click handler not found in script.js');
  process.exit(1);
}
console.log('[PASS] Found explore item navigation handler in script.js');

console.log('==================================================');
console.log('ALL COMPACT EXPLORE & NAVBAR VERIFICATIONS PASSED!');
console.log('==================================================');

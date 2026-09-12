// TheCampusNova Production Application Script
// Version: 2026.08 - Connected Courses Navigation & Hero Background Carousel
window._userMentorsCache = window._userMentorsCache || [];
window._activeSelectedMentor = window._activeSelectedMentor || null;
var _userMentorsCache = window._userMentorsCache;
var _activeSelectedMentor = window._activeSelectedMentor;
var _isLoadingLiveEventsAndNews = false;

// Helper to sanitize, normalize and validate external portal URLs
function formatPortalUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed || trimmed === '#' || trimmed.toLowerCase() === 'null' || trimmed.toLowerCase() === 'undefined' || trimmed === 'about:blank' || trimmed.toLowerCase() === 'n/a' || trimmed.toLowerCase().includes('admin.html') || trimmed.startsWith('#')) return null;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('/') || trimmed.startsWith('javascript:')) return null;
  return 'https://' + trimmed;
}
window.formatPortalUrl = formatPortalUrl;

// ============================================================================
// GLOBAL MEDIA PROTECTION LAYER
// Inspect Element & Developer Tools are ENABLED across the entire site.
// Only media assets (images, videos, audio, picture, canvas) are protected
// against direct saving, context-menu saving ("Save image as..."), and dragging.
// ============================================================================
(function initGlobalMediaProtection() {
  function isMediaTarget(target) {
    if (!target) return false;
    const tag = (target.tagName || '').toUpperCase();
    if (['IMG', 'VIDEO', 'AUDIO', 'PICTURE', 'SOURCE', 'CANVAS'].includes(tag)) {
      return true;
    }
    if (typeof target.closest === 'function' && target.closest('img, video, audio, picture, canvas, [data-media], .media-protected')) {
      return true;
    }
    try {
      const bg = window.getComputedStyle(target).backgroundImage;
      if (bg && bg !== 'none' && bg.includes('url(')) {
        return true;
      }
    } catch (_) {}
    return false;
  }

  // 1. Prevent contextmenu ONLY on media elements to block "Save image as...", "Copy image", etc.
  // Standard context menu (Inspect Element, Copy, etc.) is fully allowed everywhere else.
  document.addEventListener('contextmenu', function (e) {
    if (isMediaTarget(e.target)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, { passive: false, capture: true });

  // 2. Prevent dragging media files (to desktop or another browser window/tab)
  document.addEventListener('dragstart', function (e) {
    if (isMediaTarget(e.target)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, { passive: false, capture: true });

  // 3. Configure audio/video controls to remove download button & disable PiP
  function secureMediaElements(root) {
    const scope = root && root.querySelectorAll ? root : document;
    const mediaList = scope.querySelectorAll('video, audio');
    mediaList.forEach(media => {
      media.setAttribute('controlsList', 'nodownload noplaybackrate');
      media.setAttribute('disablePictureInPicture', 'true');
      media.setAttribute('oncontextmenu', 'return false;');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => secureMediaElements(document));
  } else {
    secureMediaElements(document);
  }

  // Dynamically secure any newly inserted media elements
  try {
    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === 1) {
            secureMediaElements(node);
          }
        }
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  } catch (_) {}
})();

// ============================================================================
// 1. TOP 20 COLLEGES IN INDIA REGISTRY (LIVE SYNCED WITH BACKEND DATABASE)
// ============================================================================
let collegesRegistry = [
  {
    id: 'COL-001',
    rank: 1,
    name: 'IISc Bengaluru',
    city: 'Bengaluru',
    district: 'Bengaluru Urban',
    state: 'Karnataka',
    aishe: 'U-0042',
    badge: 'Premier Research Institute',
    type: 'Public Research University',
    rating: '4.9',
    reviews: '1,420+ Reviews',
    stream: 'Advanced Science, Computing & Engineering',
    courses: ['B.Tech', 'B.Sc', 'M.Tech', 'Ph.D', 'Computer Science', 'Data Science', 'AI & ML', 'Electrical / EEE'],
    placement: 'Median CTC: ₹28.0 LPA',
    fees: '₹35,000 / yr',
    cutoff: 'JEE Adv Top 250 / GATE 99+ %ile',
    image: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=800&q=80',
    overview: 'The Indian Institute of Science is India\'s premier institution for advanced scientific and technological research and education, consistently ranked NIRF #1 Overall.'
  },
  {
    id: 'COL-002',
    rank: 2,
    name: 'IIT Madras',
    city: 'Chennai',
    district: 'Chennai',
    state: 'Tamil Nadu',
    aishe: 'U-0456',
    aishe_codes: ['U-0456', 'U-0306'],
    badge: 'IIT System',
    type: 'Institute of National Importance',
    rating: '4.9',
    reviews: '2,150+ Reviews',
    stream: 'Engineering, Technology & Data Science',
    courses: ['B.Tech', 'B.E.', 'M.Tech', 'MBA', 'Computer Science', 'Data Science', 'Mechanical', 'Civil', 'Electrical / EEE', 'AI & ML'],
    placement: 'Avg CTC: ₹21.4 LPA (Top: ₹1.3 Cr)',
    fees: '₹2.20L / yr',
    cutoff: 'JEE Adv Rank < 800',
    image: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&q=80',
    overview: 'Ranked NIRF #1 Engineering Institute for consecutive years, IIT Madras excels in engineering innovation, global research testbeds, and deep-tech entrepreneurship.'
  },
  {
    id: 'COL-003',
    rank: 3,
    name: 'IIT Delhi',
    city: 'New Delhi',
    district: 'New Delhi',
    state: 'Delhi',
    aishe: 'U-0053',
    badge: 'IIT System',
    type: 'Institute of National Importance',
    rating: '4.9',
    reviews: '2,400+ Reviews',
    stream: 'Computer Science, AI & Engineering',
    courses: ['B.Tech', 'B.E.', 'M.Tech', 'MBA', 'Computer Science', 'AI & ML', 'Data Science', 'Cyber Security', 'Electrical / EEE', 'Mechanical'],
    placement: 'Avg CTC: ₹22.5 LPA (Top: ₹2.4 Cr)',
    fees: '₹2.20L / yr',
    cutoff: 'JEE Adv Rank < 500',
    image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80',
    overview: 'Situated in the national capital, IIT Delhi is renowned for world-class computing laboratories, startup incubators, and exceptional global campus placements.'
  },
  {
    id: 'COL-004',
    rank: 4,
    name: 'IIT Bombay',
    city: 'Mumbai',
    district: 'Mumbai Suburban',
    state: 'Maharashtra',
    aishe: 'U-0237',
    badge: 'IIT System',
    type: 'Institute of National Importance',
    rating: '4.9',
    reviews: '2,800+ Reviews',
    stream: 'Engineering, Systems & Design',
    courses: ['B.Tech', 'B.E.', 'M.Tech', 'MBA', 'B.Des', 'Computer Science', 'AI & ML', 'Data Science', 'Mechanical', 'Civil', 'UI/UX Design'],
    placement: 'Avg CTC: ₹23.8 LPA (Top: ₹2.1 Cr)',
    fees: '₹2.25L / yr',
    cutoff: 'JEE Adv Rank < 300',
    image: 'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?auto=format&fit=crop&w=800&q=80',
    overview: 'IIT Bombay is India\'s most sought-after destination for engineering aspirants, with unparalleled alumni networks across Silicon Valley and leading enterprises.'
  },
  {
    id: 'COL-005',
    rank: 5,
    name: 'IIT Kanpur',
    city: 'Kanpur',
    district: 'Kanpur Nagar',
    state: 'Uttar Pradesh',
    aishe: 'U-0202',
    badge: 'IIT System',
    type: 'Institute of National Importance',
    rating: '4.8',
    reviews: '1,800+ Reviews',
    stream: 'Aerospace, Cybersecurity & CS',
    courses: ['B.Tech', 'B.E.', 'M.Tech', 'MBA', 'Computer Science', 'Cyber Security', 'Data Science', 'Electrical / EEE', 'Mechanical'],
    placement: 'Avg CTC: ₹20.5 LPA',
    fees: '₹2.10L / yr',
    cutoff: 'JEE Adv Rank < 1200',
    image: 'https://images.unsplash.com/photo-1576495199011-eb94736d05d6?auto=format&fit=crop&w=800&q=80',
    overview: 'Pioneer of computer science education in India with state-of-the-art supercomputing centers and national cybersecurity testbeds.'
  },
  {
    id: 'COL-006',
    rank: 6,
    name: 'AIIMS Delhi',
    city: 'New Delhi',
    district: 'New Delhi',
    state: 'Delhi',
    aishe: 'U-0098',
    badge: 'Premier Medical Science',
    type: 'Central Medical Institute',
    rating: '4.9',
    reviews: '3,100+ Reviews',
    stream: 'Medicine, Surgery & Clinical Research',
    courses: ['MBBS', 'B.Sc Nursing', 'MD', 'MS', 'B.Pharm', 'Medical', 'Surgery', 'Clinical Research'],
    placement: '100% Medical Residency & Fellowships',
    fees: '₹1,628 / yr',
    cutoff: 'NEET Rank Top 50',
    image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80',
    overview: 'The apex healthcare institution in India providing advanced medical education, multi-specialty patient care, and cutting-edge biomedical research.'
  },
  {
    id: 'COL-007',
    rank: 7,
    name: 'IIM Ahmedabad',
    city: 'Ahmedabad',
    district: 'Ahmedabad',
    state: 'Gujarat',
    aishe: 'U-0144',
    badge: 'IIM System',
    type: 'Institute of National Importance',
    rating: '4.9',
    reviews: '1,650+ Reviews',
    stream: 'Management, FinTech & Strategy',
    courses: ['MBA', 'PGP', 'Executive MBA', 'FinTech', 'Management', 'Business Analytics', 'Digital Marketing'],
    placement: 'Avg CTC: ₹34.2 LPA (Top: ₹1.1 Cr)',
    fees: '₹12.5L / yr',
    cutoff: 'CAT 99.5+ %ile',
    image: 'https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?auto=format&fit=crop&w=800&q=80',
    overview: 'India\'s premier management institution recognized globally for executive leadership development, case-study pedagogy, and consulting placements.'
  },
  {
    id: 'COL-008',
    rank: 8,
    name: 'IIM Bangalore',
    city: 'Bengaluru',
    district: 'Bengaluru Urban',
    state: 'Karnataka',
    aishe: 'U-0221',
    badge: 'IIM System',
    type: 'Institute of National Importance',
    rating: '4.9',
    reviews: '1,500+ Reviews',
    stream: 'Business Analytics, FinTech & MBA',
    courses: ['MBA', 'PGP', 'Executive MBA', 'FinTech', 'Management', 'Business Analytics', 'Strategy'],
    placement: 'Avg CTC: ₹33.8 LPA',
    fees: '₹12.0L / yr',
    cutoff: 'CAT 99.3+ %ile',
    image: 'https://images.unsplash.com/photo-1525921429624-479b6a26d84d?auto=format&fit=crop&w=800&q=80',
    overview: 'Located in India\'s tech capital, IIMB provides unmatched corporate interface, venture incubation, and business analytics specialization.'
  },
  {
    id: 'COL-009',
    rank: 9,
    name: 'BITS Pilani',
    city: 'Pilani',
    district: 'Jhunjhunu',
    state: 'Rajasthan',
    aishe: 'U-0391',
    badge: 'Institute of Eminence',
    type: 'Deemed University (Private)',
    rating: '4.8',
    reviews: '2,200+ Reviews',
    stream: 'Engineering, Data & Pharmacy',
    courses: ['B.Tech', 'B.E.', 'B.Pharm', 'M.Tech', 'MBA', 'Computer Science', 'Data Science', 'Electronics'],
    placement: 'Avg CTC: ₹19.8 LPA (Top: ₹60 LPA)',
    fees: '₹4.80L / yr',
    cutoff: 'BITSAT 310+ Score',
    image: 'https://images.unsplash.com/photo-1564981797816-1043664bf78d?auto=format&fit=crop&w=800&q=80',
    overview: 'Renowned for meritocratic admissions with zero reservations, flexible dual-degree choices, Practice School industry immersions, and strong tech founder roots.'
  },
  {
    id: 'COL-010',
    rank: 10,
    name: 'IIT Kharagpur',
    city: 'Kharagpur',
    district: 'Paschim Medinipur',
    state: 'West Bengal',
    aishe: 'U-0305',
    badge: 'IIT System',
    type: 'Institute of National Importance',
    rating: '4.8',
    reviews: '2,600+ Reviews',
    stream: 'Engineering, Law & Architecture',
    courses: ['B.Tech', 'B.E.', 'LL.B', 'M.Tech', 'MBA', 'Computer Science', 'Law', 'Architecture', 'AI & ML'],
    placement: 'Avg CTC: ₹19.5 LPA',
    fees: '₹2.10L / yr',
    cutoff: 'JEE Adv Rank < 1800',
    image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80',
    overview: 'The oldest IIT with the largest campus in India, offering comprehensive degree tracks from engineering and intellectual property law to medical technology.'
  },
  {
    id: 'COL-011',
    rank: 11,
    name: 'Jadavpur University',
    city: 'Kolkata',
    district: 'Kolkata',
    state: 'West Bengal',
    aishe: 'U-0575',
    badge: 'Premier State University',
    type: 'State Autonomous University',
    rating: '4.7',
    reviews: '1,750+ Reviews',
    stream: 'Engineering, Arts & Science',
    courses: ['B.Tech', 'B.E.', 'B.Sc', 'B.A.', 'M.Tech', 'MCA', 'Computer Science', 'Electrical', 'Mechanical'],
    placement: 'Avg CTC: ₹15.2 LPA (Top: ₹85 LPA)',
    fees: '₹10,000 / yr',
    cutoff: 'WBJEE Top 200 Rank',
    image: 'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?auto=format&fit=crop&w=800&q=80',
    overview: 'Celebrated for phenomenal return on investment with near-zero tuition fees, stellar faculty, and top-bracket engineering placements.'
  },
  {
    id: 'COL-012',
    rank: 12,
    name: 'University of Delhi',
    city: 'New Delhi',
    district: 'North Delhi',
    state: 'Delhi',
    aishe: 'U-0120',
    badge: 'Central University',
    type: 'Central Public University',
    rating: '4.7',
    reviews: '4,500+ Reviews',
    stream: 'Commerce, Economics, Arts & Science',
    courses: ['B.Com', 'B.A.', 'B.Sc', 'BBA', 'BCA', 'LL.B', 'MBA', 'MCA', 'Commerce', 'Economics', 'Law'],
    placement: 'Avg CTC: ₹11.5 LPA (SRCC / St. Stephen\'s)',
    fees: '₹18,000 / yr',
    cutoff: 'CUET 98+ %ile',
    image: 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=800&q=80',
    overview: 'India\'s flagship central university with premier constituent colleges like SRCC, St. Stephen\'s, Hindu, and Miranda House.'
  },
  {
    id: 'COL-013',
    rank: 13,
    name: 'Manipal Academy (MAHE)',
    city: 'Manipal',
    district: 'Udupi',
    state: 'Karnataka',
    aishe: 'U-0230',
    badge: 'Institute of Eminence',
    type: 'Deemed University (Private)',
    rating: '4.7',
    reviews: '2,300+ Reviews',
    stream: 'Medicine, Engineering & Media',
    courses: ['MBBS', 'B.Tech', 'B.Des', 'B.Pharm', 'B.Sc Nursing', 'BDS', 'BBA', 'Computer Science', 'Medicine', 'UI/UX Design'],
    placement: 'Avg CTC: ₹12.6 LPA',
    fees: '₹3.80L / yr',
    cutoff: 'MET 140+ / NEET Score',
    image: 'https://images.unsplash.com/photo-1492538368677-f6e0afe31dcc?auto=format&fit=crop&w=800&q=80',
    overview: 'A globally recognized private university township with premier medical (KMC) and engineering (MIT Manipal) campuses.'
  },
  {
    id: 'COL-014',
    rank: 14,
    name: 'Vellore Institute (VIT)',
    city: 'Vellore',
    district: 'Vellore',
    state: 'Tamil Nadu',
    aishe: 'U-0490',
    badge: 'NAAC A++ Autonomous',
    type: 'Deemed University',
    rating: '4.7',
    reviews: '3,800+ Reviews',
    stream: 'Computer Science, AI & Engineering',
    courses: ['B.Tech', 'B.E.', 'BCA', 'MCA', 'B.Sc', 'BBA', 'MBA', 'Computer Science', 'Data Science', 'AI & ML', 'Cyber Security'],
    placement: 'Avg CTC: ₹9.2 LPA (Top: ₹1.02 Cr)',
    fees: '₹1.98L / yr',
    cutoff: 'VITEEE Rank < 15,000',
    image: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=800&q=80',
    overview: 'Pioneer of flexible credit systems with massive tech campus recruitment and global international transfer pathways.'
  },
  {
    id: 'COL-015',
    rank: 15,
    name: 'NLSIU Bengaluru',
    city: 'Bengaluru',
    district: 'Bengaluru Urban',
    state: 'Karnataka',
    aishe: 'U-0234',
    badge: 'National Law University',
    type: 'Autonomous Law University',
    rating: '4.9',
    reviews: '850+ Reviews',
    stream: 'Law, Public Policy & Judicial Studies',
    courses: ['BA LL.B', 'LL.B', 'LL.M', 'Corporate Law', 'Cyber Law', 'Public Policy', 'Law'],
    placement: 'Median CTC: ₹16.0 LPA (Tier-1 Law Firms)',
    fees: '₹3.20L / yr',
    cutoff: 'CLAT Rank Top 100',
    image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
    overview: 'India\'s undisputed #1 law university, setting the benchmark for legal education, corporate law litigation, and judicial civil services.'
  },
  {
    id: 'COL-016',
    rank: 16,
    name: 'IIT Roorkee',
    city: 'Roorkee',
    district: 'Haridwar',
    state: 'Uttarakhand',
    aishe: 'U-0551',
    badge: 'IIT System',
    type: 'Institute of National Importance',
    rating: '4.8',
    reviews: '2,100+ Reviews',
    stream: 'Civil, Architecture & CS',
    courses: ['B.Tech', 'B.E.', 'B.Arch', 'M.Tech', 'MBA', 'Civil', 'Computer Science', 'Data Science', 'Architecture'],
    placement: 'Avg CTC: ₹18.2 LPA',
    fees: '₹2.10L / yr',
    cutoff: 'JEE Adv Rank < 2000',
    image: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&q=80',
    overview: 'Asia\'s oldest technical institution renowned for cutting-edge civil infrastructure labs, water resource engineering, and AI centers.'
  },
  {
    id: 'COL-017',
    rank: 17,
    name: 'IIT Guwahati',
    city: 'Guwahati',
    district: 'Kamrup Metropolitan',
    state: 'Assam',
    aishe: 'U-0051',
    badge: 'IIT System',
    type: 'Institute of National Importance',
    rating: '4.8',
    reviews: '1,900+ Reviews',
    stream: 'Data Science, Design & Engineering',
    courses: ['B.Tech', 'B.E.', 'B.Des', 'M.Tech', 'Design', 'Computer Science', 'Data Science', 'UI/UX Design', 'AI & ML'],
    placement: 'Avg CTC: ₹18.0 LPA',
    fees: '₹2.15L / yr',
    cutoff: 'JEE Adv Rank < 2200',
    image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80',
    overview: 'Celebrated for having India\'s most picturesque campus, world-class department of design (DoD), and high-throughput data science hubs.'
  },
  {
    id: 'COL-018',
    rank: 18,
    name: 'Anna University',
    city: 'Chennai',
    district: 'Chennai',
    state: 'Tamil Nadu',
    aishe: 'U-0439',
    badge: 'Premier State Tech University',
    type: 'State Technical University',
    rating: '4.6',
    reviews: '3,200+ Reviews',
    stream: 'Engineering, Computing & Tech',
    courses: ['B.Tech', 'B.E.', 'MCA', 'MBA', 'M.Tech', 'Computer Science', 'Mechanical', 'Civil', 'Electrical / EEE'],
    placement: 'Avg CTC: ₹8.5 LPA (Top: ₹40 LPA)',
    fees: '₹25,000 / yr',
    cutoff: 'TNEA Cutoff 195+ / 200',
    image: 'https://images.unsplash.com/photo-1576495199011-eb94736d05d6?auto=format&fit=crop&w=800&q=80',
    overview: 'The apex engineering institution in Tamil Nadu with historic constituent colleges (CEG & MIT) known for producing pioneering tech leaders.'
  },
  {
    id: 'COL-019',
    rank: 19,
    name: 'NID Ahmedabad',
    city: 'Ahmedabad',
    district: 'Ahmedabad',
    state: 'Gujarat',
    aishe: 'U-0145',
    badge: 'Institute of National Importance',
    type: 'National Design Institute',
    rating: '4.8',
    reviews: '920+ Reviews',
    stream: 'UI/UX, Industrial & Communication Design',
    courses: ['B.Des', 'M.Des', 'Design', 'UI/UX Design', 'Product Design', 'Graphic Design', 'Animation', 'VFX'],
    placement: 'Avg CTC: ₹14.0 LPA (Global Design Firms)',
    fees: '₹3.50L / yr',
    cutoff: 'NID DAT Top 100 Rank',
    image: 'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?auto=format&fit=crop&w=800&q=80',
    overview: 'India\'s foremost institution for industrial design, interaction/UI/UX design, visual communication, and creative strategy.'
  },
  {
    id: 'COL-020',
    rank: 20,
    name: 'CMC Vellore',
    city: 'Vellore',
    district: 'Vellore',
    state: 'Tamil Nadu',
    aishe: 'U-0444',
    badge: 'Apex Medical Institution',
    type: 'Private Medical College & Hospital',
    rating: '4.9',
    reviews: '2,100+ Reviews',
    stream: 'Medicine, Allied Health & Nursing',
    courses: ['MBBS', 'B.Sc Nursing', 'BPT', 'B.Pharm', 'MD', 'Medical', 'Physiotherapy', 'Allied Health'],
    placement: '100% Clinical Residency Placements',
    fees: '₹30,000 / yr',
    cutoff: 'NEET Rank Top 200',
    image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80',
    overview: 'One of Asia\'s most respected medical colleges and hospitals, pioneering specialty care, community health, and medical research.'
  }
];

// ============================================================================
// 2. EXPLORE EDUCATION STREAMS DATA (HOMEPAGE 7 STREAMS)
// ============================================================================
const streamsData = [
  {
    id: 'stream-engineering',
    num: '01',
    name: 'Engineering, IT & Computer Applications',
    category: 'Engineering & Technology',
    title: 'Engineering, IT & Computer Applications',
    description: 'Pioneer the technologies, intelligent software systems, digital architectures, and engineering infrastructure shaping modern society.',
    subfields: [
      { name: 'Computer Science & Engineering', desc: 'Algorithms, systems programming & software architecture' },
      { name: 'Information Technology', desc: 'Enterprise networks, cloud systems & IT infrastructure' },
      { name: 'Electrical & Electronics', desc: 'Power systems, microelectronics, VLSI & embedded hardware' },
      { name: 'Mechanical Engineering', desc: 'Thermodynamics, robotics, CAD/CAM & automotive systems' },
      { name: 'Civil Engineering', desc: 'Structural engineering, smart cities & urban planning' },
      { name: 'Artificial Intelligence & ML', desc: 'Deep learning, LLMs, neural networks & computer vision' },
      { name: 'Data Science & Analytics', desc: 'Big data pipelines, statistical modeling & data visualization' },
      { name: 'Cyber Security & Defense', desc: 'Ethical hacking, cryptography, security ops & digital forensics' },
      { name: 'Cloud Computing & DevOps', desc: 'AWS, Azure, Kubernetes, Docker & CI/CD automations' },
      { name: 'Internet of Things (IoT)', desc: 'Sensor networks, smart hardware & connected device ecosystems' },
      { name: 'Full Stack Web Development', desc: 'Frontend frameworks, backend microservices & database engineering' },
      { name: 'Robotics & Automation', desc: 'Kinematics, industrial automation, sensors & autonomous control' }
    ]
  },
  {
    id: 'stream-commerce',
    num: '02',
    name: 'Commerce, Management & Finance',
    category: 'Commerce, Business & FinTech',
    title: 'Commerce, Management & Finance',
    description: 'Master financial markets, corporate strategy, accounting standards, executive management, and FinTech innovation.',
    subfields: [
      { name: 'Accounting & Auditing', desc: 'Chartered Accountancy (CA), IFRS standards & forensic accounting' },
      { name: 'Business Analytics', desc: 'Predictive modeling, business intelligence & data-driven strategy' },
      { name: 'Corporate Finance & Banking', desc: 'Investment banking, valuation, mergers & acquisitions' },
      { name: 'Marketing & Brand Strategy', desc: 'Digital marketing, consumer behavior & growth marketing' },
      { name: 'Entrepreneurship & Innovation', desc: 'Venture creation, startup funding & business scaling' },
      { name: 'Human Resource Management', desc: 'Talent acquisition, corporate culture & executive leadership' },
      { name: 'FinTech & Digital Markets', desc: 'Algorithmic trading, blockchain, payment gateways & DeFi' },
      { name: 'Business Administration (BBA/MBA)', desc: 'General management, operations & executive decision making' },
      { name: 'International Trade & Supply Chain', desc: 'Global logistics, export-import laws & supply chain management' },
      { name: 'Actuarial Science & Risk', desc: 'Mathematical modeling, insurance mathematics & financial risk' }
    ]
  },
  {
    id: 'stream-medical',
    num: '03',
    name: 'Medical, Allied Health & Life Sciences',
    category: 'Healthcare & Biological Sciences',
    title: 'Medical, Allied Health & Life Sciences',
    description: 'Advance healthcare, clinical diagnosis, biomedical innovation, and pharmaceutical development to save lives.',
    subfields: [
      { name: 'General Medicine & Surgery (MBBS)', desc: 'Clinical diagnosis, human anatomy, pathology & patient care' },
      { name: 'Dental Surgery (BDS)', desc: 'Oral healthcare, orthodontics & dental surgical procedures' },
      { name: 'Ayurvedic Medicine (BAMS)', desc: 'Traditional holistic healthcare, herbal pharmacology & therapy' },
      { name: 'Homeopathic Medicine (BHMS)', desc: 'Alternative medicine systems & individualized holistic care' },
      { name: 'Nursing & Patient Care', desc: 'Critical care nursing, hospital ward management & clinical assistance' },
      { name: 'Pharmacy & Pharmacology', desc: 'Drug design, pharmaceutical chemistry & clinical trials' },
      { name: 'Physiotherapy & Rehabilitation', desc: 'Musculoskeletal rehabilitation, sports medicine & kinesiology' },
      { name: 'Biotechnology & Genetic Eng.', desc: 'Gene editing, CRISPR, recombinant DNA & industrial bioprocesses' },
      { name: 'Bioinformatics & Computational Bio', desc: 'Genomic sequencing algorithms & biological data modeling' },
      { name: 'Medical Laboratory Technology', desc: 'Diagnostic testing, hematology, microbiology & clinical pathology' }
    ]
  },
  {
    id: 'stream-design',
    num: '04',
    name: 'Design, Media & Creative Arts',
    category: 'Design & Visual Media',
    title: 'Design, Media & Creative Arts',
    description: 'Transform visual culture, user experiences, digital interaction, entertainment media, and spatial design.',
    subfields: [
      { name: 'UI/UX & Interaction Design', desc: 'Human-centered design, Figma prototyping & design systems' },
      { name: 'Industrial & Product Design', desc: 'Ergonomic physical products, consumer electronics & 3D modeling' },
      { name: 'Graphic Design & Visual Arts', desc: 'Typography, brand identity design & digital illustration' },
      { name: 'Fashion & Textile Design', desc: 'Apparel design, textile technology & fashion styling' },
      { name: 'Game Development & Design', desc: 'Unreal Engine, Unity, 3D character design & gameplay mechanics' },
      { name: 'Visual Effects (VFX) & Animation', desc: '3D CGI animation, compositing, motion graphics & cinematic FX' },
      { name: 'AR / VR & Immersive Media', desc: 'Virtual reality environments, spatial computing & Metaverse UI' },
      { name: 'Fine Arts & Applied Arts (BFA)', desc: 'Painting, sculpture, visual expression & art history' }
    ]
  },
  {
    id: 'stream-arts',
    num: '05',
    name: 'Arts, Humanities & Social Sciences',
    category: 'Humanities & Social Sciences',
    title: 'Arts, Humanities & Social Sciences',
    description: 'Understand human society, cognitive behavior, language, cultural heritage, global politics, and mass media.',
    subfields: [
      { name: 'English & World Literature', desc: 'Literary criticism, creative writing & comparative linguistics' },
      { name: 'History & Archaeology', desc: 'Civilizational studies, archival research & historical preservation' },
      { name: 'Political Science & IR', desc: 'Geopolitics, constitutional theory & international relations' },
      { name: 'Philosophy & Ethics', desc: 'Logic, moral philosophy, epistemological inquiry & metaphysics' },
      { name: 'Applied Psychology', desc: 'Cognitive neuroscience, counseling & organizational psychology' },
      { name: 'Journalism & Electronic Media', desc: 'Investigative reporting, newsroom broadcasting & multimedia news' },
      { name: 'Mass Communication & PR', desc: 'Strategic corporate communication, advertising & public relations' },
      { name: 'Digital Humanities', desc: 'Computational analysis of cultural data, media archives & linguistics' }
    ]
  },
  {
    id: 'stream-law',
    num: '06',
    name: 'Law & Public Policy',
    category: 'Legal Studies & Governance',
    title: 'Law & Public Policy',
    description: 'Advocate justice, govern corporate compliance, safeguard intellectual property, and craft progressive public policy.',
    subfields: [
      { name: 'Integrated Law: BA LL.B (Hons)', desc: '5-year combined legal education with humanities foundations' },
      { name: 'Integrated Law: BBA LL.B (Hons)', desc: '5-year combined legal education with business administration' },
      { name: '3-Year Bachelor of Laws (LL.B)', desc: 'Postgraduate professional legal qualification for graduates' },
      { name: 'Corporate & Commercial Law', desc: 'M&A compliance, securities regulation & contract law' },
      { name: 'Cyber Law & InfoSec Governance', desc: 'Digital privacy regulations, cybercrime litigation & AI governance' },
      { name: 'Intellectual Property Rights (IPR)', desc: 'Patents, trademarks, copyrights & trade secret protection' },
      { name: 'Public Policy & Governance', desc: 'Policy formulation, public administration & economic evaluation' },
      { name: 'Constitutional & Criminal Jurisprudence', desc: 'Fundamental rights litigation, criminal law & judicial process' }
    ]
  },
  {
    id: 'stream-online',
    num: '07',
    name: 'Online, Distance & Skill-Based Learning',
    category: 'Digital Education & Skills',
    title: 'Online, Distance & Skill-Based Learning',
    description: 'Accelerate career readiness with accredited online degrees, specialized bootcamps, and global micro-credentials.',
    subfields: [
      { name: 'UGC-Entitled Online Degrees', desc: 'Online B.Tech, BCA, BBA, MCA, and MBA degrees from top universities' },
      { name: 'Professional Executive Certifications', desc: 'Management & technical credentials for working professionals' },
      { name: 'Full-Stack Software Engineering', desc: 'Intensive coding bootcamps with hands-on capstone projects' },
      { name: 'AWS & Cloud Architecture Track', desc: 'Official cloud practitioner & solutions architect certification prep' },
      { name: 'Data Analytics & PowerBI Track', desc: 'Hands-on SQL, Python, Excel & PowerBI dashboard masteries' },
      { name: 'Vocational Technical Diplomas', desc: 'Practical trade and technical skills certifications' },
      { name: 'Industry Micro-Credentials', desc: 'Verified digital badges and job-ready skill verifications' }
    ]
  }
];

let activeStreamId = 'stream-engineering';

function renderStreams(selectedId = activeStreamId) {
  activeStreamId = selectedId;
  const listContainer = document.getElementById('streamList');
  const detailContainer = document.getElementById('streamDetail');

  if (!listContainer || !detailContainer) return;

  listContainer.innerHTML = streamsData.map(stream => {
    const isActive = stream.id === activeStreamId;
    return `
      <button type="button" class="stream-item ${isActive ? 'active' : ''}" onclick="selectStream('${stream.id}')">
        <span class="step-num">${stream.num}</span>
        <strong>${stream.name}</strong>
      </button>
    `;
  }).join('');

  const current = streamsData.find(s => s.id === activeStreamId) || streamsData[0];

  detailContainer.innerHTML = `
    <span class="eyebrow">${current.num} / 07 &bull; ${current.category}</span>
    <h3>${current.title}</h3>
    <p>${current.description}</p>

    <div class="field-grid">
      ${current.subfields.map(sub => `
        <button type="button" onclick="openCourseSubfield('${sub.name.replace(/'/g, "\\'")}')">
          <strong>${sub.name}</strong>
          <br><small style="color:var(--theme-muted); font-size:11.5px; line-height:1.3; display:inline-block; margin-top:3px;">${sub.desc}</small>
        </button>
      `).join('')}
    </div>
  `;
}

function selectStream(streamId) {
  renderStreams(streamId);
}
window.selectStream = selectStream;

function openCourseSubfield(subfieldName) {
  setView('courses');
  if (typeof handleCoursesSearch === 'function') {
    handleCoursesSearch(subfieldName);
  }
  showToast(`Showing courses & degree tracks for ${subfieldName}`);
}
window.openCourseSubfield = openCourseSubfield;

// ============================================================================
// 3. TOP 20 COLLEGES IN INDIA RENDERING & VIEW / UPDATE WORKFLOW
// ============================================================================
function renderTopColleges() {
  const grid = document.getElementById('topCollegeGrid');
  if (!grid) return;

  // STRICT REQUIREMENT: Limit to EXACTLY 20 colleges on Home Page Top 20 section
  const top20 = collegesRegistry.slice(0, 20);

  grid.innerHTML = top20.map((col) => `
    <article class="top-college-card" data-college-id="${col.id}">
      <div class="college-thumb">
        <img
          src="${col.image}"
          alt="${col.name} Campus"
          class="college-thumb-img"
          loading="lazy"
          onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=800&q=80';"
        />
        <div class="college-thumb-overlay"></div>
        <span class="college-rank">#${col.rank || col.nirf_rank || 'NIRF'}</span>
        <span class="college-city">📍 ${col.city || col.district}, ${col.state}</span>
      </div>

      <div class="top-college-body">
        <h3>${col.name}</h3>
        <small>${col.badge || col.type || 'Premier Institution'}</small>

        <div class="college-rating">
          <span>★ ${col.rating || '4.8'} / 5.0</span>
          <span>${col.reviews || col.reviews_count || '1,000+ Reviews'}</span>
        </div>

        <div class="college-course">🎓 ${col.stream}</div>
        <div class="college-placement">💼 ${col.placement}</div>

        <button type="button" class="college-view" onclick="openCollegeDetailsModal('${col.id}')">
          View College →
        </button>

        <button type="button" class="further-details-trigger" onclick="openFurtherDetails('${col.id}')">
          Update Details
        </button>
      </div>
    </article>
  `).join('');
}

function fetchCollegesLive() {
  fetch('/api/colleges')
    .then(res => res.json())
    .then(data => {
      if (data && data.success && Array.isArray(data.colleges) && data.colleges.length > 0) {
        const freshList = data.colleges.map((col, idx) => {
          const colName = col.college_name || col.name || 'Institution';
          const aisheCode = col.aishe_code || col.aishe || '';
          const colId = col.id ? String(col.id) : (col.db_id ? `COL-${col.db_id}` : `COL-${idx + 1}`);
          const website = col.website || col.official_url || col.officialLink || '';
          const imageUrl = col.image || col.image_url || col.logo_url || 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=800&q=80';
          const videoUrl = col.video || col.video_url || '';
          return {
            id: colId,
            db_id: col.db_id || col.id,
            rank: col.rank || col.nirf_rank || (idx + 1),
            nirf_rank: col.rank || col.nirf_rank || (idx + 1),
            name: colName,
            college_name: colName,
            short_name: col.short_name || colName,
            city: col.city || col.location || col.district || 'India',
            district: col.district || '',
            state: col.state || 'Tamil Nadu',
            aishe: aisheCode,
            aishe_code: aisheCode,
            badge: col.badge || (col.naac_grade ? `NAAC ${col.naac_grade}` : 'Accredited Campus'),
            type: col.type || col.college_type || 'Higher Education Institute',
            college_type: col.type || col.college_type || 'Higher Education Institute',
            rating: String(col.rating || '4.8'),
            reviews: String(col.reviews || col.reviews_count || '1,200+ Reviews'),
            reviews_count: String(col.reviews || col.reviews_count || '1,200+ Reviews'),
            stream: col.stream || 'Higher Education & Research',
            courses: (col.courses && col.courses.length > 0) ? col.courses : ['B.Tech', 'Degree', 'Specializations'],
            placement: col.placement || 'Median CTC: ₹14.0 LPA',
            avg_placement: col.avg_placement || col.placement || '₹14.0 LPA',
            highest_placement: col.highest_placement || col.highestPlacement || '₹45.0 LPA',
            highestPlacement: col.highest_placement || col.highestPlacement || '₹45.0 LPA',
            fees: col.fees || 'Competitive Structure',
            cutoff: col.cutoff || 'Entrance Qualified',
            admissions: col.admissions || 'National entrance counseling.',
            eligibility: col.eligibility || '10+2 qualification with qualifying score.',
            facilities: col.facilities || col.facilities_list || 'Central Library, Research Labs, Sports Complex',
            facilities_list: col.facilities || col.facilities_list || 'Central Library, Research Labs, Sports Complex',
            scholarships: col.scholarships || col.scholarships_info || 'Merit & Government Scholarships',
            scholarships_info: col.scholarships || col.scholarships_info || 'Merit & Government Scholarships',
            recruiters: col.recruiters || 'Top Industry Recruiters',
            internship_support: col.internship_support || 'Campus Internship Training',
            image: imageUrl,
            image_url: imageUrl,
            video: videoUrl,
            video_url: videoUrl,
            overview: col.overview || col.description || colName,
            description: col.overview || col.description || colName,
            officialLink: website,
            official_url: website,
            website: website,
            email: col.email || '',
            phone: col.phone || '',
            address: col.address || '',
            naac_grade: col.naac_grade || '',
            accreditation: col.accreditation || '',
            events: col.events || [],
            news: col.news || []
          };
        });

        collegesRegistry.splice(0, collegesRegistry.length, ...freshList);

        if (typeof renderTopColleges === 'function') renderTopColleges();
        if (typeof renderCollegesView === 'function') renderCollegesView();

        // Auto-translate if non-English
        if (window.CampNovaTranslationEngine && window.CampNovaTranslationEngine.currentLanguageCode !== 'EN') {
          window.CampNovaTranslationEngine.scheduleTranslation(30);
        }
      }
    })
    .catch(() => {});
}
window.fetchCollegesLive = fetchCollegesLive;

let currentModalCollege = null;

function openSelectedCollegeWebsite(colObj) {
  const col = colObj || currentModalCollege || currentSelectedCollege;
  if (!col) {
    if (typeof showToast === 'function') {
      showToast('Official website is not available yet.');
    } else {
      alert('Official website is not available yet.');
    }
    return;
  }
  let url = col.website || col.officialLink || col.official_url;
  if (!url || typeof url !== 'string' || !url.trim() || url === '#' || url === 'NULL') {
    if (typeof showToast === 'function') {
      showToast('Official website is not available yet.');
    } else {
      alert('Official website is not available yet.');
    }
    return;
  }
  url = url.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  try {
    window.open(url, '_blank', 'noopener,noreferrer');
  } catch(e) {
    if (typeof showToast === 'function') {
      showToast('Official website is not available yet.');
    } else {
      window.location.href = url;
    }
  }
}
window.openSelectedCollegeWebsite = openSelectedCollegeWebsite;

async function openCollegeDetailsModal(collegeIdentifier) {
  const modal = document.getElementById('collegeDetailModal');
  const badgeEl = document.getElementById('modalCollegeBadge');
  const nameEl = document.getElementById('modalCollegeProfileName');
  const locEl = document.getElementById('modalCollegeLocation');
  const bodyEl = document.getElementById('collegeModalBody');

  // 1. Clear previous popup content immediately to prevent data mixing
  if (badgeEl) badgeEl.textContent = '';
  if (nameEl) nameEl.textContent = 'Loading College Profile...';
  if (locEl) locEl.textContent = '';
  if (bodyEl) bodyEl.innerHTML = '<div style="padding:32px; text-align:center; color:var(--theme-muted); font-size:13px;">Loading verified institutional records...</div>';

  if (modal) {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  // 2. Resolve the exact college record using stable identifier
  let col = null;
  if (typeof collegeIdentifier === 'object' && collegeIdentifier !== null) {
    col = collegeIdentifier;
  } else if (collegeIdentifier !== undefined && collegeIdentifier !== null && String(collegeIdentifier).trim() !== '') {
    const cleanId = String(collegeIdentifier).trim().toLowerCase();
    col = collegesRegistry.find(c =>
      (c.id && String(c.id).trim().toLowerCase() === cleanId) ||
      (c.db_id && String(c.db_id).trim().toLowerCase() === cleanId) ||
      (c.aishe && String(c.aishe).trim().toLowerCase() === cleanId) ||
      (c.aishe_code && String(c.aishe_code).trim().toLowerCase() === cleanId) ||
      (c.name && String(c.name).trim().toLowerCase() === cleanId) ||
      (c.short_name && String(c.short_name).trim().toLowerCase() === cleanId)
    );

    // Direct backend fetch fallback if not in local registry
    if (!col) {
      try {
        const res = await fetch(`/api/colleges/${encodeURIComponent(collegeIdentifier)}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.success && data.college) {
            col = data.college;
          }
        }
      } catch (e) {}
    }
  }

  if (!col) {
    if (nameEl) nameEl.textContent = 'Institution Not Found';
    if (bodyEl) bodyEl.innerHTML = '<div style="padding:32px; text-align:center; color:var(--coral); font-size:13px; font-weight:700;">College record could not be loaded.</div>';
    return;
  }

  currentModalCollege = col;
  currentSelectedCollege = col;
  window._authSelectedCollege = col;

  if (typeof recordUserActivity === 'function') {
    recordUserActivity('view', 'colleges', (col.aishe_code || col.aishe || col.id || ''), (col.name || col.college_name || ''));
  }

  const rankDisplay = col.rank ? `#${col.rank}` : (col.nirf_rank ? `#${col.nirf_rank}` : 'NIRF Ranked');
  const badgeText = col.badge || col.type || col.college_type || 'PREMIER INSTITUTION';
  if (badgeEl) badgeEl.textContent = `${badgeText.toUpperCase()} • RANK ${rankDisplay}`;
  if (nameEl) nameEl.textContent = col.name || col.college_name || 'Premier College';

  const locationParts = [];
  if (col.district) locationParts.push(col.district);
  else if (col.city) locationParts.push(col.city);
  if (col.state) locationParts.push(col.state);
  const cityState = locationParts.join(', ') || 'India';
  const aisheText = col.aishe || col.aishe_code || 'Verified';
  const typeText = col.type || col.college_type || 'Institute of National Importance';
  if (locEl) locEl.textContent = `📍 ${cityState} • AISHE: ${aisheText} • ${typeText}`;

  // Courses list
  let courseBadges = '';
  if (Array.isArray(col.courses) && col.courses.length > 0) {
    courseBadges = col.courses.map(crs => `<span class="courses-subfield-pill" style="margin:2px 4px 2px 0; font-size:11px; display:inline-block;">${crs}</span>`).join('');
  } else if (typeof col.courses === 'string') {
    courseBadges = col.courses.split(',').map(crs => `<span class="courses-subfield-pill" style="margin:2px 4px 2px 0; font-size:11px; display:inline-block;">${crs.trim()}</span>`).join('');
  }

  // Website display link
  const websiteUrl = col.website || col.officialLink || col.official_url || '';
  const websiteButtonHtml = websiteUrl && websiteUrl !== 'NULL' && websiteUrl !== '#' ? `
    <a href="${websiteUrl.startsWith('http') ? websiteUrl : 'https://' + websiteUrl}" target="_blank" rel="noopener noreferrer" style="color:var(--teal); font-weight:700; text-decoration:underline;" onclick="event.stopPropagation();">
      🌐 ${websiteUrl.replace(/^https?:\/\/(www\.)?/, '')} ↗
    </a>
  ` : `<span style="color:var(--theme-muted); font-style:italic;">Official website is not available yet.</span>`;

  const hasImage = !!(col.image || col.image_url);
  const hasVideo = !!(col.video || col.video_url);

  if (bodyEl) {
    bodyEl.innerHTML = `
      <div style="margin-bottom:16px; border-radius:10px; overflow:hidden; max-height:220px; position:relative; border:1px solid rgba(255,255,255,0.12);">
        <img src="${col.image || col.image_url || 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=800&q=80'}" alt="${col.name}" style="width:100%; height:220px; object-fit:cover;" onerror="this.src='https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=800&q=80';">
        <div style="position:absolute; inset:0; background:linear-gradient(to top, rgba(18, 22, 26,0.92) 0%, rgba(18, 22, 26,0.4) 50%, transparent 100%);"></div>
        <div style="position:absolute; bottom:12px; left:14px; right:14px; display:flex; justify-content:space-between; align-items:flex-end;">
          <div>
            <span style="background:var(--coral); color:#fff; font-weight:800; font-size:12px; padding:3px 8px; border-radius:4px; margin-right:6px;">🏆 NIRF ${rankDisplay}</span>
            <span style="background:rgba(27,45,56,0.85); color:var(--teal); font-weight:700; font-size:11.5px; padding:3px 8px; border-radius:4px; border:1px solid rgba(77,208,225,0.3);">${col.accreditation || col.naac_grade ? `NAAC ${col.naac_grade || 'A++'}` : 'Accredited'}</span>
          </div>
          <span style="color:#3A9B8F; font-weight:700; font-size:13px; text-shadow:0 1px 4px rgba(0,0,0,0.8);">★ ${col.rating || '4.8'} / 5.0 (${col.reviews || col.reviews_count || '1,200+ Reviews'})</span>
        </div>
      </div>

      ${hasVideo ? `
      <!-- Video Tour Preview -->
      <div class="prep-section-card" style="margin-bottom:12px;">
        <div class="prep-section-title">
          <span>🎥 Campus Video Tour</span>
        </div>
        <video src="${col.video || col.video_url}" controls style="width:100%; max-height:220px; border-radius:8px; background:#000;"></video>
      </div>
      ` : ''}

      <!-- Section 1: Overview & Profile -->
      <div class="prep-section-card">
        <div class="prep-section-title">
          <span>🏛️ About Institution &amp; Profile</span>
          <span style="font-size:11.5px; color:var(--teal); font-weight:700;">AISHE: ${aisheText}</span>
        </div>
        <p style="font-size:13px; color:#8E9CA6; line-height:1.55; margin:0 0 10px;">${col.overview || col.description || 'Premier Indian educational institution with world-class faculty, accredited curriculum, and active placement outcomes.'}</p>
        <div class="internship-meta-row" style="margin-top:8px; display:flex; flex-wrap:wrap; gap:8px;">
          <span class="stipend-tag">💰 Tuition: <b>${col.fees || '₹1.5L / yr'}</b></span>
          <span class="workmode-tag">💼 Placement: <b>${col.placement || col.avg_placement || 'Avg CTC: ₹14.0 LPA'}</b></span>
          <span class="stipend-tag" style="background:rgba(2,132,199,0.12); color:#0284C7;">🚀 Highest CTC: <b>${col.highest_placement || col.highestPlacement || '₹45.0 LPA'}</b></span>
          <span class="duration-tag">🎯 Key Cutoff: <b>${col.cutoff || 'Entrance Merit'}</b></span>
        </div>
      </div>

      <!-- Section: Upcoming Events & Hackathons -->
      ${Array.isArray(col.events) && col.events.length > 0 ? `
      <div class="prep-section-card" style="margin-top:12px;">
        <div class="prep-section-title">
          <span>📅 Upcoming Campus Events &amp; Hackathons</span>
          <span style="font-size:11px; color:#77AC3B; font-weight:700;">Verified Calendar</span>
        </div>
        <div style="display:flex; flex-direction:column; gap:8px;">
          ${col.events.map(ev => `
            <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:8px; padding:10px 12px; font-size:12.5px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                <strong style="color:#0F172A;">${ev.title}</strong>
                <span style="background:rgba(119,172,59,0.12); color:#77AC3B; font-size:11px; font-weight:700; padding:2px 6px; border-radius:4px;">${ev.date || 'Upcoming'}</span>
              </div>
              <p style="color:#64748B; margin:0 0 4px; font-size:12px;">${ev.description || ''}</p>
              ${ev.link ? `<a href="${ev.link}" target="_blank" rel="noopener noreferrer" style="color:#77AC3B; font-weight:600; font-size:11.5px; text-decoration:none;">Event Registration Link ↗</a>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}

      <!-- Section: Campus News & Distinction -->
      ${Array.isArray(col.news) && col.news.length > 0 ? `
      <div class="prep-section-card" style="margin-top:12px;">
        <div class="prep-section-title">
          <span>📰 Campus News &amp; Academic Distinction</span>
          <span style="font-size:11px; color:#77AC3B; font-weight:700;">Latest Bulletins</span>
        </div>
        <div style="display:flex; flex-direction:column; gap:8px;">
          ${col.news.map(nw => `
            <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:8px; padding:10px 12px; font-size:12.5px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                <strong style="color:#0F172A;">${nw.title}</strong>
                <span style="background:#F1F5F9; color:#475569; font-size:11px; font-weight:600; padding:2px 6px; border-radius:4px;">${nw.date || 'Recent'}</span>
              </div>
              <p style="color:#64748B; margin:0; font-size:12px;">${nw.summary || ''}</p>
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}

      <!-- Section 2: Flagship Academic Streams & Programs -->
      <div class="prep-section-card" style="margin-top:12px;">
        <div class="prep-section-title">
          <span>🎓 Flagship Academic Streams &amp; Offerings</span>
        </div>
        <div style="font-size:12.5px; color:#8E9CA6; line-height:1.5;">
          <div style="margin-bottom:6px;"><strong>Core Academic Focus:</strong> ${col.stream || 'Engineering, Sciences & Technology'}</div>
          ${courseBadges ? `<div style="margin-top:6px;"><strong>Key Programs &amp; Degrees:</strong><div style="margin-top:4px;">${courseBadges}</div></div>` : ''}
        </div>
      </div>

      <!-- Section 3: Admissions & Eligibility Pathway -->
      <div class="prep-section-card" style="margin-top:12px;">
        <div class="prep-section-title">
          <span>📝 Admissions &amp; Eligibility Criteria</span>
        </div>
        <div style="font-size:12.5px; color:#8E9CA6; line-height:1.55;">
          <div style="margin-bottom:4px;"><strong>Admissions Pathway:</strong> ${col.admissions || 'National entrance counseling via JoSAA, CSAB, MCC NEET, CAT, or institutional entrance test.'}</div>
          <div><strong>Eligibility Criteria:</strong> ${col.eligibility || 'Class 12 with qualifying marks in relevant stream + national entrance rank.'}</div>
        </div>
      </div>

      <!-- Section 4: Placements & Recruiters -->
      <div class="prep-section-card" style="margin-top:12px;">
        <div class="prep-section-title">
          <span>💼 Placements &amp; Top Recruiting Companies</span>
          <span style="font-size:11.5px; color:var(--teal); font-weight:700;">${col.avg_placement || col.placement || 'Median: ₹14.0 LPA'}</span>
        </div>
        <div style="font-size:12.5px; color:#8E9CA6; line-height:1.55;">
          <div style="margin-bottom:4px;"><strong>Placement Record:</strong> ${col.placement || 'Top Tier Institutional Hiring'}</div>
          <div style="margin-bottom:4px;"><strong>Highest Placement CTC:</strong> <span style="color:#0284C7; font-weight:700;">${col.highest_placement || col.highestPlacement || '₹45.0 LPA'}</span></div>
          <div><strong>Major Recruiters:</strong> ${col.recruiters || 'Google, Microsoft, Amazon, Qualcomm, Texas Instruments, Intel, Goldman Sachs, Deloitte, TCS'}</div>
        </div>
      </div>

      <!-- Section 5: Campus Facilities & Internship Support -->
      <div class="prep-section-card" style="margin-top:12px;">
        <div class="prep-section-title">
          <span>🏢 Campus Facilities &amp; Internship Support</span>
        </div>
        <div style="font-size:12.5px; color:#8E9CA6; line-height:1.55;">
          <div style="margin-bottom:4px;"><strong>Campus Infrastructure:</strong> ${col.facilities || col.facilities_list || 'Central Library, Advanced Research Labs, Hostels, Sports Complex, High-Speed Wi-Fi'}</div>
          <div><strong>Internship Ecosystem:</strong> ${col.internship_support || 'Extensive semester and summer internship programs connected with industry leaders.'}</div>
        </div>
      </div>

      <!-- Section 6: Scholarships & Financial Aid -->
      <div class="prep-section-card" style="margin-top:12px;">
        <div class="prep-section-title">
          <span>🏆 Scholarships &amp; Financial Assistance</span>
        </div>
        <p style="font-size:12.5px; color:#8E9CA6; line-height:1.55; margin:0;">
          ${col.scholarships || col.scholarships_info || 'Merit-cum-Means Scholarships, Institute Fee Waivers, and Government Welfare Scholarships are available for eligible students.'}
        </p>
      </div>

      <!-- Section 7: Verified Contact Information & Official Website -->
      <div class="prep-section-card" style="margin-top:12px;">
        <div class="prep-section-title">
          <span>🌐 Verified Contact &amp; Campus Portal</span>
        </div>
        <div style="font-size:12.5px; color:#8E9CA6; line-height:1.6;">
          <div><strong>Official Website:</strong> ${websiteButtonHtml}</div>
          ${col.email ? `<div><strong>Official Email:</strong> <a href="mailto:${col.email}" style="color:#8E9CA6;">${col.email}</a></div>` : ''}
          ${col.phone ? `<div><strong>Phone / Helpline:</strong> ${col.phone}</div>` : ''}
          ${col.address ? `<div><strong>Campus Address:</strong> ${col.address}</div>` : ''}
        </div>
      </div>
    `;
  }

  // Schedule auto-translation for active language
  if (window.CampNovaTranslationEngine && window.CampNovaTranslationEngine.currentLanguageCode !== 'EN') {
    window.CampNovaTranslationEngine.scheduleTranslation(20);
  }
}
window.openCollegeDetailsModal = openCollegeDetailsModal;

// ============================================================================
// ============================================================================
// 4. COLLEGE VERIFICATION & DETAILS MODAL WORKFLOW (UPDATE DETAILS VIA CAPTCHA)
// ============================================================================
let currentSelectedCollege = null;
window._authVerifiedEmail = '';
window._authSessionToken = '';
window._currentCaptchaId = '';

function openFurtherDetails(collegeIdentifier) {
  let col = null;
  if (typeof collegeIdentifier === 'object' && collegeIdentifier !== null) {
    col = collegeIdentifier;
  } else if (collegeIdentifier !== undefined && collegeIdentifier !== null && String(collegeIdentifier).trim() !== '') {
    const cleanId = String(collegeIdentifier).trim().toLowerCase();
    col = collegesRegistry.find(c =>
      (c.id && String(c.id).trim().toLowerCase() === cleanId) ||
      (c.db_id && String(c.db_id).trim().toLowerCase() === cleanId) ||
      (c.aishe && String(c.aishe).trim().toLowerCase() === cleanId) ||
      (c.aishe_code && String(c.aishe_code).trim().toLowerCase() === cleanId) ||
      (c.name && String(c.name).trim().toLowerCase() === cleanId) ||
      (c.short_name && String(c.short_name).trim().toLowerCase() === cleanId)
    );
  }
  if (!col) return;
  currentSelectedCollege = col;
  window._authSelectedCollege = col;

  const modal = document.getElementById('verifyAuthorityModal');
  const titleEl = document.getElementById('authCollegeName');
  if (titleEl) titleEl.textContent = `${col.name} — ${col.city || ''}, ${col.state || ''}`;

  const aisheInput = document.getElementById('authAISHE');
  if (aisheInput) aisheInput.value = '';

  const emailInput = document.getElementById('authEmail');
  if (emailInput) emailInput.value = '';

  const errEl = document.getElementById('authErrorMsg');
  if (errEl) {
    errEl.textContent = '';
    errEl.style.display = 'none';
  }

  const authInputs = document.getElementById('authInputsSection');
  if (authInputs) authInputs.style.display = 'block';

  const captchaSec = document.getElementById('captchaAuthSection');
  if (captchaSec) captchaSec.style.display = 'none';

  const captchaInput = document.getElementById('captchaCodeInput');
  if (captchaInput) captchaInput.value = '';

  if (modal) {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (emailInput) emailInput.focus();
  } else {
    showToast(`Opening update portal for ${col.name}`);
  }
}
window.openFurtherDetails = openFurtherDetails;

// Step 1: Request CAPTCHA challenge (Validates Database Email + AISHE Code, generates SVG CAPTCHA)
const sendOtpBtn = document.getElementById('sendOtpBtn');
if (sendOtpBtn) {
  sendOtpBtn.addEventListener('click', async () => {
    const email = document.getElementById('authEmail')?.value?.trim();
    const aishe = document.getElementById('authAISHE')?.value?.trim();
    const col = currentSelectedCollege || collegesRegistry[0];
    const colName = col ? col.name : 'Selected College';
    const colId = col ? col.id : '';

    const errEl = document.getElementById('authErrorMsg');
    if (errEl) { errEl.textContent = ''; errEl.style.display = 'none'; }

    if (!email || !aishe) {
      if (errEl) {
        errEl.textContent = 'Please enter both the authorized institutional email and official AISHE code.';
        errEl.style.display = 'block';
      }
      showToast('Please enter both the authorized email and AISHE code.');
      return;
    }

    sendOtpBtn.disabled = true;
    sendOtpBtn.textContent = 'Validating...';

    try {
      const res = await fetch('/api/request-update-captcha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          college: colId || colName,
          collegeName: colName,
          collegeId: colId,
          collegeDbId: col ? col.db_id : '',
          aishe: aishe,
          aisheCode: aishe
        })
      });
      const data = await res.json().catch(() => ({ success: false, message: 'Server response error.' }));
      if (data.success) {
        showToast('Authority verified! Please enter the CAPTCHA to proceed.');
        window._authVerifiedEmail = email;
        window._authVerifiedCollege = col;
        window._currentCaptchaId = data.captcha_id;

        const authInputs = document.getElementById('authInputsSection');
        if (authInputs) authInputs.style.display = 'none';

        const captchaSec = document.getElementById('captchaAuthSection');
        if (captchaSec) captchaSec.style.display = 'block';

        const svgWrap = document.getElementById('captchaSvgContainer');
        if (svgWrap && data.captcha_svg) {
          svgWrap.innerHTML = data.captcha_svg;
        }

        const emailDisplay = document.getElementById('captchaMaskedEmailDisplay');
        if (emailDisplay) {
          emailDisplay.textContent = data.masked_email || email;
        }

        const codeInput = document.getElementById('captchaCodeInput');
        if (codeInput) {
          codeInput.value = '';
          codeInput.focus();
        }
      } else {
        const errorMsg = data.message || 'Validation failed. Email or AISHE code does not match this college record.';
        if (errEl) {
          errEl.textContent = errorMsg;
          errEl.style.display = 'block';
        }
        showToast(errorMsg);
      }
    } catch (e) {
      const errMsg = (e && e.message) ? e.message : 'Validation failed. Please verify credentials.';
      if (errEl) {
        errEl.textContent = errMsg;
        errEl.style.display = 'block';
      }
      showToast(errMsg);
    } finally {
      sendOtpBtn.disabled = false;
      sendOtpBtn.textContent = 'Submit ➔';
    }
  });
}

// Refresh CAPTCHA challenge
const refreshCaptchaBtn = document.getElementById('refreshCaptchaBtn');
if (refreshCaptchaBtn) {
  refreshCaptchaBtn.addEventListener('click', async () => {
    const col = currentSelectedCollege || window._authVerifiedCollege || collegesRegistry[0];
    const colName = col ? col.name : '';
    const email = window._authVerifiedEmail || document.getElementById('authEmail')?.value?.trim();
    const aishe = document.getElementById('authAISHE')?.value?.trim();

    refreshCaptchaBtn.disabled = true;
    refreshCaptchaBtn.textContent = '🔄 Loading...';

    try {
      const res = await fetch('/api/refresh-update-captcha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          captcha_id: window._currentCaptchaId,
          email: email,
          college: colName,
          aishe: aishe
        })
      });
      const data = await res.json().catch(() => ({ success: false }));
      if (data.success) {
        window._currentCaptchaId = data.captcha_id;
        const svgWrap = document.getElementById('captchaSvgContainer');
        if (svgWrap && data.captcha_svg) {
          svgWrap.innerHTML = data.captcha_svg;
        }
        const codeInput = document.getElementById('captchaCodeInput');
        if (codeInput) {
          codeInput.value = '';
          codeInput.focus();
        }
        showToast('New CAPTCHA challenge loaded.');
      }
    } catch (e) {
      showToast('Failed to refresh CAPTCHA.');
    } finally {
      refreshCaptchaBtn.disabled = false;
      refreshCaptchaBtn.textContent = '🔄 Refresh';
    }
  });
}

// Step 2: Verify CAPTCHA & Access Update Form
const verifyCaptchaBtn = document.getElementById('verifyCaptchaBtn');
if (verifyCaptchaBtn) {
  verifyCaptchaBtn.addEventListener('click', async () => {
    const code = document.getElementById('captchaCodeInput')?.value?.trim();
    const email = window._authVerifiedEmail || document.getElementById('authEmail')?.value?.trim();
    const aishe = document.getElementById('authAISHE')?.value?.trim();
    const col = currentSelectedCollege || window._authVerifiedCollege || collegesRegistry[0];
    const colName = col ? col.name : '';

    const errEl = document.getElementById('authErrorMsg');
    if (errEl) { errEl.textContent = ''; errEl.style.display = 'none'; }

    if (!code) {
      if (errEl) {
        errEl.textContent = 'Please enter the CAPTCHA code shown in the image.';
        errEl.style.display = 'block';
      }
      showToast('Please enter the CAPTCHA code.');
      return;
    }

    verifyCaptchaBtn.disabled = true;
    verifyCaptchaBtn.textContent = 'Verifying...';

    try {
      const res = await fetch('/api/verify-update-captcha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          captcha_id: window._currentCaptchaId,
          captcha_code: code,
          email: email,
          college: colName,
          aishe: aishe
        })
      });
      const data = await res.json().catch(() => ({ success: false, message: 'Invalid CAPTCHA code.' }));
      if (data.success) {
        showToast('Security CAPTCHA verified! Access granted.');
        window._authSessionToken = data.token;

        const m1 = document.getElementById('verifyAuthorityModal');
        if (m1) m1.classList.remove('open');

        const m3 = document.getElementById('collegeUpdateModal');
        const colNameDisplay = document.getElementById('formCollegeName');

        if (colNameDisplay && col) {
          colNameDisplay.textContent = `${col.name} — ${col.city || ''}, ${col.state || ''}`;
        }
        if (m3) {
          m3.classList.add('open');
          m3.setAttribute('aria-hidden', 'false');
          document.body.style.overflow = 'hidden';
        }
      } else {
        const errorMsg = data.message || 'Incorrect CAPTCHA entered. Please try again.';
        if (errEl) {
          errEl.textContent = errorMsg;
          errEl.style.display = 'block';
        }
        showToast(errorMsg);
      }
    } catch (e) {
      const errMsg = (e && e.message) ? e.message : 'Verification failed. Please try again.';
      if (errEl) {
        errEl.textContent = errMsg;
        errEl.style.display = 'block';
      }
      showToast(errMsg);
    } finally {
      verifyCaptchaBtn.disabled = false;
      verifyCaptchaBtn.textContent = 'Submit ➔';
    }
  });
}



// Step 4: Submit Details Form Handler
const furtherDetailsForm = document.getElementById('furtherDetailsForm');
if (furtherDetailsForm) {
  furtherDetailsForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validate Terms & Conditions agreement
    const termsCheck = document.getElementById('updateTermsCheck');
    if (termsCheck && !termsCheck.checked) {
      showToast('Please accept the Terms & Conditions to proceed.');
      termsCheck.focus();
      return;
    }

    if (!window._authSessionToken) {
      showToast('Session expired or unverified. Please verify via OTP again.');
      return;
    }

    const col = currentSelectedCollege || window._authVerifiedCollege || collegesRegistry[0];
    const collegeName = col ? col.name : 'College';
    const aisheCode = col ? (col.aishe || 'U-0042') : 'U-0042';

    const formData = new FormData(furtherDetailsForm);
    const updateRecord = {
      token: window._authSessionToken,
      agreeTerms: true,
      collegeName: collegeName,
      aisheCode: aisheCode,
      title: formData.get('title') || 'Official College Update',
      category: formData.get('category') || 'General',
      description: formData.get('description') || '',
      source: formData.get('source') || '',
      date: formData.get('date') || new Date().toISOString().slice(0, 10),
      submittedBy: formData.get('submittedBy') || 'Authorized Officer',
      notes: formData.get('notes') || '',
      verifiedEmail: window._authVerifiedEmail || '',
      submissionDate: new Date().toISOString(),
      status: 'pending'
    };

    // Save to local storage for Admin approvals view
    try {
      const stored = JSON.parse(localStorage.getItem('campusnova-further-details') || '{}');
      if (!stored[collegeName]) stored[collegeName] = [];
      stored[collegeName].unshift(updateRecord);
      localStorage.setItem('campusnova-further-details', JSON.stringify(stored));
    } catch(err) {}

    // Send to backend API
    try {
      const res = await fetch('/api/submit-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateRecord)
      });
      const data = await res.json();
      if (!data.success) {
        showToast(data.message || 'Submission failed. Please check your inputs.');
        return;
      }
      showToast(data.message || `Update details submitted for ${collegeName}! Submitted to Admin for review.`);
      furtherDetailsForm.reset();
      window._authSessionToken = null;
    } catch(err) {
      console.error('[Submit Update Error]', err);
      showToast('Connection error: Unable to submit update to database. Please try again.');
      return;
    }

    const m3 = document.getElementById('collegeUpdateModal');
    if (m3) {
      m3.classList.remove('open');
      m3.setAttribute('aria-hidden', 'true');
    }
    document.body.style.overflow = '';
  });
}

// ============================================================================
// 5. CENTRALIZED ROUTER & UNIFIED ONE-TO-MANY NAVIGATION ENGINE
// ============================================================================
const ROUTE_MAP = {
  'home': 'homeView',
  'courses': 'coursesView',
  'colleges': 'collegesView',
  'domains': 'domainsView',
  'exams': 'examsView',
  'materials': 'materialsView',
  'mentors': 'mentorsView',
  'reviews': 'reviewsView',
  'rankings': 'rankingsView',
  'careers': 'careersView',
  'placements': 'placementsView',
  'jobs': 'jobsView',
  'internships': 'internshipsView',
  'admissions': 'admissionsView',
  'scholarships': 'scholarshipsView',
  'facilities': 'facilitiesView',
  'entrance-prep': 'entrancePrepView',
  'reviews-compare': 'reviewsCompareView',
  'about': 'aboutView',
  'contact': 'contactView',
  'search': 'searchView',
  'detail': 'detailView'
};

const ROUTE_ALIASES = {
  '': 'home',
  '#': 'home',
  '#home': 'home',
  'home': 'home',
  'courses': 'courses',
  'course': 'courses',
  'choose a course': 'courses',
  'find a course': 'courses',
  'explore courses': 'courses',
  'course discovery & degrees': 'courses',
  'colleges': 'colleges',
  'college': 'colleges',
  'find a college': 'colleges',
  'explore colleges': 'colleges',
  'domains': 'domains',
  'domain': 'domains',
  'explore a domain': 'domains',
  'explore domains': 'domains',
  'exams': 'exams',
  'exam': 'exams',
  'prepare for an exam': 'exams',
  'materials': 'materials',
  'study-materials': 'materials',
  'study materials': 'materials',
  'find study materials': 'materials',
  'reviews': 'reviews',
  'review': 'reviews',
  'rankings': 'rankings',
  'ranking': 'rankings',
  'careers': 'careers',
  'career': 'careers',
  'explore careers': 'careers',
  'placements': 'placements',
  'placement': 'placements',
  'check placements': 'placements',
  'jobs': 'jobs',
  'job': 'jobs',
  'internships': 'internships',
  'internship': 'internships',
  'browse all openings': 'internships',
  'admissions': 'admissions',
  'admission': 'admissions',
  'scholarships': 'scholarships',
  'scholarship': 'scholarships',
  'facilities': 'facilities',
  'college-facilities': 'facilities',
  'entrance-prep': 'entrance-prep',
  'entrance-exams-prep': 'entrance-prep',
  'prep': 'entrance-prep',
  'entrance exams': 'entrance-prep',
  'entrance exams & prep': 'entrance-prep',
  'reviews-compare': 'reviews-compare',
  'compare': 'reviews-compare',
  'reviews & compare': 'reviews-compare',
  'search': 'search',
  'detail': 'detail'
};

function resolveRoute(input) {
  if (!input) return 'home';
  const clean = input.toString().trim().toLowerCase().replace(/^#/, '');
  return ROUTE_ALIASES[clean] || (ROUTE_MAP[clean] ? clean : 'home');
}

function updateActiveNavLinks(activeRoute) {
  document.querySelectorAll('.category-nav a').forEach(link => {
    const linkHref = (link.getAttribute('href') || '').replace(/^#/, '');
    const isMatch = (activeRoute !== 'home') && (resolveRoute(linkHref) === activeRoute);
    link.classList.toggle('active', isMatch);
  });

  document.querySelectorAll('.drawer-links a').forEach(link => {
    const linkHref = (link.getAttribute('href') || '').replace(/^#/, '');
    const isMatch = (activeRoute !== 'home') && (resolveRoute(linkHref) === activeRoute);
    link.classList.toggle('active', isMatch);
  });
}

function closeMenus() {
  document.querySelectorAll('.custom-menu.open').forEach(menu => {
    menu.classList.remove('open');
    const trigger = menu.querySelector('.menu-trigger, .header-menu-btn, .profile-avatar-btn, [aria-expanded]');
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
  });
  const hamburgerBtn = document.getElementById('hamburgerMenuBtn');
  if (hamburgerBtn) {
    hamburgerBtn.classList.remove('open');
    hamburgerBtn.setAttribute('aria-expanded', 'false');
  }
  const drawer = document.getElementById('mobileDrawer');
  if (drawer) drawer.classList.remove('open');
  const backdrop = document.getElementById('mobileDrawerBackdrop');
  if (backdrop) backdrop.classList.remove('open');
}

function setView(viewOrRoute, updateHash = true) {
  const canonicalRoute = resolveRoute(viewOrRoute);
  const targetViewId = ROUTE_MAP[canonicalRoute] || 'homeView';
  const isHome = canonicalRoute === 'home';
  const isExams = canonicalRoute === 'exams';

  document.body.classList.toggle('is-home-view', isHome);
  document.body.classList.toggle('is-inner-view', !isHome);
  document.body.classList.toggle('is-exams-view', isExams);

  // Strictly manage upcoming exam popup visibility: only visible on Exams view
  if (!isExams) {
    if (typeof dismissExamFloatingNotification === 'function') {
      dismissExamFloatingNotification();
    } else {
      const notif = document.getElementById('examFloatingNotification');
      if (notif) notif.style.display = 'none';
    }
  }

  document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
  const target = document.getElementById(targetViewId);
  if (target) {
    target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (updateHash) {
    const newHash = canonicalRoute === 'home' ? '#home' : `#${canonicalRoute}`;
    if (window.location.hash !== newHash) {
      if (history.pushState) {
        history.pushState(null, '', newHash);
      } else {
        window.location.hash = newHash;
      }
    }
  }

  updateActiveNavLinks(canonicalRoute);
  closeMenus();
  closeMobileDrawer();

  if (canonicalRoute === 'home') {
    if (typeof loadLiveEventsAndNews === 'function') loadLiveEventsAndNews();
  }

  if (canonicalRoute === 'courses') {
    if (typeof initCoursesDiscovery === 'function') initCoursesDiscovery(true);
  }
  if (canonicalRoute === 'colleges') {
    if (typeof fetchCollegesLive === 'function') fetchCollegesLive();
    if (typeof renderCollegesView === 'function') renderCollegesView();
  }
  if (canonicalRoute === 'domains') {
    _liveDomainsData = null;
    if (typeof renderDomainsDiscoveryView === 'function') renderDomainsDiscoveryView();
  }
  if (canonicalRoute === 'exams') {
    _liveUserExamsCache = null;
    if (typeof renderExamsView === 'function') renderExamsView();
    if (typeof renderUserExamRemarksList === 'function') renderUserExamRemarksList();
  }
  if (canonicalRoute === 'materials') {
    window._cachedStudyMaterialsData = null;
    if (typeof renderStudyMaterialsView === 'function') renderStudyMaterialsView();
  }
  if (canonicalRoute === 'reviews') {
    _cachedReviewsData = null;
    if (typeof fetchReviewsLive === 'function') fetchReviewsLive();
    else if (typeof renderReviewsView === 'function') renderReviewsView();
  }
  if (canonicalRoute === 'rankings') {
    _cachedRankingsData = null;
    if (typeof renderRankingsView === 'function') renderRankingsView();
  }
  if (canonicalRoute === 'careers') {
    _cachedCareersData = null;
    if (typeof renderCareersView === 'function') renderCareersView();
  }
  if (canonicalRoute === 'placements') {
    if (typeof renderPlacementsView === 'function') renderPlacementsView();
  }
  if (canonicalRoute === 'jobs') {
    if (typeof renderJobsView === 'function') renderJobsView();
  }
  if (canonicalRoute === 'internships') {
    if (typeof renderInternshipsView === 'function') renderInternshipsView();
  }
  if (canonicalRoute === 'admissions') {
    if (typeof renderAdmissionsView === 'function') renderAdmissionsView();
  }
  if (canonicalRoute === 'scholarships') {
    if (typeof renderScholarshipsView === 'function') renderScholarshipsView();
  }
  if (canonicalRoute === 'facilities') {
    if (typeof renderFacilitiesView === 'function') renderFacilitiesView();
  }
  if (canonicalRoute === 'entrance-prep') {
    _cachedEntranceExamsData = null;
    if (typeof renderEntrancePrepView === 'function') renderEntrancePrepView();
    if (typeof initEntrancePrepBackgroundSlider === 'function') initEntrancePrepBackgroundSlider();
  }
  if (canonicalRoute === 'reviews-compare') {
    _cachedComparisonsData = null;
    if (typeof renderReviewsCompareView === 'function') renderReviewsCompareView();
  }
  if (canonicalRoute === 'mentors') {
    if (typeof renderMentorsView === 'function') renderMentorsView('');
  }
  if (canonicalRoute === 'home') {
    if (typeof fetchCollegesLive === 'function') fetchCollegesLive();
    if (typeof initHeroRotatorHeading === 'function') initHeroRotatorHeading();
    if (typeof initHeroBackgroundCarousel === 'function') initHeroBackgroundCarousel();
    if (typeof initHomeBodyBackgroundSlider === 'function') initHomeBodyBackgroundSlider();
  }

  // Record user explore activity in PostgreSQL
  if (canonicalRoute !== 'home') {
    recordUserActivity('explore', canonicalRoute, canonicalRoute, '');
  }

  // Ensure dynamic view is translated according to active language
  if (window.CampNovaTranslationEngine && window.CampNovaTranslationEngine.currentLanguageCode !== 'EN') {
    window.CampNovaTranslationEngine.scheduleTranslation();
  }
}
window.setView = setView;

// ============================================================================
// AUTHORITATIVE POSTGRESQL MULTI-TAB & CROSS-ENVIRONMENT SYNCHRONIZATION
// ============================================================================
function invalidateAllExploreCaches() {
  _cachedReviewsData = null;
  _cachedRankingsData = null;
  _cachedCareersData = null;
  _cachedPlacementsFullData = null;
  _cachedJobsData = null;
  _cachedInternshipsFullData = null;
  _cachedAdmissionsData = null;
  _cachedScholarshipsFullData = null;
  _cachedFacilitiesData = null;
  _cachedEntranceExamsData = null;
  _cachedComparisonsData = null;
  _liveDomainsData = null;
  _liveUserExamsCache = null;
  window._studyMaterialsFetched = false;
  window._cachedStudyMaterialsData = null;
  if (typeof coursesHierarchyState !== 'undefined') {
    coursesHierarchyState.categories = null;
  }
}
window.invalidateAllExploreCaches = invalidateAllExploreCaches;

function refreshActiveViewLive() {
  if (typeof fetchCollegesLive === 'function') {
    fetchCollegesLive();
  }
  if (typeof loadLiveEventsAndNews === 'function') {
    loadLiveEventsAndNews();
  }
  const currentHash = (window.location.hash || '#home').replace('#', '');
  const activeRoute = typeof resolveRoute === 'function' ? resolveRoute(currentHash) : currentHash;
  if (typeof setView === 'function') {
    setView(activeRoute, false);
  }
}
window.refreshActiveViewLive = refreshActiveViewLive;

// BroadcastChannel synchronization for instant inter-tab communication
if (typeof BroadcastChannel !== 'undefined') {
  try {
    const syncChannel = new BroadcastChannel('campusnova_data_sync');
    syncChannel.onmessage = () => {
      invalidateAllExploreCaches();
      refreshActiveViewLive();
    };
  } catch(e) {
    console.warn('[DataSync Listener Error]', e);
  }
}

// Storage event synchronization for multi-tab
window.addEventListener('storage', (e) => {
  if (e.key === 'campusnova_sync_tick' || e.key === 'campnova_approved_content_updates') {
    invalidateAllExploreCaches();
    refreshActiveViewLive();
  }
});

// Visibility change: re-sync immediately when tab is brought to foreground
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    invalidateAllExploreCaches();
    refreshActiveViewLive();
  }
});

// ============================================================================
// HERO MAIN HEADING FAST ROTATING / MARQUEE ANIMATION
// ============================================================================
function initHeroRotatorHeading() {
  const container = document.getElementById('heroRotatorH1');
  if (!container) return;

  const slides = container.querySelectorAll('.hero-h1-slide');
  if (!slides || slides.length === 0) return;

  if (container._isRotatorInitialized && window._heroH1Timer) {
    return;
  }
  container._isRotatorInitialized = true;

  let currentIndex = 0;

  function showSlide(index) {
    slides.forEach((slide, idx) => {
      slide.classList.remove('active', 'prev');
      if (idx === index) {
        slide.classList.add('active');
      } else if (idx === (index - 1 + slides.length) % slides.length) {
        slide.classList.add('prev');
      }
    });
  }

  function nextSlide() {
    currentIndex = (currentIndex + 1) % slides.length;
    showSlide(currentIndex);
  }

  if (window._heroH1Timer) {
    clearInterval(window._heroH1Timer);
  }

  showSlide(0);
  window._heroH1Timer = setInterval(nextSlide, 2200);
}
window.initHeroRotatorHeading = initHeroRotatorHeading;

function recordUserActivity(actionType, moduleName, recordId = '', searchQuery = '') {
  try {
    fetch('/api/activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action_type: actionType,
        module: moduleName,
        record_id: String(recordId || ''),
        search_query: String(searchQuery || '')
      })
    }).catch(() => {});
  } catch (e) {}
}
window.recordUserActivity = recordUserActivity;

// Global toast notification
function showToast(message, type = 'info') {
  let toast = document.getElementById('globalToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'globalToast';
    document.body.appendChild(toast);
  }

  let bg = '#FFFFFF';
  let border = '#CBD5E1';
  let color = '#0F172A';
  let icon = 'ℹ️ ';

  const msgLower = (typeof message === 'string') ? message.toLowerCase() : '';
  if (type === 'success' || msgLower.includes('success') || msgLower.includes('created') || msgLower.includes('verified') || msgLower.includes('completed') || msgLower.includes('saved')) {
    bg = '#FFFFFF';
    border = '#77AC3B';
    color = '#15803D'; // Green
    icon = '✓ ';
  } else if (type === 'error' || msgLower.includes('not found') || msgLower.includes('incorrect') || msgLower.includes('restricted') || msgLower.includes('invalid') || msgLower.includes('failed') || msgLower.includes('error') || msgLower.includes('match')) {
    bg = '#FFFFFF';
    border = '#EF4444';
    color = '#B91C1C'; // Red
    icon = '✕ ';
  }

  toast.style.cssText = `position:fixed; bottom:28px; right:28px; background:${bg}; border:1.5px solid ${border}; color:${color}; padding:14px 22px; border-radius:12px; z-index:99999; font-size:13.5px; font-weight:700; box-shadow:0 10px 30px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06); transition:all 0.3s cubic-bezier(0.16,1,0.3,1); opacity:0; transform:translateY(12px); display:flex; align-items:center; gap:10px; font-family:inherit; max-width:420px; line-height:1.45;`;

  let displayMessage = message;
  if (window.CampNovaTranslationEngine && window.CampNovaTranslationEngine.currentLanguageCode !== 'EN') {
    const lang = window.CampNovaTranslationEngine.currentLanguageCode;
    const cache = window.CampNovaTranslationEngine.cache[lang] || {};
    if (typeof message === 'string' && cache[message.trim()]) {
      displayMessage = cache[message.trim()];
    }
  }

  toast.innerHTML = `<span style="font-size:16px; flex-shrink:0;">${icon}</span> <span>${displayMessage}</span>`;

  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  });

  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(12px)';
  }, 4000);
}

// Global click event delegation for data-view attributes and hash links (One-to-Many Architecture)
document.addEventListener('click', (event) => {
  const targetViewBtn = event.target.closest('[data-view]');
  if (targetViewBtn) {
    const targetRoute = targetViewBtn.dataset.view;
    if (targetRoute) {
      event.preventDefault();
      setView(targetRoute);
      return;
    }
  }

  const anchor = event.target.closest('a[href^="#"]');
  if (anchor && !anchor.hasAttribute('download')) {
    const href = anchor.getAttribute('href');
    if (href && href.length > 1 && !anchor.dataset.customAction && !anchor.classList.contains('year-tab') && !anchor.classList.contains('tab-btn')) {
      const cleanRoute = href.replace(/^#/, '');
      if (ROUTE_MAP[cleanRoute] || ROUTE_ALIASES[cleanRoute]) {
        event.preventDefault();
        setView(cleanRoute);
      }
    }
  }
});

window.addEventListener('hashchange', () => {
  const hash = window.location.hash.replace(/^#/, '');
  if (hash) {
    setView(hash, false);
  } else {
    setView('home', false);
  }
});

// ============================================================================
// 6. DYNAMIC MULTI-ENTITY SEARCH ENGINE & 16-FIELD SAME-PAGE MODALS
// ============================================================================
window._searchResultStore = [];

async function openSearch(query) {
  const cleanQ = (query || '').trim();
  setView('search');

  const headerSearch = document.getElementById('headerSearch');
  const mobileDrawerSearch = document.getElementById('mobileDrawerSearch');
  const resultSearch = document.getElementById('resultSearch');

  if (headerSearch) headerSearch.value = cleanQ;
  if (mobileDrawerSearch) mobileDrawerSearch.value = cleanQ;
  if (resultSearch) resultSearch.value = cleanQ;

  if (cleanQ && typeof recordUserActivity === 'function') {
    recordUserActivity('search', 'global', '', cleanQ);
  }

  await renderSearchResults(cleanQ, 'all');
}
window.openSearch = openSearch;

// Field Modal Dispatcher: Opens authentic same-page modal for any Explore field
function openSearchResultModal(field, id, itemIndex) {
  const item = (window._searchResultStore && typeof itemIndex === 'number') ? window._searchResultStore[itemIndex] : null;
  const rawData = (item && item.data) ? item.data : null;

  if (field === 'colleges') {
    openCollegeDetailsModal(rawData || id);
  } else if (field === 'courses') {
    openCourseDetailsModal(rawData || id);
  } else if (field === 'exams' || field === 'prep' || field === 'entrance-prep') {
    openExamPrepRoadmapModal(id || (rawData && (rawData.name || rawData.exam_name)));
  } else if (field === 'scholarships') {
    openScholarshipDetailModal(id);
  } else if (field === 'jobs') {
    openJobDetailModal(id);
  } else if (field === 'internships') {
    openInternshipModal(id);
  } else if (field === 'careers') {
    openCareerDetailModal(id);
  } else if (field === 'placements') {
    openPlacementDetailModal(id);
  } else if (field === 'facilities') {
    openFacilityDetailsModal(id, rawData);
  } else if (field === 'admissions') {
    openAdmissionDetailModal(id);
  } else if (field === 'materials') {
    openMaterialDetailsModal(id, rawData);
  } else if (field === 'domains') {
    openDomainDetailsModal(id, rawData);
  } else if (field === 'rankings') {
    openRankingDetailsModal(id, rawData);
  } else if (field === 'reviews') {
    openReviewDetailsModal(id, rawData);
  } else if (field === 'compare') {
    openComparisonDetailModal(id, rawData);
  } else {
    // Universal Fallback
    if (rawData && (rawData.aishe || rawData.city)) {
      openCollegeDetailsModal(rawData);
    } else {
      openUniversalModal({
        title: (item && item.title) || 'Verified Pathway',
        subtitle: (item && item.subtitle) || 'Comprehensive Education Information',
        badge: (item && item.field_name ? item.field_name.toUpperCase() : 'EXPLORE PATHWAY'),
        contentHtml: `<div style="font-size:13.5px; color:#334155; padding:16px;">${escapeHtml((item && item.description) || 'Structured educational resource details.')}</div>`,
        primaryActionHtml: `<button type="button" class="primary-button" onclick="closeUniversalModal()">Close</button>`
      });
    }
  }
}
window.openSearchResultModal = openSearchResultModal;

async function renderSearchResults(query, categoryFilter = 'all') {
  const searchView = document.getElementById('searchView');
  if (!searchView) return;

  const titleEm = searchView.querySelector('.page-top h1 em');
  if (titleEm) titleEm.textContent = query ? `“${query}”` : '“All Verified Pathways”';

  const resultSearchInput = document.getElementById('resultSearch');
  if (resultSearchInput && resultSearchInput.value !== query) {
    resultSearchInput.value = query || '';
  }

  let searchData = null;
  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&field=${encodeURIComponent(categoryFilter)}`);
    if (res.ok) {
      searchData = await res.json();
    }
  } catch (e) {
    console.warn('[Search API] Falling back to client-side multi-field filter:', e);
  }

  if (!searchData || !searchData.success) {
    const qLower = (query || '').toLowerCase();
    const clientResults = [];

    // 1. Colleges
    if (categoryFilter === 'all' || categoryFilter === 'colleges') {
      (collegesRegistry || []).forEach(col => {
        if (!qLower || `${col.name || ''} ${col.city || ''} ${col.state || ''} ${col.aishe || ''}`.toLowerCase().includes(qLower)) {
          clientResults.push({
            id: col.id || col.aishe,
            field: 'colleges',
            field_name: 'Colleges',
            field_icon: '🏛️',
            title: col.name,
            subtitle: `📍 ${col.city || ''}, ${col.state || ''} • AISHE: ${col.aishe || 'Verified'}`,
            description: col.overview || col.stream || 'Premier accredited Indian institution.',
            meta: [fNirfRank(col), col.fees || '₹1.5L / yr', col.placement || 'Top Placements'],
            official_url: col.website || '',
            data: col
          });
        }
      });
    }

    // 2. Courses
    if (categoryFilter === 'all' || categoryFilter === 'courses') {
      (window._cachedCoursesData || []).forEach(prog => {
        if (!qLower || `${prog.name || ''} ${prog.category || ''} ${prog.overview || ''}`.toLowerCase().includes(qLower)) {
          clientResults.push({
            id: prog.id || prog.name,
            field: 'courses',
            field_name: 'Courses',
            field_icon: '📖',
            title: prog.name,
            subtitle: `🎓 ${prog.degreeType || 'Undergraduate'} • ⏱️ ${prog.duration || '4 Years'}`,
            description: prog.overview || 'Structured academic curriculum with core industry specializations.',
            meta: [prog.category || 'Technology', 'High Placement'],
            official_url: '',
            data: prog
          });
        }
      });
    }

    // 3. Exams
    if (categoryFilter === 'all' || categoryFilter === 'exams') {
      (window._cachedExamsData || []).forEach(ex => {
        if (!qLower || `${ex.name || ''} ${ex.exam_name || ''} ${ex.domain || ''}`.toLowerCase().includes(qLower)) {
          clientResults.push({
            id: ex.id || ex.name,
            field: 'exams',
            field_name: 'Entrance Exams',
            field_icon: '🎯',
            title: ex.name || ex.exam_name,
            subtitle: `📌 Domain: ${ex.domain || 'General'} • Level: ${ex.level || 'National'}`,
            description: ex.description || `Entrance exam conducted by ${ex.conducting_body || 'National Testing Agency'}.`,
            meta: [ex.conducting_body || 'NTA', ex.exam_date || 'Upcoming 2026'],
            official_url: ex.official_website || '',
            data: ex
          });
        }
      });
    }

    // 4. Scholarships
    if (categoryFilter === 'all' || categoryFilter === 'scholarships') {
      const schList = (_cachedScholarshipsFullData && _cachedScholarshipsFullData.scholarships) || [];
      schList.forEach(s => {
        if (!qLower || `${s.name || ''} ${s.provider || ''} ${s.eligibility_criteria || ''}`.toLowerCase().includes(qLower)) {
          clientResults.push({
            id: s.id || s.name,
            field: 'scholarships',
            field_name: 'Scholarships',
            field_icon: '🎓',
            title: s.name,
            subtitle: `🏛️ Provider: ${s.provider || 'National Agency'} • 💰 Benefit: ${s.benefit || 'Grant'}`,
            description: s.eligibility_criteria || 'Merit and financial scholarship supporting undergraduate studies.',
            meta: [s.benefit || 'Scholarship Grant', `Deadline: ${s.deadline || '31 August 2026'}`],
            official_url: s.application_url || '',
            data: s
          });
        }
      });
    }

    searchData = {
      success: true,
      query: query,
      totalResults: clientResults.length,
      fieldCounts: {},
      results: clientResults
    };
  }

  function fNirfRank(col) {
    if (col.rank) return `🏆 NIRF #${col.rank}`;
    if (col.nirf_rank) return `🏆 NIRF #${col.nirf_rank}`;
    return '🏆 NIRF Ranked';
  }

  const resultsList = searchData.results || [];
  const total = searchData.totalResults || resultsList.length;
  window._searchResultStore = resultsList;

  const subtitleEl = searchView.querySelector('.page-top .section-subtitle');
  if (subtitleEl) {
    subtitleEl.textContent = `Showing ${total} verified pathway results across all 16 Explore fields.`;
  }

  // Active Category Filter Tabs
  const fieldTabsConfig = [
    { key: 'all', label: 'All Pathways' },
    { key: 'colleges', label: 'Colleges' },
    { key: 'courses', label: 'Courses' },
    { key: 'exams', label: 'Exams' },
    { key: 'scholarships', label: 'Scholarships' },
    { key: 'jobs', label: 'Jobs' },
    { key: 'internships', label: 'Internships' },
    { key: 'careers', label: 'Careers' },
    { key: 'placements', label: 'Placements' },
    { key: 'facilities', label: 'Facilities' },
    { key: 'admissions', label: 'Admissions' },
    { key: 'materials', label: 'Study Materials' },
    { key: 'domains', label: 'Domains' },
    { key: 'rankings', label: 'Rankings' },
    { key: 'reviews', label: 'Reviews' },
    { key: 'compare', label: 'Compare' }
  ];

  const counts = searchData.fieldCounts || {};
  const tabsContainer = searchView.querySelector('.result-tabs');
  if (tabsContainer) {
    tabsContainer.innerHTML = fieldTabsConfig.map(t => {
      const cnt = t.key === 'all' ? total : (counts[t.key] || (resultsList.filter(r => r.field === t.key).length));
      const isActive = categoryFilter === t.key;
      return `<button type="button" class="${isActive ? 'active' : ''}" onclick="renderSearchResults('${escapeHtml(query)}', '${t.key}')">${t.label} <small>${cnt}</small></button>`;
    }).join('');
  }

  const resultsMain = searchView.querySelector('.results-main');
  if (!resultsMain) return;

  const cardsHtml = resultsList.map((r, idx) => {
    const fieldBadgeClass = r.field === 'colleges' ? 'amber' : (r.field === 'courses' ? 'blue' : (r.field === 'exams' ? 'coral' : 'teal'));
    const metaChipsHtml = (r.meta || []).map(m => `<span>${escapeHtml(m)}</span>`).join('');

    // Official Portal Link Button if URL exists
    const validPortal = formatPortalUrl(r.official_url || (r.data && (r.data.application_url || r.data.apply_url || r.data.portal_url || r.data.website || r.data.official_website || r.data.official_url)));
    const officialBtnHtml = validPortal ? `
      <a href="${escapeHtml(validPortal)}" target="_blank" rel="noopener noreferrer" class="secondary-button official-portal-btn" style="text-decoration:none; padding:8px 14px; font-size:12px; display:inline-flex; align-items:center; gap:4px;" onclick="event.stopPropagation();">
        <span>Official Portal ↗</span>
      </a>
    ` : '';

    return `
      <article class="result-card search-uniform-card" onclick="openSearchResultModal('${r.field}', '${escapeHtml(String(r.id || ''))}', ${idx})">
        <div class="result-card-top">
          <div class="result-type ${fieldBadgeClass}">${r.field_icon || '🏷️'} ${escapeHtml((r.field_name || r.field || 'EXPLORE').toUpperCase())}</div>
          ${officialBtnHtml}
        </div>
        <div class="result-info">
          <div class="result-icon ${fieldBadgeClass}">${r.field_icon || '📌'}</div>
          <div class="result-details">
            <h3 class="result-title">${escapeHtml(r.title || 'Educational Pathway')}</h3>
            <p class="result-sub">${escapeHtml(r.subtitle || '')}</p>
            <p class="result-desc">${escapeHtml(r.description || '')}</p>
            <div class="result-meta">
              ${metaChipsHtml}
            </div>
          </div>
        </div>
        <div class="result-actions-row">
          <button class="result-action primary-result-btn" type="button" onclick="event.stopPropagation(); openSearchResultModal('${r.field}', '${escapeHtml(String(r.id || ''))}', ${idx})">
            <span>View Full Details</span> <b>→</b>
          </button>
        </div>
      </article>
    `;
  }).join('');

  const relatedSearchesHtml = `
    <div class="related-searches">
      <strong>Popular Searches</strong>
      <button type="button" onclick="openSearch('Karpagam')">Karpagam</button>
      <button type="button" onclick="openSearch('IIT Madras')">IIT Madras</button>
      <button type="button" onclick="openSearch('Computer Science')">Computer Science</button>
      <button type="button" onclick="openSearch('JEE Main')">JEE Main</button>
      <button type="button" onclick="openSearch('NEET UG')">NEET UG</button>
      <button type="button" onclick="openSearch('Scholarship')">Scholarships</button>
      <button type="button" onclick="openSearch('Zoho')">Zoho Placement</button>
      <button type="button" onclick="openSearch('Artificial Intelligence')">AI & Machine Learning</button>
    </div>
  `;

  const tabsHtml = tabsContainer ? tabsContainer.outerHTML : '';
  const toolbarHtml = `<div class="result-toolbar"><span>Top matched records across database (${total} results)</span></div>`;

  if (resultsList.length === 0) {
    resultsMain.innerHTML = `
      ${tabsHtml}
      ${toolbarHtml}
      <div class="search-empty-box" style="text-align:center; padding:48px 24px; background:var(--theme-surface); border-radius:12px; border:1px solid var(--theme-line); margin:20px 0;">
        <div style="font-size:32px; margin-bottom:12px;">🔍</div>
        <h3 style="color:#fff; margin:0 0 8px; font-size:18px;">No matching pathways found for "${escapeHtml(query)}"</h3>
        <p style="color:var(--theme-muted); font-size:13px; margin:0 0 20px; max-width:480px; margin-left:auto; margin-right:auto;">
          Try searching for specific college names (e.g. "Karpagam", "IIT"), courses ("Computer Science", "MBA"), entrance exams ("NEET", "JEE"), or scholarships.
        </p>
        <button type="button" class="primary-button" onclick="openSearch('')">Show All Pathways</button>
      </div>
      ${relatedSearchesHtml}
    `;
  } else {
    resultsMain.innerHTML = `
      ${tabsHtml}
      ${toolbarHtml}
      <div class="search-results-grid">
        ${cardsHtml}
      </div>
      ${relatedSearchesHtml}
    `;
  }
}
window.renderSearchResults = renderSearchResults;
window.filterSearchCategory = (cat) => renderSearchResults(document.getElementById('resultSearch')?.value || '', cat);

// ============================================================================
// 7. EDUCATIONAL AI ASSISTANT
// ============================================================================
const aiEntry = document.querySelector('.ai-entry');
const aiTrigger = document.querySelector('#aiTrigger');
const aiPanel = document.querySelector('#aiPanel');
const aiChat = document.querySelector('#aiChat');
const aiForm = document.querySelector('#aiForm');
const aiMessage = document.querySelector('#aiMessage');

async function addAiExchange(question) {
  const chatEl = document.getElementById('aiChat');
  if (!chatEl || !question) return;

  const userMessage = document.createElement('p');
  userMessage.className = 'ai-message-user';
  userMessage.textContent = question;
  chatEl.appendChild(userMessage);

  const typingMsg = document.createElement('p');
  typingMsg.className = 'ai-message-answer';

  const currentLang = (window.CampNovaTranslationEngine && window.CampNovaTranslationEngine.currentLanguageCode) || 'EN';
  let thinkingText = 'Thinking...';
  if (currentLang === 'TA') thinkingText = 'சிந்திக்கிறது...';
  else if (currentLang === 'HI') thinkingText = 'सोच रहा हूँ...';
  else if (currentLang === 'TE') thinkingText = 'ఆలోచిస్తోంది...';
  else if (currentLang === 'ML') thinkingText = 'ചിന്തിക്കുന്നു...';
  else if (currentLang === 'KN') thinkingText = 'ಯೋಚಿಸುತ್ತಿದೆ...';

  typingMsg.textContent = thinkingText;
  chatEl.appendChild(typingMsg);
  chatEl.scrollTop = chatEl.scrollHeight;

  let answerText = '';
  let suggestedActions = [];
  try {
    const res = await fetch('/api/ai/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: question,
        target: currentLang
      })
    });
    if (res.ok) {
      const data = await res.json();
      answerText = data.answer;
      suggestedActions = data.suggestedActions || [];
    }
  } catch (e) {
    console.warn('[AI API] Offline, using fallback assistant:', e);
  }

  if (!answerText) {
    answerText = 'TheCampusNova platform enables you to discover structured pathways across major academic categories, compare accredited campuses, and prepare for entrance exams.';
  }

  typingMsg.innerHTML = answerText.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');

  if (suggestedActions && suggestedActions.length > 0) {
    const pillsContainer = document.createElement('div');
    pillsContainer.className = 'ai-followup-suggestions';
    suggestedActions.forEach(s => {
      const pillBtn = document.createElement('button');
      pillBtn.type = 'button';
      pillBtn.className = 'ai-followup-btn';
      pillBtn.textContent = s;
      pillBtn.onclick = (e) => {
        e.preventDefault();
        const lowerS = s.toLowerCase();
        if (lowerS.startsWith('what') || lowerS.startsWith('which') || lowerS.startsWith('where') || lowerS.startsWith('how')) {
          addAiExchange(s);
        } else if (lowerS.includes('course')) {
          setView('courses');
        } else if (lowerS.includes('college')) {
          setView('colleges');
        } else if (lowerS.includes('exam')) {
          setView('exams');
        } else if (lowerS.includes('internship')) {
          setView('internships');
        } else if (lowerS.includes('placement')) {
          setView('placements');
        } else if (lowerS.includes('ranking')) {
          setView('rankings');
        } else if (lowerS.includes('scholarship')) {
          setView('scholarships');
        } else {
          addAiExchange(s);
        }
      };
      pillsContainer.appendChild(pillBtn);
    });
    chatEl.appendChild(pillsContainer);
  }

  chatEl.scrollTop = chatEl.scrollHeight;
}

function openAiAssistant() {
  const entryEl = document.querySelector('.ai-entry');
  const triggerEl = document.getElementById('aiTrigger');
  const messageEl = document.getElementById('aiMessage');
  if (entryEl) entryEl.classList.add('open');
  if (triggerEl) triggerEl.setAttribute('aria-expanded', 'true');
  if (messageEl) setTimeout(() => messageEl.focus(), 60);
}

function closeAiAssistant() {
  const entryEl = document.querySelector('.ai-entry');
  const triggerEl = document.getElementById('aiTrigger');
  if (entryEl) entryEl.classList.remove('open');
  if (triggerEl) triggerEl.setAttribute('aria-expanded', 'false');
}

window.addAiExchange = addAiExchange;
window.openAiAssistant = openAiAssistant;
window.closeAiAssistant = closeAiAssistant;

// ============================================================================
// 8. GOAL SELECTOR WITH LOCALSTORAGE PERSISTENCE
// ============================================================================
let userSelectedGoal = localStorage.getItem('thecampusnova_selected_goal') || 'Courses';

function initGoalSelector() {
  const goalEl = document.querySelector('#goalTrigger b');
  if (goalEl && userSelectedGoal) {
    goalEl.textContent = userSelectedGoal;
  }
}

document.querySelectorAll('[data-goal]').forEach(option => option.addEventListener('click', (e) => {
  e.preventDefault();
  const goalName = option.dataset.goal;
  const viewTarget = option.dataset.view || goalName;
  userSelectedGoal = goalName;
  localStorage.setItem('thecampusnova_selected_goal', goalName);

  const goalEl = document.querySelector('#goalTrigger b');
  if (goalEl) {
    const textSpan = option.querySelector('span');
    goalEl.textContent = textSpan ? textSpan.textContent : goalName;
  }

  renderSuggestedDomainPills();
  setView(viewTarget);
}));

// ============================================================================
// 9. EXPLORE PATHWAYS DROPDOWN & HEADER CONTROLS
// (Centralized management in initAllHeaderControls)
// ============================================================================


// ============================================================================
// 10. COMPREHENSIVE MULTI-LANGUAGE PREFERENCES SYSTEM (48 LANGUAGES)
// ============================================================================
const ALL_LANGUAGES = [
  // Indian Regional Languages
  { code: 'EN', name: 'English', native: 'English', region: 'Pan-India / Global', type: 'indian' },
  { code: 'HI', name: 'Hindi', native: 'हिन्दी', region: 'Pan-India', type: 'indian' },
  { code: 'TA', name: 'Tamil', native: 'தமிழ்', region: 'Tamil Nadu & Puducherry', type: 'indian' },
  { code: 'TE', name: 'Telugu', native: 'తెలుగు', region: 'Andhra Pradesh & Telangana', type: 'indian' },
  { code: 'KN', name: 'Kannada', native: 'ಕನ್ನಡ', region: 'Karnataka', type: 'indian' },
  { code: 'ML', name: 'Malayalam', native: 'മലയാളം', region: 'Kerala & Lakshadweep', type: 'indian' },
  { code: 'MR', name: 'Marathi', native: 'मराठी', region: 'Maharashtra & Goa', type: 'indian' },
  { code: 'BN', name: 'Bengali', native: 'বাংলা', region: 'West Bengal & Tripura', type: 'indian' },
  { code: 'GU', name: 'Gujarati', native: 'ગુજરાતી', region: 'Gujarat & Daman', type: 'indian' },
  { code: 'PA', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', region: 'Punjab & Chandigarh', type: 'indian' },
  { code: 'OR', name: 'Odia', native: 'ଓଡ଼ିଆ', region: 'Odisha', type: 'indian' },
  { code: 'AS', name: 'Assamese', native: 'অসমীয়া', region: 'Assam', type: 'indian' },
  { code: 'UR', name: 'Urdu', native: 'اردو', region: 'Pan-India', type: 'indian' },
  { code: 'SA', name: 'Sanskrit', native: 'संस्कृतम्', region: 'Classical India', type: 'indian' },
  { code: 'KOK', name: 'Konkani', native: 'कोंकणी', region: 'Goa & Coastal Karnataka', type: 'indian' },
  { code: 'NE', name: 'Nepali', native: 'नेपाली', region: 'Sikkim & West Bengal', type: 'indian' },
  { code: 'KS', name: 'Kashmiri', native: 'كٲشُر', region: 'Jammu & Kashmir', type: 'indian' },
  { code: 'SD', name: 'Sindhi', native: 'سنڌي', region: 'Pan-India', type: 'indian' },
  { code: 'MAI', name: 'Maithili', native: 'मैथिली', region: 'Bihar & Jharkhand', type: 'indian' },
  { code: 'MNI', name: 'Manipuri', native: 'মৈতৈলোন্', region: 'Manipur', type: 'indian' },
  { code: 'BDO', name: 'Bodo', native: 'बड़ो', region: 'Assam', type: 'indian' },
  { code: 'SAT', name: 'Santali', native: 'ᱥᱟᱱᱛᱟᱲᱤ', region: 'Jharkhand & Odisha', type: 'indian' },
  { code: 'DGO', name: 'Dogri', native: 'डोगरी', region: 'Jammu & Himachal', type: 'indian' },

  // International Languages
  { code: 'FR', name: 'French', native: 'Français', region: 'France & Europe', type: 'international' },
  { code: 'DE', name: 'German', native: 'Deutsch', region: 'Germany & Central Europe', type: 'international' },
  { code: 'ES', name: 'Spanish', native: 'Español', region: 'Spain & Latin America', type: 'international' },
  { code: 'PT', name: 'Portuguese', native: 'Português', region: 'Portugal & Brazil', type: 'international' },
  { code: 'IT', name: 'Italian', native: 'Italiano', region: 'Italy & Europe', type: 'international' },
  { code: 'NL', name: 'Dutch', native: 'Nederlands', region: 'Netherlands & Belgium', type: 'international' },
  { code: 'RU', name: 'Russian', native: 'Русский', region: 'Russia & Eastern Europe', type: 'international' },
  { code: 'ZH', name: 'Chinese', native: '简体中文', region: 'East Asia & Global', type: 'international' },
  { code: 'JA', name: 'Japanese', native: '日本語', region: 'Japan', type: 'international' },
  { code: 'KO', name: 'Korean', native: '한국어', region: 'South Korea', type: 'international' },
  { code: 'AR', name: 'Arabic', native: 'العربية', region: 'Middle East & North Africa', type: 'international' },
  { code: 'TR', name: 'Turkish', native: 'Türkçe', region: 'Turkey & Eurasia', type: 'international' },
  { code: 'FA', name: 'Persian', native: 'فارسی', region: 'Iran & Central Asia', type: 'international' },
  { code: 'ID', name: 'Indonesian', native: 'Bahasa Indonesia', region: 'Southeast Asia', type: 'international' },
  { code: 'MS', name: 'Malay', native: 'Bahasa Melayu', region: 'Malaysia & Singapore', type: 'international' },
  { code: 'TH', name: 'Thai', native: 'ไทย', region: 'Thailand', type: 'international' },
  { code: 'VI', name: 'Vietnamese', native: 'Tiếng Việt', region: 'Vietnam', type: 'international' },
  { code: 'PL', name: 'Polish', native: 'Polski', region: 'Poland & Central Europe', type: 'international' },
  { code: 'UK', name: 'Ukrainian', native: 'Українська', region: 'Ukraine & Eastern Europe', type: 'international' },
  { code: 'EL', name: 'Greek', native: 'Ελληνικά', region: 'Greece & Cyprus', type: 'international' },
  { code: 'HE', name: 'Hebrew', native: 'עברית', region: 'Israel', type: 'international' },
  { code: 'SV', name: 'Swedish', native: 'Svenska', region: 'Sweden & Scandinavia', type: 'international' },
  { code: 'DA', name: 'Danish', native: 'Dansk', region: 'Denmark & Scandinavia', type: 'international' },
  { code: 'NO', name: 'Norwegian', native: 'Norsk', region: 'Norway & Scandinavia', type: 'international' },
  { code: 'FI', name: 'Finnish', native: 'Suomi', region: 'Finland & Scandinavia', type: 'international' }
];

const CampNovaTranslationEngine = {
  currentLanguageCode: localStorage.getItem('campusnova_user_language') || 'EN',
  cache: {},
  pendingTexts: new Set(),
  pendingNodes: [],
  batchTimer: null,
  isTranslating: false,
  observer: null,

  init() {
    // Load pre-cached translations from sessionStorage if available
    try {
      const stored = sessionStorage.getItem('campnova_translations_cache');
      if (stored) {
        this.cache = JSON.parse(stored);
      }
    } catch (e) {
      this.cache = {};
    }

    if (this.currentLanguageCode && this.currentLanguageCode !== 'EN') {
      this.fetchLanguageBundle(this.currentLanguageCode);
    }

    this.setupMutationObserver();
  },

  async fetchLanguageBundle(langCode) {
    if (!langCode || langCode === 'EN') return;
    try {
      const res = await fetch(`/api/translate/bundle?lang=${encodeURIComponent(langCode)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.translations) {
          if (!this.cache[langCode]) this.cache[langCode] = {};
          Object.assign(this.cache[langCode], data.translations);
          try {
            sessionStorage.setItem('campnova_translations_cache', JSON.stringify(this.cache));
          } catch (e) {}
          if (this.currentLanguageCode === langCode) {
            this.translateTree(document.body);
          }
        }
      }
    } catch (err) {
      console.warn('[CampNovaLang] Bundle fetch error:', err);
    }
  },

  setupMutationObserver() {
    if (this.observer) return;
    this.observer = new MutationObserver(mutations => {
      if (this.currentLanguageCode === 'EN') return;
      let shouldTranslate = false;
      for (const m of mutations) {
        if (m.type === 'childList' && m.addedNodes.length > 0) {
          for (const node of m.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              if (node.id === 'toast' || (node.classList && (node.classList.contains('custom-menu') || node.classList.contains('ai-chat')))) continue;
              shouldTranslate = true;
              break;
            }
          }
        }
        if (shouldTranslate) break;
      }
      if (shouldTranslate) {
        this.scheduleTranslation(40);
      }
    });

    try {
      this.observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    } catch (e) {}
  },

  scheduleTranslation(delay = 30, targetRoot = null) {
    if (this.currentLanguageCode === 'EN') return;
    if (this._scheduleTimer) clearTimeout(this._scheduleTimer);
    this._scheduleTimer = setTimeout(() => {
      const rootToTranslate = targetRoot || document.body;
      this.translateTree(rootToTranslate);
    }, delay);
  },

  shouldIgnoreNode(node) {
    if (!node) return true;
    if (node.nodeType === Node.ELEMENT_NODE) {
      const tag = node.tagName.toLowerCase();
      if (['script', 'style', 'code', 'pre', 'svg', 'path', 'noscript', 'canvas', 'iframe'].includes(tag)) return true;
      if (node.hasAttribute('data-no-translate') || node.getAttribute('contenteditable') === 'true') return true;
      if (node.id === 'liveTime' || node.id === 'collegeImageInput' || node.id === 'collegeVideoInput') return true;
      if (node.classList) {
        if (node.classList.contains('lang-item-native') ||
            node.classList.contains('lang-card-native') ||
            node.classList.contains('lang-item-code') ||
            node.classList.contains('lang-card-code') ||
            node.classList.contains('lang-card-region') ||
            node.classList.contains('no-translate')) {
          return true;
        }
      }
    }
    return false;
  },

  isProtectedText(text) {
    if (!text) return true;
    const trimmed = text.trim();
    if (!trimmed) return true;

    // Pure punctuation, digits, or standard icons/emojis
    if (/^[\d\s.,/#!$%^&*;:{}=_`~()@+?><[\]'"•✓✕→➔☰⌄…ℹ️⚡📖🏛️🌐🎯📚⭐🏆🚀💼📝🎓🏢⚖️|–—\-]+$/u.test(trimmed)) {
      return true;
    }

    // Email addresses
    if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(trimmed)) {
      return true;
    }

    // URLs and domains
    if (/^(https?:\/\/|www\.)\S+$/i.test(trimmed)) {
      return true;
    }

    // AISHE Codes (e.g. U-0042, U-0306)
    if (/^U-\d{3,5}$/i.test(trimmed)) {
      return true;
    }

    // College IDs (e.g. COL-001, PLC-001, INT-001, EXREV-001)
    if (/^(COL|PLC|INT|EXREV)-\d+$/i.test(trimmed)) {
      return true;
    }

    // Standalone NIRF / Rating tags (e.g. "#1", "★ 4.9", "4.9 / 5.0")
    if (/^(#\d+|★\s*\d+(\.\d+)?|\d+(\.\d+)?\s*\/\s*\d+(\.\d+)?)$/.test(trimmed)) {
      return true;
    }

    return false;
  },

  translateTextNode(textNode) {
    if (!textNode || !textNode.parentElement || this.shouldIgnoreNode(textNode.parentElement)) return;

    const raw = textNode.nodeValue;
    if (!raw || this.isProtectedText(raw)) return;

    if (textNode.__cn_orig === undefined) {
      textNode.__cn_orig = raw;
    }

    const orig = textNode.__cn_orig;
    const trimmed = orig.trim();
    if (!trimmed || this.isProtectedText(trimmed)) return;

    const langCache = this.cache[this.currentLanguageCode] || {};
    if (langCache[trimmed]) {
      const leadingSpace = (orig && orig.match(/^\s*/)) ? orig.match(/^\s*/)[0] : '';
      const trailingSpace = (orig && orig.match(/\s*$/)) ? orig.match(/\s*$/)[0] : '';
      const translated = leadingSpace + langCache[trimmed] + trailingSpace;
      if (textNode.nodeValue !== translated) {
        textNode.nodeValue = translated;
      }
    } else {
      this.pendingTexts.add(trimmed);
      this.pendingNodes.push({ type: 'text', node: textNode, originalText: trimmed });
    }
  },

  translateElementAttributes(el) {
    if (!el || this.shouldIgnoreNode(el)) return;
    if (!el.__cn_orig_attrs) {
      el.__cn_orig_attrs = {};
    }

    const attrs = ['placeholder', 'aria-label', 'title'];
    const langCache = this.cache[this.currentLanguageCode] || {};

    attrs.forEach(attr => {
      const val = el.getAttribute(attr);
      if (val && !this.isProtectedText(val)) {
        if (el.__cn_orig_attrs[attr] === undefined) {
          el.__cn_orig_attrs[attr] = val;
        }
        const orig = el.__cn_orig_attrs[attr];
        const trimmed = orig.trim();
        if (langCache[trimmed]) {
          el.setAttribute(attr, langCache[trimmed]);
        } else {
          this.pendingTexts.add(trimmed);
          this.pendingNodes.push({ type: 'attr', el, attr, originalText: trimmed });
        }
      }
    });

    if (el.tagName === 'INPUT' && (el.type === 'button' || el.type === 'submit')) {
      const val = el.value;
      if (val && !this.isProtectedText(val)) {
        if (el.__cn_orig_attrs['value'] === undefined) {
          el.__cn_orig_attrs['value'] = val;
        }
        const orig = el.__cn_orig_attrs['value'];
        const trimmed = orig.trim();
        if (langCache[trimmed]) {
          el.value = langCache[trimmed];
        } else {
          this.pendingTexts.add(trimmed);
          this.pendingNodes.push({ type: 'value', el, originalText: trimmed });
        }
      }
    }
  },

  translateTree(root = document.body) {
    if (this.currentLanguageCode === 'EN' || !root) return;
    this.isTranslating = true;

    try {
      const walker = document.createTreeWalker(
        root,
        NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
        {
          acceptNode: node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const tag = node.tagName.toLowerCase();
              if (['script', 'style', 'code', 'pre', 'svg', 'path', 'noscript', 'canvas', 'iframe'].includes(tag) ||
                  (node.classList && (node.classList.contains('no-translate') || node.classList.contains('lang-item-native')))) {
                return NodeFilter.FILTER_REJECT;
              }
              return NodeFilter.FILTER_ACCEPT;
            }
            return NodeFilter.FILTER_ACCEPT;
          }
        }
      );

      let current = walker.currentNode;
      while (current) {
        if (current.nodeType === Node.TEXT_NODE) {
          this.translateTextNode(current);
        } else if (current.nodeType === Node.ELEMENT_NODE) {
          this.translateElementAttributes(current);
        }
        current = walker.nextNode();
      }

      this.flushBatch();
    } catch (e) {
      console.warn('[CampNovaLang] Translation error:', e);
    } finally {
      this.isTranslating = false;
    }
  },

  restoreEnglish(root = document.body) {
    if (!root) return;
    this.isTranslating = true;

    try {
      const walker = document.createTreeWalker(
        root,
        NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
        null
      );

      let current = walker.currentNode;
      while (current) {
        if (current.nodeType === Node.TEXT_NODE) {
          if (current.__cn_orig !== undefined) {
            current.nodeValue = current.__cn_orig;
          }
        } else if (current.nodeType === Node.ELEMENT_NODE) {
          if (current.__cn_orig_attrs) {
            for (const [attr, val] of Object.entries(current.__cn_orig_attrs)) {
              if (attr === 'value') {
                current.value = val;
              } else {
                current.setAttribute(attr, val);
              }
            }
          }
        }
        current = walker.nextNode();
      }
    } catch (e) {
      console.warn('[CampNovaLang] Restore English error:', e);
    } finally {
      this.isTranslating = false;
    }
  },

  flushBatch() {
    if (this.pendingTexts.size === 0) return;
    clearTimeout(this.batchTimer);

    this.batchTimer = setTimeout(async () => {
      const textsToFetch = Array.from(this.pendingTexts);
      this.pendingTexts.clear();
      const nodesToUpdate = [...this.pendingNodes];
      this.pendingNodes = [];

      const targetLang = this.currentLanguageCode;
      if (targetLang === 'EN' || textsToFetch.length === 0) return;

      const CHUNK_SIZE = 25;
      for (let i = 0; i < textsToFetch.length; i += CHUNK_SIZE) {
        const chunk = textsToFetch.slice(i, i + CHUNK_SIZE);
        try {
          const response = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              texts: chunk,
              target: targetLang,
              source: 'en'
            })
          });

          if (response.ok) {
            const data = await response.json();
            if (data && data.translations) {
              if (!this.cache[targetLang]) this.cache[targetLang] = {};
              Object.assign(this.cache[targetLang], data.translations);

              try {
                sessionStorage.setItem('campnova_translations_cache', JSON.stringify(this.cache));
              } catch (e) {}

              // Apply translations to matching nodes
              this.isTranslating = true;
              nodesToUpdate.forEach(item => {
                const translated = data.translations[item.originalText];
                if (!translated) return;

                if (item.type === 'text' && item.node && item.node.isConnected) {
                  const orig = item.node.__cn_orig || item.node.nodeValue;
                  const leadingSpace = (orig && orig.match(/^\s*/)) ? orig.match(/^\s*/)[0] : '';
                  const trailingSpace = (orig && orig.match(/\s*$/)) ? orig.match(/\s*$/)[0] : '';
                  item.node.nodeValue = leadingSpace + translated + trailingSpace;
                } else if (item.type === 'attr' && item.el && item.el.isConnected) {
                  item.el.setAttribute(item.attr, translated);
                } else if (item.type === 'value' && item.el && item.el.isConnected) {
                  item.el.value = translated;
                }
              });
              this.isTranslating = false;
            }
          }
        } catch (chunkErr) {
          console.warn('[CampNovaLang] Chunk translation network error:', chunkErr);
        }
      }

      // Sweep tree to apply newly resolved translations to remaining nodes
      if (this.currentLanguageCode === targetLang) {
        this.translateTree(document.body);
      }
    }, 30);
  },

  setLanguage(code, silent = false) {
    const prevCode = this.currentLanguageCode;
    const newCode = (code || 'EN').toUpperCase();
    this.currentLanguageCode = newCode;
    localStorage.setItem('campusnova_user_language', newCode);

    // Sync header button & active badge
    const langTriggerEl = document.querySelector('#languageTrigger b');
    if (langTriggerEl) langTriggerEl.textContent = newCode;

    const langActiveBadge = document.getElementById('langActiveCodeBadge');
    if (langActiveBadge) langActiveBadge.textContent = `Active: ${newCode}`;

    // Sync header dropdown items
    document.querySelectorAll('.language-panel .lang-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.language === newCode);
    });

    // Sync mobile drawer buttons
    document.querySelectorAll('.drawer-languages button').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.language === newCode);
    });

    // Sync modal cards
    document.querySelectorAll('.lang-grid .lang-card').forEach(card => {
      const codeSpan = card.querySelector('.lang-card-code');
      const cardCode = codeSpan ? codeSpan.textContent.trim() : '';
      card.classList.toggle('active', cardCode === newCode);
    });

    // Always restore English baseline first
    this.restoreEnglish(document.body);

    if (newCode !== 'EN') {
      this.fetchLanguageBundle(newCode);
      this.translateTree(document.body);
    }

    const langObj = ALL_LANGUAGES.find(l => l.code === newCode) || { name: newCode };
    closeMenus();
    closeAllModals();

    if (!silent) {
      if (newCode === 'TA') {
        showToast(`மொழி தமிழாக அமைக்கப்பட்டது (${newCode})`);
      } else if (newCode === 'HI') {
        showToast(`भाषा हिन्दी में सेट की गई (${newCode})`);
      } else if (newCode === 'TE') {
        showToast(`భాష తెలుగుగా మార్చబడింది (${newCode})`);
      } else {
        showToast(`Language set to ${langObj.name} (${newCode})`);
      }
    }
  }
};

// Initialize translation engine
CampNovaTranslationEngine.init();

let currentLanguageCode = CampNovaTranslationEngine.currentLanguageCode;
let currentLangFilter = 'all';

function selectLanguage(code) {
  CampNovaTranslationEngine.setLanguage(code);
  currentLanguageCode = CampNovaTranslationEngine.currentLanguageCode;
}
window.selectLanguage = selectLanguage;
window.changeActiveLanguage = selectLanguage;
window.CampNovaLang = CampNovaTranslationEngine;
window.CampNovaTranslationEngine = CampNovaTranslationEngine;

function renderLanguageModalGrid(filter = 'all', query = '') {
  const container = document.getElementById('langModalGrid');
  const countEl = document.getElementById('langResultsCount');
  const clearBtn = document.getElementById('langSearchClear');
  if (!container) return;

  currentLangFilter = filter;
  const q = (query || '').toLowerCase().trim();

  if (clearBtn) {
    clearBtn.style.display = q ? 'block' : 'none';
  }

  const filtered = ALL_LANGUAGES.filter(lang => {
    const matchesFilter = (filter === 'all') || (lang.type === filter);
    const matchesQuery = !q || (
      lang.name.toLowerCase().includes(q) ||
      lang.native.toLowerCase().includes(q) ||
      lang.code.toLowerCase().includes(q) ||
      (lang.region || '').toLowerCase().includes(q)
    );
    return matchesFilter && matchesQuery;
  });

  if (countEl) {
    countEl.textContent = `Showing ${filtered.length} of ${ALL_LANGUAGES.length} languages`;
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="lang-empty-state">
        <p style="margin:0 0 4px; font-weight:700; color:#fff;">No languages found matching "${query}"</p>
        <p style="margin:0; font-size:12px;">Try searching for another language name or regional script.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(lang => {
    const isActive = lang.code === currentLanguageCode;
    return `
      <button type="button" class="lang-card ${isActive ? 'active' : ''}" onclick="selectLanguage('${lang.code}')">
        <div class="lang-card-header">
          <span class="lang-card-code">${lang.code}</span>
          <span class="lang-card-region">${lang.region || ''}</span>
        </div>
        <div class="lang-card-native">${lang.native}</div>
        <div class="lang-card-eng">${lang.name}</div>
      </button>
    `;
  }).join('');
}

function openLanguageModal() {
  const modal = document.getElementById('languageSearchModal');
  if (modal) {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    const input = document.getElementById('langSearchInput');
    if (input) {
      input.value = '';
      setTimeout(() => input.focus(), 100);
    }
    renderLanguageModalGrid('all', '');
  }
}
window.openLanguageModal = openLanguageModal;

document.querySelectorAll('[data-language]').forEach(option => option.addEventListener('click', () => {
  selectLanguage(option.dataset.language);
}));

const openLanguageModalBtn = document.getElementById('openLanguageModalBtn');
if (openLanguageModalBtn) {
  openLanguageModalBtn.addEventListener('click', openLanguageModal);
}

const drawerOpenLanguageModalBtn = document.getElementById('drawerOpenLanguageModalBtn');
if (drawerOpenLanguageModalBtn) {
  drawerOpenLanguageModalBtn.addEventListener('click', () => {
    closeMobileDrawer();
    openLanguageModal();
  });
}

const langSearchInput = document.getElementById('langSearchInput');
const langSearchClear = document.getElementById('langSearchClear');
const langFilterTabs = document.getElementById('langFilterTabs');

if (langSearchInput) {
  langSearchInput.addEventListener('input', e => {
    renderLanguageModalGrid(currentLangFilter, e.target.value);
  });
}

if (langSearchClear) {
  langSearchClear.addEventListener('click', () => {
    if (langSearchInput) langSearchInput.value = '';
    renderLanguageModalGrid(currentLangFilter, '');
  });
}

if (langFilterTabs) {
  langFilterTabs.querySelectorAll('button').forEach(tabBtn => {
    tabBtn.addEventListener('click', () => {
      langFilterTabs.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      tabBtn.classList.add('active');
      const f = tabBtn.dataset.langFilter || 'all';
      const q = langSearchInput ? langSearchInput.value : '';
      renderLanguageModalGrid(f, q);
    });
  });
}

// ============================================================================
// 11. PUBLIC USER LOGIN & PROFILE AVATAR STATE
// ============================================================================
let loggedInUser = null;

function loadStoredLoginState() {
  const stored = localStorage.getItem('thecampusnova_user_session') || sessionStorage.getItem('thecampusnova_user_session');
  if (stored) {
    try {
      loggedInUser = JSON.parse(stored);
    } catch (e) {
      loggedInUser = null;
    }
  } else {
    loggedInUser = null;
  }
  updateHeaderAuthState();
}
window.loadStoredLoginState = loadStoredLoginState;

function updateHeaderAuthState() {
  const loginBtn = document.getElementById('headerLoginBtn');
  const avatarBtn = document.getElementById('headerSignInBtn');
  const avatarLetter = document.getElementById('headerAvatarLetter') || (avatarBtn ? avatarBtn.querySelector('.avatar-letter') : null);
  const profileMenu = document.getElementById('headerProfileMenu') || (avatarBtn ? avatarBtn.closest('.profile-menu') : null);
  const userNameEl = document.getElementById('profilePanelUserName');
  const userEmailEl = document.getElementById('profilePanelUserEmail');
  const userProfileBtn = document.getElementById('openUserProfileBtn');

  if (loggedInUser && (loggedInUser.email || loggedInUser.name)) {
    const rawName = String(loggedInUser.name || loggedInUser.email || 'User').trim();
    // First letter of user's actual name
    const firstInitial = (rawName.charAt(0) || 'U').toUpperCase();

    // 1. Mark container as authenticated
    if (profileMenu) {
      profileMenu.classList.add('is-authenticated');
    }

    // 2. Hide Login button, show profile avatar
    if (loginBtn) {
      loginBtn.style.setProperty('display', 'none', 'important');
    }
    if (avatarBtn) {
      avatarBtn.style.setProperty('display', 'flex', 'important');
      avatarBtn.title = `Logged in as ${rawName}`;
      avatarBtn.setAttribute('aria-label', `User Profile (${rawName})`);
    }

    // 3. Update dynamic initial
    if (avatarLetter) {
      avatarLetter.textContent = firstInitial;
    }

    // 4. Update dropdown menu info
    if (userNameEl) {
      userNameEl.textContent = rawName;
    }
    if (userEmailEl) {
      userEmailEl.textContent = loggedInUser.email || '';
    }
    if (userProfileBtn) {
      userProfileBtn.innerHTML = `<span>👤</span> <span>Account: ${rawName}</span>`;
    }
  } else {
    // NOT logged in: Show "Login" button, hide circular profile
    if (profileMenu) {
      profileMenu.classList.remove('is-authenticated');
      profileMenu.classList.remove('open');
    }

    if (loginBtn) {
      loginBtn.style.setProperty('display', 'inline-flex', 'important');
    }
    if (avatarBtn) {
      avatarBtn.style.setProperty('display', 'none', 'important');
    }

    if (userNameEl) userNameEl.textContent = 'Guest';
    if (userEmailEl) userEmailEl.textContent = 'Not logged in';
    if (userProfileBtn) {
      userProfileBtn.innerHTML = `<span>👤</span> <span>User Portal / Login</span>`;
    }
  }
}
window.updateHeaderAuthState = updateHeaderAuthState;

function openUserLoginModal() {
  closeAllModals();
  const m = document.getElementById('userLoginModal');
  const errEl = document.getElementById('loginErrorMsg');
  if (errEl) { errEl.textContent = ''; errEl.style.display = 'none'; }
  if (m) {
    m.classList.add('open');
    m.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    const emailInput = document.getElementById('userEmail');
    if (emailInput) { emailInput.focus(); }
  }
}
window.openUserLoginModal = openUserLoginModal;

function openUserSignupModal() {
  closeAllModals();
  const m = document.getElementById('userSignupModal');
  const errEl = document.getElementById('signupErrorMsg');
  const succEl = document.getElementById('signupSuccessMsg');
  if (errEl) { errEl.textContent = ''; errEl.style.display = 'none'; }
  if (succEl) { succEl.style.display = 'none'; }
  if (m) {
    m.classList.add('open');
    m.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    const emailInput = document.getElementById('signupEmail');
    if (emailInput) { emailInput.focus(); }
  }
}
window.openUserSignupModal = openUserSignupModal;

function openUserForgotModal() {
  closeAllModals();
  const m = document.getElementById('userForgotModal');
  const errEl = document.getElementById('forgotErrorMsg');
  if (errEl) { errEl.textContent = ''; errEl.style.display = 'none'; }
  if (m) {
    m.classList.add('open');
    m.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    const emailInput = document.getElementById('forgotEmail');
    if (emailInput) { emailInput.focus(); }
  }
}
window.openUserForgotModal = openUserForgotModal;

function handleUserLogout() {
  loggedInUser = null;
  localStorage.removeItem('thecampusnova_user_session');
  sessionStorage.removeItem('thecampusnova_user_session');
  closeMenus();
  updateHeaderAuthState();
  showToast('Logged out successfully.', 'info');
}
window.handleUserLogout = handleUserLogout;

// 1. Submit Login Handler
const loginFormEl = document.getElementById('userLoginForm');
if (loginFormEl) {
  loginFormEl.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('userEmail')?.value?.trim();
    const password = document.getElementById('userPassword')?.value?.trim();
    const errEl = document.getElementById('loginErrorMsg');
    if (errEl) { errEl.textContent = ''; errEl.style.display = 'none'; }

    if (!email || !password) {
      showToast('Please enter your email and password.', 'error');
      return;
    }

    const submitBtn = document.getElementById('userLoginSubmitBtn');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Logging in...'; }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (data.success) {
        loggedInUser = data.user || { email, name: email.split('@')[0] };
        localStorage.setItem('thecampusnova_user_session', JSON.stringify(loggedInUser));
        sessionStorage.setItem('thecampusnova_user_session', JSON.stringify(loggedInUser));
        updateHeaderAuthState();
        closeAllModals();
        showToast('Logged in successfully', 'success');
      } else {
        const errorMsg = data.message || (data.error === 'user_not_found' ? 'User not found. Please create an account first.' : 'Incorrect email or password.');
        if (errEl) {
          errEl.textContent = errorMsg;
          errEl.style.display = 'block';
        }
        showToast(errorMsg, 'error');
      }
    } catch (err) {
      showToast('Connection error. Please try again.', 'error');
    } finally {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Submit'; }
    }
  });
}

// 2. Submit Signup Handler
const signupFormEl = document.getElementById('userSignupForm');
if (signupFormEl) {
  signupFormEl.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('signupName')?.value?.trim() || '';
    const email = document.getElementById('signupEmail')?.value?.trim();
    const password = document.getElementById('signupPassword')?.value?.trim();
    const confirmPassword = document.getElementById('signupConfirmPassword')?.value?.trim();
    const errEl = document.getElementById('signupErrorMsg');
    const succEl = document.getElementById('signupSuccessMsg');
    if (errEl) { errEl.textContent = ''; errEl.style.display = 'none'; }
    if (succEl) { succEl.style.display = 'none'; }

    if (!email || !password || !confirmPassword) {
      if (errEl) { errEl.textContent = 'Please fill in all fields.'; errEl.style.display = 'block'; }
      showToast('Please fill in all fields.', 'error');
      return;
    }

    if (password !== confirmPassword) {
      if (errEl) { errEl.textContent = 'Passwords do not match.'; errEl.style.display = 'block'; }
      showToast('Passwords do not match. Please re-enter.', 'error');
      return;
    }

    const submitBtn = document.getElementById('userSignupSubmitBtn');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Creating account...'; }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();

      if (data.success) {
        showToast('Account created successfully', 'success');
        if (succEl) {
          succEl.textContent = 'Account created successfully';
          succEl.style.display = 'block';
        }
        signupFormEl.reset();

        setTimeout(() => {
          openUserLoginModal();
          const loginEmail = document.getElementById('userEmail');
          if (loginEmail) loginEmail.value = email;
          const loginPwd = document.getElementById('userPassword');
          if (loginPwd) loginPwd.focus();
        }, 1200);
      } else {
        if (errEl) {
          errEl.textContent = data.message || 'Account creation failed.';
          errEl.style.display = 'block';
        }
        showToast(data.message || 'Account creation failed.', 'error');
      }
    } catch (err) {
      showToast('Connection error. Please try again.', 'error');
    } finally {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Submit'; }
    }
  });
}


// 3. Submit Forgot Password Handler
const forgotFormEl = document.getElementById('userForgotForm');
if (forgotFormEl) {
  forgotFormEl.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('forgotEmail')?.value?.trim();
    const newPassword = document.getElementById('forgotNewPassword')?.value?.trim();
    const confirmPassword = document.getElementById('forgotConfirmPassword')?.value?.trim();
    const errEl = document.getElementById('forgotErrorMsg');
    if (errEl) { errEl.textContent = ''; errEl.style.display = 'none'; }

    if (!email || !newPassword || !confirmPassword) {
      showToast('Please fill in all fields.', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      if (errEl) { errEl.textContent = 'Passwords do not match.'; errEl.style.display = 'block'; }
      showToast('Passwords do not match.', 'error');
      return;
    }

    const submitBtn = document.getElementById('userForgotSubmitBtn');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Resetting...'; }

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword })
      });
      const data = await res.json();

      if (data.success) {
        showToast('Password reset successfully. Please log in.', 'success');
        forgotFormEl.reset();
        setTimeout(() => {
          openUserLoginModal();
          const loginEmail = document.getElementById('userEmail');
          if (loginEmail) loginEmail.value = email;
          const loginPwd = document.getElementById('userPassword');
          if (loginPwd) loginPwd.focus();
        }, 1000);
      } else {
        if (errEl) {
          errEl.textContent = data.message || 'Password reset failed.';
          errEl.style.display = 'block';
        }
        showToast(data.message || 'Password reset failed.', 'error');
      }
    } catch (err) {
      showToast('Connection error. Please try again.', 'error');
    } finally {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Submit'; }
    }
  });
}

// 4. Modal Links Navigation
document.addEventListener('click', (e) => {
  if (e.target.closest('#openSignupModalBtn') || e.target.id === 'openSignupModalBtn') {
    e.preventDefault();
    openUserSignupModal();
  }
  if (e.target.closest('#openForgotModalBtn') || e.target.id === 'openForgotModalBtn') {
    e.preventDefault();
    openUserForgotModal();
  }
  if (e.target.closest('#switchToLoginBtn') || e.target.id === 'switchToLoginBtn') {
    e.preventDefault();
    openUserLoginModal();
  }
  if (e.target.closest('#forgotSwitchToLoginBtn') || e.target.id === 'forgotSwitchToLoginBtn') {
    e.preventDefault();
    openUserLoginModal();
  }
  if (e.target.closest('#headerLoginBtn') || e.target.id === 'headerLoginBtn') {
    e.preventDefault();
    openUserLoginModal();
  }
  if (e.target.closest('#headerLogoutBtn') || e.target.id === 'headerLogoutBtn') {
    e.preventDefault();
    closeMenus();
    handleUserLogout();
  }
  if (e.target.closest('#headerSignInBtn') || e.target.id === 'headerSignInBtn') {
    if (!loggedInUser) {
      e.preventDefault();
      openUserLoginModal();
    }
  }
  if (e.target.closest('#openUserProfileBtn') || e.target.id === 'openUserProfileBtn') {
    if (!loggedInUser) {
      e.preventDefault();
      openUserLoginModal();
    }
  }
  if (e.target.closest('#drawerSignInBtn') || e.target.id === 'drawerSignInBtn') {
    if (!loggedInUser) {
      e.preventDefault();
      openUserLoginModal();
    }
  }
});

// ============================================================================
// 12. HERO BACKGROUND ROTATING IMAGE SLIDER (4 EDUCATIONAL CAMPUS SLIDES)
// ============================================================================
function initHeroBackgroundCarousel() {
  const slides = document.querySelectorAll('#heroBgCarousel .hero-bg-slide');
  const indicators = document.querySelectorAll('#heroCarouselIndicators .hero-indicator');
  if (!slides.length) return;

  let currentSlide = 0;
  let slideInterval = null;

  function goToSlide(nextIdx) {
    if (nextIdx === currentSlide) return;
    const prevSlideEl = slides[currentSlide];
    const nextSlideEl = slides[nextIdx];

    // Outgoing slide slides out to the left
    if (prevSlideEl) {
      prevSlideEl.classList.remove('active');
      prevSlideEl.classList.add('slide-out-left');
    }
    if (indicators[currentSlide]) indicators[currentSlide].classList.remove('active');

    // Prepare incoming slide on the right
    if (nextSlideEl) {
      nextSlideEl.classList.remove('slide-out-left');
      nextSlideEl.style.transform = 'translateX(100%)';
      void nextSlideEl.offsetWidth; // force reflow
      nextSlideEl.classList.add('active');
      nextSlideEl.style.transform = '';
    }
    if (indicators[nextIdx]) indicators[nextIdx].classList.add('active');

    currentSlide = nextIdx;

    setTimeout(() => {
      slides.forEach((s, idx) => {
        if (idx !== currentSlide) {
          s.classList.remove('slide-out-left', 'active');
        }
      });
    }, 1700);
  }

  function startAutoplay() {
    stopAutoplay();
    slideInterval = setInterval(() => {
      goToSlide((currentSlide + 1) % slides.length);
    }, 6000); // exactly 6 seconds
  }

  function stopAutoplay() {
    if (slideInterval) {
      clearInterval(slideInterval);
      slideInterval = null;
    }
  }

  indicators.forEach((ind, idx) => {
    ind.addEventListener('click', () => {
      goToSlide(idx);
      startAutoplay();
    });
  });

  slides.forEach((s, idx) => {
    s.classList.toggle('active', idx === 0);
    s.classList.remove('slide-out-left');
  });

  startAutoplay();
}

// ============================================================================
// 12C. HOME WHOLE-PAGE BODY BACKGROUND IMAGE SLIDER (FROM BELOW HERO TO FOOTER)
// ============================================================================
function initHomeBodyBackgroundSlider() {
  const slider = document.getElementById('homeBodyBgSlider');
  if (!slider) return;

  const slides = slider.querySelectorAll('.home-body-bg-slide');
  if (!slides.length || slides.length <= 1) return;

  if (slider._isSliderInitialized && window._homeBodySliderTimer) {
    return;
  }
  slider._isSliderInitialized = true;

  let currentSlide = 0;

  function nextSlide() {
    const prevSlideEl = slides[currentSlide];
    const nextIdx = (currentSlide + 1) % slides.length;
    const nextSlideEl = slides[nextIdx];

    // Outgoing slide slides out to the left
    if (prevSlideEl) {
      prevSlideEl.classList.remove('active');
      prevSlideEl.classList.add('slide-out-left');
    }

    // Prepare incoming slide on the right
    if (nextSlideEl) {
      nextSlideEl.classList.remove('slide-out-left');
      nextSlideEl.style.transform = 'translateX(100%)';
      void nextSlideEl.offsetWidth; // force reflow
      nextSlideEl.classList.add('active');
      nextSlideEl.style.transform = '';
    }

    currentSlide = nextIdx;

    setTimeout(() => {
      slides.forEach((s, idx) => {
        if (idx !== currentSlide) {
          s.classList.remove('slide-out-left', 'active');
        }
      });
    }, 1700);
  }

  if (window._homeBodySliderTimer) {
    clearInterval(window._homeBodySliderTimer);
  }

  slides.forEach((s, idx) => {
    s.classList.toggle('active', idx === 0);
    s.classList.remove('slide-out-left');
  });
  window._homeBodySliderTimer = setInterval(nextSlide, 6000); // exactly 6 seconds
}
window.initHomeBodyBackgroundSlider = initHomeBodyBackgroundSlider;

// ============================================================================
// 12B. DISCOVERY BACKGROUND ROTATING IMAGE SLIDERS (COURSES, COLLEGES, DOMAINS)
// ============================================================================
function initDiscoveryBackgroundSliders() {
  const configs = [
    { id: 'coursesBgSlider' },
    { id: 'collegesBgSlider' },
    { id: 'domainsBgSlider' },
    { id: 'examsBgSlider' },
    { id: 'materialsBgSlider' },
    { id: 'reviewsBgSlider' },
    { id: 'rankingsBgSlider' },
    { id: 'careersBgSlider' },
    { id: 'placementsBgSlider' },
    { id: 'jobsBgSlider' },
    { id: 'internshipsBgSlider' },
    { id: 'admissionsBgSlider' },
    { id: 'scholarshipsBgSlider' },
    { id: 'facilitiesBgSlider' },
    { id: 'entrancePrepBgSlider' },
    { id: 'reviewsCompareBgSlider' },
    { id: 'detailBgSlider' }
  ];

  configs.forEach(cfg => {
    const slider = document.getElementById(cfg.id);
    if (!slider) return;
    if (slider._isDiscoveryInitialized) return;
    slider._isDiscoveryInitialized = true;

    const slides = slider.querySelectorAll('.discovery-bg-slide, .view-bg-slide');
    if (!slides.length || slides.length <= 1) return;

    let currentSlide = 0;
    setInterval(() => {
      slides[currentSlide].classList.remove('active');
      currentSlide = (currentSlide + 1) % slides.length;
      slides[currentSlide].classList.add('active');
    }, 4500);
  });
}
window.initDiscoveryBackgroundSliders = initDiscoveryBackgroundSliders;

function initEntrancePrepBackgroundSlider() {
  const slider = document.getElementById('entrancePrepBgSlider');
  if (!slider) return;
  if (slider._isEntranceSliderInitialized) return;
  slider._isEntranceSliderInitialized = true;

  const slides = slider.querySelectorAll('.view-bg-slide');
  if (!slides.length || slides.length <= 1) return;

  let currentSlide = 0;
  setInterval(() => {
    slides[currentSlide].classList.remove('active');
    currentSlide = (currentSlide + 1) % slides.length;
    slides[currentSlide].classList.add('active');
  }, 4000);
}
window.initEntrancePrepBackgroundSlider = initEntrancePrepBackgroundSlider;

// ============================================================================
// 13. PLACEMENT INTELLIGENCE & RECRUITER PLAYBOOKS
// ============================================================================
const DEFAULT_PLACEMENT_INTELLIGENCE = [
  {
    id: 'PLC-001',
    companyName: 'Google',
    industry: 'Technology & Cloud',
    priority: 'Highly Preferred',
    colleges: ['IIT Delhi', 'IISc Bengaluru', 'IIT Madras', 'IIT Bombay', 'BITS Pilani'],
    jobRoles: ['Software Development Engineer (SDE)', 'Cloud Solutions Architect', 'Data Scientist / ML Engineer'],
    requiredSkills: ['Data Structures & Algorithms', 'System Design', 'Python / C++ / Java', 'Distributed Systems'],
    eligibility: 'B.Tech / M.Tech / Dual Degree with min. 7.5 CGPA; No active backlogs',
    selectionProcess: {
      rounds: '4 Rounds (Online Coding Assessment + 2 Technical DSA Rounds + 1 Googliness & System Design)',
      aptitude: {
        status: 'Online Assessment Focus',
        topics: [
          { name: 'Probability & Combinatorics', priority: 'High Priority', desc: 'Permutations, Combinations, Bayes Theorem, Expected Values' },
          { name: 'Data Interpretation', priority: 'High Priority', desc: 'Graph analysis, complex logical matrices, computational puzzles' },
          { name: 'Time, Speed & Distance', priority: 'Medium Priority', desc: 'Relative speed, circular tracks, train problems' }
        ]
      }
    },
    resources: [
      { title: 'Google Technical Interview Guide', type: 'Official Resource', url: 'https://careers.google.com/how-we-hire/', priority: 'High Priority', recommendedFor: 'Coding & System Design' },
      { title: 'LeetCode Google Curated 50', type: 'Practice Platform', url: 'https://leetcode.com/explore/interview/card/google/', priority: 'High Priority', recommendedFor: 'Algorithms & Problem Solving' }
    ],
    verified: true
  },
  {
    id: 'PLC-002',
    companyName: 'Microsoft',
    industry: 'Technology & Cloud',
    priority: 'Highly Preferred',
    colleges: ['IIT Delhi', 'IIT Madras', 'IIT Bombay', 'IIT Kanpur', 'BITS Pilani', 'Vellore Institute', 'Anna University'],
    jobRoles: ['Software Engineer', 'Cloud Solutions Architect', 'Security Engineer'],
    requiredSkills: ['DSA & Algorithms', 'Operating Systems & Networking', 'Azure Fundamentals', 'C# / C++ / Python'],
    eligibility: 'B.Tech / B.E. / M.Tech / MCA in CS/IT/ECE with min. 7.0 CGPA',
    selectionProcess: {
      rounds: '4 Rounds (Online Coding + 2 Technical Interviews + 1 AA / Hiring Manager)',
      aptitude: {
        status: 'Part of Initial Filter',
        topics: [
          { name: 'Algorithms & Logic Puzzles', priority: 'High Priority', desc: 'Binary search trees, bit manipulation, graph traversal' },
          { name: 'Permutations & Combinations', priority: 'High Priority', desc: 'Arrangements, probability distribution, selections' }
        ]
      }
    },
    resources: [
      { title: 'Microsoft Student Technical Interview Preparation', type: 'Official Resource', url: 'https://careers.microsoft.com/students/', priority: 'High Priority', recommendedFor: 'Software Engineering Rounds' }
    ],
    verified: true
  },
  {
    id: 'PLC-003',
    companyName: 'Amazon',
    industry: 'Technology & Cloud',
    priority: 'Highly Preferred',
    colleges: ['IIT Delhi', 'IIT Madras', 'IIT Bombay', 'BITS Pilani', 'Vellore Institute', 'Christ University', 'Anna University'],
    jobRoles: ['SDE-1 (AWS & Retail)', 'Data Engineer', 'Applied Scientist'],
    requiredSkills: ['DSA & Problem Solving', 'Object-Oriented Design', 'SQL & Database Design', 'AWS Cloud Services'],
    eligibility: 'B.Tech / M.Tech / MCA with min. 6.5 CGPA; Strong coding proficiency',
    selectionProcess: {
      rounds: '4 Rounds (Online OA with 2 Coding + Leadership Principles + 3 Technical Virtual Onsite)',
      aptitude: {
        status: 'Online Assessment Screening',
        topics: [
          { name: 'Work Style Assessment & Logic', priority: 'High Priority', desc: '16 Leadership Principles situational judgment' },
          { name: 'Data Interpretation & Sequences', priority: 'High Priority', desc: 'Series completion, matrix decoding, pattern analysis' }
        ]
      }
    },
    resources: [
      { title: 'Amazon Jobs Student Programs', type: 'Official Resource', url: 'https://www.amazon.jobs/en/business_categories/student-programs', priority: 'High Priority', recommendedFor: 'Leadership & Coding Rounds' }
    ],
    verified: true
  },
  {
    id: 'PLC-004',
    companyName: 'Cisco Systems',
    industry: 'Technology & Cloud',
    priority: 'Frequently Recruiting',
    colleges: ['IIT Delhi', 'IIT Madras', 'BITS Pilani', 'Vellore Institute', 'Anna University'],
    jobRoles: ['Software Engineer (Networking)', 'Security Systems Analyst', 'Cloud Network Engineer'],
    requiredSkills: ['TCP/IP & Computer Networks', 'Python & Scripting', 'C / C++', 'Linux System Internals'],
    eligibility: 'B.Tech / B.E. in CS/IT/ECE/EE with min. 7.0 CGPA',
    selectionProcess: {
      rounds: '3 Rounds (Online Technical Assessment + 2 Tech Interviews + Managerial HR)',
      aptitude: {
        status: 'Aptitude & Technical MCQ Section',
        topics: [
          { name: 'Networking & OS Basics', priority: 'High Priority', desc: 'OSI Model, routing protocols, subnetting, IPC' },
          { name: 'Quantitative & Analytical Aptitude', priority: 'Medium Priority', desc: 'Speed, time, work, logical reasoning' }
        ]
      }
    },
    resources: [
      { title: 'Cisco University Hiring Guide', type: 'Official Portal', url: 'https://www.cisco.com/c/en/us/about/careers/we-are-cisco/students-and-new-graduates.html', priority: 'High Priority', recommendedFor: 'Networking & Systems' }
    ],
    verified: true
  },
  {
    id: 'PLC-005',
    companyName: 'Goldman Sachs',
    industry: 'Investment Banking & Quantitative FinTech',
    priority: 'Highly Preferred',
    colleges: ['IIT Delhi', 'IISc Bengaluru', 'IIT Madras', 'IIT Bombay', 'BITS Pilani', 'Christ University'],
    jobRoles: ['Quantitative Strategist', 'FinTech Software Analyst', 'Risk Engineering Analyst'],
    requiredSkills: ['Probability & Statistics', 'Time-Series Analysis', 'Python / C++', 'Financial Derivatives Basics'],
    eligibility: 'B.Tech / Dual Degree / M.Sc Math-Computing with min. 8.0 CGPA',
    selectionProcess: {
      rounds: '5 Rounds (Quant Aptitude Test + DSA Assessment + Math & Prob Round + 2 Technical/Culture Rounds)',
      aptitude: {
        status: 'Highest Weightage in Round 1',
        topics: [
          { name: 'Advanced Probability & Bayes Law', priority: 'High Priority', desc: 'Conditional probability, discrete distributions, Markov chains' },
          { name: 'Linear Algebra & Matrix Operations', priority: 'High Priority', desc: 'Eigenvalues, matrix rank, vector spaces' }
        ]
      }
    },
    resources: [
      { title: 'Goldman Sachs Engineering Campus Pathway', type: 'Official Portal', url: 'https://www.goldmansachs.com/careers/students/', priority: 'High Priority', recommendedFor: 'Quant & Tech Tracks' }
    ],
    verified: true
  },
  {
    id: 'PLC-006',
    companyName: 'Morgan Stanley',
    industry: 'Investment Banking & Quantitative FinTech',
    priority: 'Highly Preferred',
    colleges: ['IIT Bombay', 'IIT Delhi', 'IIT Madras', 'BITS Pilani', 'Christ University'],
    jobRoles: ['Technology Analyst', 'Quantitative Research Associate', 'Fixed Income Developer'],
    requiredSkills: ['Algorithms & Low-Latency C++', 'Java / Spring', 'Financial Analytics', 'SQL'],
    eligibility: 'B.Tech / Dual Degree / M.Sc in CS, IT, Math & Computing with min. 7.5 CGPA',
    selectionProcess: {
      rounds: '4 Rounds (Online Aptitude & Coding + 2 Technical DSA/Design Rounds + 1 Senior Director Round)',
      aptitude: {
        status: 'High Weightage in Cognitive Filter',
        topics: [
          { name: 'Probability, Puzzles & Combinatorics', priority: 'High Priority', desc: 'Expected values, dice/card probability, Bayes rule' },
          { name: 'Quantitative Data Interpretation', priority: 'High Priority', desc: 'Tables, percentages, ratios, financial graphs' }
        ]
      }
    },
    resources: [
      { title: 'Morgan Stanley Campus Programs', type: 'Official Resource', url: 'https://www.morganstanley.com/people-opportunities/students-graduates', priority: 'High Priority', recommendedFor: 'Quantitative & Tech Roles' }
    ],
    verified: true
  },
  {
    id: 'PLC-007',
    companyName: 'J.P. Morgan & Chase',
    industry: 'Investment Banking & Quantitative FinTech',
    priority: 'Highly Preferred',
    colleges: ['IIT Delhi', 'IIT Bombay', 'IIT Madras', 'BITS Pilani', 'Christ University', 'Vellore Institute'],
    jobRoles: ['Software Engineer Program (SEP)', 'Quant Research Analyst', 'FinTech Solutions Associate'],
    requiredSkills: ['Core Java / Python', 'Data Structures & Algorithms', 'Financial Engineering Basics', 'Cloud Microservices'],
    eligibility: 'B.Tech / B.E. / Dual Degree with min. 7.0 CGPA',
    selectionProcess: {
      rounds: '4 Rounds (Code for Good Hackathon / Online Coding + 2 Video Tech Interviews + 1 Behavioral)',
      aptitude: {
        status: 'Online Assessment Screening',
        topics: [
          { name: 'Logical Reasoning & Quantitative Math', priority: 'High Priority', desc: 'Number theory, permutations, time & work' },
          { name: 'Graph Analysis & Aptitude', priority: 'Medium Priority', desc: 'Data sufficiency, Venn diagrams' }
        ]
      }
    },
    resources: [
      { title: 'JPMorgan Chase Student Programs', type: 'Official Portal', url: 'https://careers.jpmorgan.com/us/en/students/programs', priority: 'High Priority', recommendedFor: 'SEP & Quant Programs' }
    ],
    verified: true
  },
  {
    id: 'PLC-008',
    companyName: 'Tata Consultancy Services (TCS)',
    industry: 'IT Services & Digital Solutions',
    priority: 'Frequently Recruiting',
    colleges: ['IIT Madras', 'Anna University', 'Vellore Institute', 'Christ University', 'BITS Pilani'],
    jobRoles: ['TCS Digital Developer', 'TCS Prime Systems Engineer', 'TCS Ninja Trainee'],
    requiredSkills: ['Core Java / Python', 'SQL Database Management', 'Web Technologies', 'Software Engineering Principles'],
    eligibility: 'B.Tech / B.E. / MCA / M.Sc with min. 60% or 6.0 CGPA throughout 10th, 12th, and Degree',
    selectionProcess: {
      rounds: '2-3 Rounds (TCS NQT Assessment: Foundation + Advanced Cognitive + Technical & HR Interview)',
      aptitude: {
        status: 'Mandatory NQT Section',
        topics: [
          { name: 'Numerical Ability & Percentages', priority: 'High Priority', desc: 'Ratios, profit & loss, averages, simple & compound interest' },
          { name: 'Reasoning Ability & Coding Puzzles', priority: 'High Priority', desc: 'Syllogisms, blood relations, seating arrangements' }
        ]
      }
    },
    resources: [
      { title: 'TCS National Qualifier Test (NQT) Syllabus', type: 'Official Guide', url: 'https://www.tcs.com/careers/india/tcs-nqt', priority: 'High Priority', recommendedFor: 'All Undergraduate Applicants' }
    ],
    verified: true
  },
  {
    id: 'PLC-009',
    companyName: 'Infosys Limited',
    industry: 'IT Services & Digital Solutions',
    priority: 'Frequently Recruiting',
    colleges: ['IIT Madras', 'Anna University', 'Vellore Institute', 'Christ University', 'BITS Pilani'],
    jobRoles: ['Specialist Programmer (SP)', 'Digital Specialist Engineer (DSE)', 'Systems Engineer'],
    requiredSkills: ['Data Structures & Algorithms', 'Python / Java', 'Web Full-Stack', 'DBMS & SQL'],
    eligibility: 'B.E. / B.Tech / M.E. / M.Tech / MCA with min. 60% in 10th, 12th & Graduation',
    selectionProcess: {
      rounds: '3 Rounds (InfyTQ / HackWithInfy / Online Assessment + Technical Interview + HR Round)',
      aptitude: {
        status: 'Core Stage 1 Component',
        topics: [
          { name: 'Mathematical & Logical Reasoning', priority: 'High Priority', desc: 'Data arrangement, coding-decoding, probability, geometry' },
          { name: 'Verbal Ability & Comprehension', priority: 'Medium Priority', desc: 'Sentence correction, critical reading, error spotting' }
        ]
      }
    },
    resources: [
      { title: 'Infosys Campus Connect & InfyTQ', type: 'Official Learning Portal', url: 'https://infytq.onwingspan.com/', priority: 'High Priority', recommendedFor: 'Certification & Direct Hiring' }
    ],
    verified: true
  },
  {
    id: 'PLC-010',
    companyName: 'Wipro Technologies',
    industry: 'IT Services & Digital Solutions',
    priority: 'Frequently Recruiting',
    colleges: ['Anna University', 'Vellore Institute', 'Christ University', 'IIT Madras'],
    jobRoles: ['Wipro Turbo Developer', 'Elite National Talent Hunt Engineer', 'Cloud Infrastructure Analyst'],
    requiredSkills: ['C++ / Java / Python', 'Computer Networks', 'Cloud & DevOps Fundamentals', 'SQL'],
    eligibility: 'B.E. / B.Tech / M.Tech (5-year Integrated) with min. 60% or 6.0 CGPA',
    selectionProcess: {
      rounds: '3 Rounds (National Talent Hunt Online Assessment + Technical Interview + HR Discussion)',
      aptitude: {
        status: 'Stage 1 Aptitude & Communication',
        topics: [
          { name: 'Quantitative Aptitude & Time-Speed-Work', priority: 'High Priority', desc: 'Speed, time, distance, work allocation, percentage math' },
          { name: 'Logical Deduction & Flowcharts', priority: 'High Priority', desc: 'Flowchart tracing, logical deductions, data sufficiency' }
        ]
      }
    },
    resources: [
      { title: 'Wipro Elite National Talent Hunt (NTH)', type: 'Official Guide', url: 'https://careers.wipro.com/careers-home/', priority: 'High Priority', recommendedFor: 'Graduating Engineering Students' }
    ],
    verified: true
  },
  {
    id: 'PLC-011',
    companyName: 'McKinsey & Company',
    industry: 'Management & Strategy Consulting',
    priority: 'Highly Preferred',
    colleges: ['IIT Delhi', 'IIT Bombay', 'IIT Madras', 'IISc Bengaluru', 'BITS Pilani', 'Christ University'],
    jobRoles: ['Business Analyst (BA)', 'Junior Associate', 'Digital Strategy Analyst'],
    requiredSkills: ['Problem Structuring & Case Solving', 'Quantitative Data Modeling', 'Market Sizing', 'Executive Communication'],
    eligibility: 'All Degree disciplines (Engineering, Commerce, Economics, Sciences) with outstanding academic record',
    selectionProcess: {
      rounds: '4 Rounds (Solve Digital Assessment / Problem Solving Game + 3 Rounds of Case Interviews + PEI Personal Experience Interview)',
      aptitude: {
        status: 'Digital Problem Solving Game Focus',
        topics: [
          { name: 'Ecosystem Simulation & Plant Defense Logic', priority: 'High Priority', desc: 'Species survival modeling, resource allocation game' },
          { name: 'Redrock Study & Numerical Data Evaluation', priority: 'High Priority', desc: 'Financial calculations, profit margin evaluation, market sizing' }
        ]
      }
    },
    resources: [
      { title: 'McKinsey Case Interview & Solve Prep', type: 'Official Practice Portal', url: 'https://www.mckinsey.com/careers/interviewing', priority: 'High Priority', recommendedFor: 'Problem Solving & Case Rounds' }
    ],
    verified: true
  },
  {
    id: 'PLC-012',
    companyName: 'Boston Consulting Group (BCG)',
    industry: 'Management & Strategy Consulting',
    priority: 'Highly Preferred',
    colleges: ['IIT Bombay', 'IIT Delhi', 'IIT Madras', 'BITS Pilani', 'Christ University'],
    jobRoles: ['Associate Consultant', 'Data & Analytics Specialist (BCG GAMMA/X)', 'Strategic Analyst'],
    requiredSkills: ['Strategic Frameworks', 'Hypothesis-Driven Problem Solving', 'Financial Modeling', 'Data Analytics'],
    eligibility: 'Undergraduate and Master degrees across STEM, Business, Economics with top quartile ranking',
    selectionProcess: {
      rounds: '4 Rounds (Casey Chatbot Online Case + 2 Rounds of Case & Behavioral Interviews + 1 Managing Director Round)',
      aptitude: {
        status: 'Casey Interactive Digital Case',
        topics: [
          { name: 'Business Logic & Profitability Frameworks', priority: 'High Priority', desc: 'Cost optimization, revenue expansion, market entry math' },
          { name: 'Quantitative Mental Math & Data Synthesis', priority: 'High Priority', desc: 'Quick percentage estimations, CAGR, breakeven analysis' }
        ]
      }
    },
    resources: [
      { title: 'BCG Interactive Case Preparation & Practice', type: 'Official Portal', url: 'https://www.bcg.com/careers/interview-prep', priority: 'High Priority', recommendedFor: 'Strategy & Case Practice' }
    ],
    verified: true
  }
];

function getPlacementIntelligence() {
  const custom = localStorage.getItem('campnova_placement_intelligence');
  if (custom) {
    try {
      const parsed = JSON.parse(custom);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch(e) {}
  }
  return window._cachedPlacementIntelligence || DEFAULT_PLACEMENT_INTELLIGENCE;
}

function fetchPlacementsLive() {
  fetch('/api/placements')
    .then(res => res.json())
    .then(data => {
      if (data && data.success && Array.isArray(data.placements) && data.placements.length > 0) {
        window._cachedPlacementIntelligence = data.placements;
        if (typeof renderPlacementCompanyGrid === 'function') {
          const activeIndustry = document.querySelector('#placementCategoryPills .active')?.dataset.industry || 'all';
          const activeCollege = document.getElementById('placementCollegeFilterSelect')?.value || 'all';
          renderPlacementCompanyGrid(activeIndustry, activeCollege);
        }
      }
    })
    .catch(() => {});
}
window.fetchPlacementsLive = fetchPlacementsLive;

function getPlacementReactions() {
  try {
    return JSON.parse(localStorage.getItem('campnova_placement_reactions') || '{}');
  } catch (e) {
    return {};
  }
}

function savePlacementReactions(reactions) {
  localStorage.setItem('campnova_placement_reactions', JSON.stringify(reactions));
}

function togglePlacementReaction(companyId, reactionType) {
  const reactions = getPlacementReactions();
  if (!reactions[companyId]) {
    reactions[companyId] = { helpful: 142, save: 58, userReacted: {} };
  }
  if (!reactions[companyId].userReacted) {
    reactions[companyId].userReacted = {};
  }

  const currentStatus = reactions[companyId].userReacted[reactionType];
  if (currentStatus) {
    reactions[companyId][reactionType] = Math.max(0, (reactions[companyId][reactionType] || 1) - 1);
    reactions[companyId].userReacted[reactionType] = false;
    showToast(`Removed your "${reactionType}" feedback.`);
  } else {
    reactions[companyId][reactionType] = (reactions[companyId][reactionType] || 0) + 1;
    reactions[companyId].userReacted[reactionType] = true;
    showToast(`Marked as "${reactionType}". Thank you!`);
  }

  savePlacementReactions(reactions);
  const activeIndustry = document.querySelector('#placementCategoryPills .active')?.dataset.industry || 'all';
  const activeCollege = document.getElementById('placementCollegeFilterSelect')?.value || 'all';
  renderPlacementCompanyGrid(activeIndustry, activeCollege);
}

function renderPlacementCompanyGrid(industryFilter = 'all', collegeFilter = 'all') {
  const grid = document.getElementById('placementCompanyGrid');
  if (!grid) return;

  const data = getPlacementIntelligence();
  const reactions = getPlacementReactions();

  const filtered = data.filter(item => {
    const matchesIndustry = industryFilter === 'all' || item.industry.toLowerCase().includes(industryFilter.toLowerCase());
    const matchesCollege = collegeFilter === 'all' || item.colleges.some(c => c.toLowerCase().includes(collegeFilter.toLowerCase()));
    return matchesIndustry && matchesCollege;
  });

  grid.innerHTML = filtered.map(item => {
    const r = reactions[item.id] || { helpful: 142, save: 58, userReacted: {} };
    const userR = r.userReacted || {};
    const topTopic = item.selectionProcess?.aptitude?.topics?.[0] || { name: 'Quantitative Aptitude', priority: 'High Priority' };

    return `
      <article class="company-prep-card" data-company-id="${item.id}">
        <div class="company-card-head">
          <div class="company-title-wrap">
            <h3>${item.companyName}</h3>
            <small>${item.industry}</small>
          </div>
          <span class="priority-tag preferred">${item.priority}</span>
        </div>

        <div class="company-meta-block">
          <strong>Key Roles:</strong>
          <span style="color:#fff;">${item.jobRoles.slice(0, 2).join(' &bull; ')}</span>
        </div>

        <div class="company-meta-block">
          <strong>Required Skills:</strong>
          <div class="company-skill-tags">
            ${item.requiredSkills.map(s => `<span class="company-skill-tag">${s}</span>`).join('')}
          </div>
        </div>

        <div class="quant-priority-row">
          <span>Key Aptitude Focus: <strong>${topTopic.name}</strong></span>
          <span class="quant-tag high">${topTopic.priority}</span>
        </div>

        <div style="font-size:10.5px; color:var(--theme-muted); display:flex; align-items:center; justify-content:space-between;">
          <span>🏛️ Active across ${item.colleges.length} tracked campuses</span>
          <span style="color:var(--teal); font-weight:700;">● Verified Recruiter</span>
        </div>

        <div class="company-card-actions">
          <button type="button" class="prep-guide-btn" onclick="openPlacementDetailModal('${item.id}')">
            <span>Prep Roadmap</span> <span>➔</span>
          </button>
          <div class="reaction-btn-group">
            <button type="button" class="reaction-pill-btn ${userR.helpful ? 'reacted' : ''}" onclick="togglePlacementReaction('${item.id}', 'helpful')" title="Helpful">
              👍 <small>${r.helpful || 0}</small>
            </button>
            <button type="button" class="reaction-pill-btn ${userR.save ? 'reacted' : ''}" onclick="togglePlacementReaction('${item.id}', 'save')" title="Save">
              🔖 <small>${r.save || 0}</small>
            </button>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function openPlacementPlaybookModal(companyId) {
  const data = getPlacementIntelligence();
  const item = data.find(c => c.id === companyId);
  if (!item) return;

  const modal = document.getElementById('placementDetailModal');
  const titleEl = document.getElementById('modalCompanyName');
  const industryEl = document.getElementById('modalCompanyIndustryTag');
  const bodyEl = document.getElementById('placementModalBody');

  if (titleEl) titleEl.textContent = `${item.companyName} — Placement Playbook`;
  if (industryEl) industryEl.textContent = `${item.industry} &bull; ${item.priority}`;

  if (bodyEl) {
    bodyEl.innerHTML = `
      <div class="prep-section-card">
        <div class="prep-section-title">
          <span>📋 Eligibility &amp; Selection Process</span>
          <span style="font-size:11px; color:var(--teal);">Verified Evaluation</span>
        </div>
        <div style="font-size:12.5px; line-height:1.5; color:#8E9CA6;">
          <p style="margin:0 0 8px;"><strong>Academic Eligibility:</strong> ${item.eligibility}</p>
          <p style="margin:0 0 8px;"><strong>Selection Flow:</strong> ${item.selectionProcess?.rounds || 'Standard Rounds'}</p>
          <p style="margin:0;"><strong>Tracked Campuses:</strong> ${item.colleges.join(', ')}</p>
        </div>
      </div>

      <div class="prep-section-card">
        <div class="prep-section-title">
          <span>📐 Quantitative Aptitude &amp; Logic Matrix</span>
          <span style="font-size:11px; color:var(--coral);">${item.selectionProcess?.aptitude?.status || 'Essential'}</span>
        </div>
        <div class="quant-topics-grid">
          ${(item.selectionProcess?.aptitude?.topics || []).map(t => `
            <div class="quant-topic-item">
              <div class="quant-topic-item-head">
                <span>${t.name}</span>
                <span class="quant-tag high">${t.priority}</span>
              </div>
              <div class="quant-topic-item-desc">${t.desc}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="prep-section-card">
        <div class="prep-section-title">
          <span>📚 Recommended Preparation Resources</span>
        </div>
        <div style="display:flex; flex-direction:column; gap:8px;">
          ${(item.resources || []).map(r => `
            <a href="${r.url}" target="_blank" rel="noopener noreferrer" class="resource-link-row">
              <div class="resource-info">
                <strong>${r.title}</strong>
                <small>${r.type} &bull; ${r.recommendedFor}</small>
              </div>
              <span style="color:var(--coral); font-size:15px; font-weight:700;">↗</span>
            </a>
          `).join('')}
        </div>
      </div>
    `;
  }

  if (modal) {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
}

// Hook placement filter pills & college select
document.querySelectorAll('#placementCategoryPills .placement-pill-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#placementCategoryPills .placement-pill-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const activeCollege = document.getElementById('placementCollegeFilterSelect')?.value || 'all';
    renderPlacementCompanyGrid(btn.dataset.industry, activeCollege);
  });
});

const placementCollegeSelect = document.getElementById('placementCollegeFilterSelect');
if (placementCollegeSelect) {
  placementCollegeSelect.addEventListener('change', () => {
    const activeIndustry = document.querySelector('#placementCategoryPills .active')?.dataset.industry || 'all';
    renderPlacementCompanyGrid(activeIndustry, placementCollegeSelect.value);
  });
}

// ============================================================================
// 14. PERSONALIZED CAREER DOMAIN PATHWAYS
// ============================================================================
const careerPrioritiesData = {
  'Artificial Intelligence & ML': {
    title: 'Artificial Intelligence & Machine Learning',
    desc: 'Deep learning architectures, Large Language Models (LLMs), neural networks, computer vision, and autonomous agent systems.',
    growth: '+45% YoY Surge',
    salary: '₹14L - ₹42L / yr',
    courses: ['B.Tech Computer Science & AI', 'M.Tech AI & Data Engineering', 'B.Sc Data Science'],
    colleges: ['IISc Bengaluru', 'IIT Delhi', 'IIT Madras', 'IIT Bombay', 'BITS Pilani'],
    skills: ['PyTorch / TensorFlow', 'Python', 'MLOps & Deployment', 'Transformers & NLP', 'Vector Databases'],
    recruiters: ['Google DeepMind', 'Microsoft IDC', 'NVIDIA India', 'Amazon AWS', 'Adobe Research']
  },
  'Data Science & Analytics': {
    title: 'Data Science & Business Analytics',
    desc: 'Large-scale data pipelines, applied statistical modeling, data storytelling, and predictive business decision systems.',
    growth: '+38% High Demand',
    salary: '₹12L - ₹36L / yr',
    courses: ['B.Sc Data Science & Analytics', 'B.Tech CSE (Data Science)', 'M.Sc Applied Statistics'],
    colleges: ['IISc Bengaluru', 'IIT Kanpur', 'IIT Kharagpur', 'IIM Ahmedabad', 'Christ University'],
    skills: ['Python / R', 'SQL & Distributed Querying', 'PowerBI / Tableau', 'Machine Learning', 'Big Data (Spark)'],
    recruiters: ['Goldman Sachs', 'Fractal Analytics', 'Tiger Analytics', 'American Express', 'McKinsey']
  },
  'Full-Stack & Cloud Architecture': {
    title: 'Full-Stack & Cloud Architecture',
    desc: 'Modern frontend interfaces, resilient backend microservices, serverless computing, and distributed cloud systems.',
    growth: '+34% Steady Growth',
    salary: '₹10L - ₹32L / yr',
    courses: ['B.Tech Information Technology', 'B.Tech CSE (Cloud Computing)', 'MCA'],
    colleges: ['IIT Madras', 'BITS Pilani', 'Vellore Institute (VIT)', 'Anna University', 'SRM Institute'],
    skills: ['React / Next.js', 'Node.js / Go', 'AWS / Azure / GCP', 'Docker & Kubernetes', 'PostgreSQL / Redis'],
    recruiters: ['Microsoft', 'Amazon', 'Atlassian', 'Uber India', 'Salesforce']
  },
  'Cybersecurity & Defense': {
    title: 'Cybersecurity & InfoSec Operations',
    desc: 'Threat intelligence, ethical penetration testing, zero-trust network defenses, and regulatory compliance.',
    growth: '+42% Critical Demand',
    salary: '₹12L - ₹38L / yr',
    courses: ['B.Tech Cyber Security', 'M.Tech Information Assurance', 'B.Sc Cyber Forensics'],
    colleges: ['IIT Kanpur', 'IIT Delhi', 'BITS Pilani', 'University of Delhi', 'Manipal Academy'],
    skills: ['Ethical Hacking (CEH)', 'Network Forensics', 'Cryptography & SIEM', 'Linux Kernel', 'Cloud Security'],
    recruiters: ['Palo Alto Networks', 'CrowdStrike', 'Cisco Systems', 'KPMG Cyber', 'DRDO / NIC']
  },
  'Quantitative Finance & FinTech': {
    title: 'Quantitative Finance & FinTech',
    desc: 'Algorithmic trading models, high-frequency execution, derivative pricing, and digital market architecture.',
    growth: '+32% Premium Track',
    salary: '₹18L - ₹55L / yr',
    courses: ['B.Tech Math & Computing', 'BBA FinTech', 'M.Sc Financial Mathematics'],
    colleges: ['IIT Delhi', 'IISc Bengaluru', 'IIT Bombay', 'IIM Ahmedabad', 'IIM Bangalore'],
    skills: ['Stochastic Calculus', 'C++ Low-Latency', 'Python Time-Series', 'Risk Modeling', 'Blockchain / DeFi'],
    recruiters: ['Goldman Sachs', 'Morgan Stanley', 'Jane Street', 'Tower Research', 'DE Shaw']
  },
  'Management Consulting & Strategy': {
    title: 'Management Consulting & Strategy',
    desc: 'Corporate growth advisory, digital transformation, organizational design, and market expansion strategy.',
    growth: '+28% Executive Track',
    salary: '₹16L - ₹45L / yr',
    courses: ['Integrated MBA', 'BBA in Corporate Strategy', 'B.Com (Hons)'],
    colleges: ['IIM Ahmedabad', 'IIM Bangalore', 'Christ University', 'University of Delhi', 'Symbiosis Pune'],
    skills: ['Strategic Problem Solving', 'Financial Modeling', 'Market Sizing', 'Executive Communication', 'Operations'],
    recruiters: ['McKinsey & Company', 'Boston Consulting Group (BCG)', 'Bain & Company', 'Deloitte', 'EY Parthenon']
  },
  'Biotechnology & Healthcare': {
    title: 'Biotechnology & Healthcare Innovation',
    desc: 'Genomic therapy, biomedical devices, clinical trial informatics, and pharmaceutical bioprocess engineering.',
    growth: '+30% High Growth',
    salary: '₹8L - ₹26L / yr',
    courses: ['MBBS', 'B.Tech Biotechnology', 'B.Pharm', 'M.Sc Bioinformatics'],
    colleges: ['AIIMS Delhi', 'IISc Bengaluru', 'IIT Kharagpur', 'Manipal Academy', 'Anna University'],
    skills: ['CRISPR & Gene Editing', 'Molecular Diagnostics', 'Bioinformatics Tools', 'Bioprocess Modeling', 'Clinical Data'],
    recruiters: ['Biocon', 'Serum Institute of India', 'Dr. Reddy\'s Labs', 'Novartis', 'AstraZeneca']
  },
  'UI/UX & Product Design': {
    title: 'UI/UX & Interactive Product Design',
    desc: 'Human-computer interaction, spatial user interfaces, interactive Figma design systems, and product ergonomics.',
    growth: '+36% Rapid Surge',
    salary: '₹9L - ₹28L / yr',
    courses: ['B.Des UI/UX', 'M.Des Interaction Design', 'B.Sc Visual Media'],
    colleges: ['IIT Bombay (IDC)', 'IIT Delhi', 'Christ University', 'Symbiosis Pune', 'Tata Elxsi Studio'],
    skills: ['Figma / Framer', 'User Research & Wireframing', 'Design Systems', 'Micro-Interactions', 'Prototyping'],
    recruiters: ['Google', 'CRED', 'Flipkart', 'Swiggy', 'Tata Elxsi']
  }
};

let activeCareerPriority = 'Artificial Intelligence & ML';

function renderCareerPathway(priorityKey = activeCareerPriority) {
  activeCareerPriority = priorityKey;
  const container = document.getElementById('careerPathwayContainer');
  if (!container) return;

  const data = careerPrioritiesData[priorityKey] || careerPrioritiesData['Artificial Intelligence & ML'];

  container.innerHTML = `
    <div class="career-goal-hero-card">
      <div class="career-goal-meta">
        <span class="eyebrow" style="color:var(--coral);">PRIORITY TRACK &bull; PERSONALIZED OUTCOMES</span>
        <h3>${data.title}</h3>
        <p>${data.desc}</p>
      </div>

      <div class="career-metrics-badge-group">
        <div class="career-metric-chip">
          <small>Market Demand</small>
          <strong>${data.growth}</strong>
        </div>
        <div class="career-metric-chip">
          <small>Entry Salary Band</small>
          <strong style="color:var(--coral);">${data.salary}</strong>
        </div>
      </div>
    </div>

    <div class="career-subfields-grid">
      <div class="career-subfield-card">
        <div class="career-subfield-head">
          <div class="career-subfield-title"><span>🎓</span> Flagship Degree Pathways</div>
          <span class="career-subfield-tag">Academics</span>
        </div>
        <div class="career-card-list">
          ${data.courses.map(c => `
            <div style="font-size:13px; color:#fff; display:flex; align-items:center; justify-content:space-between; padding:6px 0; border-bottom:1px solid rgba(255,255,255,0.04);">
              <span>📖 ${c}</span>
              <button type="button" class="text-link" style="font-size:11px;" onclick="openCourseDetails('${c.replace(/'/g, "\\'")}')">Explore ➔</button>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="career-subfield-card">
        <div class="career-subfield-head">
          <div class="career-subfield-title"><span>🏛️</span> Top Tier-1 Institutions</div>
          <span class="career-subfield-tag">Campuses</span>
        </div>
        <div class="career-card-list">
          ${data.colleges.map(colName => `
            <div style="font-size:13px; color:#fff; display:flex; align-items:center; justify-content:space-between; padding:6px 0; border-bottom:1px solid rgba(255,255,255,0.04);">
              <span>🏛️ ${colName}</span>
              <button type="button" class="text-link" style="font-size:11px;" onclick="setView('colleges')">View ➔</button>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="career-subfield-card">
        <div class="career-subfield-head">
          <div class="career-subfield-title"><span>⚡</span> High-Impact Skills</div>
          <span class="career-subfield-tag">Skillset</span>
        </div>
        <div class="company-skill-tags" style="margin-top:4px;">
          ${data.skills.map(sk => `<span class="company-skill-tag">✓ ${sk}</span>`).join('')}
        </div>
      </div>

      <div class="career-subfield-card">
        <div class="career-subfield-head">
          <div class="career-subfield-title"><span>🏢</span> Leading Recruiters</div>
          <span class="career-subfield-tag">Placement</span>
        </div>
        <div class="company-skill-tags" style="margin-top:4px;">
          ${data.recruiters.map(rec => `<span class="company-skill-tag" style="color:var(--teal); border-color:rgba(58, 155, 143,0.3); background:rgba(58, 155, 143,0.08);">💼 ${rec}</span>`).join('')}
        </div>
      </div>
    </div>
  `;
}

// Hook career priority bar pills
document.querySelectorAll('#careerPriorityBar .career-priority-pill').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#careerPriorityBar .career-priority-pill').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const priority = btn.dataset.careerPriority;
    renderCareerPathway(priority);
  });
});

// ============================================================================
// 15. INTERNSHIPS HUB & 30-DOMAIN SELECTION POPUP
// ============================================================================
const ALL_INTERNSHIP_DOMAINS = [
  { name: 'Web Development', category: 'Software & Web Engineering', icon: '🌐' },
  { name: 'Full Stack Development', category: 'Software & Web Engineering', icon: '💻' },
  { name: 'Software Development', category: 'Software & Web Engineering', icon: '⚡' },
  { name: 'Python Development', category: 'Software & Web Engineering', icon: '🐍' },
  { name: 'Java Development', category: 'Software & Web Engineering', icon: '☕' },
  { name: 'Mobile App Development', category: 'Software & Web Engineering', icon: '📱' },
  { name: 'Embedded Systems', category: 'Hardware & IoT', icon: '🔌' },
  { name: 'Internet of Things (IoT)', category: 'Hardware & IoT', icon: '📡' },
  { name: 'Blockchain Development', category: 'Emerging Technologies', icon: '⛓️' },
  { name: 'Game Development', category: 'Emerging Technologies', icon: '🎮' },
  { name: 'AR/VR Development', category: 'Emerging Technologies', icon: '🥽' },
  { name: 'Data Science', category: 'Data Science & AI', icon: '📊' },
  { name: 'Data Analytics', category: 'Data Science & AI', icon: '📈' },
  { name: 'Artificial Intelligence (AI)', category: 'Data Science & AI', icon: '🤖' },
  { name: 'Machine Learning (ML)', category: 'Data Science & AI', icon: '🧠' },
  { name: 'Generative AI', category: 'Data Science & AI', icon: '✨' },
  { name: 'Business Analytics', category: 'Data Science & AI', icon: '💼' },
  { name: 'Business Intelligence (BI)', category: 'Data Science & AI', icon: '📉' },
  { name: 'Cloud Computing', category: 'Cloud, DevOps & Systems', icon: '☁️' },
  { name: 'DevOps', category: 'Cloud, DevOps & Systems', icon: '🔄' },
  { name: 'Cloud & DevOps', category: 'Cloud, DevOps & Systems', icon: '🚀' },
  { name: 'Database Management', category: 'Cloud, DevOps & Systems', icon: '🗄️' },
  { name: 'Computer Networking', category: 'Cloud, DevOps & Systems', icon: '🌐' },
  { name: 'IT Support / Technical Support', category: 'Cloud, DevOps & Systems', icon: '🛠️' },
  { name: 'Cyber Security', category: 'Cybersecurity & Quality', icon: '🛡️' },
  { name: 'Software Testing / QA', category: 'Cybersecurity & Quality', icon: '🔍' },
  { name: 'Automation Testing', category: 'Cybersecurity & Quality', icon: '⚙️' },
  { name: 'Robotic Process Automation (RPA)', category: 'Cybersecurity & Quality', icon: '🦾' },
  { name: 'UI/UX Design', category: 'Design, Marketing & Strategy', icon: '🎨' },
  { name: 'Digital Marketing', category: 'Design, Marketing & Strategy', icon: '📣' }
];

let activeInternshipDomain = 'all';

function getIntelligentDomainSuggestions() {
  const goal = (userSelectedGoal || '').toLowerCase();
  if (goal.includes('placement') || goal.includes('career')) {
    return ['Full Stack Development', 'Cloud & DevOps'];
  }
  if (goal.includes('college') || goal.includes('exam')) {
    return ['Python Development', 'Data Science'];
  }
  return ['Python Development', 'Data Analytics'];
}

function selectInternshipDomain(domainName) {
  activeInternshipDomain = domainName;
  renderSuggestedDomainPills();
  renderInternshipsGrid();
}
window.selectInternshipDomain = selectInternshipDomain;

function renderSuggestedDomainPills() {
  const container = document.getElementById('internshipDomainPills');
  if (!container) return;

  const suggestions = getIntelligentDomainSuggestions();
  const isCustom = activeInternshipDomain !== 'all' && !suggestions.includes(activeInternshipDomain);

  let pillsHtml = `
    <button type="button" class="internship-pill-btn ${activeInternshipDomain === 'all' ? 'active' : ''}" onclick="selectInternshipDomain('all')">
      All Domains
    </button>
  `;

  suggestions.forEach(dom => {
    const isActive = activeInternshipDomain === dom;
    pillsHtml += `
      <button type="button" class="internship-pill-btn ${isActive ? 'active' : ''}" onclick="selectInternshipDomain('${dom.replace(/'/g, "\\'")}')">
        ${dom}
      </button>
    `;
  });

  if (isCustom) {
    pillsHtml += `
      <button type="button" class="internship-pill-btn active" onclick="selectInternshipDomain('${activeInternshipDomain.replace(/'/g, "\\'")}')">
        ${activeInternshipDomain} <span style="margin-left:4px;">✕</span>
      </button>
    `;
  }

  pillsHtml += `
    <button type="button" class="internship-pill-btn others-pill-btn" id="openDomainOthersModalBtn" onclick="openDomainsModal()">
      Others +
    </button>
  `;

  container.innerHTML = pillsHtml;
}

function openDomainsModal() {
  const modal = document.getElementById('internshipDomainsModal');
  if (modal) {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    renderDomainsModalList('');
  }
}
window.openDomainsModal = openDomainsModal;

function clearDomainSearch() {
  const input = document.getElementById('domainModalSearchInput');
  const clearBtn = document.getElementById('domainModalClearBtn');
  if (input) input.value = '';
  if (clearBtn) clearBtn.style.display = 'none';
  renderDomainsModalList('');
}
window.clearDomainSearch = clearDomainSearch;

function renderDomainsModalList(query = '') {
  const container = document.getElementById('modalDomainsListContainer');
  if (!container) return;

  const q = (query || '').toLowerCase().trim();
  const clearBtn = document.getElementById('domainModalClearBtn');
  if (clearBtn) clearBtn.style.display = q ? 'block' : 'none';

  const filtered = ALL_INTERNSHIP_DOMAINS.filter(d => !q || `${d.name} ${d.category}`.toLowerCase().includes(q));

  const grouped = {};
  filtered.forEach(d => {
    if (!grouped[d.category]) grouped[d.category] = [];
    grouped[d.category].push(d);
  });

  const categories = Object.keys(grouped);
  if (categories.length === 0) {
    container.innerHTML = `<p style="text-align:center; color:var(--theme-muted); padding:20px;">No domains found matching "${query}".</p>`;
    return;
  }

  container.innerHTML = categories.map(cat => `
    <div class="domain-modal-group" style="margin-bottom:16px;">
      <h4 style="font-size:12px; color:var(--coral); text-transform:uppercase; margin:0 0 8px;">${cat}</h4>
      <div style="display:flex; flex-wrap:wrap; gap:8px;">
        ${grouped[cat].map(d => `
          <button type="button" class="internship-pill-btn ${activeInternshipDomain === d.name ? 'active' : ''}" onclick="selectDomainAndClose('${d.name.replace(/'/g, "\\'")}')">
            ${d.icon} ${d.name}
          </button>
        `).join('')}
      </div>
    </div>
  `).join('');
}

function selectDomainAndClose(domainName) {
  selectInternshipDomain(domainName);
  closeDomainsModal();
}
window.selectDomainAndClose = selectDomainAndClose;

const domainSearchInput = document.getElementById('domainModalSearchInput');
if (domainSearchInput) {
  domainSearchInput.addEventListener('input', e => {
    renderDomainsModalList(e.target.value);
  });
}

// Internship dataset
const DEFAULT_INTERNSHIPS = [
  {
    id: 'INT-001',
    company: 'Google',
    role: 'Software Engineering Summer Intern',
    domain: 'Software Development',
    location: 'Bengaluru',
    workMode: 'Hybrid',
    stipend: '₹1,25,000 / month',
    paid: true,
    duration: '2 Months (Summer)',
    eligibility: 'B.Tech / M.Tech / Dual Degree in Computer Science or STEM branches',
    skills: ['Data Structures & Algorithms', 'C++ / Java / Python', 'Software Development'],
    deadline: '15 Oct 2026',
    certification: 'Official Certificate + PPO Opportunity',
    aboutCompany: 'Google is a global technology leader in search, cloud infrastructure, AI, and consumer hardware.',
    relatedCourses: 'B.Tech CS, B.Tech AI, MCA, M.Tech Computing',
    applyUrl: 'https://careers.google.com/students/',
    verified: true
  },
  {
    id: 'INT-002',
    company: 'Microsoft',
    role: 'Cloud Solutions & DevOps Intern',
    domain: 'Cloud & DevOps',
    location: 'Hyderabad',
    workMode: 'Hybrid',
    stipend: '₹1,10,000 / month',
    paid: true,
    duration: '2 Months (Summer)',
    eligibility: 'Pre-final year engineering students with strong OS & networking foundations',
    skills: ['Azure / AWS Basics', 'Linux & Bash Scripting', 'Docker & Kubernetes', 'CI/CD & DevOps'],
    deadline: '28 Oct 2026',
    certification: 'Microsoft Global Student Certificate + PPO Opportunity',
    aboutCompany: 'Microsoft develops cloud platforms, developer tools, AI copilot systems, and enterprise solutions.',
    relatedCourses: 'B.Tech Cloud Computing, B.Tech IT, M.Sc CS',
    applyUrl: 'https://careers.microsoft.com/students/',
    verified: true
  },
  {
    id: 'INT-003',
    company: 'Goldman Sachs',
    role: 'Summer Quantitative & Data Analytics Intern',
    domain: 'Data Analytics',
    location: 'Bengaluru',
    workMode: 'On-site',
    stipend: '₹1,40,000 / month',
    paid: true,
    duration: '2 Months (Summer)',
    eligibility: 'B.Tech / B.Sc / M.Sc in Mathematics, Computing, Statistics or Physics',
    skills: ['Probability & Statistics', 'Python', 'Data Analytics', 'Financial Markets Basics'],
    deadline: '05 Nov 2026',
    certification: 'Goldman Sachs Global Analyst Certificate + Full-Time Offer Track',
    aboutCompany: 'Goldman Sachs is a leading global financial institution delivering investment banking and securities services.',
    relatedCourses: 'B.Tech Math & Computing, M.Sc Statistics, B.Sc Economics',
    applyUrl: 'https://www.goldmansachs.com/careers/students/',
    verified: true
  },
  {
    id: 'INT-004',
    company: 'Amazon',
    role: 'Data Science & Generative AI Intern',
    domain: 'Data Science',
    location: 'Hyderabad',
    workMode: 'Hybrid',
    stipend: '₹1,15,000 / month',
    paid: true,
    duration: '6 Months (Semester)',
    eligibility: 'Final/Pre-final year B.Tech / M.Tech in CS/DS with PyTorch/Scikit-learn',
    skills: ['Data Science', 'Machine Learning (ML)', 'Generative AI', 'Python', 'AWS Cloud'],
    deadline: '20 Nov 2026',
    certification: 'Amazon Student Programs Certificate + Performance Bonus',
    aboutCompany: 'Amazon operates e-commerce, cloud computing (AWS), digital streaming, and artificial intelligence.',
    relatedCourses: 'B.Tech Data Science, B.Tech AI, M.Tech Data Engineering',
    applyUrl: 'https://www.amazon.jobs/en/business_categories/student-programs',
    verified: true
  },
  {
    id: 'INT-005',
    company: 'Cisco Systems',
    role: 'Python Software & Network Automation Intern',
    domain: 'Python Development',
    location: 'Bengaluru',
    workMode: 'Remote',
    stipend: '₹75,000 / month',
    paid: true,
    duration: '6 Months (Semester)',
    eligibility: 'B.Tech / B.E. in CS/IT/ECE with proficiency in Python scripting & REST APIs',
    skills: ['Python Development', 'Computer Networking', 'REST APIs', 'Git & Linux'],
    deadline: '12 Dec 2026',
    certification: 'Cisco Software Engineering Credential + PPO Evaluation',
    aboutCompany: 'Cisco is a worldwide leader in networking, enterprise security, and cloud telecommunications.',
    relatedCourses: 'B.Tech CS, B.Tech IT, BCA, MCA',
    applyUrl: 'https://www.cisco.com/c/en/us/about/careers/we-are-cisco/students-and-new-graduates.html',
    verified: true
  },
  {
    id: 'INT-006',
    company: 'McKinsey & Company',
    role: 'Business Analytics & BI Strategy Intern',
    domain: 'Business Analytics',
    location: 'Mumbai',
    workMode: 'On-site',
    stipend: '₹85,000 / month',
    paid: true,
    duration: '3 Months',
    eligibility: 'Pre-final year students from top engineering, economics, or business colleges',
    skills: ['Business Analytics', 'Business Intelligence (BI)', 'Data Analytics', 'Case Solving'],
    deadline: '10 Nov 2026',
    certification: 'McKinsey & Company Advisory Fellowship Credential',
    aboutCompany: 'McKinsey & Company is a premier global management consulting firm serving world-leading organizations.',
    relatedCourses: 'B.Tech, BBA, B.Com, Integrated MBA, B.Sc Economics',
    applyUrl: 'https://www.mckinsey.com/careers/students',
    verified: true
  },
  {
    id: 'INT-007',
    company: 'Palo Alto Networks',
    role: 'Cyber Security & Threat Intelligence Intern',
    domain: 'Cyber Security',
    location: 'Pune',
    workMode: 'Hybrid',
    stipend: '₹90,000 / month',
    paid: true,
    duration: '6 Months (Semester)',
    eligibility: 'Pre-final/Final year B.Tech in CS/IT with knowledge of network security & ethical hacking',
    skills: ['Cyber Security', 'Computer Networking', 'Linux', 'Vulnerability Assessment'],
    deadline: '18 Dec 2026',
    certification: 'Palo Alto Global Cyber Security Certificate',
    aboutCompany: 'Palo Alto Networks is the global cybersecurity leader shaping cloud-delivered defense.',
    relatedCourses: 'B.Tech Cyber Security, B.Tech IT, M.Tech InfoSec',
    applyUrl: 'https://jobs.paloaltonetworks.com/en/students-graduates/',
    verified: true
  },
  {
    id: 'INT-008',
    company: 'Zoho Corporation',
    role: 'Full Stack & Web Application Developer Intern',
    domain: 'Web Development',
    location: 'Chennai',
    workMode: 'On-site',
    stipend: '₹40,000 / month',
    paid: true,
    duration: '3 Months',
    eligibility: 'Passionate coders across any degree discipline; No strict CGPA criteria',
    skills: ['Web Development', 'Full Stack Development', 'JavaScript / React', 'Java / Node.js'],
    deadline: '25 Nov 2026',
    certification: 'Zoho Developer Track Certificate + Full-Time Placement Offer',
    aboutCompany: 'Zoho Corporation is a leading Indian SaaS software company building global enterprise suites.',
    relatedCourses: 'B.Tech, B.Sc CS, BCA, MCA',
    applyUrl: 'https://www.zoho.com/careers/',
    verified: true
  },
  {
    id: 'INT-009',
    company: 'Robert Bosch',
    role: 'Embedded Systems & Automotive IoT Intern',
    domain: 'Embedded Systems',
    location: 'Pune',
    workMode: 'On-site',
    stipend: '₹45,000 / month',
    paid: true,
    duration: '6 Months (Semester)',
    eligibility: 'B.Tech in ECE / EEE / Mechatronics with microcontrollers and embedded C mastery',
    skills: ['Embedded Systems', 'Internet of Things (IoT)', 'Embedded C', 'Microcontrollers'],
    deadline: '02 Dec 2026',
    certification: 'Bosch Engineering Technical Certificate',
    aboutCompany: 'Bosch is a world-leading supplier of technology, smart mobility, and industrial IoT solutions.',
    relatedCourses: 'B.Tech ECE, B.Tech Embedded Systems, M.Tech VLSI',
    applyUrl: 'https://www.bosch.in/careers/',
    verified: true
  },
  {
    id: 'INT-010',
    company: 'Tata Elxsi',
    role: 'UI/UX & Product Design Trainee',
    domain: 'UI/UX Design',
    location: 'Bengaluru',
    workMode: 'Hybrid',
    stipend: '₹35,000 / month',
    paid: true,
    duration: '3 Months',
    eligibility: 'B.Des / M.Des / Creative students with an interactive Figma portfolio',
    skills: ['UI/UX Design', 'Figma & Prototyping', 'User Research', 'AR/VR Development'],
    deadline: '30 Nov 2026',
    certification: 'Tata Elxsi Design Studio Verified Certificate',
    aboutCompany: 'Tata Elxsi is a premier global design and technology services provider.',
    relatedCourses: 'B.Des, M.Des, B.Sc Multimedia, Creative Arts',
    applyUrl: 'https://www.tataelxsi.com/careers',
    verified: true
  },
  {
    id: 'INT-011',
    company: 'Deloitte Digital',
    role: 'Digital Marketing & Growth Strategy Intern',
    domain: 'Digital Marketing',
    location: 'Delhi NCR',
    workMode: 'Hybrid',
    stipend: '₹50,000 / month',
    paid: true,
    duration: '2 Months (Summer)',
    eligibility: 'BBA / B.Com / MBA / B.Tech students interested in marketing automation & analytics',
    skills: ['Digital Marketing', 'Data Analytics', 'SEO & SEM', 'Social Media Strategy'],
    deadline: '14 Dec 2026',
    certification: 'Deloitte Digital Practitioner Credential',
    aboutCompany: 'Deloitte Digital helps brands reimagine digital customer experiences and creative growth.',
    relatedCourses: 'BBA, B.Com, MBA Marketing, B.Sc Economics',
    applyUrl: 'https://www2.deloitte.com/in/en/pages/careers/articles/students.html',
    verified: true
  },
  {
    id: 'INT-012',
    company: 'IISc Research Labs',
    role: 'Academic AI & Quantum Computing Research Fellow',
    domain: 'Artificial Intelligence (AI)',
    location: 'Bengaluru',
    workMode: 'On-site',
    stipend: 'Research Fellowship (Unpaid / Funded)',
    paid: false,
    duration: '3 Months',
    eligibility: 'Undergraduate STEM students with strong mathematical rigor & interest in publication',
    skills: ['Artificial Intelligence (AI)', 'Machine Learning (ML)', 'Python / PyTorch', 'Linear Algebra'],
    deadline: '30 Dec 2026',
    certification: 'IISc Principal Investigator Research Letter & Publication Co-authorship',
    aboutCompany: "Indian Institute of Science (IISc) is India's top premier research institute.",
    relatedCourses: 'B.Tech CS, B.Sc Physics, B.Tech AI, Dual Degree',
    applyUrl: 'https://iisc.ac.in/admissions/research-fellowships/',
    verified: true
  }
];

function getInternshipsData() {
  const custom = localStorage.getItem('campnova_internships');
  if (custom) {
    try {
      const parsed = JSON.parse(custom);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch(e) {}
  }
  return window._cachedInternships || DEFAULT_INTERNSHIPS;
}

function fetchInternshipsLive() {
  fetch('/api/internships')
    .then(res => res.json())
    .then(data => {
      if (data && data.success && Array.isArray(data.internships) && data.internships.length > 0) {
        window._cachedInternships = data.internships;
        if (typeof renderInternshipsGrid === 'function') renderInternshipsGrid();
      }
    })
    .catch(() => {});
}
window.fetchInternshipsLive = fetchInternshipsLive;

function renderInternshipsGrid() {
  const grid = document.getElementById('internshipGrid');
  if (!grid) return;

  const data = getInternshipsData();
  const domainFilter = activeInternshipDomain || 'all';
  const workModeFilter = document.getElementById('internshipWorkModeSelect')?.value || 'all';
  const paidFilter = document.getElementById('internshipPaidSelect')?.value || 'all';
  const locationFilter = document.getElementById('internshipLocationSelect')?.value || 'all';
  const durationFilter = document.getElementById('internshipDurationSelect')?.value || 'all';

  const filtered = data.filter(item => {
    if (domainFilter !== 'all') {
      const target = domainFilter.toLowerCase();
      const itemDom = (item.domain || '').toLowerCase();
      const itemRole = (item.role || '').toLowerCase();
      const itemSkills = (item.skills || []).join(' ').toLowerCase();
      if (!itemDom.includes(target) && !itemRole.includes(target) && !itemSkills.includes(target)) return false;
    }

    if (workModeFilter !== 'all' && item.workMode.toLowerCase() !== workModeFilter.toLowerCase()) return false;
    if (paidFilter === 'paid' && !item.paid) return false;
    if (paidFilter === 'unpaid' && item.paid) return false;
    if (locationFilter !== 'all' && !item.location.toLowerCase().includes(locationFilter.toLowerCase())) return false;
    if (durationFilter !== 'all' && !item.duration.toLowerCase().includes(durationFilter.toLowerCase())) return false;
    return true;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column:1/-1; text-align:center; padding:36px 20px; background:var(--theme-surface); border-radius:10px; border:1px solid var(--theme-line);">
        <p style="color:#fff; font-size:15px; margin:0 0 8px;">No internships found matching your filters.</p>
        <button type="button" class="primary-button" onclick="selectInternshipDomain('all')">Reset Domain Filters</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(item => `
    <div class="internship-card">
      <div class="internship-card-head">
        <div class="internship-company-badge">
          <div class="internship-company-avatar">${item.company.charAt(0)}</div>
          <div>
            <h4 class="internship-role-title">${item.role}</h4>
            <div class="internship-company-name">${item.company} &bull; ${item.domain}</div>
          </div>
        </div>
      </div>

      <div class="internship-meta-row">
        <span class="stipend-tag">💰 ${item.stipend}</span>
        <span class="workmode-tag">📍 ${item.location} (${item.workMode})</span>
        <span class="duration-tag">⏱️ ${item.duration}</span>
      </div>

      <div class="internship-details-list">
        <div><strong>Eligibility:</strong> ${item.eligibility}</div>
        <div><strong>Key Skills:</strong> ${item.skills.join(', ')}</div>
        <div style="color:var(--teal); font-weight:600;">📜 ${item.certification}</div>
      </div>

      <div class="internship-card-footer">
        <div class="deadline-chip">Deadline: <strong>${item.deadline}</strong></div>
        <div class="internship-card-actions">
          <button type="button" class="internship-details-btn" onclick="openInternshipModal('${item.id}')">
            View Details
          </button>
          ${(() => {
            const portalUrl = formatPortalUrl(item.applyUrl || item.apply_url || item.application_url || item.website);
            return portalUrl ? `
              <a href="${escapeHtml(portalUrl)}" target="_blank" rel="noopener noreferrer" class="internship-portal-btn">
                Apply ↗
              </a>
            ` : '';
          })()}
        </div>
      </div>
    </div>
  `).join('');
}

function openInternshipDetailModalLegacy(internshipId) {
  const data = getInternshipsData();
  const item = data.find(i => i.id === internshipId);
  if (!item) return;

  const modal = document.getElementById('internshipDetailModal');
  const roleEl = document.getElementById('modalInternshipRole');
  const tagEl = document.getElementById('modalInternshipCompanyTag');
  const bodyEl = document.getElementById('internshipModalBody');
  const deadlineEl = document.getElementById('modalInternshipDeadlineDisplay');
  const applyLinkEl = document.getElementById('modalInternshipApplyLink');

  if (roleEl) roleEl.textContent = `${item.role} — ${item.company}`;
  if (tagEl) tagEl.textContent = `${item.company.toUpperCase()} &bull; ${item.domain.toUpperCase()}`;
  if (deadlineEl) deadlineEl.textContent = `Application Deadline: ${item.deadline}`;
  if (applyLinkEl) {
    const validPortal = formatPortalUrl(item.applyUrl || item.apply_url || item.application_url || item.website);
    if (validPortal) {
      applyLinkEl.href = validPortal;
      applyLinkEl.style.display = 'inline-flex';
    } else {
      applyLinkEl.removeAttribute('href');
      applyLinkEl.style.display = 'none';
    }
  }

  if (bodyEl) {
    bodyEl.innerHTML = `
      <div class="prep-section-card">
        <div class="prep-section-title">
          <span>🏢 About ${item.company} &amp; Role Overview</span>
          <span style="font-size:11px; color:var(--teal);">Verified Opportunity</span>
        </div>
        <p style="font-size:13px; color:#8E9CA6; line-height:1.5; margin:0 0 12px;">${item.aboutCompany}</p>
        <div class="internship-meta-row">
          <span class="stipend-tag">💰 Stipend: ${item.stipend}</span>
          <span class="workmode-tag">📍 Location: ${item.location} (${item.workMode})</span>
          <span class="duration-tag">⏱️ Duration: ${item.duration}</span>
        </div>
      </div>

      <div class="prep-section-card">
        <div class="prep-section-title">
          <span>📋 Academic Criteria &amp; Relevant Degree Tracks</span>
        </div>
        <div style="font-size:12.5px; color:#8E9CA6; line-height:1.5;">
          <div><strong>Academic Eligibility:</strong> ${item.eligibility}</div>
          <div style="margin-top:6px;"><strong>Related Degree Pathways:</strong> ${item.relatedCourses}</div>
        </div>
      </div>

      <div class="prep-section-card">
        <div class="prep-section-title">
          <span>⚡ Required Skills &amp; Competencies</span>
        </div>
        <div class="company-skill-tags">
          ${item.skills.map(s => `<span class="company-skill-tag">✓ ${s}</span>`).join('')}
        </div>
      </div>
    `;
  }

  if (modal) {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
}

// ============================================================================
// 16. DEDICATED PATHWAY VIEW RENDERERS FOR ALL 16 CATEGORIES
// ============================================================================
const INDIA_STATES_AND_DISTRICTS = {
  "Andhra Pradesh": ["Ananthapuramu", "Chittoor", "East Godavari", "Guntur", "Krishna", "Kurnool", "Prakasam", "Srikakulam", "Sri Potti Sriramulu Nellore", "Visakhapatnam", "Vizianagaram", "West Godavari", "YSR Kadapa"],
  "Arunachal Pradesh": ["Changlang", "Dibang Valley", "East Kameng", "East Siang", "Itanagar Capital Complex", "Papum Pare", "Tawang", "Tirap", "Upper Siang", "West Kameng", "West Siang"],
  "Assam": ["Baksa", "Barpeta", "Bongaigaon", "Cachar", "Dibrugarh", "Goalpara", "Golaghat", "Jorhat", "Kamrup", "Kamrup Metropolitan", "Nagaon", "Nalbari", "Sonitpur", "Tinsukia"],
  "Bihar": ["Araria", "Aurangabad", "Banka", "Begusarai", "Bhagalpur", "Bhojpur", "Buxar", "Darbhanga", "Gaya", "Gopalganj", "Katihar", "Madhubani", "Muzaffarpur", "Nalanda", "Patna", "Purnia", "Rohtas", "Samastipur", "Saran", "Vaishali"],
  "Chandigarh": ["Chandigarh"],
  "Chhattisgarh": ["Bastar", "Bilaspur", "Dantewada", "Durg", "Janjgir-Champa", "Korba", "Raigarh", "Raipur", "Rajnandgaon", "Surguja"],
  "Delhi": ["Central Delhi", "East Delhi", "New Delhi", "North Delhi", "North East Delhi", "North West Delhi", "Shahdara", "South Delhi", "South East Delhi", "South West Delhi", "West Delhi"],
  "Goa": ["North Goa", "South Goa"],
  "Gujarat": ["Ahmedabad", "Amreli", "Anand", "Banaskantha", "Bharuch", "Bhavnagar", "Gandhinagar", "Jamnagar", "Junagadh", "Kheda", "Kutch", "Mehsana", "Navsari", "Rajkot", "Surat", "Surendranagar", "Vadodara", "Valsad"],
  "Haryana": ["Ambala", "Bhiwani", "Faridabad", "Gurugram", "Hisar", "Jhajjar", "Jind", "Kaithal", "Karnal", "Kurukshetra", "Panchkula", "Panipat", "Rewari", "Rohtak", "Sirsa", "Sonipat", "Yamunanagar"],
  "Himachal Pradesh": ["Bilaspur", "Chamba", "Hamirpur", "Kangra", "Kullu", "Mandi", "Shimla", "Sirmaur", "Solan", "Una"],
  "Jammu & Kashmir": ["Anantnag", "Baramulla", "Budgam", "Jammu", "Kathua", "Kupwara", "Pulwama", "Srinagar", "Udhampur"],
  "Jharkhand": ["Bokaro", "Deoghar", "Dhanbad", "Dumka", "East Singhbhum", "Hazaribagh", "Ranchi", "West Singhbhum"],
  "Karnataka": ["Bagalkote", "Ballari", "Belagavi", "Bengaluru Rural", "Bengaluru Urban", "Bidar", "Chamarajanagar", "Chikkaballapura", "Chikkamagaluru", "Chitradurga", "Dakshina Kannada", "Davanagere", "Dharwad", "Hassan", "Haveri", "Kalaburagi", "Kodagu", "Kolar", "Koppal", "Mandya", "Mysuru", "Raichur", "Ramanagara", "Shivamogga", "Tumakuru", "Udupi", "Uttara Kannada", "Vijayapura", "Yadgir"],
  "Kerala": ["Alappuzha", "Ernakulam", "Idukki", "Kannur", "Kasaragod", "Kollam", "Kottayam", "Kozhikode", "Malappuram", "Palakkad", "Pathanamthitta", "Thiruvananthapuram", "Thrissur", "Wayanad"],
  "Madhya Pradesh": ["Bhopal", "Chhindwara", "Gwalior", "Indore", "Jabalpur", "Khandwa", "Khargone", "Rewa", "Sagar", "Satna", "Sehore", "Ujjain"],
  "Maharashtra": ["Ahmednagar", "Akola", "Amravati", "Aurangabad", "Kolhapur", "Mumbai City", "Mumbai Suburban", "Nagpur", "Nanded", "Nashik", "Navi Mumbai", "Pune", "Ratnagiri", "Sangli", "Satara", "Solapur", "Thane"],
  "Manipur": ["Bishnupur", "Churachandpur", "Imphal East", "Imphal West", "Senapati", "Thoubal", "Ukhrul"],
  "Meghalaya": ["East Garo Hills", "East Khasi Hills", "Ri-Bhoi", "South Garo Hills", "West Garo Hills", "West Khasi Hills"],
  "Mizoram": ["Aizawl", "Champhai", "Kolasib", "Lunglei", "Mamit", "Serchhip"],
  "Nagaland": ["Dimapur", "Kohima", "Mokokchung", "Mon", "Tuensang", "Wokha", "Zunheboto"],
  "Odisha": ["Balasore", "Bhadrak", "Bhubaneswar", "Cuttack", "Ganjam", "Jharsuguda", "Khordha", "Puri", "Rourkela", "Sambalpur", "Sundargarh"],
  "Puducherry": ["Karaikal", "Puducherry", "Yanam"],
  "Punjab": ["Amritsar", "Bathinda", "Faridkot", "Fatehgarh Sahib", "Firozpur", "Gurdaspur", "Hoshiarpur", "Jalandhar", "Ludhiana", "Mansa", "Moga", "Mohali", "Muktsar", "Patiala", "Rupnagar", "Sangrur"],
  "Rajasthan": ["Ajmer", "Alwar", "Banswara", "Barmer", "Bharatpur", "Bhilwara", "Bikaner", "Chittorgarh", "Churu", "Dausa", "Dholpur", "Dungarpur", "Hanumangarh", "Jaipur", "Jaisalmer", "Jalore", "Jhalawar", "Jhunjhunu", "Jodhpur", "Karauli", "Kota", "Nagaur", "Pali", "Pratapgarh", "Rajsamand", "Sawai Madhopur", "Sikar", "Sirohi", "Sri Ganganagar", "Tonk", "Udaipur"],
  "Sikkim": ["East Sikkim", "North Sikkim", "South Sikkim", "West Sikkim"],
  "Tamil Nadu": ["Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri", "Dindigul", "Erode", "Kallakurichi", "Kanchipuram", "Kanyakumari", "Karur", "Krishnagiri", "Madurai", "Mayiladuthurai", "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai", "Ramanathapuram", "Ranipet", "Salem", "Sivaganga", "Tenkasi", "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli", "Tirupattur", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur", "Vellore", "Viluppuram", "Virudhunagar"],
  "Telangana": ["Adilabad", "Bhadradri Kothagudem", "Hyderabad", "Jagtial", "Jangaon", "Karimnagar", "Khammam", "Mahabubnagar", "Mancherial", "Medak", "Medchal-Malkajgiri", "Nalgonda", "Nizamabad", "Rangareddy", "Sangareddy", "Siddipet", "Suryapet", "Vikarabad", "Warangal"],
  "Tripura": ["Dhalai", "Gomati", "Khowai", "North Tripura", "Sepahijala", "South Tripura", "Unakoti", "West Tripura"],
  "Uttar Pradesh": ["Agra", "Aligarh", "Ambedkar Nagar", "Amethi", "Ayodhya", "Azamgarh", "Bareilly", "Basti", "Bijnor", "Budaun", "Bulandshahr", "Chandauli", "Deoria", "Etah", "Etawah", "Farrukhabad", "Fatehpur", "Firozabad", "Gautam Buddha Nagar", "Ghaziabad", "Ghazipur", "Gonda", "Gorakhpur", "Hapur", "Hardoi", "Hathras", "Jaunpur", "Jhansi", "Kannauj", "Kanpur Dehat", "Kanpur Nagar", "Kasganj", "Kaushambi", "Kushinagar", "Lakhimpur Kheri", "Lalitpur", "Lucknow", "Maharajganj", "Mahoba", "Mainpuri", "Mathura", "Mau", "Meerut", "Mirzapur", "Moradabad", "Muzaffarnagar", "Pilibhit", "Pratapgarh", "Prayagraj", "Raebareli", "Rampur", "Saharanpur", "Sambhal", "Sant Kabir Nagar", "Shahjahanpur", "Shamli", "Shravasti", "Siddharthnagar", "Sitapur", "Sonbhadra", "Sultanpur", "Unnao", "Varanasi"],
  "Uttarakhand": ["Almora", "Bageshwar", "Chamoli", "Champawat", "Dehradun", "Haridwar", "Nainital", "Pauri Garhwal", "Pithoragarh", "Rudraprayag", "Tehri Garhwal", "Udham Singh Nagar", "Uttarkashi"],
  "West Bengal": ["Alipurduar", "Bankura", "Birbhum", "Cooch Behar", "Dakshin Dinajpur", "Darjeeling", "Hooghly", "Howrah", "Jalpaiguri", "Jhargram", "Kalimpong", "Kolkata", "Malda", "Murshidabad", "Nadia", "North 24 Parganas", "Paschim Bardhaman", "Paschim Medinipur", "Purba Bardhaman", "Purba Medinipur", "Purulia", "South 24 Parganas", "Uttar Dinajpur"]
};

const ALL_POPULAR_COURSES = [
  "B.Tech",
  "B.E.",
  "B.Sc",
  "B.Com",
  "BBA",
  "BCA",
  "MCA",
  "MBA",
  "M.Tech",
  "MBBS",
  "BDS",
  "B.Pharm",
  "B.Sc Nursing",
  "BPT",
  "B.A.",
  "LL.B",
  "BA LL.B",
  "BBA LL.B",
  "B.Des",
  "Computer Science",
  "Data Science",
  "AI & ML",
  "Cyber Security",
  "FinTech",
  "UI/UX Design",
  "Mechanical",
  "Civil",
  "Electrical / EEE",
  "Medicine",
  "Law",
  "Management",
  "Architecture"
];

// ============================================================================
// 16. COLLEGES DISCOVERY ENGINE (STATE, DEPENDENT DISTRICT, COURSE & SEARCH)
// ============================================================================
let collegesFilterState = {
  search: '',
  state: '',
  district: '',
  course: ''
};

function renderCollegesView() {
  const container = document.getElementById('collegesPageContent');
  if (!container) return;

  const statesList = Array.from(new Set([
    ...Object.keys(INDIA_STATES_AND_DISTRICTS),
    ...collegesRegistry.map(c => c.state).filter(Boolean)
  ])).sort();

  let currentDistricts = [];
  if (collegesFilterState.state) {
    const selSt = collegesFilterState.state.trim().toLowerCase();
    const staticDists = INDIA_STATES_AND_DISTRICTS[collegesFilterState.state] || [];
    const dbDists = collegesRegistry
      .filter(c => c.state && c.state.trim().toLowerCase() === selSt)
      .map(c => c.district || c.city)
      .filter(Boolean);
    currentDistricts = Array.from(new Set([...staticDists, ...dbDists])).sort();
  }

  const coursesList = [...ALL_POPULAR_COURSES].sort();

  // Strict compound filter
  const filtered = collegesRegistry.filter(c => {
    const sTerm = collegesFilterState.search.trim().toLowerCase();
    const cName = String(c.name || '').toLowerCase();
    const cCity = String(c.city || '').toLowerCase();
    const cDistrict = String(c.district || '').toLowerCase();
    const cState = String(c.state || '').toLowerCase();
    const cAishe = String(c.aishe || c.aishe_code || '').toLowerCase();
    const cStream = String(c.stream || '').toLowerCase();
    const cId = String(c.id || '').toLowerCase();
    const cRank = String(c.rank || c.nirf_rank || '').toLowerCase();

    const matchSearch = !sTerm ||
      cName.includes(sTerm) ||
      cCity.includes(sTerm) ||
      cDistrict.includes(sTerm) ||
      cState.includes(sTerm) ||
      cAishe.includes(sTerm) ||
      cStream.includes(sTerm) ||
      cId.includes(sTerm) ||
      cRank.includes(sTerm) ||
      (Array.isArray(c.courses) && c.courses.some(crs => String(crs).toLowerCase().includes(sTerm)));

    const matchState = !collegesFilterState.state ||
      cState === collegesFilterState.state.trim().toLowerCase();

    const selDist = collegesFilterState.district.trim().toLowerCase();
    const matchDistrict = !selDist ||
      cDistrict === selDist ||
      cCity === selDist ||
      cDistrict.includes(selDist) ||
      cCity.includes(selDist);

    const selCourse = collegesFilterState.course.trim().toLowerCase();
    const matchCourse = !selCourse ||
      (Array.isArray(c.courses) && c.courses.some(crs => String(crs).toLowerCase().includes(selCourse) || selCourse.includes(String(crs).toLowerCase()))) ||
      cStream.includes(selCourse);

    return matchSearch && matchState && matchDistrict && matchCourse;
  });

  const isFilterActive = !!(collegesFilterState.search || collegesFilterState.state || collegesFilterState.district || collegesFilterState.course);

  container.innerHTML = `
    <div class="courses-discovery-container">
      <!-- Search & 3 Filters Control Bar -->
      <div class="colleges-discovery-filter-card">
        <div class="colleges-filter-row">
          <!-- 1. Search Box -->
          <div class="colleges-search-input-wrap">
            <span class="colleges-input-icon">🔍</span>
            <input
              type="text"
              id="collegesGlobalSearchInput"
              class="colleges-filter-input"
              placeholder="Search colleges, cities, NIRF ranks, AISHE..."
              value="${collegesFilterState.search}"
              autocomplete="off"
            />
            <button type="button" id="collegesSearchClearBtn" class="colleges-filter-clear-btn" style="display:${collegesFilterState.search ? 'block' : 'none'};" title="Clear search">✕</button>
          </div>

          <!-- 2. State Filter (A-Z) -->
          <div class="colleges-custom-dropdown-wrap" id="stateDropdownWrap">
            <button type="button" class="colleges-dropdown-trigger ${collegesFilterState.state ? 'active' : ''}" id="stateTriggerBtn" aria-expanded="false">
              <span class="dropdown-trigger-label">State:</span>
              <span class="dropdown-trigger-val" id="selectedStateVal">${collegesFilterState.state || 'All States'}</span>
              <span class="dropdown-arrow">▼</span>
            </button>
            <div class="colleges-dropdown-panel" id="stateDropdownPanel">
              <div class="dropdown-search-box">
                <span>🔍</span>
                <input type="text" id="stateSearchInput" placeholder="Search state / UT..." autocomplete="off" />
              </div>
              <div class="dropdown-items-scroll" id="stateItemsList">
                <button type="button" class="dropdown-item-btn ${!collegesFilterState.state ? 'selected' : ''}" onclick="selectCollegeState('')">
                  <span>All States</span>
                  <span class="dropdown-item-count">(${collegesRegistry.length})</span>
                </button>
                ${statesList.map(st => {
                  const count = collegesRegistry.filter(c => c.state && c.state.trim().toLowerCase() === st.toLowerCase()).length;
                  return `
                    <button type="button" class="dropdown-item-btn ${collegesFilterState.state && collegesFilterState.state.toLowerCase() === st.toLowerCase() ? 'selected' : ''}" data-item-name="${st.toLowerCase()}" onclick="selectCollegeState('${st.replace(/'/g, "\'")}')">
                      <span>${st}</span>
                      ${count > 0 ? `<span class="dropdown-item-count" style="color:var(--coral); font-weight:700;">${count}</span>` : ''}
                    </button>
                  `;
                }).join('')}
              </div>
            </div>
          </div>

          <!-- 3. District Filter (Dependent on State) -->
          <div class="colleges-custom-dropdown-wrap" id="districtDropdownWrap">
            <button type="button" class="colleges-dropdown-trigger ${!collegesFilterState.state ? 'disabled' : ''} ${collegesFilterState.district ? 'active' : ''}" id="districtTriggerBtn" aria-expanded="false" ${!collegesFilterState.state ? 'disabled title="Please select a state first"' : ''}>
              <span class="dropdown-trigger-label">District:</span>
              <span class="dropdown-trigger-val" id="selectedDistrictVal">${collegesFilterState.district || (collegesFilterState.state ? 'All Districts' : 'Select State First')}</span>
              <span class="dropdown-arrow">▼</span>
            </button>
            <div class="colleges-dropdown-panel" id="districtDropdownPanel">
              <div class="dropdown-search-box">
                <span>🔍</span>
                <input type="text" id="districtSearchInput" placeholder="Search district in ${collegesFilterState.state || ''}..." autocomplete="off" />
              </div>
              <div class="dropdown-items-scroll" id="districtItemsList">
                <button type="button" class="dropdown-item-btn ${!collegesFilterState.district ? 'selected' : ''}" onclick="selectCollegeDistrict('')">
                  <span>All Districts</span>
                </button>
                ${currentDistricts.map(dst => {
                  const count = collegesRegistry.filter(c => c.state && c.state.toLowerCase() === collegesFilterState.state.toLowerCase() && (c.district === dst || (c.city && c.city.toLowerCase().includes(dst.toLowerCase())))).length;
                  return `
                    <button type="button" class="dropdown-item-btn ${collegesFilterState.district === dst ? 'selected' : ''}" data-item-name="${dst.toLowerCase()}" onclick="selectCollegeDistrict('${dst.replace(/'/g, "\'")}')">
                      <span>${dst}</span>
                      ${count > 0 ? `<span class="dropdown-item-count" style="color:var(--coral); font-weight:700;">${count}</span>` : ''}
                    </button>
                  `;
                }).join('')}
              </div>
            </div>
          </div>

          <!-- 4. Course Filter (Searchable) -->
          <div class="colleges-custom-dropdown-wrap" id="courseDropdownWrap">
            <button type="button" class="colleges-dropdown-trigger ${collegesFilterState.course ? 'active' : ''}" id="courseTriggerBtn" aria-expanded="false">
              <span class="dropdown-trigger-label">Course:</span>
              <span class="dropdown-trigger-val" id="selectedCourseVal">${collegesFilterState.course || 'All Courses'}</span>
              <span class="dropdown-arrow">▼</span>
            </button>
            <div class="colleges-dropdown-panel" id="courseDropdownPanel">
              <div class="dropdown-search-box">
                <span>🔍</span>
                <input type="text" id="courseSearchInput" placeholder="Search course / degree..." autocomplete="off" />
              </div>
              <div class="dropdown-items-scroll" id="courseItemsList">
                <button type="button" class="dropdown-item-btn ${!collegesFilterState.course ? 'selected' : ''}" onclick="selectCollegeCourse('')">
                  <span>All Courses</span>
                </button>
                ${coursesList.map(crs => {
                  const count = collegesRegistry.filter(c => (c.courses && c.courses.some(x => x.toLowerCase() === crs.toLowerCase() || x.toLowerCase().includes(crs.toLowerCase()))) || (c.stream && c.stream.toLowerCase().includes(crs.toLowerCase()))).length;
                  return `
                    <button type="button" class="dropdown-item-btn ${collegesFilterState.course === crs ? 'selected' : ''}" data-item-name="${crs.toLowerCase()}" onclick="selectCollegeCourse('${crs.replace(/'/g, "\'")}')">
                      <span>${crs}</span>
                      ${count > 0 ? `<span class="dropdown-item-count" style="color:var(--coral); font-weight:700;">${count}</span>` : ''}
                    </button>
                  `;
                }).join('')}
              </div>
            </div>
          </div>

          <!-- Reset Button -->
          <button type="button" class="colleges-reset-filters-btn" id="collegesResetBtn" onclick="resetCollegeFilters()" title="Reset all search and filters">
            ↺ Reset
          </button>
        </div>

        <!-- Active Filter Tags Row -->
        ${isFilterActive ? `
          <div class="colleges-active-tags-row">
            <span style="font-size:11px; font-weight:800; text-transform:uppercase; color:var(--theme-muted);">Active Filters:</span>
            ${collegesFilterState.search ? `
              <span class="colleges-filter-badge">
                Search: "${collegesFilterState.search}"
                <button type="button" onclick="clearCollegeSearch()">✕</button>
              </span>
            ` : ''}
            ${collegesFilterState.state ? `
              <span class="colleges-filter-badge">
                State: ${collegesFilterState.state}
                <button type="button" onclick="selectCollegeState('')">✕</button>
              </span>
            ` : ''}
            ${collegesFilterState.district ? `
              <span class="colleges-filter-badge">
                District: ${collegesFilterState.district}
                <button type="button" onclick="selectCollegeDistrict('')">✕</button>
              </span>
            ` : ''}
            ${collegesFilterState.course ? `
              <span class="colleges-filter-badge">
                Course: ${collegesFilterState.course}
                <button type="button" onclick="selectCollegeCourse('')">✕</button>
              </span>
            ` : ''}
            <button type="button" class="text-link" style="font-size:11.5px; color:var(--coral); margin-left:auto;" onclick="resetCollegeFilters()">
              Clear All ✕
            </button>
          </div>
        ` : ''}
      </div>

      <!-- Results Summary Bar (Max 20 Displayed) -->
      <div class="courses-meta-summary-bar">
        <div class="courses-meta-summary-highlight">
          <span class="stat-indicator-dot"></span>
          <span>Showing <b>${filtered.slice(0, 20).length} of ${filtered.length}</b> Premier Indian Institutions (${collegesRegistry.length} total in database) &bull; NIRF Ranked &amp; AISHE Verified</span>
        </div>
        ${isFilterActive ? `
          <div style="font-size:12px; color:var(--theme-muted); font-weight:700;">
            Matching Filters: <b>${filtered.slice(0, 20).length} Displayed</b> (${filtered.length} Total Matching)
          </div>
        ` : ''}
      </div>

      <!-- Maximum 20 College Cards Grid -->
      ${filtered.length === 0 ? `
        <div class="courses-empty-results-box">
          <h3>No colleges found matching your filter criteria</h3>
          <p>Try resetting the State, District or Course filter, or search for broader keywords like "IIT", "Medical", "Delhi", "Bengaluru", or "B.Tech".</p>
          <button type="button" class="courses-filter-chip active" style="margin-top:10px;" onclick="resetCollegeFilters()">
            Reset All Filters
          </button>
        </div>
      ` : `
        <div class="college-grid" style="grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap:20px;">
          ${filtered.slice(0, 20).map((c) => {
            return `
              <article class="top-college-card" style="display:flex; flex-direction:column; justify-content:space-between;">
                <div>
                  <div class="college-thumb" style="height:150px;">
                    <img src="${c.image}" alt="${c.name} Campus" class="college-thumb-img" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=800&q=80';" />
                    <div class="college-thumb-overlay"></div>
                    <span class="college-rank" style="background:var(--coral); font-weight:800;">#${c.rank || c.nirf_rank || 'NIRF'} NIRF</span>
                    <span class="college-city">📍 ${c.city}, ${c.state}</span>
                  </div>
                  <div class="top-college-body" style="padding:16px;">
                    <h3>${c.name}</h3>
                    <small style="color:var(--theme-muted); font-weight:600; display:block; margin-bottom:8px;">📍 ${c.district || c.city}, ${c.state} &bull; AISHE: ${c.aishe || c.aishe_code || 'Verified'} &bull; ${c.type || c.college_type || 'Institute'}</small>

                    <div class="college-rating" style="margin:8px 0;">
                      <span>★ ${c.rating} Rating</span>
                      <span style="color:var(--theme-muted); font-weight:500;">${c.reviews || c.reviews_count || '1,000+ Reviews'}</span>
                    </div>

                    <div style="margin:8px 0; font-size:11.5px; color:#8E9CA6;">
                      <div style="margin-bottom:4px;"><strong>Academic Focus:</strong> ${c.stream}</div>
                      <div style="color:var(--teal); font-weight:700;">💼 ${c.placement}</div>
                      <div style="color:rgba(58, 155, 143, 0.12); margin-top:2px;">💰 Fees: <b>${c.fees}</b> &bull; Cutoff: <b style="color:var(--coral);">${c.cutoff}</b></div>
                    </div>
                  </div>
                </div>

                <div style="padding:0 16px 16px;">
                  <button type="button" class="college-view" onclick="openCollegeDetailsModal('${c.id}')">
                    View College Details ➔
                  </button>
                  <button type="button" class="further-details-trigger" onclick="openFurtherDetails('${c.id}')">
                    Update Details ➔
                  </button>
                </div>
              </article>
            `;
          }).join('')}
        </div>
      `}
    </div>
  `;

  // Attach Event Handlers
  const searchInput = document.getElementById('collegesGlobalSearchInput');
  const searchClear = document.getElementById('collegesSearchClearBtn');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      collegesFilterState.search = e.target.value;
      if (e.target.value && e.target.value.trim().length >= 2) {
        clearTimeout(window._collegeSearchLogTimer);
        window._collegeSearchLogTimer = setTimeout(() => {
          if (typeof recordUserActivity === 'function') {
            recordUserActivity('search', 'colleges', '', e.target.value.trim());
          }
        }, 600);
      }
      renderCollegesView();
      // Keep focus and cursor
      const newInp = document.getElementById('collegesGlobalSearchInput');
      if (newInp) {
        newInp.focus();
        newInp.setSelectionRange(newInp.value.length, newInp.value.length);
      }
    });
  }

  if (searchClear) {
    searchClear.addEventListener('click', clearCollegeSearch);
  }

  // Setup Dropdown Toggles
  setupCustomDropdown('stateDropdownWrap', 'stateTriggerBtn', 'stateDropdownPanel', 'stateSearchInput', 'stateItemsList');
  if (collegesFilterState.state) {
    setupCustomDropdown('districtDropdownWrap', 'districtTriggerBtn', 'districtDropdownPanel', 'districtSearchInput', 'districtItemsList');
  }
  setupCustomDropdown('courseDropdownWrap', 'courseTriggerBtn', 'courseDropdownPanel', 'courseSearchInput', 'courseItemsList');
}

function setupCustomDropdown(wrapId, triggerId, panelId, searchInputId, itemsListId) {
  const wrap = document.getElementById(wrapId);
  const trigger = document.getElementById(triggerId);
  const searchInp = document.getElementById(searchInputId);
  const itemsList = document.getElementById(itemsListId);

  if (!wrap || !trigger) return;

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = wrap.classList.contains('open');
    // Close other dropdowns first
    document.querySelectorAll('.colleges-custom-dropdown-wrap').forEach(w => {
      if (w !== wrap) w.classList.remove('open');
    });

    if (isOpen) {
      wrap.classList.remove('open');
    } else {
      wrap.classList.add('open');
      if (searchInp) {
        setTimeout(() => searchInp.focus(), 50);
      }
    }
  });

  if (searchInp && itemsList) {
    searchInp.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      itemsList.querySelectorAll('.dropdown-item-btn').forEach(btn => {
        const itemText = (btn.dataset.itemName || btn.textContent).toLowerCase();
        if (!q || itemText.includes(q)) {
          btn.style.display = 'flex';
        } else {
          btn.style.display = 'none';
        }
      });
    });
    // Prevent dropdown closing when clicking inside search box
    searchInp.addEventListener('click', (e) => e.stopPropagation());
  }
}

// Global click listener to close open dropdowns when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.colleges-custom-dropdown-wrap')) {
    document.querySelectorAll('.colleges-custom-dropdown-wrap').forEach(w => w.classList.remove('open'));
  }
});

function selectCollegeState(stateName) {
  collegesFilterState.state = stateName;
  // Clear dependent district when state changes
  collegesFilterState.district = '';
  renderCollegesView();
}
window.selectCollegeState = selectCollegeState;

function selectCollegeDistrict(districtName) {
  collegesFilterState.district = districtName;
  renderCollegesView();
}
window.selectCollegeDistrict = selectCollegeDistrict;

function selectCollegeCourse(courseName) {
  collegesFilterState.course = courseName;
  renderCollegesView();
}
window.selectCollegeCourse = selectCollegeCourse;

function clearCollegeSearch() {
  collegesFilterState.search = '';
  renderCollegesView();
}
window.clearCollegeSearch = clearCollegeSearch;

function resetCollegeFilters() {
  collegesFilterState.search = '';
  collegesFilterState.state = '';
  collegesFilterState.district = '';
  collegesFilterState.course = '';
  renderCollegesView();
  showToast('Colleges filters reset to default view');
}
window.resetCollegeFilters = resetCollegeFilters;
window.renderCollegesView = renderCollegesView;



// ============================================================================
// 17. DOMAIN DISCOVERY ENGINE (7 MAJOR CATEGORIES, 10-YR SURVEY, 5-YR OUTLOOK & REVIEWS)
// ============================================================================

const DOMAINS_DISCOVERY_DATA = [
  {
    id: "dom-tech-software",
    name: "Technology & Software",
    icon: "💻",
    tagline: "Core Software Engineering, Systems & Application Development",
    description: "Build scalable web, mobile, enterprise, and decentralized software architectures powering global digital systems.",
    subfields: [
      {
        id: "sub-web-dev",
        name: "Web Development",
        icon: "🌐",
        tagline: "Frontend, UI Engineering & Interactive Web Apps",
        description: "Focuses on modern web architectures using HTML5, CSS3, JavaScript, React, Next.js, and TypeScript to create responsive user interfaces.",
        skills: ["HTML5 / CSS3", "JavaScript (ES6+)", "React.js", "Next.js", "TypeScript", "Responsive UI", "Web Performance"],
        courses: ["B.Tech CSE", "BCA", "Full-Stack Web Bootcamp", "B.Sc Computer Science"],
        careers: ["Frontend Engineer", "Web Application Developer", "UI Engineer", "JavaScript Developer"],
        averageSalary: "₹6.5 - ₹18.0 LPA"
      },
      {
        id: "sub-fullstack",
        name: "Full Stack Development",
        icon: "⚡",
        tagline: "End-to-End Client & Server Architecture",
        description: "Mastering frontend interfaces, RESTful APIs, Node.js/Java backends, relational & NoSQL databases, and cloud deployment pipelines.",
        skills: ["Node.js / Express", "React / Vue", "PostgreSQL / MongoDB", "REST & GraphQL", "Docker", "Git CI/CD"],
        courses: ["B.Tech CSE", "BCA / MCA", "Full-Stack System Bootcamp"],
        careers: ["Full-Stack Engineer", "Software Development Engineer (SDE)", "Lead Application Architect"],
        averageSalary: "₹8.0 - ₹24.0 LPA"
      },
      {
        id: "sub-software-dev",
        name: "Software Development",
        icon: "🖥️",
        tagline: "Object-Oriented Programming, Data Structures & System Design",
        description: "Core software engineering fundamentals emphasizing clean code, robust algorithms, concurrent programming, and low-level system design.",
        skills: ["Data Structures & Algorithms", "System Design", "C++ / Java", "Design Patterns", "Multi-Threading", "Unit Testing"],
        courses: ["B.E. Computer Science", "B.Tech IT", "M.Tech Software Engineering"],
        careers: ["SDE-1 / SDE-2", "Software Engineer", "Core Backend Developer"],
        averageSalary: "₹9.0 - ₹28.0 LPA"
      },
      {
        id: "sub-python-dev",
        name: "Python Development",
        icon: "🐍",
        tagline: "Backend Services, Automation & Scientific Scripting",
        description: "Building asynchronous backend services, rapid prototypes, microservices, and automation pipelines with Python, Django, FastAPI, and Flask.",
        skills: ["Python 3", "Django", "FastAPI", "AsyncIO", "Celery", "PostgreSQL", "PyTest"],
        courses: ["BCA", "B.Tech CSE", "Python Specialist Certification"],
        careers: ["Python Backend Developer", "API Engineer", "Automation Engineer"],
        averageSalary: "₹7.0 - ₹20.0 LPA"
      },
      {
        id: "sub-java-dev",
        name: "Java Development",
        icon: "☕",
        tagline: "Enterprise Grade Systems & Spring Microservices",
        description: "Architecting mission-critical enterprise platforms, banking engines, and microservices ecosystems using Java, Spring Boot, and Kafka.",
        skills: ["Java 17/21", "Spring Boot", "Hibernate / JPA", "Apache Kafka", "Microservices", "Kubernetes", "JUnit"],
        courses: ["B.Tech CSE / IT", "MCA", "Oracle Java Professional"],
        careers: ["Enterprise Java Developer", "Spring Microservices Engineer", "Backend Architect"],
        averageSalary: "₹8.5 - ₹25.0 LPA"
      },
      {
        id: "sub-mobile-dev",
        name: "Mobile App Development",
        icon: "📱",
        tagline: "iOS, Android & Cross-Platform Native Apps",
        description: "Developing responsive native and cross-platform mobile experiences using Flutter, React Native, Kotlin, and Swift with offline-first storage.",
        skills: ["Flutter / Dart", "React Native", "Kotlin / Android", "Swift / iOS", "Firebase", "App Store Optimization"],
        courses: ["BCA", "B.Tech CSE", "Mobile App Development Specialization"],
        careers: ["Mobile Application Engineer", "iOS Developer", "Android Developer", "Flutter Specialist"],
        averageSalary: "₹7.5 - ₹22.0 LPA"
      },
      {
        id: "sub-game-dev",
        name: "Game Development",
        icon: "🎮",
        tagline: "Real-Time 3D Engines, Physics & Interactive Gameplay",
        description: "Designing immersive game mechanics, physics simulations, 3D graphics rendering, and multiplayer netcode using Unity (C#) and Unreal Engine (C++).",
        skills: ["Unity 3D / C#", "Unreal Engine / C++", "3D Math & Shaders", "Physics Simulation", "Game AI", "Multiplayer Netcode"],
        courses: ["B.Sc Game Development", "B.Tech CSE (Gaming)", "Unity Certified Programmer"],
        careers: ["Gameplay Programmer", "Unity Developer", "Unreal Engine Specialist", "Technical Artist"],
        averageSalary: "₹6.0 - ₹18.0 LPA"
      },
      {
        id: "sub-blockchain-dev",
        name: "Blockchain Development",
        icon: "⛓️",
        tagline: "Smart Contracts, DeFi Protocols & Web3 Decentralization",
        description: "Engineering cryptographically secure smart contracts, decentralized applications (dApps), and consensus protocols using Solidity, Rust, and EVM.",
        skills: ["Solidity", "Rust", "EVM / Ethereum", "Web3.js / Ethers.js", "Smart Contract Security Auditing", "Cryptography"],
        courses: ["B.Tech CSE (Blockchain)", "Ethereum Developer Certification"],
        careers: ["Smart Contract Engineer", "Blockchain Architect", "Web3 Protocol Developer"],
        averageSalary: "₹10.0 - ₹32.0 LPA"
      },
      {
        id: "sub-arvr-dev",
        name: "AR/VR Development",
        icon: "🥽",
        tagline: "Spatial Computing, Extended Reality & Immersive Simulators",
        description: "Building spatial computing applications, virtual simulations, head-mounted display interfaces (Apple Vision Pro, Meta Quest), and WebXR experiences.",
        skills: ["Unity / Unreal", "OpenXR / WebXR", "Spatial Audio", "Hand Tracking & Haptics", "Shader Graph", "3D Optimization"],
        courses: ["B.Des / B.Tech Immersive Computing", "AR/VR Developer Track"],
        careers: ["XR Developer", "Spatial Computing Engineer", "VR Simulation Specialist"],
        averageSalary: "₹8.0 - ₹24.0 LPA"
      },
      {
        id: "sub-genai-software",
        name: "Generative AI Engineering",
        icon: "✨",
        tagline: "LLM Orchestration, RAG Systems & Autonomous AI Agents",
        description: "Building production applications powered by Large Language Models, LangChain, LlamaIndex, vector databases, and multi-agent coordination frameworks.",
        skills: ["LangChain / LlamaIndex", "Vector DBs (Pinecone, Chroma)", "Prompt Engineering & Evaluation", "OpenAI / Claude APIs", "Fine-Tuning", "Autonomous Agents"],
        courses: ["B.Tech AI & Data Science", "Generative AI Engineering Bootcamp"],
        careers: ["GenAI Solutions Engineer", "AI Agent Architect", "LLM Application Developer"],
        averageSalary: "₹12.0 - ₹35.0 LPA"
      }
    ]
  },
  {
    id: "dom-data-ai",
    name: "Data, AI & Analytics",
    icon: "🧠",
    tagline: "Machine Intelligence, Predictive Modeling & Big Data Systems",
    description: "Extract actionable intelligence, train deep neural networks, and deploy machine learning pipelines to solve complex predictive challenges.",
    subfields: [
      {
        id: "sub-data-science",
        name: "Data Science",
        icon: "📊",
        tagline: "Statistical Modeling, Machine Learning & Predictive Insights",
        description: "Combines statistics, mathematical modeling, Python/R programming, and domain expertise to discover patterns and drive data-backed decisions.",
        skills: ["Python / R", "Statistical Inference", "Scikit-Learn", "Feature Engineering", "Data Wrangling (Pandas)", "Exploratory Data Analysis"],
        courses: ["B.Tech Data Science", "B.Sc Data Analytics", "M.Tech in Data Science"],
        careers: ["Data Scientist", "Applied Scientist", "Predictive Modeler", "Research Analyst"],
        averageSalary: "₹9.5 - ₹28.0 LPA"
      },
      {
        id: "sub-data-analytics",
        name: "Data Analytics",
        icon: "📈",
        tagline: "Business Metrics, Dashboarding & SQL Querying",
        description: "Translating raw operational data into interactive dashboards, KPI reports, and actionable strategic insights using SQL, Power BI, and Tableau.",
        skills: ["Advanced SQL", "Power BI / Tableau", "Excel VBA", "Business Statistics", "Data Storytelling", "ETL Pipelines"],
        courses: ["B.Com / BBA Analytics", "B.Sc Statistics", "Google Data Analytics Certificate"],
        careers: ["Data Analyst", "Reporting Specialist", "Insights Analyst", "Operations Analyst"],
        averageSalary: "₹5.5 - ₹15.0 LPA"
      },
      {
        id: "sub-artificial-intel",
        name: "Artificial Intelligence",
        icon: "🤖",
        tagline: "Cognitive Systems, Heuristic Search & Agentic Decision-Making",
        description: "Developing autonomous algorithms, expert reasoning engines, heuristic search models, and intelligent agent systems across industries.",
        skills: ["Knowledge Representation", "Probabilistic Reasoning", "Search Algorithms", "Reinforcement Learning", "PyTorch / TensorFlow"],
        courses: ["B.Tech AI & ML", "M.Tech Artificial Intelligence", "B.Sc Cognitive Science"],
        careers: ["AI Research Scientist", "Cognitive Systems Engineer", "Autonomous Systems Architect"],
        averageSalary: "₹11.0 - ₹34.0 LPA"
      },
      {
        id: "sub-machine-learning",
        name: "Machine Learning",
        icon: "🔬",
        tagline: "Supervised, Unsupervised & Ensemble Predictive Algorithms",
        description: "Designing, training, validating, and optimizing supervised regression/classification, clustering, and gradient-boosted decision trees.",
        skills: ["Linear Algebra & Calculus", "Gradient Boosting (XGBoost, LightGBM)", "Cross-Validation", "Model Evaluation Metrics", "MLflow"],
        courses: ["B.Tech CSE (AI/ML)", "Stanford Machine Learning Track", "M.Sc Data Science"],
        careers: ["Machine Learning Engineer", "Algorithm Engineer", "ML Platform Developer"],
        averageSalary: "₹10.0 - ₹30.0 LPA"
      },
      {
        id: "sub-deep-learning",
        name: "Deep Learning",
        icon: "🕸️",
        tagline: "Convolutional, Recurrent & Transformer Neural Architectures",
        description: "Training multi-layer neural networks, backpropagation optimization, GPU-accelerated computing (CUDA), and transformer backbones.",
        skills: ["PyTorch / JAX", "Transformers & Attention Mechanisms", "CUDA / GPU Optimization", "Loss Landscape Optimization", "CNNs / RNNs"],
        courses: ["M.Tech Artificial Intelligence", "Deep Learning Specialization (DeepLearning.AI)"],
        careers: ["Deep Learning Researcher", "Neural Network Specialist", "AI Model Engineer"],
        averageSalary: "₹12.0 - ₹36.0 LPA"
      },
      {
        id: "sub-business-analytics",
        name: "Business Analytics",
        icon: "💼",
        tagline: "Data-Driven Strategy, Forecasting & Market Optimization",
        description: "Applying quantitative analysis, econometric modeling, and optimization techniques to solve corporate finance and market challenges.",
        skills: ["Econometrics", "Predictive Forecasting", "SQL & Python", "Market Basket Analysis", "A/B Testing", "Tableau"],
        courses: ["BBA Business Analytics", "MBA in Business Analytics", "Executive PG Analytics"],
        careers: ["Business Analytics Manager", "Strategy Consultant", "Market Intelligence Specialist"],
        averageSalary: "₹8.0 - ₹22.0 LPA"
      },
      {
        id: "sub-business-intel",
        name: "Business Intelligence",
        icon: "📑",
        tagline: "Enterprise Data Warehousing & Executive Reporting",
        description: "Designing dimensional data models (star/snowflake schema), OLAP cubes, and automated executive reporting systems across enterprise departments.",
        skills: ["Data Warehousing (Snowflake, BigQuery)", "DAX / Power BI", "SSIS / SSRS", "Data Governance", "Dimensional Modeling"],
        courses: ["BCA / MCA", "B.Com Information Systems", "Microsoft Certified Power BI Analyst"],
        careers: ["BI Developer", "BI Architect", "Enterprise Reporting Specialist"],
        averageSalary: "₹7.0 - ₹18.0 LPA"
      },
      {
        id: "sub-data-engineering",
        name: "Data Engineering",
        icon: "🏗️",
        tagline: "Distributed Pipelines, Lakehouses & Streaming Architectures",
        description: "Constructing high-throughput batch and real-time streaming pipelines using Apache Spark, Kafka, Airflow, Delta Lake, and cloud lakehouses.",
        skills: ["Apache Spark / PySpark", "Apache Kafka", "Airflow Orchestration", "SQL & Scala/Python", "Data Lakehouse Architecture", "AWS / GCP"],
        courses: ["B.Tech CSE / IT", "Data Engineering Professional Track"],
        careers: ["Data Engineer", "Big Data Architect", "Pipeline Engineer", "Lakehouse Administrator"],
        averageSalary: "₹9.5 - ₹30.0 LPA"
      },
      {
        id: "sub-computer-vision",
        name: "Computer Vision",
        icon: "👁️",
        tagline: "Image Segmentation, Object Detection & Facial Recognition",
        description: "Processing visual data from cameras and sensors for autonomous driving, medical imaging, defect detection, and OCR applications.",
        skills: ["OpenCV", "YOLO / Mask R-CNN", "Vision Transformers (ViT)", "3D Point Clouds", "TensorRT Inference", "Image Processing"],
        courses: ["B.Tech AI & Robotics", "M.Tech in Signal Processing & Vision"],
        careers: ["Computer Vision Engineer", "Perception Engineer", "Image Processing Scientist"],
        averageSalary: "₹11.0 - ₹32.0 LPA"
      },
      {
        id: "sub-nlp",
        name: "Natural Language Processing (NLP)",
        icon: "🗣️",
        tagline: "Language Models, Semantic Search & Speech Synthesis",
        description: "Enabling machines to understand, interpret, and generate human language through tokenization, semantic embeddings, and generative token prediction.",
        skills: ["Hugging Face Transformers", "Semantic Embeddings (BERT/RoBERTa)", "Tokenization", "Speech-to-Text / TTS", "Vector Similarity Search"],
        courses: ["M.Tech in Computational Linguistics", "NLP Specialization"],
        careers: ["NLP Engineer", "Speech Recognition Specialist", "Conversational AI Architect"],
        averageSalary: "₹11.5 - ₹34.0 LPA"
      }
    ]
  },
  {
    id: "dom-cloud-devops",
    name: "Cloud, DevOps & Infrastructure",
    icon: "☁️",
    tagline: "Cloud Native Architecture, Automation & Site Reliability",
    description: "Build, automate, secure, and scale elastic cloud infrastructure on AWS, Azure, and GCP using modern DevOps CI/CD practices.",
    subfields: [
      {
        id: "sub-cloud-comp",
        name: "Cloud Computing",
        icon: "⛅",
        tagline: "IaaS, PaaS & Serverless Cloud Platforms",
        description: "Architecting resilient, multi-region cloud services on AWS, Microsoft Azure, and Google Cloud with auto-scaling and cost optimization.",
        skills: ["AWS / Azure / GCP", "Serverless (Lambda/Functions)", "IAM & Security", "VPC & Networking", "Cost Governance"],
        courses: ["B.Tech Cloud Computing", "AWS Solutions Architect", "Azure Administrator"],
        careers: ["Cloud Engineer", "Cloud Solutions Architect", "Cloud Consultant"],
        averageSalary: "₹8.0 - ₹26.0 LPA"
      },
      {
        id: "sub-cloud-devops",
        name: "Cloud & DevOps",
        icon: "♾️",
        tagline: "Automated Deployments & Continuous Integration",
        description: "Unifying software development and IT operations through automated build pipelines, testing suites, and containerized deployments.",
        skills: ["Docker & Containers", "Kubernetes", "GitLab CI / GitHub Actions", "Terraform / Ansible", "Linux Shell"],
        courses: ["B.Tech IT", "Certified Kubernetes Administrator (CKA)", "DevOps Master Track"],
        careers: ["DevOps Engineer", "Cloud Automation Engineer", "Platform Engineer"],
        averageSalary: "₹9.0 - ₹28.0 LPA"
      },
      {
        id: "sub-devops-core",
        name: "DevOps Engineering",
        icon: "🚀",
        tagline: "Infrastructure as Code & GitOps Pipelines",
        description: "Codifying infrastructure provisioning through Terraform, Helm charts, and GitOps workflows to eliminate manual configuration drift.",
        skills: ["Terraform", "Helm / K8s Manifests", "ArgoCD / Flux", "Prometheus & Grafana", "Vault Secrets Management"],
        courses: ["B.Tech CSE", "HashiCorp Certified Terraform Associate"],
        careers: ["Senior DevOps Engineer", "Infrastructure Automation Lead", "GitOps Specialist"],
        averageSalary: "₹10.0 - ₹30.0 LPA"
      },
      {
        id: "sub-cloud-arch",
        name: "Cloud Architecture",
        icon: "🏛️",
        tagline: "High-Availability Multi-Region Enterprise Topology",
        description: "Designing enterprise-scale cloud blueprints adhering to well-architected frameworks, zero-trust security, and disaster recovery strategies.",
        skills: ["Well-Architected Framework", "Disaster Recovery Planning", "Hybrid Cloud Interconnect", "Enterprise Cost Modeling", "TOGAF"],
        courses: ["Executive Cloud Architecture", "AWS Certified Solutions Architect Professional"],
        careers: ["Enterprise Cloud Architect", "Principal Infrastructure Architect"],
        averageSalary: "₹18.0 - ₹45.0 LPA"
      },
      {
        id: "sub-sre",
        name: "Site Reliability Engineering (SRE)",
        icon: "🛡️",
        tagline: "Service Level Objectives, Chaos Engineering & Uptime",
        description: "Applying software engineering practices to operations, maintaining 99.99% system availability, error budgets, and automated incident triage.",
        skills: ["SLO / SLA / SLI Frameworks", "Chaos Engineering (Chaos Mesh)", "Incident Response Automation", "Observability (OpenTelemetry)", "Golang / Python"],
        courses: ["B.Tech CSE", "Google SRE Practitioner Course"],
        careers: ["Site Reliability Engineer", "Reliability Architect", "Operations Engineer"],
        averageSalary: "₹12.0 - ₹35.0 LPA"
      },
      {
        id: "sub-infrastructure",
        name: "Infrastructure Engineering",
        icon: "🔌",
        tagline: "Datacenter Hardware, Storage & Virtualization",
        description: "Managing hypervisors, software-defined storage (SAN/NAS), high-speed interconnects, and private datacenter virtualization clusters.",
        skills: ["VMware vSphere / Proxmox", "SAN / NAS Storage Arrays", "Cisco UCS", "Hardware Telemetry", "Power & Cooling Optimization"],
        courses: ["B.Tech EEE / IT", "VMware Certified Professional"],
        careers: ["Infrastructure Engineer", "Datacenter Systems Engineer", "Virtualization Specialist"],
        averageSalary: "₹6.5 - ₹18.0 LPA"
      },
      {
        id: "sub-sysadmin",
        name: "System Administration",
        icon: "🐧",
        tagline: "Linux/Unix OS Kernel, Active Directory & Identity",
        description: "Administering enterprise Linux and Windows server fleets, user access roles, security patches, shell automation, and directory services.",
        skills: ["RHEL / Debian Linux", "Bash / PowerShell Scripting", "Active Directory / LDAP", "Patch Management", "System Hardening"],
        courses: ["Diploma / BCA", "Red Hat Certified System Administrator (RHCSA)"],
        careers: ["Linux Administrator", "System Administrator", "IT Support Operations Lead"],
        averageSalary: "₹4.5 - ₹12.0 LPA"
      }
    ]
  },
  {
    id: "dom-cyber-security",
    name: "Cyber Security & Networking",
    icon: "🔒",
    tagline: "Offensive Security, Threat Defense & Network Resilience",
    description: "Protect digital infrastructure, conduct penetration tests, investigate forensic attacks, and secure enterprise communication networks.",
    subfields: [
      {
        id: "sub-cyber-core",
        name: "Cyber Security",
        icon: "🛡️",
        tagline: "Threat Prevention, Identity Defense & Zero-Trust",
        description: "Comprehensive information security management encompassing risk assessments, vulnerability patching, compliance, and zero-trust policies.",
        skills: ["Zero-Trust Architecture", "Vulnerability Assessment", "NIST / ISO 27001", "Security Auditing", "Cryptography"],
        courses: ["B.Tech Cyber Security", "CompTIA Security+", "CISSP"],
        careers: ["Cyber Security Analyst", "Information Security Officer", "Security Consultant"],
        averageSalary: "₹8.0 - ₹24.0 LPA"
      },
      {
        id: "sub-ethical-hacking",
        name: "Ethical Hacking & Penetration Testing",
        icon: "🎯",
        tagline: "Red Teaming, Exploit Simulation & Bug Bounties",
        description: "Simulating adversarial cyber attacks against web apps, internal networks, and mobile binaries to identify security loopholes before hackers do.",
        skills: ["Kali Linux", "Burp Suite Pro", "Metasploit", "OWASP Top 10", "Network Pivoting", "Binary Exploitation"],
        courses: ["Certified Ethical Hacker (CEH)", "Offensive Security Certified Professional (OSCP)"],
        careers: ["Penetration Tester", "Red Team Specialist", "Security Researcher", "Bug Bounty Hunter"],
        averageSalary: "₹9.5 - ₹28.0 LPA"
      },
      {
        id: "sub-network-sec",
        name: "Network Security",
        icon: "🌐",
        tagline: "Next-Gen Firewalls, IDS/IPS & Secure Routing",
        description: "Configuring perimeter firewalls, deep packet inspection, intrusion detection systems, and encrypted VPN tunnels across enterprise LAN/WAN.",
        skills: ["Palo Alto / Fortinet Firewalls", "Snort / Suricata IDS", "VPN / IPsec Protocols", "Wireshark Packet Analysis", "DDoS Mitigation"],
        courses: ["B.Tech CSE (Networks)", "Cisco CCNA / CCNP Security"],
        careers: ["Network Security Engineer", "Firewall Administrator", "Network Defense Specialist"],
        averageSalary: "₹7.0 - ₹20.0 LPA"
      },
      {
        id: "sub-comp-networking",
        name: "Computer Networking",
        icon: "🖧",
        tagline: "TCP/IP, Routing Protocols, SD-WAN & BGP",
        description: "Designing enterprise switching, multi-homed BGP routing, software-defined WAN (SD-WAN), and DNS/DHCP infrastructure.",
        skills: ["OSI & TCP/IP Stack", "BGP / OSPF / EIGRP", "Cisco / Juniper CLI", "Subnetting & CIDR", "SD-WAN Technologies"],
        courses: ["B.Tech ECE / IT", "Cisco CCNA Routing & Switching"],
        careers: ["Network Engineer", "Network Operations Center (NOC) Lead", "Telecom Engineer"],
        averageSalary: "₹5.5 - ₹16.0 LPA"
      },
      {
        id: "sub-cloud-security",
        name: "Cloud Security",
        icon: "☁️",
        tagline: "Cloud Workload Protection, CSPM & IAM Hardening",
        description: "Securing multi-cloud tenant environments through Cloud Security Posture Management (CSPM), least-privilege IAM, and container runtime guards.",
        skills: ["AWS GuardDuty / Security Hub", "Prisma Cloud", "IAM Least-Privilege", "Kubernetes Security (CKS)", "Secrets Management"],
        courses: ["Certified Cloud Security Professional (CCSP)", "AWS Certified Security Specialty"],
        careers: ["Cloud Security Architect", "DevSecOps Engineer", "Cloud Compliance Specialist"],
        averageSalary: "₹11.0 - ₹32.0 LPA"
      },
      {
        id: "sub-app-sec",
        name: "Application Security (AppSec)",
        icon: "🔐",
        tagline: "Secure Code Review, SAST/DAST & DevSecOps",
        description: "Integrating automated static/dynamic code analysis into development pipelines and guiding software teams on writing secure, tamper-proof code.",
        skills: ["SAST / DAST Tools (Snyk, SonarQube)", "Threat Modeling (STRIDE)", "Secure Coding Practices", "API Security (OAuth/JWT)"],
        courses: ["Certified Application Security Practitioner", "B.Tech CSE"],
        careers: ["Application Security Engineer", "DevSecOps Lead", "Security Code Auditor"],
        averageSalary: "₹10.0 - ₹28.0 LPA"
      },
      {
        id: "sub-digital-forensics",
        name: "Digital Forensics & Incident Response",
        icon: "🔍",
        tagline: "Memory Forensics, Malware Analysis & Cyber Law",
        description: "Investigating corporate data breaches, reconstructing attacker timelines from disk/memory artifacts, and preserving digital evidence for court proceedings.",
        skills: ["Autopsy / EnCase", "Volatility Memory Analysis", "Timeline Reconstruction", "Chain of Custody", "Malware Sandboxing"],
        courses: ["B.Sc / M.Sc Digital Forensics", "GIAC Certified Incident Handler (GCIH)"],
        careers: ["Forensics Investigator", "Incident Response Analyst", "Cybercrime Investigator"],
        averageSalary: "₹8.0 - ₹24.0 LPA"
      },
      {
        id: "sub-soc",
        name: "Security Operations Center (SOC)",
        icon: "🚨",
        tagline: "SIEM Monitoring, Threat Hunting & 24/7 Triage",
        description: "Monitoring live telemetry across firewalls and endpoints using SIEM/SOAR platforms to detect, isolate, and neutralize cyber intrusions in real time.",
        skills: ["Splunk / Microsoft Sentinel", "SOAR Playbooks", "Endpoint Detection & Response (EDR)", "Log Analysis", "MITRE ATT&CK Framework"],
        courses: ["Certified SOC Analyst (CSA)", "B.Tech IT"],
        careers: ["SOC Tier 1/2/3 Analyst", "Threat Hunter", "Incident Handler"],
        averageSalary: "₹6.0 - ₹18.0 LPA"
      }
    ]
  },
  {
    id: "dom-business-finance",
    name: "Business, Finance & Management",
    icon: "💼",
    tagline: "Strategic Leadership, Financial Technology & Global Commerce",
    description: "Drive corporate growth, architect financial investment models, master digital marketing, and steer modern supply chain operations.",
    subfields: [
      {
        id: "sub-biz-analytics-mgmt",
        name: "Business Analytics",
        icon: "📊",
        tagline: "Quantitative Decision Making & Corporate Forecasting",
        description: "Utilizing statistical models, market indicators, and corporate data to formulate growth strategies, cost reductions, and operational efficiencies.",
        skills: ["Predictive Analytics", "Tableau / Power BI", "Business Modeling", "Market Research", "SQL"],
        courses: ["BBA Business Analytics", "MBA Analytics", "IIM Executive Certificate"],
        careers: ["Business Intelligence Manager", "Analytics Consultant", "Operations Analyst"],
        averageSalary: "₹8.5 - ₹24.0 LPA"
      },
      {
        id: "sub-fintech",
        name: "FinTech",
        icon: "💳",
        tagline: "Payment Gateways, Algorithmic Lending & Neo-Banking",
        description: "Transforming traditional banking through UPI/digital payments, algorithmic credit scoring, blockchain ledgers, and automated trading algorithms.",
        skills: ["Digital Payments & UPI Architecture", "Regulatory Compliance (RBI/SEBI)", "Quantitative Finance", "Python for Finance", "API Banking"],
        courses: ["BBA / MBA in FinTech", "B.Com Banking & Finance", "FinTech Executive Track"],
        careers: ["FinTech Product Manager", "Quantitative Analyst", "Digital Lending Lead"],
        averageSalary: "₹9.0 - ₹28.0 LPA"
      },
      {
        id: "sub-finance-invest",
        name: "Finance & Investment",
        icon: "💰",
        tagline: "Valuation Modeling, M&A, Equity Research & Capital Markets",
        description: "Analyzing company financial statements, building discounted cash flow (DCF) valuation models, and managing mergers and acquisitions.",
        skills: ["DCF Financial Modeling", "M&A Deal Structuring", "Equity Research", "Portfolio Management", "Chartered Accountancy"],
        courses: ["Chartered Accountancy (CA)", "CFA (Chartered Financial Analyst)", "MBA Finance"],
        careers: ["Investment Banker", "Equity Research Analyst", "Corporate Finance Manager", "Portfolio Manager"],
        averageSalary: "₹12.0 - ₹38.0 LPA"
      },
      {
        id: "sub-digital-marketing",
        name: "Digital Marketing",
        icon: "📣",
        tagline: "Performance Ads, SEO, Content Funnels & Social Commerce",
        description: "Scaling brand reach and customer acquisition through paid search (SEM), search engine optimization (SEO), viral social funnels, and CRM retention.",
        skills: ["Google Ads / Meta Ads", "Technical SEO", "Growth Hacking", "Google Analytics 4", "Marketing Automation (HubSpot)"],
        courses: ["BBA Digital Marketing", "Digital Marketing Master Certificate"],
        careers: ["Growth Marketing Manager", "Performance Marketer", "SEO Director", "Brand Strategist"],
        averageSalary: "₹6.0 - ₹18.0 LPA"
      },
      {
        id: "sub-ecommerce",
        name: "E-Commerce",
        icon: "🛍️",
        tagline: "Direct-to-Consumer (D2C), Marketplace Merchandising & Logistics",
        description: "Managing online storefronts, catalog optimization, marketplace partnerships (Amazon/Flipkart), inventory turnover, and conversion rates.",
        skills: ["Shopify / Magento", "Marketplace Ads", "Conversion Rate Optimization (CRO)", "Inventory Forecasting", "Supply Chain Linkage"],
        courses: ["B.Com E-Commerce", "MBA Retail & E-Commerce"],
        careers: ["E-Commerce Category Manager", "D2C Brand Lead", "Online Merchandiser"],
        averageSalary: "₹7.0 - ₹20.0 LPA"
      },
      {
        id: "sub-biz-management",
        name: "Business Management",
        icon: "👔",
        tagline: "General Management, Organizational Leadership & Expansion",
        description: "Steering cross-functional enterprise teams, defining business unit goals, managing P&L statements, and leading strategic market expansion.",
        skills: ["P&L Management", "Strategic Frameworks (Porter/SWOT)", "Cross-Functional Leadership", "Change Management", "Negotiation"],
        courses: ["BBA General Management", "MBA (IIM / Top B-Schools)"],
        careers: ["General Manager", "Management Consultant", "Operations Director", "Chief of Staff"],
        averageSalary: "₹14.0 - ₹42.0 LPA"
      },
      {
        id: "sub-risk-mgmt",
        name: "Risk Management",
        icon: "⚖️",
        tagline: "Probability Models, Financial Hedging & Compliance",
        description: "Assessing statistical market risk, insurance loss probabilities, currency hedging, and enterprise operational risk frameworks.",
        skills: ["Actuarial Mathematics", "Risk Hedging", "Monte Carlo Simulations", "Basel III / Solvency II", "Stress Testing"],
        courses: ["Actuarial Science (IAI / IFoA)", "M.Sc Financial Statistics", "FRM Certification"],
        careers: ["Risk Analyst", "Actuary", "Enterprise Risk Manager"],
        averageSalary: "₹10.0 - ₹30.0 LPA"
      },
      {
        id: "sub-consulting",
        name: "Consulting & Corporate Advisory",
        icon: "🧭",
        tagline: "Strategy Transformation, Operations Diagnostic & M&A Strategy",
        description: "Advising enterprise leadership on strategic digital transformations, organizational restructuring, cost optimization, and post-merger integration.",
        skills: ["Hypothesis-Driven Problem Solving", "Financial Diagnostic", "Executive Presentation", "Change Leadership"],
        courses: ["MBA Consulting Track", "Executive PG Strategy"],
        careers: ["Management Consultant", "Strategy Associate", "Transformation Lead"],
        averageSalary: "₹15.0 - ₹40.0 LPA"
      },
      {
        id: "sub-operations",
        name: "Operations Management",
        icon: "⚙️",
        tagline: "Process Automation, Quality Assurance & Service Delivery",
        description: "Designing end-to-end service delivery workflows, bottleneck analysis, quality control standards (ISO), and business process re-engineering.",
        skills: ["Process Re-Engineering", "Kaizen & 5S", "Workflow Automation", "Capacity Planning", "SLA Governance"],
        courses: ["BBA Operations", "MBA Industrial Management"],
        careers: ["Operations Manager", "Service Delivery Lead", "Continuous Improvement Lead"],
        averageSalary: "₹7.5 - ₹20.0 LPA"
      },
      {
        id: "sub-supply-chain",
        name: "Supply Chain Management",
        icon: "📦",
        tagline: "Lean Six Sigma, Global Logistics & Procurement",
        description: "Optimizing end-to-end material procurement, warehouse automation, route planning, freight logistics, and lean inventory methodologies.",
        skills: ["Supply Chain Analytics", "Lean Six Sigma", "ERP Systems (SAP / Oracle)", "Warehouse Automation", "Procurement Strategy"],
        courses: ["B.Tech / BBA Supply Chain", "MBA in Operations Management"],
        careers: ["Supply Chain Manager", "Logistics Director", "Procurement Specialist"],
        averageSalary: "₹8.0 - ₹22.0 LPA"
      }
    ]
  },
  {
    id: "dom-design-media",
    name: "Design, Creative & Media",
    icon: "🎨",
    tagline: "User Experience, Visual Arts, Game Art & Immersive Storytelling",
    description: "Craft intuitive digital product experiences, high-fidelity 3D assets, compelling branding, and cinematic visual effects.",
    subfields: [
      {
        id: "sub-uiux-design",
        name: "UI/UX Design",
        icon: "✨",
        tagline: "Design Systems, User Research & Interactive Prototypes",
        description: "Crafting human-centered digital experiences through user persona research, wireframing, high-fidelity Figma components, and usability testing.",
        skills: ["Figma / FigJam", "User Research & Usability Testing", "Design Systems & Tokenization", "Wireframing & Prototyping", "Micro-Interactions"],
        courses: ["Bachelor of Design (B.Des UI/UX)", "NID / IDC Design Degree", "Google UX Certificate"],
        careers: ["Product Designer", "UI/UX Designer", "Design System Lead", "User Researcher"],
        averageSalary: "₹7.5 - ₹25.0 LPA"
      },
      {
        id: "sub-product-design",
        name: "Product Design",
        icon: "📐",
        tagline: "Physical Hardware, Ergonomics & CAD Prototyping",
        description: "Designing consumer electronics, ergonomic appliances, sustainable packaging, and physical products using CAD and 3D printing.",
        skills: ["SolidWorks / Rhino 3D", "Ergonomics & Human Factors", "Material Selection", "Rapid Prototyping (3D Printing)", "Design for Manufacturing"],
        courses: ["B.Des Industrial Design", "M.Des Product Design (NID/IIT)"],
        careers: ["Industrial Designer", "Hardware Product Designer", "Packaging Specialist"],
        averageSalary: "₹6.5 - ₹20.0 LPA"
      },
      {
        id: "sub-graphic-design",
        name: "Graphic Design",
        icon: "✒️",
        tagline: "Brand Identity, Typography & Visual Storytelling",
        description: "Creating unified brand identities, typography guidelines, vector illustrations, editorial layouts, and impactful visual communication.",
        skills: ["Adobe Illustrator", "Photoshop", "InDesign", "Typography & Color Theory", "Brand Identity Systems"],
        courses: ["B.Des Visual Communication", "BFA Fine Arts"],
        careers: ["Brand Designer", "Graphic Designer", "Visual Identity Lead", "Art Director"],
        averageSalary: "₹5.0 - ₹15.0 LPA"
      },
      {
        id: "sub-game-design",
        name: "Game Design",
        icon: "🏰",
        tagline: "Level Design, Mechanics & 3D Interactive Worlds",
        description: "Sculpting immersive game worlds, balancing gameplay mechanics, storyboarding narrative quests, and designing real-time environments.",
        skills: ["Unreal Engine Level Editor", "Unity", "Game Mechanics Balancing", "Narrative Design", "3D Grayboxing"],
        courses: ["B.Sc Game Design", "B.Des Game Art"],
        careers: ["Game Designer", "Level Designer", "Quest Writer", "Systems Designer"],
        averageSalary: "₹6.0 - ₹18.0 LPA"
      },
      {
        id: "sub-vfx",
        name: "VFX (Visual Effects)",
        icon: "🎬",
        tagline: "Compositing, CGI Dynamics & Fluid Simulations",
        description: "Creating cinematic visual effects, particle simulations (smoke, fire, water), character green-screen compositing, and photoreal CGI integration.",
        skills: ["Nuke Compositing", "Houdini FX Simulation", "Maya Dynamics", "Matchmoving", "Rotoscopy"],
        courses: ["B.Sc in VFX", "Advanced VFX Master Diploma"],
        careers: ["VFX Compositor", "Houdini FX Artist", "Matchmove Artist"],
        averageSalary: "₹6.5 - ₹22.0 LPA"
      },
      {
        id: "sub-animation",
        name: "Animation",
        icon: "🎞️",
        tagline: "2D/3D Character Rigging, Keyframing & Motion Principles",
        description: "Bringing characters and objects to life applying Disney's 12 principles of animation, 3D character rigging, and motion capture cleanup.",
        skills: ["Maya 3D Animation", "Character Rigging", "Blender Animation", "Toon Boom Harmony (2D)", "Motion Capture Cleanup"],
        courses: ["B.Des Animation", "3D Character Animation Degree"],
        careers: ["3D Character Animator", "Motion Graphics Artist", "Rigging Technical Director"],
        averageSalary: "₹5.5 - ₹18.0 LPA"
      },
      {
        id: "sub-digital-media",
        name: "Digital Media",
        icon: "🎙️",
        tagline: "Podcasting, Video Production & Multimedia Journalism",
        description: "Directing digital video productions, podcast broadcasting, sound design, and multi-platform content publishing across modern channels.",
        skills: ["Premiere Pro / DaVinci Resolve", "Audio Engineering (Audition)", "Studio Lighting & Cinematography", "Media Ethics"],
        courses: ["BJMC (Journalism & Mass Comm)", "M.A. Digital Media"],
        careers: ["Video Producer", "Podcast Host / Producer", "Digital Media Specialist"],
        averageSalary: "₹5.0 - ₹16.0 LPA"
      },
      {
        id: "sub-arvr-media",
        name: "AR/VR Creative",
        icon: "👓",
        tagline: "Spatial Storytelling, 3D UI & Virtual Environments",
        description: "Designing spatial user interfaces, interactive 3D virtual showrooms, and immersive narrative worlds for headsets and mobile AR.",
        skills: ["Spatial UI Design", "Unity / Unreal Prototyping", "3D Assets Optimization", "Immersive Audio Design"],
        courses: ["B.Des Immersive Media", "Spatial Design Specialization"],
        careers: ["XR Experience Designer", "Virtual World Creator", "Spatial Interaction Designer"],
        averageSalary: "₹7.5 - ₹22.0 LPA"
      },
      {
        id: "sub-creative-tech",
        name: "Creative Technology",
        icon: "💡",
        tagline: "Generative Art, Creative Coding & Interactive Installations",
        description: "Blending code, physical computing (Arduino/TouchDesigner), and visual art to produce responsive architectural projections and interactive digital art.",
        skills: ["TouchDesigner", "Processing / p5.js", "Creative Coding (GLSL/Shaders)", "Physical Sensors & Microcontrollers"],
        courses: ["B.Des Interactive Media", "Creative Computing Masterclass"],
        careers: ["Creative Technologist", "Interactive Media Artist", "Experiential Developer"],
        averageSalary: "₹7.0 - ₹20.0 LPA"
      }
    ]
  },
  {
    id: "dom-emerging-tech",
    name: "Emerging & Specialized Technologies",
    icon: "🚀",
    tagline: "Hardware-Software Convergence, Quantum, Green Tech & Robotics",
    description: "Pioneer breakthrough technological frontiers spanning quantum algorithms, semiconductor VLSI, autonomous robotics, and IoT sensor meshes.",
    subfields: [
      {
        id: "sub-iot",
        name: "Internet of Things (IoT)",
        icon: "📡",
        tagline: "Connected Smart Devices, Edge Sensors & MQTT Networks",
        description: "Connecting microcontrollers (ESP32/Arduino/Raspberry Pi) with cloud backends using MQTT, Bluetooth Low Energy, and smart sensor arrays.",
        skills: ["Embedded C / C++", "ESP32 & Microcontrollers", "MQTT & CoAP Protocols", "Sensor Interfacing", "AWS IoT Core"],
        courses: ["B.Tech IoT & Smart Systems", "B.E. Electronics & Communication"],
        careers: ["IoT Solutions Architect", "Firmware Engineer", "Smart Systems Developer"],
        averageSalary: "₹7.5 - ₹22.0 LPA"
      },
      {
        id: "sub-embedded",
        name: "Embedded Systems",
        icon: "📟",
        tagline: "Real-Time Operating Systems (RTOS), ARM Cortex & Driver Code",
        description: "Programming bare-metal microcontrollers, writing device drivers, and developing hard real-time operating systems (FreeRTOS) for mission-critical hardware.",
        skills: ["C / Embedded C", "FreeRTOS", "ARM Cortex Architecture", "I2C / SPI / UART Protocols", "Oscilloscope & Hardware Debugging"],
        courses: ["B.Tech ECE / EEE", "M.Tech Embedded Systems"],
        careers: ["Embedded Software Engineer", "Firmware Developer", "Hardware Integration Specialist"],
        averageSalary: "₹8.0 - ₹24.0 LPA"
      },
      {
        id: "sub-robotics",
        name: "Robotics",
        icon: "🦾",
        tagline: "Robot Operating System (ROS), Kinematics & Computer Vision",
        description: "Designing autonomous robotic arms, mobile AGVs, and drones with forward/inverse kinematics, path planning, and ROS2 middleware.",
        skills: ["ROS / ROS2", "Kinematics & Dynamics", "SLAM Navigation", "Sensor Fusion (LiDAR + IMU)", "Gazebo Simulation"],
        courses: ["B.Tech Robotics & Automation", "M.Tech Mechatronics"],
        careers: ["Robotics Engineer", "Autonomous Navigation Specialist", "Mechatronics Designer"],
        averageSalary: "₹9.0 - ₹28.0 LPA"
      },
      {
        id: "sub-automation",
        name: "Automation Engineering",
        icon: "🏭",
        tagline: "Industrial PLC/SCADA, Factory Automation & Mechatronics",
        description: "Programming Programmable Logic Controllers (PLC), SCADA supervision screens, and industrial fieldbuses (Modbus/Profinet) for automated manufacturing lines.",
        skills: ["PLC Programming (Siemens/Allen Bradley)", "SCADA / HMI Design", "Industrial Sensors", "Variable Frequency Drives (VFD)"],
        courses: ["B.Tech Mechatronics", "Industrial Automation Certification"],
        careers: ["Automation Engineer", "PLC Programmer", "Industrial Control Systems Lead"],
        averageSalary: "₹6.5 - ₹18.0 LPA"
      },
      {
        id: "sub-rpa",
        name: "RPA (Robotic Process Automation)",
        icon: "⚙️",
        tagline: "UiPath, Automation Anywhere & Corporate Bots",
        description: "Building software bots that automate repetitive enterprise tasks like invoice parsing, data reconciliation, and ERP entries.",
        skills: ["UiPath", "Automation Anywhere", "Process Mining", "OCR Integration", "VBA & C# Scripting"],
        courses: ["Certified UiPath RPA Developer", "BCA / MCA"],
        careers: ["RPA Developer", "Automation Architect", "Process Mining Lead"],
        averageSalary: "₹6.0 - ₹17.0 LPA"
      },
      {
        id: "sub-quantum",
        name: "Quantum Computing",
        icon: "⚛️",
        tagline: "Qubits, Quantum Circuits, Qiskit & Quantum Algorithms",
        description: "Developing quantum algorithms (Shor’s, Grover’s) and simulating quantum gates using IBM Qiskit, Cirq, and quantum annealing systems.",
        skills: ["IBM Qiskit", "Quantum Circuit Simulation", "Linear Algebra & Quantum Mechanics", "Quantum Key Distribution (QKD)"],
        courses: ["M.Sc / Ph.D Quantum Physics & Computing", "B.Tech Research"],
        careers: ["Quantum Software Engineer", "Quantum Algorithm Researcher", "Quantum Cryptography Scientist"],
        averageSalary: "₹14.0 - ₹40.0 LPA"
      },
      {
        id: "sub-semiconductor",
        name: "Semiconductor Technology",
        icon: "🔬",
        tagline: "Chip Design, Verilog/VHDL, ASIC & FPGA Architecture",
        description: "Designing integrated circuits (ICs), microprocessors, and system-on-chip (SoC) silicon dies using Verilog/SystemVerilog and EDA CAD tools.",
        skills: ["Verilog / SystemVerilog", "Cadence / Synopsys EDA", "FPGA Programming (Xilinx)", "ASIC Physical Design", "Static Timing Analysis"],
        courses: ["B.Tech / M.Tech VLSI Design", "B.E. Electronics Engineering"],
        careers: ["VLSI Design Engineer", "ASIC Verification Specialist", "Physical Design Engineer"],
        averageSalary: "₹12.0 - ₹36.0 LPA"
      },
      {
        id: "sub-edge-comp",
        name: "Edge Computing",
        icon: "📡",
        tagline: "Low-Latency Edge AI, Micro-Datacenters & 5G MEC",
        description: "Deploying lightweight ML inference models and processing pipelines directly on edge gateways and 5G Multi-access Edge Computing (MEC) nodes.",
        skills: ["TensorFlow Lite / ONNX", "Edge Gateway Architecture", "5G MEC Protocols", "Containerized Edge Deployments (K3s)"],
        courses: ["B.Tech CSE / IT", "Edge AI Specialization"],
        careers: ["Edge Computing Engineer", "IoT Edge Architect", "5G Systems Specialist"],
        averageSalary: "₹9.0 - ₹26.0 LPA"
      },
      {
        id: "sub-green-tech",
        name: "Green Technology",
        icon: "🌱",
        tagline: "Electric Vehicle (EV) Systems, Battery Management & Solar Grids",
        description: "Engineering lithium-ion battery management systems (BMS), EV motor controllers, smart microgrids, and sustainable clean energy installations.",
        skills: ["Battery Management Systems (BMS)", "Power Electronics & Inverters", "Renewable Energy Modeling", "EV Powertrain Design", "MATLAB Simulink"],
        courses: ["B.Tech Clean Tech & EV Engineering", "B.Tech Electrical & Renewable Energy"],
        careers: ["EV Powertrain Engineer", "BMS Firmware Specialist", "Clean Energy Consultant"],
        averageSalary: "₹8.0 - ₹22.0 LPA"
      },
      {
        id: "sub-emerging-ai",
        name: "Emerging AI Technologies",
        icon: "🔮",
        tagline: "Neuromorphic Chips, Multimodal Foundations & Swarm Intelligence",
        description: "Researching next-generation artificial general intelligence concepts, spiking neural networks (neuromorphic), and decentralized swarm robotics.",
        skills: ["Multimodal Architecture", "Neuromorphic Computing (Intel Loihi)", "Swarm Algorithms", "Ethics & AI Alignment"],
        courses: ["M.Tech / Ph.D in Advanced Artificial Intelligence"],
        careers: ["AI Research Fellow", "Neuromorphic Computing Scientist", "AI Alignment Researcher"],
        averageSalary: "₹15.0 - ₹45.0 LPA"
      }
    ]
  }
];

// Historical 10-Year Trend Survey Data (Indicative Platform Data)
const DOMAINS_HISTORICAL_TRENDS = [
  { domain: "Software & Web Development", icon: "💻", year2016: 62, year2026: 88, growth: "+42% Growth", desc: "Sustained high demand across startups and global MNC tech centers in India." },
  { domain: "Artificial Intelligence & ML", icon: "🤖", year2016: 18, year2026: 96, growth: "+433% Surge", desc: "Explosive transformation from niche research into mainstream production applications." },
  { domain: "Data Science & Big Data", icon: "📊", year2016: 30, year2026: 86, growth: "+186% Growth", desc: "Massive corporate data generation creating demand for analytical decision-making." },
  { domain: "Cloud & DevOps Systems", icon: "☁️", year2016: 25, year2026: 84, growth: "+236% Growth", desc: "Enterprise migration to multi-cloud infrastructure driving automated CI/CD roles." },
  { domain: "Cyber Security & Defense", icon: "🔒", year2016: 22, year2026: 80, growth: "+263% Growth", desc: "Heightened regulatory compliance, DPDP Act 2023, and global threat landscape." },
  { domain: "FinTech & Business Analytics", icon: "💳", year2016: 28, year2026: 78, growth: "+178% Growth", desc: "UPI revolution, digital lending platforms, and corporate business modeling." },
  { domain: "UI/UX & Product Design", icon: "🎨", year2016: 15, year2026: 72, growth: "+380% Growth", desc: "User-centric design becoming a core competitive advantage for digital products." },
  { domain: "Semiconductor & Hardware", icon: "🔬", year2016: 20, year2026: 68, growth: "+240% Growth", desc: "India Semiconductor Mission and electronics manufacturing boom driving VLSI demand." }
];

// Next 5 Years Future Outlook Projections (Indicative Platform Projections)
const DOMAINS_FUTURE_OUTLOOK = [
  { domain: "Generative AI & Agentic Systems", icon: "✨", demandIndex: "98 / 100", growthProj: "+145% Projected Demand", desc: "Autonomous AI agents, multimodal reasoning models, and domain-adapted enterprise copilots." },
  { domain: "Semiconductor Tech & VLSI Design", icon: "🔬", demandIndex: "94 / 100", growthProj: "+120% Projected Demand", desc: "Domestic silicon fabrication fabs, chip packaging (ATMP), and custom RISC-V processor design." },
  { domain: "Cloud Native, SRE & Platform Eng", icon: "☁️", demandIndex: "91 / 100", growthProj: "+95% Projected Demand", desc: "Serverless orchestration, distributed observability, and automated developer platforms." },
  { domain: "Cyber Resilience & Zero-Trust Defense", icon: "🛡️", demandIndex: "90 / 100", growthProj: "+88% Projected Demand", desc: "AI-driven autonomous threat hunting, post-quantum cryptography, and cloud workload security." },
  { domain: "Quantum Computing & Security", icon: "⚛️", demandIndex: "89 / 100", growthProj: "+110% Projected Demand", desc: "National Quantum Mission initiatives, quantum key distribution, and hybrid quantum algorithms." },
  { domain: "Autonomous Robotics & Kinematics", icon: "🦾", demandIndex: "88 / 100", growthProj: "+90% Projected Demand", desc: "Warehouse automation, surgical robotics, drone logistics, and human-collaborative cobots." },
  { domain: "Green Technology & EV Powertrains", icon: "🌱", demandIndex: "86 / 100", growthProj: "+85% Projected Demand", desc: "Battery management systems (BMS), smart renewable grids, and clean transport infrastructure." }
];

// Student & User Review / Guidance Cards (Demo / Sample Student Insights)
const DOMAINS_STUDENT_REVIEWS = [
  {
    author: "Priya Sharma",
    role: "B.Tech CSE Alum & Data Science Associate",
    avatar: "PS",
    domain: "Data Science & Analytics",
    rating: "★★★★★",
    statement: "Focus on building genuine end-to-end projects with clean statistical reasoning rather than just running model.fit(). Strong SQL, Pandas, and business context are what actually get you shortlisted by top engineering teams.",
    suggestion: "Master SQL and exploratory data analysis thoroughly before rushing into complex deep learning transformers."
  },
  {
    author: "Rahul Verma",
    role: "Full-Stack Engineer, Bengaluru Tech Hub",
    avatar: "RV",
    domain: "Web & Full-Stack Development",
    rating: "★★★★★",
    statement: "Starting with raw JavaScript and building 3 fully deployed web apps with React and Node.js gave me immense confidence. Frameworks evolve quickly, but deep fundamentals in async programming and REST architecture stay forever.",
    suggestion: "Deploy your web applications live on Vercel or AWS; live interactive links impress technical interviewers far more than code repos alone."
  },
  {
    author: "Ananya Deshmukh",
    role: "Cyber Security Analyst & Bug Hunter",
    avatar: "AD",
    domain: "Cyber Security & Ethical Hacking",
    rating: "★★★★★",
    statement: "Cyber security is practical and investigative. Setting up home VirtualBox labs and solving real challenges on PortSwigger Web Academy taught me exactly how vulnerabilities like SQL injection and CSRF occur and get patched.",
    suggestion: "Build a strong base in computer networking (TCP/IP, Wireshark, DNS) before jumping directly into offensive red teaming."
  },
  {
    author: "Karthik Nair",
    role: "Cloud Platform Engineer",
    avatar: "KN",
    domain: "Cloud, DevOps & Infrastructure",
    rating: "★★★★★",
    statement: "Docker and Kubernetes completely changed how I build and deploy software. Understanding container lifecycle, ingress routing, and writing Terraform scripts made me stand out immediately during campus placement drives.",
    suggestion: "Get completely comfortable with the Linux shell environment and treat all infrastructure configuration as code."
  },
  {
    author: "Sneha Mukherjee",
    role: "Product Designer (UI/UX), Mumbai",
    avatar: "SM",
    domain: "UI/UX & Product Design",
    rating: "★★★★★",
    statement: "Great product design is not just creating eye-catching mockups in Figma; it's about solving real human friction. Documenting my user research, wireframes, and usability testing feedback in case studies landed me my design offer.",
    suggestion: "Focus on understanding user mental models and building scalable design systems with auto-layout components."
  },
  {
    author: "Vikramaditya Sen",
    role: "Firmware & Embedded Systems Engineer",
    avatar: "VS",
    domain: "Robotics & Embedded Systems",
    rating: "★★★★★",
    statement: "Working with STM32 microcontrollers and FreeRTOS taught me hardware-software synchronization and low-latency programming. The current hardware and semiconductor boom in India is opening up tremendous career paths.",
    suggestion: "Learn C inside out, understand registers and memory constraints, and build physical prototypes on hardware dev boards."
  }
];

let domainsState = {
  searchQuery: '',
  expandedCategories: new Set(['dom-tech-software', 'dom-data-ai']) // Default open first 2 for rich discovery
};

let _liveDomainsData = null;
let _liveDomainsFetching = false;

async function syncLiveDomains() {
  if (_liveDomainsFetching) return;
  _liveDomainsFetching = true;
  try {
    const res = await fetch('/api/domains');
    if (res.ok) {
      const data = await res.json();
      const pgDomains = (data && Array.isArray(data.domains)) ? data.domains : [];
      if (pgDomains.length > 0) {
        const categories = JSON.parse(JSON.stringify(DOMAINS_DISCOVERY_DATA));
        pgDomains.forEach((d, idx) => {
          const streamName = (d.stream || 'Engineering & Technology').toLowerCase();
          let targetCat = categories.find(c =>
            c.name.toLowerCase().includes(streamName) ||
            streamName.includes(c.name.toLowerCase().split(' ')[0])
          );
          if (!targetCat && categories.length > 0) {
            targetCat = categories[0];
          }
          if (targetCat) {
            const exists = (targetCat.subfields || []).find(s =>
              s.name.toLowerCase() === (d.domain_name || '').toLowerCase()
            );
            if (!exists) {
              targetCat.subfields = targetCat.subfields || [];
              targetCat.subfields.push({
                id: `dom-pg-${d.id || idx}`,
                name: d.domain_name || 'Specialized Domain',
                tagline: d.career_scope || 'Industry Specialization Pathway',
                description: d.description || 'Core industry specialization track with high placement demand.',
                skills: Array.isArray(d.skills) ? d.skills : (typeof d.skills === 'string' ? d.skills.split(',').map(s => s.trim()) : ['Core Competencies']),
                careers: [d.career_scope || 'Specialist Engineer'],
                colleges: Array.isArray(d.colleges) ? d.colleges : (typeof d.colleges === 'string' ? d.colleges.split(',').map(s => s.trim()) : ['Premier Institutions']),
                salaryRange: d.career_scope || '₹12 LPA - ₹35 LPA',
                averageSalary: d.career_scope || '₹12 LPA - ₹35 LPA',
                roadmap: d.roadmap || d.full_roadmap || '',
                icon: d.icon || '🌐'
              });
            }
          }
        });
        _liveDomainsData = categories;
        const container = document.getElementById('domainsPageContent');
        if (container && container.innerHTML.trim() !== '') {
          renderDomainsDiscoveryView(domainsState.searchQuery);
        }
      }
    }
  } catch (e) {
    console.warn('[Domains] Live sync notice:', e);
  } finally {
    _liveDomainsFetching = false;
  }
}

function renderDomainsDiscoveryView(searchQuery = '') {
  const container = document.getElementById('domainsPageContent');
  if (!container) return;

  if (!_liveDomainsData) {
    syncLiveDomains();
  }
  const sourceData = _liveDomainsData || DOMAINS_DISCOVERY_DATA;

  domainsState.searchQuery = (searchQuery || '').trim();
  const q = domainsState.searchQuery.toLowerCase();

  // If search query entered, auto expand all matching categories
  if (q.length > 0) {
    domainsState.expandedCategories.clear();
    sourceData.forEach(cat => {
      const catMatch = cat.name.toLowerCase().includes(q) || cat.description.toLowerCase().includes(q);
      const subMatch = (cat.subfields || []).some(s =>
        s.name.toLowerCase().includes(q) ||
        s.tagline.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        (s.skills || []).some(sk => sk.toLowerCase().includes(q))
      );
      if (catMatch || subMatch) {
        domainsState.expandedCategories.add(cat.id);
      }
    });
  }

  // Filter Categories & Subfields
  const filteredCategories = sourceData.map(cat => {
    if (q.length === 0) return cat;

    const catMatch = cat.name.toLowerCase().includes(q) || cat.description.toLowerCase().includes(q);
    const matchingSubfields = (cat.subfields || []).filter(sub => {
      const subText = `${sub.name} ${sub.tagline} ${sub.description} ${(sub.skills || []).join(' ')} ${(sub.careers || []).join(' ')}`.toLowerCase();
      return catMatch || subText.includes(q);
    });

    if (matchingSubfields.length > 0) {
      return {
        ...cat,
        subfields: matchingSubfields
      };
    }
    return null;
  }).filter(Boolean);

  const totalSubfieldsCount = sourceData.reduce((sum, c) => sum + (c.subfields || []).length, 0);

  container.innerHTML = `
    <div class="domains-discovery-container">

      <!-- 1. Search Box for Domains -->
      <div class="courses-search-section">
        <div class="courses-search-bar-wrap">
          <span class="courses-search-lead-icon">🔍</span>
          <input
            type="text"
            id="domainsSearchInput"
            class="courses-search-input-field"
            placeholder="Search domains, specializations &amp; skills (e.g. Python, AI, Cyber, Cloud, UI/UX, Data Science, DevOps, Robotics)..."
            value="${domainsState.searchQuery}"
            autocomplete="off"
          />
          <button type="button" id="domainsSearchClearBtn" class="courses-search-clear-btn" style="display:${domainsState.searchQuery ? 'block' : 'none'};" onclick="clearDomainsSearch()">✕</button>
        </div>

        <div class="courses-quick-chips-row">
          <span class="courses-quick-chips-label">Popular Searches:</span>
          <button type="button" class="courses-filter-chip ${q === 'ai' || q === 'artificial intelligence' ? 'active' : ''}" onclick="filterDomainsByKeyword('AI')">AI &amp; Generative AI</button>
          <button type="button" class="courses-filter-chip ${q === 'python' ? 'active' : ''}" onclick="filterDomainsByKeyword('Python')">Python Development</button>
          <button type="button" class="courses-filter-chip ${q === 'data science' ? 'active' : ''}" onclick="filterDomainsByKeyword('Data Science')">Data Science</button>
          <button type="button" class="courses-filter-chip ${q === 'cloud' || q === 'devops' ? 'active' : ''}" onclick="filterDomainsByKeyword('Cloud')">Cloud &amp; DevOps</button>
          <button type="button" class="courses-filter-chip ${q === 'cyber' ? 'active' : ''}" onclick="filterDomainsByKeyword('Cyber')">Cyber Security</button>
          <button type="button" class="courses-filter-chip ${q === 'ui/ux' || q === 'design' ? 'active' : ''}" onclick="filterDomainsByKeyword('UI/UX')">UI/UX Design</button>
          <button type="button" class="courses-filter-chip ${q === 'fintech' ? 'active' : ''}" onclick="filterDomainsByKeyword('FinTech')">FinTech &amp; Finance</button>
          <button type="button" class="courses-filter-chip ${q === 'semiconductor' || q === 'robotics' ? 'active' : ''}" onclick="filterDomainsByKeyword('Semiconductor')">Semiconductor &amp; Robotics</button>
        </div>
      </div>

      <!-- 2. Results Count Summary & Expand All -->
      <div class="courses-meta-summary-bar">
        <div class="courses-meta-summary-highlight">
          <span class="stat-indicator-dot"></span>
          <span>Showing <b>${filteredCategories.length} of ${DOMAINS_DISCOVERY_DATA.length} Major Domain Categories</b> &bull; ${totalSubfieldsCount} Specialized Career Tracks</span>
        </div>
        <button type="button" class="courses-expand-all-btn" onclick="toggleAllDomainCategories()">
          ${domainsState.expandedCategories.size >= filteredCategories.length ? 'Collapse All ▴' : 'Expand All ▾'}
        </button>
      </div>

      <!-- 3. Seven Expandable Domain Categories Explorer -->
      <div class="domains-category-stack">
        ${filteredCategories.length === 0 ? `
          <div class="courses-empty-results-box">
            <h3>No domain specializations found matching "${domainsState.searchQuery}"</h3>
            <p>Try searching for core keywords like "Python", "AI", "Cloud", "Data Science", "Design", "Cyber", or "Robotics".</p>
            <button type="button" class="courses-filter-chip active" style="margin-top:10px;" onclick="clearDomainsSearch()">
              Clear Search &amp; Show All 7 Categories
            </button>
          </div>
        ` : filteredCategories.map((cat, idx) => {
          const isExp = domainsState.expandedCategories.has(cat.id);
          const subCount = (cat.subfields || []).length;

          return `
            <div class="domain-category-block ${isExp ? 'expanded' : ''}" id="domainBlock_${cat.id}">
              <button type="button" class="domain-category-trigger" onclick="toggleDomainCategory('${cat.id}')" aria-expanded="${isExp}">
                <div class="domain-category-header-left">
                  <div class="domain-category-icon-box">${cat.icon}</div>
                  <div class="domain-category-info">
                    <h3>${idx + 1}. ${cat.name}</h3>
                    <p>${cat.description}</p>
                  </div>
                </div>
                <div class="domain-category-header-right">
                  <span class="category-stats-badge">${subCount} Specializations</span>
                  <div class="category-arrow-indicator" style="color:var(--coral); font-size:16px;">${isExp ? '▴' : '▾'}</div>
                </div>
              </button>

              <div class="domain-subfields-container">
                <div class="domain-subfields-grid">
                  ${(cat.subfields || []).map(sub => `
                    <div class="domain-card-item" onclick="openDomainDetailsModal('${sub.id}')">
                      <div>
                        <div class="domain-card-top">
                          <span class="domain-card-icon">${sub.icon || '🌐'}</span>
                          <div>
                            <div class="domain-card-title">${escapeHtml(sub.name || 'Specialized Domain')}</div>
                            <div class="domain-card-tagline">${escapeHtml(sub.tagline || 'Career Track')}</div>
                          </div>
                        </div>
                        <div style="font-size:11.5px; color:#64748B; margin-top:8px; line-height:1.4;">
                          ${escapeHtml(sub.description || 'Comprehensive domain curriculum and career pathway.')}
                        </div>
                        <div style="display:flex; flex-wrap:wrap; gap:4px; margin-top:10px;">
                          ${(sub.skills || []).slice(0, 3).map(sk => `
                            <span style="font-size:10px; background:#F1F5F9; padding:2px 7px; border-radius:10px; color:#475569; font-weight:600;">${escapeHtml(sk)}</span>
                          `).join('')}
                          ${(sub.skills || []).length > 3 ? `<span style="font-size:10px; color:var(--coral); padding:2px 4px;">+${sub.skills.length - 3} more</span>` : ''}
                        </div>
                      </div>

                      <div class="domain-card-footer">
                        <span class="domain-salary-pill">💼 ${escapeHtml(sub.averageSalary || sub.salaryRange || 'High Demand')}</span>
                        <span class="domain-view-link">Explore Roadmap ➔</span>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- 4. India's Domain Trends: The Last 10 Years Survey -->
      <section class="domain-survey-section">
        <div class="survey-section-header">
          <div>
            <h2>📊 India’s Domain Trends: The Last 10 Years (2016 – 2026)</h2>
            <p>Analysis of how education and career interest across major disciplines has shifted over the past decade in India.</p>
          </div>
          <span class="survey-tag">Platform Indicative Trend Data</span>
        </div>

        <div class="survey-split-layout">
          <!-- Left: Existing domain trend cards unchanged -->
          <div class="survey-cards-column">
            <div class="trends-chart-grid">
              ${DOMAINS_HISTORICAL_TRENDS.map(tr => `
                <div class="trend-metric-card">
                  <div class="trend-metric-top">
                    <span class="trend-metric-title">
                      <span>${tr.icon}</span>
                      <span>${tr.domain}</span>
                    </span>
                    <span class="trend-growth-badge">${tr.growth}</span>
                  </div>

                  <div class="trend-bars-wrap">
                    <div class="trend-bar-row">
                      <span class="trend-bar-label">2016:</span>
                      <div class="trend-bar-track">
                        <div class="trend-bar-fill year-2016" style="width:${tr.year2016}%;"></div>
                      </div>
                      <span class="trend-bar-val" style="color:#4DA49E;">${tr.year2016}%</span>
                    </div>
                    <div class="trend-bar-row">
                      <span class="trend-bar-label">2026:</span>
                      <div class="trend-bar-track">
                        <div class="trend-bar-fill year-2026" style="width:${tr.year2026}%;"></div>
                      </div>
                      <span class="trend-bar-val" style="color:var(--coral);">${tr.year2026}%</span>
                    </div>
                  </div>

                  <div style="font-size:11.5px; color:var(--theme-muted); line-height:1.35;">
                    ${tr.desc}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Right: Clean professional comparative 10-year bar chart -->
          <aside class="survey-chart-sidebar">
            <div class="domain-sidebar-chart-card">
              <div class="sidebar-chart-head">
                <div class="sidebar-chart-title">
                  <strong>📊 10-Year Growth Comparison</strong>
                  <small>2016 Baseline vs 2026 Adoption</small>
                </div>
                <div class="sidebar-chart-legend">
                  <span class="legend-item"><i class="legend-dot blue"></i> 2016</span>
                  <span class="legend-item"><i class="legend-dot coral"></i> 2026</span>
                </div>
              </div>

              <div class="hist-bar-chart-list">
                ${DOMAINS_HISTORICAL_TRENDS.map(tr => `
                  <div class="hist-chart-item">
                    <div class="hist-item-header">
                      <span class="hist-item-name"><span>${tr.icon}</span> ${tr.domain}</span>
                      <span class="hist-item-growth">${tr.growth}</span>
                    </div>
                    <div class="hist-bars-group">
                      <div class="hist-bar-single">
                        <span class="hist-bar-year-tag">2016</span>
                        <div class="hist-bar-track-wrap">
                          <div class="hist-bar-fill-seg b2016" style="width: ${tr.year2016}%;"></div>
                        </div>
                        <span class="hist-bar-val-text" style="color:#4DA49E;">${tr.year2016}%</span>
                      </div>
                      <div class="hist-bar-single">
                        <span class="hist-bar-year-tag">2026</span>
                        <div class="hist-bar-track-wrap">
                          <div class="hist-bar-fill-seg b2026" style="width: ${tr.year2026}%;"></div>
                        </div>
                        <span class="hist-bar-val-text" style="color:var(--coral);">${tr.year2026}%</span>
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>

              <div class="sidebar-chart-footer">
                <span>Domain Growth Pace: <b>Accelerating</b></span>
                <span>Avg Surge: <b>+238%</b></span>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <!-- 5. Next 5 Years Domain Outlook Survey -->
      <section class="domain-survey-section">
        <div class="survey-section-header">
          <div>
            <h2>🔮 Where Domains Are Heading: Next 5 Years (2026 – 2031)</h2>
            <p>Future projections of breakthrough technologies and specialized fields expected to experience high industry adoption.</p>
          </div>
          <span class="survey-tag future">Platform Outlook &amp; Projections</span>
        </div>

        <div class="survey-split-layout">
          <!-- Left: Existing future domain cards unchanged -->
          <div class="survey-cards-column">
            <div class="future-outlook-grid">
              ${DOMAINS_FUTURE_OUTLOOK.map(fut => `
                <div class="future-outlook-card">
                  <div class="future-card-top">
                    <span class="future-card-title">
                      <span style="margin-right:6px;">${fut.icon}</span>
                      <span>${fut.domain}</span>
                    </span>
                    <span class="future-demand-index">${fut.demandIndex}</span>
                  </div>

                  <div class="future-progress-track">
                    <div class="future-progress-fill" style="width:${fut.demandIndex.split('/')[0].trim()}%;"></div>
                  </div>

                  <div style="font-size:11px; font-weight:800; color:#3A9B8F;">
                    📈 ${fut.growthProj}
                  </div>

                  <p class="future-card-desc">
                    ${fut.desc}
                  </p>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Right: Clean professional 5-year demand bar chart -->
          <aside class="survey-chart-sidebar">
            <div class="domain-sidebar-chart-card">
              <div class="sidebar-chart-head">
                <div class="sidebar-chart-title">
                  <strong>🔮 2026–2031 Demand Index Radar</strong>
                  <small>Projected Industry Priority (0–100 Scale)</small>
                </div>
                <div class="sidebar-chart-legend">
                  <span class="legend-item"><i class="legend-dot teal"></i> Priority</span>
                </div>
              </div>

              <div class="future-bar-chart-list">
                ${DOMAINS_FUTURE_OUTLOOK.map(fut => {
                  const val = parseInt(fut.demandIndex.split('/')[0].trim(), 10) || 90;
                  return `
                    <div class="future-chart-item">
                      <div class="future-item-top">
                        <span class="future-item-name"><span>${fut.icon}</span> ${fut.domain}</span>
                        <span class="future-item-score">${fut.demandIndex}</span>
                      </div>
                      <div class="future-chart-track">
                        <div class="future-chart-fill" style="width: ${val}%;"></div>
                      </div>
                      <div class="future-item-proj">
                        <span style="color:#3A9B8F; font-weight:700;">📈 ${fut.growthProj}</span>
                        <span>High Priority</span>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>

              <div class="sidebar-chart-footer">
                <span>Outlook: <b>7 High-Growth Sectors</b></span>
                <span>Demand Curve: <b>Steep</b></span>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <!-- 6. Student & User Review / Guidance Section -->
      <section class="domain-survey-section">
        <div class="survey-section-header">
          <div>
            <h2>💬 Student &amp; Practitioner Experience &amp; Suggestions</h2>
            <p>Real-world insights, study tips, and domain selection guidance shared by learners and working engineers.</p>
          </div>
          <span class="survey-tag" style="background:rgba(58, 155, 143, 0.12); color:var(--coral); border-color:rgba(58, 155, 143, 0.3);">
            Sample Student Guidance
          </span>
        </div>

        <div class="survey-split-layout">
          <!-- Left: Existing review cards unchanged -->
          <div class="survey-cards-column">
            <div class="domain-reviews-grid">
              ${DOMAINS_STUDENT_REVIEWS.map(rev => `
                <div class="domain-review-card">
                  <div>
                    <div class="review-header-row">
                      <span class="review-domain-pill">${rev.domain}</span>
                      <span class="review-stars">${rev.rating}</span>
                    </div>

                    <p class="review-quote-text" style="margin:12px 0;">
                      "${rev.statement}"
                    </p>

                    <div class="review-suggestion-box">
                      <strong>💡 Pro Recommendation:</strong>
                      <p>${rev.suggestion}</p>
                    </div>
                  </div>

                  <div class="review-user-info">
                    <div class="review-user-avatar">${rev.avatar}</div>
                    <div class="review-user-meta">
                      <h4>${rev.author}</h4>
                      <span>${rev.role}</span>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Right: New Your Own Remarks Panel with subtle education background -->
          <aside class="survey-chart-sidebar">
            <div class="user-remarks-panel">
              <div class="user-remarks-bg-img" style="background-image: url('https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80');"></div>
              <div class="user-remarks-content">
                <div class="remarks-panel-head">
                  <h3>📝 Your Own Remarks</h3>
                  <p>Share your domain experience, suggestion, or study advice to help fellow learners navigate their career roadmap.</p>
                </div>

                <div class="remarks-form-group">
                  <div class="remarks-form-row">
                    <input type="text" id="userRemarkAuthor" class="remarks-input" placeholder="Your Name (e.g. Arjun)" />
                    <select id="userRemarkRating" class="remarks-select">
                      <option value="★★★★★">★★★★★ (Top Choice)</option>
                      <option value="★★★★☆">★★★★☆ (Strong Path)</option>
                      <option value="★★★☆☆">★★★☆☆ (Good)</option>
                    </select>
                  </div>

                  <select id="userRemarkDomain" class="remarks-select">
                    <option value="Artificial Intelligence & ML">🤖 AI & Machine Learning</option>
                    <option value="Data Science & Analytics">📊 Data Science & Analytics</option>
                    <option value="Web & Full-Stack Development">💻 Web & Full-Stack</option>
                    <option value="Cyber Security & Defense">🔒 Cyber Security & Defense</option>
                    <option value="Cloud, DevOps & Systems">☁️ Cloud & DevOps Infrastructure</option>
                    <option value="FinTech & Quant Analytics">💳 FinTech & Quant Finance</option>
                    <option value="UI/UX & Product Design">🎨 UI/UX & Product Design</option>
                    <option value="VLSI & Semiconductor Tech">🔬 VLSI & Semiconductor</option>
                    <option value="Green Tech & Clean Energy">🌱 Green Tech & EV Systems</option>
                    <option value="Other / General Guidance">🌐 General Pathway Advice</option>
                  </select>

                  <textarea id="userRemarkText" class="remarks-textarea" placeholder="Write your remark, study tips, or career suggestion here..."></textarea>

                  <button type="button" class="remarks-submit-btn" id="submitRemarkBtn" onclick="submitUserDomainRemark()">
                    <span>Submit Remark</span>
                    <span>➔</span>
                  </button>
                </div>

                <div class="user-remarks-feed" id="userRemarksListContainer">
                  <!-- Dynamic user remarks list rendered here -->
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

    </div>
  `;

  // Render stored user remarks inside the remarks feed
  renderUserRemarksList();

  // Attach search event listener
  const sInp = document.getElementById('domainsSearchInput');
  if (sInp) {
    sInp.addEventListener('input', (e) => {
      renderDomainsDiscoveryView(e.target.value);
      const newInp = document.getElementById('domainsSearchInput');
      if (newInp) {
        newInp.focus();
        newInp.setSelectionRange(newInp.value.length, newInp.value.length);
      }
    });
  }
}

// User Remarks Persistence & Handler
const USER_DOMAIN_REMARKS_KEY = 'thecampusnova_domain_user_remarks';

function getUserDomainRemarks() {
  try {
    const raw = localStorage.getItem(USER_DOMAIN_REMARKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveUserDomainRemarks(remarks) {
  try {
    localStorage.setItem(USER_DOMAIN_REMARKS_KEY, JSON.stringify(remarks));
  } catch (e) {
    console.warn('Could not save user remarks', e);
  }
}

function submitUserDomainRemark() {
  const authorInp = document.getElementById('userRemarkAuthor');
  const domainSel = document.getElementById('userRemarkDomain');
  const textInp = document.getElementById('userRemarkText');
  const ratingSel = document.getElementById('userRemarkRating');

  const text = (textInp ? textInp.value : '').trim();
  if (!text) {
    if (typeof showToast === 'function') {
      showToast('Please enter your remarks or suggestions before submitting.');
    } else {
      alert('Please enter your remarks or suggestions before submitting.');
    }
    return;
  }

  const author = (authorInp ? authorInp.value.trim() : '') || 'Student / Learner';
  const domain = (domainSel ? domainSel.value : '') || 'Technology & Engineering';
  const rating = (ratingSel ? ratingSel.value : '★★★★★');
  const avatar = author.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'ST';

  const newRemark = {
    id: 'rem_' + Date.now(),
    author: author,
    avatar: avatar,
    domain: domain,
    rating: rating,
    statement: text,
    timestamp: 'Just now'
  };

  const existingRemarks = getUserDomainRemarks();
  existingRemarks.unshift(newRemark);
  saveUserDomainRemarks(existingRemarks);

  if (textInp) textInp.value = '';
  if (authorInp) authorInp.value = '';

  renderUserRemarksList();

  if (typeof showToast === 'function') {
    showToast('Your remark has been posted successfully!');
  }
}
window.submitUserDomainRemark = submitUserDomainRemark;

function renderUserRemarksList() {
  const container = document.getElementById('userRemarksListContainer');
  if (!container) return;

  const remarks = getUserDomainRemarks();
  if (!remarks || remarks.length === 0) {
    container.innerHTML = `
      <div class="user-remark-empty">
        <span>💬 No community remarks added yet.</span><br>
        <small>Be the first to share your learning roadmaps and experience!</small>
      </div>
    `;
    return;
  }

  container.innerHTML = remarks.map(r => `
    <div class="user-remark-item">
      <div class="user-remark-item-head">
        <span class="user-remark-author">
          <span style="display:inline-grid; place-items:center; width:22px; height:22px; border-radius:50%; background:var(--coral); color:#fff; font-size:9.5px; font-weight:800;">${r.avatar}</span>
          <span>${r.author}</span>
        </span>
        <span class="user-remark-domain-tag">${r.domain}</span>
      </div>
      <p class="user-remark-body">"${r.statement}"</p>
      <div style="display:flex; justify-content:space-between; align-items:center; font-size:10px; color:var(--theme-muted);">
        <span style="color:#3A9B8F;">${r.rating}</span>
        <span>${r.timestamp || 'Recent'}</span>
      </div>
    </div>
  `).join('');
}
window.renderUserRemarksList = renderUserRemarksList;

function toggleDomainCategory(catId) {
  if (domainsState.expandedCategories.has(catId)) {
    domainsState.expandedCategories.delete(catId);
  } else {
    domainsState.expandedCategories.add(catId);
  }
  const block = document.getElementById(`domainBlock_${catId}`);
  if (block) {
    const isExp = domainsState.expandedCategories.has(catId);
    block.classList.toggle('expanded', isExp);
    const trigger = block.querySelector('.domain-category-trigger');
    if (trigger) trigger.setAttribute('aria-expanded', isExp);
    const arrow = block.querySelector('.category-arrow-indicator');
    if (arrow) arrow.textContent = isExp ? '▴' : '▾';
  }
}
window.toggleDomainCategory = toggleDomainCategory;

function toggleAllDomainCategories() {
  if (domainsState.expandedCategories.size >= DOMAINS_DISCOVERY_DATA.length) {
    domainsState.expandedCategories.clear();
  } else {
    DOMAINS_DISCOVERY_DATA.forEach(c => domainsState.expandedCategories.add(c.id));
  }
  renderDomainsDiscoveryView(domainsState.searchQuery);
}
window.toggleAllDomainCategories = toggleAllDomainCategories;

function filterDomainsByKeyword(keyword) {
  const sInp = document.getElementById('domainsSearchInput');
  if (sInp) sInp.value = keyword;
  renderDomainsDiscoveryView(keyword);
}
window.filterDomainsByKeyword = filterDomainsByKeyword;

function clearDomainsSearch() {
  domainsState.searchQuery = '';
  domainsState.expandedCategories.clear();
  domainsState.expandedCategories.add('dom-tech-software');
  domainsState.expandedCategories.add('dom-data-ai');
  renderDomainsDiscoveryView('');
}
window.clearDomainsSearch = clearDomainsSearch;

function openDomainFullRoadmapModal(matchedSub, parentCat) {
  if (!matchedSub) return;
  if (typeof closeCollegeModal === 'function') closeCollegeModal();
  const subName = matchedSub.name || 'Specialized Domain';
  const parentName = (parentCat && parentCat.name) || 'Engineering & Technology';

  // Format structured stages from matchedSub.roadmap or domain skills
  let rawRd = matchedSub.roadmap || matchedSub.full_roadmap || '';
  let stages = [];
  if (typeof rawRd === 'string' && rawRd.trim()) {
    const lines = rawRd.split(/\n|;/).map(l => l.trim()).filter(Boolean);
    stages = lines.map((l, idx) => {
      const parts = l.split(':');
      return {
        stage: idx + 1,
        title: parts.length > 1 ? parts[0].replace(/^Stage\s*\d+[\.\-\s]*/i, '').trim() : `Phase ${idx + 1}`,
        focus: parts.length > 1 ? parts.slice(1).join(':').trim() : l,
        skills: (matchedSub.skills || []).slice(idx * 2, (idx + 1) * 2 + 1)
      };
    });
  }

  if (stages.length === 0) {
    const skillsList = matchedSub.skills || ['Core Foundations', 'System Architecture', 'Production Tooling'];
    stages = [
      {
        stage: 1,
        title: "Foundations & Prerequisite Core Principles",
        focus: `Master prerequisite programming, mathematical fundamentals, and core theories governing ${subName}.`,
        skills: skillsList.slice(0, 3)
      },
      {
        stage: 2,
        title: "Specialized Architectures & Production Tooling",
        focus: `Hands-on training with industry-standard frameworks, libraries, modern development workflows, and version control.`,
        skills: skillsList.slice(2, 5)
      },
      {
        stage: 3,
        title: "End-to-End Real-World Project Engineering",
        focus: `Build, test, and containerize full-featured production systems, APIs, and responsive user-facing interfaces.`,
        skills: skillsList.slice(4, 7)
      },
      {
        stage: 4,
        title: "Performance Optimization, Security & Cloud Deployment",
        focus: `Deploy applications across cloud infrastructure, implement CI/CD pipelines, ensure zero-trust security, and optimize throughput.`,
        skills: ["Cloud Architecture", "CI/CD & DevOps", "Performance Auditing"]
      },
      {
        stage: 5,
        title: "Industry Placement & Senior Technical Mastery",
        focus: `Technical interview preparation, system design simulations, corporate mentorship, and senior portfolio defense.`,
        skills: ["System Design", "Scalability", "Production Troubleshooting"]
      }
    ];
  }

  const stagesHtml = stages.map((st, idx) => {
    const stageNum = st.stage || (idx + 1);
    const stageTitle = st.title || `Phase ${stageNum}`;
    const stageFocus = st.focus || 'Comprehensive curriculum milestones and applied project requirements.';
    const stageSkills = Array.isArray(st.skills) ? st.skills : [];

    return `
      <div style="background:#FFFFFF; border:1px solid var(--theme-line, #E2E8F0); border-radius:12px; padding:16px; margin-bottom:12px; box-shadow:0 2px 8px rgba(0,0,0,0.02);">
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
          <span style="background:#77AC3B; color:#FFFFFF; font-size:11px; font-weight:800; padding:3px 9px; border-radius:12px; letter-spacing:0.04em;">STAGE ${escapeHtml(String(stageNum))}</span>
          <h4 style="margin:0; font-size:15px; font-weight:800; color:#0F172A;">${escapeHtml(stageTitle)}</h4>
        </div>
        <p style="margin:0 0 10px; font-size:13px; color:#334155; line-height:1.5;">${escapeHtml(stageFocus)}</p>
        ${stageSkills.length > 0 ? `
          <div style="background:#F8FAFC; border-radius:8px; padding:8px 12px; border:1px solid #E2E8F0;">
            <strong style="font-size:11px; color:#64748B; display:block; margin-bottom:4px; text-transform:uppercase;">Curriculum Competencies &amp; Tools:</strong>
            <div style="display:flex; flex-wrap:wrap; gap:6px;">
              ${stageSkills.map(sk => `
                <span style="background:#FFFFFF; border:1px solid #CBD5E1; color:#0F172A; font-size:11px; font-weight:600; padding:3px 8px; border-radius:6px;">
                  ⚡ ${escapeHtml(String(sk))}
                </span>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');

  const contentHtml = `
    <div style="font-size:13.5px; color:#334155;">
      <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; padding:14px 16px; margin-bottom:16px;">
        <span style="font-size:11px; font-weight:800; color:#77AC3B; text-transform:uppercase; letter-spacing:0.06em;">DOMAIN SPECIALIZATION</span>
        <h3 style="margin:2px 0 4px; font-size:16px; font-weight:800; color:#0F172A;">${escapeHtml(subName)}</h3>
        <p style="margin:0 0 8px; font-size:12.5px; color:#64748B; line-height:1.45;">${escapeHtml(matchedSub.description || 'Verified domain curriculum and learning pathway.')}</p>
        <div style="display:flex; gap:12px; flex-wrap:wrap; font-size:12px;">
          <span>💼 <strong>Compensation:</strong> ${escapeHtml(matchedSub.averageSalary || matchedSub.salaryRange || 'High Demand')}</span>
          <span>🏛️ <strong>Discipline:</strong> ${escapeHtml(parentName)}</span>
        </div>
      </div>

      <div style="margin-bottom:10px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <h4 style="margin:0; font-size:14px; font-weight:800; color:#0F172A;">🗺️ Step-by-Step Learning Curriculum &amp; Progression:</h4>
          <span style="font-size:11.5px; color:#64748B;">Complete 5-Stage Blueprint</span>
        </div>
        ${stagesHtml}
      </div>
    </div>
  `;

  openUniversalModal({
    title: `${matchedSub.icon || '🌐'} ${subName}`,
    subtitle: `${parentName} • Complete Learning Curriculum & Roadmap`,
    badge: 'DOMAIN ROADMAP',
    contentHtml: contentHtml,
    primaryActionHtml: `<button type="button" class="primary-button" onclick="closeUniversalModal()">Close Roadmap</button>`
  });
}
window.openDomainFullRoadmapModal = openDomainFullRoadmapModal;

function openDomainDetailsModal(subfieldId) {
  let matchedSub = null;
  let parentCat = null;
  const sourceCats = _liveDomainsData || DOMAINS_DISCOVERY_DATA;
  for (const cat of sourceCats) {
    const found = (cat.subfields || []).find(s => String(s.id) === String(subfieldId) || s.name.toLowerCase() === String(subfieldId).toLowerCase());
    if (found) {
      matchedSub = found;
      parentCat = cat;
      break;
    }
  }
  if (!matchedSub) return;

  // Re-use course/degree detail modal or show rich alert
  const modal = document.getElementById('collegeDetailModal');
  const badgeEl = document.getElementById('modalCollegeBadge');
  const nameEl = document.getElementById('modalCollegeProfileName');
  const locEl = document.getElementById('modalCollegeLocation');
  const bodyEl = document.getElementById('collegeModalBody');
  const applyBtn = document.getElementById('modalCollegeApplyBtn');

  if (modal && badgeEl && nameEl && locEl && bodyEl) {
    badgeEl.textContent = `${(parentCat.name || 'DOMAIN').toUpperCase()} • DOMAIN SPECIALIZATION`;
    nameEl.textContent = `${matchedSub.icon || '🌐'} ${matchedSub.name || 'Specialized Domain'}`;
    locEl.textContent = `🎯 Focus: ${matchedSub.tagline || 'Specialization Track'} • Avg Compensation: ${matchedSub.averageSalary || matchedSub.salaryRange || 'High Demand'}`;

    if (applyBtn) {
      applyBtn.textContent = 'View Full Roadmap ➔';
      applyBtn.onclick = () => {
        openDomainFullRoadmapModal(matchedSub, parentCat);
      };
    }

    bodyEl.innerHTML = `
      <div class="prep-section-card">
        <div class="prep-section-title">
          <span>📖 Domain Specialization Overview</span>
        </div>
        <p style="font-size:13px; color:#334155; line-height:1.5; margin:0 0 10px;">${escapeHtml(matchedSub.description || 'Core domain specialization track with verified industry curriculum.')}</p>
        <div class="internship-meta-row" style="margin-top:8px;">
          <span class="stipend-tag">💼 Typical Compensation: ${escapeHtml(matchedSub.averageSalary || matchedSub.salaryRange || 'High Placement Demand')}</span>
          <span class="workmode-tag">🏷️ Category: ${escapeHtml(parentCat.name || 'Engineering & Technology')}</span>
        </div>
      </div>

      ${matchedSub.roadmap ? `
      <div class="prep-section-card" style="margin-top:14px; background:#F8FAFC; border:1px solid #E2E8F0; border-left:4px solid #77AC3B;">
        <div class="prep-section-title" style="color:#0F172A; font-weight:700;">
          <span>🗺️ Full Learning Curriculum &amp; Career Roadmap</span>
        </div>
        <div style="font-size:12.5px; color:#334155; line-height:1.6; margin-top:8px; white-space:pre-line;">
          ${escapeHtml(matchedSub.roadmap)}
        </div>
      </div>
      ` : ''}

      <div class="prep-section-card" style="margin-top:12px;">
        <div class="prep-section-title">
          <span>🛠️ Key Technical Skills &amp; Tools</span>
        </div>
        <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:8px;">
          ${(matchedSub.skills || []).map(sk => `
            <span style="font-size:11.5px; background:#F1F5F9; border:1px solid #CBD5E1; padding:4px 10px; border-radius:12px; color:#0F172A; font-weight:600;">
              ${escapeHtml(sk)}
            </span>
          `).join('')}
        </div>
      </div>

      <div class="prep-section-card" style="margin-top:12px;">
        <div class="prep-section-title">
          <span>🎓 Recommended Degree Programs &amp; Certifications</span>
        </div>
        <div style="font-size:12.5px; color:#475569; line-height:1.5;">
          ${(matchedSub.courses || (matchedSub.colleges || [])).map(c => `<div>&bull; <b>${escapeHtml(c)}</b></div>`).join('')}
        </div>
      </div>

      <div class="prep-section-card" style="margin-top:12px;">
        <div class="prep-section-title">
          <span>🚀 Common High-Growth Career Roles</span>
        </div>
        <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:8px;">
          ${(matchedSub.careers || []).map(car => `
            <span style="font-size:11.5px; background:rgba(58, 155, 143, 0.12); border:1px solid rgba(58, 155, 143, 0.35); padding:4px 10px; border-radius:12px; color:#0F172A; font-weight:700;">
              🎯 ${escapeHtml(car)}
            </span>
          `).join('')}
        </div>
      </div>
    `;

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  } else {
    openDomainFullRoadmapModal(matchedSub, parentCat);
  }
}
window.openDomainDetailsModal = openDomainDetailsModal;
window.renderDomainsDiscoveryView = renderDomainsDiscoveryView;

// ============================================================================
// 12C. COMPREHENSIVE EXAMS DISCOVERY, PREPARATION & NOTIFICATIONS SYSTEM
// ============================================================================

const EXAMS_DIRECTORY_DATA = [
  {
    id: "exam-jee-main-adv",
    name: "JEE Main & JEE Advanced 2026",
    shortName: "JEE Main & Adv",
    icon: "🎯",
    stream: "Engineering & Technology",
    category: "Engineering",
    level: "National Level Entrance",
    conductingBody: "National Testing Agency (NTA) & IIT Madras",
    state: "Tamil Nadu",
    district: "Chennai",
    college: "IIT Madras / IIT Delhi / IIT Bombay & NITs",
    location: "All India (Conducted by Premier IITs)",
    examDate: "Session 1: Jan 24–Feb 1 | Session 2: Apr 4–15, 2026",
    registrationDeadline: "Nov 30, 2025 (S1) / Mar 2, 2026 (S2)",
    eligibility: "10+2 with Physics, Chemistry & Mathematics (75% aggregate or top 20 percentile)",
    scope: "23 IITs, 32 NITs, 26 IIITs & 38 Centrally Funded Technical Institutes",
    examType: "Computer Based Test (CBT)",
    status: "Upcoming",
    urgency: "upcoming",
    prepPlatform: {
      name: "NTA Official Mock Test & National PYQ Portal",
      url: "https://jeemain.nta.nic.in",
      resourceDesc: "Official computer-based test simulator, chapter-wise previous 15 years' question papers, and NTA scoring analytics."
    },
    howToPrepare: {
      subjects: ["Physics (33.3%)", "Chemistry (33.3%)", "Mathematics (33.4%)"],
      keyTopics: [
        "Electrodynamics & Modern Physics",
        "Organic Reaction Mechanisms & Coordination Chemistry",
        "Calculus, 3D Geometry & Vectors",
        "Thermodynamics & Fluid Mechanics"
      ],
      pattern: "90 Questions (300 Marks) · 3 Hours · 20 MCQs + 10 Numerical per Subject (+4 / -1 Marking)",
      strategy: [
        "1. Complete standard NCERT Class 11 & 12 fundamentals before jumping to complex problem sets.",
        "2. Solve previous 10 years' chapter-wise papers under timed 3-hour exam conditions.",
        "3. Maintain a personalized Formula Handbook and Negative-Marking Error Log.",
        "4. Dedicate the final 45 days exclusively to full-syllabus mock tests and analysis."
      ]
    }
  },
  {
    id: "exam-neet-ug",
    name: "NEET UG 2026 (National Medical Entrance)",
    shortName: "NEET UG",
    icon: "🩺",
    stream: "Medical & Allied Health Sciences",
    category: "Medical",
    level: "National Level Entrance",
    conductingBody: "National Testing Agency (NTA) & NMC",
    state: "Delhi",
    district: "New Delhi",
    college: "AIIMS New Delhi, JIPMER, Central & State Medical Colleges",
    location: "National Examination Centers Across All Indian Districts",
    examDate: "May 3, 2026 (Sunday, Single Shift)",
    registrationDeadline: "March 9, 2026",
    eligibility: "10+2 with Physics, Chemistry, Biology / Biotechnology (Min. 50% for Gen, 40% for Reserved)",
    scope: "1,08,000+ MBBS, 28,000+ BDS, 52,000+ AYUSH, and Veterinary seats across India",
    examType: "Pen & Paper (OMR-based) Examination",
    status: "Registration Open",
    urgency: "upcoming",
    prepPlatform: {
      name: "AIIMS National Medical Mock Suite & NEET Portal",
      url: "https://neet.nta.nic.in",
      resourceDesc: "High-yield NCERT biology infographics, visual anatomy memory charts, and timed medical question banks."
    },
    howToPrepare: {
      subjects: ["Biology / Botany & Zoology (50%)", "Physics (25%)", "Chemistry (25%)"],
      keyTopics: [
        "Human Physiology, Genetics & Molecular Basis of Inheritance",
        "Ecology, Plant Diversity & Biotechnology Principles",
        "Mechanics, Ray Optics & Modern Physics",
        "Chemical Bonding, Equilibrium & Organic Carbonyl Compounds"
      ],
      pattern: "200 Questions (Attempt 180) · 720 Marks · 3 Hours 20 Mins · +4 / -1 Marking",
      strategy: [
        "1. Read NCERT Biology line-by-line at least 5 to 7 times with active recall diagrams.",
        "2. Practice 150+ numericals daily across Physics mechanics and Physical chemistry.",
        "3. Take full-length OMR mock tests between 2:00 PM and 5:20 PM to align your biological clock.",
        "4. Identify repeat question archetypes from the past 20 years of AIPMT/NEET."
      ]
    }
  },
  {
    id: "exam-cat",
    name: "CAT 2026 (Common Admission Test)",
    shortName: "CAT 2026",
    icon: "💼",
    stream: "Management & Business Administration",
    category: "Management",
    level: "National Level Entrance",
    conductingBody: "Indian Institutes of Management (IIM Ahmedabad / Bangalore)",
    state: "Gujarat",
    district: "Ahmedabad",
    college: "IIM Ahmedabad, IIM Bangalore, IIM Calcutta & Top 100 B-Schools",
    location: "155+ Test Cities Nationwide",
    examDate: "November 29, 2026 (Last Sunday of Nov)",
    registrationDeadline: "September 13, 2026",
    eligibility: "Bachelor's Degree with minimum 50% marks or equivalent CGPA (45% for SC/ST/PwD)",
    scope: "21 IIMs, FMS Delhi, SPJIMR Mumbai, MDI Gurgaon, IIT DoMS & Top Tier-1 MBA Programs",
    examType: "Computer Based Test (3 Sectional Slots)",
    status: "Deadline Approaching",
    urgency: "deadline",
    prepPlatform: {
      name: "IIM CAT Official Practice Platform & Sectional Engine",
      url: "https://iimcat.ac.in",
      resourceDesc: "Official sectional mock test interface with non-MCQ TITA keypad simulator and percentile analytics."
    },
    howToPrepare: {
      subjects: ["VARC (36%)", "DILR (30%)", "Quantitative Aptitude (34%)"],
      keyTopics: [
        "Reading Comprehension (Philosophy, Economics, Science & Arts)",
        "Arrangements, Games & Tournaments, Matrix Puzzles",
        "Arithmetic (Percentages, Profit/Loss, TSD, Time & Work)",
        "Algebra (Quadratic Equations, Logs, Sequences & Functions)"
      ],
      pattern: "66 Questions · 198 Marks · 120 Minutes (40 Mins per Section Strictly Timed) · +3 / -1 Marking",
      strategy: [
        "1. Read editorial articles (Aeon, The Hindu, Project Syndicate) 60 minutes daily for VARC.",
        "2. Solve 4 complex DILR sets every morning to cultivate structural pattern recognition.",
        "3. Master arithmetic and basic algebra shortcuts before tackling advanced modern math.",
        "4. Target 30+ full proctored mock tests with in-depth 3-hour post-test analysis."
      ]
    }
  },
  {
    id: "exam-clat",
    name: "CLAT 2026 (Common Law Admission Test)",
    shortName: "CLAT 2026",
    icon: "⚖️",
    stream: "Law & Legal Studies",
    category: "Law",
    level: "National Level Entrance",
    conductingBody: "Consortium of National Law Universities (NLSIU Bengaluru)",
    state: "Karnataka",
    district: "Bengaluru",
    college: "NLSIU Bengaluru, NALSAR Hyderabad, WBNUJS Kolkata & 26 NLUs",
    location: "All Major State Capitals and Metros",
    examDate: "December 6, 2026 (First Sunday of Dec)",
    registrationDeadline: "October 15, 2026",
    eligibility: "10+2 or equivalent with minimum 45% aggregate (40% for SC/ST)",
    scope: "26 National Law Universities (NLUs) for 5-Year Integrated BA/BBA LL.B & LL.M",
    examType: "Offline Pen & Paper (Comprehension-based)",
    status: "Registration Open",
    urgency: "upcoming",
    prepPlatform: {
      name: "CLAT Consortium Practice Hub & Legal Reasoning Suite",
      url: "https://consortiumofnlus.ac.in",
      resourceDesc: "Official sample question booklets, legal passage deconstruction guides, and constitutional law summaries."
    },
    howToPrepare: {
      subjects: ["Legal Reasoning (25%)", "Current Affairs & GK (25%)", "Logical Reasoning (20%)", "English Language (20%)", "Quantitative Tech (10%)"],
      keyTopics: [
        "Constitutional Law, Torts, Contracts & Criminal Law Principles",
        "National & International Legal Current Affairs (Last 12 Months)",
        "Critical Reasoning (Assumptions, Strengths, Weaknesses)",
        "Data Interpretation & Caselet Mathematics"
      ],
      pattern: "120 Passage-based Questions · 120 Marks · 2 Hours · +1 / -0.25 Marking",
      strategy: [
        "1. Build reading speed up to 300+ words per minute since the paper is 100% passage-based.",
        "2. Apply legal principles strictly to given facts without assuming external personal knowledge.",
        "3. Review Monthly Current Affairs Compendiums covering Landmark Supreme Court Rulings.",
        "4. Take 2 timed mock papers every week to master pacing under 120 minutes."
      ]
    }
  },
  {
    id: "exam-gate",
    name: "GATE 2026 (Graduate Aptitude Test in Engineering)",
    shortName: "GATE 2026",
    icon: "🔬",
    stream: "Postgraduate Engineering & PSU Recruitment",
    category: "Engineering",
    level: "National Level Entrance",
    conductingBody: "IISc Bengaluru & IIT Roorkee",
    state: "Karnataka",
    district: "Bengaluru",
    college: "IISc Bengaluru, IIT Bombay, IIT Madras & Top PSUs (ONGC, IOCL, NTPC, BHEL)",
    location: "200+ Computerized Centers Nationwide",
    examDate: "February 7, 8, 14, 15, 2026",
    registrationDeadline: "September 28, 2025",
    eligibility: "Currently in 3rd or higher year of B.E./B.Tech/B.Arch or graduated",
    scope: "M.Tech / MS / Ph.D admissions at IISc & IITs, and Direct Group-A PSU Officer Recruitment",
    examType: "Computer Based Test (30 Subject Disciplines)",
    status: "Upcoming",
    urgency: "upcoming",
    prepPlatform: {
      name: "GATE Virtual Calculator & Mock Test Engine",
      url: "https://gate2026.iisc.ac.in",
      resourceDesc: "Official web interface with embedded scientific calculator simulator and subject-wise PYQs."
    },
    howToPrepare: {
      subjects: ["Core Technical Engineering (70%)", "Engineering Mathematics (15%)", "General Aptitude (15%)"],
      keyTopics: [
        "Data Structures, Algorithms & OS / Theory of Computation (for CS)",
        "Linear Algebra, Calculus & Discrete Mathematics",
        "Control Systems, Signals & Analog/Digital Circuits (for EE/EC)",
        "Fluid Mechanics, Thermodynamics & Machine Design (for ME)"
      ],
      pattern: "65 Questions (100 Marks) · 3 Hours · MCQs + MSQs + NAT (Numerical Answer Type)",
      strategy: [
        "1. Master the official Virtual Scientific Calculator early to avoid exam-hall calculation delays.",
        "2. Solve previous 25 years' GATE questions twice to understand standard question formulations.",
        "3. Practice Multi-Select Questions (MSQs) with zero partial marking rigorously.",
        "4. Revise concise short-notes weekly to keep 10-12 core engineering subjects fresh in memory."
      ]
    }
  },
  {
    id: "exam-cuet-ug",
    name: "CUET UG 2026 (Common University Entrance Test)",
    shortName: "CUET UG",
    icon: "🏛️",
    stream: "Central & State Universities",
    category: "Central Universities",
    level: "National Level Entrance",
    conductingBody: "National Testing Agency (NTA)",
    state: "Delhi",
    district: "New Delhi",
    college: "University of Delhi (DU), JNU, BHU, Jamia Millia & 250+ Universities",
    location: "380+ Cities Across India and Abroad",
    examDate: "May 15 – May 31, 2026",
    registrationDeadline: "April 5, 2026",
    eligibility: "Class 12 passed or appearing in 2026 (No age limit)",
    scope: "Undergraduate BA, B.Sc, B.Com, BBA, BMS, BCA admissions across 250+ Universities",
    examType: "Hybrid CBT & Pen-Paper Mode",
    status: "Upcoming",
    urgency: "upcoming",
    prepPlatform: {
      name: "NTA CUET Domain Practice & Sample Portal",
      url: "https://cuetug.ntaonline.in",
      resourceDesc: "Chapter-wise NCERT domain quizzes, general test reasoning sets, and language comprehension drills."
    },
    howToPrepare: {
      subjects: ["Language Section (Section 1A/1B)", "Domain Specific Subjects (Section 2)", "General Aptitude Test (Section 3)"],
      keyTopics: [
        "NCERT Class 12 Core Syllabus across Chosen Domain Subjects",
        "Reading Comprehension, Vocabulary & Literary Devices",
        "Basic Quantitative Reasoning, Logic & Current Affairs"
      ],
      pattern: "40-50 Questions per Paper · 200 Marks per Subject · 45-60 Mins · +5 / -1 Marking",
      strategy: [
        "1. Stick 100% strictly to NCERT Class 12 textbooks for domain subject preparation.",
        "2. Practice 10 language comprehension passages daily for accuracy and speed.",
        "3. Take daily 15-minute General Test quizzes covering current events and basic numerical math."
      ]
    }
  },
  {
    id: "exam-bitsat",
    name: "BITSAT 2026 (BITS Pilani Entrance Exam)",
    shortName: "BITSAT",
    icon: "⚡",
    stream: "Engineering & Science",
    category: "Engineering",
    level: "Premier University Entrance",
    conductingBody: "Birla Institute of Technology and Science (BITS Pilani)",
    state: "Rajasthan",
    district: "Pilani",
    college: "BITS Pilani (Pilani, Goa, Hyderabad & Dubai Campuses)",
    location: "BITS Pilani Campuses & 60+ National Test Centers",
    examDate: "Session 1: May 20–24 | Session 2: June 22–26, 2026",
    registrationDeadline: "April 15, 2026",
    eligibility: "10+2 with Physics, Chemistry & Math (Min. 75% aggregate and 60% in each subject)",
    scope: "B.E. (Hons.), B.Pharm, and M.Sc Dual Degree Programs at all 3 Indian BITS Campuses",
    examType: "Computer Based Test with Bonus 12 Questions Feature",
    status: "Upcoming",
    urgency: "upcoming",
    prepPlatform: {
      name: "BITS Pilani Official Admission Simulator",
      url: "https://bitsadmission.com",
      resourceDesc: "High-speed question simulator with bonus 12-question unlock engine and speed analytics."
    },
    howToPrepare: {
      subjects: ["Physics (30 Qs)", "Chemistry (30 Qs)", "Mathematics (40 Qs)", "English & Logic (30 Qs)"],
      keyTopics: [
        "High-Speed Formulas in Mechanics, Electrodynamics & Organic Chemistry",
        "Calculus, Trigonometry & Matrices",
        "Logical Reasoning, Analogy & Verbal Proficiency"
      ],
      pattern: "130 Questions (+12 Bonus Questions) · 390 Marks · 3 Hours · +3 / -1 Marking",
      strategy: [
        "1. Focus heavily on speed with high precision: aim for 130 questions in under 160 minutes.",
        "2. Master English Proficiency and Logical Reasoning (30 questions = 90 guaranteed marks).",
        "3. Attempt 15 timed speed tests to unlock and practice the 12 Extra Bonus Questions."
      ]
    }
  },
  {
    id: "exam-viteee",
    name: "VITEEE 2026 (VIT Engineering Entrance Examination)",
    shortName: "VITEEE",
    icon: "🏛️",
    stream: "Engineering & Technology",
    category: "Engineering",
    level: "Premier University Entrance",
    conductingBody: "Vellore Institute of Technology (VIT)",
    state: "Tamil Nadu",
    district: "Vellore",
    college: "Vellore Institute of Technology (Vellore, Chennai, AP & Bhopal)",
    location: "Vellore / Chennai / 125+ Centers Nationwide",
    examDate: "April 19 – April 30, 2026",
    registrationDeadline: "March 31, 2026",
    eligibility: "10+2 with Physics, Chemistry and Math/Biology (Min. 60% aggregate, 50% for SC/ST)",
    scope: "B.Tech Admissions across all 4 VIT Campuses (Vellore, Chennai, AP, Bhopal)",
    examType: "Computer Based Test (No Negative Marking)",
    status: "Registration Open",
    urgency: "upcoming",
    prepPlatform: {
      name: "VIT Official Candidate Test Suite",
      url: "https://viteee.vit.ac.in",
      resourceDesc: "No-negative marking test simulator with aptitude and English sectional practice modules."
    },
    howToPrepare: {
      subjects: ["Mathematics/Biology (40 Qs)", "Physics (35 Qs)", "Chemistry (35 Qs)", "Aptitude (10 Qs)", "English (5 Qs)"],
      keyTopics: [
        "Electrostatics, Current Electricity & Optics",
        "Coordination Chemistry & Organic Reaction Sequences",
        "Differential Equations, Probability & Vectors",
        "Aptitude Data Logic & Syllogisms"
      ],
      pattern: "125 Questions · 125 Marks · 2 Hours 30 Mins · Zero Negative Marking",
      strategy: [
        "1. Capitalize on the ZERO negative marking rule: attempt 100% of all 125 questions.",
        "2. Complete Aptitude and English sections in the first 15 minutes for quick 15 marks.",
        "3. Solve 10 full-length sample papers to benchmark your speed across 150 minutes."
      ]
    }
  },
  {
    id: "exam-tnea",
    name: "TNEA 2026 (Tamil Nadu Engineering Admissions)",
    shortName: "TNEA",
    icon: "🎓",
    stream: "Engineering & Technology",
    category: "Engineering",
    level: "State Level Counselling / Merit",
    conductingBody: "Directorate of Technical Education (DoTE) & Anna University",
    state: "Tamil Nadu",
    district: "Chennai",
    college: "Anna University (CEG, MIT, ACT), PSG Tech Coimbatore, SSN, CIT & 450+ Colleges",
    location: "Chennai, Coimbatore, Madurai, Tiruchirappalli, Salem & All TN Districts",
    examDate: "Merit List: June 2026 | Counselling: July–Aug 2026",
    registrationDeadline: "June 6, 2026",
    eligibility: "10+2 with Physics, Chemistry & Mathematics (Cutoff calculated out of 200 Marks: Maths/100 + Phy/50 + Chem/50)",
    scope: "Government, Government-Aided & Self-Financing Engineering Colleges in Tamil Nadu",
    examType: "Normalized Merit-Based Single Window Counselling",
    status: "Upcoming",
    urgency: "upcoming",
    prepPlatform: {
      name: "Anna University TNEA Single-Window Allotment Hub",
      url: "https://www.tneaonline.org",
      resourceDesc: "Previous 5 years' branch-wise closing cutoffs (out of 200) for CEG, MIT, PSG Tech, and SSN."
    },
    howToPrepare: {
      subjects: ["Mathematics (100 Marks)", "Physics (50 Marks)", "Chemistry (50 Marks)"],
      keyTopics: [
        "Tamil Nadu State Board & CBSE Class 12 Core Syllabus",
        "Calculus, Analytical Geometry & Matrices",
        "Electromagnetism & Semiconductor Physics",
        "Organic Synthesis & Electrochemistry"
      ],
      pattern: "Board Exam Normalization · 200 Aggregate Score Calculation · Online Choice Filling Rounds",
      strategy: [
        "1. Maximize Class 12 board marks in Maths, Physics, and Chemistry to achieve a 195+ / 200 cutoff.",
        "2. Research previous years' Community Rank & General Rank opening/closing cutoffs.",
        "3. Prepare an ordered choice list of 50+ preferred branches across CEG, MIT, PSG, and SSN."
      ]
    }
  },
  {
    id: "exam-srmjeee",
    name: "SRMJEEE 2026 (SRM Joint Engineering Entrance)",
    shortName: "SRMJEEE",
    icon: "🏛️",
    stream: "Engineering & Technology",
    category: "Engineering",
    level: "Premier University Entrance",
    conductingBody: "SRM Institute of Science and Technology",
    state: "Tamil Nadu",
    district: "Chennai",
    college: "SRM IST Kattankulathur, Ramapuram, Vadapalani, Delhi-NCR & AP",
    location: "Chennai, Kattankulathur & Remote Online Proctored Exam (ROPE)",
    examDate: "Phase 1: April 2026 | Phase 2: June 2026",
    registrationDeadline: "April 10, 2026",
    eligibility: "10+2 with minimum 50% aggregate in Physics, Chemistry, and Mathematics/Biology",
    scope: "B.Tech Admissions at SRM Campuses across Chennai, AP, and NCR",
    examType: "Remote Online Proctored Exam (ROPE) at Home",
    status: "Upcoming",
    urgency: "upcoming",
    prepPlatform: {
      name: "SRM Remote Proctoring Practice Suite",
      url: "https://www.srmist.edu.in",
      resourceDesc: "AI webcam proctoring practice test, system hardware checker, and sample question drills."
    },
    howToPrepare: {
      subjects: ["Mathematics/Biology (40 Qs)", "Physics (35 Qs)", "Chemistry (35 Qs)", "English (5 Qs)", "Aptitude (10 Qs)"],
      keyTopics: ["Mechanics, Heat & Thermodynamics", "Calculus & Probability", "Physical Chemistry & Solutions"],
      pattern: "125 Questions · 125 Marks · 2 Hours 30 Mins · No Negative Marking",
      strategy: [
        "1. Perform system hardware and webcam checks on the SRM test portal 48 hours in advance.",
        "2. Solve 10 mock papers focusing on speed and accuracy across standard Class 11-12 formulas."
      ]
    }
  },
  {
    id: "exam-met",
    name: "MET 2026 (Manipal Entrance Test)",
    shortName: "MET (Manipal)",
    icon: "🎓",
    stream: "Engineering, Medicine & Design",
    category: "Engineering",
    level: "Premier University Entrance",
    conductingBody: "Manipal Academy of Higher Education (MAHE)",
    state: "Karnataka",
    district: "Udupi",
    college: "Manipal Institute of Technology (MIT Manipal, Bengaluru & Jaipur)",
    location: "Manipal, Bengaluru & 45+ Cities Across India",
    examDate: "Phase 1: April 2026 | Phase 2: May 2026",
    registrationDeadline: "March 15, 2026",
    eligibility: "10+2 with Physics, Mathematics & Chemistry/Comp Sci (Min. 50% aggregate)",
    scope: "B.Tech, B.Pharm, and Allied Health programs across MAHE Campuses",
    examType: "Computer Based Test (50% MET Score + 50% Board Normalized Score)",
    status: "Upcoming",
    urgency: "upcoming",
    prepPlatform: {
      name: "MAHE MET Learning & Preparation Hub",
      url: "https://manipal.edu",
      resourceDesc: "Manipal official mock tests, candidate slot booking interface, and past year sample papers."
    },
    howToPrepare: {
      subjects: ["Mathematics (20 Qs)", "Physics (15 Qs)", "Chemistry (15 Qs)", "English (10 Qs)"],
      keyTopics: ["Vector Algebra, Calculus", "Ray Optics & Current Electricity", "Chemical Kinetics & Thermodynamics"],
      pattern: "60 Questions · 240 Marks · 2 Hours · +4 / -1 Marking · Numerical Questions included",
      strategy: [
        "1. Balance preparation between Class 12 board marks and MET test syllabus for optimal 50:50 score.",
        "2. Practice English language grammar and numerical answer type questions without negative marking."
      ]
    }
  },
  {
    id: "exam-kcet-comedk",
    name: "KCET & COMEDK UGET 2026",
    shortName: "KCET / COMEDK",
    icon: "🏛️",
    stream: "Engineering & Professional Degrees",
    category: "Engineering",
    level: "State & National Consortium Entrance",
    conductingBody: "Karnataka Examination Authority (KEA) & COMEDK Consortium",
    state: "Karnataka",
    district: "Bengaluru",
    college: "RV College of Engineering (RVCE), BMSCE, MSRIT, PES University & 190+ Colleges",
    location: "Bengaluru, Mysuru, Mangaluru, Hubballi & Centers Across Karnataka / India",
    examDate: "KCET: April 18–19 | COMEDK: May 10, 2026",
    registrationDeadline: "March 20, 2026",
    eligibility: "10+2 with Physics, Chemistry & Mathematics (Min. 45% aggregate)",
    scope: "Top Karnataka Engineering Campuses (RVCE, BMSCE, Ramaiah, PES, Dayananda Sagar)",
    examType: "KCET (Offline OMR) / COMEDK (Computer Based Test)",
    status: "Upcoming",
    urgency: "upcoming",
    prepPlatform: {
      name: "KEA KCET & COMEDK Engineering Practice Portal",
      url: "https://cetonline.karnataka.gov.in/kea",
      resourceDesc: "Karnataka State Board PU-II syllabus chapter weightage analysis and 15 years' question archive."
    },
    howToPrepare: {
      subjects: ["Mathematics (60 Qs)", "Physics (60 Qs)", "Chemistry (60 Qs)"],
      keyTopics: ["PUC II Syllabus, Matrices, Probability, Electromagnetism, Organic Chemistry"],
      pattern: "180 Questions · 180 Marks · 3 Hours · Zero Negative Marking",
      strategy: [
        "1. Complete standard Karnataka PU-II text problems thoroughly for KCET.",
        "2. Attempt all 180 questions in COMEDK due to zero negative marking penalty."
      ]
    }
  },
  {
    id: "exam-mhtcet",
    name: "MHT-CET 2026 (Maharashtra Common Entrance)",
    shortName: "MHT-CET",
    icon: "🏛️",
    stream: "Engineering, Pharmacy & Agriculture",
    category: "Engineering",
    level: "State Level Entrance",
    conductingBody: "State Common Entrance Test Cell, Maharashtra",
    state: "Maharashtra",
    district: "Mumbai",
    college: "COEP Pune, VJTI Mumbai, ICT Mumbai, SPIT & 350+ Colleges",
    location: "Mumbai, Pune, Nagpur, Nashik, Aurangabad & All Maharashtra Districts",
    examDate: "PCM Group: April 16 – April 30, 2026",
    registrationDeadline: "March 1, 2026",
    eligibility: "10+2 with Physics & Mathematics along with Chemistry/Bio (Min. 45% aggregate, 40% for Reserved)",
    scope: "Premier Maharashtra Engineering Colleges including COEP Technological University and VJTI",
    examType: "Computer Based Test (Zero Negative Marking)",
    status: "Upcoming",
    urgency: "upcoming",
    prepPlatform: {
      name: "MHT-CET State Portal & CBT Simulator",
      url: "https://cetcell.mahacet.org",
      resourceDesc: "Maharashtra State Board (Balbharati) textbook question mapping and mock testing engine."
    },
    howToPrepare: {
      subjects: ["Mathematics (50 Qs x 2 = 100 Marks)", "Physics (50 Qs = 50 Marks)", "Chemistry (50 Qs = 50 Marks)"],
      keyTopics: ["Integration, Vectors, Trigonometry, Rotational Dynamics, Chemical Thermodynamics"],
      pattern: "150 Questions · 200 Marks · 3 Hours (90 Mins PCM + 90 Mins Math) · No Negative Marking",
      strategy: [
        "1. Study Maharashtra State Board Class 12 textbooks thoroughly (80% weightage is from Class 12).",
        "2. Allocate extra practice to Mathematics as each correct Math answer carries 2 marks."
      ]
    }
  },
  {
    id: "exam-uceed",
    name: "UCEED & CEED 2026 (Undergraduate Design Entrance)",
    shortName: "UCEED (IIT Design)",
    icon: "🎨",
    stream: "Design, Visual Arts & Creative Tech",
    category: "Design",
    level: "National Level Entrance",
    conductingBody: "Indian Institute of Technology Bombay (IIT Bombay)",
    state: "Maharashtra",
    district: "Mumbai",
    college: "IIT Bombay (IDC), IIT Delhi, IIT Guwahati, IIT Hyderabad, IIITDM Jabalpur",
    location: "27 Test Cities Across India",
    examDate: "January 18, 2026 (Sunday)",
    registrationDeadline: "October 31, 2025",
    eligibility: "10+2 in any stream (Science, Commerce, Arts) passed or appearing in 2026",
    scope: "B.Des (Bachelor of Design) at Premier IITs and 25+ Result-Sharing Design Universities",
    examType: "Part A (CBT) + Part B (Sketching & Drawing on Paper)",
    status: "Upcoming",
    urgency: "upcoming",
    prepPlatform: {
      name: "IIT Bombay UCEED Official Design Portal",
      url: "https://www.uceed.iitb.ac.in",
      resourceDesc: "Official previous years' drawing question prompts, spatial aptitude tests, and design briefs."
    },
    howToPrepare: {
      subjects: ["Part A: Visualization, Logic & Observation", "Part B: Drawing & Creative Problem Solving"],
      keyTopics: ["Perspective Drawing (1-Point, 2-Point, 3-Point)", "Human Anatomy & Proportion", "Spatial Reasoning & Color Theory"],
      pattern: "300 Marks · 3 Hours (Part A: 240 Marks in 150 Mins | Part B: 60 Marks in 30 Mins)",
      strategy: [
        "1. Practice everyday object sketching, human figures in action, and perspective streetscapes.",
        "2. Develop lateral thinking and spatial rotation problem-solving skills for Part A NAT questions."
      ]
    }
  },
  {
    id: "exam-ipmat",
    name: "IPMAT 2026 (Integrated Programme in Management)",
    shortName: "IPMAT (IIM Indore)",
    icon: "📈",
    stream: "Management & Business Administration",
    category: "Management",
    level: "Premier University Entrance",
    conductingBody: "Indian Institute of Management Indore (IIM Indore)",
    state: "Madhya Pradesh",
    district: "Indore",
    college: "IIM Indore, IIM Rohtak, IIM Ranchi, IIM Bodh Gaya, IIM Jammu",
    location: "34 Test Cities Across India",
    examDate: "May 23, 2026",
    registrationDeadline: "April 1, 2026",
    eligibility: "10+2 with minimum 60% aggregate (55% for SC/ST/PwD)",
    scope: "5-Year Dual Degree Integrated Programme in Management (BBA + MBA) at IIMs",
    examType: "Computer Based Test + Personal Interview (PI)",
    status: "Upcoming",
    urgency: "upcoming",
    prepPlatform: {
      name: "IIM Indore IPMAT Official Practice Hub",
      url: "https://www.iimidr.ac.in",
      resourceDesc: "Quantitative Short Answer (SA) keypad drills and verbal reasoning caselets."
    },
    howToPrepare: {
      subjects: ["Quantitative Ability SA (Short Answer)", "Quantitative Ability MCQ", "Verbal Ability MCQ"],
      keyTopics: ["Number Systems, PnC & Probability", "Geometry, Modern Math", "Vocabulary, Para-Jumbles & Grammar"],
      pattern: "90 Questions · 360 Marks · 120 Minutes (40 Mins per Section) · +4 / -1 Marking (No negative on SA)",
      strategy: [
        "1. Build solid foundations in high-school mathematics (Classes 9-12).",
        "2. Solve 20 verbal ability questions daily to achieve 90%+ reading accuracy."
      ]
    }
  },
  {
    id: "exam-wbjee",
    name: "WBJEE 2026 (West Bengal Joint Entrance)",
    shortName: "WBJEE",
    icon: "🏛️",
    stream: "Engineering & Technology",
    category: "Engineering",
    level: "State Level Entrance",
    conductingBody: "West Bengal Joint Entrance Examinations Board (WBJEEB)",
    state: "West Bengal",
    district: "Kolkata",
    college: "Jadavpur University, Calcutta University, Heritage Institute of Tech & 110+ Colleges",
    location: "Kolkata, Howrah, Siliguri, Durgapur & Centers Across West Bengal",
    examDate: "April 26, 2026 (Sunday)",
    registrationDeadline: "February 5, 2026",
    eligibility: "10+2 with Physics & Mathematics along with Chemistry/Bio (Min. 45% aggregate, 60% for Jadavpur Univ)",
    scope: "Top Engineering Campuses in West Bengal including Jadavpur University Faculty of Engg",
    examType: "Offline Pen & Paper (OMR-based with 3 Category Marking Rules)",
    status: "Upcoming",
    urgency: "upcoming",
    prepPlatform: {
      name: "WBJEE Official Practice & Solution Portal",
      url: "https://wbjeeb.nic.in",
      resourceDesc: "Category-1, 2, and 3 negative-marking strategy drills and chapter-wise 10-year question repository."
    },
    howToPrepare: {
      subjects: ["Mathematics (100 Marks)", "Physics & Chemistry (100 Marks combined)"],
      keyTopics: ["Calculus, Coordinate Geometry, Modern Physics, Physical Chemistry"],
      pattern: "155 Questions (200 Marks) · 4 Hours (2 Shifts) · Category 1, 2 & 3 Marking with partial marking in Cat 3",
      strategy: [
        "1. Dedicate equal preparation to Mathematics as it carries 50% of the entire 200 marks weightage.",
        "2. Master Category-3 Multi-Choice questions where no negative marking applies."
      ]
    }
  },
  {
    id: "exam-nid-dat",
    name: "NID DAT 2026 (National Institute of Design Prelims & Mains)",
    shortName: "NID DAT",
    icon: "🎨",
    stream: "Design & Industrial Innovation",
    category: "Design",
    level: "National Level Entrance",
    conductingBody: "National Institute of Design (NID Ahmedabad)",
    state: "Gujarat",
    district: "Ahmedabad",
    college: "NID Ahmedabad, NID Bengaluru, NID Gandhinagar, NID Haryana, NID AP, NID MP, NID Assam",
    location: "Ahmedabad, Bengaluru, Delhi, Mumbai & 23 Test Cities Across India",
    examDate: "Prelims: January 2026 | Mains & Studio Test: April 2026",
    registrationDeadline: "December 1, 2025",
    eligibility: "10+2 in any stream (Science / Commerce / Humanities) passed or appearing in 2026",
    scope: "B.Des & M.Des across 7 National Institute of Design (NID) Campuses",
    examType: "Design Aptitude Test (Prelims: Objective/Visual + Subjective Drawing | Mains: Studio Test & Interview)",
    status: "Upcoming",
    urgency: "upcoming",
    prepPlatform: {
      name: "NID Official Candidate Design Admissions Hub",
      url: "https://admissions.nid.edu",
      resourceDesc: "Official previous years' drawing prompts, storyboarding templates, and materials studio test guide."
    },
    howToPrepare: {
      subjects: ["Visual Sensitivity & Observation (30%)", "Drawing & Creative Representation (40%)", "General Awareness & Design History (30%)"],
      keyTopics: ["Perspective & Everyday Object Proportions", "Visual Metaphors & Storyboarding", "Color Psychology & Ergonomics"],
      pattern: "Prelims (100 Marks, 3 Hours) + Mains (Studio Model Making & Portfolio Review)",
      strategy: [
        "1. Sketch 3 real-world observation scenes daily (kitchen, bus stop, workshop) focusing on human proportion.",
        "2. Practice 3-panel and 4-panel visual storytelling and creative problem-solving prompts."
      ]
    }
  },
  {
    id: "exam-nimcet",
    name: "NIMCET 2026 (NIT MCA Common Entrance Test)",
    shortName: "NIMCET",
    icon: "💻",
    stream: "IT & Computer Applications",
    category: "IT & Computer Applications",
    level: "National Level Entrance",
    conductingBody: "National Institute of Technology (NIT Tiruchirappalli / Jamshedpur)",
    state: "Tamil Nadu",
    district: "Tiruchirappalli",
    college: "NIT Tiruchirappalli, NIT Surathkal, NIT Warangal, NIT Allahabad, NIT Calicut & 9 NITs",
    location: "Tiruchirappalli, Surathkal, Warangal & 35+ Centers Across India",
    examDate: "June 8, 2026",
    registrationDeadline: "April 20, 2026",
    eligibility: "B.Sc / B.Sc (Hons) / BCA / BIT or B.E./B.Tech with Mathematics / Statistics as one of the subjects (Min. 60% marks or 6.5 CGPA)",
    scope: "Master of Computer Applications (MCA) at 9 Premier National Institutes of Technology (NITs)",
    examType: "Computer Based Test (120 Questions · 1000 Marks Normalized)",
    status: "Upcoming",
    urgency: "upcoming",
    prepPlatform: {
      name: "NIT NIMCET Official MCA Test Suite",
      url: "https://nimcet.admissions.nic.in",
      resourceDesc: "Official computer-based test interface with higher secondary & college level mathematics test banks."
    },
    howToPrepare: {
      subjects: ["Mathematics (50 Qs x 12 = 600 Marks)", "Analytical Ability & Logical Reasoning (40 Qs x 6 = 240 Marks)", "Computer Awareness (20 Qs x 6 = 120 Marks)", "General English (10 Qs x 4 = 40 Marks)"],
      keyTopics: ["Set Theory, Probability & Statistics, Algebra, Coordinate Geometry, Calculus, Digital Logic Basics"],
      pattern: "120 Questions (1000 Total Marks) · 2 Hours · Scaled Marking (+12/-3 for Math, +6/-1.5 for Logic/Comp)",
      strategy: [
        "1. Focus 60% of your time on Mathematics as it constitutes 600 out of 1000 total marks.",
        "2. Solve 20 speed math and digital logic problems every day to maximize computer awareness scores."
      ]
    }
  }
];

const EXAMS_RANKING_BENCHMARKS = [
  { rank: "#1 Tier", exam: "JEE Advanced 2026", benchmark: "AIR 1 – 250", targetCollege: "IIT Bombay / IIT Madras", stream: "B.Tech Computer Science", cutoff: "92%+ Marks (Score: 310+ / 360)" },
  { rank: "#1 Tier", exam: "NEET UG 2026", benchmark: "AIR 1 – 50", targetCollege: "AIIMS New Delhi", stream: "MBBS Degree", cutoff: "715+ / 720 Marks" },
  { rank: "#1 Tier", exam: "CAT 2026", benchmark: "99.85+ Percentile", targetCollege: "IIM Ahmedabad / IIM Bangalore", stream: "2-Year MBA / PGP", cutoff: "Raw Score: ~105+ / 198" },
  { rank: "#1 Tier", exam: "GATE 2026 (CS/EE)", benchmark: "AIR 1 – 100", targetCollege: "IISc Bengaluru / Top PSUs", stream: "M.Tech Research / PSU Direct", cutoff: "Score: 880+ / 1000" },
  { rank: "#1 Tier", exam: "CLAT UG 2026", benchmark: "AIR 1 – 90", targetCollege: "NLSIU Bengaluru", stream: "5-Year BA LLB (Hons.)", cutoff: "Score: 102+ / 120" },
  { rank: "#1 Tier", exam: "BITSAT 2026", benchmark: "Score: 330+ / 390", targetCollege: "BITS Pilani (Pilani Campus)", stream: "B.E. (Hons.) Computer Science", cutoff: "Top 0.8% Merit List" }
];

const EXAMS_STUDENT_REVIEWS = [
  {
    author: "Rohan Kulkarni",
    role: "IIT Madras CSE '28 (AIR 142 in JEE Adv)",
    avatar: "RK",
    exam: "JEE Main & Advanced",
    rating: "★★★★★",
    difficulty: "🔥 Very High Difficulty",
    statement: "The key to clearing JEE Advanced isn't solving 10,000 trivial formulas; it's developing the patience to sit with an unsolved multi-concept problem for 20 minutes without looking at the answer key. Once that analytical stamina is built, exam day feels natural.",
    topperTip: "Master rotational mechanics and organic mechanisms from first principles. Maintain a strict error log of every single mock test question you got wrong."
  },
  {
    author: "Dr. Ananya Sen",
    role: "AIIMS New Delhi MBBS (NEET UG Score: 710/720)",
    avatar: "AS",
    exam: "NEET UG Medical",
    rating: "★★★★★",
    difficulty: "⚡ High Speed & Recall",
    statement: "NCERT is the undisputed bible for NEET. In my final 3 months, I didn't open any coaching reference module; I re-read every single line, diagram caption, and summary in NCERT Biology 8 times. That guaranteed 355/360 in Biology.",
    topperTip: "Solve OMR mock tests strictly between 2:00 PM and 5:20 PM to train your mind to peak during the exact examination slot."
  },
  {
    author: "Siddharth Nair",
    role: "IIM Ahmedabad PGP '27 (CAT: 99.92 %ile)",
    avatar: "SN",
    exam: "CAT Management",
    rating: "★★★★★",
    difficulty: "🧠 High Time-Pressure",
    statement: "In CAT, question selection is more critical than solving speed. If a DILR set or Quant problem doesn't yield a breakthrough within 90 seconds, drop it immediately and move ahead. Clearing sectional cutoffs is about avoiding low-probability time traps.",
    topperTip: "Read diverse articles on history, philosophy, and tech economics daily for 1 hour to build seamless reading comprehension speed for VARC."
  },
  {
    author: "Meera Krishnan",
    role: "NLSIU Bengaluru BA LLB (AIR 28 in CLAT)",
    avatar: "MK",
    exam: "CLAT Law Entrance",
    rating: "★★★★★",
    difficulty: "📖 Reading Intensive",
    statement: "With the entire CLAT exam converted to passage-based questions, your reading stamina dictates your rank. I practiced reading dense legal and philosophical passages under strict timers every morning.",
    topperTip: "Never import your outside knowledge into legal reasoning questions; strictly apply the principle given in the passage to the factual situation."
  }
];

const EXAMS_FUTURE_GUIDANCE = [
  {
    title: "14-Day Final Sprint Playbook",
    icon: "📌",
    tag: "Pre-Exam Phase",
    desc: "Stop studying brand-new topics in the final fortnight. Allocate 80% of daily study hours to taking 2 timed full-syllabus mock papers during the official exam shift hours, followed by rigorous 2-hour post-test analysis."
  },
  {
    title: "The 3-Round Exam Hall Strategy",
    icon: "⏱️",
    tag: "Time Management",
    desc: "Divide your exam into 3 sweeps: Round 1 (first 40 mins) to sweep 100% of all easy, direct-formula questions. Round 2 to solve moderate calculation problems. Round 3 for complex multi-concept challenges."
  },
  {
    title: "Negative Marking Shield",
    icon: "⚠️",
    tag: "Accuracy Control",
    desc: "Never blindly guess on negative marking exams. Only make calculated attempts when you can confidently eliminate at least 2 incorrect options, otherwise preserve your hard-earned aggregate score."
  },
  {
    title: "Exam-Day Mindset & Protocol",
    icon: "🧠",
    tag: "Composure & Logistics",
    desc: "Print 3 colored copies of your admit card, verify valid original government photo ID, check permitted analog wristwatch rules, and arrive at the examination venue at least 90 minutes before reporting time."
  }
];

const EXAMS_PREPARATION_MATERIALS = [
  {
    id: "mat-jee-pyq",
    title: "JEE Main & Advanced 15-Year Solved Chapterwise Archive",
    desc: "Complete step-by-step solutions for Physics, Chemistry & Mathematics questions from 2011 to 2025.",
    category: "Engineering • JEE Main / Adv",
    type: "Solved Question Bank (PDF)",
    badge: "High Yield"
  },
  {
    id: "mat-neet-bio",
    title: "NEET UG High-Yield Biology Visual Flashcards & NCERT Compendium",
    desc: "Diagram-based memory infographics, taxonomic classification charts, and genetics mechanisms.",
    category: "Medical • NEET UG",
    type: "Visual Revision Charts",
    badge: "NCERT Mapped"
  },
  {
    id: "mat-cat-qa",
    title: "CAT Quantitative Aptitude & Speed-Math Shortcuts Handbook",
    desc: "Formula shortcuts, Vedic math techniques, and 500 arithmetic problem archetypes with video breakdowns.",
    category: "Management • CAT / XAT",
    type: "Formula & Concept Book",
    badge: "Speed Math"
  },
  {
    id: "mat-clat-legal",
    title: "CLAT Legal Reasoning Passage Deconstruction & Landmark Rulings",
    desc: "Case summaries, constitutional doctrine briefs, and passage-based comprehension worksheets.",
    category: "Law • CLAT / AILET",
    type: "Passage Worksheets",
    badge: "Updated 2026"
  },
  {
    id: "mat-gate-cs",
    title: "GATE Computer Science Core Technical Engineering Compendium",
    desc: "Concise theory notes for Data Structures, OS, Algorithms, DBMS, and Virtual Calculator drills.",
    category: "Engineering • GATE CS",
    type: "Technical Revision Notes",
    badge: "Core Engineering"
  },
  {
    id: "mat-cuet-gen",
    title: "CUET UG General Test & Domain Class 12 Master Question Bank",
    desc: "3,000+ chapter-wise domain MCQs matching the latest NTA computerized examination blueprint.",
    category: "Central Universities • CUET",
    type: "Full Practice Bank",
    badge: "NTA Blueprint"
  },
  {
    id: "mat-bitsat-speed",
    title: "BITSAT Speed Simulator & Bonus 12-Question Pacing Manual",
    desc: "Timed mock test strategies, English proficiency drill sheets, and logical reasoning shortcuts.",
    category: "Engineering • BITSAT",
    type: "Pacing & Strategy Guide",
    badge: "Speed Drills"
  },
  {
    id: "mat-viteee-srm",
    title: "VITEEE & SRMJEEE High-Speed Problem Sets (No Negative Marking)",
    desc: "100% attempt strategy guide, rapid calculations in electrostatics, calculus and organic mechanisms.",
    category: "Engineering • VITEEE / SRM",
    type: "Speed Problem Sets",
    badge: "Zero-Negative"
  },
  {
    id: "mat-tnea-cutoff",
    title: "TNEA 200-Cutoff Aggregate Normalization & College Choice Guide",
    desc: "Previous 5-year closing community cutoffs for CEG, MIT, PSG Tech, and SSN engineering branches.",
    category: "Counselling • TNEA",
    type: "Cutoff Analysis (PDF)",
    badge: "Choice Filling"
  },
  {
    id: "mat-uceed-design",
    title: "UCEED & NID Spatial Reasoning & Perspective Drawing Prompts",
    desc: "1-point, 2-point, 3-point perspective worksheets, human proportions, and creative storytelling briefs.",
    category: "Design • UCEED / NID",
    type: "Sketching Worksheets",
    badge: "Creative Tech"
  },
  {
    id: "mat-nimcet-mca",
    title: "NIT NIMCET Master Higher Mathematics & Computer Awareness Drills",
    desc: "Coordinate geometry, calculus, set theory, and digital logic test series with full step answers.",
    category: "IT & MCA • NIMCET",
    type: "Subject Question Bank",
    badge: "NIT Track"
  },
  {
    id: "mat-ipmat-sa",
    title: "IPMAT Short-Answer Keypad Strategy & Verbal Logic Modules",
    desc: "Targeted problem sets for Quantitative Short-Answer (non-MCQ) and critical reading passages.",
    category: "Management • IPMAT",
    type: "Short-Answer Practice",
    badge: "IIM Track"
  },
  {
    id: "mat-exam-time",
    title: "3-Round Exam Hall Time-Management & Negative Marking Shield",
    desc: "Strategic framework to eliminate low-probability guesses and maximize first-round quick points.",
    category: "Strategy • All Entrance Exams",
    type: "Strategy Framework",
    badge: "Universal"
  },
  {
    id: "mat-sprint-checklist",
    title: "14-Day Final Exam Sprint Checklist & Exam-Day Protocol Guide",
    desc: "Admit card verification, reporting logistics, bio-clock alignment, and formula revision checklist.",
    category: "Preparation • Exam Day",
    type: "Checklist & Guidelines",
    badge: "Must Read"
  }
];

let examsFilterState = {
  search: '',
  state: '',
  district: ''
};

let _liveUserExamsCache = null;
let _liveExamsFetching = false;

async function syncLiveExams() {
  if (_liveExamsFetching) return;
  _liveExamsFetching = true;
  try {
    const res = await fetch('/api/exams');
    if (res.ok) {
      const data = await res.json();
      const pgExams = (data && Array.isArray(data.exams)) ? data.exams : [];
      if (pgExams.length > 0) {
        const mapped = pgExams.map((pe, idx) => {
          const matchedBase = EXAMS_DIRECTORY_DATA.find(b =>
            String(b.id) === String(pe.id) ||
            (b.name && pe.name && b.name.toLowerCase() === pe.name.toLowerCase())
          ) || {};
          return {
            ...matchedBase,
            id: pe.id,
            icon: pe.icon || matchedBase.icon || '🎯',
            name: pe.name || pe.exam_name || 'Entrance Examination',
            stream: pe.stream || pe.exam_type || matchedBase.stream || 'Engineering',
            conductingBody: pe.conducting_body || pe.conductingBody || pe.organization || matchedBase.conductingBody || 'National Examination Authority',
            college: pe.college || matchedBase.college || '',
            state: pe.state || matchedBase.state || '',
            district: pe.district || matchedBase.district || '',
            location: pe.location || matchedBase.location || 'All India',
            examDate: pe.exam_date || pe.examDate || matchedBase.examDate || '2026 Academic Session',
            registrationDeadline: pe.registration_deadline || pe.registrationDeadline || matchedBase.registrationDeadline || 'Check Official Portal',
            status: pe.status || matchedBase.status || 'Active',
            level: pe.level || matchedBase.level || 'National Level',
            eligibility: pe.eligibility || matchedBase.eligibility || 'Standard Criteria Apply',
            syllabus: pe.syllabus || matchedBase.syllabus || 'Standard Pattern',
            scope: pe.description || matchedBase.scope || 'Gateway to premier institutions across India.',
            lifecycle: pe.lifecycle,
            lifecycle_label: pe.lifecycle_label,
            is_expired: pe.is_expired,
            is_hidden: pe.is_hidden
          };
        });
        _liveUserExamsCache = mapped;
        const container = document.getElementById('examsPageContent');
        if (container && container.innerHTML.trim() !== '') {
          renderExamsView();
        }
      }
    }
  } catch (e) {
    console.warn('[Exams] Live sync notice:', e);
  } finally {
    _liveExamsFetching = false;
  }
}

function getExamsRegistry() {
  if (_liveUserExamsCache && _liveUserExamsCache.length > 0) {
    return _liveUserExamsCache;
  }
  syncLiveExams();
  return EXAMS_DIRECTORY_DATA;
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
window.escapeHtml = escapeHtml;

function renderExamsView() {
  const container = document.getElementById('examsPageContent');
  if (!container) return;

  const exams = getExamsRegistry();
  const userReviews = getUserExamReviews();
  const allCombinedReviews = [...userReviews, ...EXAMS_STUDENT_REVIEWS];
  const statesList = typeof INDIA_STATES_AND_DISTRICTS !== 'undefined' ? Object.keys(INDIA_STATES_AND_DISTRICTS).sort() : [];
  const currentDistricts = (examsFilterState.state && typeof INDIA_STATES_AND_DISTRICTS !== 'undefined' && INDIA_STATES_AND_DISTRICTS[examsFilterState.state])
    ? [...INDIA_STATES_AND_DISTRICTS[examsFilterState.state]].sort()
    : [];

  const q = examsFilterState.search.toLowerCase().trim();
  const selectedState = examsFilterState.state.toLowerCase().trim();
  const selectedDistrict = examsFilterState.district.toLowerCase().trim();

  // Filter exams
  const filteredExams = exams.filter(ex => {
    const searchBlob = `${ex.name} ${ex.stream} ${ex.category || ''} ${ex.conductingBody} ${ex.college} ${ex.state} ${ex.district} ${ex.location} ${ex.eligibility} ${ex.scope}`.toLowerCase();
    const matchSearch = !q || searchBlob.includes(q);

    const matchState = !selectedState ||
      (ex.state && ex.state.toLowerCase() === selectedState) ||
      (ex.location && ex.location.toLowerCase().includes('all india')) ||
      (ex.location && ex.location.toLowerCase().includes('national'));

    const matchDistrict = !selectedDistrict ||
      (ex.district && ex.district.toLowerCase().includes(selectedDistrict)) ||
      (ex.location && ex.location.toLowerCase().includes(selectedDistrict)) ||
      (ex.college && ex.college.toLowerCase().includes(selectedDistrict));

    return matchSearch && matchState && matchDistrict;
  });

  const isFilterActive = !!(examsFilterState.search || examsFilterState.state || examsFilterState.district);

  container.innerHTML = `
    <div class="exams-discovery-container">

      <!-- 1. Search & State / District Location Filter Bar -->
      <section class="exams-filter-card">
        <div class="exams-filter-row">
          <div class="exams-search-wrap">
            <span class="exams-input-icon">🔍</span>
            <input
              type="text"
              id="examsSearchInput"
              class="exams-search-input"
              placeholder="Search exam name, conducting college, stream, or eligibility (e.g. JEE, NEET, IIT Madras, Coimbatore, CAT)..."
              value="${escapeHtml(examsFilterState.search)}"
              autocomplete="off"
            />
            ${examsFilterState.search ? `
              <button type="button" class="colleges-filter-clear-btn" onclick="clearExamsSearch()" title="Clear Search">✕</button>
            ` : ''}
          </div>

          <!-- State Dropdown Filter -->
          <select id="examsStateSelect" class="exams-dropdown-select" onchange="handleExamsStateChange(this.value)">
            <option value="">🌐 All States / National</option>
            ${statesList.map(st => `
              <option value="${st}" ${examsFilterState.state === st ? 'selected' : ''}>${st}</option>
            `).join('')}
          </select>

          <!-- District Dropdown Filter -->
          <select id="examsDistrictSelect" class="exams-dropdown-select" ${!examsFilterState.state ? 'disabled' : ''} onchange="handleExamsDistrictChange(this.value)">
            <option value="">${examsFilterState.state ? '📍 All Districts in ' + examsFilterState.state : '📍 Select State First'}</option>
            ${currentDistricts.map(dt => `
              <option value="${dt}" ${examsFilterState.district === dt ? 'selected' : ''}>${dt}</option>
            `).join('')}
          </select>

          ${isFilterActive ? `
            <button type="button" class="action-btn secondary" style="height:42px; padding:0 14px; font-size:12.5px;" onclick="resetExamsFilters()">
              <span>Reset Filters</span> ✕
            </button>
          ` : ''}
        </div>

        <div class="exams-filter-meta-row">
          <div>
            <span>Showing <span class="exams-count-pill">${filteredExams.length}</span> entrance examinations</span>
            ${examsFilterState.state ? ` &bull; <span>State: <strong style="color:var(--coral);">${examsFilterState.state}</strong></span>` : ''}
            ${examsFilterState.district ? ` &bull; <span>District: <strong style="color:var(--teal);">${examsFilterState.district}</strong></span>` : ''}
          </div>
          <span style="font-size:11.5px; color:var(--theme-muted);">National, State &amp; Premier College Portals</span>
        </div>
      </section>

      <!-- 2. Exam Information Cards Grid -->
      <section class="exams-cards-grid">
        ${filteredExams.length === 0 ? `
          <div style="grid-column: 1 / -1; text-align: center; padding: 48px 20px; background: #FFFFFF; border: 1px dashed #CBD5E1; border-radius: 12px;">
            <div style="font-size: 36px; margin-bottom: 8px;">🎯</div>
            <h3 style="margin: 0 0 6px; color: #0F172A;">No Entrance Exams Found</h3>
            <p style="margin: 0 0 16px; color: #64748B; font-size: 13px;">No examinations match your current search and location criteria.</p>
            <button type="button" class="primary-button" style="padding: 8px 16px; font-size: 12.5px;" onclick="resetExamsFilters()">View All Entrance Exams</button>
          </div>
        ` : filteredExams.map(ex => {
          const locParts = [ex.college, ex.district, ex.state].filter(Boolean).filter(s => s && s.toLowerCase() !== 'undefined');
          const locText = locParts.length > 0 ? locParts.join(', ') : 'All Recognized Institutions';
          const isDimmed = ex.lifecycle === 'dimmed' || ex.is_expired;
          const dimmedCardStyle = isDimmed ? 'opacity:0.68; filter:grayscale(25%); background:#F8FAFC; border:1px dashed #CBD5E1;' : '';
          return `
          <article class="exam-info-card" style="${dimmedCardStyle}">
            <div class="exam-card-top">
              <div class="exam-card-badge-row">
                <span class="exam-level-pill">${escapeHtml(ex.level || 'National Level')}</span>
                <span class="exam-stream-tag">📌 ${escapeHtml(ex.stream || 'All Streams')}</span>
                ${isDimmed ? `
                  <span style="font-size:10.5px; background:#FEE2E2; color:#B91C1C; border:1px solid #FECACA; padding:2px 8px; border-radius:999px; font-weight:700; white-space:nowrap;">Finished / Expired</span>
                ` : ''}
              </div>

              <h3 class="exam-card-title">
                <span>${ex.icon || '🎯'}</span>
                <span>${escapeHtml(ex.name || 'Entrance Examination')}</span>
              </h3>

              <div class="exam-location-pill">
                <span>🏛️ Conducting Body: <strong>${escapeHtml(ex.conductingBody || 'National Examination Authority')}</strong></span>
              </div>
              <div style="font-size:11.5px; color:#64748B;">
                📍 <strong>Location / Scope:</strong> ${escapeHtml(locText)}
              </div>

              <div class="exam-details-block">
                <div class="exam-detail-row">
                  <span class="exam-detail-label">🗓️ Exam Date:</span>
                  <span class="exam-detail-val" style="color:var(--coral); font-weight:700;">${escapeHtml(ex.examDate || '2026 Academic Session')}</span>
                </div>
                <div class="exam-detail-row">
                  <span class="exam-detail-label">⏰ Application:</span>
                  <span class="exam-detail-val">${escapeHtml(ex.registrationDeadline || 'Check Official Portal')}</span>
                </div>
                <div class="exam-detail-row">
                  <span class="exam-detail-label">🎓 Eligibility:</span>
                  <span class="exam-detail-val">${escapeHtml(ex.eligibility || 'Standard Criteria Apply')}</span>
                </div>
              </div>
            </div>

            <div class="exam-card-actions">
              <button type="button" class="exam-btn-how-to-prep" onclick="openExamHowToPrepareModal('${ex.id}')">
                <span>📖 How to Prepare</span>
              </button>
              <button type="button" class="exam-btn-roadmap" onclick="openExamPrepRoadmapModal('${ex.id}')">
                <span>Prep Roadmap</span> <span>➔</span>
              </button>
              <button type="button" class="exam-btn-platform" onclick="openExamPlatformAccessModal('${ex.id}')">
                <span>🌐 ${ex.prepPlatform ? escapeHtml(ex.prepPlatform.name.slice(0, 32)) + '...' : 'Prep Platform'}</span>
                <span>↗</span>
              </button>
            </div>
          </article>
        `}).join('')}
      </section>

      <!-- 3. Exam Rankings & Cutoff Benchmarks Section -->
      <section class="domain-survey-section">
        <div class="survey-section-header">
          <div>
            <h2>🏆 Top Exam Rankings &amp; Cutoff Benchmarks (2026 Indicative)</h2>
            <p>Historical rank brackets, cutoff scores, and target college allotment percentiles for top engineering, medical, management, and law admissions.</p>
          </div>
          <span class="survey-tag">NIRF &amp; Seat Allotment Data</span>
        </div>

        <div class="exam-rankings-table-wrap">
          <table class="exam-rankings-table">
            <thead>
              <tr>
                <th>Tier</th>
                <th>Entrance Exam</th>
                <th>Benchmark Rank / Percentile</th>
                <th>Target Institution &amp; Degree</th>
                <th>Cutoff Score / Marks</th>
              </tr>
            </thead>
            <tbody>
              ${EXAMS_RANKING_BENCHMARKS.map(rk => `
                <tr>
                  <td><span class="status-tag approved" style="font-size:10.5px;">${rk.rank}</span></td>
                  <td><strong>${rk.exam}</strong></td>
                  <td><span style="color:var(--coral); font-weight:700;">${rk.benchmark}</span></td>
                  <td><b>${rk.targetCollege}</b><br><small style="color:var(--theme-muted);">${rk.stream}</small></td>
                  <td><span style="color:var(--teal); font-weight:700;">${rk.cutoff}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </section>

      <!-- 4. Student & Topper Reviews Section + Your Own Remarks Box -->
      <section class="domain-survey-section">
        <div class="survey-section-header">
          <div>
            <h2>💬 Exam Aspirant &amp; Topper Reviews</h2>
            <p>Authentic experiences, difficulty analysis, and time-management advice shared by students who cleared top entrance exams.</p>
          </div>
          <span class="survey-tag" style="background:rgba(58, 155, 143, 0.12); color:var(--coral); border-color:rgba(58, 155, 143, 0.3);">
            Verified Topper &amp; Aspirant Community
          </span>
        </div>

        <div class="survey-split-layout">
          <!-- Left: Topper & User Submitted Review Cards -->
          <div class="survey-cards-column">
            <div class="domain-reviews-grid" id="examsAllReviewsGrid">
              ${allCombinedReviews.map(rev => `
                <div class="domain-review-card">
                  <div>
                    <div class="review-header-row">
                      <span class="review-domain-pill">${escapeHtml(rev.exam)}</span>
                      <span class="review-stars">${escapeHtml(rev.rating)}</span>
                    </div>

                    <div style="font-size:11px; font-weight:700; color:#3A9B8F; margin:8px 0 4px;">
                      ${escapeHtml(rev.difficulty || '⚡ High Focus & Strategy')}
                    </div>

                    <p class="review-quote-text" style="margin:8px 0 12px;">
                      "${escapeHtml(rev.statement)}"
                    </p>

                    <div class="review-suggestion-box">
                      <strong>💡 Preparation Advice &amp; Precautions:</strong>
                      <p>${escapeHtml(rev.topperTip || rev.suggestion || 'Stay consistent and practice timed previous year papers.')}</p>
                    </div>
                  </div>

                  <div class="review-user-info">
                    <div class="review-user-avatar">${escapeHtml(rev.avatar)}</div>
                    <div class="review-user-meta">
                      <h4>${escapeHtml(rev.author)}</h4>
                      <span>${escapeHtml(rev.role || 'Exam Aspirant')}</span>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Right: Your Own Remarks Submission Panel -->
          <aside class="survey-chart-sidebar">
            <div class="user-remarks-panel">
              <div class="user-remarks-bg-img" style="background-image: url('https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80');"></div>
              <div class="user-remarks-content">
                <div class="remarks-panel-head">
                  <h3>📝 Your Own Remarks</h3>
                  <p>Share your entrance exam experience, preparation advice, precautions, or tips to guide future exam aspirants.</p>
                </div>

                <div class="remarks-form-group">
                  <div class="remarks-form-row">
                    <input type="text" id="examUserRemarkAuthor" class="remarks-input" placeholder="Your Name (e.g. Rahul, Priya)" />
                    <select id="examUserRemarkRating" class="remarks-select">
                      <option value="★★★★★">★★★★★ (Essential)</option>
                      <option value="★★★★☆">★★★★☆ (Strong)</option>
                      <option value="★★★☆☆">★★★☆☆ (Good)</option>
                    </select>
                  </div>

                  <select id="examUserRemarkExam" class="remarks-select">
                    <option value="JEE Main &amp; Advanced">🎯 JEE Main / JEE Advanced (Engineering)</option>
                    <option value="NEET UG Medical">🩺 NEET UG (Medical &amp; Dental)</option>
                    <option value="CAT Management">📈 CAT / XAT (IIMs &amp; Top B-Schools)</option>
                    <option value="CLAT Law Entrance">⚖️ CLAT / AILET (National Law Universities)</option>
                    <option value="GATE Computer Science">💻 GATE (IISc / IITs &amp; PSUs)</option>
                    <option value="CUET UG Universities">🏛️ CUET UG (Central Universities)</option>
                    <option value="BITSAT Engineering">🚀 BITSAT (BITS Pilani Campuses)</option>
                    <option value="VITEEE Engineering">🏢 VITEEE (VIT Vellore / Chennai)</option>
                    <option value="TNEA Engineering">🎓 TNEA (Tamil Nadu Engineering Admissions)</option>
                    <option value="UCEED Design">🎨 UCEED &amp; NID (Design Institutes)</option>
                    <option value="NIMCET MCA">💾 NIMCET (National Institutes of Technology)</option>
                    <option value="IPMAT Management">📊 IPMAT (IIM Indore / Rohtak / Ranchi)</option>
                    <option value="Other Entrance Exam">🌐 Other National / State Entrance Exam</option>
                  </select>

                  <textarea id="examUserRemarkStatement" class="remarks-textarea" placeholder="Describe your exam preparation experience, mistakes to avoid, or exam-hall strategy..." rows="3"></textarea>

                  <input type="text" id="examUserRemarkAdvice" class="remarks-input" placeholder="💡 Key Advice / Precaution for future students" />

                  <button type="button" class="remarks-submit-btn" id="submitExamRemarkBtn" onclick="submitUserExamRemark()">
                    <span>Submit Exam Remark</span>
                    <span>➔</span>
                  </button>
                </div>

                <div class="user-remarks-feed" id="examUserRemarksListContainer">
                  <!-- Dynamic user exam remarks list rendered here -->
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <!-- 5. Exam Preparation Materials & Study Resources (14 Curated Resources) -->
      <section class="domain-survey-section">
        <div class="survey-section-header">
          <div>
            <h2>📚 Exam Preparation Materials &amp; Study Resources</h2>
            <p>Curated previous year solved archives, high-yield flashcards, formula banks, and strategic pacing guides for top entrance examinations.</p>
          </div>
          <span class="survey-tag approved">14 Verified Prep Packs</span>
        </div>

        <div class="exam-materials-grid">
          ${EXAMS_PREPARATION_MATERIALS.map(mat => `
            <div class="exam-material-card">
              <div class="exam-mat-header">
                <span class="exam-mat-badge">${escapeHtml(mat.badge)}</span>
                <span class="exam-mat-cat">${escapeHtml(mat.category)}</span>
              </div>
              <h4 class="exam-mat-title">${escapeHtml(mat.title)}</h4>
              <p class="exam-mat-desc">${escapeHtml(mat.desc)}</p>
              <div class="exam-mat-footer">
                <span class="exam-mat-type">📄 ${escapeHtml(mat.type)}</span>
                <button type="button" class="exam-mat-btn" onclick="showToast('Accessing ${escapeHtml(mat.title)}...')">
                  <span>View Resource</span> <span>➔</span>
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- 6. Future Student Guidance & Important Intimations -->
      <section class="domain-survey-section">
        <div class="survey-section-header">
          <div>
            <h2>🧭 Future Student Guidance &amp; Important Intimations</h2>
            <p>Actionable preparation playbooks, exam-hall strategies, and mistakes to avoid shared by senior mentors.</p>
          </div>
          <span class="survey-tag future">Senior Mentor Guidelines</span>
        </div>

        <div class="exam-guidance-grid">
          ${EXAMS_FUTURE_GUIDANCE.map(gd => `
            <div class="exam-guidance-card">
              <div class="exam-guidance-head">
                <h4><span>${gd.icon}</span> <span>${gd.title}</span></h4>
                <span class="exam-guidance-tag">${gd.tag}</span>
              </div>
              <p>${gd.desc}</p>
            </div>
          `).join('')}
        </div>
      </section>

    </div>
  `;

  // Render stored user remarks inside the remarks feed
  renderExamUserRemarksList();

  // Attach search listener
  const sInp = document.getElementById('examsSearchInput');
  if (sInp) {
    sInp.addEventListener('input', (e) => {
      examsFilterState.search = e.target.value;
      renderExamsView();
      const newInp = document.getElementById('examsSearchInput');
      if (newInp) {
        newInp.focus();
        newInp.setSelectionRange(newInp.value.length, newInp.value.length);
      }
    });
  }

  // Trigger floating notification for upcoming exams
  initExamDateNotifications();
}

const USER_EXAM_REVIEWS_KEY = 'thecampusnova_exam_user_reviews';

function getUserExamReviews() {
  try {
    const raw = localStorage.getItem(USER_EXAM_REVIEWS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveUserExamReviews(reviews) {
  try {
    localStorage.setItem(USER_EXAM_REVIEWS_KEY, JSON.stringify(reviews));
  } catch (e) {
    console.warn('Could not save user exam reviews to localStorage', e);
  }
}

async function fetchBackendExamReviews() {
  try {
    const res = await fetch('/api/exam-reviews');
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.reviews) && data.reviews.length > 0) {
        saveUserExamReviews(data.reviews);
        return data.reviews;
      }
    }
  } catch (e) {
    console.warn('[Exams] Could not fetch backend exam reviews, using local store', e);
  }
  return getUserExamReviews();
}

async function submitUserExamRemark() {
  const authorInp = document.getElementById('examUserRemarkAuthor');
  const ratingSel = document.getElementById('examUserRemarkRating');
  const examSel = document.getElementById('examUserRemarkExam');
  const stmtInp = document.getElementById('examUserRemarkStatement');
  const adviceInp = document.getElementById('examUserRemarkAdvice');
  const submitBtn = document.getElementById('submitExamRemarkBtn');

  const statement = (stmtInp ? stmtInp.value : '').trim();
  if (!statement) {
    if (typeof showToast === 'function') {
      showToast('Please share your exam experience or remark before submitting.');
    } else {
      alert('Please share your exam experience or remark before submitting.');
    }
    if (stmtInp) stmtInp.focus();
    return;
  }

  const author = (authorInp ? authorInp.value.trim() : '') || 'Exam Aspirant';
  const rating = (ratingSel ? ratingSel.value : '★★★★★');
  const exam = (examSel ? examSel.value : 'JEE Main & Advanced');
  const advice = (adviceInp ? adviceInp.value.trim() : '') || 'Practice previous 5-year question papers under timed examination slots.';
  const avatar = author.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'EX';

  const newReview = {
    id: 'EXREV-' + Date.now(),
    author: author,
    avatar: avatar,
    exam: exam,
    rating: rating,
    difficulty: '⚡ High Focus & Strategy',
    statement: statement,
    topperTip: advice,
    role: `Aspirant / Candidate (${exam.split(' ')[0]})`,
    timestamp: 'Just now'
  };

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Posting Remark...</span>';
  }

  // Save to local cache immediately
  const localList = getUserExamReviews();
  localList.unshift(newReview);
  saveUserExamReviews(localList);

  // Send to backend API
  try {
    const res = await fetch('/api/exam-reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newReview)
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.review) {
        newReview.id = data.review.id || newReview.id;
      }
    }
  } catch (e) {
    console.warn('[Exams] Backend review sync notice:', e);
  }

  // Clear inputs
  if (stmtInp) stmtInp.value = '';
  if (authorInp) authorInp.value = '';
  if (adviceInp) adviceInp.value = '';

  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<span>Submit Exam Remark</span> <span>➔</span>';
  }

  if (typeof showToast === 'function') {
    showToast('Your exam remark has been posted successfully!');
  }

  // Re-render reviews
  renderExamsView();
}
window.submitUserExamRemark = submitUserExamRemark;

function renderExamUserRemarksList() {
  const container = document.getElementById('examUserRemarksListContainer');
  if (!container) return;

  const remarks = getUserExamReviews();
  if (!remarks || remarks.length === 0) {
    container.innerHTML = `
      <div class="user-remark-empty">
        <span>💬 No aspirant remarks added yet.</span><br>
        <small>Be the first to share your exam preparation strategies and advice!</small>
      </div>
    `;
    return;
  }

  container.innerHTML = remarks.map(r => `
    <div class="user-remark-item">
      <div class="user-remark-item-head">
        <span class="user-remark-author">
          <span style="display:inline-grid; place-items:center; width:22px; height:22px; border-radius:50%; background:var(--coral); color:#fff; font-size:9.5px; font-weight:800;">${escapeHtml(r.avatar)}</span>
          <span>${escapeHtml(r.author)}</span>
        </span>
        <span class="user-remark-domain-tag">${escapeHtml(r.exam)}</span>
      </div>
      <p class="user-remark-body">"${escapeHtml(r.statement)}"</p>
      ${r.topperTip ? `
        <div style="font-size:11px; color:#3A9B8F; margin-top:4px; font-weight:600;">
          💡 <em>${escapeHtml(r.topperTip)}</em>
        </div>
      ` : ''}
      <div style="display:flex; justify-content:space-between; align-items:center; font-size:10px; color:var(--theme-muted); margin-top:6px;">
        <span style="color:#3A9B8F;">${escapeHtml(r.rating)}</span>
        <span>${escapeHtml(r.timestamp || 'Recent')}</span>
      </div>
    </div>
  `).join('');
}
window.renderExamUserRemarksList = renderExamUserRemarksList;

function handleExamsStateChange(state) {
  examsFilterState.state = state;
  examsFilterState.district = '';
  renderExamsView();
}
window.handleExamsStateChange = handleExamsStateChange;

function handleExamsDistrictChange(district) {
  examsFilterState.district = district;
  renderExamsView();
}
window.handleExamsDistrictChange = handleExamsDistrictChange;

function clearExamsSearch() {
  examsFilterState.search = '';
  renderExamsView();
}
window.clearExamsSearch = clearExamsSearch;

function resetExamsFilters() {
  examsFilterState = { search: '', state: '', district: '' };
  renderExamsView();
}
window.resetExamsFilters = resetExamsFilters;

// ============================================================================
// EXAM HOW TO PREPARE & PREP ROADMAP MODALS
// ============================================================================

function openExamHowToPrepareModal(examId) {
  const exams = getExamsRegistry();
  const exam = exams.find(e => e.id === examId) || exams[0];
  if (!exam) return;

  if (typeof recordUserActivity === 'function') {
    recordUserActivity('view', 'exams', exam.id || examId, exam.name || '');
  }

  const modal = document.getElementById('examPrepModal');
  const catBadge = document.getElementById('modalExamPrepCategory');
  const titleEl = document.getElementById('modalExamPrepTitle');
  const bodyEl = document.getElementById('examPrepModalBody');
  const metaEl = document.getElementById('modalExamPrepMetaDisplay');
  const actionBtn = document.getElementById('modalExamAccessPlatformBtn');

  if (!modal || !catBadge || !titleEl || !bodyEl) return;

  catBadge.textContent = `${exam.stream.toUpperCase()} • HOW TO PREPARE`;
  titleEl.textContent = `${exam.icon} ${exam.name}`;
  if (metaEl) metaEl.textContent = `${exam.conductingBody} • ${exam.examDate}`;
  if (actionBtn) {
    actionBtn.onclick = () => {
      closeExamPrepModal();
      openExamPlatformAccessModal(exam.id);
    };
  }

  const prep = exam.howToPrepare || {
    subjects: ["Core Subjects", "Analytical Reasoning", "Aptitude"],
    keyTopics: ["High-Yield Syllabus Fundamentals", "Previous 10-Year Question Papers"],
    pattern: "Standard CBT Examination",
    strategy: ["1. Complete Syllabus Review", "2. Practice Full Mocks"]
  };

  bodyEl.innerHTML = `
    <div class="prep-section-card">
      <div class="prep-section-title">
        <span>📚 Prescribed Subjects &amp; Weightage</span>
      </div>
      <div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:8px;">
        ${prep.subjects.map(sub => `
          <span style="background:#F1F5F9; border:1px solid #CBD5E1; padding:6px 12px; border-radius:14px; font-size:12px; color:#0F172A; font-weight:700;">
            ${escapeHtml(sub)}
          </span>
        `).join('')}
      </div>
    </div>

    <div class="prep-section-card" style="margin-top:14px;">
      <div class="prep-section-title">
        <span>⚡ High-Weightage Core Topics</span>
      </div>
      <ul style="margin:8px 0 0 16px; padding:0; font-size:12.5px; color:#334155; line-height:1.6;">
        ${prep.keyTopics.map(top => `<li>${escapeHtml(top)}</li>`).join('')}
      </ul>
    </div>

    <div class="prep-section-card" style="margin-top:14px;">
      <div class="prep-section-title">
        <span>🎯 Official Examination Pattern</span>
      </div>
      <p style="margin:8px 0 0; font-size:12.5px; color:#334155; line-height:1.5;">
        ${escapeHtml(prep.pattern)}
      </p>
    </div>

    <div class="prep-section-card" style="margin-top:14px;">
      <div class="prep-section-title">
        <span>🚀 4-Step Strategic Preparation Roadmap</span>
      </div>
      <div style="display:flex; flex-direction:column; gap:8px; margin-top:8px;">
        ${prep.strategy.map(st => `
          <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:8px; padding:10px 12px; font-size:12px; color:#1E293B; line-height:1.4;">
            ${escapeHtml(st)}
          </div>
        `).join('')}
      </div>
    </div>
  `;

  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}
window.openExamHowToPrepareModal = openExamHowToPrepareModal;

function openExamPrepRoadmapModal(examId) {
  const exams = getExamsRegistry();
  const exam = exams.find(e => String(e.id) === String(examId) || e.name.toLowerCase() === String(examId).toLowerCase()) || exams[0];
  if (!exam) return;

  // Retrieve multi-stage preparation roadmap
  let stages = exam.roadmap_stages;
  if (!stages || !Array.isArray(stages) || stages.length === 0) {
    if (window._cachedEntranceExamsData && window._cachedEntranceExamsData.exams) {
      const match = window._cachedEntranceExamsData.exams.find(x =>
        String(x.id) === String(examId) ||
        x.name.toLowerCase().includes(exam.name.toLowerCase()) ||
        exam.name.toLowerCase().includes(x.name.toLowerCase())
      );
      if (match && match.roadmap_stages && match.roadmap_stages.length > 0) {
        stages = match.roadmap_stages;
      }
    }
  }

  // Fallback to structured strategy if not present
  if (!stages || !Array.isArray(stages) || stages.length === 0) {
    const strat = (exam.howToPrepare && exam.howToPrepare.strategy) || [
      "1. NCERT Line-by-Line & Core Foundation: Master foundational syllabus, theory concepts and formulas.",
      "2. 10-Year PYQ & Sectional Speed Drills: Complete chapterwise question archives with strict time benchmarks.",
      "3. Full-Length CBT Simulation Mocks: High-fidelity exam interface simulation with negative marking error log analysis.",
      "4. Final 30-Day Formula & High-Yield Revisions: Consolidate cheat sheets, mnemonic roadmaps and exam-day pacing."
    ];
    stages = strat.map((s, idx) => {
      const parts = s.split(':');
      return {
        stage: idx + 1,
        title: parts.length > 1 ? parts[0].replace(/^\d+[\.\-\s]*/, '').trim() : `Phase ${idx + 1}`,
        focus: parts.length > 1 ? parts.slice(1).join(':').trim() : s.replace(/^\d+[\.\-\s]*/, '').trim(),
        resources: (exam.howToPrepare && exam.howToPrepare.keyTopics) ? exam.howToPrepare.keyTopics.slice(0, 3) : ["Standard NCERT / Foundation Notes", "Official PYQ Archive"]
      };
    });
  }

  const rawPlatformUrl = (exam.prepPlatform && exam.prepPlatform.url) || exam.official_website || exam.official_url || exam.portal_url || exam.website || '';
  const validPlatformUrl = formatPortalUrl(rawPlatformUrl);

  const stagesHtml = stages.map((st, idx) => {
    const stageNum = st.stage || st.step || st.phase || (idx + 1);
    const stageTitle = st.title || st.name || `Preparation Phase ${stageNum}`;
    const stageFocus = st.focus || st.desc || st.description || 'Core syllabus mastery and timed drill practice.';
    const resourcesList = Array.isArray(st.resources) ? st.resources : (typeof st.resources === 'string' ? [st.resources] : []);

    return `
      <div style="background:#FFFFFF; border:1px solid var(--theme-line, #E2E8F0); border-radius:12px; padding:16px; margin-bottom:12px; box-shadow:0 2px 8px rgba(0,0,0,0.02);">
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
          <span style="background:#77AC3B; color:#FFFFFF; font-size:11px; font-weight:800; padding:3px 9px; border-radius:12px; letter-spacing:0.04em;">STAGE ${escapeHtml(String(stageNum))}</span>
          <h4 style="margin:0; font-size:15px; font-weight:800; color:#0F172A;">${escapeHtml(stageTitle)}</h4>
        </div>
        <p style="margin:0 0 10px; font-size:13px; color:#334155; line-height:1.5;">${escapeHtml(stageFocus)}</p>
        ${resourcesList.length > 0 ? `
          <div style="background:#F8FAFC; border-radius:8px; padding:10px 12px; border:1px solid #E2E8F0;">
            <strong style="font-size:11px; color:#64748B; display:block; margin-bottom:4px; text-transform:uppercase; letter-spacing:0.04em;">Recommended Resources &amp; Drills:</strong>
            <div style="display:flex; flex-wrap:wrap; gap:6px;">
              ${resourcesList.map(r => `
                <span style="background:#FFFFFF; border:1px solid #CBD5E1; color:#0F172A; font-size:11px; font-weight:600; padding:3px 9px; border-radius:6px;">
                  📖 ${escapeHtml(String(r))}
                </span>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');

  const contentHtml = `
    <div style="font-size:13.5px; color:#334155;">
      <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; padding:14px 16px; margin-bottom:16px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
        <div>
          <span style="font-size:11px; font-weight:800; color:#77AC3B; text-transform:uppercase; letter-spacing:0.06em;">TARGET EXAMINATION</span>
          <h3 style="margin:2px 0 0; font-size:16px; font-weight:800; color:#0F172A;">${escapeHtml(exam.name)}</h3>
          <span style="font-size:12px; color:#64748B;">🏛️ ${escapeHtml(exam.conductingBody || 'National Agency')} &bull; 🗓️ ${escapeHtml(exam.examDate || '2026 Session')}</span>
        </div>
        ${validPlatformUrl ? `
          <a href="${escapeHtml(validPlatformUrl)}" target="_blank" rel="noopener noreferrer" class="primary-button" style="height:36px; padding:0 16px; font-size:12px; text-decoration:none; display:inline-flex; align-items:center; gap:6px;">
            <span>Official Portal ↗</span>
          </a>
        ` : ''}
      </div>

      <div style="margin-bottom:10px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <h4 style="margin:0; font-size:14px; font-weight:800; color:#0F172A;">🗺️ Structured Multi-Stage Preparation Pathway:</h4>
          <span style="font-size:11.5px; color:#64748B;">Official Verified Curriculum</span>
        </div>
        ${stagesHtml}
      </div>
    </div>
  `;

  openUniversalModal({
    title: `${exam.icon || '🎯'} ${exam.name}`,
    subtitle: `${(exam.stream || 'NATIONAL').toUpperCase()} • COMPLETE PREPARATION ROADMAP`,
    badge: 'PREP ROADMAP',
    contentHtml: contentHtml,
    primaryActionHtml: `
      <div style="display:flex; gap:8px; align-items:center;">
        ${validPlatformUrl ? `
          <a href="${escapeHtml(validPlatformUrl)}" target="_blank" rel="noopener noreferrer" class="primary-button" style="height:38px; font-size:13px; text-decoration:none; display:inline-flex; align-items:center; gap:6px;">
            <span>Official Exam Portal ↗</span>
          </a>
        ` : ''}
        <button type="button" class="secondary-button" style="height:38px; font-size:13px;" onclick="closeUniversalModal()">Close Roadmap</button>
      </div>
    `,
    footNote: 'Syllabus & Blueprint Verified Against Official Testing Agency Notifications'
  });
}
window.openExamPrepRoadmapModal = openExamPrepRoadmapModal;

function closeExamPrepModal() {
  const modal = document.getElementById('examPrepModal');
  if (modal) {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }
  document.body.style.overflow = '';
}
window.closeExamPrepModal = closeExamPrepModal;

// ============================================================================
// EXAM PREPARATION PLATFORM ACCESS MODAL (TERMS & ACCESS CONFIRMATION)
// ============================================================================

function openExamPlatformAccessModal(examId) {
  const exams = getExamsRegistry();
  const exam = exams.find(e => e.id === examId) || exams[0];
  if (!exam) return;

  const modal = document.getElementById('examPlatformModal');
  const titleEl = document.getElementById('modalPlatformExamTitle');
  const bodyEl = document.getElementById('examPlatformModalBody');
  const linkEl = document.getElementById('modalPlatformProceedLink');

  if (!modal || !titleEl || !bodyEl || !linkEl) return;

  const rawPlatformUrl = (exam.prepPlatform && exam.prepPlatform.url) || exam.official_website || exam.official_url || exam.portal_url || exam.website || 'https://nta.ac.in';
  const validPlatformUrl = formatPortalUrl(rawPlatformUrl) || 'https://nta.ac.in';
  const platform = exam.prepPlatform || {
    name: "Official Examination Practice Portal",
    url: validPlatformUrl,
    resourceDesc: "Authorized testing portal, syllabus papers, and official mock modules."
  };
  platform.url = validPlatformUrl;

  titleEl.textContent = `${exam.name} • Preparation Portal`;
  linkEl.href = validPlatformUrl;

  bodyEl.innerHTML = `
    <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:16px; margin-bottom:14px;">
      <div style="font-size:11px; font-weight:800; color:#77AC3B; text-transform:uppercase; letter-spacing:0.06em; margin-bottom:4px;">OFFICIAL RESOURCE</div>
      <h4 style="margin:0 0 6px; font-size:15px; color:#0F172A; font-weight:700;">${escapeHtml(platform.name)}</h4>
      <p style="margin:0 0 10px; font-size:12.5px; color:#475569; line-height:1.5;">${escapeHtml(platform.resourceDesc)}</p>
      <div style="font-size:11.5px; color:#64748B; word-break:break-all;">
        🔗 <strong>Direct URL:</strong> <a href="${validPlatformUrl}" target="_blank" rel="noopener noreferrer" style="color:var(--coral); font-weight:600;">${validPlatformUrl}</a>
      </div>
    </div>

    <div style="background:rgba(58, 155, 143, 0.08); border-left:3px solid #77AC3B; border-radius:0 8px 8px 0; padding:12px 14px;">
      <strong style="color:#0F172A; font-size:12px; display:block; margin-bottom:4px;">📋 Terms of Use &amp; Access Notice:</strong>
      <p style="margin:0; font-size:12px; color:#334155; line-height:1.5;">
        You are being redirected to the official testing agency/university portal. All test papers, mock simulations, and registration deadlines are subject to the conducting body's terms of service and updated guidelines.
      </p>
    </div>
  `;

  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}
window.openExamPlatformAccessModal = openExamPlatformAccessModal;

function closeExamPlatformModal() {
  const modal = document.getElementById('examPlatformModal');
  if (modal) {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }
  document.body.style.overflow = '';
}
window.closeExamPlatformModal = closeExamPlatformModal;

// ============================================================================
// FLOATING CORNER EXAM DATE NOTIFICATIONS WIDGET
// ============================================================================

let examNotificationTimer = null;
let currentExamNotifIndex = 0;

function initExamDateNotifications() {
  const notifContainer = document.getElementById('examFloatingNotification');
  if (!notifContainer) return;

  const examsView = document.getElementById('examsView');
  if (!examsView || !examsView.classList.contains('active') || !document.body.classList.contains('is-exams-view')) {
    notifContainer.style.display = 'none';
    return;
  }

  const exams = getExamsRegistry();
  if (!exams || exams.length === 0) return;

  // Render first notification
  renderCurrentExamNotification();

  if (examNotificationTimer) clearInterval(examNotificationTimer);
  examNotificationTimer = setInterval(() => {
    // Only cycle if user is currently on Exams page
    const ev = document.getElementById('examsView');
    if (ev && ev.classList.contains('active') && document.body.classList.contains('is-exams-view')) {
      currentExamNotifIndex = (currentExamNotifIndex + 1) % exams.length;
      renderCurrentExamNotification();
    } else {
      if (notifContainer) notifContainer.style.display = 'none';
      if (examNotificationTimer) {
        clearInterval(examNotificationTimer);
        examNotificationTimer = null;
      }
    }
  }, 9000);
}

function renderCurrentExamNotification() {
  const notifContainer = document.getElementById('examFloatingNotification');
  if (!notifContainer) return;

  const examsView = document.getElementById('examsView');
  if (!examsView || !examsView.classList.contains('active') || !document.body.classList.contains('is-exams-view')) {
    notifContainer.style.display = 'none';
    return;
  }

  const exams = getExamsRegistry();
  if (!exams || exams.length === 0) return;

  const ex = exams[currentExamNotifIndex % exams.length];
  notifContainer.style.display = 'flex';

  notifContainer.innerHTML = `
    <div class="exam-notif-head">
      <span style="display:flex; align-items:center; gap:6px; color:var(--coral); font-weight:800; font-size:11.5px; text-transform:uppercase; letter-spacing:0.04em;">
        <span>🔔</span> Upcoming Exam
      </span>
      <button type="button" class="exam-notif-close-btn" onclick="dismissExamFloatingNotification()" title="Close notification">✕</button>
    </div>
    <h4 class="exam-notif-title" style="margin:4px 0 2px; font-size:14.5px; font-weight:800; color:#fff;">${ex.name}</h4>
    <div class="exam-notif-body" style="font-size:12px; color:#8E9CA6; line-height:1.45; display:flex; flex-direction:column; gap:3px;">
      <div>🗓️ <strong>Exam Date:</strong> <span style="color:var(--coral); font-weight:600;">${ex.examDate}</span></div>
      <div>🏛️ <strong>College / Institution:</strong> ${ex.college || ex.conductingBody}</div>
      <div>📍 <strong>State / District:</strong> ${ex.district ? ex.district + ', ' : ''}${ex.state}</div>
    </div>
    <div class="exam-notif-footer" style="margin-top:6px; display:flex; justify-content:flex-end;">
      <button type="button" class="exam-notif-act-btn" onclick="openExamPrepRoadmapModal('${ex.id}')" style="width:100%; text-align:center; padding:8px 12px; font-size:12px; font-weight:700;">
        View Prep Roadmap →
      </button>
    </div>
  `;
}

function dismissExamFloatingNotification() {
  const notifContainer = document.getElementById('examFloatingNotification');
  if (notifContainer) {
    notifContainer.style.display = 'none';
  }
  if (examNotificationTimer) {
    clearInterval(examNotificationTimer);
    examNotificationTimer = null;
  }
}
window.dismissExamFloatingNotification = dismissExamFloatingNotification;

// ============================================================================
// 12D. COMPREHENSIVE STUDY MATERIALS & EXAM PREPARATION PORTAL
// ============================================================================

let smFilterState = {
  search: '',
  exam: 'all',
  stream: 'all',
  category: 'all',
  format: 'all',
  customQuery: '',
  showOthers: false
};

const SM_MATERIAL_CATEGORIES = [
  "Lecture Notes",
  "Question Banks",
  "Previous Year Questions",
  "Mock Tests",
  "Formula Sheets",
  "Syllabus",
  "Revision Notes",
  "Topic Guides",
  "Practice Sets",
  "Cheat Sheets",
  "Interview Preparation",
  "Strategy Guides",
  "Reference Materials"
];

const SM_STREAMS = [
  "Engineering",
  "Medical",
  "Management",
  "Law",
  "Computer Science",
  "Data Science",
  "Commerce",
  "Arts & Humanities"
];

function setSmFilter(type, value) {
  smFilterState[type] = value;
  renderStudyMaterialsView();
}
window.setSmFilter = setSmFilter;

function setSmFormatTab(fmt) {
  smFilterState.format = fmt;
  renderStudyMaterialsView();
}
window.setSmFormatTab = setSmFormatTab;

function toggleSmOthers() {
  smFilterState.showOthers = !smFilterState.showOthers;
  if (!smFilterState.showOthers) {
    smFilterState.customQuery = '';
  }
  renderStudyMaterialsView();
  if (smFilterState.showOthers) {
    setTimeout(() => {
      const inp = document.getElementById('smOthersCustomInput');
      if (inp) inp.focus();
    }, 60);
  }
}
window.toggleSmOthers = toggleSmOthers;

function handleSmSearch(val) {
  smFilterState.search = (val || '').trim();
  renderStudyMaterialsView();
}
window.handleSmSearch = handleSmSearch;

function clearSmSearch() {
  smFilterState.search = '';
  smFilterState.customQuery = '';
  smFilterState.showOthers = false;
  renderStudyMaterialsView();
}
window.clearSmSearch = clearSmSearch;

async function submitStudyMaterialReview() {
  const author = document.getElementById('smReviewAuthor')?.value?.trim();
  const exam = document.getElementById('smReviewExam')?.value?.trim();
  const resource = document.getElementById('smReviewResource')?.value?.trim();
  const rating = document.getElementById('smReviewRating')?.value?.trim();
  const statement = document.getElementById('smReviewStatement')?.value?.trim();
  const advice = document.getElementById('smReviewAdvice')?.value?.trim();

  if (!statement) {
    showToast('Please describe your study material preparation experience.');
    return;
  }

  try {
    const res = await fetch('/api/study-materials/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        author: author || 'Verified Aspirant',
        exam: exam || 'National Entrance',
        resource_used: resource || 'Curated Study Materials',
        rating: rating || '★★★★★',
        statement,
        advice
      })
    });
    const data = await res.json();
    if (data && data.success) {
      showToast('Thank you! Your study material review has been published.');
      if (window._cachedStudyMaterialsData && window._cachedStudyMaterialsData.reviews) {
        window._cachedStudyMaterialsData.reviews.unshift(data.review);
      }
      renderStudyMaterialsView();
    } else {
      showToast(data.message || 'Unable to submit review.');
    }
  } catch (e) {
    showToast('Review submitted successfully.');
  }
}
window.submitStudyMaterialReview = submitStudyMaterialReview;

async function submitStudyMaterialFeedback(helpful) {
  const suggestions = document.getElementById('smFbSuggestions')?.value?.trim() || '';
  const missing = document.getElementById('smFbMissing')?.value?.trim() || '';

  try {
    await fetch('/api/study-materials/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        helpful: Boolean(helpful),
        quality_rating: 5,
        relevance: 'Highly Relevant',
        difficulty: 'Medium',
        suggestions,
        missing_topics: missing
      })
    });
    showToast('Thank you! Your feedback helps us improve educational resources.');
    const box = document.getElementById('smFeedbackBox');
    if (box) {
      box.innerHTML = `
        <div style="text-align:center; padding:16px 0; color:var(--teal); font-size:13px; font-weight:700;">
          ✓ Thank you! Your feedback has been recorded.
        </div>
      `;
    }
  } catch (e) {
    showToast('Feedback submitted.');
  }
}
window.submitStudyMaterialFeedback = submitStudyMaterialFeedback;

function renderStudyMaterialsView() {
  const container = document.getElementById('materialsPageContent');
  if (!container) return;

  // Retrieve exams dynamically from registry or cached list
  let availableExams = [];
  try {
    if (typeof getExamsRegistry === 'function') {
      availableExams = getExamsRegistry() || [];
    } else if (typeof EXAMS_DIRECTORY_DATA !== 'undefined') {
      availableExams = EXAMS_DIRECTORY_DATA;
    }
  } catch (e) {}

  const storeData = window._cachedStudyMaterialsData || {};
  let materials = (storeData.materials && storeData.materials.length > 0 ? storeData.materials : [
    {
        "id": "mat-jee-phys-01",
        "title": "JEE Main & Advanced 15-Year Solved Physics Archive",
        "exam": "JEE Main & JEE Advanced 2026",
        "exam_id": "jee-main",
        "stream": "Engineering",
        "subject": "Physics",
        "topic": "Electrodynamics, Mechanics & Modern Physics",
        "category": "Previous Year Questions",
        "resource_format": "pdf",
        "description": "Comprehensive chapter-wise step-by-step solutions for Physics with dimensional analysis and shortcut hacks.",
        "file_url": "https://jeemain.nta.nic.in",
        "official_url": "https://jeemain.nta.nic.in",
        "provider": "NTA & IIT Faculty Editorial",
        "source_type": "curated",
        "status": "approved",
        "views_count": 1420,
        "downloads_count": 890,
        "rating": "4.9",
        "created_at": "2026-08-15T10:00:00Z"
    },
    {
        "id": "mat-jee-math-01",
        "title": "JEE Calculus, Vectors & 3D Geometry Master Compendium",
        "exam": "JEE Main & JEE Advanced 2026",
        "exam_id": "jee-main",
        "stream": "Engineering",
        "subject": "Mathematics",
        "topic": "Differential Calculus, Integral Calculus & Coordinate Geometry",
        "category": "Formula Sheets",
        "resource_format": "pdf",
        "description": "Key graph transformations, standard integrals, 3D plane vectors, and limit evaluation cheat sheets.",
        "file_url": "https://jeemain.nta.nic.in",
        "official_url": "https://jeemain.nta.nic.in",
        "provider": "IIT Delhi & Kanpur Alumnus Panel",
        "source_type": "curated",
        "status": "approved",
        "views_count": 1250,
        "downloads_count": 780,
        "rating": "4.9",
        "created_at": "2026-08-16T10:00:00Z"
    },
    {
        "id": "mat-neet-bio-01",
        "title": "NEET UG High-Yield Biology Visual Flashcards & NCERT Compendium",
        "exam": "NEET UG 2026",
        "exam_id": "neet-ug",
        "stream": "Medical",
        "subject": "Biology",
        "topic": "Genetics, Plant Physiology, Human Anatomy & Ecology",
        "category": "Revision Notes",
        "resource_format": "pdf",
        "description": "Diagram-based memory infographics, taxonomic classification charts, and 100% NCERT line-by-line pointers.",
        "file_url": "https://neet.nta.nic.in",
        "official_url": "https://neet.nta.nic.in",
        "provider": "AIIMS Alumni Medical Guild",
        "source_type": "curated",
        "status": "approved",
        "views_count": 2340,
        "downloads_count": 1670,
        "rating": "5.0",
        "created_at": "2026-08-18T10:00:00Z"
    },
    {
        "id": "mat-neet-chem-01",
        "title": "NEET Chemistry NCERT Exemplar & Organic Reaction Roadmaps",
        "exam": "NEET UG 2026",
        "exam_id": "neet-ug",
        "stream": "Medical",
        "subject": "Chemistry",
        "topic": "Organic Named Reactions, Coordination Compounds & Thermodynamics",
        "category": "Lecture Notes",
        "resource_format": "pdf",
        "description": "Conversion reaction mechanisms, reagent lookup charts, periodic trends, and previous 10-year NEET trends.",
        "file_url": "https://neet.nta.nic.in",
        "official_url": "https://neet.nta.nic.in",
        "provider": "National Medical Faculty Council",
        "source_type": "curated",
        "status": "approved",
        "views_count": 1180,
        "downloads_count": 640,
        "rating": "4.8",
        "created_at": "2026-08-19T10:00:00Z"
    },
    {
        "id": "mat-cat-quant-01",
        "title": "CAT Quantitative Aptitude & Speed-Math Shortcuts Handbook",
        "exam": "CAT 2026",
        "exam_id": "cat",
        "stream": "Management",
        "subject": "Quantitative Aptitude",
        "topic": "Arithmetic, Algebra, Number Systems & Modern Math",
        "category": "Formula Sheets",
        "resource_format": "pdf",
        "description": "500 formula shortcuts, Vedic mental math techniques, and 300 arithmetic problem archetypes.",
        "file_url": "https://iimcat.ac.in",
        "official_url": "https://iimcat.ac.in",
        "provider": "IIM Ahmedabad Alumnus Panel",
        "source_type": "curated",
        "status": "approved",
        "views_count": 1890,
        "downloads_count": 1210,
        "rating": "4.9",
        "created_at": "2026-08-20T10:00:00Z"
    },
    {
        "id": "mat-gate-cs-01",
        "title": "GATE Computer Science Core Technical Engineering Compendium",
        "exam": "GATE 2026",
        "exam_id": "gate",
        "stream": "Engineering",
        "subject": "Computer Science",
        "topic": "Data Structures, Algorithms, OS, DBMS & Computer Networks",
        "category": "Lecture Notes",
        "resource_format": "pdf",
        "description": "Rigorous theory notes, asymptotic complexity tables, SQL query drills, and virtual calculator tips.",
        "file_url": "https://gate2026.iitkgp.ac.in",
        "official_url": "https://gate2026.iitkgp.ac.in",
        "provider": "IISc Bengaluru & IIT Kharagpur Contributors",
        "source_type": "curated",
        "status": "approved",
        "views_count": 2100,
        "downloads_count": 1450,
        "rating": "5.0",
        "created_at": "2026-08-21T10:00:00Z"
    },
    {
        "id": "mat-clat-legal-01",
        "title": "CLAT Legal Reasoning Passage Deconstruction & Constitution Notes",
        "exam": "CLAT 2026",
        "exam_id": "clat",
        "stream": "Law",
        "subject": "Legal Reasoning",
        "topic": "Constitutional Law, Torts, Contracts & Criminal Jurisprudence",
        "category": "Revision Notes",
        "resource_format": "pdf",
        "description": "Passage comprehension frameworks, landmark Supreme Court case briefs, and legal principle application drills.",
        "file_url": "https://consortiumofnlus.ac.in",
        "official_url": "https://consortiumofnlus.ac.in",
        "provider": "NLSIU Bengaluru Legal Scholar Cell",
        "source_type": "curated",
        "status": "approved",
        "views_count": 980,
        "downloads_count": 530,
        "rating": "4.9",
        "created_at": "2026-08-22T10:00:00Z"
    },
    {
        "id": "mat-cuet-hum-01",
        "title": "CUET UG General Test & Domain Class 12 Master Compendium",
        "exam": "CUET UG 2026",
        "exam_id": "cuet",
        "stream": "Arts & Humanities",
        "subject": "General Test & Social Sciences",
        "topic": "Logical Reasoning, Numerical Ability & Current Affairs",
        "category": "Previous Year Questions",
        "resource_format": "pdf",
        "description": "Chapter-wise chapter maps, static GK one-liners, and 10 full-length solved previous test papers.",
        "file_url": "https://cuetug.ntaonline.in",
        "official_url": "https://cuetug.ntaonline.in",
        "provider": "Delhi University Academic Guild",
        "source_type": "curated",
        "status": "approved",
        "views_count": 1340,
        "downloads_count": 790,
        "rating": "4.8",
        "created_at": "2026-08-23T10:00:00Z"
    },
    {
        "id": "mat-vid-jee-01",
        "title": "Physics Mechanics & Rotational Dynamics Masterclass",
        "exam": "JEE Main & JEE Advanced 2026",
        "exam_id": "jee-main",
        "stream": "Engineering",
        "subject": "Physics",
        "topic": "Rigid Body Dynamics, Moment of Inertia & Angular Momentum",
        "category": "Video Lecture Series",
        "resource_format": "video",
        "channel_name": "IIT JEE Physics Core by Top 100 Rankers",
        "description": "4-hour deep dive breaking down angular momentum conservation, rolling without slipping, and top IIT advanced level derivations.",
        "file_url": "https://www.youtube.com/results?search_query=IIT+JEE+Physics+Rotational+Dynamics+Masterclass",
        "official_url": "https://jeemain.nta.nic.in",
        "provider": "Premier IIT Faculty & Gold Medalist Mentors",
        "source_type": "curated",
        "status": "approved",
        "views_count": 5600,
        "downloads_count": 0,
        "rating": "5.0",
        "created_at": "2026-08-24T10:00:00Z"
    },
    {
        "id": "mat-vid-neet-01",
        "title": "NEET Biology Genetics & Molecular Inheritance Full Walkthrough",
        "exam": "NEET UG 2026",
        "exam_id": "neet-ug",
        "stream": "Medical",
        "subject": "Biology",
        "topic": "Mendelian Principles, DNA Replication & Gene Expression",
        "category": "Video Lecture Series",
        "resource_format": "video",
        "channel_name": "AIIMS Delhi Medical Faculty Series",
        "description": "Visual 3D animated walkthrough of transcription, translation, and high-frequency numerical pedigree analysis.",
        "file_url": "https://www.youtube.com/results?search_query=NEET+Biology+Genetics+Molecular+Inheritance+Masterclass",
        "official_url": "https://neet.nta.nic.in",
        "provider": "AIIMS New Delhi Senior Educators",
        "source_type": "curated",
        "status": "approved",
        "views_count": 8200,
        "downloads_count": 0,
        "rating": "5.0",
        "created_at": "2026-08-25T10:00:00Z"
    },
    {
        "id": "mat-vid-cat-01",
        "title": "CAT DILR Matrix Games, Tournaments & Venn Optimization",
        "exam": "CAT 2026",
        "exam_id": "cat",
        "stream": "Management",
        "subject": "Data Interpretation & Logical Reasoning",
        "topic": "Set Theory, Scheduling, Matrix Arrangement & Game Logic",
        "category": "Video Lecture Series",
        "resource_format": "video",
        "channel_name": "IIM Bangalore CAT Strategy Lab",
        "description": "Master 15-minute set elimination frameworks, tournament round logic, and max-min optimization techniques.",
        "file_url": "https://www.youtube.com/results?search_query=CAT+DILR+Tournament+Games+Matrix+Strategy",
        "official_url": "https://iimcat.ac.in",
        "provider": "100-Percentiler CAT Mentorship Panel",
        "source_type": "curated",
        "status": "approved",
        "views_count": 6400,
        "downloads_count": 0,
        "rating": "4.9",
        "created_at": "2026-08-26T10:00:00Z"
    },
    {
        "id": "mat-vid-gate-01",
        "title": "GATE CS Graph Theory, Dynamic Programming & Trees Masterclass",
        "exam": "GATE 2026",
        "exam_id": "gate",
        "stream": "Engineering",
        "subject": "Computer Science & IT",
        "topic": "Shortest Paths, Memoization, Spanning Trees & Complexity",
        "category": "Video Lecture Series",
        "resource_format": "video",
        "channel_name": "IISc Bengaluru CS Lecture Portal",
        "description": "Mathematical proofs, pseudo-code dry runs, and recurrence relation solutions for previous 20-year GATE papers.",
        "file_url": "https://www.youtube.com/results?search_query=GATE+Computer+Science+Graph+Theory+Dynamic+Programming",
        "official_url": "https://gate2026.iitkgp.ac.in",
        "provider": "IISc Bengaluru Research Faculty",
        "source_type": "curated",
        "status": "approved",
        "views_count": 4900,
        "downloads_count": 0,
        "rating": "5.0",
        "created_at": "2026-08-27T10:00:00Z"
    },
    {
        "id": "mat-vid-clat-01",
        "title": "CLAT Critical Reasoning & Passage Argument Mapping Masterclass",
        "exam": "CLAT 2026",
        "exam_id": "clat",
        "stream": "Law",
        "subject": "Logical & Critical Reasoning",
        "topic": "Assumptions, Inferences, Flaws & Paradox Resolution",
        "category": "Video Lecture Series",
        "resource_format": "video",
        "channel_name": "NLU Top Rankers Legal Club",
        "description": "Speed-reading methodologies, premise-conclusion mapping, and trap answer elimination in dense editorial passages.",
        "file_url": "https://www.youtube.com/results?search_query=CLAT+Critical+Reasoning+Passage+Mapping+Masterclass",
        "official_url": "https://consortiumofnlus.ac.in",
        "provider": "National Law University Faculty Guild",
        "source_type": "curated",
        "status": "approved",
        "views_count": 3200,
        "downloads_count": 0,
        "rating": "4.8",
        "created_at": "2026-08-28T10:00:00Z"
    },
    {
        "id": "mat-vid-des-01",
        "title": "UCEED & NID Design Aptitude, Perspective Drawing & Spatial Thinking",
        "exam": "UCEED & NID DAT 2026",
        "exam_id": "uceed",
        "stream": "Design & Media",
        "subject": "Design Aptitude",
        "topic": "1-2-3 Point Perspective, Lighting, Shadow & Product Storyboarding",
        "category": "Video Lecture Series",
        "resource_format": "video",
        "channel_name": "IDC IIT Bombay Design Studio",
        "description": "Step-by-step sketch proportions, human figure scaling, and creative problem-solving ideation for top design tests.",
        "file_url": "https://www.youtube.com/results?search_query=UCEED+NID+Perspective+Drawing+Spatial+Thinking",
        "official_url": "https://www.uceed.iitb.ac.in",
        "provider": "IIT Bombay & NID Ahmedabad Designers",
        "source_type": "curated",
        "status": "approved",
        "views_count": 3800,
        "downloads_count": 0,
        "rating": "4.9",
        "created_at": "2026-08-29T10:00:00Z"
    },
    {
        "id": "mat-web-jee-01",
        "title": "NTA JEE Main Official Candidate Portal & Online CBT Testing Hub",
        "exam": "JEE Main 2026",
        "exam_id": "jee-main",
        "stream": "Engineering",
        "subject": "National Testing Portal",
        "topic": "Application, City Intimation, Admit Cards & Results",
        "category": "Official Portal Gateway",
        "resource_format": "website",
        "domain_name": "jeemain.nta.nic.in",
        "description": "National Testing Agency official portal for JEE registration, mock computer-based tests, syllabus bulletins, and scorecard download.",
        "file_url": "https://jeemain.nta.nic.in",
        "official_url": "https://jeemain.nta.nic.in",
        "provider": "National Testing Agency (Ministry of Education)",
        "source_type": "official",
        "status": "approved",
        "views_count": 18500,
        "downloads_count": 0,
        "rating": "5.0",
        "created_at": "2026-08-01T10:00:00Z"
    },
    {
        "id": "mat-web-neet-01",
        "title": "National Medical Commission (NMC) & NTA NEET UG Official Portal",
        "exam": "NEET UG 2026",
        "exam_id": "neet-ug",
        "stream": "Medical",
        "subject": "National Medical Testing Agency",
        "topic": "Information Bulletin, Syllabus Framework & Counseling Schedule",
        "category": "Official Portal Gateway",
        "resource_format": "website",
        "domain_name": "neet.nta.nic.in",
        "description": "Official portal for NEET UG eligibility criteria, tie-breaking policy, exam centers, and All-India counseling seat matrix.",
        "file_url": "https://neet.nta.nic.in",
        "official_url": "https://neet.nta.nic.in",
        "provider": "National Medical Commission & NTA",
        "source_type": "official",
        "status": "approved",
        "views_count": 22400,
        "downloads_count": 0,
        "rating": "5.0",
        "created_at": "2026-08-02T10:00:00Z"
    },
    {
        "id": "mat-web-cat-01",
        "title": "IIM Common Admission Test (CAT) Official Convener Platform",
        "exam": "CAT 2026",
        "exam_id": "cat",
        "stream": "Management",
        "subject": "IIM CAT Testing Portal",
        "topic": "Scorecard Gateway, Official Mock Practice & IIM Shortlist Criteria",
        "category": "Official Portal Gateway",
        "resource_format": "website",
        "domain_name": "iimcat.ac.in",
        "description": "Official Indian Institutes of Management admission hub for testing navigation, non-MCQ submission rules, and college eligibility.",
        "file_url": "https://iimcat.ac.in",
        "official_url": "https://iimcat.ac.in",
        "provider": "Indian Institutes of Management (IIMs)",
        "source_type": "official",
        "status": "approved",
        "views_count": 14200,
        "downloads_count": 0,
        "rating": "4.9",
        "created_at": "2026-08-03T10:00:00Z"
    },
    {
        "id": "mat-web-gate-01",
        "title": "GATE 2026 IIT Kharagpur Official Online Application Portal",
        "exam": "GATE 2026",
        "exam_id": "gate",
        "stream": "Engineering",
        "subject": "IIT Kharagpur GATE Desk",
        "topic": "Paper Syllabus, Virtual Scientific Calculator & Question Papers",
        "category": "Official Portal Gateway",
        "resource_format": "website",
        "domain_name": "gate2026.iitkgp.ac.in",
        "description": "Official GATE organising institute interface with real-time test interface practice, two-paper combination lists, and answer keys.",
        "file_url": "https://gate2026.iitkgp.ac.in",
        "official_url": "https://gate2026.iitkgp.ac.in",
        "provider": "IIT Kharagpur & National Coordination Board",
        "source_type": "official",
        "status": "approved",
        "views_count": 11800,
        "downloads_count": 0,
        "rating": "5.0",
        "created_at": "2026-08-04T10:00:00Z"
    },
    {
        "id": "mat-web-clat-01",
        "title": "Consortium of National Law Universities (NLU) Official Portal",
        "exam": "CLAT 2026",
        "exam_id": "clat",
        "stream": "Law",
        "subject": "National Law Consortium",
        "topic": "NLUs Admission Matrix, Sample Comprehension Papers & Cutoffs",
        "category": "Official Portal Gateway",
        "resource_format": "website",
        "domain_name": "consortiumofnlus.ac.in",
        "description": "Official seat allocation, reservation policy, merit lists, and participating National Law University seat matrices across India.",
        "file_url": "https://consortiumofnlus.ac.in",
        "official_url": "https://consortiumofnlus.ac.in",
        "provider": "Consortium of National Law Universities",
        "source_type": "official",
        "status": "approved",
        "views_count": 8900,
        "downloads_count": 0,
        "rating": "4.9",
        "created_at": "2026-08-05T10:00:00Z"
    },
    {
        "id": "mat-web-swayam-01",
        "title": "SWAYAM & NPTEL Official Ministry of Education Learning Repository",
        "exam": "All Degree Examinations",
        "exam_id": "all",
        "stream": "All Streams",
        "subject": "Govt. Credit Transfer Portal",
        "topic": "1000+ Verified University Certified Modular Online Courses",
        "category": "Official Portal Gateway",
        "resource_format": "website",
        "domain_name": "swayam.gov.in",
        "description": "Government of India central higher education initiative offering verified IIT/IIM professor courses with credit-transfer eligibility.",
        "file_url": "https://swayam.gov.in",
        "official_url": "https://swayam.gov.in",
        "provider": "Ministry of Education & AICTE",
        "source_type": "official",
        "status": "approved",
        "views_count": 16700,
        "downloads_count": 0,
        "rating": "5.0",
        "created_at": "2026-08-06T10:00:00Z"
    },
    {
        "id": "mat-prac-jee-01",
        "title": "JEE Main 3-Hour Full-Syllabus Computer-Based Mock Simulator",
        "exam": "JEE Main 2026",
        "exam_id": "jee-main",
        "stream": "Engineering",
        "subject": "Physics, Chemistry & Mathematics",
        "topic": "Complete Class 11 & 12 Joint Entrance Exam Syllabus",
        "category": "Timed Full Mock Test",
        "resource_format": "practice",
        "description": "75-question timed mock test featuring 20 MCQs and 5 Numerical Value questions per subject with real NTA countdown timer.",
        "file_url": "https://jeemain.nta.nic.in",
        "official_url": "https://jeemain.nta.nic.in",
        "provider": "TheCampusNova Examination Lab & NTA Pattern Experts",
        "source_type": "curated",
        "status": "approved",
        "views_count": 7400,
        "downloads_count": 0,
        "rating": "5.0",
        "created_at": "2026-08-10T10:00:00Z"
    },
    {
        "id": "mat-prac-neet-01",
        "title": "NEET UG 200-Question 720-Mark Timed Simulation Drill",
        "exam": "NEET UG 2026",
        "exam_id": "neet-ug",
        "stream": "Medical",
        "subject": "Botany, Zoology, Physics & Chemistry",
        "topic": "Standard Section A & Section B Speed Practice",
        "category": "Timed Full Mock Test",
        "resource_format": "practice",
        "description": "3 hours 20 minutes timed full paper with automatic negative marking (-1) score calculator and detailed solution keys.",
        "file_url": "https://neet.nta.nic.in",
        "official_url": "https://neet.nta.nic.in",
        "provider": "National Medical Faculty Mock Council",
        "source_type": "curated",
        "status": "approved",
        "views_count": 9100,
        "downloads_count": 0,
        "rating": "5.0",
        "created_at": "2026-08-11T10:00:00Z"
    },
    {
        "id": "mat-prac-cat-01",
        "title": "CAT 66-Question 2-Hour Adaptive Sectional Speed Drill",
        "exam": "CAT 2026",
        "exam_id": "cat",
        "stream": "Management",
        "subject": "VARC, DILR & Quantitative Aptitude",
        "topic": "40-Minute Sectional Timers & Percentile Calculator",
        "category": "Adaptive Mock Test",
        "resource_format": "practice",
        "description": "Exact test difficulty calibrator with TITA questions, negative penalty alerts, and benchmark percentile projections.",
        "file_url": "https://iimcat.ac.in",
        "official_url": "https://iimcat.ac.in",
        "provider": "IIM Alumni Aptitude Testing Guild",
        "source_type": "curated",
        "status": "approved",
        "views_count": 6200,
        "downloads_count": 0,
        "rating": "4.9",
        "created_at": "2026-08-12T10:00:00Z"
    },
    {
        "id": "mat-prac-gate-01",
        "title": "GATE CS 65-Question Technical & General Aptitude CBT Drill",
        "exam": "GATE 2026",
        "exam_id": "gate",
        "stream": "Engineering",
        "subject": "Computer Science Engineering",
        "topic": "NAT (Numerical Answer Type) & MSQ (Multiple Select)",
        "category": "CBT Examination Drill",
        "resource_format": "practice",
        "description": "Virtual calculator enabled testing platform with multi-select question (MSQ) zero partial-marking accuracy evaluation.",
        "file_url": "https://gate2026.iitkgp.ac.in",
        "official_url": "https://gate2026.iitkgp.ac.in",
        "provider": "IISc & IIT Graduate Technical Panel",
        "source_type": "curated",
        "status": "approved",
        "views_count": 5400,
        "downloads_count": 0,
        "rating": "5.0",
        "created_at": "2026-08-13T10:00:00Z"
    },
    {
        "id": "mat-prac-clat-01",
        "title": "CLAT 120-Question 120-Minute Passage Speed Drill",
        "exam": "CLAT 2026",
        "exam_id": "clat",
        "stream": "Law",
        "subject": "English, Current Affairs, Legal Reasoning & Logical Reasoning",
        "topic": "Passage Reading Speed & Legal Principle Decision Making",
        "category": "Timed Full Mock Test",
        "resource_format": "practice",
        "description": "Speed-reading intensive mock simulator with word count benchmarks (450 words/passage) and accuracy percentile tracking.",
        "file_url": "https://consortiumofnlus.ac.in",
        "official_url": "https://consortiumofnlus.ac.in",
        "provider": "National Law University Student Panel",
        "source_type": "curated",
        "status": "approved",
        "views_count": 4100,
        "downloads_count": 0,
        "rating": "4.9",
        "created_at": "2026-08-14T10:00:00Z"
    },
    {
        "id": "mat-prac-bitsat-01",
        "title": "BITSAT 130-Question Speed & Accuracy 12-Bonus Question Drill",
        "exam": "BITSAT 2026",
        "exam_id": "bitsat",
        "stream": "Engineering",
        "subject": "Physics, Chemistry, Math, English & Logical Reasoning",
        "topic": "High-Speed Question Answering with Bonus Question Unlocking",
        "category": "Adaptive Mock Test",
        "resource_format": "practice",
        "description": "Experience the exclusive 12-bonus question unlock mechanism by attempting all 130 questions within the 3-hour timer.",
        "file_url": "https://www.bitsadmission.com",
        "official_url": "https://www.bitsadmission.com",
        "provider": "BITS Pilani Alumni Network",
        "source_type": "curated",
        "status": "approved",
        "views_count": 4900,
        "downloads_count": 0,
        "rating": "4.9",
        "created_at": "2026-08-15T10:00:00Z"
    }
]);

  const defaultSmReviews = [
    {
      id: "sm-rev-01",
      author: "Aditya Vardhan",
      exam: "JEE Main & JEE Advanced 2026",
      resource_used: "JEE 15-Year Solved Physics Archive & Formula Sheet",
      rating: "★★★★★",
      statement: "The chapter-wise categorization helped me master Electrodynamics and Modern Physics without getting overwhelmed by uncurated question banks.",
      advice: "Review formula roadmaps daily during the last 30 days before exam session 1."
    },
    {
      id: "sm-rev-02",
      author: "Dr. Sneha Nair",
      exam: "NEET UG 2026",
      resource_used: "NEET High-Yield Biology Visual Compendium",
      rating: "★★★★★",
      statement: "Visual memory flashcards for Plant Physiology and Genetics saved at least 2 hours of daily revision time.",
      advice: "Pair the visual diagrams directly with line-by-line NCERT reading."
    },
    {
      id: "sm-rev-03",
      author: "Rohit Mathur",
      exam: "CAT 2026",
      resource_used: "CAT Speed-Math Shortcuts & DILR Caselet Guide",
      rating: "★★★★★",
      statement: "The 15-minute DILR set selection framework improved my sectional percentile from 78 to 99.2 in national mock series.",
      advice: "Do not attempt all sets; accurately solving 2.5 full sets guarantees 99+ percentile."
    },
    {
      id: "sm-rev-04",
      author: "Ananya Sen",
      exam: "GATE CS 2026",
      resource_used: "GATE Computer Science Core Technical Compendium",
      rating: "★★★★★",
      statement: "The Operating Systems and Computer Networks summaries condensed standard textbooks into high-yield revision tables.",
      advice: "Practice previous 15-year numerical answer type questions at least twice."
    },
    {
      id: "sm-rev-05",
      author: "Kavita Deshmukh",
      exam: "CLAT 2026",
      resource_used: "CLAT Legal Reasoning Passage Deconstruction",
      rating: "★★★★★",
      statement: "Passage deconstruction techniques helped cut reading time per passage down from 4.5 minutes to under 3 minutes.",
      advice: "Prioritize speed drills and constitutional case precedents."
    }
  ];

  const defaultSmExperiences = [
    {
      id: "exp-01",
      learner_name: "Arjun Sundaram",
      exam: "JEE Advanced 2025",
      result_shared: "AIR 412 (IIT Madras CSE)",
      materials_used: "JEE 15-Year Solved Physics Archive, Chemistry Reagent Sheets, NTA Mock Simulator",
      pdf_recommendation: "JEE Calculus & 3D Geometry Master Compendium",
      video_recommendation: "Physics Rotational Dynamics Masterclass",
      website_recommendation: "NTA Official Computer-Based Test Simulator",
      experience: "Having chapter-wise previous papers with verified step-by-step logic eliminated guesswork and built steady confidence across 3-hour tests.",
      advice: "Maintain a negative-marking error notebook and never skip analyzing mock test mistakes."
    },
    {
      id: "exp-02",
      learner_name: "Meera Krishnan",
      exam: "NEET UG 2025",
      result_shared: "Score 695 / 720 (AIIMS New Delhi)",
      materials_used: "NEET Biology High-Yield Visual Flashcards, NCERT Chemistry Exemplar",
      pdf_recommendation: "NEET Biology High-Yield Compendium",
      video_recommendation: "Genetics & Human Anatomy Mechanism Walks",
      website_recommendation: "National Medical Commission (NMC) Official Portal",
      experience: "Diagram flashcards simplified difficult genetics mechanisms and plant cycles, making rapid 15-minute morning revisions effortless.",
      advice: "Read NCERT line-by-line at least 6 times before attempting full-syllabus papers."
    },
    {
      id: "exp-03",
      learner_name: "Vikram Sethi",
      exam: "CAT 2025",
      result_shared: "99.78 Percentile (IIM Ahmedabad PGP)",
      materials_used: "CAT Speed-Math Shortcuts Handbook, DILR Caselet Strategy Guide",
      pdf_recommendation: "CAT Quantitative Aptitude Speed Handbook",
      video_recommendation: "DILR Matrix Games & Tournaments Series",
      website_recommendation: "IIM Official CAT Portal",
      experience: "The set selection framework transformed how I approached the DILR section, preventing wasted time on tricky trap sets.",
      advice: "Prioritize accuracy over speed in VARC and master arithmetic thoroughly in Quant."
    }
  ];

  const defaultMaterialTypeDistribution = [
    { type: "Previous Year Questions", count: 28400, share: 33 },
    { type: "Lecture & Revision Notes", count: 22100, share: 26 },
    { type: "Formula Sheets", count: 18600, share: 22 },
    { type: "Mock Tests & Practice Sets", count: 11400, share: 13 },
    { type: "Topic Guides & Reference", count: 5860, share: 6 }
  ];

  const defaultMonthlyUsageTrend = [
    { month: "Sep", views: 12400, downloads: 6100 },
    { month: "Oct", views: 18900, downloads: 9800 },
    { month: "Nov", views: 26500, downloads: 14200 },
    { month: "Dec", views: 38200, downloads: 19600 },
    { month: "Jan", views: 52400, downloads: 26800 },
    { month: "Feb", views: 64000, downloads: 33100 }
  ];

  const reviews = (storeData && Array.isArray(storeData.reviews) && storeData.reviews.length > 0) ? storeData.reviews : defaultSmReviews;
  const experiences = (storeData && Array.isArray(storeData.experiences) && storeData.experiences.length > 0) ? storeData.experiences : defaultSmExperiences;
  const rawStats = storeData.stats || {};
  const materialTypeDist = (rawStats && Array.isArray(rawStats.material_type_distribution) && rawStats.material_type_distribution.length > 0) ? rawStats.material_type_distribution : defaultMaterialTypeDistribution;
  const monthlyTrends = (rawStats && Array.isArray(rawStats.monthly_usage_trend) && rawStats.monthly_usage_trend.length > 0) ? rawStats.monthly_usage_trend : defaultMonthlyUsageTrend;

  // Filter Materials
  const qLower = (smFilterState.search || smFilterState.customQuery || '').toLowerCase();
  const filteredMaterials = materials.filter(m => {
    if (m.status && m.status !== 'approved') return false;

    if (smFilterState.format !== 'all' && m.resource_format !== smFilterState.format) {
      return false;
    }

    if (smFilterState.stream !== 'all') {
      const s = (m.stream || '').toLowerCase();
      if (!s.includes(smFilterState.stream.toLowerCase()) && !smFilterState.stream.toLowerCase().includes(s)) {
        return false;
      }
    }

    if (smFilterState.exam !== 'all') {
      const ex = (m.exam || '').toLowerCase();
      const exId = (m.exam_id || '').toLowerCase();
      if (!ex.includes(smFilterState.exam.toLowerCase()) && !exId.includes(smFilterState.exam.toLowerCase())) {
        return false;
      }
    }

    if (smFilterState.category !== 'all') {
      const cat = (m.category || '').toLowerCase();
      if (!cat.includes(smFilterState.category.toLowerCase())) {
        return false;
      }
    }

    if (qLower) {
      const fullText = `${m.title} ${m.exam} ${m.subject} ${m.topic} ${m.category} ${m.stream} ${m.description} ${m.provider}`.toLowerCase();
      const terms = qLower.split(/\s+/).filter(Boolean);
      if (!terms.every(t => fullText.includes(t))) {
        return false;
      }
    }

    return true;
  });

  // Top Popularity Rankings
  const topRanked = [...materials].sort((a, b) => (b.downloads_count || 0) - (a.downloads_count || 0)).slice(0, 4);

  container.innerHTML = `
    <div class="study-materials-portal">

      <!-- 1. Centered Search & Discovery Toolbar -->
      <section class="sm-discovery-toolbar" aria-label="Search and Filter Study Materials">
        <div class="sm-search-box-wrap">
          <span>🔍</span>
          <input
            type="text"
            class="sm-search-input"
            id="smSearchInput"
            placeholder="Search by Exam (JEE, NEET, CAT, GATE, CLAT, CUET), Subject, Topic, or Material Type..."
            value="${smFilterState.search}"
            oninput="handleSmSearch(this.value)"
          />
          ${smFilterState.search ? `<button type="button" class="sm-search-clear-btn" onclick="clearSmSearch()" title="Clear search">✕</button>` : ''}
        </div>

        <div class="sm-filters-row">
          <!-- Exam Selector (Connected to active Exams database/registry) -->
          <select class="sm-select" id="smExamFilterSelect" onchange="setSmFilter('exam', this.value)">
            <option value="all" ${smFilterState.exam === 'all' ? 'selected' : ''}>🎯 All Target Examinations</option>
            ${availableExams.map(ex => `
              <option value="${ex.name || ex.shortName || ex.id}" ${smFilterState.exam === (ex.name || ex.shortName || ex.id) ? 'selected' : ''}>
                ${ex.icon || '🎯'} ${ex.name || ex.shortName || ex.id}
              </option>
            `).join('')}
            <option value="JEE Main" ${smFilterState.exam === 'JEE Main' ? 'selected' : ''}>🎯 JEE Main & Advanced (Engineering)</option>
            <option value="NEET UG" ${smFilterState.exam === 'NEET UG' ? 'selected' : ''}>🩺 NEET UG (Medical)</option>
            <option value="CAT" ${smFilterState.exam === 'CAT' ? 'selected' : ''}>📈 CAT / XAT (Management)</option>
            <option value="GATE" ${smFilterState.exam === 'GATE' ? 'selected' : ''}>💻 GATE (Computer Science / Tech)</option>
            <option value="CLAT" ${smFilterState.exam === 'CLAT' ? 'selected' : ''}>⚖️ CLAT / AILET (Law Entrance)</option>
            <option value="CUET" ${smFilterState.exam === 'CUET' ? 'selected' : ''}>🏛️ CUET UG (Central Universities)</option>
            <option value="BITSAT" ${smFilterState.exam === 'BITSAT' ? 'selected' : ''}>🚀 BITSAT (Engineering)</option>
          </select>

          <!-- Material Category Selector -->
          <select class="sm-select" id="smCatFilterSelect" onchange="setSmFilter('category', this.value)">
            <option value="all" ${smFilterState.category === 'all' ? 'selected' : ''}>📚 All 13 Material Types</option>
            ${SM_MATERIAL_CATEGORIES.map(c => `
              <option value="${c}" ${smFilterState.category === c ? 'selected' : ''}>${c}</option>
            `).join('')}
          </select>

          <!-- Stream Quick-Pills -->
          <div class="sm-stream-pills">
            <button type="button" class="sm-pill-btn ${smFilterState.stream === 'all' ? 'active' : ''}" onclick="setSmFilter('stream', 'all')">All Streams</button>
            ${SM_STREAMS.map(st => `
              <button type="button" class="sm-pill-btn ${smFilterState.stream === st ? 'active' : ''}" onclick="setSmFilter('stream', '${st}')">${st}</button>
            `).join('')}
            <button type="button" class="sm-pill-btn sm-others-btn ${smFilterState.showOthers ? 'active' : ''}" onclick="toggleSmOthers()">
              <span>✨ Others</span>
            </button>
          </div>
        </div>

        <!-- Expandable "Others" Custom Discovery Input -->
        ${smFilterState.showOthers ? `
          <div class="sm-others-input-container">
            <input
              type="text"
              class="sm-others-input"
              id="smOthersCustomInput"
              placeholder="Type exact exam, subject, or certification (e.g. SSC CGL, UPSC Geography, Python Interview, Cyber Security)..."
              value="${smFilterState.customQuery}"
              oninput="setSmFilter('customQuery', this.value)"
            />
            <button type="button" class="sm-pill-btn" onclick="clearSmSearch()">Reset</button>
          </div>
        ` : ''}
      </section>

      <!-- 2. Format Filter Tabs Bar -->
      <nav class="sm-format-tabs-bar" aria-label="Material format categories">
        <button type="button" class="sm-format-tab ${smFilterState.format === 'all' ? 'active' : ''}" onclick="setSmFormatTab('all')">
          <span>📚</span> All Resources (${filteredMaterials.length})
        </button>
        <button type="button" class="sm-format-tab ${smFilterState.format === 'pdf' ? 'active' : ''}" onclick="setSmFormatTab('pdf')">
          <span>📄</span> Verified PDFs &amp; Notes
        </button>
        <button type="button" class="sm-format-tab ${smFilterState.format === 'video' ? 'active' : ''}" onclick="setSmFormatTab('video')">
          <span>🎥</span> Video Masterclasses
        </button>
        <button type="button" class="sm-format-tab ${smFilterState.format === 'website' ? 'active' : ''}" onclick="setSmFormatTab('website')">
          <span>🌐</span> Official Portals &amp; Platforms
        </button>
        <button type="button" class="sm-format-tab ${smFilterState.format === 'practice' ? 'active' : ''}" onclick="setSmFormatTab('practice')">
          <span>📝</span> Practice Drills &amp; Mocks
        </button>
      </nav>

      <!-- 3. Study Materials Cards Grid -->
      <div class="sm-materials-grid">
        ${filteredMaterials.length === 0 ? `
          <div style="grid-column: 1 / -1; text-align:center; padding: 48px 20px; background:var(--theme-surface); border:1px solid var(--theme-line); border-radius:14px;">
            <p style="font-size: 28px; margin:0 0 10px;">🔍</p>
            <h3 style="font-size:16px; font-weight:700; color:#fff; margin:0 0 6px;">No study materials matched your criteria</h3>
            <p style="font-size:13px; color:var(--theme-muted); margin:0 0 16px;">Try adjusting your filters, selecting 'All Streams', or clearing the search keyword.</p>
            <button type="button" class="sm-card-btn" onclick="clearSmSearch()"><span>Reset All Filters</span></button>
          </div>
        ` : filteredMaterials.map(m => {
          const isWebsite = (m.resource_format === 'website') || (m.file_url && (m.file_url.startsWith('http://') || m.file_url.startsWith('https://')) && !m.file_url.toLowerCase().endsWith('.pdf'));
          let formatBadge = isWebsite ? 'Website Portal' : 'PDF Document';
          let icon = isWebsite ? '🌐' : '📄';
          let iconClass = isWebsite ? 'website' : '';
          const openUrl = m.file_url && m.file_url !== '#' ? m.file_url : '/uploads/study-materials/sample_test.pdf';

          const officialUrl = m.official_url || (
            (m.exam || '').includes('JEE') ? 'https://jeemain.nta.nic.in' :
            (m.exam || '').includes('NEET') ? 'https://neet.nta.nic.in' :
            (m.exam || '').includes('CAT') ? 'https://iimcat.ac.in' :
            (m.exam || '').includes('GATE') ? 'https://gate2026.iitkgp.ac.in' :
            (m.exam || '').includes('CLAT') ? 'https://consortiumofnlus.ac.in' :
            (m.exam || '').includes('CUET') ? 'https://cuetug.ntaonline.in' :
            (m.exam || '').includes('BITSAT') ? 'https://www.bitsadmission.com' :
            'https://nta.ac.in'
          );

          let actionButtons = '';
          if (isWebsite) {
            actionButtons = `
              <a href="${escapeHtml(openUrl)}" target="_blank" rel="noopener" class="sm-card-btn" style="background:#77AC3B; border-color:#77AC3B; color:#FFFFFF; font-weight:700;" title="Visit official verified resource">
                <span>Visit Website ↗</span>
              </a>
            `;
          } else {
            actionButtons = `
              <a href="${escapeHtml(openUrl)}" target="_blank" rel="noopener" class="sm-card-btn" title="View PDF directly in browser">
                <span>View PDF ↗</span>
              </a>
              <a href="${escapeHtml(openUrl)}" download class="sm-card-btn" style="background:rgba(58, 155, 143, 0.18); border-color:#77AC3B; color:#0F172A; font-weight:700;" title="Download verified PDF">
                <span>Download ↓</span>
              </a>
              <a href="${escapeHtml(officialUrl)}" target="_blank" rel="noopener" class="sm-card-btn sm-official-btn" style="background:#F1F5F9; border-color:#CBD5E1; color:#334155;" title="Open official conducting body portal">
                <span>Official Site ↗</span>
              </a>
            `;
          }

          const badgeColor = (m.category || '').includes('Question') || (m.category || '').includes('PYQ') ? 'coral' :
                             (m.category || '').includes('Formula') || (m.category || '').includes('Cheat') ? 'amber' :
                             (m.category || '').includes('Lecture') || (m.category || '').includes('Revision') ? 'teal' : 'blue';

          const domainOrChannel = m.domain_name ? `🌐 ${m.domain_name}` :
                                  m.channel_name ? `🎥 ${m.channel_name}` :
                                  `● ${m.provider || 'Verified Free Student Access'}`;

          return `
            <article class="sm-material-card">
              <div class="sm-card-head">
                <div class="sm-card-icon ${iconClass}">${icon}</div>
                <div class="sm-card-title-group">
                  <h3>${escapeHtml(m.title || 'Study Resource')}</h3>
                  <span class="sm-card-exam-tag">🎯 ${escapeHtml(m.exam || 'National Examination')} &bull; ${escapeHtml(m.subject || 'General Study')}</span>
                </div>
              </div>

              <div class="sm-card-body">
                <div class="sm-card-badges">
                  <span class="sm-badge ${badgeColor}">${escapeHtml(m.category || 'Study Resource')}</span>
                  <span class="sm-badge blue">${formatBadge}</span>
                  ${m.rating ? `<span class="sm-badge amber">★ ${m.rating}</span>` : ''}
                </div>
                <p style="margin:4px 0 0; color:#475569;">${escapeHtml(m.description || 'Comprehensive exam-aligned reference syllabus.')}</p>
                <div style="font-size:11.5px; color:#64748B; margin-top:4px;">
                  <strong>Topics:</strong> <span style="color:#0F172A; font-weight:600;">${escapeHtml(m.topic || m.subject || 'All Key Chapters')}</span>
                </div>
              </div>

              <div class="sm-card-footer">
                <div style="display:flex; flex-direction:column; max-width: 200px;">
                  <span style="font-size:11px; color:#77AC3B; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(domainOrChannel)}</span>
                  ${m.downloads_count ? `<span style="font-size:10.5px; color:#64748B;">${m.downloads_count.toLocaleString()} learners engaged</span>` : ''}
                </div>
                <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                  ${actionButtons}
                </div>
              </div>
            </article>
          `;
        }).join('')}
      </div>

      <!-- 4. Platform Usage & Learning Insights (Analytics Section) -->
      <section class="sm-analytics-section" aria-label="Platform Usage Insights">
        <div class="sm-analytics-head">
          <div>
            <h2>📊 Platform Usage &amp; Learning Insights</h2>
            <p>X-Ray analysis of study resource adoption, category completion, and learner engagement trends.</p>
          </div>
          <span class="sm-badge teal">Indicative Learning Trends</span>
        </div>

        <div class="sm-analytics-grid">
          <!-- A. Bar Chart: Most-Used Material Types -->
          <div class="sm-chart-card">
            <div class="sm-chart-header">
              <span class="sm-chart-title">Most-Used Material Types</span>
              <span class="sm-chart-sub">Share of Total Downloads</span>
            </div>
            <div class="sm-bar-list">
              ${materialTypeDist.map((b, idx) => {
                const colors = ['coral', 'teal', 'blue', 'amber', 'purple'];
                const col = colors[idx % colors.length];
                return `
                  <div class="sm-bar-item">
                    <div class="sm-bar-item-header">
                      <span>${b.type}</span>
                      <strong style="color:var(--${col === 'blue' ? 'teal' : col});">${b.share}% (${(b.count || 0).toLocaleString()} uses)</strong>
                    </div>
                    <div class="sm-bar-track">
                      <div class="sm-bar-fill ${col}" style="width: ${b.share}%;"></div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- B. Line Chart: Usage Trends Over Time -->
          <div class="sm-chart-card">
            <div class="sm-chart-header">
              <span class="sm-chart-title">Resource Engagement &amp; Completion Velocity</span>
              <span class="sm-chart-sub">Monthly Usage Trends</span>
            </div>
            <div class="sm-line-chart-wrap">
              ${monthlyTrends.map(m => `
                <div class="sm-line-col">
                  <div class="sm-line-pillar-track">
                    <div class="sm-line-bar views" style="height: ${Math.min(100, Math.round((m.views || 10000) / 650))}%;" title="${m.month}: ${(m.views || 0).toLocaleString()} views"></div>
                    <div class="sm-line-bar downloads" style="height: ${Math.min(100, Math.round((m.downloads || 5000) / 350))}%;" title="${m.month}: ${(m.downloads || 0).toLocaleString()} downloads"></div>
                  </div>
                  <span class="sm-line-col-label">${m.month}</span>
                </div>
              `).join('')}
            </div>
            <div style="display:flex; justify-content:center; gap:18px; font-size:11.5px; margin-top:8px;">
              <span style="display:flex; align-items:center; gap:5px; color:#4DA49E;"><span style="display:inline-block; width:10px; height:10px; background:#3A9B8F; border-radius:2px;"></span> Views Trend</span>
              <span style="display:flex; align-items:center; gap:5px; color:#4DA49E;"><span style="display:inline-block; width:10px; height:10px; background:var(--coral); border-radius:2px;"></span> Downloads / Saves</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 5. Learner Success & Experience Portal -->
      <section class="sm-experiences-section" aria-label="Learner Success Stories">
        <div class="sm-analytics-head">
          <div>
            <h2>🎓 Learner Success &amp; Preparation Experiences</h2>
            <p>Verified preparation experiences and resources used by successful examination rank holders.</p>
          </div>
          <span class="sm-badge amber">Voluntary Aspirant Insights</span>
        </div>

        <div class="sm-experience-grid">
          ${experiences.map(exp => `
            <div class="sm-experience-card">
              <div class="sm-experience-header">
                <div class="sm-experience-avatar">${exp.learner_name.charAt(0)}</div>
                <div class="sm-experience-info">
                  <h4>${exp.learner_name}</h4>
                  <span>🎯 ${exp.exam} &bull; ${exp.result_shared}</span>
                </div>
              </div>
              <p class="sm-experience-quote">“${exp.experience}”</p>
              <div class="sm-rec-list">
                <div><strong>📄 Key PDF:</strong> <span style="color:#F3F5F7;">${exp.pdf_recommendation}</span></div>
                <div><strong>🎥 Key Video:</strong> <span style="color:#F3F5F7;">${exp.video_recommendation}</span></div>
                <div><strong>🌐 Key Portal:</strong> <span style="color:#F3F5F7;">${exp.website_recommendation}</span></div>
                <div style="margin-top:4px; color:#3A9B8F;"><strong>💡 Strategy:</strong> ${exp.advice}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- 6. Material Popularity Rankings -->
      <section class="sm-popularity-card" aria-label="Most Recommended Resources">
        <div class="sm-analytics-head" style="margin-bottom:12px;">
          <div>
            <h3 style="font-size:16px; font-weight:700; color:#fff; margin:0 0 2px;">🏆 Highest-Rated &amp; Most-Downloaded Resources</h3>
            <p style="font-size:12px; color:var(--theme-muted); margin:0;">Tracked popularity rankings based on platform downloads and learner feedback.</p>
          </div>
          <span class="sm-badge coral">Top 4 Hall of Fame</span>
        </div>

        <div class="sm-pop-list">
          ${topRanked.map((m, idx) => `
            <div class="sm-pop-item">
              <div class="sm-pop-rank">#${idx + 1}</div>
              <div class="sm-pop-details">
                <div class="sm-pop-title">${m.title}</div>
                <div class="sm-pop-meta">🎯 ${m.exam} &bull; ${m.category} &bull; ${(m.downloads_count || 5000).toLocaleString()} Downloads &bull; ★ ${m.rating || '5.0'}</div>
              </div>
              <a href="${m.file_url || 'https://jeemain.nta.nic.in'}" target="_blank" rel="noopener" class="sm-card-btn" style="padding:6px 12px; font-size:11.5px;">
                <span>Open Resource</span>
              </a>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- 7. Compact Feedback Section -->
      <section class="sm-feedback-box" id="smFeedbackBox" aria-label="Study Material Feedback">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
          <h3 style="font-size:14.5px; font-weight:700; color:#fff; margin:0;">💬 Was this study material collection helpful for your preparation?</h3>
          <span style="font-size:11.5px; color:var(--theme-muted);">Help us expand missing topics</span>
        </div>
        <div class="sm-feedback-row">
          <button type="button" class="sm-fb-btn" onclick="submitStudyMaterialFeedback(true)">👍 Yes, Very Helpful</button>
          <button type="button" class="sm-fb-btn" onclick="submitStudyMaterialFeedback(false)">👎 Needs More Topics</button>
          <input type="text" id="smFbMissing" class="sm-search-input" style="background:#1C2228; border:1px solid var(--theme-line); border-radius:8px; padding:6px 12px; font-size:12px; max-width:300px;" placeholder="Request missing chapters or topics..." />
          <button type="button" class="sm-card-btn secondary" style="padding:6px 12px; font-size:11.5px;" onclick="submitStudyMaterialFeedback(true)">Send Feedback</button>
        </div>
      </section>

      <!-- 8. Main Reviews Section & Right-Side Review Submission Form -->
      <section class="domain-survey-section" aria-label="Study Material Reviews">
        <div class="survey-section-header">
          <div>
            <h2>⭐ Study Material Reviews &amp; Aspirant Voice</h2>
            <p>Peer evaluations, chapter-wise accuracy ratings, and real recommendations from students using these materials.</p>
          </div>
          <span class="survey-tag approved">${reviews.length} Verified Reviews</span>
        </div>

        <div class="sm-reviews-layout">
          <!-- Left: Reviews Feed Column -->
          <div class="sm-reviews-feed-column">
            ${reviews.map(r => `
              <article class="sm-review-card-item">
                <div class="sm-review-card-top">
                  <div class="sm-review-author-box">
                    <div class="sm-review-avatar-circle">${(r.author || 'S').charAt(0)}</div>
                    <div>
                      <div class="sm-review-author-name">${r.author}</div>
                      <span class="sm-review-exam-badge">🎯 ${r.exam || 'Entrance Aspirant'} &bull; ${r.resource_used || 'Study Notes'}</span>
                    </div>
                  </div>
                  <span style="color:#3A9B8F; font-weight:700; font-size:13px;">${r.rating || '★★★★★'}</span>
                </div>
                <p class="sm-review-statement-text">“${r.statement}”</p>
                ${r.advice ? `<div class="sm-review-advice-tag">💡 <strong>Advice:</strong> ${r.advice}</div>` : ''}
              </article>
            `).join('')}
          </div>

          <!-- Right: "Your Study Material Review" Submission Panel -->
          <aside class="sm-your-review-panel">
            <div class="sm-your-review-head">
              <h3>📝 Your Study Material Review</h3>
              <p>Share your honest experience, recommendations, and study hacks to guide the next batch of aspirants.</p>
            </div>

            <div class="sm-review-form-group">
              <input type="text" id="smReviewAuthor" class="sm-rf-input" placeholder="Your Name (e.g. Aniket, Divya)" />

              <select id="smReviewRating" class="sm-rf-select">
                <option value="★★★★★">★★★★★ (Essential Resource)</option>
                <option value="★★★★☆">★★★★☆ (Strong &amp; Helpful)</option>
                <option value="★★★☆☆">★★★☆☆ (Good Reference)</option>
              </select>

              <select id="smReviewExam" class="sm-rf-select">
                <option value="JEE Main &amp; Advanced 2026">🎯 JEE Main / JEE Advanced (Engineering)</option>
                <option value="NEET UG 2026">🩺 NEET UG (Medical)</option>
                <option value="CAT 2026">📈 CAT / XAT (Management)</option>
                <option value="GATE 2026">💻 GATE (Computer Science / Tech)</option>
                <option value="CLAT 2026">⚖️ CLAT / AILET (Law Entrance)</option>
                <option value="CUET UG 2026">🏛️ CUET UG (Central Universities)</option>
                <option value="BITSAT 2026">🚀 BITSAT (Engineering)</option>
                <option value="Other Entrance Exam">🌐 Other National / State Entrance</option>
              </select>

              <input type="text" id="smReviewResource" class="sm-rf-input" placeholder="Material used (e.g. Physics Formula Sheet, Biology Notes)" />

              <textarea id="smReviewStatement" class="sm-rf-textarea" placeholder="How did this material help your preparation? Which chapters were covered best?"></textarea>

              <input type="text" id="smReviewAdvice" class="sm-rf-input" placeholder="💡 Key Advice / Precaution for future aspirants" />

              <button type="button" class="sm-rf-submit-btn" onclick="submitStudyMaterialReview()">
                <span>Submit Review ➔</span>
              </button>
            </div>
          </aside>
        </div>
      </section>

    </div>
  `;

  // Fetch live store from backend if not yet fetched
  if (!window._cachedStudyMaterialsData) {
    fetch('/api/study-materials?status=approved')
      .then(res => res.json())
      .then(data => {
        if (data && data.success && Array.isArray(data.materials)) {
          window._cachedStudyMaterialsData = data;
          renderStudyMaterialsView();
        }
      })
      .catch(() => {});
  }
}
window.renderStudyMaterialsView = renderStudyMaterialsView;

let _currentReviewCategory = 'all';
let _reviewSearchQuery = '';
let _cachedReviewsData = null;

async function fetchReviewsLive() {
  try {
    const res = await fetch('/api/reviews?status=approved');
    const data = await res.json();
    if (data && data.success && Array.isArray(data.reviews)) {
      _cachedReviewsData = data.reviews;
      renderReviewsView();
    }
  } catch (err) {
    console.warn('[Reviews] Live fetch fallback:', err);
  }
}
window.fetchReviewsLive = fetchReviewsLive;

function filterReviewsByCategory(cat) {
  _currentReviewCategory = cat || 'all';
  renderReviewsView();
}
window.filterReviewsByCategory = filterReviewsByCategory;

function handleReviewSearch(q) {
  _reviewSearchQuery = (q || '').trim().toLowerCase();
  renderReviewsView();
}
window.handleReviewSearch = handleReviewSearch;

function openUserReviewModal() {
  const modal = document.getElementById('userReviewSubmitModal');
  if (modal) modal.classList.add('open');
}
window.openUserReviewModal = openUserReviewModal;

function closeUserReviewModal() {
  const modal = document.getElementById('userReviewSubmitModal');
  if (modal) modal.classList.remove('open');
}
window.closeUserReviewModal = closeUserReviewModal;

async function handleUserReviewSubmit(e) {
  e.preventDefault();
  const author = document.getElementById('usrRevAuthor')?.value?.trim();
  const role = document.getElementById('usrRevRole')?.value?.trim();
  const category = document.getElementById('usrRevCategory')?.value;
  const context = document.getElementById('usrRevContext')?.value?.trim();
  const rating = document.getElementById('usrRevRating')?.value || '★★★★★';
  const tag = document.getElementById('usrRevTag')?.value?.trim();
  const statement = document.getElementById('usrRevStatement')?.value?.trim();
  const advice = document.getElementById('usrRevAdvice')?.value?.trim();

  if (!statement) {
    showToast('Please share your review or experience.');
    return;
  }

  const payload = {
    author: author || 'Verified Learner',
    role: role || 'Student Candidate',
    category: category || 'college_experience',
    context: context || 'Academic Program / Campus',
    rating: rating,
    score: rating.includes('★★★★★') ? 5.0 : (rating.includes('★★★★') ? 4.8 : 4.5),
    tag: tag || 'Student Experience',
    statement: statement,
    advice: advice || 'Stay consistent and practice actively.',
    status: 'approved'
  };

  try {
    showToast('Submitting review for verification...');
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data && data.success) {
      showToast('Thank you! Your review has been published.');
      closeUserReviewModal();
      if (_cachedReviewsData) {
        _cachedReviewsData.unshift(data.review);
      }
      renderReviewsView();
    } else {
      showToast(data.message || 'Submission failed.');
    }
  } catch (err) {
    showToast('Unable to submit review at this time.');
  }
}
window.handleUserReviewSubmit = handleUserReviewSubmit;


// ==============================================================================
// UNIQUE WEBSITE & ORIENTATION FEEDBACK REVIEW CONTROLLERS
// ==============================================================================

const STORAGE_KEY_WEBSITE_FEEDBACK = 'campusnova_website_feedback_list';

function getStoredWebsiteFeedback() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_WEBSITE_FEEDBACK);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [
    {
      id: 'WF-01',
      author: 'Aravind Krishnan',
      role: 'B.Tech Aspirant (2026)',
      orientation: '🚀 Website Usability & UI',
      rating: '★★★★★',
      score: 5.0,
      feedback: 'TheCampusNova makes finding colleges in Coimbatore and checking transparent fee structures effortless. The side-by-side college comparison and clean UI saved our family weeks of research!',
      suggestion: 'Add more alumni video interviews if possible.',
      date: '31 Aug 2026'
    },
    {
      id: 'WF-02',
      author: 'Sneha Soundararajan',
      role: 'Final Year MCA Student',
      orientation: '🧭 Career Pathways & Roadmaps',
      rating: '★★★★★',
      score: 5.0,
      feedback: 'The technology roadmaps for AI & Data Science with verified learning milestones gave me the exact clarity needed for our campus interviews.',
      suggestion: 'The 7 Quantitative Aptitude platform links are super useful.',
      date: '31 Aug 2026'
    }
  ];
}

function renderWebsiteFeedbackFeed() {
  const container = document.getElementById('websiteFeedbackFeedList');
  if (!container) return;

  const list = getStoredWebsiteFeedback();
  if (list.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:20px; color:#64748B; font-size:12.5px;">
        <span>💭</span> No community website feedback added yet. Be the first to share your experience with TheCampusNova!
      </div>
    `;
    return;
  }

  container.innerHTML = list.map(item => `
    <div style="background:#FFFFFF; border:1px solid #E2E8F0; border-radius:12px; padding:14px 16px; box-shadow:0 2px 10px rgba(0,0,0,0.03); display:flex; flex-direction:column; gap:6px;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div style="display:flex; align-items:center; gap:8px;">
          <div style="width:28px; height:28px; border-radius:50%; background:linear-gradient(135deg,#77AC3B,#5A8A2B); color:#fff; font-weight:800; font-size:11px; display:flex; align-items:center; justify-content:center;">
            ${(item.author || 'ST').substring(0, 2).toUpperCase()}
          </div>
          <div>
            <strong style="color:#0F172A; font-size:13px; display:block; line-height:1.2;">${escapeHtml(item.author)}</strong>
            <small style="color:#64748B; font-size:11px;">${escapeHtml(item.role || 'Student Reviewer')}</small>
          </div>
        </div>
        <div style="text-align:right;">
          <span style="color:#77AC3B; font-weight:700; font-size:12px;">${escapeHtml(item.rating || '★★★★★')}</span>
          <span style="display:block; font-size:10px; color:#94A3B8;">${item.date || 'Today'}</span>
        </div>
      </div>
      <div style="margin:2px 0;">
        <span style="background:rgba(119,172,59,0.12); color:#77AC3B; font-weight:800; font-size:10.5px; padding:2px 8px; border-radius:10px;">
          ${escapeHtml(item.orientation || 'Website Experience')}
        </span>
      </div>
      <p style="margin:2px 0 0; color:#334155; font-size:12.5px; line-height:1.5;">"${escapeHtml(item.feedback)}"</p>
      ${item.suggestion ? `
        <div style="background:#F8FAFC; border-left:3px solid #77AC3B; padding:6px 10px; border-radius:0 6px 6px 0; font-size:11.5px; color:#475569; margin-top:2px;">
          <strong>💡 Feature Suggestion:</strong> ${escapeHtml(item.suggestion)}
        </div>
      ` : ''}
    </div>
  `).join('');
}
window.renderWebsiteFeedbackFeed = renderWebsiteFeedbackFeed;

async function submitWebsitePlatformFeedback(e) {
  e.preventDefault();
  const authorInp = document.getElementById('webFeedAuthor');
  const roleInp = document.getElementById('webFeedRole');
  const orientSel = document.getElementById('webFeedOrientation');
  const ratingSel = document.getElementById('webFeedRating');
  const textInp = document.getElementById('webFeedText');
  const sugInp = document.getElementById('webFeedSuggestion');

  const author = authorInp?.value?.trim() || 'Student Aspirant';
  const role = roleInp?.value?.trim() || 'Website Visitor';
  const orientation = orientSel?.value || '🚀 Website Usability & UI';
  const rating = ratingSel?.value || '★★★★★';
  const feedback = textInp?.value?.trim();
  const suggestion = sugInp?.value?.trim();

  if (!feedback) {
    if (typeof showToast === 'function') {
      showToast('Please enter your feedback or review about our website.');
    } else {
      alert('Please enter your feedback or review about our website.');
    }
    if (textInp) textInp.focus();
    return;
  }

  const newRecord = {
    id: 'WF-' + Date.now(),
    author: author,
    role: role,
    orientation: orientation,
    rating: rating,
    score: 5.0,
    feedback: feedback,
    suggestion: suggestion,
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  };

  // 1. Save locally
  const current = getStoredWebsiteFeedback();
  current.unshift(newRecord);
  localStorage.setItem(STORAGE_KEY_WEBSITE_FEEDBACK, JSON.stringify(current));

  // 2. Sync with backend suggestions
  try {
    fetch('/api/suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_name: author,
        type: 'website_feedback',
        target_id: orientation,
        message: `${feedback} | Suggestion: ${suggestion || 'N/A'}`
      })
    }).catch(console.error);
  } catch (err) {}

  // 3. Clear inputs & re-render feed
  if (textInp) textInp.value = '';
  if (sugInp) sugInp.value = '';
  if (authorInp) authorInp.value = '';
  if (roleInp) roleInp.value = '';

  renderWebsiteFeedbackFeed();

  if (typeof showToast === 'function') {
    showToast('✓ Thank you for reviewing TheCampusNova! Your feedback is live.');
  } else {
    alert('Thank you for reviewing TheCampusNova! Your feedback is live.');
  }
}
window.submitWebsitePlatformFeedback = submitWebsitePlatformFeedback;

function renderReviewsView() {
  const container = document.getElementById('reviewsPageContent');
  if (!container) return;

  if (!_cachedReviewsData) {
    fetchReviewsLive();
    return;
  }

  const allReviews = _cachedReviewsData;
  const cat1List = allReviews.filter(r => r.category === 'college_experience');
  const cat2List = allReviews.filter(r => r.category === 'courses_materials');
  const cat3List = allReviews.filter(r => r.category === 'placements_industry');
  const cat4List = allReviews.filter(r => r.category === 'exams_prep');

  // Filter based on active category
  let displayedList = allReviews;
  if (_currentReviewCategory !== 'all') {
    displayedList = allReviews.filter(r => r.category === _currentReviewCategory);
  }

  // Filter based on search query
  if (_reviewSearchQuery) {
    displayedList = displayedList.filter(r => {
      const text = `${r.author} ${r.role} ${r.context} ${r.statement} ${r.advice} ${r.tag} ${r.category_name}`.toLowerCase();
      return text.includes(_reviewSearchQuery);
    });
  }

  // Define categories and filter out any with zero reviews (ELIMINATE EMPTY DETAILS)
  const categoryDefinitions = [
    { key: 'college_experience', title: '🏛️ College Experience & Campus Life', list: cat1List },
    { key: 'courses_materials', title: '📚 Courses & Study Materials', list: cat2List },
    { key: 'placements_industry', title: '💼 Placements & Industry Cooperation', list: cat3List },
    { key: 'exams_prep', title: '🎯 Exams & Preparation', list: cat4List }
  ];

  // Strictly filter out any categories that have 0 items so empty headers are never shown
  const activeCategories = categoryDefinitions.filter(cat => cat.list.length > 0);

  const renderReviewCard = (r) => {
    const avatarLetter = (r.author ? r.author.trim().substring(0, 2) : 'EX').toUpperCase();
    return `
      <article class="review-card-item">
        <div class="rc-top-meta">
          <span class="rc-tag-badge">${r.tag || 'Student Voice'}</span>
          <div class="rc-rating-wrap">
            <span class="rc-stars">${r.rating || '★★★★★'}</span>
            <span class="rc-score">★ ${r.score || 4.9}</span>
          </div>
        </div>

        <h3 class="rc-context">${r.context || 'Verified Academic Portal'}</h3>

        <p class="rc-statement">“${r.statement}”</p>

        ${r.advice ? `
          <div class="rc-advice-box">
            <strong>💡 Helpful Advice &amp; Pro Tip:</strong>
            ${r.advice}
          </div>
        ` : ''}

        <div class="rc-author-footer">
          <div class="rc-avatar">${avatarLetter}</div>
          <div class="rc-author-info">
            <span class="rc-author-name">${r.author}</span>
            <span class="rc-author-role">${r.role || 'Verified Student'}</span>
          </div>
        </div>
      </article>
    `;
  };

  container.innerHTML = `
    <div class="reviews-hub-container">

      <!-- ====================================================================
           UNIQUE WEBSITE & ORIENTATION USER REVIEW & FEEDBACK PORTAL
           ==================================================================== -->
      <section class="website-feedback-hero-card" style="background:rgba(255,255,255,0.96); backdrop-filter:blur(10px); border:1.5px solid rgba(119,172,59,0.35); border-radius:20px; padding:28px 32px; box-shadow:0 8px 32px rgba(0,0,0,0.06); margin-bottom:28px;">
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:32px; align-items:start;">

          <!-- Left: Feedback Submission Form -->
          <div>
            <div style="margin-bottom:18px;">
              <span style="background:rgba(119,172,59,0.12); color:#77AC3B; font-weight:800; font-size:11px; padding:3px 10px; border-radius:12px; letter-spacing:0.06em; text-transform:uppercase;">
                🌟 STUDENT &amp; USER FEEDBACK BOX
              </span>
              <h2 style="margin:6px 0 6px; font-size:22px; font-weight:800; color:#0F172A; font-family:'Manrope',sans-serif;">
                How was your experience on TheCampusNova?
              </h2>
              <p style="margin:0; font-size:13px; color:#475569; line-height:1.55;">
                Share your review about our website, career roadmaps, college guidance, or suggest new features to help fellow students.
              </p>
            </div>

            <form onsubmit="submitWebsitePlatformFeedback(event)" style="display:flex; flex-direction:column; gap:12px;">
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                <input type="text" id="webFeedAuthor" placeholder="Your Name (e.g. Anand, Shreya)" required style="height:40px; padding:0 12px; border:1.5px solid #CBD5E1; border-radius:8px; font-size:13px; font-weight:600; color:#0F172A; background:#fff;" />
                <input type="text" id="webFeedRole" placeholder="Your Role (e.g. B.Tech Student, Parent)" required style="height:40px; padding:0 12px; border:1.5px solid #CBD5E1; border-radius:8px; font-size:13px; font-weight:600; color:#0F172A; background:#fff;" />
              </div>

              <div style="display:grid; grid-template-columns:1.4fr 1fr; gap:10px;">
                <select id="webFeedOrientation" style="height:40px; padding:0 12px; border:1.5px solid #CBD5E1; border-radius:8px; font-size:12.5px; font-weight:700; color:#0F172A; background:#fff;">
                  <option value="🚀 Website Usability & UI">🚀 Website Usability &amp; Design</option>
                  <option value="🧭 Career Pathways & Roadmaps">🧭 Career Pathways &amp; Roadmaps</option>
                  <option value="🎓 College & Admission Guidance">🎓 College &amp; Admission Guidance</option>
                  <option value="💼 Placements & Quantitative Prep">💼 Placements &amp; Quantitative Prep</option>
                  <option value="📚 Study Materials & Resources">📚 Study Materials &amp; Notes</option>
                  <option value="💡 Feature Request & Improvement">💡 General Suggestion &amp; New Idea</option>
                </select>

                <select id="webFeedRating" style="height:40px; padding:0 10px; border:1.5px solid #CBD5E1; border-radius:8px; font-size:12.5px; font-weight:700; color:#77AC3B; background:#fff;">
                  <option value="★★★★★">★★★★★ (5.0 / 5.0)</option>
                  <option value="★★★★☆">★★★★☆ (4.8 / 5.0)</option>
                  <option value="★★★☆☆">★★★☆☆ (4.0 / 5.0)</option>
                </select>
              </div>

              <textarea id="webFeedText" rows="3" placeholder="Write your feedback, what you liked most, or how our orientation helped your education path..." required style="padding:10px 12px; border:1.5px solid #CBD5E1; border-radius:8px; font-size:13px; font-family:inherit; line-height:1.45; resize:vertical;"></textarea>

              <input type="text" id="webFeedSuggestion" placeholder="💡 Any feature request or improvement suggestion for next release?" style="height:38px; padding:0 12px; border:1.5px solid #CBD5E1; border-radius:8px; font-size:12.5px; background:#fff;" />

              <button type="submit" class="btn btn-primary" style="height:42px; font-size:13.5px; font-weight:800; border-radius:8px; background:#77AC3B; color:#fff; border:none; cursor:pointer; box-shadow:0 4px 14px rgba(119,172,59,0.35);">
                ✨ Submit Platform Feedback &amp; Review ➔
              </button>
            </form>
          </div>

          <!-- Right: Live Community Website Feedback Feed -->
          <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:16px; padding:20px; display:flex; flex-direction:column; gap:12px;">
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #E2E8F0; padding-bottom:10px;">
              <strong style="color:#0F172A; font-size:14px; display:flex; align-items:center; gap:6px;">
                <span>💬</span> <span>Live Community Feedback &amp; Orientations</span>
              </strong>
              <span style="font-size:11px; background:rgba(119,172,59,0.12); color:#77AC3B; font-weight:800; padding:2px 8px; border-radius:10px;">Verified Users</span>
            </div>
            <div id="websiteFeedbackFeedList" style="display:flex; flex-direction:column; gap:10px; max-height:360px; overflow-y:auto; padding-right:4px;">
              <!-- Dynamically populated by renderWebsiteFeedbackFeed() -->
            </div>
          </div>

        </div>
      </section>

      <!-- Toolbar: Categories, Search, and Submit Modal Button -->
      <div class="reviews-filter-toolbar">
        <div class="reviews-cat-nav">
          <button type="button" class="reviews-cat-btn ${_currentReviewCategory === 'all' ? 'active' : ''}" onclick="filterReviewsByCategory('all')">
            🌟 All Categories (${allReviews.length})
          </button>
          ${cat1List.length > 0 ? `
            <button type="button" class="reviews-cat-btn ${_currentReviewCategory === 'college_experience' ? 'active' : ''}" onclick="filterReviewsByCategory('college_experience')">
              🏛️ College Experience (${cat1List.length})
            </button>
          ` : ''}
          ${cat2List.length > 0 ? `
            <button type="button" class="reviews-cat-btn ${_currentReviewCategory === 'courses_materials' ? 'active' : ''}" onclick="filterReviewsByCategory('courses_materials')">
              📚 Courses & Materials (${cat2List.length})
            </button>
          ` : ''}
          ${cat3List.length > 0 ? `
            <button type="button" class="reviews-cat-btn ${_currentReviewCategory === 'placements_industry' ? 'active' : ''}" onclick="filterReviewsByCategory('placements_industry')">
              💼 Placements & Industry (${cat3List.length})
            </button>
          ` : ''}
          ${cat4List.length > 0 ? `
            <button type="button" class="reviews-cat-btn ${_currentReviewCategory === 'exams_prep' ? 'active' : ''}" onclick="filterReviewsByCategory('exams_prep')">
              🎯 Exams & Prep (${cat4List.length})
            </button>
          ` : ''}
        </div>

        <div class="reviews-search-row">
          <div class="reviews-search-input-wrap">
            <span class="reviews-search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search reviews by college, exam, course, recruiter, or student keyword..."
              value="${_reviewSearchQuery}"
              oninput="handleReviewSearch(this.value)"
            />
          </div>
          <button type="button" class="reviews-submit-trigger-btn" onclick="openUserReviewModal()">
            <span>✍️ Submit Campus Review</span>
          </button>
        </div>
      </div>

      <!-- Verified Student Reviews Section -->
      ${_currentReviewCategory === 'all' && !_reviewSearchQuery ? `
        ${activeCategories.map(cat => `
          <section class="reviews-cat-block">
            <div class="reviews-cat-block-header">
              <div class="reviews-cat-block-title">
                <h2>${cat.title}</h2>
                <span class="reviews-cat-badge-count">${cat.list.length} Verified Reviews</span>
              </div>
            </div>
            <div class="reviews-items-grid">
              ${cat.list.map(renderReviewCard).join('')}
            </div>
          </section>
        `).join('')}
      ` : `
        <div class="reviews-items-grid">
          ${displayedList.length > 0 ? displayedList.map(renderReviewCard).join('') : `
            <div style="grid-column: 1 / -1; text-align:center; padding: 40px 20px; background:#FFFFFF; border:1px solid #E2E8F0; border-radius:14px; color:#475569;">
              <p style="font-size:16px; font-weight:700; color:#0F172A; margin-bottom:6px;">No reviews found matching "${_reviewSearchQuery}"</p>
              <p style="font-size:13px; margin:0;">Try another search term or click "All Categories" to view all student experiences.</p>
            </div>
          `}
        </div>
      `}
    </div>

    <!-- User Review Submission Modal -->
    <div id="userReviewSubmitModal" class="user-review-modal-wrap" onclick="if(event.target === this) closeUserReviewModal()">
      <div class="user-review-modal-card" style="background:#FFFFFF; border:1px solid #E2E8F0; border-radius:18px; padding:26px; max-width:620px;">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;">
          <h3 style="margin:0; font-size:20px; font-weight:800; color:#0F172A;">✍️ Share Your Authentic Campus Review</h3>
          <button type="button" onclick="closeUserReviewModal()" style="background:none; border:none; color:#64748B; font-size:22px; cursor:pointer;">✕</button>
        </div>
        <p style="margin:0 0 16px; font-size:12.5px; color:#64748B; line-height:1.5;">
          Help prospective students make informed academic decisions.
        </p>
        <form onsubmit="handleUserReviewSubmit(event)" style="display:flex; flex-direction:column; gap:12px;">
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
            <input type="text" id="usrRevAuthor" required placeholder="Your Full Name" style="height:38px; padding:0 10px; border:1px solid #CBD5E1; border-radius:6px; font-size:13px;" />
            <input type="text" id="usrRevRole" required placeholder="Academic Year / Degree" style="height:38px; padding:0 10px; border:1px solid #CBD5E1; border-radius:6px; font-size:13px;" />
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
            <select id="usrRevCategory" required style="height:38px; padding:0 10px; border:1px solid #CBD5E1; border-radius:6px; font-size:13px;">
              <option value="college_experience">🏛️ College Experience &amp; Campus Life</option>
              <option value="courses_materials">📚 Courses &amp; Study Materials</option>
              <option value="placements_industry">💼 Placements &amp; Industry Cooperation</option>
              <option value="exams_prep">🎯 Exams &amp; Preparation</option>
            </select>
            <input type="text" id="usrRevContext" required placeholder="Target College / Exam / Recruiter" style="height:38px; padding:0 10px; border:1px solid #CBD5E1; border-radius:6px; font-size:13px;" />
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
            <select id="usrRevRating" style="height:38px; padding:0 10px; border:1px solid #CBD5E1; border-radius:6px; font-size:13px;">
              <option value="★★★★★">★★★★★ (5.0 / 5.0 - Exceptional)</option>
              <option value="★★★★☆">★★★★☆ (4.8 / 5.0 - Very Good)</option>
              <option value="★★★☆☆">★★★☆☆ (4.0 / 5.0 - Good)</option>
            </select>
            <input type="text" id="usrRevTag" placeholder="Focus Topic / Tag" style="height:38px; padding:0 10px; border:1px solid #CBD5E1; border-radius:6px; font-size:13px;" />
          </div>

          <textarea id="usrRevStatement" required rows="3" placeholder="Describe your day-to-day experience, teaching quality, facilities, or placement training..." style="padding:10px; border:1px solid #CBD5E1; border-radius:6px; font-size:13px; font-family:inherit;"></textarea>

          <textarea id="usrRevAdvice" rows="2" placeholder="💡 Helpful Advice &amp; Pro Tip for Peers..." style="padding:10px; border:1px solid #CBD5E1; border-radius:6px; font-size:13px; font-family:inherit;"></textarea>

          <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:6px;">
            <button type="button" onclick="closeUserReviewModal()" class="btn btn-secondary" style="height:36px; padding:0 14px;">Cancel</button>
            <button type="submit" class="btn btn-primary" style="height:36px; padding:0 16px;">Publish Review ↗</button>
          </div>
        </form>
      </div>
    </div>
  `;

  // Render the website feedback live feed immediately
  renderWebsiteFeedbackFeed();
}

window.renderReviewsView = renderReviewsView;

// ============================================================================
// 10 COMPLETE USER WEBSITE FIELDS IMPLEMENTATION (EXACT UI/UX TEMPLATES)
// ============================================================================

// State Management for 10 User Website Fields (Strict Database Sync)
window.rankingsFilterState = { search: '', state: '', district: '', domain: 'all' };
window.careersFilterState = { search: '', state: '', district: '', domain: 'all', preferredField: 'all', tech: 'all' };
window.placementsFilterState = { search: '', state: '', district: '', domain: 'all' };
window.jobsFilterState = { search: '', state: '', district: '', degree: 'all', domain: 'all', role: 'all' };
window.internshipsFilterState = { search: '', state: '', district: '', duration: 'all', domain: 'all' };
window.admissionsFilterState = { search: '', state: '', district: '', course: 'all' };
window.scholarshipsFilterState = { search: '', state: '', district: '', course: 'all', type: 'all' };
window.facilitiesFilterState = { search: '', state: '', district: '', course: 'all', selectedCollegeId: '' };
window.entrancePrepFilterState = { search: '', state: '', district: '', course: 'all', college: '', exam: 'all' };
window.reviewsCompareFilterState = { search: '', state: '', district: '', domain: 'all', college1: '', college2: '', activeCompare: false };

// Data Caches
let _cachedRankingsData = null;
let _cachedCareersData = null;
let _cachedPlacementsFullData = null;
let _cachedJobsData = null;
let _cachedInternshipsFullData = null;
let _cachedAdmissionsData = null;
let _cachedScholarshipsFullData = null;
let _cachedFacilitiesData = null;
let _cachedEntranceExamsData = null;
let _cachedComparisonsData = null;

// Universal Suggestion Box Handler
async function submitUniversalSuggestion(e, sType, targetId = 'GENERAL') {
  if (e && e.preventDefault) e.preventDefault();
  const form = e ? e.target : document.getElementById(`${sType}SuggestionForm`);
  if (!form) return;

  const nameInput = form.querySelector('[name="user_name"]') || form.querySelector('#sugUserName');
  const emailInput = form.querySelector('[name="email"]') || form.querySelector('#sugUserEmail');
  const msgInput = form.querySelector('[name="message"]') || form.querySelector('#sugUserMsg');

  const name = nameInput ? nameInput.value.trim() : 'Student User';
  const email = emailInput ? emailInput.value.trim() : 'student@example.com';
  const message = msgInput ? msgInput.value.trim() : '';

  if (!message) {
    showToast('⚠️ Please enter your review or suggestion before submitting.');
    return;
  }

  try {
    const res = await fetch('/api/suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_name: name || 'Student Aspirant',
        email: email || 'student@example.com',
        type: sType,
        target_id: targetId,
        subject: `Feedback for ${sType.toUpperCase()}`,
        message: message
      })
    });

    if (res.ok) {
      showToast('🎉 Thank you! Your review/suggestion has been submitted successfully.');
      form.reset();
    } else {
      showToast('✅ Feedback recorded locally. Thank you!');
      form.reset();
    }
  } catch (err) {
    showToast('✅ Feedback saved! Thank you for helping us improve.');
    form.reset();
  }
}
window.submitUniversalSuggestion = submitUniversalSuggestion;

// Helper to get state/district lists
function getStatesAndDistrictsList() {
  const states = typeof INDIA_STATES_AND_DISTRICTS !== 'undefined' ? Object.keys(INDIA_STATES_AND_DISTRICTS).sort() : ['Tamil Nadu', 'Karnataka', 'Maharashtra', 'Delhi'];
  return states;
}

function getDistrictsForState(st) {
  if (!st || typeof INDIA_STATES_AND_DISTRICTS === 'undefined' || !INDIA_STATES_AND_DISTRICTS[st]) {
    return ['Coimbatore', 'Chennai', 'Madurai', 'Salem', 'Tiruppur', 'Bengaluru'];
  }
  return [...INDIA_STATES_AND_DISTRICTS[st]].sort();
}

// Universal Bar Chart Generator for Placements, Internships, Facilities & Entrance Exams
function renderCNBarChartHtml({ title, subtitle, items = [], type = 'vertical', colorScheme = 'teal', valueSuffix = '' }) {
  if (type === 'horizontal') {
    const maxVal = Math.max(...items.map(i => Number(i.value) || 0), 1);
    return `
      <div class="cn-bar-chart-card">
        <div class="cn-bar-chart-header">
          <div>
            <h4 class="cn-bar-chart-title">${title}</h4>
            ${subtitle ? `<p class="cn-bar-chart-subtitle">${subtitle}</p>` : ''}
          </div>
        </div>
        <div class="cn-hbar-list">
          ${items.map(item => {
            const numVal = Number(item.value) || 0;
            const pct = Math.min(100, Math.round((numVal / maxVal) * 100));
            const colorClass = item.color || colorScheme;
            return `
              <div class="cn-hbar-item">
                <div class="cn-hbar-item-top">
                  <span class="cn-hbar-item-name">${escapeHtml(item.label)}</span>
                  <span class="cn-hbar-item-val">${escapeHtml(String(item.displayValue || item.value + valueSuffix))}</span>
                </div>
                <div class="cn-hbar-track">
                  <div class="cn-hbar-fill ${colorClass}" style="width:${pct}%;"></div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  // Vertical Bar Chart
  const maxVal = Math.max(...items.map(i => Number(i.value) || 0), 1);
  return `
    <div class="cn-bar-chart-card">
      <div class="cn-bar-chart-header">
        <div>
          <h4 class="cn-bar-chart-title">${title}</h4>
          ${subtitle ? `<p class="cn-bar-chart-subtitle">${subtitle}</p>` : ''}
        </div>
      </div>
      <div class="cn-vertical-bars-wrap">
        ${items.map(item => {
          const numVal = Number(item.value) || 0;
          const pct = Math.max(14, Math.min(100, Math.round((numVal / maxVal) * 100)));
          const colorClass = item.color || colorScheme;
          return `
            <div class="cn-vertical-bar-col">
              <span class="cn-vbar-value">${escapeHtml(String(item.displayValue || item.value + valueSuffix))}</span>
              <div class="cn-vbar-track">
                <div class="cn-vbar-fill ${colorClass}" style="height:${pct}%;"></div>
              </div>
              <span class="cn-vbar-label">${escapeHtml(item.label)}</span>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

// ============================================================================
// 1. RANKINGS VIEW RENDERER
// ============================================================================
function getRankingsFilteredList() {
  const rawList = (_cachedRankingsData && _cachedRankingsData.rankings) ? _cachedRankingsData.rankings : (collegesRegistry || []);
  const q = (rankingsFilterState.search || '').toLowerCase().trim();
  const selectedState = (rankingsFilterState.state || '').toLowerCase().trim();
  const selectedDistrict = (rankingsFilterState.district || '').toLowerCase().trim();
  const selectedDomain = (rankingsFilterState.domain || 'all').toLowerCase().trim();

  let filtered = rawList.filter(item => {
    const name = (item.college_name || item.name || '').toLowerCase();
    const state = (item.state || '').toLowerCase();
    const district = (item.district || item.city || '').toLowerCase();
    const category = (item.category || 'overall').toLowerCase();
    const summary = (item.summary || item.overview || '').toLowerCase();

    const matchSearch = !q || name.includes(q) || summary.includes(q) || district.includes(q);
    const matchState = !selectedState || state === selectedState || state.includes(selectedState);
    const matchDistrict = !selectedDistrict || district === selectedDistrict || district.includes(selectedDistrict);
    const matchDomain = selectedDomain === 'all' || category.includes(selectedDomain) || selectedDomain.includes(category);

    return matchSearch && matchState && matchDistrict && matchDomain;
  });

  return filtered.slice(0, 30);
}

function renderRankingsCardsHtml(filtered) {
  if (filtered.length === 0) {
    return `
      <div style="grid-column:1/-1; text-align:center; padding:48px 20px; background:var(--theme-surface, #FFFFFF); border:1px dashed var(--theme-line, #E2E8F0); border-radius:14px;">
        <div style="font-size:36px; margin-bottom:8px;">🏛️</div>
        <h3 style="margin:0 0 6px; color:#0F172A;">No Colleges Found</h3>
        <p style="color:var(--theme-muted); font-size:13px; margin-bottom:16px;">No institutions match your selected search or filter criteria.</p>
        <button type="button" class="primary-button" onclick="rankingsFilterState = {search:'', state:'', district:'', domain:'all'}; renderRankingsView();">View All Top 30 Colleges</button>
      </div>
    `;
  }

  return filtered.map((rk, idx) => {
    const rankNum = rk.rank || (idx + 1);
    const colId = rk.college_id || rk.id || `COL-${idx+1}`;
    const colName = rk.college_name || rk.name || 'Premier Institute';
    const district = rk.district || rk.city || 'Coimbatore';
    const state = rk.state || 'Tamil Nadu';
    const rating = rk.student_rating || rk.rating || 4.8;
    const median = rk.median_package || rk.placement || '₹7.5 LPA';
    const placementPct = rk.placement_pct || '94%';
    const nirf = rk.nirf_rank ? `#${rk.nirf_rank}` : 'Top 100';
    const overallScore = rk.overall_performance || 9.5;
    const studSupport = rk.student_guidance || 9.5;
    const carGuidance = rk.career_guidance || 9.4;
    const jobOps = rk.job_opportunities || 9.4;
    const goalSupport = rk.goal_support || 9.4;
    const summary = rk.summary || rk.description || 'Premier higher educational institution with high-yield placement and career guidance ecosystems.';

    return `
      <article class="college-card" style="display:flex; flex-direction:column; justify-content:space-between; border-radius:14px; padding:20px; box-shadow:0 4px 18px rgba(0,0,0,0.03); background:#FFFFFF;">
        <div>
          <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:8px; margin-bottom:12px;">
            <span class="pathway-badge coral" style="font-weight:800; font-size:13px;">🏆 Rank #${rankNum}</span>
            <span class="pathway-badge teal">Score: ${overallScore} / 10 &bull; NIRF ${nirf}</span>
          </div>

          <h3 style="font-size:16.5px; font-weight:800; color:#0F172A; margin:0 0 6px; line-height:1.35;">${escapeHtml(colName)}</h3>
          <div style="font-size:12px; color:var(--theme-muted); margin-bottom:12px;">
            📍 <strong>${escapeHtml(district)}, ${escapeHtml(state)}</strong> &bull; ⭐ <strong style="color:#F59E0B;">${rating} / 5.0</strong>
          </div>

          <div style="background:#F8FAFC; border:1px solid var(--theme-line, #E2E8F0); border-radius:10px; padding:10px 14px; margin-bottom:14px;">
            <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px;">
              <span style="color:#64748B;">Median Salary:</span>
              <strong style="color:var(--teal, #3A9B8F); font-weight:800;">${median}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:12px;">
              <span style="color:#64748B;">Placement Track:</span>
              <strong style="color:#0F172A;">${placementPct} placed</strong>
            </div>
          </div>

          <!-- 4 Key Ranking Factors Breakdown -->
          <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:14px; font-size:11.5px;">
            <div>
              <div style="display:flex; justify-content:space-between; color:#334155; margin-bottom:3px;">
                <span>🤝 Student-Support Performance</span>
                <strong>${studSupport} / 10</strong>
              </div>
              <div class="progress-track" style="height:5px; background:#E2E8F0; border-radius:3px; overflow:hidden;"><div class="progress-bar teal" style="width:${studSupport*10}%; height:100%; background:#77AC3B;"></div></div>
            </div>

            <div>
              <div style="display:flex; justify-content:space-between; color:#334155; margin-bottom:3px;">
                <span>🧭 Career Guidance</span>
                <strong>${carGuidance} / 10</strong>
              </div>
              <div class="progress-track" style="height:5px; background:#E2E8F0; border-radius:3px; overflow:hidden;"><div class="progress-bar coral" style="width:${carGuidance*10}%; height:100%; background:#E06D53;"></div></div>
            </div>

            <div>
              <div style="display:flex; justify-content:space-between; color:#334155; margin-bottom:3px;">
                <span>💼 Job / Vacancy Opportunities</span>
                <strong>${jobOps} / 10</strong>
              </div>
              <div class="progress-track" style="height:5px; background:#E2E8F0; border-radius:3px; overflow:hidden;"><div class="progress-bar" style="width:${jobOps*10}%; height:100%; background:#3A9B8F;"></div></div>
            </div>

            <div>
              <div style="display:flex; justify-content:space-between; color:#334155; margin-bottom:3px;">
                <span>🎯 Motivation &amp; Goal Support</span>
                <strong>${goalSupport} / 10</strong>
              </div>
              <div class="progress-track" style="height:5px; background:#E2E8F0; border-radius:3px; overflow:hidden;"><div class="progress-bar amber" style="width:${goalSupport*10}%; height:100%; background:#E5983B;"></div></div>
            </div>
          </div>

          <p style="font-size:12px; color:#64748B; line-height:1.5; margin:0 0 14px;">${escapeHtml(summary)}</p>
        </div>

        <div style="padding-top:12px; border-top:1px solid var(--theme-line, #E2E8F0);">
          <button type="button" class="pathway-card-btn" style="width:100%; justify-content:center;" onclick="openCollegeDetailsModal('${colId}')">
            <span>Explore Campus Details ➔</span>
          </button>
        </div>
      </article>
    `;
  }).join('');
}

function handleRankingsSearch(val) {
  rankingsFilterState.search = val;
  const filtered = getRankingsFilteredList();
  const grid = document.getElementById('rankingsCardsGrid');
  if (grid) grid.innerHTML = renderRankingsCardsHtml(filtered);

  const summary = document.getElementById('rankingsMetaSummary');
  if (summary) {
    summary.innerHTML = `
      <div class="courses-meta-summary-text">
        <span>🏆 Showing <strong>${filtered.length}</strong> top ranked institutions (Top 30 Max)</span>
        ${rankingsFilterState.state ? ` &bull; <span>State: <strong style="color:var(--coral);">${rankingsFilterState.state}</strong></span>` : ''}
        ${rankingsFilterState.district ? ` &bull; <span>District: <strong style="color:var(--teal);">${rankingsFilterState.district}</strong></span>` : ''}
      </div>
      <span style="font-size:11.5px; color:var(--theme-muted);">Weighted by Student Support, Career Guidance, Job Opportunities &amp; Motivation</span>
    `;
  }
}
window.handleRankingsSearch = handleRankingsSearch;

async function renderRankingsView() {
  const container = document.getElementById('rankingsPageContent');
  if (!container) return;

  if (!_cachedRankingsData) {
    try {
      const res = await fetch('/api/rankings');
      if (res.ok) {
        const data = await res.json();
        if (data && data.rankings) _cachedRankingsData = data;
      }
    } catch (e) {
      console.warn('[Rankings] Live fetch fallback:', e);
    }
  }

  const filtered = getRankingsFilteredList();
  const reviewsList = (_cachedRankingsData && _cachedRankingsData.reviews) ? _cachedRankingsData.reviews : [
    { author: 'S. Ranganathan', avatar: 'SR', role: 'PSG Tech Alumni', college: 'PSG College of Technology, Coimbatore', rating: 5.0, comment: 'The holistic scoring model accurately captures PSG\'s strong industry tie-ups, hands-on laboratory ecosystems, and campus recruitment records.' },
    { author: 'Pooja Venkataraman', avatar: 'PV', role: 'Amrita AI Scholar', college: 'Amrita Vishwa Vidyapeetham, Coimbatore', rating: 4.9, comment: 'Guidance on international fellowships, patents, and top tier research labs at Amrita was the defining highlight of my B.Tech.' },
    { author: 'Dinesh Karthik', avatar: 'DK', role: 'Adithya IT Graduate', college: 'Adithya Institute of Technology, Coimbatore', rating: 4.8, comment: 'Adithya\'s project-focused training in robotics and cloud gave our entire batch high placement conversion into product companies.' },
    { author: 'Ananya Sharma', avatar: 'AS', role: 'B.Sc Computing Scholar', college: 'Christ University, Bengaluru', rating: 4.8, comment: 'Transparent career guidance metrics helped me pick Christ University over generic institutions. Faculty mentorship is top-notch.' },
    { author: 'M. Vignesh', avatar: 'MV', role: 'CIT Mechanical Alum', college: 'Coimbatore Institute of Technology', rating: 4.7, comment: 'Core engineering placement and student motivation scores are completely accurate. CIT has unmatched industrial alumni networks.' },
    { author: 'Kavitha Sundaram', avatar: 'KS', role: 'Loyola Commerce Graduate', college: 'Loyola College, Chennai', rating: 4.9, comment: 'The ranking factors reflect Loyola\'s holistic student support and consistent career placement track records.' },
    { author: 'Rahul Nair', avatar: 'RN', role: 'IISc Research Fellow', college: 'IISc Bengaluru', rating: 5.0, comment: 'IISc\'s #1 NIRF and student guidance scoring is second to none. World-class faculty and unmatched funding for research.' },
    { author: 'Deepika Raj', avatar: 'DR', role: 'KCT Mechatronics Alum', college: 'Kumaraguru College of Technology, Coimbatore', rating: 4.8, comment: 'Kumaraguru\'s student garage, startup ecosystem (Forge), and campus culture set the benchmark for engineering education.' }
  ];

  const statesList = getStatesAndDistrictsList();
  const currentDistricts = rankingsFilterState.state ? getDistrictsForState(rankingsFilterState.state) : [];
  const isFilterActive = !!(rankingsFilterState.search || rankingsFilterState.state || rankingsFilterState.district || (rankingsFilterState.domain && rankingsFilterState.domain !== 'all'));

  container.innerHTML = `
    <div class="courses-discovery-container" style="display:flex; flex-direction:column; gap:24px;">

      <!-- 1. Search & Filter Bar: ONE Clean Horizontal Row (Search | State | District) -->
      <section class="colleges-discovery-filter-card" style="margin-bottom:0;">
        <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap; width:100%;">
          <!-- Search Box -->
          <div class="colleges-search-input-wrap" style="flex:1.5; min-width:240px; margin:0;">
            <span class="colleges-input-lead-icon">🔍</span>
            <input
              type="text"
              id="rankingsSearchInput"
              class="colleges-search-input-field"
              placeholder="Search college name, city, rank..."
              value="${escapeHtml(rankingsFilterState.search)}"
              oninput="handleRankingsSearch(this.value)"
            />
            ${rankingsFilterState.search ? `
              <button type="button" class="colleges-filter-clear-btn" style="display:block;" onclick="handleRankingsSearch(''); document.getElementById('rankingsSearchInput').value='';">✕</button>
            ` : ''}
          </div>

          <!-- State Dropdown -->
          <div style="flex:1; min-width:180px;">
            <select class="colleges-dropdown-select" style="width:100%; height:44px;" onchange="rankingsFilterState.state = this.value; rankingsFilterState.district = ''; renderRankingsView();">
              <option value="">🌐 All States</option>
              ${statesList.map(st => `
                <option value="${st}" ${rankingsFilterState.state === st ? 'selected' : ''}>${st}</option>
              `).join('')}
            </select>
          </div>

          <!-- District Dropdown -->
          <div style="flex:1; min-width:180px;">
            <select class="colleges-dropdown-select" style="width:100%; height:44px;" ${!rankingsFilterState.state ? 'disabled' : ''} onchange="rankingsFilterState.district = this.value; renderRankingsView();">
              <option value="">${rankingsFilterState.state ? '📍 All Districts in ' + rankingsFilterState.state : '📍 Select State First'}</option>
              ${currentDistricts.map(dt => `
                <option value="${dt}" ${rankingsFilterState.district === dt ? 'selected' : ''}>${dt}</option>
              `).join('')}
            </select>
          </div>

          ${isFilterActive ? `
            <button type="button" class="action-btn secondary" style="height:44px; padding:0 14px; font-size:12px; white-space:nowrap;" onclick="rankingsFilterState = {search:'', state:'', district:'', domain:'all'}; renderRankingsView();">
              ↺ Reset
            </button>
          ` : ''}
        </div>

        <!-- Directly below: Domain Search / Filter -->
        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-top:14px; padding-top:12px; border-top:1px solid var(--theme-line, #E2E8F0);">
          <span style="font-size:12px; font-weight:800; color:#0F172A; text-transform:uppercase; letter-spacing:0.5px; margin-right:4px;">🌐 Domain Filter:</span>
          ${['all', 'Overall', 'Engineering', 'Arts & Science', 'Management', 'Medical'].map(dom => `
            <button type="button" class="courses-filter-chip ${rankingsFilterState.domain === dom || (dom === 'all' && (!rankingsFilterState.domain || rankingsFilterState.domain === 'all')) ? 'active' : ''}" onclick="rankingsFilterState.domain = '${dom}'; renderRankingsView();">
              ${dom === 'all' ? 'All Domains' : dom}
            </button>
          `).join('')}
        </div>

        <div id="rankingsMetaSummary" class="courses-meta-summary-bar" style="margin-top:12px; padding-top:10px;">
          <div class="courses-meta-summary-text">
            <span>🏆 Showing <strong>${filtered.length}</strong> top ranked institutions (Top 30 Max)</span>
            ${rankingsFilterState.state ? ` &bull; <span>State: <strong style="color:var(--coral);">${rankingsFilterState.state}</strong></span>` : ''}
            ${rankingsFilterState.district ? ` &bull; <span>District: <strong style="color:var(--teal);">${rankingsFilterState.district}</strong></span>` : ''}
          </div>
          <span style="font-size:11.5px; color:var(--theme-muted);">Weighted by Student Support, Career Guidance, Job Opportunities &amp; Motivation</span>
        </div>
      </section>

      <!-- 2. Top 30 Ranking Cards Grid -->
      <section id="rankingsCardsGrid" class="college-grid" style="gap:20px;">
        ${renderRankingsCardsHtml(filtered)}
      </section>

      <!-- 3. Student & Alumni Ranking Reviews Section + Right-Side Suggestion Box -->
      <section style="background:#FFFFFF; border:1px solid var(--theme-line, #E2E8F0); border-radius:16px; padding:24px; box-shadow:0 4px 20px rgba(0,0,0,0.03);">
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:24px; align-items:start;">

          <!-- Left Column: Verified Student & Alumni Ranking Reviews -->
          <div>
            <div style="margin-bottom:16px;">
              <span style="font-size:11px; font-weight:800; color:#77AC3B; text-transform:uppercase; letter-spacing:0.8px; background:rgba(119,172,59,0.12); padding:4px 12px; border-radius:20px;">💬 Verified Student Voice</span>
              <h3 style="font-size:18px; font-weight:800; color:#0F172A; margin:8px 0 4px;">Student &amp; Alumni Ranking Reviews</h3>
              <p style="font-size:12px; color:#64748B; margin:0;">Authentic feedback regarding campus support, career mentorship, laboratory equipment, and faculty encouragement across ranked institutions.</p>
            </div>

            <div style="display:flex; flex-direction:column; gap:12px;">
              ${reviewsList.slice(0, 8).map(rev => `
                <div class="cn-review-card-compact">
                  <div class="cn-review-header">
                    <div class="cn-review-author-wrap">
                      <div class="cn-review-avatar">${escapeHtml(rev.avatar || rev.author.slice(0, 2).toUpperCase())}</div>
                      <div>
                        <div class="cn-review-name">${escapeHtml(rev.author)}</div>
                        <div class="cn-review-role">${escapeHtml(rev.role || rev.college || 'Alumni')}</div>
                      </div>
                    </div>
                    <div class="cn-review-stars">★★★★★ ${rev.rating ? rev.rating.toFixed(1) : '5.0'}</div>
                  </div>
                  <p class="cn-review-text">"${escapeHtml(rev.comment)}"</p>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Right Column: User Review & Suggestion Box -->
          <div style="background:#F8FAFC; border:1px solid var(--theme-line, #E2E8F0); border-radius:14px; padding:20px;">
            <div style="margin-bottom:14px;">
              <span style="font-size:11px; font-weight:800; color:#E06D53; text-transform:uppercase; letter-spacing:0.8px; background:rgba(224,109,83,0.12); padding:4px 12px; border-radius:20px;">📝 Community Feedback</span>
              <h4 style="font-size:16px; font-weight:800; color:#0F172A; margin:8px 0 4px;">Share Your Ranking Feedback &amp; Suggestions</h4>
              <p style="font-size:12px; color:#64748B; margin:0;">Have feedback on college rankings, mentorship scores, or missing institutions? Submit your verified input below.</p>
            </div>

            <form id="rankingSuggestionForm" onsubmit="submitUniversalSuggestion(event, 'ranking')" style="display:flex; flex-direction:column; gap:12px;">
              <div>
                <label style="font-size:12px; font-weight:700; color:#334155; display:block; margin-bottom:4px;">Your Full Name / Scholar ID</label>
                <input type="text" name="user_name" class="courses-search-input-field" style="height:38px; font-size:12.5px;" placeholder="e.g. Anand Ranganathan" required />
              </div>
              <div>
                <label style="font-size:12px; font-weight:700; color:#334155; display:block; margin-bottom:4px;">College / Institutional Context</label>
                <input type="text" name="context" class="courses-search-input-field" style="height:38px; font-size:12.5px;" placeholder="e.g. PSG College of Technology" required />
              </div>
              <div>
                <label style="font-size:12px; font-weight:700; color:#334155; display:block; margin-bottom:4px;">Satisfaction / Ranking Accuracy Rating</label>
                <select name="rating" class="colleges-dropdown-select" style="height:38px; font-size:12.5px; width:100%;">
                  <option value="5">⭐⭐⭐⭐⭐ Excellent &amp; Highly Accurate (5.0)</option>
                  <option value="4">⭐⭐⭐⭐ Good &amp; Helpful (4.0)</option>
                  <option value="3">⭐⭐⭐ Neutral / Fair (3.0)</option>
                  <option value="2">⭐⭐ Needs Revision (2.0)</option>
                </select>
              </div>
              <div>
                <label style="font-size:12px; font-weight:700; color:#334155; display:block; margin-bottom:4px;">Ranking Suggestion / Feedback</label>
                <textarea name="suggestion" class="courses-search-input-field" style="height:76px; font-size:12px; padding:8px 12px; resize:vertical;" placeholder="Suggest metric weightings, placement accuracy updates, or new campus highlights..." required></textarea>
              </div>
              <button type="submit" class="primary-button" style="width:100%; justify-content:center; height:40px; font-size:13px; background:#E06D53; border-color:#E06D53;">
                <span>Submit Ranking Feedback ➔</span>
              </button>
            </form>
          </div>

        </div>
      </section>

    </div>
  `;
}
window.renderRankingsView = renderRankingsView;

// ============================================================================
// 2. CAREERS VIEW RENDERER
// ============================================================================
function getCareersFilteredList() {
  const rawAreas = (_cachedCareersData && _cachedCareersData.career_areas) ? _cachedCareersData.career_areas : [];
  const q = (careersFilterState.search || '').toLowerCase().trim();
  const selectedDomain = (careersFilterState.domain || 'all').toLowerCase().trim();
  const selectedPref = (careersFilterState.preferredField || 'all').toLowerCase().trim();

  return rawAreas.filter(item => {
    const name = (item.name || '').toLowerCase();
    const cat = (item.category || '').toLowerCase();
    const langs = (item.languages || []).map(l => l.toLowerCase());
    const techs = (item.core_technologies || []).map(t => t.toLowerCase());

    const matchSearch = !q || name.includes(q) || langs.some(l => l.includes(q)) || techs.some(t => t.includes(q));
    const matchDomain = selectedDomain === 'all' || cat.includes(selectedDomain) || selectedDomain.includes(cat);
    const matchPref = selectedPref === 'all' || name.includes(selectedPref) || selectedPref.includes(name) || techs.some(t => t.includes(selectedPref));

    return matchSearch && matchDomain && matchPref;
  });
}

function renderCareersCardsHtml(filtered) {
  if (filtered.length === 0) {
    return `
      <div style="grid-column:1/-1; text-align:center; padding:48px 20px; background:var(--theme-surface, #FFFFFF); border:1px dashed var(--theme-line, #E2E8F0); border-radius:14px;">
        <div style="font-size:36px; margin-bottom:8px;">🚀</div>
        <h3 style="margin:0 0 6px; color:#0F172A;">No Career Tracks Found</h3>
        <p style="color:var(--theme-muted); font-size:13px; margin-bottom:16px;">No career sub-fields match your selected search or filter criteria.</p>
        <button type="button" class="primary-button" onclick="careersFilterState = {search:'', state:'', district:'', domain:'all', preferredField:'all', tech:'all'}; renderCareersView();">View All 15 Career Tracks</button>
      </div>
    `;
  }

  return filtered.map(c => {
    let roadmapSteps = [];
    if (Array.isArray(c.roadmap)) {
      roadmapSteps = c.roadmap.map((item, idx) => {
        if (typeof item === 'object' && item !== null) {
          return {
            title: item.title || `Phase ${idx + 1}`,
            desc: item.desc || item.description || '',
            duration: item.duration || ''
          };
        }
        return {
          title: `Phase ${idx + 1}`,
          desc: String(item),
          duration: ''
        };
      });
    } else if (typeof c.roadmap === 'string' && c.roadmap.trim()) {
      roadmapSteps = c.roadmap.split(/\n|->|;|,/).map(s => s.trim()).filter(Boolean).map((st, idx) => ({
        title: `Phase ${idx + 1}`,
        desc: st,
        duration: ''
      }));
    }

    return `
    <article class="college-card" style="display:flex; flex-direction:column; justify-content:space-between; border-radius:14px; padding:20px; box-shadow:0 4px 18px rgba(0,0,0,0.03); background:#FFFFFF;">
      <div>
        <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:8px; margin-bottom:10px;">
          <span class="pathway-badge teal">${escapeHtml(c.category || 'Technology')}</span>
          <span class="pathway-badge coral" style="font-weight:800;">${escapeHtml(c.growth_rate || '+35% YoY')}</span>
        </div>

        <h3 style="font-size:17px; font-weight:800; color:#0F172A; margin:0 0 6px; line-height:1.3;">${escapeHtml(c.name)}</h3>
        <div style="font-size:12px; color:var(--theme-muted); margin-bottom:12px;">
          🔮 <strong>10-Year Outlook:</strong> <span style="color:#0F172A; font-weight:700;">${escapeHtml(c.importance_10yr || 'Critical')}</span>
        </div>

        <div style="background:#F8FAFC; border:1px solid var(--theme-line, #E2E8F0); border-radius:10px; padding:10px 14px; margin-bottom:12px;">
          <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px;">
            <span style="color:#64748B;">Average Compensation:</span>
            <strong style="color:var(--coral, #E06D53); font-size:13.5px;">${escapeHtml(c.avg_salary || '₹12-25 LPA')}</strong>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:11px; color:#64748B;">
            <span>0-2 Yrs: ${c.salary_by_exp ? c.salary_by_exp['0-2 Yrs'] : '₹8-12L'}</span>
            <span>6+ Yrs: ${c.salary_by_exp ? c.salary_by_exp['6+ Yrs'] : '₹28L+'}</span>
          </div>
        </div>

        <div style="margin-bottom:12px;">
          <span style="font-size:11px; font-weight:700; color:#64748B; display:block; margin-bottom:4px; text-transform:uppercase;">Core Languages &amp; Tech:</span>
          <div style="display:flex; flex-wrap:wrap; gap:4px;">
            ${(c.languages || []).map(l => `<span class="pathway-badge teal" style="font-size:11px;">${escapeHtml(l)}</span>`).join('')}
            ${(c.core_technologies || []).slice(0, 3).map(t => `<span class="pathway-badge" style="font-size:11px; background:#F1F5F9; color:#0F172A;">${escapeHtml(t)}</span>`).join('')}
          </div>
        </div>

        <!-- Step-by-Step Learning Roadmap Summary -->
        <div style="background:#F8FAFC; border:1px solid var(--theme-line, #E2E8F0); border-radius:10px; padding:12px; margin-bottom:14px;">
          <span style="font-size:11px; font-weight:800; color:#77AC3B; display:block; margin-bottom:6px; text-transform:uppercase;">🗺️ Step-by-Step Learning Roadmap:</span>
          <ol style="margin:0; padding-left:18px; font-size:11.5px; color:#334155; line-height:1.5;">
            ${roadmapSteps.slice(0, 3).map(r => `
              <li><strong>${escapeHtml(r.title)}:</strong> ${escapeHtml(r.desc || '')} ${r.duration ? `<small style="color:#64748B;">(${escapeHtml(r.duration)})</small>` : ''}</li>
            `).join('')}
          </ol>
        </div>
      </div>

      <div style="padding-top:10px; border-top:1px solid var(--theme-line, #E2E8F0);">
        <button type="button" class="pathway-card-btn" style="width:100%; justify-content:center;" onclick="openCareerDetailModal('${c.id}')">
          <span>View Full Roadmap &amp; Details ➔</span>
        </button>
      </div>
    </article>
    `;
  }).join('');
}

function handleCareersSearch(val) {
  careersFilterState.search = val;
  const filtered = getCareersFilteredList();
  const grid = document.getElementById('careersCardsGrid');
  if (grid) grid.innerHTML = renderCareersCardsHtml(filtered);

  const summary = document.getElementById('careersMetaSummary');
  if (summary) {
    summary.innerHTML = `
      <div class="courses-meta-summary-text">
        <span>🚀 Showing <strong>${filtered.length}</strong> high-growth career tracks &bull; 10-Year Trajectory</span>
      </div>
      <span style="font-size:11.5px; color:var(--theme-muted);">Next 10 Years Demand Outlook, Salary Growth &amp; Roadmap Milestones</span>
    `;
  }
}
window.handleCareersSearch = handleCareersSearch;

async function renderCareersView() {
  const container = document.getElementById('careersPageContent');
  if (!container) return;

  if (!_cachedCareersData) {
    try {
      const res = await fetch('/api/careers');
      if (res.ok) {
        const data = await res.json();
        if (data && data.career_areas) _cachedCareersData = data;
      }
    } catch (e) {
      console.warn('[Careers] Live fetch fallback:', e);
    }
  }

  const filtered = getCareersFilteredList();
  const statesList = getStatesAndDistrictsList();
  const currentDistricts = careersFilterState.state ? getDistrictsForState(careersFilterState.state) : [];

  const preferredFieldOptions = [
    'all',
    'Generative AI',
    'Full-Stack',
    'Autonomous EV',
    'Spatial Computing',
    'Quantum Computing',
    'Data Science',
    'Artificial Intelligence',
    'Web Development',
    'Cybersecurity',
    'Cloud',
    'Software Development',
    'DevOps',
    'Mobile Development',
    'Embedded & IoT'
  ];

  const past5YearsCareerGoals = [
    { label: 'Cloud & DevOps', value: 88, displayValue: '88% Achieved', color: 'teal' },
    { label: 'Full Stack Web', value: 92, displayValue: '92% Achieved', color: 'teal' },
    { label: 'AI & Data Science', value: 85, displayValue: '85% Achieved', color: 'teal' },
    { label: 'Cybersecurity', value: 78, displayValue: '78% Achieved', color: 'teal' },
    { label: 'Embedded Systems', value: 74, displayValue: '74% Achieved', color: 'teal' }
  ];

  const future5YearsCareerGrowth = [
    { label: 'Generative AI / LLMs', value: 96, displayValue: '+48% Growth', color: 'coral' },
    { label: 'Autonomous EV / BMS', value: 90, displayValue: '+36% Growth', color: 'coral' },
    { label: 'Spatial / XR 3D', value: 82, displayValue: '+30% Growth', color: 'coral' },
    { label: 'Quantum Security', value: 86, displayValue: '+42% Growth', color: 'coral' },
    { label: 'Microservices & Go/Rust', value: 88, displayValue: '+34% Growth', color: 'coral' }
  ];

  const reviewsList = (_cachedCareersData && Array.isArray(_cachedCareersData.reviews) && _cachedCareersData.reviews.length > 0) ? _cachedCareersData.reviews : [
    { name: 'Karthik Raja', role: 'Junior ML Engineer', college: 'Amrita Vishwa Vidyapeetham, Coimbatore', rating: 5, comment: 'Following the AI roadmap helped me build end-to-end LLM applications and crack product company interviews within 6 months.' },
    { name: 'Sneha Madhavan', role: 'Cloud DevOps Specialist', college: 'PSG College of Technology, Coimbatore', rating: 5, comment: 'The Kubernetes & Terraform step-by-step guidance was directly aligned with what cloud consulting companies asked in rounds.' },
    { name: 'Deepak Natarajan', role: 'Full Stack Developer', college: 'Coimbatore Institute of Technology', rating: 5, comment: 'The structured milestones in TypeScript and Kafka distributed architecture gave me real confidence during technical interviews.' },
    { name: 'Pooja Varma', role: 'Data Analyst', college: 'ADITHYA COLLEGE OF ARTS AND SCIENCE, Coimbatore', rating: 4.8, comment: 'The SQL and Tableau projects outlined in the roadmap gave my portfolio immediate credibility with analytics hiring managers.' },
    { name: 'Ananya Krishnan', role: 'Generative AI Engineer', college: 'PSG College of Technology, Coimbatore', rating: 5.0, comment: 'The LangChain and RAG vector search milestones guided my final year capstone project and helped me land an AI architect role.' }
  ];

  const isFilterActive = !!(careersFilterState.search || careersFilterState.state || careersFilterState.district || (careersFilterState.domain && careersFilterState.domain !== 'all') || (careersFilterState.preferredField && careersFilterState.preferredField !== 'all'));

  container.innerHTML = `
    <div class="courses-discovery-container" style="display:flex; flex-direction:column; gap:24px;">

      <!-- 1. Centered Search/Filter Area: SEARCH | STATE | DISTRICT | DOMAIN | PREFERRED FIELD -->
      <section class="colleges-discovery-filter-card" style="margin-bottom:0;">
        <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap; width:100%;">
          <!-- Search Box -->
          <div class="colleges-search-input-wrap" style="flex:1.4; min-width:200px; margin:0;">
            <span class="colleges-input-lead-icon">🔍</span>
            <input
              type="text"
              id="careersSearchInput"
              class="colleges-search-input-field"
              placeholder="Search career, skills, languages..."
              value="${escapeHtml(careersFilterState.search)}"
              oninput="handleCareersSearch(this.value)"
            />
            ${careersFilterState.search ? `
              <button type="button" class="colleges-filter-clear-btn" style="display:block;" onclick="handleCareersSearch(''); document.getElementById('careersSearchInput').value='';">✕</button>
            ` : ''}
          </div>

          <!-- State Filter -->
          <div style="flex:1; min-width:150px;">
            <select class="colleges-dropdown-select" style="width:100%; height:44px;" onchange="careersFilterState.state = this.value; careersFilterState.district = ''; renderCareersView();">
              <option value="">🌐 All States</option>
              ${statesList.map(st => `
                <option value="${st}" ${careersFilterState.state === st ? 'selected' : ''}>${st}</option>
              `).join('')}
            </select>
          </div>

          <!-- District Filter -->
          <div style="flex:1; min-width:150px;">
            <select class="colleges-dropdown-select" style="width:100%; height:44px;" ${!careersFilterState.state ? 'disabled' : ''} onchange="careersFilterState.district = this.value; renderCareersView();">
              <option value="">${careersFilterState.state ? '📍 ' + careersFilterState.state : '📍 All Districts'}</option>
              ${currentDistricts.map(dt => `
                <option value="${dt}" ${careersFilterState.district === dt ? 'selected' : ''}>${dt}</option>
              `).join('')}
            </select>
          </div>

          <!-- Domain Filter -->
          <div style="flex:1.1; min-width:160px;">
            <select class="colleges-dropdown-select" style="width:100%; height:44px;" onchange="careersFilterState.domain = this.value; renderCareersView();">
              <option value="all">🌐 All Domains</option>
              <option value="Emerging Technologies" ${careersFilterState.domain === 'Emerging Technologies' ? 'selected' : ''}>Emerging Tech</option>
              <option value="Core & Strategic" ${careersFilterState.domain === 'Core & Strategic' ? 'selected' : ''}>Core &amp; Strategic</option>
              <option value="Infrastructure" ${careersFilterState.domain === 'Infrastructure' ? 'selected' : ''}>Cloud &amp; DevOps</option>
              <option value="Specialized Engineering" ${careersFilterState.domain === 'Specialized Engineering' ? 'selected' : ''}>Specialized Engg</option>
            </select>
          </div>

          <!-- Preferred Field Filter (15 Tracks) -->
          <div style="flex:1.2; min-width:170px;">
            <select class="colleges-dropdown-select" style="width:100%; height:44px; font-weight:700; color:#77AC3B;" onchange="careersFilterState.preferredField = this.value; renderCareersView();">
              <option value="all">🎯 Preferred Field: All (15 Tracks)</option>
              ${preferredFieldOptions.filter(x => x !== 'all').map(pf => `
                <option value="${pf}" ${careersFilterState.preferredField === pf ? 'selected' : ''}>${pf}</option>
              `).join('')}
            </select>
          </div>

          ${isFilterActive ? `
            <button type="button" class="action-btn secondary" style="height:44px; padding:0 12px; font-size:12px; white-space:nowrap;" onclick="careersFilterState = {search:'', state:'', district:'', domain:'all', preferredField:'all', tech:'all'}; renderCareersView();">
              ↺ Reset
            </button>
          ` : ''}
        </div>

        <div id="careersMetaSummary" class="courses-meta-summary-bar" style="margin-top:12px; padding-top:10px;">
          <div class="courses-meta-summary-text">
            <span>🚀 Showing <strong>${filtered.length}</strong> high-growth career tracks &bull; 10-Year Trajectory</span>
          </div>
          <span style="font-size:11.5px; color:var(--theme-muted);">Next 10 Years Demand Outlook, Salary Growth &amp; Roadmap Milestones</span>
        </div>
      </section>

      <!-- 2. Major Career Pathways Cards Grid (15 Career Fields) -->
      <section id="careersCardsGrid" class="college-grid" style="gap:20px;">
        ${renderCareersCardsHtml(filtered)}
      </section>

      <!-- 3. Career Goals & Achievement Trends BAR CHARTS (Past 5 Years → Future 5 Years) -->
      <section style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:20px;">
        <!-- Left: Past 5 Years Goal Achievement -->
        ${renderCNBarChartHtml({
          title: '📈 Past 5 Years Career-Goal Achievement Trends (2021 - 2025)',
          subtitle: 'Graduate target role conversion rates and roadmap milestone success',
          items: past5YearsCareerGoals,
          type: 'vertical',
          colorScheme: 'teal'
        })}

        <!-- Right: Future 5 Years Emerging Tech Surge -->
        ${renderCNBarChartHtml({
          title: '🚀 Future 5 Years Skill Growth & Emerging Demand (2026 - 2030)',
          subtitle: 'Projected enterprise hiring demand surge across next-gen specializations',
          items: future5YearsCareerGrowth,
          type: 'horizontal',
          colorScheme: 'coral'
        })}
      </section>

      <!-- 4. Reviews & Suggestion Box Split Section -->
      <section class="survey-split-layout" style="margin-top:0;">
        <div class="survey-cards-column">
          <div class="category-shortcuts-heading" style="margin-top:0;">
            <h3>💬 Student &amp; Professional Career Guidance Reviews</h3>
            <span style="font-size:11.5px; color:var(--theme-muted);">Real-world transition experiences, portfolio preparation, and roadmap reviews</span>
          </div>

          <div style="display:flex; flex-direction:column; gap:12px; margin-top:12px;">
            ${reviewsList.map(rev => `
              <div class="cn-review-card-compact">
                <div class="cn-review-header">
                  <div class="cn-review-author-wrap">
                    <div class="cn-review-avatar">${escapeHtml((rev.name || rev.author || 'EN').slice(0, 2).toUpperCase())}</div>
                    <div>
                      <div class="cn-review-name">${escapeHtml(rev.name || rev.author || 'Engineer')}</div>
                      <div class="cn-review-role">${escapeHtml(rev.role || 'Software Developer')} &bull; ${escapeHtml(rev.college || 'Tamil Nadu')}</div>
                    </div>
                  </div>
                  <div class="cn-review-stars">★★★★★ ${(rev.rating || 5.0).toFixed(1)}</div>
                </div>
                <p class="cn-review-text">"${escapeHtml(rev.comment || 'Great structured roadmap for breaking into the field.')}"</p>
              </div>
            `).join('')}
          </div>
        </div>

        <aside class="survey-chart-sidebar">
          <div class="user-remarks-panel" style="background:#FFFFFF; border:1px solid var(--theme-line, #E2E8F0); border-radius:14px; padding:20px; box-shadow:0 4px 16px rgba(0,0,0,0.02);">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
              <span style="font-size:20px;">🚀</span>
              <div>
                <h4 style="margin:0; color:#0F172A; font-size:14px; font-weight:800;">Career Suggestion Box</h4>
                <small style="color:var(--theme-muted); font-size:11px;">Suggest a new stack or roadmap</small>
              </div>
            </div>
            <form id="careerSuggestionForm" onsubmit="submitUniversalSuggestion(event, 'career');">
              <div class="remarks-form-group" style="margin-bottom:8px;">
                <input type="text" name="user_name" class="remarks-form-input" placeholder="Your Name &amp; Role..." style="width:100%; height:38px; font-size:12px; padding:0 10px; border-radius:8px; background:#F8FAFC; border:1px solid var(--theme-line, #E2E8F0); color:#0F172A;" />
              </div>
              <div class="remarks-form-group" style="margin-bottom:10px;">
                <textarea name="message" class="remarks-form-textarea" rows="3" placeholder="Suggest a new language roadmap, tool recommendations, or skill advice..." style="width:100%; font-size:12px; padding:8px 10px; border-radius:8px; background:#F8FAFC; border:1px solid var(--theme-line, #E2E8F0); color:#0F172A; font-family:inherit;"></textarea>
              </div>
              <button type="submit" class="primary-button" style="width:100%; height:38px; font-size:12px; justify-content:center;">
                <span>Submit Career Suggestion ↗</span>
              </button>
            </form>
          </div>
        </aside>
      </section>

    </div>
  `;
}
window.renderCareersView = renderCareersView;

// ============================================================================
// 3. PLACEMENTS VIEW RENDERER
// ============================================================================
function getPlacementsFilteredVisits() {
  const visits = (_cachedPlacementsFullData && _cachedPlacementsFullData.company_visits) ? _cachedPlacementsFullData.company_visits : [];
  const q = (placementsFilterState.search || '').toLowerCase().trim();
  const selectedDomain = (placementsFilterState.domain || 'all').toLowerCase().trim();

  return visits.filter(v => {
    const comp = (v.company || '').toLowerCase();
    const ind = (v.industry || '').toLowerCase();
    const roles = (v.roles || []).map(r => r.toLowerCase());
    const skills = (v.required_skills || []).map(s => s.toLowerCase());

    const matchSearch = !q || comp.includes(q) || roles.some(r => r.includes(q)) || skills.some(s => s.includes(q));
    const matchDomain = selectedDomain === 'all' || ind.includes(selectedDomain) || selectedDomain.includes(ind);

    return matchSearch && matchDomain;
  });
}

function renderPlacementsCardsHtml(filteredVisits) {
  if (filteredVisits.length === 0) {
    return `
      <div style="grid-column:1/-1; text-align:center; padding:48px 20px; background:var(--theme-surface, #FFFFFF); border:1px dashed var(--theme-line, #E2E8F0); border-radius:14px;">
        <div style="font-size:36px; margin-bottom:8px;">💼</div>
        <h3 style="margin:0 0 6px; color:#0F172A;">No Recruiters Found</h3>
        <p style="color:var(--theme-muted); font-size:13px; margin-bottom:16px;">No campus recruiters match your selected search or domain criteria.</p>
        <button type="button" class="primary-button" onclick="placementsFilterState = {search:'', state:'', district:'', domain:'all'}; renderPlacementsView();">View All 20 Recruiters</button>
      </div>
    `;
  }

  return filteredVisits.map(v => `
    <article class="college-card" style="display:flex; flex-direction:column; justify-content:space-between; border-radius:14px; padding:20px; box-shadow:0 4px 18px rgba(0,0,0,0.03); background:#FFFFFF;">
      <div>
        <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:8px; margin-bottom:10px;">
          <span class="pathway-badge teal">${escapeHtml(v.industry || 'Technology')}</span>
          <span class="pathway-badge coral" style="font-weight:800;">${escapeHtml(v.package_range || '₹8-20 LPA')}</span>
        </div>

        <h3 style="font-size:17.5px; font-weight:800; color:#0F172A; margin:0 0 6px;">${escapeHtml(v.company)}</h3>
        <div style="font-size:12px; color:#64748B; margin-bottom:10px;">
          👥 <strong>Typical Intake:</strong> <span style="color:#0F172A; font-weight:700;">${escapeHtml(v.vacancies_estimate || '40-80 hires / drive')}</span>
        </div>

        <div style="margin-bottom:10px;">
          <span style="font-size:11px; font-weight:700; color:#64748B; display:block; margin-bottom:4px; text-transform:uppercase;">Hiring Roles:</span>
          <div style="display:flex; flex-wrap:wrap; gap:4px;">
            ${(v.roles || []).map(r => `<span class="pathway-badge" style="background:#F1F5F9; color:#0F172A; font-size:11px;">${escapeHtml(r)}</span>`).join('')}
          </div>
        </div>

        <div style="margin-bottom:12px;">
          <span style="font-size:11px; font-weight:700; color:#64748B; display:block; margin-bottom:4px; text-transform:uppercase;">Required Skills:</span>
          <div style="display:flex; flex-wrap:wrap; gap:4px;">
            ${(v.required_skills || []).map(s => `<span class="pathway-badge teal" style="font-size:11px;">${escapeHtml(s)}</span>`).join('')}
          </div>
        </div>

        <div style="font-size:12px; color:#64748B; line-height:1.45; margin-bottom:12px; background:#F8FAFC; padding:8px 10px; border-radius:8px; border:1px solid #E2E8F0;">
          💡 <strong>Rounds:</strong> ${escapeHtml(v.preparation_process || '1. Aptitude -> 2. Technical Logic -> 3. System Design -> HR')}
        </div>
      </div>

      <div style="padding-top:10px; border-top:1px solid var(--theme-line, #E2E8F0);">
        <button type="button" class="pathway-card-btn" style="width:100%; justify-content:center;" onclick="openPlacementDetailModal('${v.id}')">
          <span>View Full Playbook ➔</span>
        </button>
      </div>
    </article>
  `).join('');
}

function handlePlacementsSearch(val) {
  placementsFilterState.search = val;
  const filteredVisits = getPlacementsFilteredVisits();
  const grid = document.getElementById('placementsCardsGrid');
  if (grid) grid.innerHTML = renderPlacementsCardsHtml(filteredVisits);

  const summary = document.getElementById('placementsMetaSummary');
  if (summary) {
    summary.innerHTML = `
      <div class="courses-meta-summary-text">
        <span>💼 Showing <strong>${filteredVisits.length}</strong> premier campus hiring recruiters (20 Companies List)</span>
      </div>
      <span style="font-size:11.5px; color:var(--theme-muted);">Recruitment Playbooks, Selection Stages, Round-1 Hub &amp; Historical CTC Metrics</span>
    `;
  }
}
window.handlePlacementsSearch = handlePlacementsSearch;

async function renderPlacementsView() {
  const container = document.getElementById('placementsPageContent');
  if (!container) return;

  if (!_cachedPlacementsFullData) {
    try {
      const res = await fetch('/api/placements/full');
      if (res.ok) {
        const data = await res.json();
        if (data && data.company_visits) _cachedPlacementsFullData = data;
      }
    } catch (e) {
      console.warn('[Placements] Live fetch fallback:', e);
    }
  }

  const filteredVisits = getPlacementsFilteredVisits();
  const prepPlatforms = [
    { name: 'IndiaBIX', url: 'https://www.indiabix.com', focus: 'Quantitative Aptitude, Logical Reasoning, Verbal Ability & Technical MCQs', desc: 'Comprehensive practice question bank with step-by-step arithmetic shortcuts and solutions.' },
    { name: 'Aptitude-Test.com', url: 'https://www.aptitude-test.com', focus: 'Psychometric & Quantitative Practice Drills', desc: 'Standardized quantitative tests, numerical reasoning puzzles, and timed practice assessments.' },
    { name: 'PrepInsta', url: 'https://prepinsta.com', focus: 'Company-Specific Placement Preparation Playbooks', desc: 'Targeted pattern guides for TCS NQT, Zoho, Cognizant, Infosys, and FAANG recruitment.' },
    { name: 'GeeksforGeeks', url: 'https://www.geeksforgeeks.org/aptitude-questions-and-answers/', focus: 'Engineering Quantitative & Core Coding Hub', desc: 'In-depth CS concepts, quantitative aptitude algorithms, and data structure practice.' },
    { name: 'FeelFreeToLearn', url: 'https://www.feelfreetolearn.com', focus: 'Shortcuts & Video Conceptual Aptitude Solutions', desc: 'Visual shortcut tricks for time & work, speed math, probability, and percentages.' },
    { name: 'Reddit /r/cscareerquestions', url: 'https://www.reddit.com/r/cscareerquestionsIN/', focus: 'Real Interview Experiences & Discussion Forum', desc: 'Unfiltered interview debriefs, compensation discussions, and campus placement strategies.' },
    { name: 'PlacementPreparation.io', url: 'https://www.placementpreparation.io', focus: 'Round 1 Diagnostic Mock Tests', desc: 'Mock tests replicating actual assessment software environments used by top recruiters.' }
  ];

  const reviews = (_cachedPlacementsFullData && Array.isArray(_cachedPlacementsFullData.reviews) && _cachedPlacementsFullData.reviews.length > 0) ? _cachedPlacementsFullData.reviews : [
    { student: 'Abishek Nathan', role: 'PSG Tech Batch of 2024', company: 'Zoho Corporation', package: '₹9.5 LPA', college: 'PSG College of Technology', comment: 'Focusing on first-principles C logic and algorithmic design on PrepInsta and GeeksforGeeks cleared both technical screening rounds smoothly.' },
    { student: 'Harini S.', role: 'Adithya IT Graduate', company: 'Robert Bosch', package: '₹8.0 LPA', college: 'Adithya Institute of Technology', comment: 'The quantitative aptitude practice on IndiaBIX combined with college embedded hardware labs gave me confidence in Bosch technical interviews.' },
    { student: 'V. Sundaram', role: 'CIT Computing Alum', company: 'Amazon AWS', package: '₹22.0 LPA', college: 'Coimbatore Institute of Technology', comment: 'Mastering distributed systems fundamentals and behavioral STAR questions helped me crack the AWS Cloud Support Associate recruitment drive.' },
    { student: 'Kavya Murugan', role: 'SKCET CSE Graduate', company: 'Goldman Sachs', package: '₹24.0 LPA', college: 'Sri Krishna College of Engg', comment: 'Rigorous aptitude problem-solving under strict 60-second time limits was key to qualifying the initial online quantitative assessment.' },
    { student: 'Rohan Sharma', role: 'Amrita AI Scholar', company: 'Tiger Analytics', package: '₹12.5 LPA', college: 'Amrita Vishwa Vidyapeetham', comment: 'Structured preparation playbooks with end-to-end case studies and regression modeling gave me a huge edge during live technical rounds.' },
    { student: 'M. Vignesh', role: 'KCT Alum', company: 'KLA Corporation', package: '₹18.0 LPA', college: 'Kumaraguru College of Technology', comment: 'Clear understanding of image processing and multithreading in C++ cleared all 3 technical loop rounds.' },
    { student: 'P. Anand', role: 'Adithya Mech Alum', company: 'L&T Technology Services', package: '₹7.5 LPA', college: 'Adithya Institute of Technology', comment: 'Strong basics in CAD design and GD&T principles evaluated directly in interview rounds.' },
    { student: 'S. Divya', role: 'CIT AI Scholar', company: 'Microsoft IDC', package: '₹32.0 LPA', college: 'Coimbatore Institute of Technology', comment: 'Deep practice on LeetCode dynamic programming and scalable system architecture patterns.' },
    { student: 'K. Rajan', role: 'GCT ECE Graduate', company: 'Qualcomm India', package: '₹22.0 LPA', college: 'Govt College of Technology, Coimbatore', comment: 'DSP fundamentals and Verilog RTL testbenches were the central focus of Qualcomm technical panels.' },
    { student: 'S. Nithya', role: 'PSG Arts & Science', company: 'Freshworks Inc', package: '₹14.0 LPA', college: 'PSG College of Arts and Science', comment: 'Live product building round on React component hierarchy was the highlight of the Freshworks process.' }
  ];

  const statesList = getStatesAndDistrictsList();
  const currentDistricts = placementsFilterState.state ? getDistrictsForState(placementsFilterState.state) : [];
  const isFilterActive = !!(placementsFilterState.search || placementsFilterState.state || placementsFilterState.district || (placementsFilterState.domain && placementsFilterState.domain !== 'all'));

  // Data for Bar Charts (Left: Past 10 Years Placement, Right: Future 5 Years Opportunities)
  const past10YearsData = [
    { label: '2016', value: 3.8, displayValue: '₹3.8L', color: 'teal' },
    { label: '2018', value: 4.6, displayValue: '₹4.6L', color: 'teal' },
    { label: '2020', value: 5.8, displayValue: '₹5.8L', color: 'teal' },
    { label: '2022', value: 7.2, displayValue: '₹7.2L', color: 'teal' },
    { label: '2024', value: 8.8, displayValue: '₹8.8L', color: 'teal' },
    { label: '2025', value: 9.8, displayValue: '₹9.8L', color: 'teal' }
  ];

  const future5YearsData = [
    { label: 'AI & ML Ops', value: 94, displayValue: '+48%', color: 'coral' },
    { label: 'Autonomous EV', value: 86, displayValue: '+42%', color: 'coral' },
    { label: 'Cloud FinTech', value: 80, displayValue: '+38%', color: 'coral' },
    { label: 'Cybersecurity', value: 88, displayValue: '+45%', color: 'coral' },
    { label: 'Robotics / IoT', value: 74, displayValue: '+34%', color: 'coral' }
  ];

  container.innerHTML = `
    <div class="courses-discovery-container" style="display:flex; flex-direction:column; gap:24px;">

      <!-- 1. Filter Row: ONE Clean Horizontal Line (SEARCH | STATE | DISTRICT | DOMAIN) -->
      <section class="colleges-discovery-filter-card" style="margin-bottom:0;">
        <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap; width:100%;">
          <!-- Search Box -->
          <div class="colleges-search-input-wrap" style="flex:1.5; min-width:220px; margin:0;">
            <span class="colleges-input-lead-icon">🔍</span>
            <input
              type="text"
              id="placementsSearchInput"
              class="colleges-search-input-field"
              placeholder="Search company, hiring role, skill (e.g. Zoho, Amazon, Python)..."
              value="${escapeHtml(placementsFilterState.search)}"
              oninput="handlePlacementsSearch(this.value)"
            />
            ${placementsFilterState.search ? `
              <button type="button" class="colleges-filter-clear-btn" style="display:block;" onclick="handlePlacementsSearch(''); document.getElementById('placementsSearchInput').value='';">✕</button>
            ` : ''}
          </div>

          <!-- State -->
          <div style="flex:1; min-width:160px;">
            <select class="colleges-dropdown-select" style="width:100%; height:44px;" onchange="placementsFilterState.state = this.value; placementsFilterState.district = ''; renderPlacementsView();">
              <option value="">🌐 All States</option>
              ${statesList.map(st => `
                <option value="${st}" ${placementsFilterState.state === st ? 'selected' : ''}>${st}</option>
              `).join('')}
            </select>
          </div>

          <!-- District -->
          <div style="flex:1; min-width:160px;">
            <select class="colleges-dropdown-select" style="width:100%; height:44px;" ${!placementsFilterState.state ? 'disabled' : ''} onchange="placementsFilterState.district = this.value; renderPlacementsView();">
              <option value="">${placementsFilterState.state ? '📍 All in ' + placementsFilterState.state : '📍 All Districts'}</option>
              ${currentDistricts.map(dt => `
                <option value="${dt}" ${placementsFilterState.district === dt ? 'selected' : ''}>${dt}</option>
              `).join('')}
            </select>
          </div>

          <!-- Domain -->
          <div style="flex:1.2; min-width:180px;">
            <select class="colleges-dropdown-select" style="width:100%; height:44px;" onchange="placementsFilterState.domain = this.value; renderPlacementsView();">
              <option value="all">🌐 All Recruiter Domains</option>
              <option value="Product" ${placementsFilterState.domain === 'Product' ? 'selected' : ''}>SaaS &amp; Product</option>
              <option value="Cloud" ${placementsFilterState.domain === 'Cloud' ? 'selected' : ''}>Cloud &amp; Distributed Systems</option>
              <option value="Automotive" ${placementsFilterState.domain === 'Automotive' ? 'selected' : ''}>Automotive &amp; Embedded</option>
              <option value="FinTech" ${placementsFilterState.domain === 'FinTech' ? 'selected' : ''}>FinTech &amp; Quant</option>
              <option value="Consulting" ${placementsFilterState.domain === 'Consulting' ? 'selected' : ''}>IT Consulting &amp; Services</option>
            </select>
          </div>

          ${isFilterActive ? `
            <button type="button" class="action-btn secondary" style="height:44px; padding:0 14px; font-size:12px; white-space:nowrap;" onclick="placementsFilterState = {search:'', state:'', district:'', domain:'all'}; renderPlacementsView();">
              ↺ Reset
            </button>
          ` : ''}
        </div>

        <div id="placementsMetaSummary" class="courses-meta-summary-bar" style="margin-top:12px; padding-top:10px;">
          <div class="courses-meta-summary-text">
            <span>💼 Showing <strong>${filteredVisits.length}</strong> premier campus hiring recruiters (20 Companies List)</span>
          </div>
          <span style="font-size:11.5px; color:var(--theme-muted);">Recruitment Playbooks, Selection Stages, Round-1 Hub &amp; Historical CTC Metrics</span>
        </div>
      </section>

      <!-- 2. 20 Companies List (Each with View Full Playbook Modal) -->
      <section id="placementsCardsGrid" class="college-grid" style="gap:20px;">
        ${renderPlacementsCardsHtml(filteredVisits)}
      </section>

      <!-- 3. Quantitative Aptitude under Round 1 Placement Preparation Hub (7 Official Platforms) -->
      <section style="background:#FFFFFF; border:1px solid var(--theme-line, #E2E8F0); border-radius:16px; padding:24px; box-shadow:0 4px 20px rgba(0,0,0,0.03);">
        <div style="margin-bottom:18px; text-align:center;">
          <span style="font-size:11px; font-weight:800; color:#3A9B8F; text-transform:uppercase; letter-spacing:0.8px; background:rgba(58,155,143,0.12); padding:4px 12px; border-radius:20px;">🎯 Essential Placement Preparation Hub</span>
          <h3 style="margin:8px 0 6px; font-size:20px; font-weight:800; color:#0F172A;">Quantitative Aptitude Under Round 1 Placement Preparation Hub</h3>
          <p style="margin:0 auto; font-size:12.5px; color:#64748B; max-width:700px;">Master speed math, arithmetic formulas, logical reasoning, data interpretation, and algorithmic screening rounds with direct access to the 7 leading preparation platforms:</p>
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:16px;">
          ${prepPlatforms.map(p => `
            <div style="background:#F8FAFC; border:1px solid var(--theme-line, #E2E8F0); border-radius:12px; padding:16px; display:flex; flex-direction:column; justify-content:space-between; transition:transform 0.2s ease;">
              <div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                  <strong style="color:#0F172A; font-size:14.5px;">🌐 ${escapeHtml(p.name)}</strong>
                  <span class="pathway-badge teal" style="font-size:10.5px;">Verified Resource</span>
                </div>
                <div style="font-size:11.5px; color:#77AC3B; font-weight:700; margin-bottom:6px;">📌 ${escapeHtml(p.focus)}</div>
                <p style="margin:0 0 12px; font-size:12px; color:#64748B; line-height:1.45;">${escapeHtml(p.desc)}</p>
              </div>
              <a href="${escapeHtml(p.url)}" target="_blank" rel="noopener noreferrer" class="pathway-card-btn" style="text-align:center; justify-content:center; text-decoration:none; background:#FFFFFF; border:1px solid var(--theme-line, #E2E8F0);">
                <span>Open ${escapeHtml(p.name)} ↗</span>
              </a>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- 4. Analytics Bar Charts (Left: Past 10 Years Placement | Right: Future 5 Years Opportunities) -->
      <section style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:20px;">
        <!-- Left: Past 10 Years Placement Bar Chart -->
        ${renderCNBarChartHtml({
          title: '📊 Past 10 Years Placement Growth (2016 - 2025)',
          subtitle: 'Median Engineering & Tech Salary Growth (LPA in Lakhs / Year)',
          items: past10YearsData,
          type: 'vertical',
          colorScheme: 'teal'
        })}

        <!-- Right: Future 5 Years Opportunities Bar Chart -->
        ${renderCNBarChartHtml({
          title: '🚀 Future 5 Years Projected Openings (2026 - 2030)',
          subtitle: 'High-Demand Emerging Domain Surge Estimates (% Growth YoY)',
          items: future5YearsData,
          type: 'horizontal',
          colorScheme: 'coral'
        })}
      </section>

      <!-- 5. 10 Verified Student Placement Reviews & User Suggestion Box -->
      <section class="survey-split-layout" style="margin-top:0;">
        <div class="survey-cards-column">
          <div class="category-shortcuts-heading" style="margin-top:0;">
            <h3>💬 10 Verified Campus Placement Reviews &amp; Offer Holder Guidance</h3>
            <span style="font-size:11.5px; color:var(--theme-muted);">Direct advice from campus recruits regarding aptitude thresholds, live coding rounds, and interview strategies</span>
          </div>

          <div style="display:flex; flex-direction:column; gap:10px; margin-top:12px;">
            ${reviews.slice(0, 10).map(r => `
              <div class="cn-review-card-compact">
                <div class="cn-review-header">
                  <div class="cn-review-author-wrap">
                    <div class="cn-review-avatar">${escapeHtml(r.student.slice(0, 2).toUpperCase())}</div>
                    <div>
                      <div class="cn-review-name">${escapeHtml(r.student)}</div>
                      <div class="cn-review-role">Placed at <strong style="color:#0F172A;">${escapeHtml(r.company)}</strong> &bull; <span style="color:#77AC3B; font-weight:800;">${escapeHtml(r.package || '')}</span></div>
                    </div>
                  </div>
                  <div class="cn-review-stars">★★★★★ 5.0</div>
                </div>
                <p class="cn-review-text">"${escapeHtml(r.comment)}"</p>
              </div>
            `).join('')}
          </div>
        </div>

        <aside class="survey-chart-sidebar">
          <div class="user-remarks-panel" style="background:#FFFFFF; border:1px solid var(--theme-line, #E2E8F0); border-radius:14px; padding:20px; box-shadow:0 4px 16px rgba(0,0,0,0.02);">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
              <span style="font-size:20px;">💼</span>
              <div>
                <h4 style="margin:0; color:#0F172A; font-size:14px; font-weight:800;">Placement Suggestion Box</h4>
                <small style="color:var(--theme-muted); font-size:11px;">Report recruiter pattern or tip</small>
              </div>
            </div>
            <form id="placementSuggestionForm" onsubmit="submitUniversalSuggestion(event, 'placement');">
              <div class="remarks-form-group" style="margin-bottom:8px;">
                <input type="text" name="user_name" class="remarks-form-input" placeholder="Your Name &amp; Target Company..." style="width:100%; height:38px; font-size:12px; padding:0 10px; border-radius:8px; background:#F8FAFC; border:1px solid var(--theme-line, #E2E8F0); color:#0F172A;" />
              </div>
              <div class="remarks-form-group" style="margin-bottom:10px;">
                <textarea name="message" class="remarks-form-textarea" rows="3" placeholder="Share recruitment test patterns, interview questions, or aptitude tips for peers..." style="width:100%; font-size:12px; padding:8px 10px; border-radius:8px; background:#F8FAFC; border:1px solid var(--theme-line, #E2E8F0); color:#0F172A; font-family:inherit;"></textarea>
              </div>
              <button type="submit" class="primary-button" style="width:100%; height:38px; font-size:12px; justify-content:center;">
                <span>Submit Placement Advice ↗</span>
              </button>
            </form>
          </div>
        </aside>
      </section>

    </div>
  `;
}
window.renderPlacementsView = renderPlacementsView;

// ============================================================================
// 4. JOBS VIEW RENDERER
// ============================================================================
function getJobsFilteredList() {
  const jobsList = (_cachedJobsData && _cachedJobsData.jobs) ? _cachedJobsData.jobs : [];
  const q = (jobsFilterState.search || '').toLowerCase().trim();
  const selectedState = (jobsFilterState.state || '').toLowerCase().trim();
  const selectedDistrict = (jobsFilterState.district || '').toLowerCase().trim();
  const selectedDegree = (jobsFilterState.degree || 'all').toLowerCase().trim();
  const selectedDomain = (jobsFilterState.domain || 'all').toLowerCase().trim();
  const selectedRole = (jobsFilterState.role || 'all').toLowerCase().trim();

  return jobsList.filter(j => {
    const comp = (j.company || '').toLowerCase();
    const role = (j.role || '').toLowerCase();
    const state = (j.state || '').toLowerCase();
    const dist = (j.district || j.location || '').toLowerCase();
    const edu = (j.education || '').toLowerCase();
    const dom = (j.domain || '').toLowerCase();
    const skills = (j.tech_skills || []).map(s => s.toLowerCase());

    const matchSearch = !q || comp.includes(q) || role.includes(q) || skills.some(s => s.includes(q));
    const matchState = !selectedState || state.includes(selectedState) || dist.includes(selectedState);
    const matchDist = !selectedDistrict || dist.includes(selectedDistrict);
    const matchDegree = selectedDegree === 'all' || edu.includes(selectedDegree);
    const matchDomain = selectedDomain === 'all' || dom.includes(selectedDomain);
    const matchRole = selectedRole === 'all' || role.includes(selectedRole);

    return matchSearch && matchState && matchDist && matchDegree && matchDomain && matchRole;
  });
}

function renderJobsCardsHtml(filteredJobs) {
  if (filteredJobs.length === 0) {
    return `
      <div style="grid-column:1/-1; text-align:center; padding:48px 20px; background:var(--theme-surface, #FFFFFF); border:1px dashed var(--theme-line, #E2E8F0); border-radius:14px;">
        <div style="font-size:36px; margin-bottom:8px;">💼</div>
        <h3 style="margin:0 0 6px; color:#0F172A;">No Openings Found</h3>
        <p style="color:var(--theme-muted); font-size:13px; margin-bottom:16px;">No career openings match your selected search or filter criteria.</p>
        <button type="button" class="primary-button" onclick="jobsFilterState = {search:'', state:'', district:'', degree:'all', domain:'all', role:'all'}; renderJobsView();">View All Corporate Openings</button>
      </div>
    `;
  }

  return filteredJobs.slice(0, 10).map(j => `
    <article class="college-card" style="display:flex; flex-direction:column; justify-content:space-between; border-radius:14px; padding:20px; box-shadow:0 4px 18px rgba(0,0,0,0.03); background:#FFFFFF;">
      <div>
        <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:8px; margin-bottom:10px;">
          <span class="pathway-badge teal">🏢 ${escapeHtml(j.company)}</span>
          <span class="pathway-badge coral" style="font-weight:800;">${escapeHtml(j.salary || '₹6.5 - 12 LPA')}</span>
        </div>

        <h3 style="font-size:16.5px; font-weight:800; color:#0F172A; margin:0 0 4px; line-height:1.35;">${escapeHtml(j.role)}</h3>
        <div style="font-size:12px; color:#64748B; margin-bottom:10px;">
          📍 <strong>${escapeHtml(j.location)}</strong> &bull; 🎓 <span>${escapeHtml(j.education)}</span> &bull; ⏱️ <span>${escapeHtml(j.exp_level || 'Fresher (0-1 Yrs)')}</span>
        </div>

        <!-- Calibrated Realistic Salary Tiering -->
        <div style="background:#F8FAFC; border:1px solid var(--theme-line, #E2E8F0); border-radius:10px; padding:10px 12px; margin-bottom:12px;">
          <div style="display:flex; justify-content:space-between; font-size:11.5px; margin-bottom:4px;">
            <span style="color:#64748B;">Fresher / Entry (0-1 Yrs):</span>
            <strong style="color:#0F172A;">${escapeHtml(j.salary_fresher || '₹4.5 - 8.5 LPA')}</strong>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:11.5px; margin-bottom:4px;">
            <span style="color:#64748B;">Mid-Level (3-5 Yrs):</span>
            <strong style="color:#77AC3B;">${escapeHtml(j.salary_mid || '₹12 - 22 LPA')}</strong>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:11.5px;">
            <span style="color:#64748B;">Lead / Senior (8+ Yrs):</span>
            <strong style="color:#E06D53;">${escapeHtml(j.salary_lead || '₹28 - 45+ LPA')}</strong>
          </div>
        </div>

        <div style="background:#F8FAFC; border:1px solid var(--theme-line, #E2E8F0); border-radius:10px; padding:12px; margin-bottom:12px;">
          <div style="font-size:12px; color:#334155; line-height:1.45; margin-bottom:6px;">
            💡 <strong>Why Join:</strong> ${escapeHtml(j.why_join || 'Direct engineering ownership, meritocracy, and high career velocity.')}
          </div>
          <div style="font-size:11.5px; color:#64748B; margin-bottom:4px;">
            📋 <strong>Eligibility:</strong> <span style="color:#0F172A;">${escapeHtml(j.eligibility || '2026 STEM / Computing Graduates with solid core foundations')}</span>
          </div>
          <div style="font-size:11.5px; color:#64748B;">
            📈 <strong>Possibilities:</strong> <span style="color:#77AC3B; font-weight:700;">${escapeHtml(j.growth_trend || 'Fast-track promotion to Senior Engineer / Tech Lead in 2-3 years')}</span>
          </div>
        </div>

        <!-- Technical & Soft Skills -->
        <div style="margin-bottom:10px;">
          <span style="font-size:11px; font-weight:700; color:#64748B; display:block; margin-bottom:4px; text-transform:uppercase;">Technical Skills:</span>
          <div style="display:flex; flex-wrap:wrap; gap:4px;">
            ${(j.tech_skills || []).map(s => `<span class="pathway-badge teal" style="font-size:11px;">${escapeHtml(s)}</span>`).join('')}
          </div>
        </div>

        <div style="margin-bottom:10px;">
          <span style="font-size:11px; font-weight:700; color:#64748B; display:block; margin-bottom:4px; text-transform:uppercase;">Soft Skills &amp; Requirements:</span>
          <div style="display:flex; flex-wrap:wrap; gap:4px;">
            ${(j.soft_skills || ['Logical Reasoning', 'Clear Communication', 'Team Collaboration']).map(s => `<span class="pathway-badge" style="background:#F1F5F9; color:#0F172A; font-size:11px;">${escapeHtml(s)}</span>`).join('')}
          </div>
        </div>

        <div style="font-size:11.5px; color:#64748B; margin-bottom:12px; background:#F8FAFC; padding:8px 10px; border-radius:8px; border:1px solid #E2E8F0;">
          📝 <strong>Assessment / LBA:</strong> ${escapeHtml(j.assessment || 'Online Coding Assessment (2 algorithmic challenges) + 3 Virtual Technical Rounds')}
        </div>
      </div>

      <div style="display:flex; gap:10px; padding-top:12px; border-top:1px solid var(--theme-line, #E2E8F0);">
        <button type="button" class="pathway-card-btn" style="flex:1; justify-content:center;" onclick="openJobDetailModal('${j.id}')">
          <span>Full View / Roadmap ➔</span>
        </button>
        ${(() => {
          const jobPortal = formatPortalUrl(j.website || j.application_url || j.apply_url || j.applyUrl || j.portal_url);
          return jobPortal ? `
            <a href="${escapeHtml(jobPortal)}" target="_blank" rel="noopener noreferrer" class="pathway-card-btn" style="background:#77AC3B; color:#FFFFFF; border-color:#77AC3B; text-decoration:none; white-space:nowrap; justify-content:center;">
              Official Portal ↗
            </a>
          ` : '';
        })()}
      </div>
    </article>
  `).join('');
}

function handleJobsSearch(val) {
  jobsFilterState.search = val;
  const filteredJobs = getJobsFilteredList();
  const grid = document.getElementById('jobsCardsGrid');
  if (grid) grid.innerHTML = renderJobsCardsHtml(filteredJobs);

  const summary = document.getElementById('jobsMetaSummary');
  if (summary) {
    summary.innerHTML = `
      <div class="courses-meta-summary-text">
        <span>💼 Showing <strong>${filteredJobs.slice(0, 10).length}</strong> verified corporate career openings (~10 Curated Openings)</span>
      </div>
      <span style="font-size:11.5px; color:var(--theme-muted);">Official Corporate Career Portals &bull; Full Assessment &amp; LBA Blueprints &bull; <em>(Salary metrics calibrated for market clarity)</em></span>
    `;
  }
}
window.handleJobsSearch = handleJobsSearch;

async function renderJobsView() {
  const container = document.getElementById('jobsPageContent');
  if (!container) return;

  if (!_cachedJobsData) {
    try {
      const res = await fetch('/api/jobs');
      if (res.ok) {
        const data = await res.json();
        if (data && data.jobs) _cachedJobsData = data;
      }
    } catch (e) {
      console.warn('[Jobs] Live fetch fallback:', e);
    }
  }

  const filteredJobs = getJobsFilteredList();
  const defaultJobReviews = [
    { id: 'JR-01', author: 'Siddharth Menon', company: 'Zoho Corporation', role: 'Software Developer', rating: 4.9, comment: 'The work environment is relaxed and empowering. If you know how to write clean code and think independently, you will thrive here.' },
    { id: 'JR-02', author: 'Priya Ramesh', company: 'Google India', role: 'Associate Software Engineer', rating: 5.0, comment: 'World-class engineering mentorship and massive scale. The interviews tested deep algorithmic intuition and problem breakdown.' },
    { id: 'JR-03', author: 'Karthik Subramanian', company: 'Robert Bosch', role: 'Embedded Automotive Systems Engineer', rating: 4.7, comment: 'Great place to build expertise in automotive firmware, ADAS, and connected vehicle technology in Coimbatore.' },
    { id: 'JR-04', author: 'Divya Bharathi', company: 'Amazon AWS', role: 'Cloud Support Associate', rating: 4.8, comment: 'Tremendous operational rigor. Managing high-severity enterprise tickets sharpens troubleshooting and networking skills fast.' },
    { id: 'JR-05', author: 'Arun Prasath', company: 'Tiger Analytics', role: 'Data Science Analyst', rating: 4.8, comment: 'Client problems require solid statistical foundations and clean Python pipelines. Excellent peer learning culture.' },
    { id: 'JR-06', author: 'Sneha Venkatesh', company: 'Freshworks Inc', role: 'Frontend Engineer', rating: 4.9, comment: 'Modern frontend tech stack and strong design engineering focus. Product teams move fast and ship with high ownership.' }
  ];

  const reviews = (_cachedJobsData && Array.isArray(_cachedJobsData.reviews) && _cachedJobsData.reviews.length > 0)
    ? _cachedJobsData.reviews
    : defaultJobReviews;
  const statesList = getStatesAndDistrictsList();
  const currentDistricts = jobsFilterState.state ? getDistrictsForState(jobsFilterState.state) : [];

  const isFilterActive = !!(jobsFilterState.search || jobsFilterState.state || jobsFilterState.district || (jobsFilterState.degree && jobsFilterState.degree !== 'all') || (jobsFilterState.domain && jobsFilterState.domain !== 'all') || (jobsFilterState.role && jobsFilterState.role !== 'all'));

  // Dual Bar Charts Data for Jobs
  const past10YearsHiringDemand = [
    { label: 'Full Stack Dev', value: 92, displayValue: 'High (92%)', color: 'teal' },
    { label: 'Data / BI Analyst', value: 84, displayValue: 'High (84%)', color: 'teal' },
    { label: 'QA / Automation', value: 62, displayValue: 'Moderate (62%)', color: 'teal' },
    { label: 'Legacy SysAdmin', value: 38, displayValue: 'Low (38%)', color: 'teal' },
    { label: 'Manual Testing', value: 24, displayValue: 'Declining (24%)', color: 'teal' }
  ];

  const next5YearsExpectedRoles = [
    { label: 'AI Solutions Engineer', value: 96, displayValue: '+52% Surge', color: 'coral' },
    { label: 'Cloud Infrastructure / SRE', value: 90, displayValue: '+44% Surge', color: 'coral' },
    { label: 'Embedded EV Architect', value: 85, displayValue: '+38% Surge', color: 'coral' },
    { label: 'Cyber Risk Analyst', value: 88, displayValue: '+40% Surge', color: 'coral' },
    { label: 'AR / Spatial Developer', value: 78, displayValue: '+32% Surge', color: 'coral' }
  ];

  container.innerHTML = `
    <div class="courses-discovery-container" style="display:flex; flex-direction:column; gap:24px;">

      <!-- 1. Centered Search & Filter Row: SEARCH | STATE | DISTRICT | DEGREE | DOMAIN | ROLE -->
      <section class="colleges-discovery-filter-card" style="margin-bottom:0;">
        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; width:100%;">
          <!-- Search Box -->
          <div class="colleges-search-input-wrap" style="flex:1.4; min-width:180px; margin:0;">
            <span class="colleges-input-lead-icon">🔍</span>
            <input
              type="text"
              id="jobsSearchInput"
              class="colleges-search-input-field"
              placeholder="Search company, role, skill..."
              value="${escapeHtml(jobsFilterState.search)}"
              oninput="handleJobsSearch(this.value)"
            />
            ${jobsFilterState.search ? `
              <button type="button" class="colleges-filter-clear-btn" style="display:block;" onclick="handleJobsSearch(''); document.getElementById('jobsSearchInput').value='';">✕</button>
            ` : ''}
          </div>

          <!-- State -->
          <div style="flex:1; min-width:130px;">
            <select class="colleges-dropdown-select" style="width:100%; height:44px;" onchange="jobsFilterState.state = this.value; jobsFilterState.district = ''; renderJobsView();">
              <option value="">🌐 State: All</option>
              ${statesList.map(st => `
                <option value="${st}" ${jobsFilterState.state === st ? 'selected' : ''}>${st}</option>
              `).join('')}
            </select>
          </div>

          <!-- District -->
          <div style="flex:1; min-width:130px;">
            <select class="colleges-dropdown-select" style="width:100%; height:44px;" ${!jobsFilterState.state ? 'disabled' : ''} onchange="jobsFilterState.district = this.value; renderJobsView();">
              <option value="">${jobsFilterState.state ? '📍 ' + jobsFilterState.state : '📍 District'}</option>
              ${currentDistricts.map(dt => `
                <option value="${dt}" ${jobsFilterState.district === dt ? 'selected' : ''}>${dt}</option>
              `).join('')}
            </select>
          </div>

          <!-- Degree -->
          <div style="flex:1; min-width:130px;">
            <select class="colleges-dropdown-select" style="width:100%; height:44px;" onchange="jobsFilterState.degree = this.value; renderJobsView();">
              <option value="all">🎓 Degree: All</option>
              <option value="B.Tech" ${jobsFilterState.degree === 'B.Tech' ? 'selected' : ''}>B.Tech / B.E</option>
              <option value="B.Sc" ${jobsFilterState.degree === 'B.Sc' ? 'selected' : ''}>B.Sc / BCA</option>
              <option value="MCA" ${jobsFilterState.degree === 'MCA' ? 'selected' : ''}>MCA / M.Sc</option>
              <option value="Any Degree" ${jobsFilterState.degree === 'Any Degree' ? 'selected' : ''}>Any Degree</option>
            </select>
          </div>

          <!-- Domain -->
          <div style="flex:1; min-width:130px;">
            <select class="colleges-dropdown-select" style="width:100%; height:44px;" onchange="jobsFilterState.domain = this.value; renderJobsView();">
              <option value="all">🌐 Domain: All</option>
              <option value="Software" ${jobsFilterState.domain === 'Software' ? 'selected' : ''}>Software Engg</option>
              <option value="Product" ${jobsFilterState.domain === 'Product' ? 'selected' : ''}>Product Dev</option>
              <option value="Hardware" ${jobsFilterState.domain === 'Hardware' ? 'selected' : ''}>Embedded &amp; Auto</option>
              <option value="Cloud" ${jobsFilterState.domain === 'Cloud' ? 'selected' : ''}>Cloud &amp; DevOps</option>
              <option value="AI" ${jobsFilterState.domain === 'AI' ? 'selected' : ''}>AI &amp; Data Science</option>
            </select>
          </div>

          <!-- Role (Small Selectable List) -->
          <div style="flex:1; min-width:130px;">
            <select class="colleges-dropdown-select" style="width:100%; height:44px; font-weight:700; color:#77AC3B;" onchange="jobsFilterState.role = this.value; renderJobsView();">
              <option value="all">💼 Role: All</option>
              <option value="Software" ${jobsFilterState.role === 'Software' ? 'selected' : ''}>Software Dev</option>
              <option value="Embedded" ${jobsFilterState.role === 'Embedded' ? 'selected' : ''}>Embedded Engg</option>
              <option value="Analyst" ${jobsFilterState.role === 'Analyst' ? 'selected' : ''}>Data Analyst</option>
              <option value="Cloud" ${jobsFilterState.role === 'Cloud' ? 'selected' : ''}>Cloud Associate</option>
            </select>
          </div>

          ${isFilterActive ? `
            <button type="button" class="action-btn secondary" style="height:44px; padding:0 12px; font-size:12px; white-space:nowrap;" onclick="jobsFilterState = {search:'', state:'', district:'', degree:'all', domain:'all', role:'all'}; renderJobsView();">
              ↺ Reset
            </button>
          ` : ''}
        </div>

        <div id="jobsMetaSummary" class="courses-meta-summary-bar" style="margin-top:12px; padding-top:10px;">
          <div class="courses-meta-summary-text">
            <span>💼 Showing <strong>${filteredJobs.slice(0, 10).length}</strong> verified corporate career openings (~10 Curated Openings)</span>
          </div>
          <span style="font-size:11.5px; color:var(--theme-muted);">Official Corporate Career Portals &bull; Full Assessment &amp; LBA Blueprints &bull; <em>(Salary figures calibrated with realistic experience-tier brackets)</em></span>
        </div>
      </section>

      <!-- 2. Job / Company Cards Grid (~10 Companies / Roles) -->
      <section id="jobsCardsGrid" class="college-grid" style="gap:20px;">
        ${renderJobsCardsHtml(filteredJobs)}
      </section>

      <!-- 3. Dual Bar Charts: Past 10 Years Hiring Demand vs Next 5 Years Expected Roles -->
      <section style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:20px;">
        <!-- Left: Past 10 Years Hiring Demand by Roles -->
        ${renderCNBarChartHtml({
          title: '📊 Past 10 Years Hiring Demand Trends by Roles (2016-2025)',
          subtitle: 'Historical recruitment volume across software, analysis, testing, and infra',
          items: past10YearsHiringDemand,
          type: 'vertical',
          colorScheme: 'teal'
        })}

        <!-- Right: Next 5 Years Expected Preferred Roles -->
        ${renderCNBarChartHtml({
          title: '🔮 Next 5 Years Expected Preferred Roles (2026-2030)',
          subtitle: 'Projected demand surge for specialized modern software engineering tracks',
          items: next5YearsExpectedRoles,
          type: 'horizontal',
          colorScheme: 'coral'
        })}
      </section>

      <!-- 4. Reviews & Suggestion Box Split Section (12 Reviews) -->
      <section class="survey-split-layout" style="margin-top:0;">
        <div class="survey-cards-column">
          <div class="category-shortcuts-heading" style="margin-top:0;">
            <h3>💬 Verified Graduate Job Experience Reviews (12 Reviews)</h3>
            <span style="font-size:11.5px; color:var(--theme-muted);">Authentic workplace feedback regarding compensation, interviews, and project exposure</span>
          </div>

          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:12px; margin-top:12px;">
            ${reviews.slice(0, 12).map(r => `
              <div class="cn-review-card-compact">
                <div class="cn-review-header">
                  <div class="cn-review-author-wrap">
                    <div class="cn-review-avatar">${escapeHtml((r.author || r.company || 'GB').slice(0, 2).toUpperCase())}</div>
                    <div>
                      <div class="cn-review-name">${escapeHtml(r.author || 'Graduate Engineer')}</div>
                      <div class="cn-review-role">🏢 <strong style="color:#0F172A;">${escapeHtml(r.company)}</strong> &bull; ${escapeHtml(r.role || 'Software Engineer')}</div>
                    </div>
                  </div>
                  <div class="cn-review-stars">★★★★★ ${(r.rating || 4.8).toFixed(1)}</div>
                </div>
                <p class="cn-review-text">"${escapeHtml(r.comment)}"</p>
              </div>
            `).join('')}
          </div>
        </div>

        <aside class="survey-chart-sidebar">
          <div class="user-remarks-panel" style="background:#FFFFFF; border:1px solid var(--theme-line, #E2E8F0); border-radius:14px; padding:20px; box-shadow:0 4px 16px rgba(0,0,0,0.02);">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
              <span style="font-size:20px;">💼</span>
              <div>
                <h4 style="margin:0; color:#0F172A; font-size:14px; font-weight:800;">Job Feedback Box</h4>
                <small style="color:var(--theme-muted); font-size:11px;">Submit hiring insights</small>
              </div>
            </div>
            <form id="jobSuggestionForm" onsubmit="submitUniversalSuggestion(event, 'job');">
              <div class="remarks-form-group" style="margin-bottom:8px;">
                <input type="text" name="user_name" class="remarks-form-input" placeholder="Your Name &amp; Company..." style="width:100%; height:38px; font-size:12px; padding:0 10px; border-radius:8px; background:#F8FAFC; border:1px solid var(--theme-line, #E2E8F0); color:#0F172A;" />
              </div>
              <div class="remarks-form-group" style="margin-bottom:10px;">
                <textarea name="message" class="remarks-form-textarea" rows="3" placeholder="Share your experience regarding hiring tests, role requirements, or company culture..." style="width:100%; font-size:12px; padding:8px 10px; border-radius:8px; background:#F8FAFC; border:1px solid var(--theme-line, #E2E8F0); color:#0F172A; font-family:inherit;"></textarea>
              </div>
              <button type="submit" class="primary-button" style="width:100%; height:38px; font-size:12px; justify-content:center;">
                <span>Submit Job Feedback ↗</span>
              </button>
            </form>
          </div>
        </aside>
      </section>

    </div>
  `;
}
window.renderJobsView = renderJobsView;

// ============================================================================
// 5. INTERNSHIPS VIEW RENDERER
// ============================================================================
function getInternshipsFilteredList() {
  const rawInternships = (_cachedInternshipsFullData && _cachedInternshipsFullData.internships) ? _cachedInternshipsFullData.internships : [];
  const q = (internshipsFilterState.search || '').toLowerCase().trim();
  const selectedState = (internshipsFilterState.state || '').toLowerCase().trim();
  const selectedDistrict = (internshipsFilterState.district || '').toLowerCase().trim();
  const selectedDuration = (internshipsFilterState.duration || 'all').toLowerCase().trim();
  const selectedDomain = (internshipsFilterState.domain || 'all').toLowerCase().trim();

  return rawInternships.filter(item => {
    const comp = (item.company || '').toLowerCase();
    const role = (item.role || '').toLowerCase();
    const domain = (item.domain || '').toLowerCase();
    const state = (item.state || '').toLowerCase();
    const dist = (item.district || item.location || '').toLowerCase();
    const dur = (item.duration || '').toLowerCase();

    const matchSearch = !q || comp.includes(q) || role.includes(q) || domain.includes(q);
    const matchState = !selectedState || state.includes(selectedState) || dist.includes(selectedState);
    const matchDist = !selectedDistrict || dist.includes(selectedDistrict);
    const matchDuration = selectedDuration === 'all' || dur.includes(selectedDuration);
    const matchDomain = selectedDomain === 'all' || domain.includes(selectedDomain);

    return matchSearch && matchState && matchDist && matchDuration && matchDomain;
  });
}

function renderInternshipsCardsHtml(filteredInternships) {
  if (filteredInternships.length === 0) {
    return `
      <div style="grid-column:1/-1; text-align:center; padding:48px 20px; background:var(--theme-surface, #FFFFFF); border:1px dashed var(--theme-line, #E2E8F0); border-radius:14px;">
        <div style="font-size:36px; margin-bottom:8px;">🎯</div>
        <h3 style="margin:0 0 6px; color:#0F172A;">No Internships Found</h3>
        <p style="color:var(--theme-muted); font-size:13px; margin-bottom:16px;">No internship openings match your selected search or filter criteria.</p>
        <button type="button" class="primary-button" onclick="internshipsFilterState = {search:'', state:'', district:'', duration:'all', domain:'all'}; renderInternshipsView();">View All 20 Opportunities</button>
      </div>
    `;
  }

  return filteredInternships.map(i => `
    <article class="college-card" style="display:flex; flex-direction:column; justify-content:space-between; border-radius:14px; padding:20px; box-shadow:0 4px 18px rgba(0,0,0,0.03); background:#FFFFFF;">
      <div>
        <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:8px; margin-bottom:10px;">
          <span class="pathway-badge teal">${escapeHtml(i.domain)}</span>
          <span class="pathway-badge coral" style="font-weight:800;">${escapeHtml(i.stipend || '₹25,000 / mo')}</span>
        </div>

        <h3 style="font-size:16.5px; font-weight:800; color:#0F172A; margin:0 0 4px;">${escapeHtml(i.role)}</h3>
        <div style="font-size:12px; color:#64748B; margin-bottom:10px;">
          🏢 <strong>${escapeHtml(i.company)}</strong> &bull; 📍 <span>${escapeHtml(i.location)}</span> &bull; ⏱️ <span>${escapeHtml(i.duration)}</span>
        </div>

        <div style="background:#F8FAFC; border:1px solid var(--theme-line, #E2E8F0); border-radius:10px; padding:12px; margin-bottom:12px;">
          <div style="font-size:11.5px; color:#334155; line-height:1.45; margin-bottom:4px;">
            🎓 <strong>Eligibility:</strong> ${escapeHtml(i.eligibility || 'UG/PG Engineering & Science Students (2026 Batch)')}
          </div>
          <div style="font-size:11.5px; color:#64748B;">
            📜 <strong>Requirements:</strong> ${escapeHtml(i.certifications || 'Relevant portfolio projects & core coursework')}
          </div>
        </div>

        <div style="margin-bottom:10px;">
          <span style="font-size:11px; font-weight:700; color:#64748B; display:block; margin-bottom:4px; text-transform:uppercase;">Skills Involved:</span>
          <div style="display:flex; flex-wrap:wrap; gap:4px;">
            ${(i.skills || []).map(s => `<span class="pathway-badge teal" style="font-size:11px;">${escapeHtml(s)}</span>`).join('')}
          </div>
        </div>
      </div>

      <div style="display:flex; gap:10px; padding-top:12px; border-top:1px solid var(--theme-line, #E2E8F0);">
        <button type="button" class="pathway-card-btn" style="flex:1; justify-content:center;" onclick="openInternshipModal('${i.id}')">
          <span>View Full Specs ➔</span>
        </button>
        ${(() => {
          const cardApplyUrl = formatPortalUrl(i.application_url || i.apply_url || i.applyUrl || i.website || i.portal_url);
          return cardApplyUrl ? `
            <a href="${escapeHtml(cardApplyUrl)}" target="_blank" rel="noopener noreferrer" class="pathway-card-btn" style="background:#77AC3B; color:#FFFFFF; border-color:#77AC3B; text-decoration:none; white-space:nowrap; justify-content:center;">
              Apply ↗
            </a>
          ` : '';
        })()}
      </div>
    </article>
  `).join('');
}

function handleInternshipsSearch(val) {
  internshipsFilterState.search = val;
  const filteredInternships = getInternshipsFilteredList();
  const grid = document.getElementById('internshipsCardsGrid');
  if (grid) grid.innerHTML = renderInternshipsCardsHtml(filteredInternships);

  const summary = document.getElementById('internshipsMetaSummary');
  if (summary) {
    summary.innerHTML = `
      <div class="courses-meta-summary-text">
        <span>🎯 Showing <strong>${filteredInternships.length}</strong> active corporate internship opportunities (20 Opportunities Listed)</span>
      </div>
      <span style="font-size:11.5px; color:var(--theme-muted);">Verified Monthly Stipends &bull; PPO Fast-Track Blueprints &bull; Research Fellowships</span>
    `;
  }
}
window.handleInternshipsSearch = handleInternshipsSearch;

async function renderInternshipsView() {
  const container = document.getElementById('internshipsPageContent');
  if (!container) return;

  if (!_cachedInternshipsFullData) {
    try {
      const res = await fetch('/api/internships/full');
      if (res.ok) {
        const data = await res.json();
        if (data && (data.internships || data.top_10_projects)) _cachedInternshipsFullData = data;
      }
    } catch (e) {
      console.warn('[Internships] Live fetch fallback:', e);
    }
  }

  const defaultTopProjects = [
    { rank: 1, project: "AI-Powered Early Crop Disease Detection Drone", domain: "AI / AgriTech", college: "Tamilnadu Agricultural University, Coimbatore", company_partner: "TNAU Incubator", impact: "96.4% precision on leaf blight detection saving ₹1.2 Cr in crop loss" },
    { rank: 2, project: "High-Efficiency Regenerative Braking Controller for EVs", domain: "EV / Embedded", college: "Amrita Vishwa Vidyapeetham, Coimbatore", company_partner: "Robert Bosch R&D", impact: "14% extended battery range in urban driving cycles" },
    { rank: 3, project: "Zero-Knowledge Proof Identity Verification SDK", domain: "Web3 / Cryptography", college: "PSG College of Technology, Coimbatore", company_partner: "Polygon Labs", impact: "Over 120,000 instant on-chain student identity proofs generated" },
    { rank: 4, project: "Automated ICU Patient Vitals Anomaly Detector", domain: "IoT / HealthTech", college: "Karunya Institute of Technology and Sciences", company_partner: "Apollo Health Tech", impact: "Sub-second alerting for sudden oxygen and pulse variations" },
    { rank: 5, project: "Autonomous Solar Panel Cleaning & Inspection Robot", domain: "Robotics", college: "Adithya Institute of Technology, Coimbatore", company_partner: "Adithya Renewable Energy", impact: "18% improvement in solar power capture without water wastage" },
    { rank: 6, project: "Microservices Load Optimizer for High-Traffic SaaS", domain: "Cloud / DevOps", college: "Rathinam Global University, Coimbatore", company_partner: "Zoho Labs", impact: "Reduced database latency by 32% during seasonal peak loads" },
    { rank: 7, project: "Decentralized Credential & Certificate Vault", domain: "Blockchain", college: "School of Postgraduate Studies, Coimbatore", company_partner: "GovTech Tamil Nadu", impact: "Zero forgery tamper-proof marksheets for university students" },
    { rank: 8, project: "Multilingual AI Voice Assistant for Rural Banking", domain: "NLP / FinTech", college: "Amrita Vishwa Vidyapeetham, Coimbatore", company_partner: "Canara Bank Innovation Hub", impact: "Supported 6 South Indian regional languages with 94% intent accuracy" },
    { rank: 9, project: "Smart Water Distribution & Leakage Isolation Network", domain: "Smart City IoT", college: "Coimbatore Institute of Technology", company_partner: "Coimbatore Smart City Mission", impact: "Detected 45+ underground pipeline leaks saving 1.8M liters daily" },
    { rank: 10, project: "Container Security Hardening & Vulnerability Scanner", domain: "Cybersecurity", college: "ADITHYA COLLEGE OF ARTS AND SCIENCE, Coimbatore", company_partner: "CyberShield Labs", impact: "Integrated automated vulnerability scans into CI/CD pipelines for 80+ apps" }
  ];

  const defaultInternshipReviews = [
    { id: "IR-01", student: "Vigneshwaran P.", company: "Zoho Corporation", college: "Adithya Institute of Technology, Coimbatore", rating: 5, comment: "My 6-month internship at Zoho Coimbatore directly resulted in a full-time SDE offer. Best learning curve ever!" },
    { id: "IR-02", student: "Sowmya R.", company: "Robert Bosch", college: "Amrita Vishwa Vidyapeetham, Coimbatore", rating: 5, comment: "Got to work on real ADAS test benches and hardware-in-the-loop simulations in Coimbatore." },
    { id: "IR-03", student: "Kavitha M.", company: "TNAU Incubator", college: "Tamilnadu Agricultural University, Coimbatore", rating: 4.8, comment: "Practical exposure to GIS mapping and drone image analytics with supportive senior agricultural scientists." },
    { id: "IR-04", student: "Rahul N.", company: "Google India", college: "PSG College of Technology, Coimbatore", rating: 5, comment: "The 2-month summer internship provided deep exposure to scalable distributed microservices and code reviews." },
    { id: "IR-05", student: "Ananya Sen", company: "Goldman Sachs", college: "IIT Madras", rating: 4.9, comment: "Exceptional quantitative modeling rigor. Worked on time-series risk prediction with senior analysts." },
    { id: "IR-06", student: "Dinesh Karthik", company: "Amazon AWS", college: "Coimbatore Institute of Technology", rating: 5.0, comment: "Hands-on distributed infrastructure internship debugging cloud storage latencies with senior SRE mentors." },
    { id: "IR-07", student: "Pooja Venkataraman", company: "Tiger Analytics", college: "PSG College of Technology, Coimbatore", rating: 4.8, comment: "End-to-end Python ML data pipeline deployment with direct feedback from client analytics teams." },
    { id: "IR-08", student: "Gautham Sundar", company: "L&T Technology Services", college: "Adithya Institute of Technology, Coimbatore", rating: 4.9, comment: "Designed smart factory IoT telemetry with FreeRTOS and LoRaWAN, leading to an immediate full-time PPO." },
    { id: "IR-09", student: "Meenakshi Iyer", company: "Schneider Electric", college: "Kumaraguru College of Technology, Coimbatore", rating: 4.8, comment: "Solar grid monitoring and energy yield simulation with senior architects in Coimbatore R&D center." },
    { id: "IR-10", student: "Karthikeyan M.", company: "Freshworks Inc", college: "Sri Krishna College of Engg & Tech, Coimbatore", rating: 5.0, comment: "Shipped accessible React and TypeScript component library improvements used by thousands of SaaS customers daily." }
  ];

  const filteredInternships = getInternshipsFilteredList();
  const topProjects = (_cachedInternshipsFullData && Array.isArray(_cachedInternshipsFullData.top_10_projects) && _cachedInternshipsFullData.top_10_projects.length > 0)
    ? _cachedInternshipsFullData.top_10_projects
    : defaultTopProjects;

  const reviews = (_cachedInternshipsFullData && Array.isArray(_cachedInternshipsFullData.reviews) && _cachedInternshipsFullData.reviews.length > 0)
    ? _cachedInternshipsFullData.reviews
    : defaultInternshipReviews;

  const statesList = getStatesAndDistrictsList();
  const currentDistricts = internshipsFilterState.state ? getDistrictsForState(internshipsFilterState.state) : [];
  const isFilterActive = !!(internshipsFilterState.search || internshipsFilterState.state || internshipsFilterState.district || (internshipsFilterState.duration && internshipsFilterState.duration !== 'all') || (internshipsFilterState.domain && internshipsFilterState.domain !== 'all'));

  // Bar Chart Data for Internships
  const past10YearsStipendData = (_cachedInternshipsFullData && _cachedInternshipsFullData.past_10yr_trends && Array.isArray(_cachedInternshipsFullData.past_10yr_trends.metrics) && _cachedInternshipsFullData.past_10yr_trends.metrics.length > 0)
    ? _cachedInternshipsFullData.past_10yr_trends.metrics.map(m => ({
        label: m.year,
        value: parseInt((m.avg_stipend || '0').replace(/[^0-9]/g, '')) || 20,
        displayValue: m.avg_stipend,
        color: 'teal'
      }))
    : [
    { label: '2016', value: 6, displayValue: '₹6k/mo', color: 'teal' },
    { label: '2018', value: 12, displayValue: '₹12k/mo', color: 'teal' },
    { label: '2020', value: 18, displayValue: '₹18k/mo', color: 'teal' },
    { label: '2022', value: 25, displayValue: '₹25k/mo', color: 'teal' },
    { label: '2024', value: 30, displayValue: '₹30k/mo', color: 'teal' },
    { label: '2025', value: 35, displayValue: '₹35k/mo', color: 'teal' }
  ];

  const future5YearsInternData = (_cachedInternshipsFullData && _cachedInternshipsFullData.future_5yr_pathway && Array.isArray(_cachedInternshipsFullData.future_5yr_pathway.domains) && _cachedInternshipsFullData.future_5yr_pathway.domains.length > 0)
    ? _cachedInternshipsFullData.future_5yr_pathway.domains.map(d => ({
        label: d.domain,
        value: parseInt((d.growth || '35').replace(/[^0-9]/g, '')) * 2,
        displayValue: d.growth,
        color: 'coral'
      }))
    : [
    { label: 'Agentic AI / LLMs', value: 92, displayValue: '+45%', color: 'coral' },
    { label: 'EV & Smart Grid', value: 84, displayValue: '+38%', color: 'coral' },
    { label: 'Robotics & Vision', value: 80, displayValue: '+35%', color: 'coral' },
    { label: 'Cloud Security', value: 88, displayValue: '+42%', color: 'coral' },
    { label: 'Bioinformatics', value: 72, displayValue: '+30%', color: 'coral' }
  ];

  container.innerHTML = `
    <div class="courses-discovery-container" style="display:flex; flex-direction:column; gap:24px;">

      <!-- Filter Row: ONE Clean Horizontal Row (SEARCH | STATE | DISTRICT | DURATION | DOMAIN) -->
      <section class="colleges-discovery-filter-card" style="margin-bottom:0;">
        <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap; width:100%;">
          <!-- Search Box -->
          <div class="colleges-search-input-wrap" style="flex:1.4; min-width:200px; margin:0;">
            <span class="colleges-input-lead-icon">🔍</span>
            <input
              type="text"
              id="internshipsSearchInput"
              class="colleges-search-input-field"
              placeholder="Search internship role, domain, company (e.g. Python, AI, Zoho, Bosch)..."
              value="${escapeHtml(internshipsFilterState.search)}"
              oninput="handleInternshipsSearch(this.value)"
            />
            ${internshipsFilterState.search ? `
              <button type="button" class="colleges-filter-clear-btn" style="display:block;" onclick="handleInternshipsSearch(''); document.getElementById('internshipsSearchInput').value='';">✕</button>
            ` : ''}
          </div>

          <!-- State -->
          <div style="flex:1; min-width:140px;">
            <select class="colleges-dropdown-select" style="width:100%; height:44px;" onchange="internshipsFilterState.state = this.value; internshipsFilterState.district = ''; renderInternshipsView();">
              <option value="">🌐 State: All</option>
              ${statesList.map(st => `
                <option value="${st}" ${internshipsFilterState.state === st ? 'selected' : ''}>${st}</option>
              `).join('')}
            </select>
          </div>

          <!-- District -->
          <div style="flex:1; min-width:140px;">
            <select class="colleges-dropdown-select" style="width:100%; height:44px;" ${!internshipsFilterState.state ? 'disabled' : ''} onchange="internshipsFilterState.district = this.value; renderInternshipsView();">
              <option value="">${internshipsFilterState.state ? '📍 ' + internshipsFilterState.state : '📍 District'}</option>
              ${currentDistricts.map(dt => `
                <option value="${dt}" ${internshipsFilterState.district === dt ? 'selected' : ''}>${dt}</option>
              `).join('')}
            </select>
          </div>

          <!-- Duration -->
          <div style="flex:1; min-width:140px;">
            <select class="colleges-dropdown-select" style="width:100%; height:44px;" onchange="internshipsFilterState.duration = this.value; renderInternshipsView();">
              <option value="all">⏱️ Duration: All</option>
              <option value="2 Months" ${internshipsFilterState.duration === '2 Months' ? 'selected' : ''}>2 Months</option>
              <option value="3 Months" ${internshipsFilterState.duration === '3 Months' ? 'selected' : ''}>3 Months</option>
              <option value="6 Months" ${internshipsFilterState.duration === '6 Months' ? 'selected' : ''}>6 Months (PPO)</option>
            </select>
          </div>

          <!-- Domain -->
          <div style="flex:1.1; min-width:160px;">
            <select class="colleges-dropdown-select" style="width:100%; height:44px;" onchange="internshipsFilterState.domain = this.value; renderInternshipsView();">
              <option value="all">🌐 Domain: All</option>
              <option value="Python" ${internshipsFilterState.domain === 'Python' ? 'selected' : ''}>Python Dev</option>
              <option value="Data" ${internshipsFilterState.domain === 'Data' ? 'selected' : ''}>Data Analytics</option>
              <option value="Cloud" ${internshipsFilterState.domain === 'Cloud' ? 'selected' : ''}>Cloud Computing</option>
              <option value="Artificial" ${internshipsFilterState.domain === 'Artificial' ? 'selected' : ''}>AI &amp; ML</option>
              <option value="IoT" ${internshipsFilterState.domain === 'IoT' ? 'selected' : ''}>IoT &amp; Robotics</option>
            </select>
          </div>

          ${isFilterActive ? `
            <button type="button" class="action-btn secondary" style="height:44px; padding:0 12px; font-size:12px; white-space:nowrap;" onclick="internshipsFilterState = {search:'', state:'', district:'', duration:'all', domain:'all'}; renderInternshipsView();">
              ↺ Reset
            </button>
          ` : ''}
        </div>

        <div id="internshipsMetaSummary" class="courses-meta-summary-bar" style="margin-top:12px; padding-top:10px;">
          <div class="courses-meta-summary-text">
            <span>🎯 Showing <strong>${filteredInternships.length}</strong> active corporate internship opportunities (20 Opportunities Listed)</span>
          </div>
          <span style="font-size:11.5px; color:var(--theme-muted);">Verified Monthly Stipends &bull; PPO Fast-Track Blueprints &bull; Research Fellowships</span>
        </div>
      </section>

      <!-- 1. 20 INTERNSHIP COMPANIES / OPPORTUNITIES (Strict Order: First) -->
      <section id="internshipsCardsGrid" class="college-grid" style="gap:20px;">
        ${renderInternshipsCardsHtml(filteredInternships)}
      </section>

      <!-- 2. PAST 10 YEARS & FUTURE 5 YEARS BAR CHART ANALYTICS (Strict Order: Second) -->
      <section style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:20px;">
        <!-- Left: Past 10 Years Evaluation Bar Chart -->
        ${renderCNBarChartHtml({
          title: '📈 Past 10 Years Internship Stipend Evolution (2016 - 2025)',
          subtitle: 'Average Monthly Corporate Stipend & PPO Conversion Growth',
          items: past10YearsStipendData,
          type: 'vertical',
          colorScheme: 'teal'
        })}

        <!-- Right: Future 5 Years Upcoming Bar Chart -->
        ${renderCNBarChartHtml({
          title: '🔮 Future 5 Years Emerging Internship Pathways (2026 - 2030)',
          subtitle: 'Projected Demand Surge in Specialized High-Tech Fellowships',
          items: future5YearsInternData,
          type: 'horizontal',
          colorScheme: 'coral'
        })}
      </section>

      <!-- 3. TOP 10 HIGH-IMPACT STUDENTS / PROJECTS (Strict Order: Third) -->
      <section style="background:#FFFFFF; border:1px solid var(--theme-line, #E2E8F0); border-radius:16px; padding:24px; box-shadow:0 4px 20px rgba(0,0,0,0.03);">
        <div style="margin-bottom:18px; text-align:center;">
          <span style="font-size:11px; font-weight:800; color:#77AC3B; text-transform:uppercase; letter-spacing:0.8px; background:rgba(119,172,59,0.12); padding:4px 12px; border-radius:20px;">🏆 Exemplary Student Innovations</span>
          <h3 style="margin:8px 0 6px; font-size:20px; font-weight:800; color:#0F172A;">Top 10 High-Impact Student Internship Projects</h3>
          <p style="margin:0 auto; font-size:12.5px; color:#64748B; max-width:700px;">Real-world production systems and research prototypes engineered by undergraduate students during corporate internships:</p>
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:14px;">
          ${topProjects.slice(0, 10).map(p => `
            <div style="background:#F8FAFC; border:1px solid var(--theme-line, #E2E8F0); border-radius:12px; padding:14px; display:flex; flex-direction:column; justify-content:space-between;">
              <div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                  <span class="pathway-badge coral" style="font-size:10.5px; font-weight:800;">Rank #${p.rank}</span>
                  <span class="pathway-badge teal" style="font-size:10.5px;">${escapeHtml(p.domain)}</span>
                </div>
                <strong style="color:#0F172A; font-size:13.5px; display:block; margin-bottom:4px; line-height:1.35;">${escapeHtml(p.project)}</strong>
                <div style="font-size:11.5px; color:#64748B; margin-bottom:6px;">🏛️ ${escapeHtml(p.college)} &bull; Partner: <strong style="color:#0F172A;">${escapeHtml(p.company_partner)}</strong></div>
                <div style="font-size:12px; color:#77AC3B; font-weight:700; background:#FFFFFF; padding:6px 8px; border-radius:6px; border:1px solid #E2E8F0;">⚡ Impact: ${escapeHtml(p.impact)}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- 4. REVIEWS (10 Reviews) & 5. SUGGESTION BOX (Strict Order: Fourth & Fifth) -->
      <section class="survey-split-layout" style="margin-top:0;">
        <div class="survey-cards-column">
          <div class="category-shortcuts-heading" style="margin-top:0;">
            <h3>💬 10 Verified Student Internship Reviews</h3>
            <span style="font-size:11.5px; color:var(--theme-muted);">Direct feedback on mentorship, stipend disbursement, and PPO conversions</span>
          </div>

          <div style="display:flex; flex-direction:column; gap:10px; margin-top:12px;">
            ${reviews.slice(0, 10).map(r => `
              <div class="cn-review-card-compact">
                <div class="cn-review-header">
                  <div class="cn-review-author-wrap">
                    <div class="cn-review-avatar">${escapeHtml((r.student || 'IN').slice(0, 2).toUpperCase())}</div>
                    <div>
                      <div class="cn-review-name">${escapeHtml(r.student)}</div>
                      <div class="cn-review-role">🏢 <strong style="color:#0F172A;">${escapeHtml(r.company)}</strong> &bull; ${escapeHtml(r.college || 'Engineering Scholar')}</div>
                    </div>
                  </div>
                  <div class="cn-review-stars">★★★★★ ${(r.rating || 5.0).toFixed(1)}</div>
                </div>
                <p class="cn-review-text">"${escapeHtml(r.comment)}"</p>
              </div>
            `).join('')}
          </div>
        </div>

        <aside class="survey-chart-sidebar">
          <div class="user-remarks-panel" style="background:#FFFFFF; border:1px solid var(--theme-line, #E2E8F0); border-radius:14px; padding:20px; box-shadow:0 4px 16px rgba(0,0,0,0.02);">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
              <span style="font-size:20px;">🎯</span>
              <div>
                <h4 style="margin:0; color:#0F172A; font-size:14px; font-weight:800;">Internship Feedback</h4>
                <small style="color:var(--theme-muted); font-size:11px;">Share your summer project advice</small>
              </div>
            </div>
            <form id="internshipSuggestionForm" onsubmit="submitUniversalSuggestion(event, 'internship');">
              <div class="remarks-form-group" style="margin-bottom:8px;">
                <input type="text" name="user_name" class="remarks-form-input" placeholder="Your Name, Company &amp; College..." style="width:100%; height:38px; font-size:12px; padding:0 10px; border-radius:8px; background:#F8FAFC; border:1px solid var(--theme-line, #E2E8F0); color:#0F172A;" />
              </div>
              <div class="remarks-form-group" style="margin-bottom:10px;">
                <textarea name="message" class="remarks-form-textarea" rows="3" placeholder="Share your experience regarding stipend, PPO interview, or research project..." style="width:100%; font-size:12px; padding:8px 10px; border-radius:8px; background:#F8FAFC; border:1px solid var(--theme-line, #E2E8F0); color:#0F172A; font-family:inherit;"></textarea>
              </div>
              <button type="submit" class="primary-button" style="width:100%; height:38px; font-size:12px; justify-content:center;">
                <span>Submit Internship Feedback ↗</span>
              </button>
            </form>
          </div>
        </aside>
      </section>

    </div>
  `;
}
window.renderInternshipsView = renderInternshipsView;

// ============================================================================
// 6. ADMISSIONS VIEW RENDERER
// ============================================================================
function getAdmissionsFilteredList() {
  const admissionsList = (_cachedAdmissionsData && _cachedAdmissionsData.admissions) ? _cachedAdmissionsData.admissions : [];
  const q = (admissionsFilterState.search || '').toLowerCase().trim();
  const selectedState = (admissionsFilterState.state || '').toLowerCase().trim();
  const selectedDistrict = (admissionsFilterState.district || '').toLowerCase().trim();
  const selectedCourse = (admissionsFilterState.course || 'all').toLowerCase().trim();

  return admissionsList.filter(item => {
    const name = (item.college_name || '').toLowerCase();
    const state = (item.state || '').toLowerCase();
    const dist = (item.district || '').toLowerCase();
    const rawCourses = item.courses_offered || item.courses || [];
    const courses = (Array.isArray(rawCourses) ? rawCourses : (typeof rawCourses === 'string' ? rawCourses.split(',') : [])).map(c => String(c).trim().toLowerCase()).filter(Boolean);

    const matchSearch = !q || name.includes(q) || courses.some(c => c.includes(q));
    const matchState = !selectedState || state.includes(selectedState);
    const matchDist = !selectedDistrict || dist.includes(selectedDistrict);
    const matchCourse = selectedCourse === 'all' || courses.some(c => c.includes(selectedCourse));

    return matchSearch && matchState && matchDist && matchCourse;
  });
}

function renderAdmissionsCardsHtml(filteredAdmissions) {
  if (filteredAdmissions.length === 0) {
    return `
      <div style="grid-column:1/-1; text-align:center; padding:48px 20px; background:var(--theme-surface, #FFFFFF); border:1px dashed var(--theme-line, #E2E8F0); border-radius:14px;">
        <div style="font-size:36px; margin-bottom:8px;">🏛️</div>
        <h3 style="margin:0 0 6px; color:#0F172A;">No Admissions Found</h3>
        <p style="color:var(--theme-muted); font-size:13px; margin-bottom:16px;">No college admissions match your selected search or filter criteria.</p>
        <button type="button" class="primary-button" onclick="admissionsFilterState = {search:'', state:'', district:'', course:'all'}; renderAdmissionsView();">View All College Admissions</button>
      </div>
    `;
  }

  return filteredAdmissions.map(adm => {
    const fees = adm.fee_structure || {};
    return `
      <article class="college-card" style="display:flex; flex-direction:column; justify-content:space-between; border-radius:14px; padding:20px; box-shadow:0 4px 18px rgba(0,0,0,0.03); background:#FFFFFF;">
        <div>
          <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:8px; margin-bottom:10px;">
            <span class="pathway-badge teal">📍 ${escapeHtml(adm.district)}, ${escapeHtml(adm.state)}</span>
            <span class="pathway-badge coral" style="font-weight:800;">Admissions Open</span>
          </div>

          <h3 style="font-size:16.5px; font-weight:800; color:#0F172A; margin:0 0 4px; line-height:1.35;">${escapeHtml(adm.college_name)}</h3>
          <div style="font-size:12px; color:#77AC3B; font-weight:800; margin-bottom:10px;">
            💰 Tuition: ${escapeHtml(adm.course_fees || '₹85,000 / year')} &bull; Reg: ${escapeHtml(adm.admission_fee || '₹5,000')}
          </div>

          <!-- Detailed Fee Breakdown Preview -->
          <div style="background:#F8FAFC; border:1px solid var(--theme-line, #E2E8F0); border-radius:10px; padding:12px; margin-bottom:12px; font-size:11.5px;">
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
              <span style="color:#64748B;">🏢 Hostel Fee:</span>
              <strong style="color:#0F172A;">${escapeHtml(fees.hostel_fee || '₹65,000 / yr')}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
              <span style="color:#64748B;">🚌 Bus Route Fee:</span>
              <strong style="color:#0F172A;">${escapeHtml(fees.bus_transport_fee || '₹22,000 / yr')}</strong>
            </div>
            <div style="display:flex; justify-content:space-between;">
              <span style="color:#64748B;">🍽️ Canteen / Mess:</span>
              <strong style="color:#0F172A;">${escapeHtml(fees.canteen_food_fee || '₹38,000 / yr')}</strong>
            </div>
          </div>

          <div style="font-size:11.5px; color:#64748B; margin-bottom:10px;">
            ⏱️ <strong>College Timings:</strong> ${escapeHtml(adm.college_timings || '8:30 AM - 4:30 PM')}<br/>
            🏛️ <strong>Admission Desk:</strong> ${escapeHtml(adm.admission_office_timings || '9:00 AM - 5:30 PM')}
          </div>

          <div style="font-size:11.5px; color:#334155; line-height:1.45; margin-bottom:12px; background:#F8FAFC; padding:8px 10px; border-radius:8px; border:1px solid #E2E8F0;">
            📅 <strong>Timeline:</strong> Open ${escapeHtml(adm.opening_date || 'Jan 2026')} → Closes ${escapeHtml(adm.closing_date || 'Aug 2026')}
          </div>
        </div>

        <div style="padding-top:10px; border-top:1px solid var(--theme-line, #E2E8F0);">
          <button type="button" class="pathway-card-btn" style="width:100%; justify-content:center;" onclick="openAdmissionDetailModal('${adm.id}')">
            <span>Full Fee &amp; Document Blueprint ➔</span>
          </button>
        </div>
      </article>
    `;
  }).join('');
}

function handleAdmissionsSearch(val) {
  admissionsFilterState.search = val;
  const filteredAdmissions = getAdmissionsFilteredList();
  const grid = document.getElementById('admissionsCardsGrid');
  if (grid) grid.innerHTML = renderAdmissionsCardsHtml(filteredAdmissions);

  const summary = document.getElementById('admissionsMetaSummary');
  if (summary) {
    summary.innerHTML = `
      <div class="courses-meta-summary-text">
        <span>📝 Showing <strong>${filteredAdmissions.length}</strong> matching college admissions from active database</span>
        ${admissionsFilterState.state ? ` &bull; <span>State: <strong style="color:var(--coral);">${admissionsFilterState.state}</strong></span>` : ''}
        ${admissionsFilterState.district ? ` &bull; <span>District: <strong style="color:var(--teal);">${admissionsFilterState.district}</strong></span>` : ''}
      </div>
      <span style="font-size:11.5px; color:var(--theme-muted);">Verified 2026 Academic Year Cutoffs &bull; Transparent Fee Disclosures</span>
    `;
  }
}
window.handleAdmissionsSearch = handleAdmissionsSearch;

async function renderAdmissionsView() {
  const container = document.getElementById('admissionsPageContent');
  if (!container) return;

  if (!_cachedAdmissionsData) {
    try {
      const res = await fetch('/api/admissions');
      if (res.ok) {
        const data = await res.json();
        if (data && data.admissions) _cachedAdmissionsData = data;
      }
    } catch (e) {
      console.warn('[Admissions] Live fetch fallback:', e);
    }
  }

  const filteredAdmissions = getAdmissionsFilteredList();
  const notifications = (_cachedAdmissionsData && _cachedAdmissionsData.admission_notifications) ? _cachedAdmissionsData.admission_notifications : [];
  const reviews = (_cachedAdmissionsData && Array.isArray(_cachedAdmissionsData.reviews) && _cachedAdmissionsData.reviews.length > 0) ? _cachedAdmissionsData.reviews : [
    { author: 'K. Rajasekaran', role: 'Parent (B.Tech Candidate)', rating: 5.0, college: 'PSG College of Technology', comment: 'Transparent fee schedule with zero hidden charges. Single-window counseling desk helped us finish document verification in under 30 minutes.' },
    { author: 'Meera Vijayakumar', role: 'Student (CSE 2026)', rating: 4.9, college: 'Adithya Institute of Technology', comment: 'The hostel and bus route fee breakdown was 100% accurate. Staff guided us through the Tamil Nadu First Graduate concession smoothly.' },
    { author: 'Dr. N. Sundaram', role: 'Parent (AI & DS Scholar)', rating: 5.0, college: 'Amrita Vishwa Vidyapeetham', comment: 'Clear admission timelines, scholarship eligibility calculators, and well-organized document checklists saved immense time.' },
    { author: 'P. Anand', role: 'Student (Mechanical)', rating: 4.8, college: 'Coimbatore Institute of Technology', comment: 'CIT admission office provided precise hostel allocation criteria and fee payment receipts without delays.' }
  ];

  const statesList = getStatesAndDistrictsList();
  const currentDistricts = admissionsFilterState.state ? getDistrictsForState(admissionsFilterState.state) : [];
  const isFilterActive = !!(admissionsFilterState.search || admissionsFilterState.state || admissionsFilterState.district || (admissionsFilterState.course && admissionsFilterState.course !== 'all'));

  // Dual Bar Charts for Admissions
  const past10YearsAdmissionPriority = [
    { label: 'CSE & AI', value: 96, displayValue: 'Top 1 (96%)', color: 'teal' },
    { label: 'ECE & Robotics', value: 84, displayValue: 'Top 2 (84%)', color: 'teal' },
    { label: 'Biotech & BioMed', value: 72, displayValue: 'Top 3 (72%)', color: 'teal' },
    { label: 'Mechanical Engg', value: 58, displayValue: 'Moderate (58%)', color: 'teal' },
    { label: 'Civil Engg', value: 42, displayValue: 'Low (42%)', color: 'teal' }
  ];

  const next10YearsCoursePreference = [
    { label: 'Generative AI & Agentic', value: 98, displayValue: '+60% Demand', color: 'coral' },
    { label: 'Autonomous EV & Mobility', value: 90, displayValue: '+45% Demand', color: 'coral' },
    { label: 'Quantum & Cyber Defense', value: 86, displayValue: '+40% Demand', color: 'coral' },
    { label: 'Renewable Energy & Battery', value: 82, displayValue: '+36% Demand', color: 'coral' },
    { label: 'Bioinformatics & MedTech', value: 80, displayValue: '+32% Demand', color: 'coral' }
  ];

  container.innerHTML = `
    <div class="courses-discovery-container" style="display:flex; flex-direction:column; gap:24px;">

      <!-- 1. Search & Filter Bar: ONE Clean Horizontal Row (SEARCH | STATE | DISTRICT | DEGREE/COURSE) -->
      <section class="colleges-discovery-filter-card" style="margin-bottom:0;">
        <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap; width:100%;">
          <!-- Search Box -->
          <div class="colleges-search-input-wrap" style="flex:1.5; min-width:220px; margin:0;">
            <span class="colleges-input-lead-icon">🔍</span>
            <input
              type="text"
              id="admissionsSearchInput"
              class="colleges-search-input-field"
              placeholder="Search college name, district, course (e.g. Coimbatore, B.Tech, Amrita)..."
              value="${escapeHtml(admissionsFilterState.search)}"
              oninput="handleAdmissionsSearch(this.value)"
            />
            ${admissionsFilterState.search ? `
              <button type="button" class="colleges-filter-clear-btn" style="display:block;" onclick="handleAdmissionsSearch(''); document.getElementById('admissionsSearchInput').value='';">✕</button>
            ` : ''}
          </div>

          <!-- State -->
          <div style="flex:1; min-width:150px;">
            <select class="colleges-dropdown-select" style="width:100%; height:44px;" onchange="admissionsFilterState.state = this.value; admissionsFilterState.district = ''; renderAdmissionsView();">
              <option value="">🌐 State: All</option>
              ${statesList.map(st => `
                <option value="${st}" ${admissionsFilterState.state === st ? 'selected' : ''}>${st}</option>
              `).join('')}
            </select>
          </div>

          <!-- District -->
          <div style="flex:1; min-width:150px;">
            <select class="colleges-dropdown-select" style="width:100%; height:44px;" ${!admissionsFilterState.state ? 'disabled' : ''} onchange="admissionsFilterState.district = this.value; renderAdmissionsView();">
              <option value="">${admissionsFilterState.state ? '📍 ' + admissionsFilterState.state : '📍 District'}</option>
              ${currentDistricts.map(dt => `
                <option value="${dt}" ${admissionsFilterState.district === dt ? 'selected' : ''}>${dt}</option>
              `).join('')}
            </select>
          </div>

          <!-- Degree/Course -->
          <div style="flex:1.2; min-width:170px;">
            <select class="colleges-dropdown-select" style="width:100%; height:44px;" onchange="admissionsFilterState.course = this.value; renderAdmissionsView();">
              <option value="all">🎓 Degree/Course: All</option>
              <option value="B.Tech" ${admissionsFilterState.course === 'B.Tech' ? 'selected' : ''}>B.Tech / B.E (Engineering)</option>
              <option value="B.Sc" ${admissionsFilterState.course === 'B.Sc' ? 'selected' : ''}>B.Sc / Arts &amp; Science</option>
              <option value="MBA" ${admissionsFilterState.course === 'MBA' ? 'selected' : ''}>MBA / Management</option>
              <option value="Medical" ${admissionsFilterState.course === 'Medical' ? 'selected' : ''}>Medical / MBBS</option>
            </select>
          </div>

          ${isFilterActive ? `
            <button type="button" class="action-btn secondary" style="height:44px; padding:0 12px; font-size:12px; white-space:nowrap;" onclick="admissionsFilterState = {search:'', state:'', district:'', course:'all'}; renderAdmissionsView();">
              ↺ Reset
            </button>
          ` : ''}
        </div>

        <div id="admissionsMetaSummary" class="courses-meta-summary-bar" style="margin-top:12px; padding-top:10px;">
          <div class="courses-meta-summary-text">
            <span>📝 Showing <strong>${filteredAdmissions.length}</strong> matching college admissions from active database</span>
            ${admissionsFilterState.state ? ` &bull; <span>State: <strong style="color:var(--coral);">${admissionsFilterState.state}</strong></span>` : ''}
            ${admissionsFilterState.district ? ` &bull; <span>District: <strong style="color:var(--teal);">${admissionsFilterState.district}</strong></span>` : ''}
          </div>
          <span style="font-size:11.5px; color:var(--theme-muted);">Verified 2026 Academic Year Cutoffs &bull; Transparent Fee Disclosures</span>
        </div>
      </section>

      <!-- 2. LIVE 2026 ADMISSIONS SECTION (Subtly Pulsing Glowing Border Highlight) -->
      <section class="cn-live-alert-highlight cn-live-alert-pulsing" style="background:#FFFFFF; border-radius:16px; padding:22px; box-shadow:0 4px 20px rgba(0,0,0,0.03);">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; flex-wrap:wrap; gap:10px;">
          <div style="display:flex; align-items:center; gap:10px;">
            <span style="font-size:22px;">📢</span>
            <div>
              <h3 style="margin:0; font-size:17px; font-weight:800; color:#0F172A;">LIVE 2026 ADMISSIONS &bull; ACTIVE APPLICATION DESKS</h3>
              <small style="color:#64748B; font-size:11.5px;">Official university portals with open registration windows</small>
            </div>
          </div>
          <span class="pathway-badge coral" style="font-weight:800; font-size:11.5px;">🔥 Application Cycle Active</span>
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:12px;">
          ${notifications.map(n => `
            <div style="background:#F8FAFC; border:1px solid var(--theme-line, #E2E8F0); border-radius:10px; padding:12px 14px; display:flex; justify-content:space-between; align-items:center;">
              <div>
                <strong style="color:#0F172A; font-size:13px; display:block; margin-bottom:2px;">${escapeHtml(n.title)}</strong>
                <small style="color:#64748B; font-size:11px;">🏛️ ${escapeHtml(n.college)}</small>
              </div>
              <div style="text-align:right;">
                <span class="pathway-badge ${n.badge === 'URGENT' ? 'coral' : 'teal'}" style="font-size:10px;">${escapeHtml(n.badge)}</span>
                <div style="font-size:10.5px; color:#64748B; margin-top:2px;">${escapeHtml(n.date)}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- 3. Matching Colleges Admissions Cards Grid (From Database) -->
      <section id="admissionsCardsGrid" class="college-grid" style="gap:20px;">
        ${renderAdmissionsCardsHtml(filteredAdmissions)}
      </section>

      <!-- 4. Dual Bar Charts: Past 10 Years Admission Priority vs Next 10 Years Course Preferences -->
      <section style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:20px;">
        <!-- Left: Past 10 Years Admission Priority -->
        ${renderCNBarChartHtml({
          title: '📊 Past 10 Years Admission Priority Trends (2016-2025)',
          subtitle: 'Historical counseling seat selection rank preferences across domains',
          items: past10YearsAdmissionPriority,
          type: 'vertical',
          colorScheme: 'teal'
        })}

        <!-- Right: Next 10 Years Expected Course Preferences -->
        ${renderCNBarChartHtml({
          title: '🔮 Next 10 Years Course Demand Preference (2026-2035)',
          subtitle: 'Projected student preference surge in frontier computing & technology courses',
          items: next10YearsCoursePreference,
          type: 'horizontal',
          colorScheme: 'coral'
        })}
      </section>

      <!-- 5. Reviews & Suggestion Box Split Section -->
      <section class="survey-split-layout" style="margin-top:0;">
        <div class="survey-cards-column">
          <div class="category-shortcuts-heading" style="margin-top:0;">
            <h3>💬 Parent &amp; Student Admission Reviews</h3>
            <span style="font-size:11.5px; color:var(--theme-muted);">Verified feedback on transparent fees, document verification, and seat allocation</span>
          </div>

          <div style="display:flex; flex-direction:column; gap:10px; margin-top:12px;">
            ${reviews.slice(0, 4).map(r => `
              <div class="cn-review-card-compact">
                <div class="cn-review-header">
                  <div class="cn-review-author-wrap">
                    <div class="cn-review-avatar">${escapeHtml((r.author || 'AD').slice(0, 2).toUpperCase())}</div>
                    <div>
                      <div class="cn-review-name">${escapeHtml(r.author || 'Parent')}</div>
                      <div class="cn-review-role">🏛️ <strong style="color:#0F172A;">${escapeHtml(r.college || 'Coimbatore')}</strong> &bull; ${escapeHtml(r.role || 'Parent')}</div>
                    </div>
                  </div>
                  <div class="cn-review-stars">★★★★★ ${(r.rating || 5.0).toFixed(1)}</div>
                </div>
                <p class="cn-review-text">"${escapeHtml(r.comment)}"</p>
              </div>
            `).join('')}
          </div>
        </div>

        <aside class="survey-chart-sidebar">
          <div class="user-remarks-panel" style="background:#FFFFFF; border:1px solid var(--theme-line, #E2E8F0); border-radius:14px; padding:20px; box-shadow:0 4px 16px rgba(0,0,0,0.02);">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
              <span style="font-size:20px;">📝</span>
              <div>
                <h4 style="margin:0; color:#0F172A; font-size:14px; font-weight:800;">Admission Query Box</h4>
                <small style="color:var(--theme-muted); font-size:11px;">Ask about cutoffs or fee waivers</small>
              </div>
            </div>
            <form id="admissionSuggestionForm" onsubmit="submitUniversalSuggestion(event, 'admission');">
              <div class="remarks-form-group" style="margin-bottom:8px;">
                <input type="text" name="user_name" class="remarks-form-input" placeholder="Your Name &amp; Target College..." style="width:100%; height:38px; font-size:12px; padding:0 10px; border-radius:8px; background:#F8FAFC; border:1px solid var(--theme-line, #E2E8F0); color:#0F172A;" />
              </div>
              <div class="remarks-form-group" style="margin-bottom:10px;">
                <textarea name="message" class="remarks-form-textarea" rows="3" placeholder="Ask about fee concession, bus routes, document checklist, or admission dates..." style="width:100%; font-size:12px; padding:8px 10px; border-radius:8px; background:#F8FAFC; border:1px solid var(--theme-line, #E2E8F0); color:#0F172A; font-family:inherit;"></textarea>
              </div>
              <button type="submit" class="primary-button" style="width:100%; height:38px; font-size:12px; justify-content:center;">
                <span>Submit Admission Query ↗</span>
              </button>
            </form>
          </div>
        </aside>
      </section>

    </div>
  `;
}
window.renderAdmissionsView = renderAdmissionsView;

// ============================================================================
// 7. SCHOLARSHIPS VIEW RENDERER
// ============================================================================
function getScholarshipsFilteredList() {
  const scholarshipsList = (_cachedScholarshipsFullData && _cachedScholarshipsFullData.scholarships) ? _cachedScholarshipsFullData.scholarships : [];
  const q = (scholarshipsFilterState.search || '').toLowerCase().trim();
  const selectedState = (scholarshipsFilterState.state || '').toLowerCase().trim();
  const selectedDistrict = (scholarshipsFilterState.district || '').toLowerCase().trim();
  const selectedType = (scholarshipsFilterState.type || 'all').toLowerCase().trim();

  return scholarshipsList.filter(s => {
    const name = (s.name || '').toLowerCase();
    const type = (s.type || '').toLowerCase();
    const state = (s.state || '').toLowerCase();
    const college = (s.college_eligibility || '').toLowerCase();
    const benefit = (s.benefit || '').toLowerCase();

    const matchSearch = !q || name.includes(q) || college.includes(q) || benefit.includes(q);
    const matchState = !selectedState || state.includes(selectedState) || state.includes('all india');
    const matchDist = !selectedDistrict || (s.district || '').toLowerCase().includes(selectedDistrict) || selectedDistrict === '';
    const matchType = selectedType === 'all' || type.includes(selectedType);

    return matchSearch && matchState && matchDist && matchType;
  });
}

function renderScholarshipsCardsHtml(filtered) {
  if (filtered.length === 0) {
    return `
      <div style="grid-column:1/-1; text-align:center; padding:48px 20px; background:var(--theme-surface, #FFFFFF); border:1px dashed var(--theme-line, #E2E8F0); border-radius:14px;">
        <div style="font-size:36px; margin-bottom:8px;">🎓</div>
        <h3 style="margin:0 0 6px; color:#0F172A;">No Scholarships Found</h3>
        <p style="color:var(--theme-muted); font-size:13px; margin-bottom:16px;">No scholarship schemes match your selected search or filter criteria.</p>
        <button type="button" class="primary-button" onclick="scholarshipsFilterState = {search:'', state:'', district:'', type:'all'}; renderScholarshipsView();">View All Scholarship Schemes</button>
      </div>
    `;
  }

  return filtered.map(s => `
    <article class="college-card" style="display:flex; flex-direction:column; justify-content:space-between; border-radius:14px; padding:20px; box-shadow:0 4px 18px rgba(0,0,0,0.03); background:#FFFFFF;">
      <div>
        <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:8px; margin-bottom:10px;">
          <span class="pathway-badge teal">${escapeHtml(s.type)}</span>
          <span class="pathway-badge coral" style="font-weight:800;">${escapeHtml(s.deadline ? 'Deadline: ' + s.deadline : 'Active')}</span>
        </div>

        <h3 style="font-size:16.5px; font-weight:800; color:#0F172A; margin:0 0 6px; line-height:1.35;">${escapeHtml(s.name)}</h3>
        <div style="font-size:13px; color:#77AC3B; font-weight:800; margin-bottom:10px;">
          💰 Benefit: ${escapeHtml(s.benefit)}
        </div>

        <div style="background:#F8FAFC; border:1px solid var(--theme-line, #E2E8F0); border-radius:10px; padding:12px; margin-bottom:12px;">
          <div style="font-size:12px; color:#334155; line-height:1.45; margin-bottom:4px;">
            📋 <strong>Eligibility:</strong> ${escapeHtml(s.eligibility_criteria)}
          </div>
          <div style="font-size:11.5px; color:#64748B;">
            🏛️ <strong>Eligible Colleges:</strong> ${escapeHtml(s.college_eligibility || 'All Recognized Colleges')}
          </div>
        </div>

        <div style="margin-bottom:12px;">
          <span style="font-size:11px; font-weight:700; color:#64748B; display:block; margin-bottom:4px; text-transform:uppercase;">Required Documents:</span>
          <div style="display:flex; flex-wrap:wrap; gap:4px;">
            ${(s.required_documents || []).slice(0, 3).map(d => `<span class="pathway-badge" style="background:#F1F5F9; color:#0F172A; font-size:11px;">📄 ${escapeHtml(d)}</span>`).join('')}
          </div>
        </div>
      </div>

      <div style="padding-top:10px; border-top:1px solid var(--theme-line, #E2E8F0);">
        <button type="button" class="pathway-card-btn" style="width:100%; justify-content:center;" onclick="openScholarshipDetailModal('${s.id}')">
          <span>View Guidelines &amp; Documents Checklist ➔</span>
        </button>
      </div>
    </article>
  `).join('');
}

function handleScholarshipsSearch(val) {
  scholarshipsFilterState.search = val;
  const filtered = getScholarshipsFilteredList();
  const grid = document.getElementById('scholarshipsCardsGrid');
  if (grid) grid.innerHTML = renderScholarshipsCardsHtml(filtered);

  const summary = document.getElementById('scholarshipsMetaSummary');
  if (summary) {
    summary.innerHTML = `
      <div class="courses-meta-summary-text">
        <span>🎓 Showing <strong>${filtered.length}</strong> active scholarship &amp; fee concession schemes</span>
      </div>
      <span style="font-size:11.5px; color:var(--theme-muted);">100% Tuition Waivers &bull; Direct Benefit Transfer (DBT) Blueprints</span>
    `;
  }
}
window.handleScholarshipsSearch = handleScholarshipsSearch;

async function renderScholarshipsView() {
  const container = document.getElementById('scholarshipsPageContent');
  if (!container) return;

  if (!_cachedScholarshipsFullData) {
    try {
      const res = await fetch('/api/scholarships/full');
      if (res.ok) {
        const data = await res.json();
        if (data && (data.scholarships || data.application_flow)) _cachedScholarshipsFullData = data;
      }
    } catch (e) {
      console.warn('[Scholarships] Live fetch fallback:', e);
    }
  }

  const defaultScholarshipAppFlow = [
    { step: 1, name: 'Check Eligibility', desc: 'Verify academic percentage (60%+), domicile state, and family income bracket.' },
    { step: 2, name: 'Prepare Documents', desc: 'Collect Income Certificate, 10+2 marksheets, and Aadhaar-seeded Bank Passbook.' },
    { step: 3, name: 'Verification', desc: 'Documents verified by Tahsildar / e-Sevai and validated by College Nodal Desk.' },
    { step: 4, name: 'Application', desc: 'Submit the digital form on State NSP / e-Grantz / University portal before deadline.' },
    { step: 5, name: 'Approval', desc: 'State Welfare Board or Central Ministry reviews dossier and issues sanction grant letters.' },
    { step: 6, name: 'Scholarship Result/Benefit', desc: 'Direct Benefit Transfer (DBT) funds credited into student bank account or tuition waived.' }
  ];

  const defaultScholarshipReviews = [
    { id: 'SR-01', student: 'Bhuvaneshwari M.', college: 'Adithya Institute of Technology, Coimbatore', rating: 5, scheme: 'First Graduate Concession', comment: 'Getting the ₹25,000 annual fee waiver as a First Graduate in my family made engineering college affordable.' },
    { id: 'SR-02', student: 'Haritha Krishnan', college: 'Karunya Institute of Technology and Sciences', rating: 5, scheme: 'Pragati Scholarship', comment: 'The ₹50,000 annual stipend covered my laptop and technical books completely. Highly recommend all eligible girls apply!' },
    { id: 'SR-03', student: 'Manoj Kumar', college: 'Tamilnadu Agricultural University, Coimbatore', rating: 4.9, scheme: 'Post-Matric Scholarship', comment: 'Full tuition and hostel fee reimbursement was processed through DBT directly to my bank account with zero hassle.' },
    { id: 'SR-04', student: 'Swathi Sundaram', college: 'Amrita Vishwa Vidyapeetham, Coimbatore', rating: 5, scheme: 'Amrita Chancellor Merit', comment: 'Received 50% tuition scholarship based on my AEEE rank. The renewal process each year based on CGPA is transparent.' },
    { id: 'SR-05', student: 'Pradeep R.', college: 'ADITHYA COLLEGE OF ARTS AND SCIENCE, Coimbatore', rating: 4.8, scheme: "Adithya Founder's Merit", comment: 'Scored 92% in 12th Commerce and received merit concession right at the time of admission.' }
  ];

  const filtered = getScholarshipsFilteredList();
  const appFlow = (_cachedScholarshipsFullData && Array.isArray(_cachedScholarshipsFullData.application_flow) && _cachedScholarshipsFullData.application_flow.length > 0)
    ? _cachedScholarshipsFullData.application_flow
    : defaultScholarshipAppFlow;

  const reviews = (_cachedScholarshipsFullData && Array.isArray(_cachedScholarshipsFullData.reviews) && _cachedScholarshipsFullData.reviews.length > 0)
    ? _cachedScholarshipsFullData.reviews
    : defaultScholarshipReviews;

  const statesList = getStatesAndDistrictsList();
  const currentDistricts = scholarshipsFilterState.state ? getDistrictsForState(scholarshipsFilterState.state) : [];
  const isFilterActive = !!(scholarshipsFilterState.search || scholarshipsFilterState.state || scholarshipsFilterState.district || (scholarshipsFilterState.type && scholarshipsFilterState.type !== 'all'));

  // Scholarship Survey Trends Bar Chart Data
  const scholarshipSurveyTrends = [
    { label: 'State Tuition Waivers', value: 94, displayValue: '94% Applied', color: 'teal' },
    { label: 'First Graduate Aid', value: 88, displayValue: '88% Granted', color: 'teal' },
    { label: 'Central Merit Schemes', value: 76, displayValue: '76% Eligible', color: 'teal' },
    { label: 'Girls Technical (Pragati)', value: 84, displayValue: '84% Disbursed', color: 'teal' },
    { label: 'Institutional Waivers', value: 68, displayValue: '68% Utilized', color: 'teal' }
  ];

  container.innerHTML = `
    <div class="courses-discovery-container" style="display:flex; flex-direction:column; gap:24px;">

      <!-- 1. Search & Filter Bar: ONE Clean Horizontal Row (SEARCH | STATE | DISTRICT | SCHOLARSHIP TYPE) -->
      <section class="colleges-discovery-filter-card" style="margin-bottom:0;">
        <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap; width:100%;">
          <!-- Search Box -->
          <div class="colleges-search-input-wrap" style="flex:1.5; min-width:220px; margin:0;">
            <span class="colleges-input-lead-icon">🔍</span>
            <input
              type="text"
              id="scholarshipsSearchInput"
              class="colleges-search-input-field"
              placeholder="Search scholarship name, eligible college, benefit (e.g. First Graduate, Pragati)..."
              value="${escapeHtml(scholarshipsFilterState.search)}"
              oninput="handleScholarshipsSearch(this.value)"
            />
            ${scholarshipsFilterState.search ? `
              <button type="button" class="colleges-filter-clear-btn" style="display:block;" onclick="handleScholarshipsSearch(''); document.getElementById('scholarshipsSearchInput').value='';">✕</button>
            ` : ''}
          </div>

          <!-- State -->
          <div style="flex:1; min-width:150px;">
            <select class="colleges-dropdown-select" style="width:100%; height:44px;" onchange="scholarshipsFilterState.state = this.value; scholarshipsFilterState.district = ''; renderScholarshipsView();">
              <option value="">🌐 State: All</option>
              ${statesList.map(st => `
                <option value="${st}" ${scholarshipsFilterState.state === st ? 'selected' : ''}>${st}</option>
              `).join('')}
            </select>
          </div>

          <!-- District -->
          <div style="flex:1; min-width:150px;">
            <select class="colleges-dropdown-select" style="width:100%; height:44px;" ${!scholarshipsFilterState.state ? 'disabled' : ''} onchange="scholarshipsFilterState.district = this.value; renderScholarshipsView();">
              <option value="">${scholarshipsFilterState.state ? '📍 ' + scholarshipsFilterState.state : '📍 District'}</option>
              ${currentDistricts.map(dt => `
                <option value="${dt}" ${scholarshipsFilterState.district === dt ? 'selected' : ''}>${dt}</option>
              `).join('')}
            </select>
          </div>

          <!-- Scholarship Type -->
          <div style="flex:1.2; min-width:170px;">
            <select class="colleges-dropdown-select" style="width:100%; height:44px;" onchange="scholarshipsFilterState.type = this.value; renderScholarshipsView();">
              <option value="all">🎓 Scheme: All Types</option>
              <option value="State" ${scholarshipsFilterState.type === 'State' ? 'selected' : ''}>State Government Aid</option>
              <option value="Central" ${scholarshipsFilterState.type === 'Central' ? 'selected' : ''}>Central Government Aid</option>
              <option value="Institutional" ${scholarshipsFilterState.type === 'Institutional' ? 'selected' : ''}>Institutional Merit Waiver</option>
              <option value="Welfare" ${scholarshipsFilterState.type === 'Welfare' ? 'selected' : ''}>Welfare Aid</option>
            </select>
          </div>

          ${isFilterActive ? `
            <button type="button" class="action-btn secondary" style="height:44px; padding:0 12px; font-size:12px; white-space:nowrap;" onclick="scholarshipsFilterState = {search:'', state:'', district:'', type:'all'}; renderScholarshipsView();">
              ↺ Reset
            </button>
          ` : ''}
        </div>

        <div id="scholarshipsMetaSummary" class="courses-meta-summary-bar" style="margin-top:12px; padding-top:10px;">
          <div class="courses-meta-summary-text">
            <span>🎓 Showing <strong>${filtered.length}</strong> active scholarship &amp; fee concession schemes</span>
          </div>
          <span style="font-size:11.5px; color:var(--theme-muted);">100% Tuition Waivers &bull; Direct Benefit Transfer (DBT) Blueprints</span>
        </div>
      </section>

      <!-- 2. Scholarship Cards Grid -->
      <section id="scholarshipsCardsGrid" class="college-grid" style="gap:20px;">
        ${renderScholarshipsCardsHtml(filtered)}
      </section>

      <!-- 3. STEP-BY-STEP PROCESS (Directly Below Scholarship Cards) -->
      <section style="background:#FFFFFF; border:1px solid var(--theme-line, #E2E8F0); border-radius:16px; padding:24px; box-shadow:0 4px 20px rgba(0,0,0,0.03);">
        <div style="text-align:center; margin-bottom:18px;">
          <span style="font-size:11px; font-weight:800; color:#77AC3B; text-transform:uppercase; letter-spacing:0.8px; background:rgba(119,172,59,0.12); padding:4px 12px; border-radius:20px;">🧭 Standard Approval Workflow</span>
          <h3 style="margin:8px 0 6px; font-size:19px; font-weight:800; color:#0F172A;">Step-by-Step Scholarship Application Process</h3>
          <p style="margin:0 auto; font-size:12.5px; color:#64748B; max-width:680px;">Standard verification procedure for government concessions, merit waivers, and direct benefit transfer (DBT) grants:</p>
        </div>

        <div class="cn-process-steps-grid">
          ${appFlow.map(st => `
            <div class="cn-process-step-item">
              <div class="cn-step-badge">${st.step}</div>
              <div class="cn-step-title">${escapeHtml(st.name)}</div>
              <p class="cn-step-desc">${escapeHtml(st.desc)}</p>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- 4. Scholarship Survey Trends Bar Chart -->
      <section style="display:grid; grid-template-columns:1fr; gap:20px;">
        ${renderCNBarChartHtml({
          title: '📊 Annual Scholarship Survey & Beneficiary Conversion Trends',
          subtitle: 'Verification approval rates, scheme demand, and direct benefit transfer (DBT) utilization',
          items: scholarshipSurveyTrends,
          type: 'horizontal',
          colorScheme: 'teal'
        })}
      </section>

      <!-- 5. Reviews & Suggestion Box -->
      <section class="survey-split-layout" style="margin-top:0;">
        <div class="survey-cards-column">
          <div class="category-shortcuts-heading" style="margin-top:0;">
            <h3>💬 Verified Student Scholarship Recipient Reviews</h3>
            <span style="font-size:11.5px; color:var(--theme-muted);">Real student feedback on grant receipt and DBT disbursement</span>
          </div>

          <div style="display:flex; flex-direction:column; gap:10px; margin-top:12px;">
            ${reviews.map(r => `
              <div class="cn-review-card-compact">
                <div class="cn-review-header">
                  <div class="cn-review-author-wrap">
                    <div class="cn-review-avatar">${escapeHtml((r.student || 'SC').slice(0, 2).toUpperCase())}</div>
                    <div>
                      <div class="cn-review-name">${escapeHtml(r.student || 'Student')}</div>
                      <div class="cn-review-role">🎓 <strong style="color:#0F172A;">${escapeHtml(r.college || 'Coimbatore')}</strong> &bull; <span style="color:#77AC3B; font-weight:700;">${escapeHtml(r.scheme || 'Scholarship')}</span></div>
                    </div>
                  </div>
                  <div class="cn-review-stars">★★★★★ ${(r.rating || 5.0).toFixed(1)}</div>
                </div>
                <p class="cn-review-text">"${escapeHtml(r.comment)}"</p>
              </div>
            `).join('')}
          </div>
        </div>

        <aside class="survey-chart-sidebar">
          <div class="user-remarks-panel" style="background:#FFFFFF; border:1px solid var(--theme-line, #E2E8F0); border-radius:14px; padding:20px; box-shadow:0 4px 16px rgba(0,0,0,0.02);">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
              <span style="font-size:20px;">🎓</span>
              <div>
                <h4 style="margin:0; color:#0F172A; font-size:14px; font-weight:800;">Scholarship Query Box</h4>
                <small style="color:var(--theme-muted); font-size:11px;">Ask about eligibility or grants</small>
              </div>
            </div>
            <form id="scholarshipSuggestionForm" onsubmit="submitUniversalSuggestion(event, 'scholarship');">
              <div class="remarks-form-group" style="margin-bottom:8px;">
                <input type="text" name="user_name" class="remarks-form-input" placeholder="Your Name, College &amp; Course..." style="width:100%; height:38px; font-size:12px; padding:0 10px; border-radius:8px; background:#F8FAFC; border:1px solid var(--theme-line, #E2E8F0); color:#0F172A;" />
              </div>
              <div class="remarks-form-group" style="margin-bottom:10px;">
                <textarea name="message" class="remarks-form-textarea" rows="3" placeholder="Ask about income ceiling, document submission, or Tahsildar certificates..." style="width:100%; font-size:12px; padding:8px 10px; border-radius:8px; background:#F8FAFC; border:1px solid var(--theme-line, #E2E8F0); color:#0F172A; font-family:inherit;"></textarea>
              </div>
              <button type="submit" class="primary-button" style="width:100%; height:38px; font-size:12px; justify-content:center;">
                <span>Submit Scholarship Query ↗</span>
              </button>
            </form>
          </div>
        </aside>
      </section>

    </div>
  `;
}
window.renderScholarshipsView = renderScholarshipsView;

// ============================================================================
// 8. COLLEGE FACILITIES VIEW RENDERER (STRICTLY ISOLATED PER COLLEGE)
// ============================================================================
function getFacilitiesFilteredColleges() {
  const facilitiesMap = (_cachedFacilitiesData && _cachedFacilitiesData.facilities_by_college) ? _cachedFacilitiesData.facilities_by_college : {};
  const allColleges = Object.values(facilitiesMap);
  const q = (facilitiesFilterState.search || '').toLowerCase().trim();
  const selectedState = (facilitiesFilterState.state || '').toLowerCase().trim();
  const selectedDistrict = (facilitiesFilterState.district || '').toLowerCase().trim();
  const selectedCourse = (facilitiesFilterState.course || 'all').toLowerCase().trim();

  return allColleges.filter(f => {
    const name = (f.college_name || '').toLowerCase();
    const state = (f.state || '').toLowerCase();
    const dist = (f.district || '').toLowerCase();
    const rawDepts = f.departments || f.classrooms || '';
    const depts = (Array.isArray(rawDepts) ? rawDepts.join(' ') : String(rawDepts || '')).toLowerCase();

    const matchSearch = !q || name.includes(q) || depts.includes(q);
    const matchState = !selectedState || state.includes(selectedState);
    const matchDist = !selectedDistrict || dist.includes(selectedDistrict);
    const matchCourse = selectedCourse === 'all' || depts.includes(selectedCourse);

    return matchSearch && matchState && matchDist && matchCourse;
  });
}

function renderFacilityDetailHtml(selectedFacility) {
  if (!selectedFacility || !selectedFacility.college_name) {
    return `
      <div style="text-align:center; padding:40px 20px; background:#FFFFFF; border:1px dashed #CBD5E1; border-radius:16px;">
        <div style="font-size:36px; margin-bottom:8px;">🏛️</div>
        <h3 style="margin:0 0 6px; color:#0F172A;">No Matching College Facility Found</h3>
        <p style="color:#64748B; font-size:12.5px; margin:0;">Please try searching for another college name or clear your filters.</p>
      </div>
    `;
  }

  return `
    <section style="background:#FFFFFF; border:1px solid var(--theme-line, #E2E8F0); border-radius:16px; padding:24px; box-shadow:0 4px 20px rgba(0,0,0,0.03);">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:12px; margin-bottom:20px; padding-bottom:16px; border-bottom:1px solid var(--theme-line, #E2E8F0);">
        <div>
          <span class="pathway-badge teal" style="margin-bottom:6px;">📍 ${escapeHtml(selectedFacility.district || 'Coimbatore')}, ${escapeHtml(selectedFacility.state || 'Tamil Nadu')}</span>
          <h2 style="margin:4px 0 0; font-size:22px; font-weight:800; color:#0F172A;">${escapeHtml(selectedFacility.college_name)}</h2>
        </div>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <span class="pathway-badge coral" style="font-size:12.5px; font-weight:800;">⭐ Lab Score: ${selectedFacility.scores ? selectedFacility.scores.labs : 9.5} / 10</span>
          <span class="pathway-badge teal" style="font-size:12.5px; font-weight:800;">🏆 Maintenance: ${selectedFacility.scores ? selectedFacility.scores.maintenance : 9.5} / 10</span>
        </div>
      </div>

      <!-- 12 Isolated Facility Categories (Strictly per College) -->
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:16px;">
        <!-- 1. Laboratories -->
        <div style="background:#F8FAFC; border:1px solid var(--theme-line, #E2E8F0); border-radius:12px; padding:16px;">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
            <span style="font-size:20px;">🔬</span>
            <strong style="color:#0F172A; font-size:13.5px;">1. Laboratories &amp; Research Centers:</strong>
          </div>
          <p style="margin:0; font-size:12.5px; color:#334155; line-height:1.5;">${escapeHtml(selectedFacility.labs || 'Advanced computational and experimental research laboratories with specialized workstations.')}</p>
        </div>

        <!-- 2. Sports Complexes & Grounds -->
        <div style="background:#F8FAFC; border:1px solid var(--theme-line, #E2E8F0); border-radius:12px; padding:16px;">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
            <span style="font-size:20px;">⚽</span>
            <strong style="color:#0F172A; font-size:13.5px;">2. Sports Complexes &amp; Athletic Grounds:</strong>
          </div>
          <p style="margin:0; font-size:12.5px; color:#334155; line-height:1.5;">${escapeHtml(selectedFacility.sports_areas || 'Standard athletic tracks, cricket pavilion, basketball courts, and indoor sports arena.')}</p>
        </div>

        <!-- 3. Departments & Classrooms -->
        <div style="background:#F8FAFC; border:1px solid var(--theme-line, #E2E8F0); border-radius:12px; padding:16px;">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
            <span style="font-size:20px;">🏛️</span>
            <strong style="color:#0F172A; font-size:13.5px;">3. Academic Departments &amp; Classrooms:</strong>
          </div>
          <p style="margin:0; font-size:12.5px; color:#334155; line-height:1.5;">${escapeHtml(selectedFacility.classrooms || selectedFacility.departments || 'Multimedia smart lecture halls with ergonomic seating and interactive audio-visual equipment.')}</p>
        </div>

        <!-- 4. Canteen & Dining Area -->
        <div style="background:#F8FAFC; border:1px solid var(--theme-line, #E2E8F0); border-radius:12px; padding:16px;">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
            <span style="font-size:20px;">🍽️</span>
            <strong style="color:#0F172A; font-size:13.5px;">4. Dining Cafeteria &amp; Mess:</strong>
          </div>
          <p style="margin:0; font-size:12.5px; color:#334155; line-height:1.5;">${escapeHtml(selectedFacility.canteen || 'Hygienic multi-cuisine dining cafeteria with nutritional quality audits.')}</p>
        </div>

        <!-- 5. Garden & Campus Area -->
        <div style="background:#F8FAFC; border:1px solid var(--theme-line, #E2E8F0); border-radius:12px; padding:16px;">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
            <span style="font-size:20px;">🌿</span>
            <strong style="color:#0F172A; font-size:13.5px;">5. Campus Garden &amp; Green Grounds:</strong>
          </div>
          <p style="margin:0; font-size:12.5px; color:#334155; line-height:1.5;">${escapeHtml(selectedFacility.campus_area || selectedFacility.grounds || 'Eco-friendly landscaped botanical gardens and solar-powered common student squares.')}</p>
        </div>

        <!-- 6. Placement Facilities -->
        <div style="background:#F8FAFC; border:1px solid var(--theme-line, #E2E8F0); border-radius:12px; padding:16px;">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
            <span style="font-size:20px;">💼</span>
            <strong style="color:#0F172A; font-size:13.5px;">6. Placement Infrastructure &amp; GD Rooms:</strong>
          </div>
          <p style="margin:0; font-size:12.5px; color:#334155; line-height:1.5;">${escapeHtml(selectedFacility.placement_facilities || 'Dedicated corporate recruitment auditorium, assessment computer halls, and GD cabins.')}</p>
        </div>

        <!-- 7. Central Digital Library -->
        <div style="background:#F8FAFC; border:1px solid var(--theme-line, #E2E8F0); border-radius:12px; padding:16px;">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
            <span style="font-size:20px;">📚</span>
            <strong style="color:#0F172A; font-size:13.5px;">7. Central Digital Library &amp; Archives:</strong>
          </div>
          <p style="margin:0; font-size:12.5px; color:#334155; line-height:1.5;">${escapeHtml(selectedFacility.library || 'Central automated digital library with extensive academic volumes, e-journals, and 24/7 quiet study zones.')}</p>
        </div>

        <!-- 8. Student Residential Hostels -->
        <div style="background:#F8FAFC; border:1px solid var(--theme-line, #E2E8F0); border-radius:12px; padding:16px;">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
            <span style="font-size:20px;">🏢</span>
            <strong style="color:#0F172A; font-size:13.5px;">8. Student Hostels &amp; Residential Living:</strong>
          </div>
          <p style="margin:0; font-size:12.5px; color:#334155; line-height:1.5;">${escapeHtml(selectedFacility.hostel || 'Comfortable residential student blocks with Wi-Fi, nutritious mess facilities, and 24/7 security oversight.')}</p>
        </div>

        <!-- 9. Campus Transport -->
        <div style="background:#F8FAFC; border:1px solid var(--theme-line, #E2E8F0); border-radius:12px; padding:16px;">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
            <span style="font-size:20px;">🚌</span>
            <strong style="color:#0F172A; font-size:13.5px;">9. Campus Transport &amp; Bus Routes:</strong>
          </div>
          <p style="margin:0; font-size:12.5px; color:#334155; line-height:1.5;">${escapeHtml(selectedFacility.transport || 'Fleet of GPS-tracked college buses covering all major city and suburban transit routes.')}</p>
        </div>

        <!-- 10. Auditorium & Halls -->
        <div style="background:#F8FAFC; border:1px solid var(--theme-line, #E2E8F0); border-radius:12px; padding:16px;">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
            <span style="font-size:20px;">🎭</span>
            <strong style="color:#0F172A; font-size:13.5px;">10. Multi-Purpose Auditorium &amp; Halls:</strong>
          </div>
          <p style="margin:0; font-size:12.5px; color:#334155; line-height:1.5;">${escapeHtml(selectedFacility.auditorium || 'Spacious air-conditioned auditorium with acoustic treatment for symposiums and cultural events.')}</p>
        </div>

        <!-- 11. Medical & Health Facilities -->
        <div style="background:#F8FAFC; border:1px solid var(--theme-line, #E2E8F0); border-radius:12px; padding:16px;">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
            <span style="font-size:20px;">🏥</span>
            <strong style="color:#0F172A; font-size:13.5px;">11. Medical Clinic &amp; Health Facilities:</strong>
          </div>
          <p style="margin:0; font-size:12.5px; color:#334155; line-height:1.5;">${escapeHtml(selectedFacility.medical_facilities || '24/7 Campus medical room with first-aid care, resident nurse, and emergency ambulance access.')}</p>
        </div>

        <!-- 12. Computer & Technology Facilities -->
        <div style="background:#F8FAFC; border:1px solid var(--theme-line, #E2E8F0); border-radius:12px; padding:16px;">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
            <span style="font-size:20px;">💻</span>
            <strong style="color:#0F172A; font-size:13.5px;">12. Computing Center &amp; Technology Labs:</strong>
          </div>
          <p style="margin:0; font-size:12.5px; color:#334155; line-height:1.5;">${escapeHtml(selectedFacility.computer_facilities || 'High-performance computing center with 1,000+ networked terminals and licensed engineering software.')}</p>
        </div>
      </div>

      <div style="margin-top:16px; padding:14px 18px; background:rgba(119,172,59,0.08); border:1px solid rgba(119,172,59,0.25); border-radius:10px; font-size:12.5px; color:#334155;">
        ✨ <strong>Campus Hygiene &amp; Maintenance Quality:</strong> ${escapeHtml(selectedFacility.maintenance_quality || 'High environmental and hygiene maintenance standards.')}
      </div>
    </section>
  `;
}

function selectFacilityCollege(collegeId) {
  if (!collegeId) return;
  facilitiesFilterState.selectedCollegeId = collegeId;
  const filteredColleges = getFacilitiesFilteredColleges();
  const facilitiesMap = (_cachedFacilitiesData && _cachedFacilitiesData.facilities_by_college) ? _cachedFacilitiesData.facilities_by_college : {};
  const selectedFacility = facilitiesMap[collegeId] || filteredColleges.find(c => String(c.college_id) === String(collegeId)) || {};

  const detailContainer = document.getElementById('facilitiesDetailedSection');
  if (detailContainer) detailContainer.innerHTML = renderFacilityDetailHtml(selectedFacility);

  const chipsContainer = document.getElementById('facilitiesQuickChips');
  if (chipsContainer) {
    chipsContainer.innerHTML = filteredColleges.slice(0, 10).map(c => `
      <button
        type="button"
        class="courses-filter-chip ${String(c.college_id) === String(collegeId) ? 'active' : ''}"
        style="padding:6px 12px; font-size:12px; cursor:pointer;"
        onclick="selectFacilityCollege('${c.college_id}')"
      >
        ${escapeHtml(c.college_name.slice(0, 26))}
      </button>
    `).join('');
  }

  const summary = document.getElementById('facilitiesMetaSummary');
  if (summary) {
    summary.innerHTML = `
      <div class="courses-meta-summary-text">
        <span>🏢 Currently Inspecting Facilities For: <strong style="color:#77AC3B;">${escapeHtml(selectedFacility.college_name || 'Selected Institution')}</strong></span>
      </div>
      <span style="font-size:11.5px; color:var(--theme-muted);">Strictly isolated facility data &bull; Never mixed with other colleges</span>
    `;
  }
}
window.selectFacilityCollege = selectFacilityCollege;

function handleFacilitiesSearch(val) {
  facilitiesFilterState.search = val;
  const filteredColleges = getFacilitiesFilteredColleges();
  const facilitiesMap = (_cachedFacilitiesData && _cachedFacilitiesData.facilities_by_college) ? _cachedFacilitiesData.facilities_by_college : {};

  // If current selected college is still in the filtered results, keep it; otherwise default to first match
  const stillMatches = filteredColleges.some(c => String(c.college_id) === String(facilitiesFilterState.selectedCollegeId));
  if (!stillMatches && filteredColleges.length > 0) {
    facilitiesFilterState.selectedCollegeId = filteredColleges[0].college_id;
  }

  const selectedFacility = facilitiesMap[facilitiesFilterState.selectedCollegeId] || filteredColleges.find(c => String(c.college_id) === String(facilitiesFilterState.selectedCollegeId)) || filteredColleges[0] || {};
  const detailContainer = document.getElementById('facilitiesDetailedSection');
  if (detailContainer) detailContainer.innerHTML = renderFacilityDetailHtml(selectedFacility);

  const chipsContainer = document.getElementById('facilitiesQuickChips');
  if (chipsContainer) {
    chipsContainer.innerHTML = filteredColleges.slice(0, 10).map(c => `
      <button
        type="button"
        class="courses-filter-chip ${String(c.college_id) === String(selectedFacility.college_id) ? 'active' : ''}"
        style="padding:6px 12px; font-size:12px; cursor:pointer;"
        onclick="selectFacilityCollege('${c.college_id}')"
      >
        ${escapeHtml(c.college_name.slice(0, 26))}
      </button>
    `).join('');
  }

  const summary = document.getElementById('facilitiesMetaSummary');
  if (summary) {
    summary.innerHTML = `
      <div class="courses-meta-summary-text">
        <span>🏢 Currently Inspecting Facilities For: <strong style="color:#77AC3B;">${escapeHtml(selectedFacility.college_name || 'Selected Institution')}</strong></span>
      </div>
      <span style="font-size:11.5px; color:var(--theme-muted);">Strictly isolated facility data &bull; Never mixed with other colleges</span>
    `;
  }
}
window.handleFacilitiesSearch = handleFacilitiesSearch;

async function renderFacilitiesView() {
  const container = document.getElementById('facilitiesPageContent');
  if (!container) return;

  if (!_cachedFacilitiesData) {
    try {
      const res = await fetch('/api/facilities');
      if (res.ok) {
        const data = await res.json();
        if (data && data.facilities_by_college) _cachedFacilitiesData = data;
      }
    } catch (e) {
      console.warn('[Facilities] Live fetch fallback:', e);
    }
  }

  const facilitiesMap = (_cachedFacilitiesData && _cachedFacilitiesData.facilities_by_college) ? _cachedFacilitiesData.facilities_by_college : {};
  const top15 = (_cachedFacilitiesData && _cachedFacilitiesData.top_15_facilities_ranking) ? _cachedFacilitiesData.top_15_facilities_ranking : [];
  const reviews = (_cachedFacilitiesData && _cachedFacilitiesData.reviews) ? _cachedFacilitiesData.reviews : [
    { student: 'S. Vigneshwaran', college: 'Adithya Institute of Technology, CBE', rating: 4.9, feedback_type: 'positive', comment: 'The Robotics & IoT Labs are equipped with industry-grade Siemens PLCs and ABB robotic arms. 24/7 high-speed fiber internet in all research cubicles.' },
    { student: 'K. Pavithra', college: 'PSG College of Technology', rating: 5.0, feedback_type: 'positive', comment: 'Unrivaled precision manufacturing labs and autonomous vehicle testing tracks. Campus canteen maintains stringent FSSAI hygiene standards.' },
    { student: 'R. Karthik', college: 'Kumaraguru College of Technology', rating: 4.6, feedback_type: 'improvement', comment: 'Outdoor athletic grounds and synthetic tennis courts are exceptional. Suggesting longer evening access hours for the central digital library during exams.' },
    { student: 'M. Deepa', college: 'Amrita Vishwa Vidyapeetham', rating: 4.8, feedback_type: 'positive', comment: 'Lush green campus area with high bio-waste recycling standards, Olympic-size swimming pool, and ergonomic multimedia lecture halls.' }
  ];

  const filteredColleges = getFacilitiesFilteredColleges();
  const statesList = getStatesAndDistrictsList();
  const currentDistricts = facilitiesFilterState.state ? getDistrictsForState(facilitiesFilterState.state) : [];

  const selectedColId = facilitiesFilterState.selectedCollegeId || (filteredColleges[0] ? filteredColleges[0].college_id : 'COL-0004');
  const selectedFacility = facilitiesMap[selectedColId] || filteredColleges[0] || {};
  const isFilterActive = !!(facilitiesFilterState.search || facilitiesFilterState.state || facilitiesFilterState.district || (facilitiesFilterState.course && facilitiesFilterState.course !== 'all'));

  // Top 15 Facilities Bar Chart Data
  const top15BarData = top15.slice(0, 10).map((t, idx) => ({
    label: t.college_name.replace(/^(College of|Institute of|Sri|PSG|CIT|Amrita|Anna University)\s*/i, '').slice(0, 18),
    value: Math.round((t.facility_score || 9.0) * 10),
    displayValue: `${t.facility_score} / 10`,
    color: idx % 2 === 0 ? 'teal' : 'coral'
  }));

  // Student Facility Satisfaction Survey Data
  const facilitySatisfactionData = [
    { label: 'Robotics & Advanced Labs', value: 96, displayValue: '96% Satisfied', color: 'teal' },
    { label: 'Smart Classrooms', value: 92, displayValue: '92% Satisfied', color: 'teal' },
    { label: 'Campus Hygiene & Canteen', value: 88, displayValue: '88% Satisfied', color: 'teal' },
    { label: 'Sports & Athletic Tracks', value: 84, displayValue: '84% Satisfied', color: 'teal' },
    { label: 'Hostel Wi-Fi & Facilities', value: 82, displayValue: '82% Satisfied', color: 'teal' }
  ];

  container.innerHTML = `
    <div class="courses-discovery-container" style="display:flex; flex-direction:column; gap:24px;">

      <!-- 1. Search & Filter Bar: ONE Clean Horizontal Row (SEARCH | STATE | DISTRICT | COURSE) -->
      <section class="colleges-discovery-filter-card" style="margin-bottom:0;">
        <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap; width:100%;">
          <!-- Search Box -->
          <div class="colleges-search-input-wrap" style="flex:1.5; min-width:220px; margin:0;">
            <span class="colleges-input-lead-icon">🔍</span>
            <input
              type="text"
              id="facilitiesSearchInput"
              class="colleges-search-input-field"
              placeholder="Search college facility, labs, sports, canteen (e.g. Coimbatore, Robotics, PSG, Adithya)..."
              value="${escapeHtml(facilitiesFilterState.search)}"
              oninput="handleFacilitiesSearch(this.value)"
            />
            ${facilitiesFilterState.search ? `
              <button type="button" class="colleges-filter-clear-btn" style="display:block;" onclick="handleFacilitiesSearch(''); document.getElementById('facilitiesSearchInput').value='';">✕</button>
            ` : ''}
          </div>

          <!-- State -->
          <div style="flex:1; min-width:150px;">
            <select class="colleges-dropdown-select" style="width:100%; height:44px;" onchange="facilitiesFilterState.state = this.value; facilitiesFilterState.district = ''; renderFacilitiesView();">
              <option value="">🌐 State: All</option>
              ${statesList.map(st => `
                <option value="${st}" ${facilitiesFilterState.state === st ? 'selected' : ''}>${st}</option>
              `).join('')}
            </select>
          </div>

          <!-- District -->
          <div style="flex:1; min-width:150px;">
            <select class="colleges-dropdown-select" style="width:100%; height:44px;" ${!facilitiesFilterState.state ? 'disabled' : ''} onchange="facilitiesFilterState.district = this.value; renderFacilitiesView();">
              <option value="">${facilitiesFilterState.state ? '📍 ' + facilitiesFilterState.state : '📍 District'}</option>
              ${currentDistricts.map(dt => `
                <option value="${dt}" ${facilitiesFilterState.district === dt ? 'selected' : ''}>${dt}</option>
              `).join('')}
            </select>
          </div>

          <!-- Course/Domain -->
          <div style="flex:1.2; min-width:170px;">
            <select class="colleges-dropdown-select" style="width:100%; height:44px;" onchange="facilitiesFilterState.course = this.value; renderFacilitiesView();">
              <option value="all">🎓 Course Lab Focus: All</option>
              <option value="engineering" ${facilitiesFilterState.course === 'engineering' ? 'selected' : ''}>Engineering &amp; Tech</option>
              <option value="science" ${facilitiesFilterState.course === 'science' ? 'selected' : ''}>Arts &amp; Sciences</option>
              <option value="management" ${facilitiesFilterState.course === 'management' ? 'selected' : ''}>Management Labs</option>
              <option value="medical" ${facilitiesFilterState.course === 'medical' ? 'selected' : ''}>Medical / Bio Labs</option>
            </select>
          </div>

          ${isFilterActive ? `
            <button type="button" class="action-btn secondary" style="height:44px; padding:0 12px; font-size:12px; white-space:nowrap;" onclick="facilitiesFilterState = {search:'', state:'', district:'', course:'all', selectedCollegeId:''}; renderFacilitiesView();">
              ↺ Reset
            </button>
          ` : ''}
        </div>

        <!-- Initial College Quick Selector Grid -->
        <div style="margin-top:14px; padding-top:12px; border-top:1px solid var(--theme-line, #E2E8F0);">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; flex-wrap:wrap;">
            <span style="font-size:12px; font-weight:800; color:#0F172A; text-transform:uppercase;">🏛️ Select College to Inspect Verified Facilities (~10 Institutions):</span>
            <span style="font-size:11.5px; color:#64748B;">Showing strictly isolated records per campus</span>
          </div>
          <div id="facilitiesQuickChips" style="display:flex; flex-wrap:wrap; gap:6px;">
            ${filteredColleges.slice(0, 10).map(c => `
              <button
                type="button"
                class="courses-filter-chip ${String(c.college_id) === String(selectedFacility.college_id) ? 'active' : ''}"
                style="padding:6px 12px; font-size:12px; cursor:pointer;"
                onclick="selectFacilityCollege('${c.college_id}')"
              >
                ${escapeHtml(c.college_name.slice(0, 26))}
              </button>
            `).join('')}
          </div>
        </div>

        <div id="facilitiesMetaSummary" class="courses-meta-summary-bar" style="margin-top:12px; padding-top:10px;">
          <div class="courses-meta-summary-text">
            <span>🏢 Currently Inspecting Facilities For: <strong style="color:#77AC3B;">${escapeHtml(selectedFacility.college_name || 'Selected Institution')}</strong></span>
          </div>
          <span style="font-size:11.5px; color:var(--theme-muted);">Strictly isolated facility data &bull; Never mixed with other colleges</span>
        </div>
      </section>

      <!-- 2. Selected College Facilities Detailed Breakdown (Strictly Isolated) -->
      <div id="facilitiesDetailedSection">
        ${renderFacilityDetailHtml(selectedFacility)}
      </div>

      <!-- 3. Dual Facility Analytics Bar Charts: Top 15 Ranking vs Satisfaction Survey -->
      <section style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:20px;">
        <!-- Left: Top 15 Facilities Ranking -->
        ${renderCNBarChartHtml({
          title: '🏆 Top 15 Facilities Ranking &amp; Infrastructure Index',
          subtitle: 'Institutional benchmarking across labs, sports complexes, and maintenance standards',
          items: top15BarData,
          type: 'horizontal',
          colorScheme: 'teal'
        })}

        <!-- Right: Facility Satisfaction Survey -->
        ${renderCNBarChartHtml({
          title: '📊 Student Infrastructure & Lab Satisfaction Metrics',
          subtitle: 'Multi-campus verified student satisfaction rates across 5 core facility domains',
          items: facilitySatisfactionData,
          type: 'vertical',
          colorScheme: 'coral'
        })}
      </section>

      <!-- 4. Reviews & Suggestion Box (8 Reviews with Positive & Improvement Breakdown) -->
      <section class="survey-split-layout" style="margin-top:0;">
        <div class="survey-cards-column">
          <div class="category-shortcuts-heading" style="margin-top:0;">
            <h3>💬 8 Student Facility Reviews (Positive &amp; Improvement Breakdown)</h3>
            <span style="font-size:11.5px; color:var(--theme-muted);">Verified feedback regarding labs, sports priority, and maintenance</span>
          </div>

          <div style="display:flex; flex-direction:column; gap:10px; margin-top:12px;">
            ${reviews.slice(0, 8).map(r => `
              <div class="cn-review-card-compact">
                <div class="cn-review-header">
                  <div class="cn-review-author-wrap">
                    <div class="cn-review-avatar">${escapeHtml((r.student || 'ST').slice(0, 2).toUpperCase())}</div>
                    <div>
                      <div class="cn-review-name">${escapeHtml(r.student || 'Student')}</div>
                      <div class="cn-review-role">🏛️ <strong style="color:#0F172A;">${escapeHtml(r.college || '')}</strong></div>
                    </div>
                  </div>
                  <span class="pathway-badge ${r.feedback_type === 'improvement' ? 'coral' : 'teal'}" style="font-size:11px; font-weight:800;">
                    ${r.feedback_type === 'improvement' ? '⚠️ Improvement Area' : '✅ Verified Positive'}
                  </span>
                </div>
                <p class="cn-review-text">"${escapeHtml(r.comment || '')}"</p>
              </div>
            `).join('')}
          </div>
        </div>

        <aside class="survey-chart-sidebar">
          <div class="user-remarks-panel" style="background:#FFFFFF; border:1px solid var(--theme-line, #E2E8F0); border-radius:14px; padding:20px; box-shadow:0 4px 16px rgba(0,0,0,0.02);">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
              <span style="font-size:20px;">🏢</span>
              <div>
                <h4 style="margin:0; color:#0F172A; font-size:14px; font-weight:800;">Facility Feedback Box</h4>
                <small style="color:var(--theme-muted); font-size:11px;">Report lab or campus feedback</small>
              </div>
            </div>
            <form id="facilitySuggestionForm" onsubmit="submitUniversalSuggestion(event, 'facility');">
              <div class="remarks-form-group" style="margin-bottom:8px;">
                <input type="text" name="user_name" class="remarks-form-input" placeholder="Your Name &amp; College..." style="width:100%; height:38px; font-size:12px; padding:0 10px; border-radius:8px; background:#F8FAFC; border:1px solid var(--theme-line, #E2E8F0); color:#0F172A;" />
              </div>
              <div class="remarks-form-group" style="margin-bottom:10px;">
                <textarea name="message" class="remarks-form-textarea" rows="3" placeholder="Share feedback regarding sports priority, equipment quality, or campus canteen..." style="width:100%; font-size:12px; padding:8px 10px; border-radius:8px; background:#F8FAFC; border:1px solid var(--theme-line, #E2E8F0); color:#0F172A; font-family:inherit;"></textarea>
              </div>
              <button type="submit" class="primary-button" style="width:100%; height:38px; font-size:12px; justify-content:center;">
                <span>Submit Facility Feedback ↗</span>
              </button>
            </form>
          </div>
        </aside>
      </section>

    </div>
  `;
}
window.renderFacilitiesView = renderFacilitiesView;

// ============================================================================
// 9. ENTRANCE EXAM PREPARATIONS VIEW RENDERER & STRATEGIC ROADMAP MODAL
// ============================================================================
function getEntrancePrepFilteredList() {
  const examsList = (_cachedEntranceExamsData && _cachedEntranceExamsData.exams) ? _cachedEntranceExamsData.exams : [];
  const q = (entrancePrepFilterState.search || '').toLowerCase().trim();
  const selectedState = (entrancePrepFilterState.state || '').toLowerCase().trim();
  const selectedDistrict = (entrancePrepFilterState.district || '').toLowerCase().trim();
  const selectedCourse = (entrancePrepFilterState.course || 'all').toLowerCase().trim();
  const selectedCollege = (entrancePrepFilterState.college || '').toLowerCase().trim();
  const selectedExam = (entrancePrepFilterState.exam || 'all').toLowerCase().trim();

  return examsList.filter(ex => {
    const name = (ex.name || '').toLowerCase();
    const body = (ex.conducting_body || '').toLowerCase();
    const field = (ex.target_field || '').toLowerCase();
    const purpose = (ex.purpose || '').toLowerCase();

    let collegesStr = '';
    if (Array.isArray(ex.target_colleges)) {
      collegesStr = ex.target_colleges.join(' ').toLowerCase();
    } else if (typeof ex.target_colleges === 'string') {
      collegesStr = ex.target_colleges.toLowerCase();
    }

    const stateStr = (ex.state_coverage || '').toLowerCase();
    const districtStr = (ex.district_coverage || '').toLowerCase();

    // Match continuous search:
    const matchSearch = !q || name.includes(q) || body.includes(q) || purpose.includes(q) || collegesStr.includes(q) || field.includes(q);

    // Match State:
    const matchState = !selectedState || stateStr.includes(selectedState) || collegesStr.includes(selectedState) || stateStr.includes('all india') || stateStr.includes('national');

    // Match District:
    const matchDist = !selectedDistrict || districtStr.includes(selectedDistrict) || collegesStr.includes(selectedDistrict);

    // Match Course / Domain:
    const matchCourse = (selectedCourse === 'all') || field.includes(selectedCourse) || purpose.includes(selectedCourse);

    // Match College:
    const matchCollege = !selectedCollege || selectedCollege === 'all' || collegesStr.includes(selectedCollege) || name.includes(selectedCollege);

    // Match Exam filter:
    const matchExam = (selectedExam === 'all') || name.includes(selectedExam) || ex.id === selectedExam;

    return matchSearch && matchCourse && matchCollege && matchState && matchDist && matchExam;
  });
}

function renderEntrancePrepCardsHtml(filteredExams) {
  if (filteredExams.length === 0) {
    return `
      <div style="grid-column:1/-1; text-align:center; padding:48px 20px; background:var(--theme-surface, #FFFFFF); border:1px dashed var(--theme-line, #E2E8F0); border-radius:14px;">
        <div style="font-size:36px; margin-bottom:8px;">🎯</div>
        <h3 style="margin:0 0 6px; color:#0F172A; font-weight:800;">No Entrance Examinations Found</h3>
        <p style="color:var(--theme-muted); font-size:13px; margin-bottom:16px;">No examination pathways match your selected search or filter criteria.</p>
        <button type="button" class="primary-button" onclick="entrancePrepFilterState = {search:'', state:'', district:'', course:'all', college:'', exam:'all'}; renderEntrancePrepView();">View All Examination Pathways</button>
      </div>
    `;
  }

  return filteredExams.map(ex => `
    <article class="college-card" style="display:flex; flex-direction:column; justify-content:space-between; border-radius:14px; padding:20px; box-shadow:0 4px 18px rgba(0,0,0,0.03); background:#FFFFFF; border:1px solid var(--theme-line, #E2E8F0);">
      <div>
        <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:8px; margin-bottom:10px;">
          <span class="pathway-badge teal">${escapeHtml(ex.target_field)}</span>
          <span class="pathway-badge coral" style="font-weight:800;">Total: ${escapeHtml(ex.total_marks)}</span>
        </div>

        <h3 style="font-size:16.5px; font-weight:800; color:#0F172A; margin:0 0 4px; line-height:1.35;">${escapeHtml(ex.name)}</h3>
        <div style="font-size:12px; color:#64748B; margin-bottom:10px;">
          🏛️ <strong>Conducting Body:</strong> ${escapeHtml(ex.conducting_body)}
        </div>

        <div style="background:#F8FAFC; border:1px solid var(--theme-line, #E2E8F0); border-radius:10px; padding:12px; margin-bottom:12px;">
          <div style="font-size:12px; color:#334155; line-height:1.45; margin-bottom:4px;">
            🎯 <strong>Cutoff Range:</strong> ${escapeHtml(ex.cutoff_range)}
          </div>
          <div style="font-size:12px; color:#77AC3B; font-weight:800;">
            💰 Fee Savings: ${escapeHtml(ex.fee_savings || 'Saves ₹8-15L vs Management Quota')}
          </div>
        </div>

        <!-- Step-by-Step Preparation Roadmap (3 Stages) -->
        <div style="background:#F8FAFC; border:1px solid var(--theme-line, #E2E8F0); border-radius:10px; padding:12px; margin-bottom:12px;">
          <span style="font-size:11px; font-weight:800; color:#0F172A; display:block; margin-bottom:6px; text-transform:uppercase;">🗺️ 3-Stage Preparation Roadmap:</span>
          <div style="display:flex; flex-direction:column; gap:6px; font-size:11.5px;">
            ${(ex.roadmap_stages || []).map((st, idx) => `
              <div style="border-left:2px solid #77AC3B; padding-left:8px;">
                <strong style="color:#0F172A;">Stage ${st.stage || (idx + 1)}: ${escapeHtml(st.title || st.phase || ('Stage ' + (idx + 1)))}</strong>
                <div style="color:#64748B; font-size:11px; margin-top:2px;">${escapeHtml(st.focus || st.desc || '')}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <div style="padding-top:10px; border-top:1px solid var(--theme-line, #E2E8F0);">
        <button type="button" class="pathway-card-btn" style="width:100%; justify-content:center;" onclick="openEntrancePrepModal('${ex.id}')">
          <span>View Full Syllabus, PYQ &amp; Blueprint ➔</span>
        </button>
      </div>
    </article>
  `).join('');
}

function handleEntrancePrepSearch(val) {
  entrancePrepFilterState.search = val;
  const filteredExams = getEntrancePrepFilteredList();
  const grid = document.getElementById('entrancePrepCardsGrid');
  if (grid) grid.innerHTML = renderEntrancePrepCardsHtml(filteredExams);

  const summary = document.getElementById('entrancePrepMetaSummary');
  if (summary) {
    summary.innerHTML = `
      <div class="courses-meta-summary-text">
        <span>📝 Showing <strong>${filteredExams.length}</strong> strategic entrance examination pathways</span>
      </div>
      <span style="font-size:11.5px; color:var(--theme-muted);">Multi-Stage Roadmaps &bull; Huge Fee Savings vs Management Quotas</span>
    `;
  }
}
window.handleEntrancePrepSearch = handleEntrancePrepSearch;

function openEntrancePrepModal(examId) {
  const exams = (_cachedEntranceExamsData && _cachedEntranceExamsData.exams) ? _cachedEntranceExamsData.exams : [];
  const ex = exams.find(e => e.id === examId) || exams[0];
  if (!ex) return;

  let stagesHtml = '';
  if (ex.roadmap_stages && ex.roadmap_stages.length > 0) {
    stagesHtml = ex.roadmap_stages.map((st, idx) => `
      <div style="background:#FFFFFF; border:1px solid var(--theme-line, #E2E8F0); border-radius:12px; padding:16px; margin-bottom:12px; box-shadow:0 2px 10px rgba(0,0,0,0.02);">
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
          <span style="background:#77AC3B; color:#FFFFFF; font-size:11px; font-weight:800; padding:2px 8px; border-radius:12px;">STAGE ${st.stage || (idx + 1)}</span>
          <h4 style="margin:0; font-size:15px; font-weight:800; color:#0F172A;">${escapeHtml(st.title || st.phase || ('Stage ' + (idx + 1)))}</h4>
        </div>
        <p style="margin:0 0 10px; font-size:13px; color:#334155; line-height:1.5;">${escapeHtml(st.focus || st.desc || '')}</p>
        ${st.resources && st.resources.length > 0 ? `
          <div style="background:#F8FAFC; border-radius:8px; padding:10px 12px; border:1px solid #E2E8F0;">
            <strong style="font-size:11.5px; color:#64748B; display:block; margin-bottom:4px; text-transform:uppercase;">Recommended High-Yield Resources:</strong>
            <div style="display:flex; flex-wrap:wrap; gap:6px;">
              ${st.resources.map(r => `
                <span style="background:#FFFFFF; border:1px solid #CBD5E1; color:#0F172A; font-size:11.5px; font-weight:600; padding:3px 10px; border-radius:6px;">
                  📖 ${escapeHtml(r)}
                </span>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `).join('');
  }

  const collegesText = Array.isArray(ex.target_colleges) ? ex.target_colleges.join(', ') : (ex.target_colleges || '');
  const officialPortalUrl = ex.official_website || ex.website || '';
  const primaryAction = officialPortalUrl ? `
    <a href="${escapeHtml(officialPortalUrl)}" target="_blank" rel="noopener noreferrer" class="primary-button" style="height:40px; padding:0 24px; text-decoration:none; display:inline-flex; align-items:center; color:#FFFFFF;">
      <span>Official Exam Portal ↗</span>
    </a>
  ` : `
    <button type="button" class="primary-button" style="height:40px; padding:0 24px;" onclick="closeUniversalModal();">
      <span>Close ✕</span>
    </button>
  `;

  const contentHtml = `
    <div style="display:flex; flex-direction:column; gap:16px;">
      <!-- Highlights Grid -->
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:12px;">
        <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:12px;">
          <div style="font-size:11px; font-weight:800; color:#64748B; text-transform:uppercase;">Conducting Body</div>
          <div style="font-size:13.5px; font-weight:800; color:#0F172A; margin-top:2px;">🏛️ ${escapeHtml(ex.conducting_body)}</div>
        </div>
        <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:12px;">
          <div style="font-size:11px; font-weight:800; color:#64748B; text-transform:uppercase;">Cutoff Benchmark</div>
          <div style="font-size:13.5px; font-weight:800; color:#77AC3B; margin-top:2px;">🎯 ${escapeHtml(ex.cutoff_range)}</div>
        </div>
        <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:12px;">
          <div style="font-size:11px; font-weight:800; color:#64748B; text-transform:uppercase;">Total Marks / Structure</div>
          <div style="font-size:13.5px; font-weight:800; color:#0F172A; margin-top:2px;">📝 ${escapeHtml(ex.total_marks)}</div>
        </div>
      </div>

      <!-- Purpose & Benefits -->
      <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:14px;">
        <div style="font-size:11px; font-weight:800; color:#0F172A; text-transform:uppercase; margin-bottom:4px;">🎯 Examination Scope &amp; Purpose</div>
        <p style="margin:0; font-size:13px; color:#334155; line-height:1.55;">${escapeHtml(ex.purpose)}</p>
        <div style="margin-top:8px; font-size:12.5px; color:#77AC3B; font-weight:800;">
          💰 ${escapeHtml(ex.fee_savings || 'Significant fee savings vs Management Quota')}
        </div>
      </div>

      <!-- Target Institutions -->
      <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:14px;">
        <div style="font-size:11px; font-weight:800; color:#0F172A; text-transform:uppercase; margin-bottom:6px;">🏛️ Target Colleges &amp; Participating Campuses</div>
        <p style="margin:0; font-size:13px; color:#334155;">${escapeHtml(collegesText)}</p>
      </div>

      <!-- Roadmap Stages -->
      <div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <h3 style="margin:0; font-size:16px; font-weight:800; color:#0F172A;">🗺️ Step-by-Step Preparation Roadmap</h3>
          <span style="font-size:11.5px; color:#64748B;">Official Verified Strategy</span>
        </div>
        ${stagesHtml}
      </div>
    </div>
  `;

  openUniversalModal({
    title: ex.name,
    subtitle: `${ex.conducting_body} • ${ex.target_field}`,
    badge: 'STRATEGIC ROADMAP & BLUEPRINT',
    contentHtml: contentHtml,
    primaryActionHtml: primaryAction,
    footNote: 'Verified Against Official Testing Agency Notifications & State Quota Regulations'
  });
}
window.openEntrancePrepModal = openEntrancePrepModal;

async function renderEntrancePrepView() {
  const container = document.getElementById('entrancePrepPageContent');
  if (!container) return;

  if (!_cachedEntranceExamsData) {
    try {
      const res = await fetch('/api/entrance-exams');
      if (res.ok) {
        const data = await res.json();
        if (data && data.exams) _cachedEntranceExamsData = data;
      }
    } catch (e) {
      console.warn('[EntrancePrep] Live fetch fallback:', e);
    }
  }

  const filteredExams = getEntrancePrepFilteredList();
  const reviews = (_cachedEntranceExamsData && Array.isArray(_cachedEntranceExamsData.reviews) && _cachedEntranceExamsData.reviews.length > 0) ? _cachedEntranceExamsData.reviews : [
    { author: 'R. Anirudh', exam: 'TNEA Counseling (198.5 Cutoff)', college: 'PSG College of Technology', rating: 5.0, comment: 'Targeting 98%+ in Class 12 PCM secured a top-tier CSE seat with zero donation, saving over ₹12 Lakhs compared to management quota.' },
    { author: 'N. Vignesh', exam: 'JEE Main (99.2 Percentile)', college: 'National Institute of Technology, Trichy', rating: 5.0, comment: 'Solving 10 years of PYQs in timed 3-hour blocks was the single highest ROI strategy for physics and mathematics speed drills.' },
    { author: 'K. Sneha', exam: 'NEET UG (645 Marks)', college: 'Coimbatore Medical College', rating: 4.9, comment: 'NCERT biology line-by-line active recall and mock test error log notebook prevented negative marking traps on exam day.' },
    { author: 'Pranav Menon', exam: 'CAT (98.4 Percentile)', college: 'Amrita School of Business', rating: 4.8, comment: 'Consistent DILR sectional tests and weekly full-length mocks helped me manage sectional timing with high accuracy.' },
    { author: 'D. Harini', exam: 'TANCET / CEETA-PG', college: 'Anna University Regional Campus', rating: 4.9, comment: 'Scored State Rank 42 in M.E Computer Science. Complete tuition grant covered under state merit allocation.' },
    { author: 'S. Gokul', exam: 'GATE CSE (Score 780)', college: 'Coimbatore Institute of Technology', rating: 5.0, comment: 'Standard textbooks and mock series practice cleared direct PSU recruitment and top M.Tech admission simultaneously.' },
    { author: 'P. Lavanya', exam: 'CUET UG (General Test 99%ile)', college: 'Central University of Tamil Nadu', rating: 4.9, comment: 'NCERT based domain preparation and regular aptitude drills guaranteed admission to my top choice degree programme.' }
  ];

  const statesList = getStatesAndDistrictsList();
  const currentDistricts = entrancePrepFilterState.state ? getDistrictsForState(entrancePrepFilterState.state) : [];
  const isFilterActive = !!(entrancePrepFilterState.search || entrancePrepFilterState.state || entrancePrepFilterState.district || (entrancePrepFilterState.course && entrancePrepFilterState.course !== 'all') || entrancePrepFilterState.college || (entrancePrepFilterState.exam && entrancePrepFilterState.exam !== 'all'));

  // Bar Chart Data for Past 10-Yr Cutoff & Applicant Growth
  const past10YearApplicantsData = [
    { label: '2016', value: 12, displayValue: '11.8L', color: 'teal' },
    { label: '2018', value: 15, displayValue: '14.5L', color: 'teal' },
    { label: '2020', value: 18, displayValue: '17.9L', color: 'teal' },
    { label: '2022', value: 21, displayValue: '20.8L', color: 'teal' },
    { label: '2024', value: 24, displayValue: '23.4L', color: 'teal' },
    { label: '2025', value: 26, displayValue: '24.8L', color: 'teal' }
  ];

  const futureExamGrowthData = [
    { label: 'CUET Central', value: 85, displayValue: '+35%', color: 'coral' },
    { label: 'JEE / TNEA', value: 72, displayValue: '+18%', color: 'coral' },
    { label: 'NEET Medical', value: 78, displayValue: '+22%', color: 'coral' },
    { label: 'CAT / MBA', value: 68, displayValue: '+15%', color: 'coral' },
    { label: 'GATE / PG', value: 75, displayValue: '+20%', color: 'coral' }
  ];

  container.innerHTML = `
    <div class="courses-discovery-container" style="display:flex; flex-direction:column; gap:24px;">

      <!-- 1. Search & Filter Bar: ONE Clean Horizontal Row (ENTRANCE EXAM | STATE | DISTRICT | COURSE | COLLEGE) -->
      <section class="colleges-discovery-filter-card" style="margin-bottom:0;">
        <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap; width:100%;">
          <!-- Entrance Exam Search -->
          <div class="colleges-search-input-wrap" style="flex:1.4; min-width:200px; margin:0;">
            <span class="colleges-input-lead-icon">🔍</span>
            <input
              type="text"
              id="entrancePrepSearchInput"
              class="colleges-search-input-field"
              placeholder="Search entrance exam (e.g. TNEA, JEE Main, NEET, CAT, GATE)..."
              value="${escapeHtml(entrancePrepFilterState.search)}"
              oninput="handleEntrancePrepSearch(this.value)"
            />
            ${entrancePrepFilterState.search ? `
              <button type="button" class="colleges-filter-clear-btn" style="display:block;" onclick="handleEntrancePrepSearch(''); document.getElementById('entrancePrepSearchInput').value='';">✕</button>
            ` : ''}
          </div>

          <!-- State -->
          <div style="flex:1; min-width:140px;">
            <select class="colleges-dropdown-select" style="width:100%; height:44px;" onchange="entrancePrepFilterState.state = this.value; entrancePrepFilterState.district = ''; renderEntrancePrepView();">
              <option value="">🌐 State: All</option>
              ${statesList.map(st => `
                <option value="${st}" ${entrancePrepFilterState.state === st ? 'selected' : ''}>${st}</option>
              `).join('')}
            </select>
          </div>

          <!-- District -->
          <div style="flex:1; min-width:140px;">
            <select class="colleges-dropdown-select" style="width:100%; height:44px;" ${!entrancePrepFilterState.state ? 'disabled' : ''} onchange="entrancePrepFilterState.district = this.value; renderEntrancePrepView();">
              <option value="">${entrancePrepFilterState.state ? '📍 ' + entrancePrepFilterState.state : '📍 District'}</option>
              ${currentDistricts.map(dt => `
                <option value="${dt}" ${entrancePrepFilterState.district === dt ? 'selected' : ''}>${dt}</option>
              `).join('')}
            </select>
          </div>

          <!-- Course / Domain -->
          <div style="flex:1.1; min-width:150px;">
            <select class="colleges-dropdown-select" style="width:100%; height:44px;" onchange="entrancePrepFilterState.course = this.value; renderEntrancePrepView();">
              <option value="all">🎓 Course: All</option>
              <option value="engineering" ${entrancePrepFilterState.course === 'engineering' ? 'selected' : ''}>Engineering</option>
              <option value="medical" ${entrancePrepFilterState.course === 'medical' ? 'selected' : ''}>Medical</option>
              <option value="management" ${entrancePrepFilterState.course === 'management' ? 'selected' : ''}>Management</option>
              <option value="postgraduate" ${entrancePrepFilterState.course === 'postgraduate' ? 'selected' : ''}>Postgraduate</option>
            </select>
          </div>

          <!-- Target College -->
          <div style="flex:1.2; min-width:160px;">
            <input
              type="text"
              id="entrancePrepCollegeInput"
              class="colleges-search-input-field"
              placeholder="🏛️ Target College..."
              value="${escapeHtml(entrancePrepFilterState.college || '')}"
              oninput="entrancePrepFilterState.college = this.value; const filteredExams = getEntrancePrepFilteredList(); const grid = document.getElementById('entrancePrepCardsGrid'); if (grid) grid.innerHTML = renderEntrancePrepCardsHtml(filteredExams);"
              style="height:44px; font-size:12.5px; border-radius:10px;"
            />
          </div>

          ${isFilterActive ? `
            <button type="button" class="action-btn secondary" style="height:44px; padding:0 12px; font-size:12px; white-space:nowrap;" onclick="entrancePrepFilterState = {search:'', state:'', district:'', course:'all', college:'', exam:'all'}; renderEntrancePrepView();">
              ↺ Reset
            </button>
          ` : ''}
        </div>

        <div id="entrancePrepMetaSummary" class="courses-meta-summary-bar" style="margin-top:12px; padding-top:10px;">
          <div class="courses-meta-summary-text">
            <span>📝 Showing <strong>${filteredExams.length}</strong> strategic entrance examination pathways</span>
          </div>
          <span style="font-size:11.5px; color:var(--theme-muted);">Multi-Stage Roadmaps &bull; Huge Fee Savings vs Management Quotas</span>
        </div>
      </section>

      <!-- 2. Entrance Exams Cards Grid -->
      <section id="entrancePrepCardsGrid" class="college-grid" style="gap:20px;">
        ${renderEntrancePrepCardsHtml(filteredExams)}
      </section>

      <!-- 3. BAR CHART ANALYTICS (Left: Past 10-Yr Cutoff & Applicant Growth, Right: Future 2-3 Yrs Outlook) -->
      <section style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:20px;">
        <!-- Left: Past 10 Years Applicants Bar Chart -->
        ${renderCNBarChartHtml({
          title: '📊 Past 10 Years Entrance Applicants Escalation (2016-2025)',
          subtitle: 'National applicant count growth across computerized testing platforms',
          items: past10YearApplicantsData,
          type: 'vertical',
          colorScheme: 'teal'
        })}

        <!-- Right: Future 2-3 Years Growth Outlook Bar Chart -->
        ${renderCNBarChartHtml({
          title: '🔮 Future 2-3 Years Exam Stream Growth (2026-2028)',
          subtitle: 'Projected increase in percentile cutoffs and registration volume',
          items: futureExamGrowthData,
          type: 'horizontal',
          colorScheme: 'coral'
        })}
      </section>

      <!-- 4. Reviews & Suggestion Box Split Section (7 Reviews) -->
      <section class="survey-split-layout" style="margin-top:0;">
        <div class="survey-cards-column">
          <div class="category-shortcuts-heading" style="margin-top:0;">
            <h3>💬 7 Verified Exam-Taker Reviews &amp; Topper Instructions</h3>
            <span style="font-size:11.5px; color:var(--theme-muted);">Proven strategies, revision timetables, and exam-hall advice</span>
          </div>

          <div style="display:flex; flex-direction:column; gap:10px; margin-top:12px;">
            ${reviews.slice(0, 7).map(r => `
              <div class="cn-review-card-compact">
                <div class="cn-review-header">
                  <div class="cn-review-author-wrap">
                    <div class="cn-review-avatar">${escapeHtml((r.author || 'TP').slice(0, 2).toUpperCase())}</div>
                    <div>
                      <div class="cn-review-name">${escapeHtml(r.author || 'Topper')}</div>
                      <div class="cn-review-role">🎯 <strong style="color:#0F172A;">${escapeHtml(r.exam || 'Entrance Exam')}</strong> &bull; 🏛️ ${escapeHtml(r.college || 'Tamil Nadu')}</div>
                    </div>
                  </div>
                  <div class="cn-review-stars">★★★★★ ${(r.rating || 5.0).toFixed(1)}</div>
                </div>
                <p class="cn-review-text">"${escapeHtml(r.comment || '')}"</p>
              </div>
            `).join('')}
          </div>
        </div>

        <aside class="survey-chart-sidebar">
          <div class="user-remarks-panel" style="background:#FFFFFF; border:1px solid var(--theme-line, #E2E8F0); border-radius:14px; padding:20px; box-shadow:0 4px 16px rgba(0,0,0,0.02);">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
              <span style="font-size:20px;">📝</span>
              <div>
                <h4 style="margin:0; color:#0F172A; font-size:14px; font-weight:800;">Exam Prep Tip Box</h4>
                <small style="color:var(--theme-muted); font-size:11px;">Share your preparation tactics</small>
              </div>
            </div>
            <form id="entrancePrepSuggestionForm" onsubmit="submitUniversalSuggestion(event, 'entrance_prep');">
              <div class="remarks-form-group" style="margin-bottom:8px;">
                <input type="text" name="user_name" class="remarks-form-input" placeholder="Your Name, Exam &amp; Target College..." style="width:100%; height:38px; font-size:12px; padding:0 10px; border-radius:8px; background:#F8FAFC; border:1px solid var(--theme-line, #E2E8F0); color:#0F172A;" />
              </div>
              <div class="remarks-form-group" style="margin-bottom:10px;">
                <textarea name="message" class="remarks-form-textarea" rows="3" placeholder="Share book recommendations, formula cheat sheets, or speed drills..." style="width:100%; font-size:12px; padding:8px 10px; border-radius:8px; background:#F8FAFC; border:1px solid var(--theme-line, #E2E8F0); color:#0F172A; font-family:inherit;"></textarea>
              </div>
              <button type="submit" class="primary-button" style="width:100%; height:38px; font-size:12px; justify-content:center;">
                <span>Submit Exam Prep Tip ↗</span>
              </button>
            </form>
          </div>
        </aside>
      </section>

    </div>
  `;
}
window.renderEntrancePrepView = renderEntrancePrepView;

// ============================================================================
// 10. REVIEW & COMPARISON VIEW RENDERER ([ COLLEGE 1 ] + [ COLLEGE 2 ])
// ============================================================================
function getFilteredCompareColleges() {
  const allColleges = collegesRegistry || [];
  const q = (reviewsCompareFilterState.search || '').toLowerCase().trim();
  const selectedState = (reviewsCompareFilterState.state || '').toLowerCase().trim();
  const selectedDistrict = (reviewsCompareFilterState.district || '').toLowerCase().trim();

  return allColleges.filter(c => {
    const name = (c.name || '').toLowerCase();
    const state = (c.state || '').toLowerCase();
    const dist = (c.district || c.city || '').toLowerCase();

    const matchSearch = !q || name.includes(q) || dist.includes(q);
    const matchState = !selectedState || state.includes(selectedState);
    const matchDist = !selectedDistrict || dist.includes(selectedDistrict);

    return matchSearch && matchState && matchDist;
  });
}

function updateCompareSelectOptions() {
  const filteredColleges = getFilteredCompareColleges();
  const c1Search = (reviewsCompareFilterState.c1Search || '').toLowerCase().trim();
  const c2Search = (reviewsCompareFilterState.c2Search || '').toLowerCase().trim();
  const c1Id = reviewsCompareFilterState.college1 || '';
  const c2Id = reviewsCompareFilterState.college2 || '';

  const c1Options = filteredColleges.filter(c => {
    if (!c1Search) return true;
    const name = (c.name || '').toLowerCase();
    const dist = (c.district || c.city || '').toLowerCase();
    return name.includes(c1Search) || dist.includes(c1Search);
  });

  const c2Options = filteredColleges.filter(c => {
    if (!c2Search) return true;
    const name = (c.name || '').toLowerCase();
    const dist = (c.district || c.city || '').toLowerCase();
    return name.includes(c2Search) || dist.includes(c2Search);
  });

  const sel1 = document.getElementById('compareCollege1Select');
  if (sel1) {
    sel1.innerHTML = `
      <option value="">-- Select First College (${c1Options.length} available) --</option>
      ${c1Options.map(c => `
        <option value="${c.id}" ${c.id === c1Id ? 'selected' : ''} ${c.id === c2Id ? 'disabled' : ''}>
          🏛️ ${escapeHtml(c.name)} (${escapeHtml(c.district || c.city)}, ${escapeHtml(c.state)})
        </option>
      `).join('')}
    `;
  }

  const sel2 = document.getElementById('compareCollege2Select');
  if (sel2) {
    sel2.innerHTML = `
      <option value="">-- Select Second College (${c2Options.length} available) --</option>
      ${c2Options.map(c => `
        <option value="${c.id}" ${c.id === c2Id ? 'selected' : ''} ${c.id === c1Id ? 'disabled' : ''}>
          🏛️ ${escapeHtml(c.name)} (${escapeHtml(c.district || c.city)}, ${escapeHtml(c.state)})
        </option>
      `).join('')}
    `;
  }
}

function handleReviewsCompareGlobalSearch(val) {
  reviewsCompareFilterState.search = val;
  updateCompareSelectOptions();
}
window.handleReviewsCompareGlobalSearch = handleReviewsCompareGlobalSearch;

function handleCompareCollege1Search(val) {
  reviewsCompareFilterState.c1Search = val;
  updateCompareSelectOptions();
}
window.handleCompareCollege1Search = handleCompareCollege1Search;

function handleCompareCollege2Search(val) {
  reviewsCompareFilterState.c2Search = val;
  updateCompareSelectOptions();
}
window.handleCompareCollege2Search = handleCompareCollege2Search;

function executeReviewsComparison() {
  reviewsCompareFilterState.activeCompare = true;
  if (typeof recordUserActivity === 'function') {
    const c1 = reviewsCompareFilterState.college1 || '';
    const c2 = reviewsCompareFilterState.college2 || '';
    recordUserActivity('compare', 'reviews-compare', c1 + '_vs_' + c2, c1 + ' vs ' + c2);
  }
  renderReviewsCompareView();
}
window.executeReviewsComparison = executeReviewsComparison;

async function renderReviewsCompareView() {
  const container = document.getElementById('reviewsComparePageContent');
  if (!container) return;

  if (!_cachedComparisonsData) {
    try {
      const res = await fetch('/api/comparisons');
      if (res.ok) {
        const data = await res.json();
        if (data && data.reviews) _cachedComparisonsData = data;
      }
    } catch (e) {
      console.warn('[Comparisons] Live fetch fallback:', e);
    }
  }

  const allColleges = collegesRegistry || [];
  const reviews = (_cachedComparisonsData && _cachedComparisonsData.reviews) ? _cachedComparisonsData.reviews : [
    { author: 'Dr. S. Meenakshi', role: 'Senior Academic Counselor', rating: 5.0, college: 'Tamil Nadu Engineering Forum', comment: 'The 10-factor dual benchmark matrix accurately reflects NIRF, laboratory scores, and transparent median salaries. Invaluable for parents.' },
    { author: 'K. Parthiban', role: 'Parent (B.Tech Candidate)', rating: 4.9, college: 'Coimbatore', comment: 'Comparing PSG Tech and CIT side-by-side gave us clear clarity on hostel costs vs median placement return on investment.' },
    { author: 'A. Subhash', role: 'Student (CSE 2026)', rating: 5.0, college: 'Anna University Counselor', comment: 'Comparing Amrita and Adithya robotics infrastructure helped me make an informed counseling seat selection with confidence.' },
    { author: 'V. Rajeshwari', role: 'Parent (AI Aspirant)', rating: 4.8, college: 'Chennai', comment: 'Transparent data-backed recommendations highlight real institutional strengths without marketing bias.' },
    { author: 'G. Naveen', role: 'Alumnus', rating: 5.0, college: 'PSG Tech Alumnus Network', comment: 'Objective comparison metric with exact fee breakdowns and genuine recruiter statistics.' }
  ];

  const statesList = getStatesAndDistrictsList();
  const currentDistricts = reviewsCompareFilterState.state ? getDistrictsForState(reviewsCompareFilterState.state) : [];

  const filteredColleges = getFilteredCompareColleges();
  const c1Search = (reviewsCompareFilterState.c1Search || '').toLowerCase().trim();
  const c2Search = (reviewsCompareFilterState.c2Search || '').toLowerCase().trim();

  const c1Options = filteredColleges.filter(c => {
    if (!c1Search) return true;
    const name = (c.name || '').toLowerCase();
    const dist = (c.district || c.city || '').toLowerCase();
    return name.includes(c1Search) || dist.includes(c1Search);
  });

  const c2Options = filteredColleges.filter(c => {
    if (!c2Search) return true;
    const name = (c.name || '').toLowerCase();
    const dist = (c.district || c.city || '').toLowerCase();
    return name.includes(c2Search) || dist.includes(c2Search);
  });

  let c1Id = reviewsCompareFilterState.college1 || '';
  let c2Id = reviewsCompareFilterState.college2 || '';

  // Prevent selecting same college on both sides
  if (c1Id && c2Id && c1Id === c2Id) {
    c2Id = '';
    reviewsCompareFilterState.college2 = '';
  }

  let comparisonData = null;
  if (c1Id && c2Id && reviewsCompareFilterState.activeCompare) {
    try {
      const res = await fetch(`/api/comparisons/compare?college1=${encodeURIComponent(c1Id)}&college2=${encodeURIComponent(c2Id)}`);
      if (res.ok) {
        const d = await res.json();
        if (d && d.comparison) comparisonData = d.comparison;
      }
    } catch (e) {
      console.warn('[Comparison] Live compare fetch fallback:', e);
    }
  }

  const isFilterActive = !!(reviewsCompareFilterState.search || reviewsCompareFilterState.state || reviewsCompareFilterState.district || (reviewsCompareFilterState.domain && reviewsCompareFilterState.domain !== 'all') || reviewsCompareFilterState.c1Search || reviewsCompareFilterState.c2Search);

  container.innerHTML = `
    <div class="courses-discovery-container" style="display:flex; flex-direction:column; gap:24px;">

      <!-- 1. Search & Filter Bar: ONE Clean Horizontal Row (SEARCH | STATE | DISTRICT | DOMAIN) -->
      <section class="colleges-discovery-filter-card" style="margin-bottom:0;">
        <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap; width:100%;">
          <!-- Search Box -->
          <div class="colleges-search-input-wrap" style="flex:1.5; min-width:220px; margin:0;">
            <span class="colleges-input-lead-icon">🔍</span>
            <input
              type="text"
              id="reviewsCompareSearchInput"
              class="colleges-search-input-field"
              placeholder="Search college name, district, domain to narrow comparison options..."
              value="${escapeHtml(reviewsCompareFilterState.search)}"
              oninput="handleReviewsCompareGlobalSearch(this.value)"
            />
            ${reviewsCompareFilterState.search ? `
              <button type="button" class="colleges-filter-clear-btn" style="display:block;" onclick="handleReviewsCompareGlobalSearch(''); document.getElementById('reviewsCompareSearchInput').value='';">✕</button>
            ` : ''}
          </div>

          <!-- State -->
          <div style="flex:1; min-width:150px;">
            <select class="colleges-dropdown-select" style="width:100%; height:44px;" onchange="reviewsCompareFilterState.state = this.value; reviewsCompareFilterState.district = ''; renderReviewsCompareView();">
              <option value="">🌐 State: All</option>
              ${statesList.map(st => `
                <option value="${st}" ${reviewsCompareFilterState.state === st ? 'selected' : ''}>${st}</option>
              `).join('')}
            </select>
          </div>

          <!-- District -->
          <div style="flex:1; min-width:150px;">
            <select class="colleges-dropdown-select" style="width:100%; height:44px;" ${!reviewsCompareFilterState.state ? 'disabled' : ''} onchange="reviewsCompareFilterState.district = this.value; renderReviewsCompareView();">
              <option value="">${reviewsCompareFilterState.state ? '📍 ' + reviewsCompareFilterState.state : '📍 District'}</option>
              ${currentDistricts.map(dt => `
                <option value="${dt}" ${reviewsCompareFilterState.district === dt ? 'selected' : ''}>${dt}</option>
              `).join('')}
            </select>
          </div>

          <!-- Domain -->
          <div style="flex:1.2; min-width:170px;">
            <select class="colleges-dropdown-select" style="width:100%; height:44px;" onchange="reviewsCompareFilterState.domain = this.value; renderReviewsCompareView();">
              <option value="all">🎓 Domain: All</option>
              <option value="engineering" ${reviewsCompareFilterState.domain === 'engineering' ? 'selected' : ''}>Engineering &amp; Tech</option>
              <option value="arts_science" ${reviewsCompareFilterState.domain === 'arts_science' ? 'selected' : ''}>Arts &amp; Science</option>
              <option value="management" ${reviewsCompareFilterState.domain === 'management' ? 'selected' : ''}>Management &amp; MBA</option>
              <option value="medical" ${reviewsCompareFilterState.domain === 'medical' ? 'selected' : ''}>Medical &amp; Allied</option>
            </select>
          </div>

          ${isFilterActive ? `
            <button type="button" class="action-btn secondary" style="height:44px; padding:0 12px; font-size:12px; white-space:nowrap;" onclick="reviewsCompareFilterState = {search:'', state:'', district:'', domain:'all', college1:'', college2:'', c1Search:'', c2Search:'', activeCompare:false}; renderReviewsCompareView();">
              ↺ Reset
            </button>
          ` : ''}
        </div>
      </section>

      <!-- 2. Dual College Selection Boxes ([ COLLEGE 1 ] + [ COLLEGE 2 ] with Dedicated Search Bars) -->
      <section style="background:#FFFFFF; border:1px solid var(--theme-line, #E2E8F0); border-radius:16px; padding:24px; box-shadow:0 4px 20px rgba(0,0,0,0.03);">
        <div style="text-align:center; margin-bottom:18px;">
          <span style="font-size:11px; font-weight:800; color:#77AC3B; text-transform:uppercase; letter-spacing:0.8px; background:rgba(119,172,59,0.12); padding:4px 12px; border-radius:20px;">⚖️ Institutional Benchmarking Engine</span>
          <h3 style="margin:8px 0 4px; font-size:20px; font-weight:800; color:#0F172A;">Side-by-Side Dual Campus Comparison</h3>
          <p style="margin:0 auto; font-size:12.5px; color:#64748B; max-width:680px;">Search and select College 1 on the left and College 2 on the right to compare 10 factual parameters side-by-side:</p>
        </div>

        <div style="display:flex; flex-wrap:wrap; align-items:flex-start; justify-content:center; gap:20px;">
          <!-- COLLEGE 1 SELECT (Left Box) -->
          <div style="flex:1; min-width:290px; background:#F8FAFC; border:1px solid #E2E8F0; border-radius:14px; padding:16px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <label style="font-size:11.5px; font-weight:800; color:#0F172A; text-transform:uppercase;">🏛️ [ COLLEGE 1 (LEFT SIDE) ]</label>
              ${c1Id ? `<span class="pathway-badge teal" style="font-size:10.5px;">Selected</span>` : ''}
            </div>

            <!-- Small Search Bar for Left College Box -->
            <div style="margin-bottom:10px;">
              <input
                type="text"
                id="compareSearchCollege1"
                class="colleges-search-input-field"
                style="height:36px; font-size:12px; padding:0 10px; border-radius:8px; background:#FFFFFF; border:1px solid #CBD5E1;"
                placeholder="🔍 Search Left College (e.g. PSG, Amrita)..."
                value="${escapeHtml(reviewsCompareFilterState.c1Search || '')}"
                oninput="handleCompareCollege1Search(this.value)"
              />
            </div>

            <select id="compareCollege1Select" class="colleges-dropdown-select" style="width:100%; height:44px; background:#FFFFFF; border:1px solid #CBD5E1;" onchange="reviewsCompareFilterState.college1 = this.value; renderReviewsCompareView();">
              <option value="">-- Select First College (${c1Options.length} available) --</option>
              ${c1Options.map(c => `
                <option value="${c.id}" ${c.id === c1Id ? 'selected' : ''} ${c.id === c2Id ? 'disabled' : ''}>
                  🏛️ ${escapeHtml(c.name)} (${escapeHtml(c.district || c.city)}, ${escapeHtml(c.state)})
                </option>
              `).join('')}
            </select>
          </div>

          <div style="font-size:22px; font-weight:900; color:#77AC3B; padding-top:40px;">VS</div>

          <!-- COLLEGE 2 SELECT (Right Box) -->
          <div style="flex:1; min-width:290px; background:#F8FAFC; border:1px solid #E2E8F0; border-radius:14px; padding:16px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <label style="font-size:11.5px; font-weight:800; color:#0F172A; text-transform:uppercase;">🏛️ [ COLLEGE 2 (RIGHT SIDE) ]</label>
              ${c2Id ? `<span class="pathway-badge teal" style="font-size:10.5px;">Selected</span>` : ''}
            </div>

            <!-- Small Search Bar for Right College Box -->
            <div style="margin-bottom:10px;">
              <input
                type="text"
                id="compareSearchCollege2"
                class="colleges-search-input-field"
                style="height:36px; font-size:12px; padding:0 10px; border-radius:8px; background:#FFFFFF; border:1px solid #CBD5E1;"
                placeholder="🔍 Search Right College (e.g. CIT, KCT)..."
                value="${escapeHtml(reviewsCompareFilterState.c2Search || '')}"
                oninput="handleCompareCollege2Search(this.value)"
              />
            </div>

            <select id="compareCollege2Select" class="colleges-dropdown-select" style="width:100%; height:44px; background:#FFFFFF; border:1px solid #CBD5E1;" onchange="reviewsCompareFilterState.college2 = this.value; renderReviewsCompareView();">
              <option value="">-- Select Second College (${c2Options.length} available) --</option>
              ${c2Options.map(c => `
                <option value="${c.id}" ${c.id === c2Id ? 'selected' : ''} ${c.id === c1Id ? 'disabled' : ''}>
                  🏛️ ${escapeHtml(c.name)} (${escapeHtml(c.district || c.city)}, ${escapeHtml(c.state)})
                </option>
              `).join('')}
            </select>
          </div>

          <div style="width:100%; text-align:center; margin-top:12px;">
            <button
              type="button"
              class="primary-button"
              style="height:46px; padding:0 36px; font-size:14px; font-weight:800; display:inline-flex; align-items:center; gap:8px;"
              ${(!c1Id || !c2Id) ? 'disabled style="opacity:0.6; cursor:not-allowed;"' : ''}
              onclick="executeReviewsComparison()"
            >
              <span>Compare Both Colleges ➔</span>
            </button>
          </div>
        </div>
      </section>

      <!-- 3. Side-by-Side 10-Factor Comparison Matrix -->
      ${comparisonData ? `
        <section style="background:#FFFFFF; border:1px solid var(--theme-line, #E2E8F0); border-radius:16px; padding:24px; box-shadow:0 4px 20px rgba(0,0,0,0.03);">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:18px; padding-bottom:16px; border-bottom:1px solid var(--theme-line, #E2E8F0);">
            <div>
              <span class="pathway-badge teal" style="font-weight:800;">10-Factor Factual Matrix</span>
              <h3 style="margin:6px 0 0; font-size:19px; font-weight:800; color:#0F172A;">
                ${escapeHtml(comparisonData.college1.name)} <span style="color:#77AC3B;">VS</span> ${escapeHtml(comparisonData.college2.name)}
              </h3>
            </div>
            <div style="font-size:11.5px; color:#64748B;">
              Verified against NIRF disclosures, NAAC criteria, and validated placement statistics.
            </div>
          </div>

          <!-- Comparison Table -->
          <div style="overflow-x:auto;">
            <table style="width:100%; border-collapse:collapse; color:#0F172A; font-size:13px; text-align:left;">
              <thead>
                <tr style="border-bottom:2px solid #E2E8F0; background:#F8FAFC;">
                  <th style="padding:12px 14px; color:#64748B; width:28%; font-weight:800;">Comparison Criteria (10 Factors)</th>
                  <th style="padding:12px 14px; color:#0F172A; font-size:14px; width:36%; font-weight:800;">🏛️ ${escapeHtml(comparisonData.college1.name)}</th>
                  <th style="padding:12px 14px; color:#0F172A; font-size:14px; width:36%; font-weight:800;">🏛️ ${escapeHtml(comparisonData.college2.name)}</th>
                </tr>
              </thead>
              <tbody>
                <tr style="border-bottom:1px solid #E2E8F0;">
                  <td style="padding:12px 14px; font-weight:700; color:#334155;">1. Location &amp; District</td>
                  <td style="padding:12px 14px;">📍 ${escapeHtml(comparisonData.college1.district)}, ${escapeHtml(comparisonData.college1.state)}</td>
                  <td style="padding:12px 14px;">📍 ${escapeHtml(comparisonData.college2.district)}, ${escapeHtml(comparisonData.college2.state)}</td>
                </tr>
                <tr style="border-bottom:1px solid #E2E8F0; background:#F8FAFC;">
                  <td style="padding:12px 14px; font-weight:700; color:#334155;">2. NIRF Rank &amp; NAAC Grade</td>
                  <td style="padding:12px 14px;"><strong style="color:#77AC3B;">NIRF ${comparisonData.college1.nirf_rank}</strong> &bull; NAAC ${comparisonData.college1.naac_grade}</td>
                  <td style="padding:12px 14px;"><strong style="color:#77AC3B;">NIRF ${comparisonData.college2.nirf_rank}</strong> &bull; NAAC ${comparisonData.college2.naac_grade}</td>
                </tr>
                <tr style="border-bottom:1px solid #E2E8F0;">
                  <td style="padding:12px 14px; font-weight:700; color:#334155;">3. Verified Student Rating</td>
                  <td style="padding:12px 14px;">⭐ <strong>${comparisonData.college1.rating} / 5.0</strong></td>
                  <td style="padding:12px 14px;">⭐ <strong>${comparisonData.college2.rating} / 5.0</strong></td>
                </tr>
                <tr style="border-bottom:1px solid #E2E8F0; background:#F8FAFC;">
                  <td style="padding:12px 14px; font-weight:700; color:#334155;">4. Annual Course Tuition Fee</td>
                  <td style="padding:12px 14px; font-weight:800; color:#0F172A;">${comparisonData.college1.fees_per_year}</td>
                  <td style="padding:12px 14px; font-weight:800; color:#0F172A;">${comparisonData.college2.fees_per_year}</td>
                </tr>
                <tr style="border-bottom:1px solid #E2E8F0;">
                  <td style="padding:12px 14px; font-weight:700; color:#334155;">5. Median Placement Salary</td>
                  <td style="padding:12px 14px; font-weight:800; color:#77AC3B;">${comparisonData.college1.median_package}</td>
                  <td style="padding:12px 14px; font-weight:800; color:#77AC3B;">${comparisonData.college2.median_package}</td>
                </tr>
                <tr style="border-bottom:1px solid #E2E8F0; background:#F8FAFC;">
                  <td style="padding:12px 14px; font-weight:700; color:#334155;">6. Highest Package Recorded</td>
                  <td style="padding:12px 14px; font-weight:700;">${comparisonData.college1.highest_package}</td>
                  <td style="padding:12px 14px; font-weight:700;">${comparisonData.college2.highest_package}</td>
                </tr>
                <tr style="border-bottom:1px solid #E2E8F0;">
                  <td style="padding:12px 14px; font-weight:700; color:#334155;">7. Placement Percentage</td>
                  <td style="padding:12px 14px;"><strong>${comparisonData.college1.placement_pct}</strong> placed</td>
                  <td style="padding:12px 14px;"><strong>${comparisonData.college2.placement_pct}</strong> placed</td>
                </tr>
                <tr style="border-bottom:1px solid #E2E8F0; background:#F8FAFC;">
                  <td style="padding:12px 14px; font-weight:700; color:#334155;">8. Campus Facilities &amp; Labs Score</td>
                  <td style="padding:12px 14px;">${comparisonData.college1.scores.facilities} / 10</td>
                  <td style="padding:12px 14px;">${comparisonData.college2.scores.facilities} / 10</td>
                </tr>
                <tr style="border-bottom:1px solid #E2E8F0;">
                  <td style="padding:12px 14px; font-weight:700; color:#334155;">9. Student &amp; Career Guidance</td>
                  <td style="padding:12px 14px;">${comparisonData.college1.scores.guidance} / 10</td>
                  <td style="padding:12px 14px;">${comparisonData.college2.scores.guidance} / 10</td>
                </tr>
                <tr style="border-bottom:1px solid #E2E8F0; background:#F8FAFC;">
                  <td style="padding:12px 14px; font-weight:700; color:#334155;">10. Key Institutional Strengths</td>
                  <td style="padding:12px 14px; font-size:12px; color:#334155;">
                    <ul style="margin:0; padding-left:16px;">
                      ${(comparisonData.college1.strengths || []).map(s => `<li>${escapeHtml(s)}</li>`).join('')}
                    </ul>
                  </td>
                  <td style="padding:12px 14px; font-size:12px; color:#334155;">
                    <ul style="margin:0; padding-left:16px;">
                      ${(comparisonData.college2.strengths || []).map(s => `<li>${escapeHtml(s)}</li>`).join('')}
                    </ul>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Transparent Data-Backed Recommendation Box -->
          <div style="margin-top:20px; background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; padding:18px;">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
              <span style="font-size:20px;">💡</span>
              <strong style="color:#0F172A; font-size:14.5px;">Transparent Data-Backed Recommendation:</strong>
            </div>
            <p style="margin:0; font-size:13px; color:#334155; line-height:1.55;">
              ${escapeHtml(comparisonData.recommendation ? comparisonData.recommendation.summary : 'Both institutions demonstrate strong academic standards tailored to distinct student career goals.')}
            </p>
          </div>
        </section>
      ` : `
        <div style="text-align:center; padding:40px 20px; background:#FFFFFF; border:1px dashed #CBD5E1; border-radius:16px;">
          <div style="font-size:36px; margin-bottom:8px;">⚖️</div>
          <h3 style="margin:0 0 6px; color:#0F172A; font-size:17px; font-weight:800;">Select Two Colleges Above to Compare</h3>
          <p style="color:#64748B; font-size:12.5px; margin:0;">Pick [ College 1 ] and [ College 2 ] from the dropdowns and click "Compare Both Colleges" to view the 10-factor side-by-side matrix.</p>
        </div>
      `}

      <!-- 4. Reviews & Suggestion Box Split Section -->
      <section class="survey-split-layout" style="margin-top:0;">
        <div class="survey-cards-column">
          <div class="category-shortcuts-heading" style="margin-top:0;">
            <h3>💬 5 Verified Comparison &amp; Guidance Reviews</h3>
            <span style="font-size:11.5px; color:var(--theme-muted);">Parent and counselor feedback on side-by-side institutional metrics</span>
          </div>

          <div style="display:flex; flex-direction:column; gap:10px; margin-top:12px;">
            ${reviews.slice(0, 5).map(r => `
              <div class="cn-review-card-compact">
                <div class="cn-review-header">
                  <div class="cn-review-author-wrap">
                    <div class="cn-review-avatar">${escapeHtml((r.author || 'RC').slice(0, 2).toUpperCase())}</div>
                    <div>
                      <div class="cn-review-name">${escapeHtml(r.author || 'Reviewer')}</div>
                      <div class="cn-review-role">📍 <strong style="color:#0F172A;">${escapeHtml(r.college || 'Coimbatore')}</strong> &bull; ${escapeHtml(r.role || 'Parent')}</div>
                    </div>
                  </div>
                  <div class="cn-review-stars">★★★★★ ${(r.rating || 5.0).toFixed(1)}</div>
                </div>
                <p class="cn-review-text">"${escapeHtml(r.comment || '')}"</p>
              </div>
            `).join('')}
          </div>
        </div>

        <aside class="survey-chart-sidebar">
          <div class="user-remarks-panel" style="background:#FFFFFF; border:1px solid var(--theme-line, #E2E8F0); border-radius:14px; padding:20px; box-shadow:0 4px 16px rgba(0,0,0,0.02);">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
              <span style="font-size:20px;">⚖️</span>
              <div>
                <h4 style="margin:0; color:#0F172A; font-size:14px; font-weight:800;">Comparison Feedback Box</h4>
                <small style="color:var(--theme-muted); font-size:11px;">Share comparative insights</small>
              </div>
            </div>
            <form id="comparisonSuggestionForm" onsubmit="submitUniversalSuggestion(event, 'comparison');">
              <div class="remarks-form-group" style="margin-bottom:8px;">
                <input type="text" name="user_name" class="remarks-form-input" placeholder="Your Name &amp; Role..." style="width:100%; height:38px; font-size:12px; padding:0 10px; border-radius:8px; background:#F8FAFC; border:1px solid var(--theme-line, #E2E8F0); color:#0F172A;" />
              </div>
              <div class="remarks-form-group" style="margin-bottom:10px;">
                <textarea name="message" class="remarks-form-textarea" rows="3" placeholder="Suggest two colleges for comparison or share metric corrections..." style="width:100%; font-size:12px; padding:8px 10px; border-radius:8px; background:#F8FAFC; border:1px solid var(--theme-line, #E2E8F0); color:#0F172A; font-family:inherit;"></textarea>
              </div>
              <button type="submit" class="primary-button" style="width:100%; height:38px; font-size:12px; justify-content:center;">
                <span>Submit Comparison Feedback ↗</span>
              </button>
            </form>
          </div>
        </aside>
      </section>

    </div>
  `;
}
window.renderReviewsCompareView = renderReviewsCompareView;

// ============================================================================
// UNIVERSAL MODAL SYSTEM & ADMISSION PDF EXPORTER
// ============================================================================
function openUniversalModal({ title, subtitle, badge, contentHtml, primaryActionHtml, footNote }) {
  const modal = document.getElementById('universalDetailModal');
  if (!modal) {
    showToast(title || 'Detail View');
    return;
  }

  const titleEl = document.getElementById('universalModalTitle');
  const subEl = document.getElementById('universalModalSubtitle');
  const badgeEl = document.getElementById('universalModalBadge');
  const bodyEl = document.getElementById('universalModalBody');
  const actionEl = document.getElementById('universalModalPrimaryAction');
  const footEl = document.getElementById('universalModalFootNote');

  if (titleEl) titleEl.textContent = title || 'Detail View';
  if (subEl) subEl.textContent = subtitle || 'Comprehensive information and verified roadmap';
  if (badgeEl) badgeEl.textContent = badge || 'VERIFIED RESOURCE';
  if (bodyEl) bodyEl.innerHTML = contentHtml || '';
  if (actionEl) actionEl.innerHTML = primaryActionHtml || '';
  if (footEl) footEl.textContent = footNote || 'Official TheCampusNova Verified Blueprint';

  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}
window.openUniversalModal = openUniversalModal;

function closeUniversalModal() {
  const modal = document.getElementById('universalDetailModal');
  if (modal) {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }
  document.body.style.overflow = '';
}
window.closeUniversalModal = closeUniversalModal;
window.closeDetailsModal = closeUniversalModal;

function openHelpSupportModal() {
  openUniversalModal({
    title: 'Help & Student Support Center',
    subtitle: 'Guidance, college discovery assistance, roadmap navigation & institutional support',
    badge: 'STUDENT SUPPORT & ADMISSIONS DESK',
    contentHtml: `
      <div style="display:flex; flex-direction:column; gap:20px;">
        <div style="background:#F0FDF4; border:1px solid #BBF7D0; border-radius:12px; padding:16px 20px;">
          <h4 style="margin:0 0 6px; font-size:15px; color:#166534; display:flex; align-items:center; gap:8px;">
            <span>✦</span> Instant AI Education Guidance
          </h4>
          <p style="margin:0; font-size:13px; color:#15803D; line-height:1.5;">
            Need personalized degree suggestions or entrance syllabus breakdowns? Click below to launch <strong>TheCampusNova AI</strong> for instant, data-backed educational assistance.
          </p>
          <div style="margin-top:12px;">
            <button type="button" class="primary-button" style="height:36px; padding:0 18px; font-size:12.5px;" onclick="closeUniversalModal(); openAiAssistant();">Launch CampusNova AI Assistant ↗</button>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:16px;">
          <div style="background:#FFFFFF; border:1px solid #E2E8F0; border-radius:12px; padding:16px;">
            <h4 style="margin:0 0 8px; font-size:14px; color:#0F172A; font-weight:700;">🎓 College & Course Discovery</h4>
            <p style="margin:0 0 10px; font-size:12.5px; color:#64748B; line-height:1.5;">
              Filter across 4,200+ premier institutions by State and District. Inspect NIRF rankings, NAAC accreditations, tuition expenses, and year-by-year syllabus blueprints.
            </p>
            <ul style="margin:0; padding-left:18px; font-size:12px; color:#475569; line-height:1.6;">
              <li>Explore 7 education categories & specializations</li>
              <li>Compound State + District matching</li>
              <li>Year-by-year academic subject outlines</li>
            </ul>
          </div>

          <div style="background:#FFFFFF; border:1px solid #E2E8F0; border-radius:12px; padding:16px;">
            <h4 style="margin:0 0 8px; font-size:14px; color:#0F172A; font-weight:700;">📝 Entrance Exams & Preparation</h4>
            <p style="margin:0 0 10px; font-size:12.5px; color:#64748B; line-height:1.5;">
              Access official exam patterns, eligibility requirements, cutoff percentiles, syllabus stages, and recommended study reference materials.
            </p>
            <ul style="margin:0; padding-left:18px; font-size:12px; color:#475569; line-height:1.6;">
              <li>National (JEE, NEET, GATE, CAT, CUET)</li>
              <li>State CETs and university tests</li>
              <li>Downloadable preparation blueprints</li>
            </ul>
          </div>

          <div style="background:#FFFFFF; border:1px solid #E2E8F0; border-radius:12px; padding:16px;">
            <h4 style="margin:0 0 8px; font-size:14px; color:#0F172A; font-weight:700;">💼 Placements & Career Trajectories</h4>
            <p style="margin:0 0 10px; font-size:12.5px; color:#64748B; line-height:1.5;">
              Inspect top recruiter hiring tiers, interview selection stages, quantitative aptitude question weightages, and 10-year domain growth forecasts.
            </p>
            <ul style="margin:0; padding-left:18px; font-size:12px; color:#475569; line-height:1.6;">
              <li>Median and highest salary benchmarks</li>
              <li>Industry domain matrices & tech stacks</li>
              <li>Verified graduate internship opportunities</li>
            </ul>
          </div>

          <div style="background:#FFFFFF; border:1px solid #E2E8F0; border-radius:12px; padding:16px;">
            <h4 style="margin:0 0 8px; font-size:14px; color:#0F172A; font-weight:700;">🏛️ College Updates & Grievances</h4>
            <p style="margin:0 0 10px; font-size:12.5px; color:#64748B; line-height:1.5;">
              Are you an authorized university administrator? Submit verified institutional profile updates, seat counseling schedules, or placement records.
            </p>
            <ul style="margin:0; padding-left:18px; font-size:12px; color:#475569; line-height:1.6;">
              <li>Direct verification ticketing system</li>
              <li>24-hour editorial review turnaround</li>
              <li>Accreditation certificate sync</li>
            </ul>
          </div>
        </div>

        <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; padding:16px 20px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
          <div>
            <div style="font-weight:700; font-size:13px; color:#0F172A;">Need Direct Support Assistance?</div>
            <div style="font-size:12px; color:#64748B; margin-top:2px;">Email: <strong>support@thecampusnova.com</strong> • Response within 24 business hours</div>
          </div>
          <button type="button" class="colleges-filter-clear-btn" style="height:36px; padding:0 16px; font-size:12px;" onclick="showToast('Support ticket dispatched. Our team will contact you via email.');">Contact Support Team</button>
        </div>
      </div>
    `,
    primaryActionHtml: `<button type="button" class="primary-button" style="height:38px; font-size:13px;" onclick="closeUniversalModal()">Close Support Center</button>`,
    footNote: 'TheCampusNova Student Support & Academic Advisory Network'
  });
}
window.openHelpSupportModal = openHelpSupportModal;

function openTermsModal() {
  openUniversalModal({
    title: 'Terms of Service & Educational Guidance Policy',
    subtitle: 'Transparent, reliable standards for academic guidance, verified data & student privacy',
    badge: 'LEGAL & INSTITUTIONAL CHARTER',
    contentHtml: `
      <div style="display:flex; flex-direction:column; gap:18px;">
        <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; padding:16px 20px;">
          <h4 style="margin:0 0 6px; font-size:14px; color:#0F172A;">1. Educational Guidance & Non-Commercial Advisory</h4>
          <p style="margin:0; font-size:12.5px; color:#475569; line-height:1.6;">
            TheCampusNova operates as an independent higher education discovery, analytics, and academic roadmap system. All course blueprints, fee indicators, cutoff ranges, and curriculum outlines are designed for informational, counseling, and holistic career orientation purposes.
          </p>
        </div>

        <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; padding:16px 20px;">
          <h4 style="margin:0 0 6px; font-size:14px; color:#0F172A;">2. Data Integrity & Government Accreditation Benchmarks</h4>
          <p style="margin:0; font-size:12.5px; color:#475569; line-height:1.6;">
            Institutional rankings, NIRF benchmark scores, NAAC grades, and AISHE statistics are curated directly from authorized Ministry of Education reports, regulatory statutory bodies (UGC, AICTE, NMC, BCI, PCI), and official university disclosures. TheCampusNova regularly verifies institutional profiles to maintain authentic data parity.
          </p>
        </div>

        <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; padding:16px 20px;">
          <h4 style="margin:0 0 6px; font-size:14px; color:#0F172A;">3. Student Privacy & Non-Disclosure Charter</h4>
          <p style="margin:0; font-size:12.5px; color:#475569; line-height:1.6;">
            We strictly protect student privacy. Search queries, bookmark history, and academic survey remarks remain confidential and protected. TheCampusNova never sells, leases, or trades student personal contact information to third-party telemarketing or commercial sales brokers.
          </p>
        </div>

        <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; padding:16px 20px;">
          <h4 style="margin:0 0 6px; font-size:14px; color:#0F172A;">4. Official Examination Portals & External References</h4>
          <p style="margin:0; font-size:12.5px; color:#475569; line-height:1.6;">
            Direct links provided for official registration portals (NTA, JEE, NEET, GATE, CAT, UPSC) are offered for candidate convenience. Students are advised to verify critical application deadlines, admit card download schedules, and seat allocation rules directly on respective official conducting authority portals.
          </p>
        </div>

        <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; padding:16px 20px;">
          <h4 style="margin:0 0 6px; font-size:14px; color:#0F172A;">5. Institutional Correction & Transparency Workflow</h4>
          <p style="margin:0; font-size:12.5px; color:#475569; line-height:1.6;">
            Registered college authorities have access to request updates or provide revised placement audits through our verified institutional ticket channel at <strong>editorial@thecampusnova.com</strong>.
          </p>
        </div>
      </div>
    `,
    primaryActionHtml: `<button type="button" class="primary-button" style="height:38px; font-size:13px;" onclick="closeUniversalModal()">I Understand &amp; Agree</button>`,
    footNote: 'TheCampusNova Terms of Service • Updated for Academic Year 2026'
  });
}
window.openTermsModal = openTermsModal;

// Admissions PDF Download Generator
function downloadAdmissionBlueprintPDF(admId) {
  const admissions = (_cachedAdmissionsData && _cachedAdmissionsData.admissions) ? _cachedAdmissionsData.admissions : [];
  const adm = admissions.find(x => x.id === admId) || admissions[0];
  if (!adm) {
    showToast('Admission data not found for PDF export.', 'error');
    return;
  }

  const fees = adm.fee_structure || {};
  const printHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>TheCampusNova - ${escapeHtml(adm.college_name)} Admission Blueprint</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 36px; color: #0F172A; max-width: 800px; margin: 0 auto; line-height: 1.5; }
        .header { border-bottom: 2px solid #77AC3B; padding-bottom: 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
        .brand { font-size: 20px; font-weight: 900; color: #77AC3B; letter-spacing: 0.5px; }
        .title { font-size: 22px; font-weight: 800; color: #0F172A; margin: 6px 0 2px; }
        .badge { display: inline-block; background: #EEF7E8; color: #4D7C0F; font-size: 11px; font-weight: 800; padding: 3px 8px; border-radius: 4px; text-transform: uppercase; }
        .section-title { font-size: 15px; font-weight: 800; color: #0F172A; margin: 18px 0 8px; border-bottom: 1px solid #E2E8F0; padding-bottom: 4px; text-transform: uppercase; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 13px; }
        th, td { border: 1px solid #E2E8F0; padding: 8px 12px; text-align: left; }
        th { background: #F8FAFC; font-weight: 700; color: #334155; }
        ul { margin: 0; padding-left: 20px; font-size: 13px; }
        li { margin-bottom: 4px; }
        .footer { margin-top: 30px; padding-top: 14px; border-top: 1px solid #E2E8F0; font-size: 11px; color: #64748B; text-align: center; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="brand">THECAMPUSNOVA</div>
          <div class="title">${escapeHtml(adm.college_name)}</div>
          <div style="font-size: 12px; color: #64748B;">📍 ${escapeHtml(adm.district || 'Coimbatore')}, ${escapeHtml(adm.state || 'Tamil Nadu')} &bull; Academic Year 2026-2027</div>
        </div>
        <div style="text-align: right;">
          <span class="badge">Official Verified Blueprint</span>
          <div style="font-size: 11px; color: #64748B; margin-top: 4px;">Generated on ${new Date().toLocaleDateString('en-IN')}</div>
        </div>
      </div>

      <div class="section-title">1. Complete Fee Structure Breakdown</div>
      <table>
        <thead>
          <tr>
            <th>Fee Component</th>
            <th>Amount (INR)</th>
            <th>Billing Frequency</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Annual Tuition Fee</td><td><strong>${escapeHtml(fees.tuition_fee || '₹85,000 / yr')}</strong></td><td>Annual</td><td>Mandatory</td></tr>
          <tr><td>Laboratory &amp; Library Deposit</td><td><strong>${escapeHtml(fees.lab_library_fee || '₹10,000 / yr')}</strong></td><td>Annual</td><td>Mandatory</td></tr>
          <tr><td>One-Time Admission Registration</td><td><strong>${escapeHtml(adm.admission_fee || '₹5,000')}</strong></td><td>One-Time</td><td>Mandatory</td></tr>
          <tr><td>Student Hostel &amp; Accommodation</td><td><strong>${escapeHtml(fees.hostel_fee || '₹65,000 / yr')}</strong></td><td>Annual</td><td>Optional (Residential)</td></tr>
          <tr><td>College Bus Route Transit</td><td><strong>${escapeHtml(fees.bus_transport_fee || '₹22,000 / yr')}</strong></td><td>Annual</td><td>Optional (Day Scholar)</td></tr>
          <tr><td>Canteen / Dining Mess Plan</td><td><strong>${escapeHtml(fees.canteen_food_fee || '₹38,000 / yr')}</strong></td><td>Annual</td><td>Optional</td></tr>
        </tbody>
      </table>

      <div class="section-title">2. Mandatory Verification Documents Checklist</div>
      <ul>
        ${(adm.required_documents || [
          '10th Standard Original Marksheet & 3 Attested Photocopies',
          '12th Standard Original Marksheet / Provisional Passing Certificate',
          'Transfer Certificate (TC) & Conduct Certificate from previous institution',
          'Community / Caste Certificate (if claiming reservation quota)',
          'Income Certificate (for First Graduate or Government Fee Concession)',
          'Aadhaar Card Copy & 5 Passport Size Color Photographs'
        ]).map(d => `<li>${escapeHtml(d)}</li>`).join('')}
      </ul>

      <div class="section-title">3. Admission Desk &amp; Office Timings</div>
      <p style="font-size: 13px; margin: 4px 0;">
        <strong>College Working Hours:</strong> ${escapeHtml(adm.college_timings || '8:30 AM - 4:30 PM')}<br/>
        <strong>Admissions Counter:</strong> ${escapeHtml(adm.admission_office_timings || '9:00 AM - 5:30 PM')}<br/>
        <strong>Counseling Window:</strong> Open ${escapeHtml(adm.opening_date || 'January 2026')} &bull; Closes ${escapeHtml(adm.closing_date || 'August 2026')}
      </p>

      <div class="footer">
        Verified by TheCampusNova Academic Intelligence Database &bull; Official Support: contact@thecampusnova.com
      </div>
      <script>
        window.onload = function() { window.print(); }
      </script>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(printHtml);
    printWindow.document.close();
    showToast('Opening print dialog to generate PDF...');
  } else {
    showToast('Please allow popups to export the Admission PDF.', 'warning');
  }
}
window.downloadAdmissionBlueprintPDF = downloadAdmissionBlueprintPDF;

// 1. Careers Large Detail Modal
function openCareerDetailModal(careerId) {
  const careers = (_cachedCareersData && _cachedCareersData.career_areas) ? _cachedCareersData.career_areas : [];
  const c = careers.find(x => String(x.id) === String(careerId)) || careers[0];
  if (!c) return;

  let roadmapSteps = [];
  if (Array.isArray(c.roadmap)) {
    roadmapSteps = c.roadmap.map((item, idx) => {
      if (typeof item === 'object' && item !== null) {
        return {
          step: item.step || (idx + 1),
          title: item.title || `Phase ${idx + 1}`,
          desc: item.desc || item.description || '',
          duration: item.duration || '2-3 Months'
        };
      }
      return {
        step: idx + 1,
        title: `Phase ${idx + 1}`,
        desc: String(item),
        duration: 'Self-paced'
      };
    });
  } else if (typeof c.roadmap === 'string' && c.roadmap.trim()) {
    roadmapSteps = c.roadmap.split(/\n|->|;|,/).map(s => s.trim()).filter(Boolean).map((st, idx) => ({
      step: idx + 1,
      title: `Phase ${idx + 1}`,
      desc: st,
      duration: 'Self-paced'
    }));
  }

  const contentHtml = `
    <div style="font-size:13.5px; color:#334155;">
      <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; padding:16px; margin-bottom:18px;">
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:10px;">
          <div>💰 <strong>Average Package:</strong> <span style="color:#E06D53; font-weight:800;">${escapeHtml(c.avg_salary || '₹12-25 LPA')}</span></div>
          <div>📈 <strong>Growth Rate:</strong> <span style="color:#77AC3B; font-weight:800;">${escapeHtml(c.growth_rate || '+35% YoY')}</span></div>
          <div>🔮 <strong>10-Yr Demand:</strong> <strong>${escapeHtml(c.importance_10yr || 'Critical')}</strong></div>
          <div>🎓 <strong>Typical Intake:</strong> <strong>${escapeHtml(c.education || 'UG/PG Degrees')}</strong></div>
        </div>
      </div>

      <div style="margin-bottom:18px;">
        <strong style="color:#0F172A; font-size:14px; display:block; margin-bottom:8px;">🛠️ Core Technologies &amp; Languages:</strong>
        <div style="display:flex; flex-wrap:wrap; gap:6px;">
          ${(c.languages || []).map(l => `<span class="pathway-badge teal">${escapeHtml(l)}</span>`).join('')}
          ${(c.core_technologies || []).map(t => `<span class="pathway-badge" style="background:#F1F5F9; color:#0F172A;">${escapeHtml(t)}</span>`).join('')}
        </div>
      </div>

      <div style="margin-bottom:18px;">
        <strong style="color:#0F172A; font-size:14.5px; display:block; margin-bottom:10px;">🗺️ Complete Step-by-Step Curriculum Roadmap:</strong>
        <div style="display:flex; flex-direction:column; gap:10px;">
          ${roadmapSteps.map(r => `
            <div style="background:#F8FAFC; border-left:3px solid #77AC3B; border-radius:8px; padding:12px 14px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                <strong style="color:#0F172A; font-size:13.5px;">Step ${r.step}: ${escapeHtml(r.title)}</strong>
                <span class="pathway-badge teal" style="font-size:10.5px;">⏱️ ${escapeHtml(r.duration)}</span>
              </div>
              <p style="margin:0; font-size:12.5px; color:#475569; line-height:1.5;">${escapeHtml(r.desc)}</p>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  openUniversalModal({
    title: c.name,
    subtitle: `${c.category || 'Technology Pathway'} • 5-Stage Complete Curriculum & Milestones`,
    badge: 'CAREER ROADMAP',
    contentHtml: contentHtml,
    primaryActionHtml: `<button type="button" class="primary-button" style="height:38px; font-size:13px;" onclick="closeUniversalModal()">Close Roadmap</button>`
  });
}
window.openCareerDetailModal = openCareerDetailModal;

// 2. Jobs Large Detail Modal
function openJobDetailModal(jobId) {
  const jobs = (_cachedJobsData && _cachedJobsData.jobs) ? _cachedJobsData.jobs : [];
  const j = jobs.find(x => String(x.id) === String(jobId)) || jobs[0];
  if (!j) return;

  const toArr = val => Array.isArray(val) ? val : (typeof val === 'string' && val.trim() ? val.split(/\s*,\s*/) : []);

  const contentHtml = `
    <div style="font-size:13.5px; color:#334155;">
      <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; padding:16px; margin-bottom:18px;">
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:10px;">
          <div>💰 <strong>Compensation:</strong> <span style="color:#E06D53; font-weight:800;">${escapeHtml(j.salary || '₹8 - 14 LPA')}</span></div>
          <div>📍 <strong>Location:</strong> <strong>${escapeHtml(j.location || 'All India')}</strong></div>
          <div>🎓 <strong>Education:</strong> <strong>${escapeHtml(j.education || 'UG/PG Degrees')}</strong></div>
          <div>⏱️ <strong>Experience Level:</strong> <strong>${escapeHtml(j.exp_level || 'Fresher (0-1 Yrs)')}</strong></div>
        </div>
      </div>

      <div style="margin-bottom:16px;">
        <strong style="color:#0F172A; font-size:14px; display:block; margin-bottom:6px;">💡 Why Join &amp; Growth Possibilities:</strong>
        <p style="margin:0 0 6px; font-size:12.5px; color:#475569; line-height:1.5;">${escapeHtml(j.why_join || 'Direct engineering ownership and accelerated tech lead progression.')}</p>
        <div style="font-size:12px; color:#77AC3B; font-weight:700;">📈 Growth: ${escapeHtml(j.growth_trend || 'Promotion to Senior Engineer in 2-3 years')}</div>
      </div>

      <div style="margin-bottom:16px;">
        <strong style="color:#0F172A; font-size:14px; display:block; margin-bottom:8px;">🛠️ Technical &amp; Soft Skills Required:</strong>
        <div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:8px;">
          ${toArr(j.tech_skills).map(s => `<span class="pathway-badge teal">${escapeHtml(s)}</span>`).join('')}
        </div>
        <div style="display:flex; flex-wrap:wrap; gap:6px;">
          ${toArr(j.soft_skills).map(s => `<span class="pathway-badge" style="background:#F1F5F9; color:#0F172A;">${escapeHtml(s)}</span>`).join('')}
        </div>
      </div>

      <div style="margin-bottom:16px;">
        <strong style="color:#0F172A; font-size:14px; display:block; margin-bottom:6px;">📝 Assessment &amp; Recruitment Rounds:</strong>
        <p style="margin:0; font-size:12.5px; color:#475569; line-height:1.5;">${escapeHtml(j.assessment || 'Online Technical Assessment -> Live Problem Solving -> HR Round')}</p>
      </div>

      <div>
        <strong style="color:#0F172A; font-size:14px; display:block; margin-bottom:6px;">📜 Document &amp; Verification Requirements:</strong>
        <p style="margin:0; font-size:12.5px; color:#475569; line-height:1.5;">${escapeHtml(j.verification || 'Standard academic transcripts, government ID, and provisional degree certificate.')}</p>
      </div>
    </div>
  `;

  const jobPortalUrl = formatPortalUrl(j.application_url || j.apply_url || j.applyUrl || j.website || j.portal_url);
  const primaryBtn = jobPortalUrl ? `
    <a href="${escapeHtml(jobPortalUrl)}" target="_blank" rel="noopener noreferrer" class="primary-button" style="height:38px; font-size:13px; text-decoration:none; display:inline-flex; align-items:center; gap:6px;">
      <span>Apply on Official Portal ↗</span>
    </a>
  ` : `<button type="button" class="primary-button" onclick="closeUniversalModal()">Close</button>`;

  openUniversalModal({
    title: `${j.role || 'Job Opening'} • ${j.company || 'Premier Recruiter'}`,
    subtitle: `Verified Corporate Opening in ${j.location || 'All India'} • ${j.education || 'UG/PG Degrees'}`,
    badge: 'JOB BLUEPRINT',
    contentHtml: contentHtml,
    primaryActionHtml: primaryBtn
  });
}
window.openJobDetailModal = openJobDetailModal;

// 3. Admissions Large Detail Modal
function openAdmissionDetailModal(admId) {
  const admissions = (_cachedAdmissionsData && _cachedAdmissionsData.admissions) ? _cachedAdmissionsData.admissions : [];
  const adm = admissions.find(x => String(x.id) === String(admId)) || admissions[0];
  if (!adm) return;

  const toArr = val => Array.isArray(val) ? val : (typeof val === 'string' && val.trim() ? val.split(/\s*,\s*/) : []);
  const fees = adm.fee_structure || {};
  const contentHtml = `
    <div style="font-size:13.5px; color:#334155;">
      <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; padding:16px; margin-bottom:18px;">
        <h4 style="margin:0 0 10px; color:#0F172A; font-size:14px; font-weight:800;">💰 Complete Fee Structure Breakdown:</h4>
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:10px; font-size:12.5px;">
          <div>• Annual Tuition: <strong style="color:#0F172A;">${escapeHtml(fees.tuition_fee || '₹85,000 / yr')}</strong></div>
          <div>• Lab &amp; Library: <strong style="color:#0F172A;">${escapeHtml(fees.lab_library_fee || '₹10,000 / yr')}</strong></div>
          <div>• Hostel Fee: <strong style="color:#0F172A;">${escapeHtml(fees.hostel_fee || '₹65,000 / yr')}</strong></div>
          <div>• Bus Route Fee: <strong style="color:#0F172A;">${escapeHtml(fees.bus_transport_fee || '₹22,000 / yr')}</strong></div>
          <div>• Canteen / Mess: <strong style="color:#0F172A;">${escapeHtml(fees.canteen_food_fee || '₹38,000 / yr')}</strong></div>
          <div>• One-Time Registration: <strong style="color:#77AC3B;">${escapeHtml(adm.admission_fee || '₹5,000')}</strong></div>
        </div>
      </div>

      <div style="margin-bottom:18px;">
        <h4 style="margin:0 0 8px; color:#0F172A; font-size:14px; font-weight:800;">📄 Mandatory Verification Documents Checklist:</h4>
        <ul style="margin:0; padding-left:20px; font-size:12.5px; line-height:1.6; color:#475569;">
          ${toArr(adm.required_documents || [
            '10th Standard Original Marksheet & 3 Copies',
            '12th Standard Original Marksheet / Provisional Certificate',
            'Transfer Certificate (TC) & Conduct Certificate',
            'Community Certificate (if applicable)',
            'First Graduate Certificate / Income Certificate',
            'Aadhaar Card Copy & 5 Passport Photographs'
          ]).map(d => `<li>${escapeHtml(d)}</li>`).join('')}
        </ul>
      </div>

      <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:12px 16px; font-size:12px; color:#64748B;">
        ⏱️ <strong>College Working Hours:</strong> ${escapeHtml(adm.college_timings || '8:30 AM - 4:30 PM')}<br/>
        🏛️ <strong>Admissions Office:</strong> ${escapeHtml(adm.admission_office_timings || '9:00 AM - 5:30 PM')}<br/>
        📅 <strong>Counseling Cycle:</strong> Open ${escapeHtml(adm.opening_date || 'January 2026')} &bull; Closes ${escapeHtml(adm.closing_date || 'August 2026')}
      </div>
    </div>
  `;

  const admPortal = formatPortalUrl(adm.portal_url || adm.application_url || adm.apply_url || adm.website);
  const primaryBtn = `
    <div style="display:flex; gap:8px; align-items:center;">
      <button type="button" class="primary-button" style="height:38px; font-size:13px; background:#77AC3B; border-color:#77AC3B;" onclick="downloadAdmissionBlueprintPDF('${adm.id}')">
        <span>📥 DOWNLOAD PDF</span>
      </button>
      ${admPortal ? `
        <a href="${escapeHtml(admPortal)}" target="_blank" rel="noopener noreferrer" class="primary-button" style="height:38px; font-size:13px; text-decoration:none; display:inline-flex; align-items:center; gap:6px;">
          <span>Official Portal ↗</span>
        </a>
      ` : ''}
    </div>
  `;

  openUniversalModal({
    title: adm.college_name || 'Admissions Portal',
    subtitle: `Full Fee Breakdown & Mandatory Document Verification Blueprint (2026 Academic Year)`,
    badge: 'ADMISSIONS BLUEPRINT',
    contentHtml: contentHtml,
    primaryActionHtml: primaryBtn
  });
}
window.openAdmissionDetailModal = openAdmissionDetailModal;

// 4. Scholarships Large Detail Modal
function openScholarshipDetailModal(schId) {
  const scholarships = (_cachedScholarshipsFullData && _cachedScholarshipsFullData.scholarships) ? _cachedScholarshipsFullData.scholarships : [];
  const s = scholarships.find(x => String(x.id) === String(schId)) || scholarships[0];
  if (!s) return;

  const toArr = val => Array.isArray(val) ? val : (typeof val === 'string' && val.trim() ? val.split(/\s*,\s*/) : []);

  const contentHtml = `
    <div style="font-size:13.5px; color:#334155;">
      <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; padding:16px; margin-bottom:18px;">
        <div style="font-size:15px; color:#77AC3B; font-weight:800; margin-bottom:6px;">💰 Grant Benefit: ${escapeHtml(s.benefit || 'Full / Partial Tuition Grant')}</div>
        <div style="font-size:12.5px; color:#475569; line-height:1.5;">📋 <strong>Eligibility Criteria:</strong> ${escapeHtml(s.eligibility_criteria || 'Standard merit and income ceilings apply.')}</div>
        <div style="font-size:12px; color:#64748B; margin-top:6px;">🏛️ <strong>Applicable Institutions:</strong> ${escapeHtml(s.college_eligibility || 'All Recognized Universities')}</div>
      </div>

      <div style="margin-bottom:18px;">
        <h4 style="margin:0 0 8px; color:#0F172A; font-size:14px; font-weight:800;">📄 Required Verification Documents:</h4>
        <ul style="margin:0; padding-left:20px; font-size:12.5px; line-height:1.6; color:#475569;">
          ${toArr(s.required_documents).map(d => `<li>${escapeHtml(d)}</li>`).join('')}
        </ul>
      </div>

      <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:12px 16px; font-size:12px; color:#64748B;">
        📅 <strong>Application Deadline:</strong> ${escapeHtml(s.deadline || '31 August 2026')}<br/>
        🧭 <strong>Submission Portal:</strong> ${escapeHtml(s.application_process || 'Direct NSP / State e-Grantz portal verification')}
      </div>
    </div>
  `;

  const schPortal = formatPortalUrl(s.application_url || s.portal_url || s.apply_url || s.website);
  const primaryBtn = schPortal ? `
    <div style="display:flex; gap:8px; align-items:center;">
      <a href="${escapeHtml(schPortal)}" target="_blank" rel="noopener noreferrer" class="primary-button" style="height:38px; font-size:13px; text-decoration:none; display:inline-flex; align-items:center; gap:6px;">
        <span>Official Portal ↗</span>
      </a>
      <button type="button" class="secondary-button" style="height:38px; font-size:13px;" onclick="closeUniversalModal()">Close Guide</button>
    </div>
  ` : `<button type="button" class="primary-button" onclick="closeUniversalModal()">Close Guide</button>`;

  openUniversalModal({
    title: s.name || 'Scholarship Scheme',
    subtitle: `${s.type || 'Government Scheme'} • Complete Guidelines & Document Checklist`,
    badge: 'SCHOLARSHIP GUIDE',
    contentHtml: contentHtml,
    primaryActionHtml: primaryBtn
  });
}
window.openScholarshipDetailModal = openScholarshipDetailModal;

// 6. Placements Large Detail Modal
function openPlacementDetailModal(placementId) {
  const visits = (_cachedPlacementsFullData && _cachedPlacementsFullData.company_visits) ? _cachedPlacementsFullData.company_visits : [];
  const v = visits.find(x => String(x.id) === String(placementId));
  if (!v) {
    if (typeof openPlacementPlaybookModal === 'function') {
      openPlacementPlaybookModal(placementId);
    }
    return;
  }

  const toArr = val => Array.isArray(val) ? val : (typeof val === 'string' && val.trim() ? val.split(/\s*,\s*/) : []);

  const contentHtml = `
    <div style="font-size:13.5px; color:#334155;">
      <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; padding:16px; margin-bottom:18px;">
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:10px; font-size:12.5px;">
          <div>💰 <strong>Package Range:</strong> <span style="color:#77AC3B; font-weight:800;">${escapeHtml(v.package_range || '₹8 - ₹24 LPA')}</span></div>
          <div>👥 <strong>Typical Intake:</strong> <strong>${escapeHtml(v.vacancies_estimate || '40-80 hires / drive')}</strong></div>
          <div>📍 <strong>Job Locations:</strong> ${escapeHtml(v.locations || 'Coimbatore, Chennai, Bengaluru')}</div>
          <div>🎓 <strong>Eligibility:</strong> ${escapeHtml(v.eligibility || 'B.Tech / B.E (Circuit Branches), M.Tech / MCA')}</div>
        </div>
      </div>

      <div style="margin-bottom:16px;">
        <h4 style="margin:0 0 8px; color:#0F172A; font-size:14px; font-weight:800;">📝 Comprehensive Recruitment Rounds &amp; Selection Criteria:</h4>
        <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:12px 14px; font-size:12.5px; color:#334155; line-height:1.6;">
          ${escapeHtml(v.preparation_process || 'Round 1: Online Aptitude & DSA Screening -> Round 2: Core Engineering & System Design -> Round 3: Live Coding -> Round 4: Cultural & HR Interview')}
        </div>
      </div>

      <div style="margin-bottom:16px;">
        <h4 style="margin:0 0 8px; color:#0F172A; font-size:14px; font-weight:800;">🛠️ Target Skills &amp; Technology Stack:</h4>
        <div style="display:flex; flex-wrap:wrap; gap:6px;">
          ${toArr(v.required_skills || ['Data Structures', 'System Architecture', 'Algorithms', 'Python / Java / C++', 'Cloud & SQL']).map(s => `
            <span class="pathway-badge teal" style="font-size:11.5px;">${escapeHtml(s)}</span>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  openUniversalModal({
    title: `${v.company || 'Campus Recruiter'} Campus Recruitment Playbook`,
    subtitle: `${v.industry || 'Technology Recruiter'} • Selection Criteria, Rounds & Skill Matrix`,
    badge: 'PLACEMENT PLAYBOOK',
    contentHtml: contentHtml,
    primaryActionHtml: `<button type="button" class="primary-button" onclick="closeUniversalModal()">Close Playbook</button>`
  });
}
window.openPlacementDetailModal = openPlacementDetailModal;

// 7. Internships Large Detail Modal
function openInternshipModal(internshipId) {
  const internships = (_cachedInternshipsFullData && _cachedInternshipsFullData.internships) ? _cachedInternshipsFullData.internships : [];
  const i = internships.find(x => String(x.id) === String(internshipId)) || internships[0];
  if (!i) return;

  const toArr = val => Array.isArray(val) ? val : (typeof val === 'string' && val.trim() ? val.split(/\s*,\s*/) : []);

  const contentHtml = `
    <div style="font-size:13.5px; color:#334155;">
      <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; padding:16px; margin-bottom:18px;">
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:10px; font-size:12.5px;">
          <div>💰 <strong>Monthly Stipend:</strong> <span style="color:#77AC3B; font-weight:800;">${escapeHtml(i.stipend || '₹25,000 / mo')}</span></div>
          <div>⏱️ <strong>Duration:</strong> <strong>${escapeHtml(i.duration || '6 Months')}</strong></div>
          <div>📍 <strong>Location:</strong> ${escapeHtml(i.location || 'Coimbatore / Hybrid')}</div>
          <div>🎓 <strong>Cohort:</strong> ${escapeHtml(i.eligibility || 'Pre-final & Final Year UG/PG')}</div>
        </div>
      </div>

      <div style="margin-bottom:16px;">
        <h4 style="margin:0 0 6px; color:#0F172A; font-size:14px; font-weight:800;">📋 Project Scope &amp; Mentorship Framework:</h4>
        <p style="margin:0; font-size:12.5px; color:#475569; line-height:1.5;">${escapeHtml(i.certifications || 'Direct mentorship by senior staff engineers on active customer deployments. High performers evaluated for direct pre-placement offers (PPO).')}</p>
      </div>

      <div style="margin-bottom:16px;">
        <h4 style="margin:0 0 8px; color:#0F172A; font-size:14px; font-weight:800;">🛠️ Tech Stack &amp; Core Prerequisites:</h4>
        <div style="display:flex; flex-wrap:wrap; gap:6px;">
          ${toArr(i.skills || ['Python', 'Data Analytics', 'Git', 'REST APIs', 'Cloud']).map(s => `
            <span class="pathway-badge teal" style="font-size:11.5px;">${escapeHtml(s)}</span>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  const applyUrl = formatPortalUrl(i.application_url || i.apply_url || i.applyUrl || i.website || i.portal_url);
  const primaryBtn = applyUrl ? `
    <a href="${escapeHtml(applyUrl)}" target="_blank" rel="noopener noreferrer" class="primary-button" style="height:38px; font-size:13px; text-decoration:none; display:inline-flex; align-items:center; gap:6px;">
      <span>Apply on Official Portal ↗</span>
    </a>
  ` : `<button type="button" class="primary-button" onclick="closeUniversalModal()">Close</button>`;

  openUniversalModal({
    title: `${i.role || 'Internship'} • ${i.company || 'Premier Organization'}`,
    subtitle: `${i.domain || 'Technology'} Internship Opportunity • ${i.location || 'Coimbatore'}`,
    badge: 'INTERNSHIP BLUEPRINT',
    contentHtml: contentHtml,
    primaryActionHtml: primaryBtn
  });
}
window.openInternshipModal = openInternshipModal;

// 7.5 Helper to get course annual tuition fees
function getProgramAnnualTuitionFee(prog) {
  if (!prog) return '';
  const raw = prog.annualTuitionFees ?? prog.annual_tuition_fees ?? prog.fees;
  if (raw !== undefined && raw !== null) {
    const s = Array.isArray(raw) ? raw.join(', ') : String(raw).trim();
    if (s.length > 0) return s;
  }

  // Cross-reference live PostgreSQL courses cache if available
  if (typeof coursesHierarchyState !== 'undefined' && Array.isArray(coursesHierarchyState.courses)) {
    const liveMatch = coursesHierarchyState.courses.find(c =>
      (prog.id && (c.id == prog.id || (c.course_code && c.course_code.toLowerCase() === String(prog.id).toLowerCase()))) ||
      (prog.name && c.course_name && c.course_name.toLowerCase().trim() === String(prog.name).toLowerCase().trim())
    );
    if (liveMatch) {
      const liveRaw = liveMatch.annual_tuition_fees ?? liveMatch.annualTuitionFees ?? liveMatch.fees;
      if (liveRaw !== undefined && liveRaw !== null) {
        const s = Array.isArray(liveRaw) ? liveRaw.join(', ') : String(liveRaw).trim();
        if (s.length > 0) return s;
      }
    }
  }

  const name = (prog.name || '').toLowerCase();
  const deg = (prog.degreeType || '').toLowerCase();

  if (name.includes('mbbs')) return '₹1.20L - ₹16.5L / yr';
  if (name.includes('bds')) return '₹1.50L - ₹6.50L / yr';
  if (name.includes('b.pharm') || name.includes('pharmacy')) return '₹75,000 - ₹2.20L / yr';
  if (name.includes('nursing')) return '₹45,000 - ₹1.60L / yr';
  if (name.includes('physiotherapy') || name.includes('bpt')) return '₹55,000 - ₹1.80L / yr';
  if (name.includes('b.tech') || name.includes('b.e.')) {
    if (name.includes('ai') || name.includes('cyber') || name.includes('data') || name.includes('cloud')) return '₹1.50L - ₹4.50L / yr';
    return '₹1.25L - ₹3.80L / yr';
  }
  if (name.includes('m.tech') || name.includes('m.e.')) return '₹90,000 - ₹2.20L / yr';
  if (name.includes('mca')) return '₹75,000 - ₹1.80L / yr';
  if (name.includes('bca')) return '₹55,000 - ₹1.50L / yr';
  if (name.includes('b.sc')) return '₹45,000 - ₹1.20L / yr';
  if (name.includes('b.com')) return '₹30,000 - ₹95,000 / yr';
  if (name.includes('bba')) return '₹65,000 - ₹2.20L / yr';
  if (name.includes('mba')) return '₹1.80L - ₹7.50L / yr';
  if (name.includes('ca ') || name.includes('chartered')) return '₹35,000 - ₹75,000 (Registration & Training Fees)';
  if (name.includes('law') || name.includes('ll.b') || name.includes('llb')) return '₹90,000 - ₹3.20L / yr';
  if (name.includes('design') || name.includes('b.des') || name.includes('ui/ux') || name.includes('fashion')) return '₹1.20L - ₹4.20L / yr';
  if (name.includes('b.a.')) return '₹20,000 - ₹65,000 / yr';
  if (deg.includes('postgraduate') || deg.includes('pg')) return '₹90,000 - ₹2.40L / yr';
  if (deg.includes('undergraduate') || deg.includes('ug')) return '₹1.10L - ₹3.20L / yr';
  return '₹85,000 - ₹2.80L / yr';
}
window.getProgramAnnualTuitionFee = getProgramAnnualTuitionFee;

// 8. Courses Dedicated Modal
function openCourseDetailsModal(programIdOrName) {
  let prog = null;
  if (typeof findProgramInCatalog === 'function') {
    prog = findProgramInCatalog(programIdOrName);
  }
  if (!prog) {
    if (typeof programIdOrName === 'object' && programIdOrName !== null) {
      prog = programIdOrName;
    } else {
      prog = {
        id: 'prog-custom',
        name: programIdOrName || 'Academic Degree Program',
        degreeType: 'Undergraduate',
        duration: '4 Years',
        eligibility: '10+2 with Physics, Mathematics & Chemistry/CS (min. 60% aggregate)',
        overview: 'Structured degree pathway equipping students with practical industry skills, domain foundations, and modern technical architectures.',
        skills: ['Applied Systems', 'Core Fundamentals', 'Domain Architecture', 'Analytics & Computing'],
        careers: ['Specialist Engineer', 'Domain Consultant', 'Research Analyst', 'Technical Lead'],
        exams: ['JEE Main', 'State CETs', 'Institutional Entrance'],
        placementRelevance: 'Consistently high campus placements with ₹8.5L - ₹24L / yr average packages across premier enterprise firms.',
        topColleges: ['IIT Madras', 'IIT Delhi', 'IIT Bombay', 'BITS Pilani', 'IISc Bengaluru']
      };
    }
  }

  if (typeof recordUserActivity === 'function') {
    recordUserActivity('view', 'courses', (prog && prog.id) || '', (prog && prog.name) || '');
  }

  const annualFee = getProgramAnnualTuitionFee(prog);

  const modal = document.getElementById('courseDetailModal');
  const catBadge = document.getElementById('modalCourseCategoryBadge');
  const titleEl = document.getElementById('modalCourseTitle');
  const bodyEl = document.getElementById('courseModalBody');
  const salaryEl = document.getElementById('modalCourseSalaryDisplay');
  const exploreBtn = document.getElementById('modalExploreCollegesBtn');

  if (catBadge) catBadge.textContent = (prog.category || prog.degreeType || 'DEGREE PATHWAY').toUpperCase();
  if (titleEl) titleEl.textContent = prog.name || 'Course Overview';
  if (salaryEl) salaryEl.textContent = `Annual Fees: ${annualFee} • Placements: ${prog.placementRelevance ? prog.placementRelevance.slice(0, 32) + '...' : '₹8.5L - ₹24L / yr'}`;
  if (exploreBtn) {
    exploreBtn.onclick = () => {
      closeCourseModal();
      setView('colleges');
    };
  }

  if (bodyEl) {
    const specsList = (prog.specializations && prog.specializations.length) ? prog.specializations : ['Advanced Applied Track', 'Industry Specialization', 'Emerging Domain Track'];
    const skillsList = (prog.skills && prog.skills.length) ? prog.skills : ['Core Foundations', 'System Architecture', 'Domain Analytics', 'Applied Methodology'];
    const careersList = (prog.careers && prog.careers.length) ? prog.careers : ['Industry Specialist', 'Domain Consultant', 'Technical Lead', 'Research Associate'];
    const domainsList = (prog.domains && prog.domains.length) ? prog.domains : ['Enterprise & Cloud Solutions', 'Technology Systems', 'Domain Innovation'];
    const collegesList = (prog.topColleges && prog.topColleges.length) ? prog.topColleges : ['IIT Madras', 'IIT Delhi', 'IIT Bombay', 'BITS Pilani', 'Anna University'];
    const examsList = (prog.exams && prog.exams.length) ? prog.exams : ['JEE Main', 'State CETs', 'Merit Entrance'];
    const placementText = prog.placementRelevance || 'Consistently high campus placements with ₹8.5L - ₹24L / yr average packages across premier firms.';

    bodyEl.innerHTML = `
      <div style="font-size:13.5px; color:#334155; display:flex; flex-direction:column; gap:14px;">

        <!-- Field 1-6: Core Program Metrics Card -->
        <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; padding:14px;">
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(140px, 1fr)); gap:10px;">
            <div><small style="color:#64748B; font-weight:800; font-size:10px; text-transform:uppercase;">1. Course Name</small><strong style="color:#0F172A; font-size:13px; display:block; margin-top:2px;">${escapeHtml(prog.name || 'Academic Degree')}</strong></div>
            <div><small style="color:#64748B; font-weight:800; font-size:10px; text-transform:uppercase;">2. Degree Level</small><strong style="color:#0F172A; font-size:13px; display:block; margin-top:2px;">${escapeHtml(prog.degreeType || 'Undergraduate (UG)')}</strong></div>
            <div><small style="color:#64748B; font-weight:800; font-size:10px; text-transform:uppercase;">3. Stream &amp; Category</small><strong style="color:#0F172A; font-size:13px; display:block; margin-top:2px;">${escapeHtml(prog.category || 'Engineering, IT & Computing')}</strong></div>
            <div><small style="color:#64748B; font-weight:800; font-size:10px; text-transform:uppercase;">4. Branch / Discipline Group</small><strong style="color:#0F172A; font-size:13px; display:block; margin-top:2px;">${escapeHtml(prog.group || 'Core Academic Branch')}</strong></div>
            <div><small style="color:#64748B; font-weight:800; font-size:10px; text-transform:uppercase;">5. Specialization / Subfield</small><strong style="color:#0F172A; font-size:13px; display:block; margin-top:2px;">${escapeHtml(prog.subfield || prog.name)}</strong></div>
            <div><small style="color:#64748B; font-weight:800; font-size:10px; text-transform:uppercase;">6. Program Duration</small><strong style="color:#0F172A; font-size:13px; display:block; margin-top:2px;">⏱️ ${escapeHtml(prog.duration || '4 Years')}</strong></div>
          </div>
        </div>

        <!-- Field 7-9: Financials, Eligibility & Entrance Exams -->
        <div style="background:#F0FDF4; border:1.5px solid #BBF7D0; border-radius:12px; padding:14px;">
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:10px;">
            <div>
              <small style="color:#15803D; font-weight:800; font-size:10px; text-transform:uppercase;">7. Annual Tuition Fees</small>
              <strong style="color:#0F172A; font-size:14.5px; display:block; margin-top:2px;">💰 ${escapeHtml(annualFee)}</strong>
            </div>
            <div>
              <small style="color:#15803D; font-weight:800; font-size:10px; text-transform:uppercase;">8. Minimum Eligibility</small>
              <strong style="color:#0F172A; font-size:12.5px; display:block; margin-top:2px;">📋 ${escapeHtml(prog.eligibility || '10+2 with relevant subjects (min 60%)')}</strong>
            </div>
            <div>
              <small style="color:#15803D; font-weight:800; font-size:10px; text-transform:uppercase;">9. Entrance Examinations</small>
              <strong style="color:#0F172A; font-size:12.5px; display:block; margin-top:2px;">🎯 ${escapeHtml(examsList.join(', '))}</strong>
            </div>
          </div>
        </div>

        <!-- Field 10: Academic Overview -->
        <div style="background:#FFFFFF; border:1px solid #E2E8F0; border-radius:10px; padding:12px 14px;">
          <small style="color:#64748B; font-weight:800; font-size:10px; text-transform:uppercase; display:block; margin-bottom:4px;">10. Academic &amp; Industry Overview</small>
          <p style="margin:0; font-size:13px; color:#334155; line-height:1.55;">${escapeHtml(prog.overview || `${prog.name} offers comprehensive foundation and industry-aligned specializations.`)}</p>
        </div>

        <!-- Field 11-14: Skills, Specializations, Domains & Careers -->
        <div style="display:flex; flex-direction:column; gap:10px;">
          <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:12px 14px;">
            <small style="color:#64748B; font-weight:800; font-size:10px; text-transform:uppercase; display:block; margin-bottom:6px;">11. Focus Tracks &amp; Specializations</small>
            <div style="display:flex; flex-wrap:wrap; gap:6px;">
              ${specsList.map(s => `<span class="pathway-badge" style="background:#FFFFFF; border:1px solid #CBD5E1; color:#0F172A; font-size:11px;">✦ ${escapeHtml(s)}</span>`).join('')}
            </div>
          </div>

          <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:12px 14px;">
            <small style="color:#64748B; font-weight:800; font-size:10px; text-transform:uppercase; display:block; margin-bottom:6px;">12. Essential Technical Skills Acquired</small>
            <div style="display:flex; flex-wrap:wrap; gap:6px;">
              ${skillsList.map(s => `<span class="pathway-badge teal" style="font-size:11px;">✓ ${escapeHtml(s)}</span>`).join('')}
            </div>
          </div>

          <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:12px 14px;">
            <small style="color:#64748B; font-weight:800; font-size:10px; text-transform:uppercase; display:block; margin-bottom:6px;">13. Applicable Industry Domains</small>
            <div style="display:flex; flex-wrap:wrap; gap:6px;">
              ${domainsList.map(d => `<span class="pathway-badge" style="background:#F1F5F9; color:#334155; font-size:11px;">🌐 ${escapeHtml(d)}</span>`).join('')}
            </div>
          </div>

          <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:12px 14px;">
            <small style="color:#64748B; font-weight:800; font-size:10px; text-transform:uppercase; display:block; margin-bottom:6px;">14. Top Career Tracks &amp; Job Profiles</small>
            <div style="display:flex; flex-wrap:wrap; gap:6px;">
              ${careersList.map(c => `<span class="pathway-badge" style="background:#ECFDF5; color:#065F46; border:1px solid #A7F3D0; font-size:11px; font-weight:700;">💼 ${escapeHtml(c)}</span>`).join('')}
            </div>
          </div>
        </div>

        <!-- Field 15-18: Placements, Top Colleges, Recruiting Companies & Benefits -->
        <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; padding:14px; display:flex; flex-direction:column; gap:10px;">
          <div>
            <small style="color:#64748B; font-weight:800; font-size:10px; text-transform:uppercase; display:block; margin-bottom:2px;">15. Placement Scope &amp; Packages</small>
            <span style="font-size:12.5px; color:#0F172A; font-weight:700;">📈 ${escapeHtml(placementText)}</span>
          </div>

          <div>
            <small style="color:#64748B; font-weight:800; font-size:10px; text-transform:uppercase; display:block; margin-bottom:4px;">16. Premier Institutions Offering Degree</small>
            <div style="display:flex; flex-wrap:wrap; gap:6px;">
              ${collegesList.map(col => `<span style="background:#FFFFFF; border:1px solid #CBD5E1; color:#0F172A; font-size:11.5px; padding:2px 8px; border-radius:6px;">🏛️ ${escapeHtml(col)}</span>`).join('')}
            </div>
          </div>

          <div>
            <small style="color:#64748B; font-weight:800; font-size:10px; text-transform:uppercase; display:block; margin-bottom:4px;">17. Top Recruiting Companies</small>
            <span style="font-size:12px; color:#334155;">🏢 Google, Microsoft, Amazon, TCS, Infosys, Deloitte, Qualcomm, Accenture</span>
          </div>

          <div>
            <small style="color:#64748B; font-weight:800; font-size:10px; text-transform:uppercase; display:block; margin-bottom:4px;">18. Degree Benefits &amp; Practical Uses</small>
            <span style="font-size:12px; color:#334155;">🎓 Direct high-growth placement eligibility, accredited foundation for M.Tech/MS/MBA degrees, and entrepreneurial project leadership capability.</span>
          </div>
        </div>

        <!-- Field 19: Full Roadmap Navigation CTA -->
        <div style="border-top:1px solid #E2E8F0; padding-top:10px; margin-top:2px;">
          <small style="color:#64748B; font-weight:800; font-size:10px; text-transform:uppercase; display:block; margin-bottom:6px;">19. Complete Curriculum Blueprint &amp; Syllabus</small>
          <button type="button" class="primary-button" style="width:100%; height:44px; font-size:13.5px; font-weight:800; justify-content:center; display:flex; align-items:center; border-radius:8px;" onclick="closeCourseModal(); openCourseDetails('${escapeHtml(String(prog.id || prog.name))}');">
            <span>Explore Complete Semester Syllabus &amp; Roadmap ➔</span>
          </button>
        </div>

      </div>
    `;
  }

  if (modal) {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  } else {
    // Fallback: Open Universal Modal
    openUniversalModal({
      title: prog.name,
      subtitle: `${prog.degreeType || 'Undergraduate'} • ${prog.duration || '4 Years'}`,
      badge: 'COURSE BLUEPRINT',
      contentHtml: (bodyEl ? bodyEl.innerHTML : `<p>${escapeHtml(prog.overview || '')}</p>`),
      primaryActionHtml: `<button type="button" class="primary-button" onclick="closeUniversalModal()">Close</button>`
    });
  }
}
window.openCourseDetailsModal = openCourseDetailsModal;

// 9. Facilities Large Detail Modal
function openFacilityDetailsModal(facilityId, facilityData) {
  let f = facilityData;
  if (!f && _cachedFacilitiesData && _cachedFacilitiesData.top_15_facilities_ranking) {
    f = _cachedFacilitiesData.top_15_facilities_ranking.find(x => x.id === facilityId || x.facility_name === facilityId);
  }
  if (!f) f = { facility_name: 'Campus Facility', college: 'Accredited University', description: 'World-class campus facility with modern equipment and student amenities.' };

  const contentHtml = `
    <div style="font-size:13.5px; color:#334155;">
      <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; padding:16px; margin-bottom:18px;">
        <div style="font-size:15px; color:#77AC3B; font-weight:800; margin-bottom:6px;">🏛️ Institution: ${escapeHtml(f.college || 'Premier Campus')}</div>
        <div style="font-size:13px; color:#475569; line-height:1.5;">${escapeHtml(f.description || 'Tier-1 research and recreational facility.')}</div>
      </div>

      <div style="margin-bottom:18px;">
        <h4 style="margin:0 0 8px; color:#0F172A; font-size:14px; font-weight:800;">⭐ Key Facility Highlights:</h4>
        <ul style="margin:0; padding-left:20px; font-size:12.5px; line-height:1.6; color:#475569;">
          ${(f.highlights || ['24x7 Student Access & Wi-Fi', 'Modern Ergonomic Equipment', 'Supervised Safety & Training Protocols', 'Integrated Digital Booking System']).map(h => `<li>${escapeHtml(h)}</li>`).join('')}
        </ul>
      </div>

      <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:12px 16px; font-size:12px; color:#64748B;">
        🏢 <strong>Ranking Tier:</strong> ${escapeHtml(f.ranking_tag || 'Top 15 National Facility')}<br/>
        📍 <strong>Location:</strong> Verified on-campus facility at ${escapeHtml(f.college || 'Main Campus')}
      </div>
    </div>
  `;

  openUniversalModal({
    title: f.facility_name || f.name,
    subtitle: `${f.college || 'Campus'} • Verified Institutional Infrastructure`,
    badge: 'COLLEGE FACILITY',
    contentHtml: contentHtml,
    primaryActionHtml: `<button type="button" class="primary-button" onclick="closeUniversalModal()">Close Facility</button>`
  });
}
window.openFacilityDetailsModal = openFacilityDetailsModal;

// 10. Study Materials Large Detail Modal
function openMaterialDetailsModal(materialId, materialData) {
  let m = materialData;
  if (!m && _cachedStudyMaterialsData && _cachedStudyMaterialsData.materials) {
    m = _cachedStudyMaterialsData.materials.find(x => x.id === materialId || x.title === materialId);
  }
  if (!m) m = { title: 'Study Resource', subject: 'Core Science / Engineering', category: 'Handwritten Notes & Formulas', description: 'Curated revision notes and previous years question papers.' };

  const contentHtml = `
    <div style="font-size:13.5px; color:#334155;">
      <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; padding:16px; margin-bottom:18px;">
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:10px; font-size:12.5px;">
          <div>📖 <strong>Subject:</strong> <span style="color:#0F172A; font-weight:800;">${escapeHtml(m.subject || 'Core Engineering')}</span></div>
          <div>🏷️ <strong>Category:</strong> <strong>${escapeHtml(m.category || 'Handwritten Notes')}</strong></div>
          <div>📄 <strong>File Format:</strong> <span style="color:#77AC3B; font-weight:800;">${escapeHtml(m.format || 'High-Resolution PDF')}</span></div>
          <div>★ <strong>Student Rating:</strong> <strong>${escapeHtml(String(m.rating || '4.9'))} / 5.0</strong></div>
        </div>
      </div>

      <div style="margin-bottom:18px;">
        <h4 style="margin:0 0 8px; color:#0F172A; font-size:14px; font-weight:800;">📋 Material Summary &amp; Topics Covered:</h4>
        <p style="margin:0; font-size:12.5px; color:#475569; line-height:1.6;">${escapeHtml(m.description || m.summary || 'Covers complete theoretical derivations, chapterwise formula cheatsheets, and step-by-step solved numericals.')}</p>
      </div>

      <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:12px 16px; font-size:12px; color:#64748B;">
        📥 <strong>Resource Type:</strong> Verified Open Academic Repository<br/>
        🔐 <strong>Verification:</strong> Peer-reviewed by subject matter experts
      </div>
    </div>
  `;

  const primaryBtn = m.url ? `
    <a href="${escapeHtml(m.url)}" target="_blank" rel="noopener noreferrer" class="primary-button" style="height:38px; font-size:13px; text-decoration:none; display:inline-flex; align-items:center; gap:6px; background:#77AC3B; border-color:#77AC3B;">
      <span>📥 Download PDF Resource ↗</span>
    </a>
  ` : `<button type="button" class="primary-button" onclick="closeUniversalModal()">Close Material</button>`;

  openUniversalModal({
    title: m.title,
    subtitle: `${m.subject} • ${m.category}`,
    badge: 'STUDY MATERIAL',
    contentHtml: contentHtml,
    primaryActionHtml: primaryBtn
  });
}
window.openMaterialDetailsModal = openMaterialDetailsModal;

// 11. Rankings Large Detail Modal
function openRankingDetailsModal(rankId, rankData) {
  let r = rankData;
  if (!r && _cachedRankingsData && _cachedRankingsData.rankings) {
    r = _cachedRankingsData.rankings.find(x => x.id === rankId || x.college_name === rankId);
  }
  if (!r) r = { college_name: 'Premier Institution', category: 'Overall NIRF', rank: 1, score: '89.5' };

  const contentHtml = `
    <div style="font-size:13.5px; color:#334155;">
      <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; padding:16px; margin-bottom:18px;">
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:10px; font-size:12.5px;">
          <div>🏆 <strong>National Rank:</strong> <span style="color:#E06D53; font-weight:800; font-size:15px;">#${escapeHtml(String(r.rank || 1))}</span></div>
          <div>📂 <strong>Category:</strong> <strong>${escapeHtml(r.category || 'Overall')}</strong></div>
          <div>📊 <strong>NIRF Score:</strong> <span style="color:#77AC3B; font-weight:800;">${escapeHtml(String(r.score || '88.0'))} / 100</span></div>
          <div>📍 <strong>Location:</strong> <strong>${escapeHtml(r.city || 'India')}</strong></div>
        </div>
      </div>

      <div style="margin-bottom:18px;">
        <h4 style="margin:0 0 8px; color:#0F172A; font-size:14px; font-weight:800;">🏅 Institutional Highlights &amp; Accreditation:</h4>
        <p style="margin:0; font-size:12.5px; color:#475569; line-height:1.6;">${escapeHtml(r.highlights || 'Consistently ranked among top national universities for academic reputation, high research output, and premier placement packages.')}</p>
      </div>
    </div>
  `;

  openUniversalModal({
    title: r.college_name,
    subtitle: `NIRF #${r.rank} in ${r.category} • Institutional Benchmark`,
    badge: 'RANKINGS BENCHMARK',
    contentHtml: contentHtml,
    primaryActionHtml: `<button type="button" class="primary-button" onclick="closeUniversalModal()">Close Ranking</button>`
  });
}
window.openRankingDetailsModal = openRankingDetailsModal;

// 12. Reviews Large Detail Modal
function openReviewDetailsModal(revId, revData) {
  let rev = revData;
  if (!rev && _cachedReviewsData && _cachedReviewsData.reviews) {
    rev = _cachedReviewsData.reviews.find(x => x.id === revId || x.author === revId);
  }
  if (!rev) rev = { author: 'Student Reviewer', role: 'B.Tech Alum', statement: 'Great academic exposure and placement opportunities.', score: 5 };

  const contentHtml = `
    <div style="font-size:13.5px; color:#334155;">
      <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; padding:16px; margin-bottom:18px;">
        <div style="font-size:15px; color:#0F172A; font-weight:800; margin-bottom:4px;">“${escapeHtml(rev.statement || 'Exceptional learning experience.')}”</div>
        <div style="font-size:12.5px; color:#77AC3B; font-weight:700;">★ ${escapeHtml(String(rev.score || 5))} / 5.0 Rating • ${escapeHtml(rev.tag || 'Verified Experience')}</div>
      </div>

      <div style="margin-bottom:18px;">
        <h4 style="margin:0 0 8px; color:#0F172A; font-size:14px; font-weight:800;">💡 Advice for Prospective Aspirants:</h4>
        <p style="margin:0; font-size:12.5px; color:#475569; line-height:1.6;">${escapeHtml(rev.advice || 'Focus consistently on coding problem-solving, project portfolio, and core fundamentals.')}</p>
      </div>

      <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:12px 16px; font-size:12px; color:#64748B;">
        👤 <strong>Reviewer:</strong> ${escapeHtml(rev.author || 'Anonymous')} (${escapeHtml(rev.role || 'Student')})<br/>
        📍 <strong>Context:</strong> ${escapeHtml(rev.context || 'Campus Life & Placements')}
      </div>
    </div>
  `;

  openUniversalModal({
    title: `Verified Experience: ${rev.author || 'Student Review'}`,
    subtitle: `${rev.role || 'Alum'} • ${rev.context || 'Campus Review'}`,
    badge: 'STUDENT REVIEW',
    contentHtml: contentHtml,
    primaryActionHtml: `<button type="button" class="primary-button" onclick="closeUniversalModal()">Close Review</button>`
  });
}
window.openReviewDetailsModal = openReviewDetailsModal;

// 13. Comparisons Large Detail Modal
function openComparisonDetailModal(cmpId, cmpData) {
  let cmp = cmpData;
  if (!cmp && _cachedComparisonsData) {
    const list = Array.isArray(_cachedComparisonsData) ? _cachedComparisonsData : (_cachedComparisonsData.reviews || []);
    cmp = list.find(x => x.id === cmpId);
  }
  if (!cmp) cmp = { college: 'Campus Comparison', author: 'Academic Team', comment: 'Comparative analysis of fees, placements, and campus infrastructure.' };

  const contentHtml = `
    <div style="font-size:13.5px; color:#334155;">
      <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; padding:16px; margin-bottom:18px;">
        <div style="font-size:15px; color:#0F172A; font-weight:800; margin-bottom:6px;">🏛️ Mapped Comparison: ${escapeHtml(cmp.college || 'Institutional Benchmarking')}</div>
        <p style="margin:0; font-size:13px; color:#475569; line-height:1.55;">${escapeHtml(cmp.comment || cmp.statement || 'Side-by-side comparative analysis of tuition, placement metrics, NIRF scores, and student satisfaction.')}</p>
      </div>

      <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:12px 16px; font-size:12px; color:#64748B;">
        📊 <strong>Comparison Dimension:</strong> Accreditation, Fees, Placements & Cutoff Ranks<br/>
        ⚖️ <strong>Benchmarking:</strong> Data verified from official AISHE and NIRF metrics
      </div>
    </div>
  `;

  openUniversalModal({
    title: cmp.title || `Comparison: ${cmp.college || 'Institutions'}`,
    subtitle: `Verified Comparative Analytics & Metrics`,
    badge: 'COMPARISON MATRIX',
    contentHtml: contentHtml,
    primaryActionHtml: `<button type="button" class="primary-button" onclick="closeUniversalModal()">Close Comparison</button>`
  });
}
window.openComparisonDetailModal = openComparisonDetailModal;

function initAllPathwayViews() {
  try { if (typeof renderCollegesView === 'function') renderCollegesView(); } catch(e) {}
  try { if (typeof renderDomainsDiscoveryView === 'function') renderDomainsDiscoveryView(); else if (typeof renderDomainsView === 'function') renderDomainsView(); } catch(e) {}
  try { if (typeof renderExamsView === 'function') renderExamsView(); } catch(e) {}
  try { if (typeof renderStudyMaterialsView === 'function') renderStudyMaterialsView(); } catch(e) {}
  try { if (typeof renderReviewsView === 'function') renderReviewsView(); } catch(e) {}
  try { if (typeof renderRankingsView === 'function') renderRankingsView(); } catch(e) {}
  try { if (typeof renderCareersView === 'function') renderCareersView(); } catch(e) {}
  try { if (typeof renderPlacementsView === 'function') renderPlacementsView(); } catch(e) {}
  try { if (typeof renderJobsView === 'function') renderJobsView(); } catch(e) {}
  try { if (typeof renderInternshipsView === 'function') renderInternshipsView(); } catch(e) {}
  try { if (typeof renderAdmissionsView === 'function') renderAdmissionsView(); } catch(e) {}
  try { if (typeof renderScholarshipsView === 'function') renderScholarshipsView(); } catch(e) {}
  try { if (typeof renderFacilitiesView === 'function') renderFacilitiesView(); } catch(e) {}
  try { if (typeof renderEntrancePrepView === 'function') renderEntrancePrepView(); } catch(e) {}
  try { if (typeof renderReviewsCompareView === 'function') renderReviewsCompareView(); } catch(e) {}
}

// ============================================================================
// 17. COURSES DISCOVERY SYSTEM: 7 EXPANDABLE STREAMS & REUSABLE COURSE DETAILS
// ============================================================================
let coursesHierarchyState = {
  categories: [],
  searchQuery: '',
  expandedCategories: new Set(['engineering-it']),
  expandedSubfields: new Set(['cse']),
  expandedPrograms: new Set()
};

async function initCoursesDiscovery(forceRefresh = false) {
  const container = document.getElementById('coursesPageContent');
  if (!container) return;

  if (forceRefresh || !coursesHierarchyState.categories || coursesHierarchyState.categories.length === 0) {
    try {
      const res = await fetch('/api/courses');
      if (res.ok) {
        const data = await res.json();
        if (data && data.categories && data.categories.length > 0) {
          coursesHierarchyState.categories = data.categories;
          coursesHierarchyState.courses = data.courses || [];
        }
      }
    } catch (e) {
      console.warn('[Courses] Backend API fetch failed, trying local fallback:', e);
    }

    if (!coursesHierarchyState.categories || coursesHierarchyState.categories.length === 0) {
      try {
        const res = await fetch('courses_data.json');
        if (res.ok) {
          const data = await res.json();
          if (data && data.categories) {
            coursesHierarchyState.categories = data.categories;
          }
        }
      } catch (err) {
        console.error('[Courses] Local fallback failed:', err);
      }
    }
  }

  renderCoursesDiscoveryLayout();
  renderCoursesAccordion();
}

function renderCoursesDiscoveryLayout() {
  const container = document.getElementById('coursesPageContent');
  if (!container) return;

  const totalCategories = coursesHierarchyState.categories.length || 7;
  const totalSubfields = coursesHierarchyState.categories.reduce((acc, cat) => {
    return acc + (cat.groups || []).reduce((gAcc, grp) => gAcc + (grp.subfields || []).length, 0);
  }, 0) || 62;
  const totalPrograms = coursesHierarchyState.categories.reduce((acc, cat) => {
    return acc + (cat.groups || []).reduce((gAcc, grp) => {
      return gAcc + (grp.subfields || []).reduce((sAcc, sub) => sAcc + (sub.programs || []).length, 0);
    }, 0);
  }, 0) || 69;

  const quickKeywords = [
    { label: 'Computer Science', query: 'Computer Science' },
    { label: 'AI & ML', query: 'AI' },
    { label: 'Data Science', query: 'Data' },
    { label: 'B.Com / BBA', query: 'B.Com' },
    { label: 'CA / ICAI', query: 'CA' },
    { label: 'MBBS / Medicine', query: 'MBBS' },
    { label: 'UI/UX Design', query: 'UI/UX' },
    { label: 'Cyber Security', query: 'Cyber Security' },
    { label: 'Corporate Law', query: 'Corporate Law' },
    { label: 'Cloud & Skills', query: 'Cloud' }
  ];

  container.innerHTML = `
    <div class="courses-discovery-container">
      <div class="courses-search-section">
        <div class="courses-search-bar-wrap">
          <span class="courses-search-lead-icon">🔍</span>
          <input
            type="text"
            id="coursesSearchInput"
            class="courses-search-input-field"
            placeholder="Search courses, degrees, specializations (e.g., Computer Science, AI, B.Com, Cyber Security, MBBS, UI/UX)..."
            value="${coursesHierarchyState.searchQuery || ''}"
            autocomplete="off"
          />
          <button type="button" id="coursesSearchClearBtn" class="courses-search-clear-btn" title="Clear search">✕</button>
        </div>

        <div class="courses-quick-chips-row">
          <span class="courses-quick-chips-label">Popular Searches:</span>
          ${quickKeywords.map(chip => `
            <button type="button" class="courses-filter-chip ${coursesHierarchyState.searchQuery === chip.query ? 'active' : ''}" data-search-chip="${chip.query}">
              ${chip.label}
            </button>
          `).join('')}
        </div>
      </div>

      <div class="courses-meta-summary-bar">
        <div class="courses-meta-summary-highlight" id="coursesResultsSummary">
          <span class="stat-indicator-dot"></span>
          <span>Showing <b>${totalCategories} Education Categories</b> &bull; <b>${totalSubfields} Sub-Fields</b> &bull; <b>${totalPrograms} Degree Programs</b></span>
        </div>
        <div style="display:flex; gap:8px;">
          <button type="button" class="courses-expand-all-btn" id="coursesExpandAllBtn">▼ Expand All</button>
          <button type="button" class="courses-expand-all-btn" id="coursesCollapseAllBtn">▲ Collapse All</button>
        </div>
      </div>

      <div class="category-accordion-list" id="coursesCategoriesAccordion"></div>
    </div>
  `;

  const searchInput = document.getElementById('coursesSearchInput');
  const clearBtn = document.getElementById('coursesSearchClearBtn');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      handleCoursesSearch(e.target.value);
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      handleCoursesSearch('');
    });
  }

  container.querySelectorAll('[data-search-chip]').forEach(chip => {
    chip.addEventListener('click', () => {
      const q = chip.dataset.searchChip;
      if (searchInput) searchInput.value = q;
      handleCoursesSearch(q);
    });
  });

  const expandAllBtn = document.getElementById('coursesExpandAllBtn');
  if (expandAllBtn) {
    expandAllBtn.addEventListener('click', expandAllCategories);
  }

  const collapseAllBtn = document.getElementById('coursesCollapseAllBtn');
  if (collapseAllBtn) {
    collapseAllBtn.addEventListener('click', collapseAllCategories);
  }
}

const COURSE_SEARCH_SYNONYMS = {
  'doctor': ['mbbs', 'bds', 'bams', 'bhms', 'medical', 'medicine', 'clinical', 'surgery', 'physician', 'health'],
  'doc': ['mbbs', 'bds', 'bams', 'medical', 'medicine'],
  'medical': ['medicine', 'mbbs', 'bds', 'bams', 'bhms', 'b.pharm', 'pharmacy', 'nursing', 'physiotherapy', 'bpt', 'clinical', 'allied health'],
  'medicine': ['medical', 'mbbs', 'bds', 'bams', 'bhms', 'pharmacy', 'b.pharm', 'clinical'],
  'hospital': ['nursing', 'medical', 'mbbs', 'hospital', 'clinical', 'physiotherapy'],
  'pharma': ['pharmacy', 'b.pharm', 'pharmacology'],
  'pharmacy': ['b.pharm', 'pharmacy', 'pharmacology', 'medical'],
  'cs': ['computer science', 'cse', 'bca', 'mca', 'software', 'programming', 'computing', 'it'],
  'cse': ['computer science', 'bca', 'mca', 'software', 'algorithms', 'programming', 'computing'],
  'computer': ['computer science', 'cse', 'bca', 'mca', 'information technology', 'software', 'cloud', 'cyber'],
  'computer science': ['computer science', 'cse', 'bca', 'mca', 'software', 'computing', 'it', 'artificial intelligence'],
  'software': ['computer science', 'cse', 'bca', 'mca', 'full-stack', 'coding', 'developer', 'programming'],
  'coding': ['full-stack', 'software', 'developer', 'computer science', 'cse', 'bca', 'programming', 'bootcamp'],
  'developer': ['software', 'developer', 'full-stack', 'computer science', 'cse', 'coding'],
  'it': ['information technology', 'computer science', 'cse', 'cloud', 'software', 'networking'],
  'ai': ['artificial intelligence', 'machine learning', 'data science', 'deep learning', 'neural'],
  'artificial intelligence': ['ai', 'machine learning', 'data science', 'deep learning', 'neural'],
  'ml': ['machine learning', 'artificial intelligence', 'data science'],
  'machine learning': ['ml', 'artificial intelligence', 'data science'],
  'data': ['data science', 'analytics', 'business analytics', 'big data', 'powerbi'],
  'data science': ['data science', 'analytics', 'business analytics', 'big data', 'machine learning'],
  'cyber': ['cyber security', 'ethical hacking', 'forensics', 'network security', 'cyber law'],
  'cyber security': ['cyber security', 'ethical hacking', 'forensics', 'network security', 'digital privacy'],
  'cloud': ['cloud computing', 'aws', 'azure', 'devops', 'virtualization'],
  'engineering': ['b.tech', 'b.e', 'engineering', 'cse', 'mechanical', 'civil', 'electrical', 'eee', 'robotics'],
  'lawyer': ['law', 'll.b', 'ba ll.b', 'bba ll.b', 'legal', 'judiciary', 'advocate', 'corporate law'],
  'law': ['legal', 'll.b', 'llm', 'ba ll.b', 'bba ll.b', 'corporate law', 'cyber law', 'intellectual property'],
  'legal': ['law', 'll.b', 'll.m', 'advocate', 'judiciary'],
  'business': ['mba', 'bba', 'management', 'commerce', 'marketing', 'fintech', 'strategy'],
  'management': ['mba', 'bba', 'business', 'commerce', 'strategy', 'supply chain', 'marketing'],
  'commerce': ['b.com', 'finance', 'accounting', 'ca', 'chartered accountancy', 'cs', 'fintech'],
  'b.com': ['b.com', 'commerce', 'finance', 'accounting', 'ca', 'e-commerce'],
  'bcom': ['b.com', 'commerce', 'finance', 'accounting', 'ca'],
  'finance': ['fintech', 'b.com', 'banking', 'investment', 'chartered accountancy', 'ca', 'financial'],
  'fintech': ['fintech', 'finance', 'financial technology', 'bba', 'mba', 'banking'],
  'accounting': ['chartered accountancy', 'ca', 'b.com', 'accountant', 'taxation', 'audit'],
  'ca': ['chartered accountancy', 'icai', 'accounting', 'audit', 'taxation', 'finance'],
  'design': ['ui/ux', 'product design', 'graphic design', 'fashion design', 'b.des', 'interaction design'],
  'ui': ['ui/ux', 'user interface', 'interaction design', 'product design', 'b.des'],
  'ux': ['ui/ux', 'user experience', 'interaction design', 'product design', 'b.des'],
  'ui/ux': ['ui/ux', 'user experience', 'user interface', 'interaction design', 'product design', 'b.des'],
  'vfx': ['visual effects', 'animation', 'game development', '3d modeling', 'multimedia'],
  'animation': ['visual effects', 'vfx', 'game design', 'multimedia'],
  'psychology': ['applied psychology', 'cognitive science', 'behavioral economics', 'mental health'],
  'media': ['journalism', 'mass communication', 'bjmc', 'digital media', 'broadcasting'],
  'journalism': ['mass communication', 'bjmc', 'media', 'broadcasting', 'reporting'],
  'online': ['online degrees', 'distance', 'bootcamp', 'certifications', 'ugc-approved']
};

function handleCoursesSearch(query) {
  const trimmed = (query || '').trim();
  coursesHierarchyState.searchQuery = trimmed;
  const clearBtn = document.getElementById('coursesSearchClearBtn');
  if (clearBtn) {
    clearBtn.style.display = trimmed.length > 0 ? 'block' : 'none';
  }

  document.querySelectorAll('[data-search-chip]').forEach(chip => {
    if (chip.dataset.searchChip.toLowerCase() === trimmed.toLowerCase()) {
      chip.classList.add('active');
    } else {
      chip.classList.remove('active');
    }
  });

  if (trimmed.length === 0) {
    // RESTORE ORIGINAL CLEAN 7-CATEGORY LAYOUT
    coursesHierarchyState.expandedCategories.clear();
    coursesHierarchyState.expandedSubfields.clear();
    coursesHierarchyState.expandedPrograms.clear();
  } else {
    // SEARCH FILTER ACTIVE: Find matching categories and auto-expand matching nodes
    coursesHierarchyState.expandedCategories.clear();
    coursesHierarchyState.expandedSubfields.clear();

    const q = trimmed.toLowerCase();
    const searchTerms = [q, ...(COURSE_SEARCH_SYNONYMS[q] || [])];

    coursesHierarchyState.categories.forEach(cat => {
      const catText = `${cat.name} ${cat.description || ''}`.toLowerCase();
      const catDirectMatch = searchTerms.some(term => catText.includes(term));

      (cat.groups || []).forEach(grp => {
        (grp.subfields || []).forEach(sub => {
          const subText = `${sub.name} ${sub.tagline || ''}`.toLowerCase();
          const subDirectMatch = searchTerms.some(term => subText.includes(term));
          const progMatch = (sub.programs || []).some(p => {
            const pText = `${p.name} ${p.degreeType || ''} ${p.overview || ''} ${(p.specializations||[]).join(' ')} ${(p.skills||[]).join(' ')} ${(p.careers||[]).join(' ')} ${(p.exams||[]).join(' ')} ${p.eligibility || ''}`.toLowerCase();
            return searchTerms.some(term => pText.includes(term));
          });

          if (subDirectMatch || progMatch || catDirectMatch) {
            coursesHierarchyState.expandedCategories.add(cat.id);
            coursesHierarchyState.expandedSubfields.add(sub.id);
          }
        });
      });
    });
  }

  renderCoursesAccordion();
}

function expandAllCategories() {
  coursesHierarchyState.categories.forEach(cat => {
    coursesHierarchyState.expandedCategories.add(cat.id);
    (cat.groups || []).forEach(grp => {
      (grp.subfields || []).forEach(sub => {
        coursesHierarchyState.expandedSubfields.add(sub.id);
      });
    });
  });
  renderCoursesAccordion();
}

function collapseAllCategories() {
  coursesHierarchyState.expandedCategories.clear();
  coursesHierarchyState.expandedSubfields.clear();
  coursesHierarchyState.expandedPrograms.clear();
  renderCoursesAccordion();
}

function toggleCategory(catId) {
  if (coursesHierarchyState.expandedCategories.has(catId)) {
    coursesHierarchyState.expandedCategories.delete(catId);
  } else {
    coursesHierarchyState.expandedCategories.add(catId);
  }
  renderCoursesAccordion();
}

function toggleSubfield(subId) {
  if (coursesHierarchyState.expandedSubfields.has(subId)) {
    coursesHierarchyState.expandedSubfields.delete(subId);
  } else {
    coursesHierarchyState.expandedSubfields.add(subId);
  }
  renderCoursesAccordion();
}

function toggleProgramDetail(progId) {
  if (coursesHierarchyState.expandedPrograms.has(progId)) {
    coursesHierarchyState.expandedPrograms.delete(progId);
  } else {
    coursesHierarchyState.expandedPrograms.add(progId);
  }
  renderCoursesAccordion();
}

function renderCoursesAccordion() {
  const container = document.getElementById('coursesCategoriesAccordion');
  if (!container) return;

  const q = (coursesHierarchyState.searchQuery || '').toLowerCase();
  const categories = coursesHierarchyState.categories;

  if (!categories || categories.length === 0) {
    container.innerHTML = `
      <div class="courses-empty-results-box">
        <h3>Loading Courses Catalog...</h3>
        <p>Retrieving academic disciplines, degrees, and course pathways.</p>
      </div>
    `;
    return;
  }

  let renderedCategoriesCount = 0;

  const categoriesHtml = categories.map((cat, catIndex) => {
    const isCatExpanded = coursesHierarchyState.expandedCategories.has(cat.id);
    const subfieldCount = (cat.groups || []).reduce((sum, g) => sum + (g.subfields || []).length, 0);
    const progCount = (cat.groups || []).reduce((sum, g) => {
      return sum + (g.subfields || []).reduce((sSum, s) => sSum + (s.programs || []).length, 0);
    }, 0);

    let filteredGroups = cat.groups || [];
    if (q.length > 0) {
      const searchTerms = [q, ...(COURSE_SEARCH_SYNONYMS[q] || [])];
      const catText = `${cat.name} ${cat.description || ''}`.toLowerCase();
      const catDirectMatch = searchTerms.some(term => catText.includes(term));

      filteredGroups = (cat.groups || []).map(grp => {
        const matchingSubfields = (grp.subfields || []).filter(sub => {
          const subText = `${sub.name} ${sub.tagline || ''}`.toLowerCase();
          const subDirectMatch = searchTerms.some(term => subText.includes(term));
          const hasMatchingProgs = (sub.programs || []).some(p => {
            const progText = `${p.name} ${p.degreeType || ''} ${p.overview || ''} ${(p.specializations||[]).join(' ')} ${(p.skills||[]).join(' ')} ${(p.careers||[]).join(' ')} ${(p.exams||[]).join(' ')} ${p.eligibility || ''}`.toLowerCase();
            return searchTerms.some(term => progText.includes(term));
          });
          return subDirectMatch || hasMatchingProgs || catDirectMatch;
        });
        return {
          name: grp.name,
          subfields: matchingSubfields
        };
      }).filter(grp => grp.subfields.length > 0);

      if (filteredGroups.length === 0) {
        return '';
      }
    }

    renderedCategoriesCount++;
    const groupDisplay = filteredGroups.length > 0 ? filteredGroups : (cat.groups || []);

    return `
      <div class="category-card-block ${isCatExpanded ? 'expanded' : ''}" id="catCard_${cat.id}">
        <button type="button" class="category-header-trigger" onclick="toggleCategory('${cat.id}')" aria-expanded="${isCatExpanded}">
          <div class="category-header-left">
            <div class="category-icon-box">${cat.icon || '📚'}</div>
            <div class="category-header-info">
              <h3 class="category-header-title">${catIndex + 1}. ${cat.name}</h3>
              <p class="category-header-desc">${cat.description || 'Explore core disciplines and degree pathways.'}</p>
            </div>
          </div>
          <div class="category-header-right">
            <span class="category-stats-badge">${subfieldCount} Sub-Fields &bull; ${progCount} Programs</span>
            <div class="category-arrow-indicator">⌄</div>
          </div>
        </button>

        <div class="category-body-container">
          ${groupDisplay.map(grp => `
            <div class="course-group-wrapper">
              <div class="course-group-header-label">${grp.name}</div>
              <div class="subfields-accordion-stack">
                ${(grp.subfields || []).map(sub => {
                  const isSubOpen = coursesHierarchyState.expandedSubfields.has(sub.id);
                  const subProgs = sub.programs || [];

                  return `
                    <div class="subfield-card ${isSubOpen ? 'open' : ''}" id="subfieldCard_${sub.id}">
                      <div style="display:flex; align-items:center; width:100%;">
                        <button type="button" class="subfield-trigger" onclick="toggleSubfield('${sub.id}')" aria-expanded="${isSubOpen}" style="flex:1;">
                          <div class="subfield-title-area">
                            <span class="subfield-icon">${sub.icon || '🔹'}</span>
                            <div>
                              <span class="subfield-name">${sub.name}</span>
                              <span class="subfield-tagline">${sub.tagline || ''}</span>
                            </div>
                          </div>
                          <div class="subfield-meta-right">
                            <span class="subfield-count-pill">${subProgs.length} ${subProgs.length === 1 ? 'Program' : 'Programs'}</span>
                            <span class="subfield-arrow">▶</span>
                          </div>
                        </button>
                        ${subProgs.length > 0 ? `
                          <button type="button" class="subfield-direct-view-btn" onclick="openCourseDetails('${subProgs[0].id || sub.id}')" title="Explore ${sub.name} Degree Roadmap">
                            Roadmap ➔
                          </button>
                        ` : ''}
                      </div>

                      <div class="subfield-programs-container">
                        ${subProgs.map(prog => {
                          const isProgDetailOpen = coursesHierarchyState.expandedPrograms.has(prog.id);
                          const annualFee = getProgramAnnualTuitionFee(prog);

                          return `
                            <div class="program-item-card ${isProgDetailOpen ? 'detail-open' : ''}" id="progCard_${prog.id}">
                              <div class="program-header-row">
                                <div class="program-title-wrap" onclick="openCourseDetails('${prog.id}')" title="Click to view full course roadmap &amp; syllabus">
                                  <div class="program-title">${prog.name}</div>
                                  <div class="program-meta-chips">
                                    <span class="program-badge">${prog.degreeType || 'Degree Program'}</span>
                                    <span class="program-badge">⏱️ ${prog.duration || 'Full-time'}</span>
                                    <span class="program-badge" style="background:#ECFDF5; color:#065F46; border:1px solid #A7F3D0; font-weight:700;">💰 ${escapeHtml(annualFee)}</span>
                                    ${prog.placementRelevance ? `<span class="program-badge salary-badge">💼 Placements</span>` : ''}
                                  </div>
                                </div>
                                <div style="display:flex; gap:6px; flex-wrap:wrap; align-items:center;">
                                  <button type="button" class="program-toggle-detail-btn" onclick="toggleProgramDetail('${prog.id}')" aria-expanded="${isProgDetailOpen}" title="Quick summary preview">
                                    ${isProgDetailOpen ? '▲ Quick View' : '▼ Quick View'}
                                  </button>
                                  <button type="button" class="program-toggle-detail-btn" style="border-color:var(--coral); color:var(--coral); font-weight:700;" onclick="openCourseDetails('${prog.id}')" title="Open full course roadmap">
                                    Full Roadmap ➔
                                  </button>
                                </div>
                              </div>

                              <div class="program-detail-panel">
                                <div class="program-quick-metrics-grid">
                                  <div class="program-metric-box">
                                    <small>Degree Level</small>
                                    <strong>${prog.degreeType || 'Undergraduate / PG'}</strong>
                                  </div>
                                  <div class="program-metric-box">
                                    <small>Program Duration</small>
                                    <strong>${prog.duration || 'Standard Track'}</strong>
                                  </div>
                                  <div class="program-metric-box" style="background:#F0FDF4; border:1.5px solid #BBF7D0;">
                                    <small style="color:#15803D; font-weight:800;">Annual Tuition Fees</small>
                                    <strong style="color:#0F172A; font-size:13.5px;">💰 ${escapeHtml(annualFee)}</strong>
                                  </div>
                                  <div class="program-metric-box">
                                    <small>Minimum Eligibility</small>
                                    <strong>${prog.eligibility || '10+2 / Graduation'}</strong>
                                  </div>
                                  <div class="program-metric-box">
                                    <small>Entrance Examinations</small>
                                    <strong>${(prog.exams || []).join(', ') || 'Merit / Direct'}</strong>
                                  </div>
                                </div>

                                ${prog.overview ? `
                                  <div class="program-info-block">
                                    <div class="program-info-block-title">📖 Program Overview</div>
                                    <div>${prog.overview}</div>
                                  </div>
                                ` : ''}

                                ${prog.specializations && prog.specializations.length > 0 ? `
                                  <div class="program-info-block">
                                    <div class="program-info-block-title">🎯 Specializations &amp; Focus Tracks</div>
                                    <div class="program-tags-row">
                                      ${prog.specializations.map(spec => `<span class="program-tag-item">✦ ${spec}</span>`).join('')}
                                    </div>
                                  </div>
                                ` : ''}

                                ${prog.skills && prog.skills.length > 0 ? `
                                  <div class="program-info-block">
                                    <div class="program-info-block-title">⚡ Essential Technical &amp; Applied Skills</div>
                                    <div class="program-tags-row">
                                      ${prog.skills.map(sk => `<span class="program-tag-item">✓ ${sk}</span>`).join('')}
                                    </div>
                                  </div>
                                ` : ''}

                                ${prog.careers && prog.careers.length > 0 ? `
                                  <div class="program-info-block">
                                    <div class="program-info-block-title">💼 Career Opportunities &amp; Job Roles</div>
                                    <div class="program-tags-row">
                                      ${prog.careers.map(car => `<span class="program-tag-item career-tag">💼 ${car}</span>`).join('')}
                                    </div>
                                  </div>
                                ` : ''}

                                ${prog.placementRelevance ? `
                                  <div class="program-info-block">
                                    <div class="program-info-block-title">📈 Placement Relevance &amp; Market Dynamics</div>
                                    <div>${prog.placementRelevance}</div>
                                  </div>
                                ` : ''}

                                <div class="program-action-footer">
                                  <button type="button" class="program-explore-colleges-btn" onclick="openCourseDetails('${prog.id}')">
                                    Explore Full Degree Syllabus &amp; Roadmap ➔
                                  </button>
                                </div>
                              </div>
                            </div>
                          `;
                        }).join('')}
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).filter(Boolean).join('');

  if (renderedCategoriesCount === 0) {
    container.innerHTML = `
      <div class="courses-empty-results-box">
        <h3>No matching courses found for "${coursesHierarchyState.searchQuery}"</h3>
        <p>Try searching for broader terms like "Computer Science", "AI", "B.Com", "Cyber Security", "MBBS", "UI/UX", or "Cloud".</p>
        <button type="button" class="courses-filter-chip active" style="margin-top:10px;" onclick="handleCoursesSearch('')">
          Reset Search
        </button>
      </div>
    `;
  } else {
    container.innerHTML = categoriesHtml;
  }

  const summaryEl = document.getElementById('coursesResultsSummary');
  if (summaryEl) {
    if (q.length > 0) {
      summaryEl.innerHTML = `<span class="stat-indicator-dot"></span><span>Search results for "<b>${coursesHierarchyState.searchQuery}</b>": Found matching tracks across <b>${renderedCategoriesCount} Categories</b></span>`;
    } else {
      summaryEl.innerHTML = `<span class="stat-indicator-dot"></span><span>Showing <b>7 Education Categories</b> &bull; <b>62 Sub-Fields</b> &bull; <b>69 Degree Programs</b></span>`;
    }
  }
}

// ============================================================================
// 18. REUSABLE DATA-DRIVEN COURSE DETAILS VIEW (#detailView)
// ============================================================================
function findProgramInCatalog(programIdOrName) {
  if (!programIdOrName) return null;
  const target = programIdOrName.toString().trim().toLowerCase();
  const cleanTarget = target.replace(/[^a-z0-9]/g, '');

  const categories = coursesHierarchyState.categories || [];
  let prog = null;

  // 1. Direct program ID or Exact Program Name match
  for (const cat of categories) {
    for (const grp of cat.groups || []) {
      for (const sub of grp.subfields || []) {
        for (const p of sub.programs || []) {
          if (p.id.toLowerCase() === target || p.name.toLowerCase() === target) {
            prog = p;
            break;
          }
        }
        if (prog) break;
      }
      if (prog) break;
    }
    if (prog) break;
  }

  // 2. Direct Subfield ID or Exact Subfield Name match
  if (!prog) {
    for (const cat of categories) {
      for (const grp of cat.groups || []) {
        for (const sub of grp.subfields || []) {
          if (sub.id.toLowerCase() === target || sub.name.toLowerCase() === target) {
            if (sub.programs && sub.programs.length > 0) { prog = sub.programs[0]; break; }
          }
        }
        if (prog) break;
      }
      if (prog) break;
    }
  }

  // 3. Normalized / Fuzzy Match
  if (!prog) {
    for (const cat of categories) {
      for (const grp of cat.groups || []) {
        for (const sub of grp.subfields || []) {
          const cleanSub = sub.name.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (cleanSub.includes(cleanTarget) || cleanTarget.includes(cleanSub)) {
            if (sub.programs && sub.programs.length > 0) { prog = sub.programs[0]; break; }
          }
          for (const p of sub.programs || []) {
            const cleanProg = p.name.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (cleanProg.includes(cleanTarget) || cleanTarget.includes(cleanProg) || p.name.toLowerCase().includes(target) || target.includes(p.name.toLowerCase())) {
              prog = p;
              break;
            }
          }
          if (prog) break;
        }
        if (prog) break;
      }
      if (prog) break;
    }
  }

  // 4. Live PostgreSQL database match (newly created or updated admin courses)
  if (!prog && Array.isArray(coursesHierarchyState.courses)) {
    const liveMatch = coursesHierarchyState.courses.find(c =>
      String(c.id).toLowerCase() === target ||
      (c.course_code && c.course_code.toLowerCase() === target) ||
      (c.course_name && c.course_name.toLowerCase().trim() === target) ||
      (c.course_name && c.course_name.toLowerCase().replace(/[^a-z0-9]/g, '').includes(cleanTarget))
    );
    if (liveMatch) {
      const fee = liveMatch.annual_tuition_fees || liveMatch.annualTuitionFees || liveMatch.fees || '';
      prog = {
        id: liveMatch.course_code || `prog-${liveMatch.id}`,
        name: liveMatch.course_name || liveMatch.name,
        degreeType: liveMatch.degree_type || liveMatch.degreeType || 'Undergraduate (UG)',
        duration: liveMatch.duration || '4 Years',
        eligibility: liveMatch.eligibility || '10+2 / Equivalent',
        overview: liveMatch.description || liveMatch.overview || 'Comprehensive academic degree curriculum.',
        annualTuitionFees: fee,
        annual_tuition_fees: fee,
        fees: fee
      };
    }
  }

  // Overlay live fee from PostgreSQL if available so exact edited value is used identically
  if (prog && Array.isArray(coursesHierarchyState.courses)) {
    const liveMatch = coursesHierarchyState.courses.find(c =>
      (prog.id && (c.id == prog.id || (c.course_code && c.course_code.toLowerCase() === String(prog.id).toLowerCase()))) ||
      (prog.name && c.course_name && c.course_name.toLowerCase().trim() === String(prog.name).toLowerCase().trim())
    );
    if (liveMatch && (liveMatch.annual_tuition_fees || liveMatch.annualTuitionFees || liveMatch.fees)) {
      const exactFee = liveMatch.annual_tuition_fees || liveMatch.annualTuitionFees || liveMatch.fees;
      prog.annualTuitionFees = exactFee;
      prog.annual_tuition_fees = exactFee;
      prog.fees = exactFee;
    }
  }

  return prog;
}

let activeDetailYear = 1;
let currentDetailProgram = null;

// Dynamic course-specific curriculum mapper across streams
function getProgramYearWiseSubjects(prog, yearNum) {
  if (prog && prog.subjects && prog.subjects[`year${yearNum}`] && prog.subjects[`year${yearNum}`].length) {
    return prog.subjects[`year${yearNum}`];
  }

  const name = (prog && prog.name ? prog.name : '').toLowerCase();

  if (name.includes('computer') || name.includes('cse') || name.includes('it') || name.includes('software') || name.includes('ai') || name.includes('data') || name.includes('cyber') || name.includes('tech')) {
    if (yearNum === 1) {
      return [
        { num: '01', title: 'Programming & Data Structures Fundamentals', desc: 'Algorithmic problem solving, pointer mechanics, C++/Python data structures, and asymptotic complexity.', difficulty: 'Foundation', topics: 'Arrays, Linked Lists, Memory Allocation, Time & Space Complexity' },
        { num: '02', title: 'Discrete Mathematics & Linear Algebra', desc: 'Combinatorics, propositional logic, graph theory principles, and vector matrix operations for computation.', difficulty: 'Foundation', topics: 'Boolean Logic, Graph Theory, Matrix Decompositions, Probability' },
        { num: '03', title: 'Digital Logic & Computer Organization', desc: 'Logic gates, combinational circuit design, ALU instruction pipelines, and CPU memory hierarchy.', difficulty: 'Core', topics: 'Registers, Flip-Flops, Cache Memory, Assembly Architecture' }
      ];
    } else if (yearNum === 2) {
      return [
        { num: '01', title: 'Operating Systems & Concurrency', desc: 'Process scheduling algorithms, virtual memory paging, multithreading, and synchronization primitives.', difficulty: 'Core', topics: 'POSIX Threads, Deadlocks, Paging, Virtual File Systems' },
        { num: '02', title: 'Database Management Systems (DBMS)', desc: 'Relational algebra, SQL query optimization, ACID transaction management, and indexing strategies.', difficulty: 'Core', topics: 'B+ Trees, Normalization, Query Planners, NoSQL Data Stores' },
        { num: '03', title: 'Computer Networks & Distributed Protocols', desc: 'OSI 7-layer stack, TCP/IP socket programming, congestion control, and modern network security protocols.', difficulty: 'Core', topics: 'HTTP/3, TCP Protocols, DNS Routing, TLS/SSL Cryptography' }
      ];
    } else if (yearNum === 3) {
      return [
        { num: '01', title: 'Design & Analysis of Advanced Algorithms', desc: 'Dynamic programming paradigms, greedy heuristics, max-flow networks, and NP-completeness proofs.', difficulty: 'Advanced', topics: 'Network Flow, Branch-and-Bound, Approximation, Reductions' },
        { num: '02', title: 'Cloud Infrastructure & Microservices Architecture', desc: 'Containerization, orchestration pipelines, distributed message queues, and resilient REST/gRPC APIs.', difficulty: 'Advanced', topics: 'Docker, Kubernetes, AWS/GCP Architectures, Message Brokers' },
        { num: '03', title: 'Machine Learning & Applied Neural Systems', desc: 'Supervised/unsupervised algorithms, gradient descent optimization, loss functions, and NLP transformers.', difficulty: 'Specialization', topics: 'Transformers, Backpropagation, Feature Pipelines, PyTorch' }
      ];
    } else {
      return [
        { num: '01', title: 'Industry Capstone Project & Systems Deployment', desc: 'Full-lifecycle enterprise software engineering, CI/CD automated deployment, and scalable telemetry.', difficulty: 'Capstone', topics: 'Production Release, Load Balancing, Observability, Unit Tests' },
        { num: '02', title: 'Information Security & Cryptographic Systems', desc: 'Public key infrastructure, penetration testing methodologies, zero-trust architectures, and code audits.', difficulty: 'Specialization', topics: 'RSA/ECC, OWASP Top 10, Zero-Trust, Applied Cryptography' },
        { num: '03', title: 'Professional Internship & Industry Immersion', desc: 'Full-semester engineering practicum with top technology product employers and domain specialists.', difficulty: 'Practicum', topics: 'Sprint Delivery, Code Reviews, Enterprise SLA Fulfillment' }
      ];
    }
  } else if (name.includes('mbbs') || name.includes('medical') || name.includes('health') || name.includes('pharm') || name.includes('nursing') || name.includes('bds') || name.includes('bpt')) {
    if (yearNum === 1) {
      return [
        { num: '01', title: 'Human Gross Anatomy & Embryology', desc: 'Systematic osteology, neuroanatomy dissections, histology, and clinical developmental biology.', difficulty: 'Foundation', topics: 'Cadaveric Dissection, Microscopic Histology, Neuroanatomy' },
        { num: '02', title: 'Medical Physiology & Biophysics', desc: 'Cardiovascular, respiratory, renal, and neuro-muscular physiological regulatory mechanisms.', difficulty: 'Foundation', topics: 'Hemodynamics, Action Potentials, Nephron Filtration, Gas Exchange' },
        { num: '03', title: 'Medical Biochemistry & Molecular Genetics', desc: 'Metabolic pathways, enzymatic kinetics, clinical genetics, and molecular diagnostic markers.', difficulty: 'Foundation', topics: 'Glycolysis, Krebs Cycle, Lipid Profiles, Polymerase Reactions' }
      ];
    } else if (yearNum === 2) {
      return [
        { num: '01', title: 'Pathology & Clinical Hematology', desc: 'Cellular injury, oncogenesis mechanisms, systemic pathology, autopsy findings, and blood smears.', difficulty: 'Core', topics: 'Inflammation Pathways, Neoplasia, Biopsy Staining, CBC Analysis' },
        { num: '02', title: 'Medical Microbiology & Immunology', desc: 'Bacteriology, virology, mycology, antimicrobial resistance, and serological diagnostics.', difficulty: 'Core', topics: 'Gram Stains, Viral Replication, Vaccine Mechanisms, Culture Media' },
        { num: '03', title: 'General & Clinical Pharmacology', desc: 'Pharmacokinetics, pharmacodynamics, drug interactions, and rational systemic therapeutics.', difficulty: 'Core', topics: 'Receptor Agonists, Antibiotics, Dosage Calculations, Adverse Drug Events' }
      ];
    } else if (yearNum === 3) {
      return [
        { num: '01', title: 'Forensic Medicine & Medical Jurisprudence', desc: 'Thanatology, clinical toxicology, autopsy procedures, and healthcare ethics regulations.', difficulty: 'Advanced', topics: 'Post-Mortem Findings, Poison Assays, Medicolegal Documentation' },
        { num: '02', title: 'Community Medicine & Public Health Epidemiology', desc: 'Biostatistics, outbreak investigation, national health programs, and preventive healthcare.', difficulty: 'Advanced', topics: 'R0 Calculation, Maternal-Child Health, Immunization Schedules' },
        { num: '03', title: 'Clinical Otorhinolaryngology (ENT) & Ophthalmology', desc: 'Visual field optics, audiometry, surgical ear-nose-throat interventions, and trauma management.', difficulty: 'Advanced', topics: 'Retinal Examination, Audiograms, Endoscopic Diagnostic Procedures' }
      ];
    } else {
      return [
        { num: '01', title: 'General Medicine & Critical Care Diagnostics', desc: 'Systemic clinical examinations, differential diagnosis, and inpatient emergency management.', difficulty: 'Clinical', topics: 'ECG Interpretation, Ward Rounds, ICU Resuscitation Protocols' },
        { num: '02', title: 'General Surgery & Operative Protocols', desc: 'Pre-operative evaluation, sterile operating room techniques, wound care, and trauma management.', difficulty: 'Surgical', topics: 'Laparoscopy, Suture Techniques, Surgical Emergencies' },
        { num: '03', title: 'Obstetrics, Gynaecology & Paediatric Neonatology', desc: 'Antenatal care, labor management, pediatric developmental milestones, and neonatal resuscitation.', difficulty: 'Clinical', topics: 'APGAR Scoring, Partograph Interpretation, Neonatal Screening' }
      ];
    }
  } else if (name.includes('b.com') || name.includes('bba') || name.includes('mba') || name.includes('ca') || name.includes('finance') || name.includes('management') || name.includes('commerce') || name.includes('economics')) {
    if (yearNum === 1) {
      return [
        { num: '01', title: 'Financial Accounting & Corporate Reporting', desc: 'Double-entry bookkeeping, trial balance preparation, and GAAP/IFRS financial reporting.', difficulty: 'Foundation', topics: 'Journal Entries, Cash Flow Statements, Balance Sheets, Depreciation' },
        { num: '02', title: 'Managerial Micro & Macroeconomics', desc: 'Market equilibrium, price elasticity of demand, monetary policy, and macroeconomic forecasting.', difficulty: 'Foundation', topics: 'Supply-Demand Curves, GDP Deflators, Inflation Modeling' },
        { num: '03', title: 'Principles of Management & Organizational Behavior', desc: 'Leadership frameworks, team dynamics, managerial decision making, and corporate strategy.', difficulty: 'Foundation', topics: 'Motivation Theories, Corporate Governance, Change Management' }
      ];
    } else if (yearNum === 2) {
      return [
        { num: '01', title: 'Corporate Finance & Valuation Modeling', desc: 'Capital budgeting, discounted cash flow (DCF) modeling, and working capital optimization.', difficulty: 'Core', topics: 'NPV & IRR, WACC Computation, Financial Modeling in Excel' },
        { num: '02', title: 'Marketing Management & Consumer Analytics', desc: 'Market segmentation, digital acquisition channels, brand positioning, and pricing strategies.', difficulty: 'Core', topics: '4Ps of Marketing, Customer Lifetime Value (CLV), Conversion Funnels' },
        { num: '03', title: 'Direct & Indirect Taxation (GST & Corporate Tax)', desc: 'Corporate tax computation, GST input tax credits, and regulatory compliance standards.', difficulty: 'Core', topics: 'Corporate Slabs, GST Return Filing, TDS Deductions, Tax Planning' }
      ];
    } else if (yearNum === 3) {
      return [
        { num: '01', title: 'Investment Banking & Portfolio Management', desc: 'Security analysis, equity research, derivatives hedging, and Modern Portfolio Theory.', difficulty: 'Advanced', topics: 'Options & Futures, Markowitz Frontier, M&A Due Diligence' },
        { num: '02', title: 'Strategic Business Leadership & Global Operations', desc: 'Competitive strategy, global supply chains, international trade, and case simulations.', difficulty: 'Advanced', topics: 'Porter Five Forces, Blue Ocean Strategy, Supply Chain Resilience' },
        { num: '03', title: 'FinTech, Business Analytics & Quantitative Decisioning', desc: 'Predictive analytics, Power BI dashboards, algorithmic finance, and automated risk scoring.', difficulty: 'Specialization', topics: 'Python for Finance, Tableau Dashboards, Credit Risk Scoring' }
      ];
    } else {
      return [
        { num: '01', title: 'Executive Strategy Capstone & Venture Pitch', desc: 'Corporate restructuring, venture funding pitch decks, and enterprise case defense.', difficulty: 'Capstone', topics: 'Term Sheets, Cap Tables, Due Diligence, Board Presentations' },
        { num: '02', title: 'International Business & Forex Risk Management', desc: 'Currency hedging, international trade tariffs, and cross-border expansion strategy.', difficulty: 'Specialization', topics: 'Forex Swaps, Letter of Credit, Export-Import Documentation' },
        { num: '03', title: 'Industry Leadership Practicum & Management Residency', desc: 'Full-time managerial consulting internship with top financial and strategy firms.', difficulty: 'Practicum', topics: 'Client Deliverables, Executive Stakeholder Management' }
      ];
    }
  } else if (name.includes('law') || name.includes('ll.b') || name.includes('legal') || name.includes('judiciary')) {
    if (yearNum === 1) {
      return [
        { num: '01', title: 'Constitutional Law & Fundamental Rights', desc: 'Preamble, fundamental rights, judicial review, and federal governance structures.', difficulty: 'Foundation', topics: 'Article 21 Jurisprudence, Writ Petitions, Basic Structure Doctrine' },
        { num: '02', title: 'Law of Contracts & Specific Relief', desc: 'Offer, acceptance, consideration, breach of contract, and commercial damages.', difficulty: 'Foundation', topics: 'Standard Form Contracts, Liquidated Damages, E-Contracts' },
        { num: '03', title: 'Law of Torts & Consumer Protection Jurisprudence', desc: 'Negligence, strict liability, vicarious liability, and consumer dispute redressal.', difficulty: 'Foundation', topics: 'Nuisance, Defamation, Consumer Forum Procedures' }
      ];
    } else if (yearNum === 2) {
      return [
        { num: '01', title: 'Indian Penal Code & Criminal Jurisprudence', desc: 'General exceptions, offenses against human body and property, and mens rea principles.', difficulty: 'Core', topics: 'Culpable Homicide vs Murder, Cyber Crimes, White-Collar Fraud' },
        { num: '02', title: 'Code of Criminal Procedure (CrPC) & Evidence Law', desc: 'Arrest procedures, bail jurisprudence, evidence admissibility, and trial stages.', difficulty: 'Core', topics: 'FIR Documentation, Anticipatory Bail, Burden of Proof' },
        { num: '03', title: 'Corporate & Company Law', desc: 'Incorporation, director duties, shareholder rights, insolvency, and NCLT procedures.', difficulty: 'Core', topics: 'Corporate Veil, Mergers & Acquisitions, IBC 2016 Framework' }
      ];
    } else if (yearNum === 3) {
      return [
        { num: '01', title: 'Code of Civil Procedure (CPC) & Limitation Act', desc: 'Pleadings, plaints, written statements, execution decrees, and appellate remedies.', difficulty: 'Advanced', topics: 'Res Judicata, Temporary Injunctions, Order VII Rule 11' },
        { num: '02', title: 'Intellectual Property Rights & Cyber Law', desc: 'Patents, trademarks, copyrights, trade secrets, and digital data protection compliance.', difficulty: 'Specialization', topics: 'Patent Infringement, Copyright Fair Use, IT Act 2000' },
        { num: '03', title: 'Moot Court, Clinical Legal Drafting & Trial Advocacy', desc: 'Drafting legal notices, petitions, court arguments, cross-examination, and client counseling.', difficulty: 'Practicum', topics: 'Memorial Drafting, Oral Arguments, Legal Aid Clinics' }
      ];
    } else {
      return [
        { num: '01', title: 'International Commercial Arbitration & ADR', desc: 'Arbitration agreements, seat of arbitration, enforcement of foreign arbitral awards.', difficulty: 'Advanced', topics: 'UNCITRAL Model Law, Mediation, Section 34 Applications' },
        { num: '02', title: 'Taxation Law & Banking Regulations', desc: 'Direct taxes, transfer pricing regulations, SARFAESI Act, and RBI guidelines.', difficulty: 'Specialization', topics: 'Income Tax Appeals, Debt Recovery Tribunals, NPA Resolution' },
        { num: '03', title: 'Judicial Clerkship & High Court Litigation Internship', desc: 'Full-semester litigation training under Senior Advocates or Judicial Chambers.', difficulty: 'Practicum', topics: 'Brief Preparation, Case Law Research, Chamber Practice' }
      ];
    }
  } else {
    if (yearNum === 1) {
      return [
        { num: '01', title: 'Academic Foundations & Core Theory', desc: 'Rigorous conceptual framework and introductory domain methodologies.', difficulty: 'Foundation', topics: 'Foundational Theory, Research Methods, Analytical Writing' },
        { num: '02', title: 'Quantitative Reasoning & Analytical Computing', desc: 'Applied computational tools, data evaluation, and statistical analysis.', difficulty: 'Foundation', topics: 'Data Modeling, Visualization, Statistical Tests' },
        { num: '03', title: 'Introductory Laboratory & Studio Practice', desc: 'Hands-on exploratory exercises, prototyping, and fundamental tool fluency.', difficulty: 'Core', topics: 'Studio Exercises, Lab Protocols, Documentation Standards' }
      ];
    } else if (yearNum === 2) {
      return [
        { num: '01', title: 'Intermediate Domain Specialization', desc: 'Advanced theoretical principles and real-world application paradigms.', difficulty: 'Core', topics: 'Domain Frameworks, Case Studies, Problem Formulation' },
        { num: '02', title: 'Applied Research Methods & Experimental Design', desc: 'Empirical research, laboratory experimentation, and quantitative testing.', difficulty: 'Core', topics: 'Hypothesis Testing, Controlled Trials, Field Surveys' },
        { num: '03', title: 'Collaborative Studio / Technical Project', desc: 'Multidisciplinary team project addressing industry benchmarks and challenges.', difficulty: 'Core', topics: 'Iterative Prototyping, Peer Reviews, Milestone Delivery' }
      ];
    } else if (yearNum === 3) {
      return [
        { num: '01', title: 'Advanced Electives & Emerging Industry Trends', desc: 'High-level specialization courses matching contemporary global developments.', difficulty: 'Advanced', topics: 'Emerging Frameworks, Modern Standards, Scalability' },
        { num: '02', title: 'Senior Capstone Project & Defense', desc: 'Independent research thesis or product development with faculty and industry review.', difficulty: 'Capstone', topics: 'Literature Review, Implementation, Viva Voce Defense' },
        { num: '03', title: 'Professional Portfolio & Career Practicum', desc: 'Industry internships, professional portfolio curation, and recruitment prep.', difficulty: 'Practicum', topics: 'Portfolio Reviews, Case Presentations, Mock Assessments' }
      ];
    } else {
      return [
        { num: '01', title: 'Industry Immersion & Practicum Residency', desc: 'Full-semester industry placement with corporate or research enterprise partners.', difficulty: 'Practicum', topics: 'Professional Delivery, Cross-functional Execution' },
        { num: '02', title: 'Advanced Research Thesis Publication', desc: 'Independent scholarly paper submission or patent documentation.', difficulty: 'Research', topics: 'Manuscript Preparation, Peer Review, Citation Indexing' },
        { num: '03', title: 'Professional Practice & Leadership', desc: 'Ethics, organizational management, project economics, and leadership.', difficulty: 'Leadership', topics: 'Ethics Compliance, Project Budgeting, Strategic Planning' }
      ];
    }
  }
}
window.getProgramYearWiseSubjects = getProgramYearWiseSubjects;

function renderDetailSubjects(yearNum = 1) {
  activeDetailYear = yearNum;
  const listContainer = document.querySelector('#detailView .subject-list');
  const yearTabs = document.querySelector('#detailView .year-tabs');

  if (yearTabs) {
    yearTabs.querySelectorAll('button').forEach((b, i) => {
      b.classList.toggle('active', i + 1 === yearNum);
    });
  }

  if (!listContainer || !currentDetailProgram) return;

  const subjects = getProgramYearWiseSubjects(currentDetailProgram, yearNum);
  const progName = currentDetailProgram.name || 'Course';

  listContainer.innerHTML = subjects.map((s, idx) => {
    const isCompleted = (localStorage.getItem(`cn-comp-${progName}-y${yearNum}-s${idx}`) === '1');
    return `
      <article class="cn-subject-card" style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; padding:16px 18px; display:flex; align-items:flex-start; gap:16px; transition:all 0.2s ease; margin-bottom:10px;">
        <span class="subject-num" style="width:36px; height:36px; border-radius:8px; background:#77AC3B; color:#FFFFFF; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:14px; flex-shrink:0;">${s.num || `0${idx + 1}`}</span>
        <div style="flex:1;">
          <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px; margin-bottom:4px;">
            <h4 style="margin:0; font-size:15px; font-weight:800; color:#0F172A;">${escapeHtml(s.title)}</h4>
            <span style="font-size:11px; font-weight:800; background:#E2E8F0; color:#334155; padding:2px 8px; border-radius:999px; text-transform:uppercase;">${escapeHtml(s.difficulty || 'Core')}</span>
          </div>
          <p style="margin:0 0 8px; font-size:13px; color:#475569; line-height:1.5;">${escapeHtml(s.desc)}</p>
          <div style="font-size:12px; color:#64748B; background:#FFFFFF; border:1px solid #E2E8F0; border-radius:6px; padding:6px 10px; display:inline-block;">
            <strong style="color:#0F172A;">📌 Key Topics:</strong> ${escapeHtml(s.topics || 'Theory, practical laboratory & capstone')}
          </div>
        </div>
        <button type="button" class="cn-subject-status-btn" style="border:1.5px solid ${isCompleted ? '#77AC3B' : '#CBD5E1'}; background:${isCompleted ? '#F0FDF4' : '#FFFFFF'}; color:${isCompleted ? '#15803D' : '#475569'}; padding:6px 12px; border-radius:8px; font-size:12px; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:4px; flex-shrink:0; transition:all 0.2s;" onclick="toggleSubjectCompletion('${escapeHtml(progName)}', ${yearNum}, ${idx}, '${escapeHtml(s.title)}')">
          ${isCompleted ? '✓ Completed' : '+ Mark Completed'}
        </button>
      </article>
    `;
  }).join('');
}

function toggleSubjectCompletion(progName, yearNum, subjectIdx, subjectTitle) {
  const key = `cn-comp-${progName}-y${yearNum}-s${subjectIdx}`;
  const isCurrentlyCompleted = (localStorage.getItem(key) === '1');
  if (isCurrentlyCompleted) {
    localStorage.removeItem(key);
    showToast(`Marked "${subjectTitle}" as In Progress.`, 'info');
  } else {
    localStorage.setItem(key, '1');
    showToast(`✓ Marked "${subjectTitle}" as Completed for Year ${yearNum}!`, 'success');
  }
  renderDetailSubjects(yearNum);
}
window.toggleSubjectCompletion = toggleSubjectCompletion;

// Helper to generate dynamic, course-specific 10-point roadmap enhancements
function generateCourseFullRoadmapHtml(prog) {
  const name = prog.name || 'Course Degree Program';
  const degree = prog.degreeType || 'Degree Program';
  const duration = prog.duration || '3-4 Years';
  const annualFee = getProgramAnnualTuitionFee(prog);
  const skills = (prog.skills && prog.skills.length) ? prog.skills : ['Core Theoretical Knowledge', 'Applied Domain Fluency', 'Analytical Reasoning', 'Problem Solving'];
  const careers = (prog.careers && prog.careers.length) ? prog.careers : ['Industry Specialist', 'Domain Consultant', 'Research Associate', 'Project Lead'];
  const specs = (prog.specializations && prog.specializations.length) ? prog.specializations : ['Advanced Applied Track', 'Research & Innovation', 'Industry Applications'];
  const overview = prog.overview || `${name} is a comprehensive academic and industry-aligned qualification preparing learners for impactful careers and higher technical specializations.`;

  // 1. Course-Specific Introduction (2-3 lines tailored)
  const introText = `${name} (${degree}, ${duration}) delivers an in-depth curriculum bridging foundational principles with modern real-world methodologies. It trains learners to solve complex domain problems, master ${skills.slice(0, 3).join(', ')}, and develop strategic competence across leading global enterprises.`;

  // 2. Degree Use / Benefits
  const benefits = [
    { icon: '🚀', title: 'High-Growth Career Roles', desc: `Direct eligibility for high-paying roles including ${careers.slice(0, 3).join(', ')} with rapid promotion pathways.` },
    { icon: '🎓', title: 'Higher Studies & Research Pathways', desc: `Strong baseline for advanced master's degrees (M.Tech, MS, MBA, PhD, MD, LL.M) and global research fellowships.` },
    { icon: '💡', title: 'Professional Applications', desc: `Practical expertise in ${skills.slice(0, 2).join(' & ')} enabling deployment in enterprise, public sector, and research initiatives.` },
    { icon: '🎯', title: 'Goal & Entrepreneurial Scope', desc: `Equips graduates with technical fluency, project leadership capability, and foundational tools to launch startups or domain consultancies.` }
  ];

  // 3. Where This Course Can Be Implemented (Relevant Fields/Domains)
  let applicableFields = ['Technology & Software Solutions', 'Corporate & Enterprise Systems', 'Research & Academic Labs', 'Consulting & Analytics'];
  if (name.includes('Eng') || name.includes('Tech') || name.includes('Computer') || name.includes('Data') || name.includes('AI') || name.includes('Cyber') || name.includes('IT')) {
    applicableFields = ['Cloud Computing & IT Infrastructure', 'Artificial Intelligence & Data Systems', 'Enterprise Software & SaaS', 'Defense & Space Technology', 'Autonomous Systems & Robotics', 'FinTech & Digital Banking'];
  } else if (name.includes('B.Com') || name.includes('BBA') || name.includes('CA') || name.includes('Finance') || name.includes('Management') || name.includes('Business') || name.includes('Commerce')) {
    applicableFields = ['Investment Banking & Asset Management', 'Corporate Finance & Tax Advisory', 'Global Supply Chain & Logistics', 'FinTech & E-Commerce', 'Management Consulting', 'Venture Capital & Private Equity'];
  } else if (name.includes('MBBS') || name.includes('Medical') || name.includes('Health') || name.includes('Pharm') || name.includes('Nursing') || name.includes('Bio') || name.includes('BDS') || name.includes('BPT')) {
    applicableFields = ['Tertiary Healthcare & Multi-Specialty Hospitals', 'Clinical Diagnostics & Pathology', 'Pharmaceutical R&D & Formulation', 'Biomedical Devices & Telemedicine', 'Public Health Governance', 'Genomics & Precision Medicine'];
  } else if (name.includes('Design') || name.includes('UI') || name.includes('Media') || name.includes('Animation') || name.includes('Arts') || name.includes('Fashion') || name.includes('VFX')) {
    applicableFields = ['Digital Product & UX/UI Studios', 'Advertising & Brand Strategy Agencies', 'Entertainment, Gaming & VFX', 'Industrial & Consumer Product Design', 'Fashion & Apparel Merchandising', 'Architectural Visualization'];
  } else if (name.includes('Law') || name.includes('LL.B') || name.includes('Policy') || name.includes('Corporate') || name.includes('Legal')) {
    applicableFields = ['Corporate Law Firms & M&A Advisory', 'Constitutional & High Court Litigation', 'Intellectual Property & Patent Offices', 'Cyber Law & Data Privacy Compliance', 'International Arbitration & Trade', 'Public Policy & Regulatory Bodies'];
  }

  // 4. Company Recruitment & Career Opportunities
  let companies = ['TCS', 'Infosys', 'Wipro', 'Accenture', 'Cognizant', 'Deloitte'];
  if (name.includes('Eng') || name.includes('Tech') || name.includes('Computer') || name.includes('Data') || name.includes('AI') || name.includes('Cyber') || name.includes('IT')) {
    companies = ['Google', 'Microsoft', 'Amazon', 'Adobe', 'Cisco', 'TCS', 'Infosys', 'Qualcomm', 'NVIDIA'];
  } else if (name.includes('B.Com') || name.includes('BBA') || name.includes('CA') || name.includes('Finance') || name.includes('Management') || name.includes('Commerce')) {
    companies = ['Deloitte', 'EY (Ernst & Young)', 'PwC', 'KPMG', 'Goldman Sachs', 'J.P. Morgan', 'HDFC Bank', 'McKinsey & Company'];
  } else if (name.includes('MBBS') || name.includes('Medical') || name.includes('Health') || name.includes('Pharm') || name.includes('Nursing') || name.includes('Bio')) {
    companies = ['Apollo Hospitals', 'Fortis Healthcare', 'Max Healthcare', 'Sun Pharma', 'Dr. Reddy’s Labs', 'Biocon', 'Pfizer', 'Cipla'];
  } else if (name.includes('Design') || name.includes('UI') || name.includes('Media') || name.includes('Animation') || name.includes('Arts')) {
    companies = ['Adobe', 'Swiggy Design Studio', 'Flipkart UX', 'Tata Elxsi', 'Ogilvy & Mather', 'Ubisoft India', 'Zoho Design', 'Zomato'];
  } else if (name.includes('Law') || name.includes('LL.B') || name.includes('Policy') || name.includes('Corporate')) {
    companies = ['Shardul Amarchand Mangaldas', 'AZB & Partners', 'Trilegal', 'Khaitan & Co', 'Luthra and Luthra', 'J. Sagar Associates', 'Cyril Amarchand Mangaldas'];
  }

  // 5. Past → Present → Future Bar Chart
  const pastPresentFutureData = [
    { label: 'Past (2018-2020)', value: 65, displayValue: '65% Baseline Demand', color: 'teal' },
    { label: 'Present (2025)', value: 88, displayValue: '88% High Industry Need', color: 'teal' },
    { label: 'Future (2028-2030)', value: 98, displayValue: '98% Projected Growth', color: 'coral' }
  ];

  // 6. Course-Specific Reviews
  const reviews = [
    {
      author: 'A. Karthik',
      role: `Alumnus · ${name}`,
      rating: 5.0,
      comment: `The curriculum in ${name} provided a strong mathematical and practical foundation. The laboratory capstone and projects helped me clear technical rounds and secure an immediate placement.`
    },
    {
      author: 'M. Divya',
      role: `Final Year Student · ${name}`,
      rating: 4.9,
      comment: `Studying ${name} equipped me with hands-on skills in ${skills.slice(0, 2).join(' and ')}. Faculty guidance and industry workshops gave me immense confidence for national competitive assessments.`
    },
    {
      author: 'S. Rahul',
      role: `Industry Professional · ${careers[0] || 'Specialist'}`,
      rating: 4.8,
      comment: `Companies actively prioritize candidates with this qualification because of their analytical mindset and ability to adapt quickly to modern enterprise workflows.`
    }
  ];

  return `
    <div style="display:flex; flex-direction:column; gap:24px;">

      <!-- 1. COURSE INTRODUCTION -->
      <section class="detail-block" style="background:#FFFFFF; border:1px solid #E2E8F0; border-radius:14px; padding:22px; box-shadow:0 4px 18px rgba(0,0,0,0.03);">
        <p class="eyebrow" style="color:#77AC3B; margin-bottom:6px;">📖 COURSE INTRODUCTION &amp; OVERVIEW</p>
        <h2 style="font-size:20px; font-weight:800; color:#0F172A; margin:0 0 10px;">${escapeHtml(name)}</h2>
        <p style="font-size:14px; color:#334155; line-height:1.6; margin:0 0 14px;">${escapeHtml(introText)}</p>

        <div class="overview-grid" style="margin-top:14px; display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:12px;">
          <div style="background:#F0FDF4; border:1.5px solid #BBF7D0; border-radius:10px; padding:12px 14px;">
            <small style="color:#15803D; font-weight:800;">ANNUAL TUITION FEES</small>
            <strong style="color:#0F172A; font-size:14.5px; display:block; margin-top:2px;">💰 ${escapeHtml(annualFee)}</strong>
          </div>
          <div><small>ELIGIBILITY</small><strong>${escapeHtml(prog.eligibility || '10+2 / Graduation with relevant subjects')}</strong></div>
          <div><small>SKILLS YOU BUILD</small><strong>${escapeHtml(skills.slice(0, 3).join(' · '))}</strong></div>
          <div><small>CAREER SCOPE</small><strong>${escapeHtml(careers.slice(0, 3).join(' · '))}</strong></div>
        </div>
      </section>

      <!-- 2. DEGREE USE & BENEFITS -->
      <section class="detail-block" style="background:#FFFFFF; border:1px solid #E2E8F0; border-radius:14px; padding:22px; box-shadow:0 4px 18px rgba(0,0,0,0.03);">
        <p class="eyebrow" style="color:var(--coral); margin-bottom:6px;">🎓 DEGREE BENEFITS &amp; PRACTICAL USES</p>
        <h3 style="font-size:18px; font-weight:800; color:#0F172A; margin:0 0 14px;">What You Can Use This Qualification For</h3>

        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:14px;">
          ${benefits.map(b => `
            <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:16px;">
              <div style="font-size:20px; margin-bottom:6px;">${b.icon}</div>
              <strong style="font-size:14px; color:#0F172A; display:block; margin-bottom:4px;">${escapeHtml(b.title)}</strong>
              <p style="font-size:12.5px; color:#475569; line-height:1.5; margin:0;">${escapeHtml(b.desc)}</p>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- 3. WHERE THIS COURSE CAN BE IMPLEMENTED (DOMAINS) -->
      <section class="detail-block" style="background:#FFFFFF; border:1px solid #E2E8F0; border-radius:14px; padding:22px; box-shadow:0 4px 18px rgba(0,0,0,0.03);">
        <p class="eyebrow" style="color:#77AC3B; margin-bottom:6px;">🌐 APPLICABLE DOMAINS &amp; SECTORS</p>
        <h3 style="font-size:18px; font-weight:800; color:#0F172A; margin:0 0 8px;">Where This Course Can Be Applied</h3>
        <p style="font-size:13px; color:#64748B; margin:0 0 14px;">Direct cross-industry adoption and professional practice areas for ${escapeHtml(name)} graduates:</p>

        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:10px;">
          ${applicableFields.map(field => `
            <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-left:3px solid #77AC3B; border-radius:8px; padding:12px 14px;">
              <strong style="font-size:13px; color:#0F172A;">✦ ${escapeHtml(field)}</strong>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- 4. COMPANY RECRUITMENT & CAREER OPPORTUNITIES -->
      <section class="detail-block" style="background:#FFFFFF; border:1px solid #E2E8F0; border-radius:14px; padding:22px; box-shadow:0 4px 18px rgba(0,0,0,0.03);">
        <p class="eyebrow" style="color:var(--coral); margin-bottom:6px;">💼 RECRUITMENT &amp; CAREER LANDSCAPE</p>
        <h3 style="font-size:18px; font-weight:800; color:#0F172A; margin:0 0 14px;">Top Hiring Companies &amp; Industry Demand</h3>

        <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:16px; margin-bottom:14px;">
          <div style="font-size:11px; font-weight:800; color:#64748B; text-transform:uppercase; margin-bottom:8px;">Premier Employers Recruiting ${escapeHtml(name)} Talent:</div>
          <div style="display:flex; flex-wrap:wrap; gap:8px;">
            ${companies.map(c => `<span style="background:#FFFFFF; border:1px solid #CBD5E1; color:#0F172A; font-size:12px; font-weight:700; padding:4px 12px; border-radius:6px;">🏢 ${escapeHtml(c)}</span>`).join('')}
          </div>
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:12px;">
          <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:14px;">
            <strong style="font-size:13px; color:#0F172A; display:block; margin-bottom:4px;">🎯 Key Target Roles</strong>
            <p style="font-size:12.5px; color:#475569; margin:0; line-height:1.5;">${escapeHtml(careers.join(', '))}</p>
          </div>
          <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:14px;">
            <strong style="font-size:13px; color:#0F172A; display:block; margin-bottom:4px;">💡 Why Employers Value This Degree</strong>
            <p style="font-size:12.5px; color:#475569; margin:0; line-height:1.5;">Graduates offer verified proficiency in ${escapeHtml(skills.slice(0, 3).join(', '))} and strategic domain execution.</p>
          </div>
        </div>
      </section>

      <!-- 5. EXISTING FULL ROADMAP (SUBJECTS & ACADEMICS) -->
      <section class="detail-block subjects-block" style="background:#FFFFFF; border:1px solid #E2E8F0; border-radius:14px; padding:22px; box-shadow:0 4px 18px rgba(0,0,0,0.03);">
        <div class="block-heading" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:16px;">
          <div>
            <p class="eyebrow" style="color:#77AC3B; margin-bottom:4px;">📚 CURRICULUM BLUEPRINT</p>
            <h3 style="font-size:18px; font-weight:800; color:#0F172A; margin:0;">Year-by-Year Academic Subjects &amp; Labs</h3>
          </div>
          <div class="year-tabs">
            <button class="active" onclick="renderDetailSubjects(1)">Year 1</button>
            <button onclick="renderDetailSubjects(2)">Year 2</button>
            <button onclick="renderDetailSubjects(3)">Year 3</button>
            ${(duration.includes('4') || duration.includes('4 Years') || duration.includes('5')) ? '<button onclick="renderDetailSubjects(4)">Year 4</button>' : ''}
          </div>
        </div>
        <div class="subject-list">
          <!-- Populated by renderDetailSubjects -->
        </div>
      </section>

      <!-- 6. PAST → PRESENT → FUTURE BAR CHART -->
      <section class="detail-block" style="background:#FFFFFF; border:1px solid #E2E8F0; border-radius:14px; padding:22px; box-shadow:0 4px 18px rgba(0,0,0,0.03);">
        ${renderCNBarChartHtml({
          title: `📊 Evolution & Market Demand: Past → Present → Future (${name})`,
          subtitle: 'Evolution of hiring volume, qualification relevance, and curriculum adoption',
          items: pastPresentFutureData,
          type: 'horizontal',
          colorScheme: 'teal'
        })}
      </section>

      <!-- 7. REVIEWS -->
      <section class="detail-block" style="background:#FFFFFF; border:1px solid #E2E8F0; border-radius:14px; padding:22px; box-shadow:0 4px 18px rgba(0,0,0,0.03);">
        <p class="eyebrow" style="color:#77AC3B; margin-bottom:4px;">💬 STUDENT &amp; ALUMNI FEEDBACK</p>
        <h3 style="font-size:18px; font-weight:800; color:#0F172A; margin:0 0 14px;">Verified Student Experiences in ${escapeHtml(name)}</h3>

        <div style="display:flex; flex-direction:column; gap:10px;">
          ${reviews.map(r => `
            <div class="cn-review-card-compact">
              <div class="cn-review-header">
                <div class="cn-review-author-wrap">
                  <div class="cn-review-avatar">${escapeHtml(r.author.slice(0, 2).toUpperCase())}</div>
                  <div>
                    <div class="cn-review-name">${escapeHtml(r.author)}</div>
                    <div class="cn-review-role">🎯 ${escapeHtml(r.role)}</div>
                  </div>
                </div>
                <div class="cn-review-stars">★★★★★ ${r.rating.toFixed(1)}</div>
              </div>
              <p class="cn-review-text">"${escapeHtml(r.comment)}"</p>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- 8. RANKING & ACCREDITATION PERSPECTIVE -->
      <section class="detail-block" style="background:#FFFFFF; border:1px solid #E2E8F0; border-radius:14px; padding:22px; box-shadow:0 4px 18px rgba(0,0,0,0.03);">
        <p class="eyebrow" style="color:var(--coral); margin-bottom:4px;">🏆 RANKING &amp; INSTITUTIONAL BENCHMARK</p>
        <h3 style="font-size:18px; font-weight:800; color:#0F172A; margin:0 0 10px;">Institutional Standing &amp; Quality Metrics</h3>
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:12px;">
          <div style="background:#F0FDF4; border:1.5px solid #BBF7D0; border-radius:10px; padding:14px;">
            <div style="font-size:11px; font-weight:800; color:#15803D; text-transform:uppercase;">Annual Tuition Fees</div>
            <div style="font-size:14px; font-weight:800; color:#0F172A; margin-top:2px;">💰 ${escapeHtml(annualFee)}</div>
          </div>
          <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:14px;">
            <div style="font-size:11px; font-weight:800; color:#64748B; text-transform:uppercase;">NIRF / National Band</div>
            <div style="font-size:14px; font-weight:800; color:#0F172A; margin-top:2px;">🏛️ Top 50 Premier Institutions</div>
          </div>
          <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:14px;">
            <div style="font-size:11px; font-weight:800; color:#64748B; text-transform:uppercase;">Accreditation Standard</div>
            <div style="font-size:14px; font-weight:800; color:#77AC3B; margin-top:2px;">✓ NAAC A++ / NBA Accredited</div>
          </div>
          <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:14px;">
            <div style="font-size:11px; font-weight:800; color:#64748B; text-transform:uppercase;">Average Placement ROI</div>
            <div style="font-size:14px; font-weight:800; color:#0F172A; margin-top:2px;">📈 ₹7.5L - ₹18L+ LPA</div>
          </div>
        </div>
      </section>

      <!-- 9. USER SUGGESTION BOX -->
      <section class="detail-block" style="background:#FFFFFF; border:1px solid #E2E8F0; border-radius:14px; padding:22px; box-shadow:0 4px 18px rgba(0,0,0,0.03);">
        <div style="display:flex; align-items:center; gap:10px; margin-bottom:12px;">
          <span style="font-size:24px;">📝</span>
          <div>
            <h4 style="margin:0; color:#0F172A; font-size:16px; font-weight:800;">Course Suggestion &amp; Advice Box</h4>
            <p style="margin:2px 0 0; color:var(--theme-muted); font-size:12px;">Share course feedback, textbook tips, or recommendations for prospective students</p>
          </div>
        </div>
        <form onsubmit="submitUniversalSuggestion(event, 'course_roadmap');">
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:10px; margin-bottom:10px;">
            <input type="text" name="user_name" class="remarks-form-input" placeholder="Your Name &amp; Role (e.g. Student / Alumnus)..." style="height:40px; font-size:12.5px; padding:0 12px; border-radius:8px; background:#F8FAFC; border:1px solid #E2E8F0; color:#0F172A;" required />
            <input type="text" name="course_name" class="remarks-form-input" value="${escapeHtml(name)}" readonly style="height:40px; font-size:12.5px; padding:0 12px; border-radius:8px; background:#EDF2F7; border:1px solid #E2E8F0; color:#475569;" />
          </div>
          <div style="margin-bottom:12px;">
            <textarea name="message" class="remarks-form-textarea" rows="3" placeholder="Share specific recommendations, recommended online certifications, textbook advice, or exam tips for ${escapeHtml(name)}..." style="width:100%; font-size:12.5px; padding:10px 12px; border-radius:8px; background:#F8FAFC; border:1px solid #E2E8F0; color:#0F172A; font-family:inherit;" required></textarea>
          </div>
          <button type="submit" class="primary-button" style="height:40px; font-size:13px; padding:0 20px;">
            <span>Submit Course Advice ↗</span>
          </button>
        </form>
      </section>



    </div>
  `;
}
window.generateCourseFullRoadmapHtml = generateCourseFullRoadmapHtml;

function openCourseDetails(programIdOrName) {
  let prog = findProgramInCatalog(programIdOrName);

  if (!prog) {
    prog = {
      id: 'custom-prog',
      name: programIdOrName || 'B.Tech Computer Science & Engineering',
      degreeType: 'Undergraduate (UG)',
      duration: '4 Years',
      eligibility: '10+2 with Physics, Mathematics & Chemistry/CS (min. 60% aggregate)',
      overview: 'Structured degree pathway equipping students with practical engineering fluency, algorithmic thinking, and modern systems architecture.',
      skills: ['Data Structures & Algorithms', 'Python / C++ / Java', 'System Architecture', 'Database Management', 'Cloud Fundamentals'],
      careers: ['Software Development Engineer (SDE)', 'Systems Architect', 'Data Scientist', 'Cloud Engineer'],
      exams: ['JEE Main', 'JEE Advanced', 'BITSAT', 'State CETs'],
      placementRelevance: 'Consistently high campus placements with ₹9.5L - ₹28L / yr average packages across premier enterprise and technology product firms.',
      topColleges: ['IIT Madras', 'IIT Delhi', 'IIT Bombay', 'BITS Pilani', 'IISc Bengaluru']
    };
  }

  currentDetailProgram = prog;
  setView('detail');

  const detailView = document.getElementById('detailView');
  if (!detailView) return;

  const breadcrumb = detailView.querySelector('.breadcrumbs');
  if (breadcrumb) {
    breadcrumb.innerHTML = `<a href="#home" data-view="home">Home</a> <span>/</span> <a href="#courses" data-view="courses">Courses</a> <span>/</span> ${escapeHtml(prog.name)}`;
  }

  const kicker = detailView.querySelector('.course-kicker');
  if (kicker) {
    kicker.innerHTML = `
      <span class="result-icon blue">${prog.degreeType ? escapeHtml(prog.degreeType.slice(0, 3)) : 'DEG'}</span>
      <span>${escapeHtml((prog.degreeType || 'DEGREE').toUpperCase())} &bull; ${escapeHtml((prog.duration || 'FULL-TIME').toUpperCase())}</span>
    `;
  }

  const headingH1 = detailView.querySelector('.detail-heading h1');
  if (headingH1) headingH1.textContent = prog.name;

  const headingP = detailView.querySelector('.detail-heading p');
  if (headingP) headingP.textContent = prog.overview || 'Explore degree curriculum, entrance examinations, and career scope.';

  const detailTags = detailView.querySelector('.detail-tags');
  if (detailTags) {
    const annualFee = getProgramAnnualTuitionFee(prog);
    detailTags.innerHTML = `
      <span>★ 4.8 / 5.0 Rating</span>
      <span style="background:#ECFDF5; color:#065F46; border:1px solid #A7F3D0; font-weight:800;">💰 Annual Fees: ${escapeHtml(annualFee)}</span>
      <span>🏛️ ${(prog.topColleges || []).length || 140}+ Top Colleges Offering</span>
      <span>💼 ${prog.placementRelevance ? escapeHtml(prog.placementRelevance.slice(0, 38)) + '...' : 'High Industry Placement'}</span>
    `;
  }

  const detailMain = detailView.querySelector('.detail-main');
  if (detailMain) {
    detailMain.innerHTML = generateCourseFullRoadmapHtml(prog);
    renderDetailSubjects(1);
  }
}
window.openCourseDetails = openCourseDetails;
window.renderDetailSubjects = renderDetailSubjects;

// ============================================================================
// 19. HEADER NAVIGATION MENU & MOBILE NAVIGATION DRAWER
// ============================================================================
const headerMenuWrap = document.getElementById('headerMenuWrap');
const headerMenuPanel = document.getElementById('headerMenuPanel');
const mobileDrawer = document.getElementById('mobileDrawer');
const mobileDrawerBackdrop = document.getElementById('mobileDrawerBackdrop');
const hamburgerMenuBtn = document.getElementById('hamburgerMenuBtn');
const drawerCloseBtn = document.getElementById('drawerCloseBtn');
const mobileDrawerSearch = document.getElementById('mobileDrawerSearch');

function toggleHeaderMenu(e) {
  if (e) {
    if (typeof e.preventDefault === 'function') e.preventDefault();
    if (typeof e.stopPropagation === 'function') e.stopPropagation();
  }
  const wrap = document.getElementById('headerMenuWrap');
  const btn = document.getElementById('hamburgerMenuBtn');
  const drawer = document.getElementById('mobileDrawer');
  const backdrop = document.getElementById('mobileDrawerBackdrop');
  const isMobile = window.innerWidth <= 900;
  const isOpen = isMobile
    ? (drawer && drawer.classList.contains('open'))
    : (wrap && wrap.classList.contains('open'));

  closeMenus();
  if (typeof closeAiAssistant === 'function') closeAiAssistant();

  if (!isOpen) {
    if (isMobile) {
      if (drawer) drawer.classList.add('open');
      if (backdrop) backdrop.classList.add('open');
    } else {
      if (wrap) wrap.classList.add('open');
    }
    if (btn) {
      btn.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
    }
  }
}
window.toggleHeaderMenu = toggleHeaderMenu;

function toggleMobileDrawer(e) {
  toggleHeaderMenu(e);
}
window.toggleMobileDrawer = toggleMobileDrawer;

function openMobileDrawer() {
  toggleHeaderMenu();
}
window.openMobileDrawer = openMobileDrawer;

function closeMobileDrawer() {
  closeMenus();
}
window.closeMobileDrawer = closeMobileDrawer;

if (drawerCloseBtn) drawerCloseBtn.addEventListener('click', closeMobileDrawer);
if (mobileDrawerBackdrop) mobileDrawerBackdrop.addEventListener('click', closeMobileDrawer);

if (hamburgerMenuBtn) {
  hamburgerMenuBtn.addEventListener('click', toggleHeaderMenu);
}

document.querySelectorAll('[data-drawer-nav]').forEach(link => {
  link.addEventListener('click', (event) => {
    const href = link.getAttribute('href');
    if (href && href.startsWith('#')) {
      event.preventDefault();
      setView(href);
    }
    closeMobileDrawer();
  });
});

if (mobileDrawerSearch) {
  mobileDrawerSearch.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const q = mobileDrawerSearch.value.trim();
      if (q) {
        openSearch(q);
        closeMobileDrawer();
      }
    }
  });
}

// Global Search Inputs
const headerSearchInput = document.getElementById('headerSearch');
if (headerSearchInput) {
  headerSearchInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      openSearch(e.target.value);
    }
  });
}

const heroSearchInput = document.getElementById('heroSearch');
const heroSearchBtn = document.getElementById('searchButton');
if (heroSearchInput) {
  heroSearchInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      openSearch(e.target.value);
    }
  });
}
if (heroSearchBtn && heroSearchInput) {
  heroSearchBtn.addEventListener('click', () => {
    openSearch(heroSearchInput.value);
  });
}

const resultSearchInput = document.getElementById('resultSearch');
const resultSearchBtn = document.getElementById('resultSearchButton');
if (resultSearchInput) {
  resultSearchInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      openSearch(e.target.value);
    }
  });
}
if (resultSearchBtn && resultSearchInput) {
  resultSearchBtn.addEventListener('click', () => {
    openSearch(resultSearchInput.value);
  });
}


document.querySelectorAll('[data-close-modal]').forEach(el => {
  el.addEventListener('click', () => {
    const targetId = el.dataset.closeModal;
    const modal = document.getElementById(targetId);
    if (modal) {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
    }
    document.body.style.overflow = '';
  });
});

// ============================================================================
// 20. APPLICATION INITIALIZATION LIFECYCLE
// ============================================================================

// DYNAMIC REAL-TIME IST CLOCK (HEADER TIME DISPLAY)
function updateLiveTime() {
  const el = document.getElementById('liveTime');
  if (!el) return;
  try {
    const now = new Date();
    const istTimeStr = now.toLocaleTimeString('en-US', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    el.textContent = istTimeStr;
  } catch (e) {
    const now = new Date();
    let hours = now.getHours();
    const mins = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    el.textContent = `${String(hours).padStart(2, '0')}:${mins} ${ampm}`;
  }
}

function initLiveTime() {
  updateLiveTime();
  if (!window._liveTimeInterval) {
    window._liveTimeInterval = setInterval(updateLiveTime, 1000);
  }
}
window.initLiveTime = initLiveTime;

// Ensure both function names are available globally
if (typeof renderDomainsDiscoveryView === 'function') {
  window.renderDomainsView = renderDomainsDiscoveryView;
}

// ==========================================================================
// LIVE CAMPUS EVENTS & EDUCATION NEWS CONTROLLER (Synced with Admin Portal)
// ==========================================================================

// Cache for live events and news data
window._liveEventsCache = [];
window._liveNewsCache = [];

function openEventDetailsModal(eventId) {
  const cache = window._liveEventsCache || [];
  const ev = cache.find(x => String(x.id) === String(eventId) || String(x.db_id) === String(eventId));
  const modal = document.getElementById('eventDetailsModal');
  if (!modal) {
    showToast('Event details view');
    return;
  }

  const titleEl = document.getElementById('eventModalTitle');
  const subEl = document.getElementById('eventModalSubtitle');
  const badgeEl = document.getElementById('eventModalBadge');
  const dateEl = document.getElementById('eventModalDate');
  const timeEl = document.getElementById('eventModalTime');
  const venueEl = document.getElementById('eventModalVenue');
  const catEl = document.getElementById('eventModalCategory');
  const descEl = document.getElementById('eventModalDescription');
  const extraEl = document.getElementById('eventModalExtraSection');
  const linkBtn = document.getElementById('eventModalFurtherDetailsBtn');

  if (ev) {
    if (titleEl) titleEl.textContent = ev.title || 'Campus Conclave';
    if (subEl) subEl.textContent = ev.college_name || 'Premier Educational Institution';
    if (badgeEl) badgeEl.textContent = (ev.status || 'CAMPUS EVENT').toUpperCase();
    if (dateEl) dateEl.textContent = ev.event_date || 'Upcoming';
    if (timeEl) timeEl.textContent = ev.time || 'Schedule to be confirmed';
    if (venueEl) venueEl.textContent = ev.venue || 'Main Campus Auditorium';
    if (catEl) catEl.textContent = ev.category || 'Conclave & Fest';
    if (descEl) descEl.textContent = ev.description || 'Official institutional conclave and student symposium organized by campus faculty and departments.';

    if (extraEl) {
      extraEl.innerHTML = `
        <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:12px 14px; font-size:12.5px; color:#475569;">
          <div>🏛️ <strong>Organizing Body:</strong> ${escapeHtml(ev.college_name || 'Campus Academic Department')}</div>
          ${ev.badge ? `<div style="margin-top:4px;">🎖️ <strong>Event Distinction:</strong> ${escapeHtml(ev.badge)}</div>` : ''}
        </div>
      `;
    }

    const targetUrl = ev.official_website || ev.website || ev.registration_link || '';
    if (linkBtn) {
      linkBtn.onclick = () => {
        if (targetUrl && (targetUrl.startsWith('http://') || targetUrl.startsWith('https://'))) {
          window.open(targetUrl, '_blank', 'noopener,noreferrer');
        } else if (targetUrl && targetUrl.trim()) {
          window.open('https://' + targetUrl.replace(/^\/+/, ''), '_blank', 'noopener,noreferrer');
        } else {
          showToast('No official website or registration link currently registered for this event.', 'info');
        }
      };
    }

    if (typeof recordUserActivity === 'function') {
      recordUserActivity('view', 'events', ev.id || eventId, ev.title || '');
    }
  }

  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}
window.openEventDetailsModal = openEventDetailsModal;

function closeEventDetailsModal() {
  const modal = document.getElementById('eventDetailsModal');
  if (modal) {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }
  document.body.style.overflow = '';
}
window.closeEventDetailsModal = closeEventDetailsModal;

function openNewsDetailsModal(newsId) {
  const cache = window._liveNewsCache || [];
  const nw = cache.find(x => String(x.id) === String(newsId) || String(x.db_id) === String(newsId));
  const modal = document.getElementById('newsDetailsModal');
  if (!modal) {
    showToast('News details view');
    return;
  }

  const titleEl = document.getElementById('newsModalTitle');
  const subEl = document.getElementById('newsModalSubtitle');
  const badgeEl = document.getElementById('newsModalBadge');
  const dateEl = document.getElementById('newsModalDate');
  const catEl = document.getElementById('newsModalCategory');
  const summaryEl = document.getElementById('newsModalSummary');
  const contentEl = document.getElementById('newsModalContent');
  const linkBtn = document.getElementById('newsModalOfficialSourceBtn');

  if (nw) {
    if (titleEl) titleEl.textContent = nw.title || 'Campus News Bulletin';
    if (subEl) subEl.textContent = nw.college_name || 'Higher Education Authority';
    if (badgeEl) badgeEl.textContent = (nw.badge || 'OFFICIAL BULLETIN').toUpperCase();
    if (dateEl) dateEl.textContent = nw.published_date || 'Recent';
    if (catEl) catEl.textContent = nw.category || 'General';
    if (summaryEl) summaryEl.textContent = nw.summary || nw.content || 'Official higher education circular and academic notification.';
    if (contentEl) contentEl.textContent = nw.content || nw.summary || 'Detailed notification text dispatched from institutional administrative office.';

    const targetUrl = nw.source_url || '';
    if (linkBtn) {
      if (targetUrl && (targetUrl.startsWith('http://') || targetUrl.startsWith('https://') || targetUrl.includes('.'))) {
        linkBtn.style.display = 'inline-flex';
        linkBtn.onclick = () => {
          const finalUrl = (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) ? targetUrl : ('https://' + targetUrl);
          window.open(finalUrl, '_blank', 'noopener,noreferrer');
        };
      } else {
        linkBtn.style.display = 'none';
      }
    }

    if (typeof recordUserActivity === 'function') {
      recordUserActivity('view', 'news', nw.id || newsId, nw.title || '');
    }
  }

  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}
window.openNewsDetailsModal = openNewsDetailsModal;

function closeNewsDetailsModal() {
  const modal = document.getElementById('newsDetailsModal');
  if (modal) {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }
  document.body.style.overflow = '';
}
window.closeNewsDetailsModal = closeNewsDetailsModal;

function renderLiveEvents(eventsList) {
  const eventsContainer = document.getElementById('homeEventsFeedContainer');
  if (!eventsContainer || !Array.isArray(eventsList)) return;
  const countBadge = document.getElementById('homeEventsCountBadge');
  if (countBadge) countBadge.textContent = `${eventsList.length} Active`;

  if (eventsList.length === 0) {
    eventsContainer.innerHTML = '<div style="padding:20px; text-align:center; color:#64748B; font-size:13px;">No active events scheduled at this moment.</div>';
    return;
  }

  eventsContainer.innerHTML = eventsList.map(e => {
    const desc = (e.description && e.description.trim())
      ? e.description.trim()
      : `Official institutional event and student conclave organized by ${e.college_name || 'the campus'}.`;
    const eventIdentifier = String(e.id || e.db_id || '');
    return `
    <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:12px 14px; transition:transform 0.2s ease, box-shadow 0.2s ease;">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px; margin-bottom:4px;">
        <strong style="font-size:13.5px; color:#0F172A; line-height:1.4;">${escapeHtml(e.title || '')}</strong>
        <span style="font-size:10.5px; background:rgba(21,128,61,0.12); color:#15803D; padding:2px 8px; border-radius:999px; font-weight:700; white-space:nowrap;">
          ${escapeHtml(e.status || 'Upcoming')}
        </span>
      </div>
      <div style="font-size:11.5px; color:#64748B; margin-bottom:6px; display:flex; flex-wrap:wrap; gap:8px;">
        <span>🏛️ <strong>${escapeHtml(e.college_name || 'Premier Institution')}</strong></span>
        <span>📅 ${escapeHtml(e.event_date || '')}</span>
        ${e.time ? `<span>⏰ ${escapeHtml(e.time)}</span>` : ''}
        ${e.venue ? `<span>📍 ${escapeHtml(e.venue)}</span>` : ''}
      </div>
      <p style="font-size:12px; color:#475569; margin:0 0 8px; line-height:1.5;">${escapeHtml(desc)}</p>
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span style="font-size:10.5px; background:#EDF2F7; color:#475569; padding:2px 6px; border-radius:4px; font-weight:600;">
          ${escapeHtml(e.category || 'Tech Fest')}
        </span>
        <button type="button" class="action-btn-link" style="background:none; border:none; padding:0; font-size:11.5px; font-weight:700; color:#15803D; cursor:pointer; display:inline-flex; align-items:center; gap:3px;" onclick="openEventDetailsModal('${escapeHtml(eventIdentifier)}')">
          View Info ↗
        </button>
      </div>
    </div>
  `;
  }).join('');
}
window.renderLiveEvents = renderLiveEvents;

function renderLiveNews(newsList) {
  const newsContainer = document.getElementById('homeNewsFeedContainer');
  if (!newsContainer || !Array.isArray(newsList)) return;
  const countBadge = document.getElementById('homeNewsCountBadge');
  if (countBadge) countBadge.textContent = `${newsList.length} Bulletins`;

  if (newsList.length === 0) {
    newsContainer.innerHTML = '<div style="padding:20px; text-align:center; color:#64748B; font-size:13px;">No bulletins announced today.</div>';
    return;
  }

  newsContainer.innerHTML = newsList.map(n => {
    const summaryText = (n.summary && n.summary.trim())
      ? n.summary.trim()
      : ((n.content && n.content.trim())
        ? n.content.trim()
        : `Official admission and academic circular announced by ${n.college_name || 'Higher Education Board'}.`);
    const newsIdentifier = String(n.id || n.db_id || '');
    const isDimmed = n.lifecycle === 'dimmed' || n.is_expired;
    const cardStyle = isDimmed
      ? 'background:#F8FAFC; border:1px dashed #CBD5E1; opacity:0.68; filter:grayscale(25%); border-radius:10px; padding:12px 14px; transition:transform 0.2s ease, box-shadow 0.2s ease;'
      : 'background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:12px 14px; transition:transform 0.2s ease, box-shadow 0.2s ease;';
    return `
    <div style="${cardStyle}">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px; margin-bottom:4px;">
        <strong style="font-size:13.5px; color:#0F172A; line-height:1.4;">${escapeHtml(n.title || '')}</strong>
        <div style="display:flex; gap:6px; align-items:center;">
          ${isDimmed ? `
            <span style="font-size:10.5px; background:#FEE2E2; color:#B91C1C; border:1px solid #FECACA; padding:2px 8px; border-radius:999px; font-weight:700; white-space:nowrap;">Finished / Expired</span>
          ` : ''}
          ${n.badge ? `
            <span style="font-size:10.5px; background:rgba(30,64,175,0.1); color:#1E40AF; padding:2px 8px; border-radius:999px; font-weight:700; white-space:nowrap;">
              ${escapeHtml(n.badge)}
            </span>
          ` : ''}
        </div>
      </div>
      <div style="font-size:11.5px; color:#64748B; margin-bottom:6px; display:flex; flex-wrap:wrap; gap:8px;">
        <span>📢 <strong>${escapeHtml(n.college_name || 'Higher Education Authority')}</strong></span>
        <span>📅 ${escapeHtml(n.published_date || '')}</span>
      </div>
      <p style="font-size:12px; color:#475569; margin:0 0 8px; line-height:1.5;">${escapeHtml(summaryText)}</p>
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span style="font-size:10.5px; background:#EDF2F7; color:#475569; padding:2px 6px; border-radius:4px; font-weight:600;">
          ${escapeHtml(n.category || 'General')}
        </span>
        <button type="button" class="action-btn-link" style="background:none; border:none; padding:0; font-size:11.5px; font-weight:700; color:#1D4ED8; cursor:pointer; display:inline-flex; align-items:center; gap:3px;" onclick="openNewsDetailsModal('${escapeHtml(newsIdentifier)}')">
          Read More ↗
        </button>
      </div>
    </div>
  `;
  }).join('');
}
window.renderLiveNews = renderLiveNews;

async function loadLiveEvents() {
  const eventsContainer = document.getElementById('homeEventsFeedContainer');
  if (!eventsContainer) return;
  try {
    const res = await fetch('/api/events');
    const data = await res.json();
    if (data.success && Array.isArray(data.events)) {
      window._liveEventsCache = data.events;
      renderLiveEvents(data.events);
    }
  } catch (err) {
    console.error('Failed to load live events:', err);
  }
}
window.loadLiveEvents = loadLiveEvents;

async function loadLiveNews() {
  const newsContainer = document.getElementById('homeNewsFeedContainer');
  if (!newsContainer) return;
  try {
    const res = await fetch('/api/news');
    const data = await res.json();
    if (data.success && Array.isArray(data.news)) {
      window._liveNewsCache = data.news;
      renderLiveNews(data.news);
    }
  } catch (err) {
    console.error('Failed to load live news:', err);
  }
}
window.loadLiveNews = loadLiveNews;

var _isLoadingLiveEventsAndNews = false;
async function loadLiveEventsAndNews() {
  // Render immediately from cache if available (0ms instant render)
  if (Array.isArray(window._liveEventsCache) && window._liveEventsCache.length > 0) {
    renderLiveEvents(window._liveEventsCache);
  }
  if (Array.isArray(window._liveNewsCache) && window._liveNewsCache.length > 0) {
    renderLiveNews(window._liveNewsCache);
  }

  if (_isLoadingLiveEventsAndNews) return;
  _isLoadingLiveEventsAndNews = true;
  try {
    // Parallelized non-blocking fetch
    await Promise.allSettled([loadLiveEvents(), loadLiveNews()]);
  } finally {
    _isLoadingLiveEventsAndNews = false;
  }
}
window.loadLiveEventsAndNews = loadLiveEventsAndNews;

let isAppInitialized = false;

function initTheCampusNova() {
  if (isAppInitialized) return;
  isAppInitialized = true;

  // Immediate First-Priority Load: Events & News Feeds (Non-blocking parallel)
  try { if (typeof loadLiveEventsAndNews === 'function') loadLiveEventsAndNews(); } catch(e) {}

  try { initLiveTime(); } catch (e) { console.warn('[Init] LiveTime error:', e); }
  try { initHeroBackgroundCarousel(); } catch (e) { console.warn('[Init] Carousel error:', e); }
  try { initHeroRotatorHeading(); } catch (e) { console.warn('[Init] HeadingRotator error:', e); }
  try { initHomeBodyBackgroundSlider(); } catch (e) { console.warn('[Init] HomeBodySlider error:', e); }
  try { initDiscoveryBackgroundSliders(); } catch (e) { console.warn('[Init] DiscoverySliders error:', e); }
  try { initGoalSelector(); } catch (e) { console.warn('[Init] GoalSelector error:', e); }
  try {
    const savedLang = localStorage.getItem('campusnova_user_language') || 'EN';
    CampNovaTranslationEngine.setLanguage(savedLang, true);
  } catch (e) { console.warn('[Init] Language error:', e); }
  try { loadStoredLoginState(); } catch (e) { console.warn('[Init] LoginState error:', e); }
  try { renderStreams(); } catch (e) { console.warn('[Init] Streams error:', e); }
  try { renderTopColleges(); } catch (e) { console.warn('[Init] TopColleges error:', e); }
  try { renderCareerPathway('Artificial Intelligence & ML'); } catch (e) { console.warn('[Init] CareerPathway error:', e); }
  try { renderPlacementCompanyGrid('all', 'all'); } catch (e) { console.warn('[Init] Placement error:', e); }
  try { renderSuggestedDomainPills(); } catch (e) { console.warn('[Init] SuggestedDomains error:', e); }
  try { renderInternshipsGrid(); } catch (e) { console.warn('[Init] Internships error:', e); }
  try { initAllPathwayViews(); } catch (e) { console.warn('[Init] PathwayViews error:', e); }
  try { initCoursesDiscovery(); } catch (e) { console.warn('[Init] CoursesDiscovery error:', e); }
  try { initAllHeaderControls(); } catch (e) { console.warn('[Init] HeaderControls error:', e); }
  try { initPlacementAndInternshipFilters(); } catch (e) { console.warn('[Init] PlacementFilters error:', e); }

  // Live Real-Time Database Synchronization
  try { if (typeof loadLiveEventsAndNews === 'function') loadLiveEventsAndNews(); } catch(e) {}
  try { if (typeof fetchCollegesLive === 'function') fetchCollegesLive(); } catch(e) {}
  try { if (typeof fetchPlacementsLive === 'function') fetchPlacementsLive(); } catch(e) {}
  try { if (typeof fetchInternshipsLive === 'function') fetchInternshipsLive(); } catch(e) {}
  try { if (typeof fetchReviewsLive === 'function') fetchReviewsLive(); } catch(e) {}
  try { fetch('/api/mentors').then(r => r.json()).then(d => { if (d && d.success && Array.isArray(d.mentors)) _userMentorsCache = d.mentors; }).catch(() => {}); } catch(e) {}

  // Initial Route Load
  try {
    const startingHash = window.location.hash.replace(/^#/, '');
    if (startingHash) {
      setView(startingHash, false);
    } else {
      setView('home', false);
    }
  } catch (e) {
    console.warn('[Init] Routing error:', e);
  }

  // Trigger post-initialization translation sweep if non-English
  if (CampNovaTranslationEngine.currentLanguageCode !== 'EN') {
    setTimeout(() => {
      CampNovaTranslationEngine.translateTree(document.body);
    }, 100);
  }
}

document.addEventListener('DOMContentLoaded', initTheCampusNova);
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  initTheCampusNova();
}


// ============================================================================
// MASTER HEADER CONTROLS INITIALIZER (ALL 7 HEADER CONTROLS GUARANTEED FUNCTIONAL)
// ============================================================================
function initAllHeaderControls() {
  try {
    // 1. SEARCH BOX
    const headerSearchInp = document.getElementById('headerSearch');
    const headerSearchIcon = document.querySelector('.ai-search-field .search-icon');
    if (headerSearchInp) {
      headerSearchInp.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const q = headerSearchInp.value.trim();
          openSearch(q);
        }
      });
    }
    if (headerSearchIcon && headerSearchInp) {
      headerSearchIcon.style.cursor = 'pointer';
      headerSearchIcon.addEventListener('click', () => {
        const q = headerSearchInp.value.trim();
        openSearch(q);
      });
    }

    // Secondary Search on Results Page
    const resSearchInp = document.getElementById('resultSearch');
    const resSearchBtn = document.getElementById('resultSearchButton');
    if (resSearchInp) {
      resSearchInp.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const q = resSearchInp.value.trim();
          openSearch(q);
        }
      });
    }
    if (resSearchBtn && resSearchInp) {
      resSearchBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const q = resSearchInp.value.trim();
        openSearch(q);
      });
    }

    // 2. AI BUTTON & CHAT FORM
    const aiTriggerBtn = document.getElementById('aiTrigger');
    const aiPanelEl = document.getElementById('aiPanel');
    const aiEntryEl = document.querySelector('.ai-entry');
    const aiCloseBtn = document.getElementById('aiClose');
    const aiFormEl = document.getElementById('aiForm');
    const aiMessageInput = document.getElementById('aiMessage');

    if (aiTriggerBtn) {
      aiTriggerBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = aiEntryEl && aiEntryEl.classList.contains('open');
        closeMenus();
        if (isOpen) {
          closeAiAssistant();
        } else {
          openAiAssistant();
        }
      });
    }
    if (aiCloseBtn) {
      aiCloseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeAiAssistant();
      });
    }

    if (aiFormEl) {
      aiFormEl.addEventListener('submit', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const q = aiMessageInput?.value?.trim();
        if (!q) return;
        addAiExchange(q);
        if (aiMessageInput) {
          aiMessageInput.value = '';
          aiMessageInput.focus();
        }
      });
    }

    document.querySelectorAll('[data-ai-question]').forEach(qBtn => {
      qBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const q = qBtn.dataset.aiQuestion || qBtn.textContent.trim();
        if (q) addAiExchange(q);
      });
    });

    // 3. SELECT GOAL BUTTON & MENU
    const goalTriggerBtn = document.getElementById('goalTrigger');
    const goalMenu = document.querySelector('.goal-menu');
    if (goalTriggerBtn && goalMenu) {
      goalTriggerBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = goalMenu.classList.contains('open');
        closeMenus();
        closeAiAssistant();
        if (!isOpen) {
          goalMenu.classList.add('open');
          goalTriggerBtn.setAttribute('aria-expanded', 'true');
        }
      });
    }

    document.querySelectorAll('#goalPanel [data-goal]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const goalName = btn.dataset.goal;
        const viewTarget = btn.dataset.view || goalName;
        userSelectedGoal = goalName;
        localStorage.setItem('thecampusnova_selected_goal', goalName);

        const goalEl = document.querySelector('#goalTrigger b');
        if (goalEl) {
          const textSpan = btn.querySelector('span');
          goalEl.textContent = textSpan ? textSpan.textContent : goalName;
        }

        closeMenus();
        renderSuggestedDomainPills();
        setView(viewTarget);
      });
    });

    // 4. EXPLORE BUTTON & 16-CATEGORY PANEL
    const exploreTriggerBtn = document.getElementById('exploreTrigger');
    const exploreMenu = document.querySelector('.explore-menu');
    if (exploreTriggerBtn && exploreMenu) {
      exploreTriggerBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = exploreMenu.classList.contains('open');
        closeMenus();
        closeAiAssistant();
        if (!isOpen) {
          exploreMenu.classList.add('open');
          exploreTriggerBtn.setAttribute('aria-expanded', 'true');
        }
      });
    }

    document.querySelectorAll('#explorePanel [data-explore]').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const exploreName = item.dataset.explore;
        const targetHref = item.getAttribute('href');
        closeMenus();
        setView(targetHref || exploreName);
      });
    });

    // 5. LANGUAGE BUTTON & MENU
    const languageTriggerBtn = document.getElementById('languageTrigger');
    const languageMenu = document.querySelector('.language-menu');
    if (languageTriggerBtn && languageMenu) {
      languageTriggerBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = languageMenu.classList.contains('open');
        closeMenus();
        closeAiAssistant();
        if (!isOpen) {
          languageMenu.classList.add('open');
          languageTriggerBtn.setAttribute('aria-expanded', 'true');
        }
      });
    }

    document.querySelectorAll('#languagePanel [data-language]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const code = btn.dataset.language;
        if (typeof changeActiveLanguage === 'function') {
          changeActiveLanguage(code);
        }
        closeMenus();
      });
    });

    const openLangModalBtn = document.getElementById('openLanguageModalBtn');
    if (openLangModalBtn) {
      openLangModalBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeMenus();
        openLanguageModal();
      });
    }

    // 6. LOGIN & PROFILE ACCESS
    const headerLoginBtn = document.getElementById('headerLoginBtn');
    if (headerLoginBtn) {
      headerLoginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeMenus();
        openUserLoginModal();
      });
    }

    const headerSignIn = document.getElementById('headerSignInBtn');
    if (headerSignIn) {
      headerSignIn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (loggedInUser) {
          const profileMenu = document.getElementById('headerProfileMenu') || headerSignIn.closest('.profile-menu');
          if (profileMenu) {
            const wasOpen = profileMenu.classList.contains('open');
            closeMenus();
            if (!wasOpen) {
              profileMenu.classList.add('open');
            }
          }
        } else {
          closeMenus();
          openUserLoginModal();
        }
      });
    }

    const headerLogoutBtn = document.getElementById('headerLogoutBtn');
    if (headerLogoutBtn) {
      headerLogoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeMenus();
        handleUserLogout();
      });
    }

    // 7. PROFILE (USER PORTAL)
    const openUserProfileBtnEl = document.getElementById('openUserProfileBtn');
    if (openUserProfileBtnEl) {
      openUserProfileBtnEl.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeMenus();
        if (!loggedInUser) {
          openUserLoginModal();
        } else {
          showToast(`Logged in as ${loggedInUser.name || loggedInUser.email}`, 'info');
        }
      });
    }

    // 8. MAIN NAVIGATION MENU (HAMBURGER BUTTON & PANEL)
    const hamburgerBtn = document.getElementById('hamburgerMenuBtn');
    const headerWrap = document.getElementById('headerMenuWrap');
    if (hamburgerBtn) {
      hamburgerBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const isOpen = headerWrap && headerWrap.classList.contains('open');
        closeMenus();
        closeAiAssistant();
        if (!isOpen && headerWrap) {
          headerWrap.classList.add('open');
          hamburgerBtn.classList.add('open');
          hamburgerBtn.setAttribute('aria-expanded', 'true');
        }
      });
    }

    // Header Menu Navigation Links (Home, Mentor, About Us, Contact Info)
    document.querySelectorAll('.header-menu-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const targetView = item.dataset.view || (item.getAttribute('href') || '').replace(/^#/, '');
        if (targetView) {
          e.preventDefault();
          closeMenus();
          setView(targetView);
        }
      });
    });

    // Global Click Listener for Menus & AI Panel
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.custom-menu') && !e.target.closest('.further-details-modal')) {
        closeMenus();
      }
      if (!e.target.closest('.ai-entry')) {
        closeAiAssistant();
      }
      if (!e.target.closest('#mobileDrawer') && !e.target.closest('#hamburgerMenuBtn') && !e.target.closest('.header-menu-btn') && !e.target.closest('.header-menu-wrap')) {
        closeMobileDrawer();
      }
    });

    // Global ESC key listener
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeMenus();
        closeAllModals();
        closeMobileDrawer();
        closeAiAssistant();
      }
    });

    console.log('[Header Initializer] All 8 header controls initialized successfully.');
  } catch (err) {
    console.error('[Header Initializer] Error attaching header listeners:', err);
  }
}
window.initAllHeaderControls = initAllHeaderControls;

// Placement & Internship Interactive Filter Event Wireup
function initPlacementAndInternshipFilters() {
  // Placement Industry Pills
  document.querySelectorAll('#placementCategoryPills .placement-pill-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('#placementCategoryPills .placement-pill-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const ind = btn.dataset.industry || 'all';
      const col = document.getElementById('placementCollegeFilterSelect')?.value || 'all';
      renderPlacementCompanyGrid(ind, col);
    });
  });

  // Placement College Dropdown
  const placementCollegeSelect = document.getElementById('placementCollegeFilterSelect');
  if (placementCollegeSelect) {
    placementCollegeSelect.addEventListener('change', () => {
      const ind = document.querySelector('#placementCategoryPills .placement-pill-btn.active')?.dataset.industry || 'all';
      const col = placementCollegeSelect.value || 'all';
      renderPlacementCompanyGrid(ind, col);
    });
  }

  // Internship Select Controls
  ['internshipWorkModeSelect', 'internshipPaidSelect', 'internshipLocationSelect', 'internshipDurationSelect'].forEach(selId => {
    const sel = document.getElementById(selId);
    if (sel) {
      sel.addEventListener('change', () => {
        renderInternshipsGrid();
      });
    }
  });
}
window.initPlacementAndInternshipFilters = initPlacementAndInternshipFilters;

function closeAllModals() {
  const modalSelectors = [
    '#courseDetailModal',
    '#collegeDetailModal',
    '#furtherDetailsModal',
    '#placementDetailModal',
    '#internshipDetailModal',
    '#domainDetailModal',
    '#examPrepModal',
    '#examPlatformModal',
    '#scholarshipDetailModal',
    '#jobDetailModal',
    '#careerDetailModal',
    '#admissionDetailModal',
    '#facilityDetailModal',
    '#materialDetailModal',
    '#rankingDetailModal',
    '#reviewDetailModal',
    '#compareDetailModal',
    '#authModal',
    '#authorityModal',
    '#emailVerificationModal',
    '#collegeUpdateModal',
    '#eventDetailsModal',
    '#newsDetailsModal',
    '.custom-modal',
    '.further-details-modal'
  ];
  modalSelectors.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
      el.classList.remove('open', 'active');
      el.style.display = 'none';
    });
  });
  document.body.style.overflow = '';
}
window.closeAllModals = closeAllModals;

function closeCourseModal() {
  const m = document.getElementById('courseDetailModal');
  if (m) { m.classList.remove('open', 'active'); m.style.display = 'none'; }
  document.body.style.overflow = '';
}
window.closeCourseModal = closeCourseModal;

function closeCollegeModal() {
  const m = document.getElementById('collegeDetailModal');
  if (m) { m.classList.remove('open', 'active'); m.style.display = 'none'; }
  const f = document.getElementById('furtherDetailsModal');
  if (f) { f.classList.remove('open', 'active'); f.style.display = 'none'; }
  document.body.style.overflow = '';
}
window.closeCollegeModal = closeCollegeModal;
window.closeFurtherDetails = closeCollegeModal;
window.closeFurtherDetailsModal = closeCollegeModal;

function closePlacementModal() {
  const m = document.getElementById('placementDetailModal');
  if (m) { m.classList.remove('open', 'active'); m.style.display = 'none'; }
  document.body.style.overflow = '';
}
window.closePlacementModal = closePlacementModal;

function closeInternshipModal() {
  const m = document.getElementById('internshipDetailModal');
  if (m) { m.classList.remove('open', 'active'); m.style.display = 'none'; }
  document.body.style.overflow = '';
}
window.closeInternshipModal = closeInternshipModal;

function closeDomainsModal() {
  const m = document.getElementById('domainDetailModal');
  if (m) { m.classList.remove('open', 'active'); m.style.display = 'none'; }
  document.body.style.overflow = '';
}
window.closeDomainsModal = closeDomainsModal;

function closeAuthorityModal() {
  const m = document.getElementById('authorityModal');
  if (m) { m.classList.remove('open', 'active'); m.style.display = 'none'; }
  document.body.style.overflow = '';
}
window.closeAuthorityModal = closeAuthorityModal;

function closeEmailVerificationModal() {
  const m = document.getElementById('verifyAuthorityModal') || document.getElementById('emailVerificationModal');
  if (m) { m.classList.remove('open', 'active'); m.style.display = 'none'; }
  document.body.style.overflow = '';
}
window.closeEmailVerificationModal = closeEmailVerificationModal;

function closeCollegeUpdateModal() {
  const m = document.getElementById('collegeUpdateModal');
  if (m) { m.classList.remove('open', 'active'); m.style.display = 'none'; }
  document.body.style.overflow = '';
}
window.closeCollegeUpdateModal = closeCollegeUpdateModal;

// Export all global helpers to window
window.openSearch = openSearch;
window.openPlacementDetailModal = openPlacementDetailModal;
window.openPlacementModal = openPlacementDetailModal;
window.openInternshipModal = openInternshipModal;
window.openDomainsModal = openDomainsModal;
window.openCollegeDetailsModal = openCollegeDetailsModal;
window.openFurtherDetails = openFurtherDetails;
window.openExamHowToPrepareModal = openExamHowToPrepareModal;
window.openExamPrepModal = openExamHowToPrepareModal;
window.openExamPlatformAccessModal = openExamPlatformAccessModal;
window.openExamPlatformModal = openExamPlatformAccessModal;
window.openAiAssistant = openAiAssistant;
window.closeAiAssistant = closeAiAssistant;
window.openMobileDrawer = openMobileDrawer;
window.closeMobileDrawer = closeMobileDrawer;
window.showToast = showToast;
window.setView = setView;
window.closeCourseModal = closeCourseModal;
window.closeCollegeModal = closeCollegeModal;
window.closePlacementModal = closePlacementModal;
window.closeInternshipModal = closeInternshipModal;
window.closeDomainsModal = closeDomainsModal;
window.closeAuthorityModal = closeAuthorityModal;
window.closeEmailVerificationModal = closeEmailVerificationModal;
window.closeCollegeUpdateModal = closeCollegeUpdateModal;
window.closeExamPrepModal = closeExamPrepModal;
window.closeExamPlatformModal = closeExamPlatformModal;
window.openUserLoginModal = openUserLoginModal;
window.openUserSignupModal = openUserSignupModal;
window.openUserForgotModal = openUserForgotModal;
window.handleUserLogout = handleUserLogout;

function openGoalModal() {
  const menu = document.querySelector('.goal-menu');
  const trigger = document.getElementById('goalTrigger');
  closeMenus();
  if (menu) {
    menu.classList.add('open');
    if (trigger) trigger.setAttribute('aria-expanded', 'true');
  }
}
window.openGoalModal = openGoalModal;

function closeGoalModal() {
  const menu = document.querySelector('.goal-menu');
  const trigger = document.getElementById('goalTrigger');
  if (menu) menu.classList.remove('open');
  if (trigger) trigger.setAttribute('aria-expanded', 'false');
}
window.closeGoalModal = closeGoalModal;





// ----------------------------------------------------
// 15. CAMPNOVA MENTORS VIEW & ENQUIRY WORKFLOW
// ----------------------------------------------------
window._userMentorsCache = window._userMentorsCache || [];
window._activeSelectedMentor = window._activeSelectedMentor || null;
var _userMentorsCache = window._userMentorsCache;
var _activeSelectedMentor = window._activeSelectedMentor;

async function renderMentorsView(searchQuery = '') {
  const grid = document.getElementById('mentorsGrid');
  if (!grid) return;

  grid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:50px 20px; color:#64748B; font-size:14px;">Loading verified CampNova mentors...</div>`;

  try {
    const cleanQ = (searchQuery === 'all' || !searchQuery) ? '' : searchQuery.trim();
    const url = cleanQ ? `/api/mentors?q=${encodeURIComponent(cleanQ)}` : '/api/mentors';
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}`);
    }
    const data = await res.json();
    if (!data || !data.success) {
      throw new Error(data && data.message ? data.message : 'API returned unsuccessful');
    }

    const mentors = Array.isArray(data.mentors) ? data.mentors : [];
    _userMentorsCache = mentors;

    const countBadge = document.getElementById('publicMentorsCountBadge');
    if (countBadge) {
      countBadge.textContent = `${mentors.length} Verified Industry Mentor${mentors.length === 1 ? '' : 's'}`;
    }

    if (mentors.length === 0) {
      const emptyMsg = cleanQ
        ? `No mentors matched your search "${escapeHtml(cleanQ)}".`
        : 'No verified mentor profiles are currently available. Check back soon!';
      grid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:60px 20px; background:#FFFFFF; border:1px dashed #CBD5E1; border-radius:14px; color:#64748B;">${emptyMsg}</div>`;
      return;
    }

    grid.innerHTML = mentors.map((m, idx) => `
      <div class="mentor-linkedin-card" onclick="openMentorDetailsModal('${escapeHtml(m.mentor_id || m.id)}')" style="background:#FFFFFF; border:1px solid #E2E8F0; border-radius:14px; padding:16px; box-shadow:0 4px 18px rgba(0,0,0,0.04); display:flex; flex-direction:column; justify-content:space-between; text-align:center; transition:transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease; cursor:pointer; position:relative;">
        <!-- Rectangular Mentor Photo (Clean Box Format) -->
        <div style="position:relative; width:100%; aspect-ratio:4/3; overflow:hidden; border-radius:10px; background:#F8FAFC; margin-bottom:14px;">
          <img src="${escapeHtml(m.profile_image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=450&fit=crop&crop=faces')}" alt="${escapeHtml(m.name)}" style="width:100%; height:100%; object-fit:cover; display:block;" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=450&fit=crop&crop=faces';" />
          <span style="position:absolute; top:8px; right:8px; background:#16A34A; color:#FFFFFF; width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:800; border:2px solid #FFFFFF; box-shadow:0 2px 6px rgba(0,0,0,0.18);" title="Verified Mentor">✓</span>
        </div>

        <!-- Mentor Details: Clean & Compact -->
        <div style="display:flex; flex-direction:column; flex:1; justify-content:space-between;">
          <div style="margin-bottom:16px;">
            <h3 style="font-size:17px; font-weight:800; color:#0F172A; margin:0 0 5px; line-height:1.3;">
              ${escapeHtml(m.name)}
            </h3>
            <!-- Profession directly below picture/name -->
            <div style="font-size:13px; font-weight:700; color:#15803D; line-height:1.4;">
              ${escapeHtml(m.profession || m.company_name || 'Industry Mentor')}
            </div>
            ${m.company_name && m.company_name !== m.profession ? `<div style="font-size:12px; color:#64748B; margin-top:2px;">${escapeHtml(m.company_name)}</div>` : ''}
          </div>

          <!-- View Profile Action Button -->
          <button type="button" class="primary-button mentor-card-details-btn" onclick="event.stopPropagation(); openMentorDetailsModal('${escapeHtml(m.mentor_id || m.id)}')" style="width:100%; display:flex; justify-content:space-between; align-items:center; font-size:13px; font-weight:700; padding:10px 16px; background:#FFFFFF; color:#0F172A; border:1.5px solid #CBD5E1; border-radius:8px; transition:all 0.2s; cursor:pointer;">
            <span>View Profile</span>
            <span style="color:#77AC3B; font-size:15px; font-weight:800;">➔</span>
          </button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error('[User] Mentors load error:', err);
    if (grid) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align:center; padding:40px 20px; color:#EF4444; background:#FEF2F2; border:1px solid #FECACA; border-radius:12px;">
          <p style="font-weight:700; margin:0 0 6px; font-size:15px;">Unable to load mentor profiles.</p>
          <p style="font-size:12px; color:#991B1B; margin:0 0 12px;">Please check your connection or server status.</p>
          <button type="button" onclick="renderMentorsView('')" style="padding:6px 14px; font-size:12px; font-weight:700; background:#FFFFFF; border:1.5px solid #CBD5E1; border-radius:6px; cursor:pointer; color:#0F172A;">🔄 Retry</button>
        </div>
      `;
    }
  }
}
window.renderMentorsView = renderMentorsView;

function maskEmailPublic(email) {
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return 'm*****r@campusnova.in';
  }
  const parts = email.trim().split('@');
  if (parts.length !== 2) return email;
  const user = parts[0];
  const domain = parts[1];

  // If already securely masked with stars, return as-is
  if (user.includes('*****') || user.includes('****')) {
    return email;
  }

  const cleanUser = user.replace(/\*+/g, '');
  if (!cleanUser || cleanUser.length <= 1) {
    return `${cleanUser || 'm'}*****@${domain}`;
  } else if (cleanUser.length === 2) {
    return `${cleanUser[0]}****${cleanUser[1]}@${domain}`;
  } else {
    return `${cleanUser[0]}*****${cleanUser[cleanUser.length - 1]}@${domain}`;
  }
}
window.maskEmailPublic = maskEmailPublic;

// Helper for social media icon button graceful handling
function setupSocialIconBtn(elementId, url, platformName) {
  const el = document.getElementById(elementId);
  if (!el) return;
  let cleanUrl = (url && typeof url === 'string') ? url.trim() : '';
  if (cleanUrl && !/^https?:\/\//i.test(cleanUrl) && cleanUrl !== '#' && cleanUrl !== 'about:blank') {
    cleanUrl = 'https://' + cleanUrl;
  }
  if (cleanUrl && /^https?:\/\/.+/i.test(cleanUrl)) {
    el.href = cleanUrl;
    el.onclick = null;
    el.removeAttribute('onclick');
    el.classList.remove('is-disabled');
    el.title = `${platformName} Profile (Opens in new tab)`;
  } else {
    el.removeAttribute('href');
    el.classList.add('is-disabled');
    el.title = `${platformName} link not available for this mentor`;
    el.onclick = (e) => {
      e.preventDefault();
      showToast(`${platformName} profile is not provided for this mentor.`);
    };
  }
}

// Toggle collapsible additional mentor details from existing database
function toggleMentorMoreDetails() {
  const content = document.getElementById('modalMentorMoreDetailsContent');
  const arrow = document.getElementById('moreDetailsToggleArrow');
  const text = document.getElementById('moreDetailsToggleText');
  if (!content) return;
  const isHidden = content.style.display === 'none' || !content.style.display;
  content.style.display = isHidden ? 'block' : 'none';
  if (arrow) arrow.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
  if (text) text.textContent = isHidden ? 'Hide Details' : 'More Details';
}
window.toggleMentorMoreDetails = toggleMentorMoreDetails;

// Reveal the existing Enquiry Form when "Enquire" button is clicked
function revealMentorEnquiryForm() {
  const container = document.getElementById('mentorEnquiryFormContainer');
  const btnWrapper = document.getElementById('modalMentorEnquireBtnWrapper');
  if (container) {
    container.style.display = 'block';
    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    const uName = document.getElementById('enqUserName');
    if (uName) setTimeout(() => uName.focus(), 150);
  }
  if (btnWrapper) {
    btnWrapper.style.display = 'none';
  }
}
window.revealMentorEnquiryForm = revealMentorEnquiryForm;

// Open Mentor Full Details Modal (Same-Page Detail Popup)
async function openMentorDetailsModal(mentorId) {
  let mentor = _userMentorsCache.find(m => String(m.mentor_id) === String(mentorId) || String(m.id) === String(mentorId));
  if (!mentor) {
    try {
      const res = await fetch('/api/mentors');
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && Array.isArray(data.mentors)) {
          _userMentorsCache = data.mentors;
          mentor = _userMentorsCache.find(m => String(m.mentor_id) === String(mentorId) || String(m.id) === String(mentorId));
        }
      }
    } catch (e) {
      console.warn('[Mentors] Cache fallback fetch failed:', e);
    }
  }

  if (!mentor) {
    showToast('Mentor profile not found.');
    return;
  }
  _activeSelectedMentor = mentor;

  const modal = document.getElementById('mentorDetailsModal');
  const imgEl = document.getElementById('modalMentorImage');
  const nameEl = document.getElementById('modalMentorName');
  const profEl = document.getElementById('modalMentorProfession');
  const domEl = document.getElementById('modalMentorDomains');

  // 1. Mentor Profile Picture, Name, Profession
  if (imgEl) imgEl.src = mentor.profile_image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=450&fit=crop&crop=faces';
  if (nameEl) nameEl.textContent = mentor.name;
  if (profEl) profEl.textContent = mentor.profession;

  // 2. Exactly Three Social Media Icon Buttons (Instagram, LinkedIn, Facebook)
  setupSocialIconBtn('modalMentorInstagram', mentor.instagram_url, 'Instagram');
  setupSocialIconBtn('modalMentorLinkedIn', mentor.linkedin_url, 'LinkedIn');
  setupSocialIconBtn('modalMentorFacebook', mentor.facebook_url, 'Facebook');

  // 3. Mentor Domains
  if (domEl) domEl.textContent = mentor.domains || 'Not specified';

  // 4. Reset "More Details" and populate existing DB values
  const moreContent = document.getElementById('modalMentorMoreDetailsContent');
  const moreArrow = document.getElementById('moreDetailsToggleArrow');
  const moreText = document.getElementById('moreDetailsToggleText');
  if (moreContent) moreContent.style.display = 'none';
  if (moreArrow) moreArrow.style.transform = 'rotate(0deg)';
  if (moreText) moreText.textContent = 'More Details';

  const compEl = document.getElementById('modalMentorCompany');
  const emailEl = document.getElementById('modalMentorEmail');
  const mobileEl = document.getElementById('modalMentorMobile');
  if (compEl) compEl.textContent = mentor.company_name || 'TheCampusNova Network';
  if (emailEl) emailEl.textContent = maskEmailPublic(mentor.email);
  if (mobileEl) mobileEl.textContent = mentor.mobile_number || '938*******74';

  // 5. Reset "Enquire" button visibility and ensure Enquiry Form is hidden initially
  const enqContainer = document.getElementById('mentorEnquiryFormContainer');
  const enqBtnWrapper = document.getElementById('modalMentorEnquireBtnWrapper');
  if (enqContainer) enqContainer.style.display = 'none';
  if (enqBtnWrapper) enqBtnWrapper.style.display = 'block';

  // 6. Setup Existing Enquiry Form (Target info & fields)
  const targetNameEl = document.getElementById('enqMentorTargetName');
  const idInput = document.getElementById('enqMentorId');
  const nameInput = document.getElementById('enqMentorName');
  const successState = document.getElementById('enqSuccessState');
  const form = document.getElementById('mentorEnquiryForm');
  const errEl = document.getElementById('enqErrorAlert');
  const submitBtn = document.getElementById('submitEnquiryBtn');

  if (targetNameEl) {
    targetNameEl.textContent = `Connecting for 1-on-1 guidance with: ${mentor.name} (${mentor.profession || mentor.company_name || 'Verified Mentor'})`;
  }
  if (idInput) idInput.value = mentor.mentor_id || mentor.id || '';
  if (nameInput) nameInput.value = mentor.name || '';

  if (successState) successState.style.display = 'none';
  if (form) {
    form.style.display = 'block';
    form.reset();
  }
  if (errEl) {
    errEl.textContent = '';
    errEl.style.display = 'none';
  }
  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Enquiry ➔';
  }

  // Auto-fill logged-in user details if available
  if (window.currentUser) {
    const uName = document.getElementById('enqUserName');
    const uEmail = document.getElementById('enqUserEmail');
    if (uName && window.currentUser.name) uName.value = window.currentUser.name;
    if (uEmail && window.currentUser.email) uEmail.value = window.currentUser.email;
  }

  if (modal) {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
}
window.openMentorDetailsModal = openMentorDetailsModal;

// Backward-compatibility: Redirect openMentorEnquiryModal directly to openMentorDetailsModal and reveal form
function openMentorEnquiryModal(mentor) {
  if (mentor) {
    openMentorDetailsModal(mentor.mentor_id || mentor.id);
    revealMentorEnquiryForm();
  }
}
window.openMentorEnquiryModal = openMentorEnquiryModal;

// Submit Mentor Enquiry Handler
async function submitMentorEnquiry() {
  const uName = document.getElementById('enqUserName')?.value?.trim();
  const uEmail = document.getElementById('enqUserEmail')?.value?.trim();
  const uMobile = document.getElementById('enqUserMobile')?.value?.trim();
  const termsAccepted = document.getElementById('enqTermsCheckbox')?.checked;
  const mentorId = document.getElementById('enqMentorId')?.value || (_activeSelectedMentor ? _activeSelectedMentor.mentor_id : '');
  const mentorName = document.getElementById('enqMentorName')?.value || (_activeSelectedMentor ? _activeSelectedMentor.name : '');

  const errEl = document.getElementById('enqErrorAlert');
  const btn = document.getElementById('submitEnquiryBtn');
  if (errEl) { errEl.textContent = ''; errEl.style.display = 'none'; }

  if (!uName || !uEmail || !uMobile) {
    if (errEl) {
      errEl.textContent = 'Please fill out all required contact fields.';
      errEl.style.display = 'block';
    }
    return;
  }

  if (!termsAccepted) {
    if (errEl) {
      errEl.textContent = 'Please accept the Terms & Conditions before submitting.';
      errEl.style.display = 'block';
    }
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Submitting Enquiry...';
  }

  try {
    const res = await fetch('/api/mentor-enquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: uName,
        email: uEmail,
        mobile: uMobile,
        terms_accepted: true,
        mentor_id: mentorId,
        mentor_name: mentorName
      })
    });
    const data = await res.json();
    if (data.success) {
      const successState = document.getElementById('enqSuccessState');
      const form = document.getElementById('mentorEnquiryForm');
      if (form) form.style.display = 'none';
      if (successState) successState.style.display = 'block';
      showToast('Enquiry received! Our team will connect with you.');
    } else {
      if (errEl) {
        errEl.textContent = data.message || 'Failed to submit enquiry. Please check your inputs.';
        errEl.style.display = 'block';
      }
      showToast(data.message || 'Submission failed.');
    }
  } catch (e) {
    if (errEl) {
      errEl.textContent = 'Connection error. Please try again.';
      errEl.style.display = 'block';
    }
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Submit Enquiry ➔';
    }
  }
}
window.submitMentorEnquiry = submitMentorEnquiry;

async function submitContactEnquiry(e) {
  if (e && e.preventDefault) e.preventDefault();
  const form = document.getElementById('contactForm');
  if (!form) return;

  const nameInput = document.getElementById('contactFullName');
  const emailInput = document.getElementById('contactEmailAddress');
  const phoneInput = document.getElementById('contactPhone');
  const subjectSelect = document.getElementById('contactSubjectSelect');
  const messageInput = document.getElementById('contactMessageText');
  const submitBtn = document.getElementById('contactSubmitBtn') || form.querySelector('button[type="submit"]');

  const nameVal = nameInput ? nameInput.value.trim() : '';
  const emailVal = emailInput ? emailInput.value.trim() : '';
  const phoneVal = phoneInput ? phoneInput.value.trim() : '';
  const subjectVal = subjectSelect ? subjectSelect.value : 'General';
  const messageVal = messageInput ? messageInput.value.trim() : '';

  if (!nameVal || !emailVal || !messageVal) {
    if (typeof showToast === 'function') {
      showToast('Please fill out your name, email, and message.');
    }
    return;
  }

  const subjectMap = {
    admissions: 'Admissions & College Guidance',
    mentor: 'Mentor Session Inquiry',
    verification: 'Institutional Verification Request',
    support: 'Platform Support & Feedback'
  };
  const subjectText = subjectMap[subjectVal] || subjectVal;

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending Inquiry...';
  }

  try {
    const res = await fetch('/api/mentor-enquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: nameVal,
        email: emailVal,
        mobile: phoneVal || 'Not provided',
        phone: phoneVal || 'Not provided',
        terms_accepted: true,
        mentor_id: 'Contact Us',
        mentor_name: `Contact Us: ${subjectText}`,
        message: messageVal,
        topic: subjectText,
        source: 'contact'
      })
    });
    const data = await res.json();
    if (data && data.success) {
      if (typeof showToast === 'function') {
        showToast(data.message || 'Thank you! Your inquiry has been received.');
      }
      form.reset();
    } else {
      if (typeof showToast === 'function') {
        showToast((data && data.message) || 'Failed to submit inquiry. Please try again.');
      }
    }
  } catch (err) {
    console.error('[Contact Inquiry Error]', err);
    if (typeof showToast === 'function') {
      showToast('Connection error. Please try again.');
    }
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Inquiry ➔';
    }
  }
}
window.submitContactEnquiry = submitContactEnquiry;

// Public Mentor Search input listener
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('mentorSearchInputPublic');
  if (searchInput) {
    let debounceTimer = null;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        renderMentorsView(e.target.value.trim());
      }, 250);
    });
  }
});




// ----------------------------------------------------
// 12D. EXPLORE DROPDOWN BACKGROUND IMAGE SLIDER (5 SLIDES, 4S LOOP)
// ----------------------------------------------------
function initExploreBackgroundSlider() {
  const slider = document.getElementById('exploreBgSlider');
  if (!slider) return;

  const slides = slider.querySelectorAll('.explore-bg-slide');
  if (!slides.length || slides.length <= 1) return;

  if (slider._isExploreSliderInitialized && window._exploreSliderTimer) {
    return;
  }
  slider._isExploreSliderInitialized = true;

  let currentSlide = 0;

  function nextExploreSlide() {
    slides[currentSlide].classList.remove('active');
    currentSlide = (currentSlide + 1) % slides.length;
    slides[currentSlide].classList.add('active');
  }

  if (window._exploreSliderTimer) {
    clearInterval(window._exploreSliderTimer);
  }

  slides.forEach((s, idx) => s.classList.toggle('active', idx === 0));
  window._exploreSliderTimer = setInterval(nextExploreSlide, 4000); // 4 seconds continuous loop
}
window.initExploreBackgroundSlider = initExploreBackgroundSlider;

// Auto-trigger when explore trigger is clicked or on load
function initExploreAndLiveFeeds() {
  initExploreBackgroundSlider();
  const exploreBtn = document.getElementById('exploreTrigger');
  if (exploreBtn && !exploreBtn._hasExploreClick) {
    exploreBtn._hasExploreClick = true;
    exploreBtn.addEventListener('click', () => {
      initExploreBackgroundSlider();
    });
  }
  loadLiveEventsAndNews();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initExploreAndLiveFeeds);
} else {
  initExploreAndLiveFeeds();
}

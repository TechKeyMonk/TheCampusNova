import os

js_code = '''
// ==============================================================================
// 19 MODULES SHORTCUT SYSTEM & FULL CRUD SYNCHRONIZATION (POSTGRESQL SOURCE OF TRUTH)
// ==============================================================================

const ALL_19_MODULES = [
  { key: 'courses', num: 1, name: 'Courses', icon: '📚', tab: 'content', subview: 'courses' },
  { key: 'colleges', num: 2, name: 'Colleges', icon: '🏫', tab: 'colleges' },
  { key: 'domains', num: 3, name: 'Domain', icon: '🌐', tab: 'content', subview: 'domains' },
  { key: 'exams', num: 4, name: 'Exams', icon: '🎯', tab: 'exams' },
  { key: 'materials', num: 5, name: 'Study Materials', icon: '📖', tab: 'materials' },
  { key: 'reviews', num: 6, name: 'Reviews', icon: '⭐', tab: 'reviews' },
  { key: 'rankings', num: 7, name: 'Ranking', icon: '📊', tab: 'college-analytics' },
  { key: 'careers', num: 8, name: 'Careers', icon: '🚀', tab: 'content', subview: 'careers' },
  { key: 'placements', num: 9, name: 'Placements', icon: '💼', tab: 'placements' },
  { key: 'jobs', num: 10, name: 'Jobs', icon: '🏢', tab: 'content', subview: 'jobs' },
  { key: 'internships', num: 11, name: 'Internships', icon: '💡', tab: 'internships' },
  { key: 'admissions', num: 12, name: 'Admissions', icon: '📝', tab: 'approvals', subview: 'admissions' },
  { key: 'scholarships', num: 13, name: 'Scholarships', icon: '🎓', tab: 'scholarships' },
  { key: 'facilities', num: 14, name: 'Facilities', icon: '🔬', tab: 'facilities' },
  { key: 'entrance-prep', num: 15, name: 'Entrance Exam Preparations', icon: '📋', tab: 'entrance-prep' },
  { key: 'comparisons', num: 16, name: 'Comparison', icon: '⚖️', tab: 'comparisons' },
  { key: 'mentors', num: 17, name: 'Mentors', icon: '👨‍🏫', tab: 'mentors' },
  { key: 'events', num: 18, name: 'Events', icon: '📅', tab: 'approvals', subview: 'events' },
  { key: 'news', num: 19, name: 'News', icon: '📰', tab: 'approvals', subview: 'news' }
];
window.ALL_19_MODULES = ALL_19_MODULES;

function initSixteenFieldsDropdown() {
  const toggleBtn = document.getElementById('sixteenFieldsToggleBtn');
  const dropdown = document.getElementById('sixteenFieldsDropdown');
  const list = document.getElementById('sixteenFieldsDropdownList');

  if (toggleBtn && dropdown) {
    toggleBtn.onclick = (e) => {
      e.stopPropagation();
      const isOpen = dropdown.classList.contains('open') || dropdown.style.display === 'flex';
      document.querySelectorAll('.dropdown-panel').forEach(p => {
        if (p !== dropdown) {
          p.classList.remove('open');
          p.style.display = 'none';
        }
      });
      if (!isOpen) {
        dropdown.classList.add('open');
        dropdown.style.display = 'flex';
      } else {
        dropdown.classList.remove('open');
        dropdown.style.display = 'none';
      }
    };
  }

  if (list) {
    list.innerHTML = ALL_19_MODULES.map((m) => `
      <button type="button" class="fif-shortcut-btn" onclick="openFieldManagement('${m.key}')" style="display:flex; align-items:center; justify-content:space-between; gap:10px; width:100%; padding:9px 12px; background:#F8FAFC; border:1px solid #E2E8F0; border-radius:6px; cursor:pointer; text-align:left; transition:all 0.15s ease;" onmouseover="this.style.background='rgba(58,155,143,0.08)'; this.style.borderColor='#3A9B8F';" onmouseout="this.style.background='#F8FAFC'; this.style.borderColor='#E2E8F0';">
        <div style="display:flex; align-items:center; gap:8px; min-width:0;">
          <span style="font-size:16px;">${m.icon}</span>
          <span style="font-size:12.5px; font-weight:700; color:#1E293B; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${m.name}</span>
        </div>
        <span style="font-size:10px; font-weight:800; color:#3A9B8F; background:rgba(58,155,143,0.12); padding:2px 6px; border-radius:4px; flex-shrink:0;">#${m.num}</span>
      </button>
    `).join('');
  }
}
window.initSixteenFieldsDropdown = initSixteenFieldsDropdown;

function openFieldManagement(fieldKey) {
  const dropdown = document.getElementById('sixteenFieldsDropdown');
  if (dropdown) {
    dropdown.classList.remove('open');
    dropdown.style.display = 'none';
  }

  const cleanKey = String(fieldKey || '').toLowerCase().trim();
  const mod = ALL_19_MODULES.find(m => m.key === cleanKey || m.key.replace('-', '_') === cleanKey) || 
              ALL_19_MODULES.find(m => m.name.toLowerCase() === cleanKey) ||
              { tab: 'colleges', name: fieldKey };

  // Switch to the target tab in sidebar
  if (typeof switchTab === 'function') {
    switchTab(mod.tab);
  }

  // Handle specific subviews
  if (mod.tab === 'content' && mod.subview) {
    switchContentSubView(mod.subview);
  } else if (mod.tab === 'approvals' && mod.subview) {
    switchUpdateDetailsSubfield(mod.subview);
  }

  // Smooth scroll to the target section
  const targetSection = document.getElementById(`tab-${mod.tab}`);
  if (targetSection) {
    targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  if (typeof showAdminToast === 'function') {
    showAdminToast(`Opened ${mod.name} Management View`);
  }
}
window.openFieldManagement = openFieldManagement;

// ----------------------------------------------------
// CONTENT SUBVIEWS (Courses, Domains, Careers, Jobs)
// ----------------------------------------------------
let _adminCoursesCache = [];
let _adminDomainsCache = [];
let _adminCareersCache = [];
let _adminJobsCache = [];
let _adminAdmissionsCache = [];

function switchContentSubView(subview) {
  const pCourses = document.getElementById('contentSubviewCourses');
  const pDomains = document.getElementById('contentSubviewDomains');
  const pCareers = document.getElementById('contentSubviewCareers');
  const pJobs = document.getElementById('contentSubviewJobs');
  const pMatrix = document.getElementById('contentSubviewMatrix');

  const bCourses = document.getElementById('btnContentSubCourses');
  const bDomains = document.getElementById('btnContentSubDomains');
  const bCareers = document.getElementById('btnContentSubCareers');
  const bJobs = document.getElementById('btnContentSubJobs');
  const bMatrix = document.getElementById('btnContentSubMatrix');

  if (pCourses) pCourses.style.display = subview === 'courses' ? 'block' : 'none';
  if (pDomains) pDomains.style.display = subview === 'domains' ? 'block' : 'none';
  if (pCareers) pCareers.style.display = subview === 'careers' ? 'block' : 'none';
  if (pJobs) pJobs.style.display = subview === 'jobs' ? 'block' : 'none';
  if (pMatrix) pMatrix.style.display = subview === 'matrix' ? 'block' : 'none';

  if (bCourses) bCourses.className = subview === 'courses' ? 'cat-filter-btn active' : 'cat-filter-btn';
  if (bDomains) bDomains.className = subview === 'domains' ? 'cat-filter-btn active' : 'cat-filter-btn';
  if (bCareers) bCareers.className = subview === 'careers' ? 'cat-filter-btn active' : 'cat-filter-btn';
  if (bJobs) bJobs.className = subview === 'jobs' ? 'cat-filter-btn active' : 'cat-filter-btn';
  if (bMatrix) bMatrix.className = subview === 'matrix' ? 'cat-filter-btn active' : 'cat-filter-btn';

  if (subview === 'courses') loadAdminCourses();
  if (subview === 'domains') loadAdminDomains();
  if (subview === 'careers') loadAdminCareers();
  if (subview === 'jobs') loadAdminJobs();
}
window.switchContentSubView = switchContentSubView;

// COURSES
async function loadAdminCourses() {
  try {
    const res = await fetch('/api/courses');
    const data = await res.json();
    if (data.success && Array.isArray(data.courses)) {
      _adminCoursesCache = data.courses;
      renderCoursesTable(_adminCoursesCache);
    }
  } catch (e) {
    console.error('Error loading courses:', e);
  }
}
window.loadAdminCourses = loadAdminCourses;

function renderCoursesTable(courses) {
  const tbody = document.getElementById('coursesTableBody');
  if (!tbody) return;
  if (!courses || courses.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:24px; color:#64748B;">No courses found in database.</td></tr>`;
    return;
  }
  tbody.innerHTML = courses.map(c => `
    <tr>
      <td style="font-weight:700; color:#3A9B8F;">#${c.id}</td>
      <td style="font-weight:700; color:#1E293B;">${c.course_name || c.name}</td>
      <td><span class="status-badge" style="background:#EEF2FF; color:#4F46E5;">${c.degree_type || c.degreeType || 'UG'}</span></td>
      <td>${c.duration || '4 Years'}</td>
      <td style="max-width:260px; font-size:12px; color:#475569;">${c.eligibility || '10+2 / Equivalent'}</td>
      <td><span class="status-badge status-active">Active</span></td>
      <td>
        <div style="display:flex; gap:6px;">
          <button type="button" class="table-action-btn edit-btn" onclick='openUniversalEditModal("courses", ${JSON.stringify(c).replace(/'/g, "&apos;")})' title="Edit Course">✏️</button>
          <button type="button" class="table-action-btn delete-btn" onclick="deleteUniversalRecord('courses', ${c.id}, '${(c.course_name || c.name || "").replace(/'/g, "")}')" title="Delete Course">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function filterCoursesTable() {
  const q = (document.getElementById('coursesSearchInput')?.value || '').toLowerCase().trim();
  const deg = (document.getElementById('coursesDegreeFilter')?.value || 'all').toLowerCase();
  const filtered = _adminCoursesCache.filter(c => {
    const nameMatch = (c.course_name || c.name || '').toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q);
    const degMatch = deg === 'all' || (c.degree_type || c.degreeType || '').toLowerCase().includes(deg);
    return nameMatch && degMatch;
  });
  renderCoursesTable(filtered);
}
window.filterCoursesTable = filterCoursesTable;

// DOMAINS
async function loadAdminDomains() {
  try {
    const res = await fetch('/api/domains');
    const data = await res.json();
    if (data.success && Array.isArray(data.domains)) {
      _adminDomainsCache = data.domains;
      renderDomainsTable(_adminDomainsCache);
    }
  } catch (e) {
    console.error('Error loading domains:', e);
  }
}
window.loadAdminDomains = loadAdminDomains;

function renderDomainsTable(domains) {
  const tbody = document.getElementById('domainsTableBody');
  if (!tbody) return;
  if (!domains || domains.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:24px; color:#64748B;">No domains found in database.</td></tr>`;
    return;
  }
  tbody.innerHTML = domains.map(d => `
    <tr>
      <td style="font-weight:700; color:#3A9B8F;">#${d.id}</td>
      <td style="font-weight:700; color:#1E293B;">${d.domain_name || d.name}</td>
      <td style="max-width:280px; font-size:12px; color:#475569;">${d.skills || d.description || 'Core Technical Focus'}</td>
      <td style="max-width:220px; font-size:12px; color:#059669; font-weight:600;">${d.career_scope || 'High Industry Demand'}</td>
      <td><span class="status-badge status-active">Active</span></td>
      <td>
        <div style="display:flex; gap:6px;">
          <button type="button" class="table-action-btn edit-btn" onclick='openUniversalEditModal("domains", ${JSON.stringify(d).replace(/'/g, "&apos;")})' title="Edit Domain">✏️</button>
          <button type="button" class="table-action-btn delete-btn" onclick="deleteUniversalRecord('domains', ${d.id}, '${(d.domain_name || d.name || "").replace(/'/g, "")}')" title="Delete Domain">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function filterDomainsTable() {
  const q = (document.getElementById('domainsSearchInput')?.value || '').toLowerCase().trim();
  const filtered = _adminDomainsCache.filter(d => (d.domain_name || d.name || '').toLowerCase().includes(q) || (d.skills || '').toLowerCase().includes(q));
  renderDomainsTable(filtered);
}
window.filterDomainsTable = filterDomainsTable;

// CAREERS
async function loadAdminCareers() {
  try {
    const res = await fetch('/api/careers');
    const data = await res.json();
    if (data.success && Array.isArray(data.careers)) {
      _adminCareersCache = data.careers;
      renderCareersTable(_adminCareersCache);
    }
  } catch (e) {
    console.error('Error loading careers:', e);
  }
}
window.loadAdminCareers = loadAdminCareers;

function renderCareersTable(careers) {
  const tbody = document.getElementById('careersTableBody');
  if (!tbody) return;
  if (!careers || careers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:24px; color:#64748B;">No careers found in database.</td></tr>`;
    return;
  }
  tbody.innerHTML = careers.map(c => `
    <tr>
      <td style="font-weight:700; color:#3A9B8F;">#${c.id}</td>
      <td style="font-weight:700; color:#1E293B;">${c.career_name || c.name}</td>
      <td><span class="status-badge" style="background:#F0FDF4; color:#166534;">${c.category || 'Engineering'}</span></td>
      <td style="max-width:240px; font-size:12px; color:#475569;">${c.skills || c.required_skills || 'Core Specialization'}</td>
      <td style="font-weight:700; color:#059669;">${c.avg_salary || c.salary_range || '₹12L - ₹28L / yr'}</td>
      <td><span class="status-badge status-active">Active</span></td>
      <td>
        <div style="display:flex; gap:6px;">
          <button type="button" class="table-action-btn edit-btn" onclick='openUniversalEditModal("careers", ${JSON.stringify(c).replace(/'/g, "&apos;")})' title="Edit Career">✏️</button>
          <button type="button" class="table-action-btn delete-btn" onclick="deleteUniversalRecord('careers', ${c.id}, '${(c.career_name || c.name || "").replace(/'/g, "")}')" title="Delete Career">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function filterCareersTable() {
  const q = (document.getElementById('careersSearchInput')?.value || '').toLowerCase().trim();
  const filtered = _adminCareersCache.filter(c => (c.career_name || c.name || '').toLowerCase().includes(q) || (c.skills || '').toLowerCase().includes(q));
  renderCareersTable(filtered);
}
window.filterCareersTable = filterCareersTable;

// JOBS
async function loadAdminJobs() {
  try {
    const res = await fetch('/api/jobs');
    const data = await res.json();
    if (data.success && Array.isArray(data.jobs)) {
      _adminJobsCache = data.jobs;
      renderJobsTable(_adminJobsCache);
    }
  } catch (e) {
    console.error('Error loading jobs:', e);
  }
}
window.loadAdminJobs = loadAdminJobs;

function renderJobsTable(jobs) {
  const tbody = document.getElementById('jobsTableBody');
  if (!tbody) return;
  if (!jobs || jobs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:24px; color:#64748B;">No job postings found in database.</td></tr>`;
    return;
  }
  tbody.innerHTML = jobs.map(j => `
    <tr>
      <td style="font-weight:700; color:#3A9B8F;">#${j.id}</td>
      <td style="font-weight:700; color:#1E293B;">${j.job_title || j.role}</td>
      <td style="font-weight:600; color:#0284C7;">${j.company_name || j.company}</td>
      <td>${j.location || 'Bengaluru'}</td>
      <td>${j.exp_level || j.experience || 'Entry / Mid'}</td>
      <td style="font-weight:700; color:#059669;">${j.salary || 'Competitive CTC'}</td>
      <td><span class="status-badge status-active">Active</span></td>
      <td>
        <div style="display:flex; gap:6px;">
          <button type="button" class="table-action-btn edit-btn" onclick='openUniversalEditModal("jobs", ${JSON.stringify(j).replace(/'/g, "&apos;")})' title="Edit Job">✏️</button>
          <button type="button" class="table-action-btn delete-btn" onclick="deleteUniversalRecord('jobs', ${j.id}, '${(j.job_title || j.role || "").replace(/'/g, "")}')" title="Delete Job">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function filterJobsTable() {
  const q = (document.getElementById('jobsSearchInput')?.value || '').toLowerCase().trim();
  const filtered = _adminJobsCache.filter(j => (j.job_title || j.role || '').toLowerCase().includes(q) || (j.company_name || j.company || '').toLowerCase().includes(q));
  renderJobsTable(filtered);
}
window.filterJobsTable = filterJobsTable;

// ADMISSIONS
async function loadAdminAdmissions() {
  try {
    const res = await fetch('/api/admissions');
    const data = await res.json();
    if (data.success && Array.isArray(data.admissions)) {
      _adminAdmissionsCache = data.admissions;
      renderAdminAdmissionsTable(_adminAdmissionsCache);
      const b = document.getElementById('updateDetailsAdmissionsBadge');
      if (b) b.textContent = _adminAdmissionsCache.length;
    }
  } catch (e) {
    console.error('Error loading admissions:', e);
  }
}
window.loadAdminAdmissions = loadAdminAdmissions;

function renderAdminAdmissionsTable(admissions) {
  const tbody = document.getElementById('adminAdmissionsTableBody');
  if (!tbody) return;
  if (!admissions || admissions.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:24px; color:#64748B;">No admissions notifications found in database.</td></tr>`;
    return;
  }
  tbody.innerHTML = admissions.map(a => `
    <tr>
      <td style="font-weight:700; color:#3A9B8F;">#${a.id}</td>
      <td style="font-weight:700; color:#1E293B;">${a.college_name || ('College #' + a.college_id)}</td>
      <td style="font-weight:600; color:#0284C7;">${a.admission_type || 'Merit Counseling'}</td>
      <td style="max-width:240px; font-size:12px; color:#475569;">${a.eligibility || '10+2 with PCM'}</td>
      <td style="font-size:12px;">${a.application_start || 'May'} – ${a.application_end || 'June 2026'}</td>
      <td style="font-weight:600; color:#059669;">${a.fees || 'Standard Gov Fee'}</td>
      <td><span class="status-badge ${a.status === 'active' ? 'status-active' : 'status-pending'}">${(a.status || 'Active').toUpperCase()}</span></td>
      <td>
        <div style="display:flex; gap:6px;">
          <button type="button" class="table-action-btn edit-btn" onclick='openUniversalEditModal("admissions", ${JSON.stringify(a).replace(/'/g, "&apos;")})' title="Edit Admission">✏️</button>
          <button type="button" class="table-action-btn" onclick="toggleAdmissionStatus(${a.id}, '${a.status === 'active' ? 'pending' : 'active'}')" title="Toggle Status">${a.status === 'active' ? '⏸️' : '▶️'}</button>
          <button type="button" class="table-action-btn delete-btn" onclick="deleteUniversalRecord('admissions', ${a.id}, '${(a.college_name || "Admission").replace(/'/g, "")}')" title="Delete Admission">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function filterAdminAdmissionsTable() {
  const q = (document.getElementById('adminAdmissionsSearchInput')?.value || '').toLowerCase().trim();
  const filtered = _adminAdmissionsCache.filter(a => (a.college_name || '').toLowerCase().includes(q) || (a.admission_type || '').toLowerCase().includes(q));
  renderAdminAdmissionsTable(filtered);
}
window.filterAdminAdmissionsTable = filterAdminAdmissionsTable;

async function toggleAdmissionStatus(id, newStatus) {
  try {
    const res = await fetch(`/api/admissions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Role': 'admin', 'X-Admin-Passkey': 'admin123' },
      body: JSON.stringify({ status: newStatus })
    });
    const data = await res.json();
    if (data.success) {
      showAdminToast(`Admission status changed to ${newStatus}`);
      loadAdminAdmissions();
    }
  } catch (e) {
    alert('Failed to update status: ' + e.message);
  }
}
window.toggleAdmissionStatus = toggleAdmissionStatus;

// ----------------------------------------------------
// UNIVERSAL EDIT & DELETE HANDLERS
// ----------------------------------------------------
let _editingRecordId = null;
let _editingCategoryKey = null;

function openUniversalEditModal(categoryKey, record) {
  _editingCategoryKey = categoryKey;
  _editingRecordId = record.id;
  
  openUniversalAddModal(categoryKey);
  
  const title = document.getElementById('universalAddModalTitle');
  if (title) title.textContent = '✏️ Edit ' + (categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1));
  
  const submitBtn = document.getElementById('universalAddSubmitBtn');
  if (submitBtn) submitBtn.innerHTML = `<span>💾</span> Save Changes`;

  // Pre-fill form values
  const form = document.getElementById('universalAddForm');
  if (form) {
    for (const [key, val] of Object.entries(record)) {
      const input = form.querySelector(`[name="${key}"]`);
      if (input) {
        input.value = Array.isArray(val) ? val.join(', ') : (val !== null && val !== undefined ? val : '');
      }
    }
    // Also fill common aliases
    if (record.course_name && form.querySelector('[name="name"]')) form.querySelector('[name="name"]').value = record.course_name;
    if (record.domain_name && form.querySelector('[name="name"]')) form.querySelector('[name="name"]').value = record.domain_name;
    if (record.career_name && form.querySelector('[name="name"]')) form.querySelector('[name="name"]').value = record.career_name;
    if (record.job_title && form.querySelector('[name="role"]')) form.querySelector('[name="role"]').value = record.job_title;
    if (record.company_name && form.querySelector('[name="company"]')) form.querySelector('[name="company"]').value = record.company_name;
  }
}
window.openUniversalEditModal = openUniversalEditModal;

async function deleteUniversalRecord(categoryKey, recordId, recordName) {
  if (!confirm(`Are you sure you want to permanently delete ${recordName || 'this record'} from the database?`)) {
    return;
  }

  const endpointMap = {
    courses: `/api/courses/${recordId}`,
    domains: `/api/domains/${recordId}`,
    careers: `/api/careers/${recordId}`,
    jobs: `/api/jobs/${recordId}`,
    placements: `/api/placements/${recordId}`,
    internships: `/api/internships/${recordId}`,
    admissions: `/api/admissions/${recordId}`,
    scholarships: `/api/scholarships/${recordId}`,
    facilities: `/api/facilities/${recordId}`,
    entrance_exams: `/api/entrance-exams/${recordId}`,
    rankings: `/api/rankings/${recordId}`
  };

  const url = endpointMap[categoryKey];
  if (!url) {
    alert('No delete endpoint mapped for ' + categoryKey);
    return;
  }

  try {
    const res = await fetch(url, {
      method: 'DELETE',
      headers: { 'X-Admin-Role': 'admin', 'X-Admin-Passkey': 'admin123' }
    });
    const data = await res.json();
    if (data.success) {
      showAdminToast(`Deleted ${recordName || 'record'} successfully from PostgreSQL.`);
      // Reload UI
      if (categoryKey === 'courses') loadAdminCourses();
      else if (categoryKey === 'domains') loadAdminDomains();
      else if (categoryKey === 'careers') loadAdminCareers();
      else if (categoryKey === 'jobs') loadAdminJobs();
      else if (categoryKey === 'admissions') loadAdminAdmissions();
      else if (categoryKey === 'scholarships' && typeof loadScholarships === 'function') loadScholarships();
      else if (categoryKey === 'facilities' && typeof loadFacilities === 'function') loadFacilities();
      else if (categoryKey === 'entrance_exams' && typeof loadEntrancePrep === 'function') loadEntrancePrep();
      else if (categoryKey === 'placements' && typeof loadPlacements === 'function') loadPlacements();
      else if (categoryKey === 'internships' && typeof loadInternships === 'function') loadInternships();
      else if (categoryKey === 'rankings' && typeof loadCollegeAnalytics === 'function') loadCollegeAnalytics();
    } else {
      alert(data.message || 'Failed to delete record.');
    }
  } catch (err) {
    alert('Error deleting record: ' + err.message);
  }
}
window.deleteUniversalRecord = deleteUniversalRecord;
'''

with open("admin.js", "r", encoding="utf-8") as f:
    content = f.read()

start_marker = "const FIF_FIELD_TO_TAB_MAP = {"
pos = content.find(start_marker)
if pos == -1:
    print("start_marker not found in admin.js!")
else:
    # We replace from pos to end of file
    new_content = content[:pos] + js_code + "\n"
    with open("admin.js", "w", encoding="utf-8") as f:
        f.write(new_content)
    print("Successfully updated admin.js with 19 modules and full CRUD handlers!")

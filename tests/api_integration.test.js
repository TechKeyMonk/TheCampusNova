import { describe, it, expect } from 'vitest';

const BASE_URL = 'http://localhost:8000';

describe('Public Frontend & 19-Module API Integration Tests', () => {
  const modules = [
    { name: 'Colleges', endpoint: '/api/colleges' },
    { name: 'Courses', endpoint: '/api/courses' },
    { name: 'Domains', endpoint: '/api/domains' },
    { name: 'Exams', endpoint: '/api/exams' },
    { name: 'Study Materials', endpoint: '/api/study-materials' },
    { name: 'Reviews', endpoint: '/api/reviews' },
    { name: 'Rankings', endpoint: '/api/rankings' },
    { name: 'Careers', endpoint: '/api/careers' },
    { name: 'Placements', endpoint: '/api/placements' },
    { name: 'Jobs', endpoint: '/api/jobs' },
    { name: 'Internships', endpoint: '/api/internships' },
    { name: 'Admissions', endpoint: '/api/admissions' },
    { name: 'Scholarships', endpoint: '/api/scholarships' },
    { name: 'Facilities', endpoint: '/api/facilities' },
    { name: 'Entrance Exams', endpoint: '/api/entrance-exams' },
    { name: 'Comparisons', endpoint: '/api/comparisons' },
    { name: 'Mentors', endpoint: '/api/mentors' },
    { name: 'Events', endpoint: '/api/events' },
    { name: 'News', endpoint: '/api/news' }
  ];

  for (const m of modules) {
    it(`Module API: ${m.name} (${m.endpoint}) returns HTTP 200 with valid data structure`, async () => {
      const res = await fetch(`${BASE_URL}${m.endpoint}`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toBeDefined();
      expect(typeof data).toBe('object');
    }, 60000);
  }

  it('Admin Analytics API: /api/admin/analytics returns HTTP 200 with valid data structure', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/analytics`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.analytics).toBeDefined();
  });

  it('Serves index.html with HTTP 200', async () => {
    const res = await fetch(`${BASE_URL}/index.html`);
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain('CampusNova');
  });

  it('Serves admin.html with HTTP 200', async () => {
    const res = await fetch(`${BASE_URL}/admin.html`);
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain('Admin Portal');
  });

  it('Security Check: Blocks sensitive files (.env)', async () => {
    const res = await fetch(`${BASE_URL}/.env`);
    expect(res.status).toBe(403);
  });

  it('Security Check: Blocks source files (.py)', async () => {
    const res = await fetch(`${BASE_URL}/server.py`);
    expect(res.status).toBe(403);
  });

  it('Security Check: Blocks database files (.sql)', async () => {
    const res = await fetch(`${BASE_URL}/database/schema.sql`);
    expect(res.status).toBe(403);
  });
});

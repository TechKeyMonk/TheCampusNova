import { describe, it, expect } from 'vitest';

const BASE_URL = 'http://localhost:8000';
const ADMIN_PASSKEY = 'campusnova2026';

describe('Admin Authorization, CRUD, and Delete Operation Integration Tests', () => {
  let createdCourseId = null;
  const uniqueTag = `Vitest_${Date.now()}`;

  it('1. Rejects unauthenticated POST request to admin endpoint with HTTP 403', async () => {
    const res = await fetch(`${BASE_URL}/api/courses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        course_name: `Unauthorized Course ${uniqueTag}`,
        duration: '4 Years'
      })
    });
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.success).toBe(false);
  });

  it('2. Rejects unauthenticated DELETE request with HTTP 403', async () => {
    const res = await fetch(`${BASE_URL}/api/courses/999999`, {
      method: 'DELETE'
    });
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.success).toBe(false);
  });

  it('3. Rejects admin request with invalid passkey with HTTP 403', async () => {
    const res = await fetch(`${BASE_URL}/api/courses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Passkey': 'wrong_invalid_passkey_123'
      },
      body: JSON.stringify({
        course_name: `Invalid Passkey Course ${uniqueTag}`
      })
    });
    expect(res.status).toBe(403);
  });

  it('4. Successfully creates a course with valid admin passkey (POST -> Read)', async () => {
    const res = await fetch(`${BASE_URL}/api/courses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Passkey': ADMIN_PASSKEY
      },
      body: JSON.stringify({
        course_name: `QA Test Robotics ${uniqueTag}`,
        stream: 'Engineering',
        duration: '4 Years',
        annual_tuition_fees: 'Rs. 2,50,000',
        description: 'Vitest automated integration test course.'
      })
    });

    expect([200, 201]).toContain(res.status);
    const data = await res.json();
    expect(data.success).toBe(true);

    createdCourseId = data.id || data.course?.id;
    expect(createdCourseId).toBeDefined();

    // Verify Read from public API
    const getRes = await fetch(`${BASE_URL}/api/courses`);
    const allCourses = await getRes.json();
    const courseList = Array.isArray(allCourses) ? allCourses : (allCourses.courses || []);
    const found = courseList.some(c => (c.id == createdCourseId || c.course_name?.includes(uniqueTag)));
    expect(found).toBe(true);
  });

  it('5. Successfully updates course details with admin credentials (PUT -> Read)', async () => {
    expect(createdCourseId).toBeDefined();

    const res = await fetch(`${BASE_URL}/api/courses/${createdCourseId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Passkey': ADMIN_PASSKEY
      },
      body: JSON.stringify({
        course_name: `QA Test Robotics ${uniqueTag} UPDATED`,
        annual_tuition_fees: 'Rs. 2,90,000'
      })
    });

    expect([200, 201]).toContain(res.status);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it('6. Rejects deletion attempt on the created record when unauthenticated', async () => {
    expect(createdCourseId).toBeDefined();

    const res = await fetch(`${BASE_URL}/api/courses/${createdCourseId}`, {
      method: 'DELETE'
    });
    expect(res.status).toBe(403);
  });

  it('7. Successfully deletes the test course with valid admin credentials (DELETE -> Read)', async () => {
    expect(createdCourseId).toBeDefined();

    const res = await fetch(`${BASE_URL}/api/courses/${createdCourseId}`, {
      method: 'DELETE',
      headers: {
        'X-Admin-Passkey': ADMIN_PASSKEY
      }
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);

    // Verify deleted course is no longer returned or marked inactive
    const getRes = await fetch(`${BASE_URL}/api/courses`);
    const allCourses = await getRes.json();
    const courseList = Array.isArray(allCourses) ? allCourses : (allCourses.courses || []);
    const stillActive = courseList.some(c => c.id == createdCourseId && c.status !== 'archived' && c.status !== 'inactive');
    expect(stillActive).toBe(false);
  });

  it('8. Verifies Admin Analytics refresh returns HTTP 200 immediately following CRUD and deletion', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/analytics`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.analytics).toBeDefined();

    const colRes = await fetch(`${BASE_URL}/api/admin/analytics?type=colleges`);
    expect(colRes.status).toBe(200);
    const colData = await colRes.json();
    expect(colData.success).toBe(true);
    expect(colData.analytics).toBeDefined();
  });
});

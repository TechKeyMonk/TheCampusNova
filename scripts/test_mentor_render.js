async function test() {
  try {
    const res = await fetch('http://127.0.0.1:8000/api/mentors');
    console.log('Response Status:', res.status);
    const data = await res.json();
    console.log('Data:', JSON.stringify(data, null, 2));

    function escapeHtml(str) {
      if (str === null || str === undefined) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    const mentors = (data && data.success && Array.isArray(data.mentors)) ? data.mentors : [];
    console.log('Parsed mentors count:', mentors.length);

    const html = mentors.map((m, idx) => `
      <div class="mentor-linkedin-card" onclick="openMentorDetailsModal('${escapeHtml(m.mentor_id || m.id)}')">
        <img src="${escapeHtml(m.profile_image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=450&fit=crop&crop=faces')}" alt="${escapeHtml(m.name)}" />
        <h3>${escapeHtml(m.name)}</h3>
        <div>${escapeHtml(m.profession)}</div>
      </div>
    `).join('');

    console.log('[SUCCESS] Rendered HTML length:', html.length);
  } catch (err) {
    console.error('[ERROR] Failed during test:', err);
  }
}

test();

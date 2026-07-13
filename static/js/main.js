/* ═══════════════════════════════════════════════
   CareerAI – Frontend Logic
   IBM Granite × watsonx.ai
═══════════════════════════════════════════════ */

// ── State ──────────────────────────────────────
let userProfile = {};

// ── DOM helpers ────────────────────────────────
const $  = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ── Profile helpers ────────────────────────────
function getProfile() {
  return {
    name:       $('#profileName')?.value.trim()       || userProfile.name       || '',
    education:  $('#profileEducation')?.value.trim()  || userProfile.education  || '',
    interests:  $('#profileInterests')?.value.trim()  || userProfile.interests  || '',
    skills:     $('#profileSkills')?.value.trim()     || userProfile.skills     || '',
    careerGoal: $('#profileGoal')?.value.trim()       || userProfile.careerGoal || '',
  };
}

function updateStatCards(profile) {
  const goal      = profile.careerGoal || '–';
  const education = profile.education  || '–';
  const skills    = profile.skills
    ? profile.skills.split(',').filter(s => s.trim()).length + ' skills'
    : '–';

  $('#statGoal').textContent       = goal.length > 20 ? goal.slice(0, 18) + '…' : goal;
  $('#statEducation').textContent  = education.length > 20 ? education.slice(0, 18) + '…' : education;
  $('#statSkillsCount').textContent = skills;
}

// ── Navigation ─────────────────────────────────
function activateSection(name) {
  $$('.content-section').forEach(s => s.classList.remove('active'));
  $$('.nav-item').forEach(b => b.classList.remove('active'));

  const sec = $(`#section-${name}`);
  if (sec) sec.classList.add('active');

  $$(`[data-section="${name}"]`).forEach(b => b.classList.add('active'));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-section]');
  if (btn) activateSection(btn.dataset.section);
});

// ── Loading overlay ────────────────────────────
function showLoading() { $('#loadingOverlay').classList.remove('d-none'); }
function hideLoading() { $('#loadingOverlay').classList.add('d-none'); }

// ── Toast ──────────────────────────────────────
function showToast(msg, type = 'info') {
  const toast    = $('#appToast');
  const body     = $('#toastBody');
  body.textContent = msg;
  toast.className  = `toast align-items-center border-0 text-bg-${type === 'error' ? 'danger' : 'dark'}`;
  new bootstrap.Toast(toast, { delay: 3000 }).show();
}

// ── API caller ─────────────────────────────────
async function callAPI(endpoint, extraBody = {}) {
  const profile = getProfile();
  showLoading();
  try {
    const res = await fetch(`/api/${endpoint}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ profile, ...extraBody }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Server error');
    return data;
  } catch (err) {
    showToast(err.message, 'error');
    return null;
  } finally {
    hideLoading();
  }
}

// ── Render AI output ───────────────────────────
function renderOutput(containerId, outputId, text) {
  const container = $(`#${containerId}`);
  const output    = $(`#${outputId}`);
  if (!container || !output) return;
  output.textContent  = text;
  container.classList.remove('d-none');
  container.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── Profile Form ───────────────────────────────
$('#profileForm')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const profile = getProfile();

  if (!profile.name) {
    showToast('Please enter your name.', 'error');
    return;
  }

  userProfile = profile;
  updateStatCards(profile);
  renderProfilePreview(profile);
  showToast('Profile saved! AI is ready to personalize your guidance.', 'success');
});

$('#btnClearProfile')?.addEventListener('click', () => {
  $('#profileForm').reset();
  $$('.goal-chip').forEach(c => c.classList.remove('selected'));
  $('#profilePreview').classList.add('d-none');
  userProfile = {};
  updateStatCards({});
});

function renderProfilePreview(profile) {
  const fields = [
    { label: 'Name',        value: profile.name },
    { label: 'Education',   value: profile.education   || '–' },
    { label: 'Interests',   value: profile.interests   || '–' },
    { label: 'Skills',      value: profile.skills      || '–' },
    { label: 'Career Goal', value: profile.careerGoal  || '–' },
  ];

  const html = fields.map(f => `
    <div class="col-12 col-md-6">
      <div class="profile-preview-item">
        <div class="label">${f.label}</div>
        <div class="value">${escapeHtml(f.value)}</div>
      </div>
    </div>
  `).join('');

  $('#profilePreviewContent').innerHTML = html;
  $('#profilePreview').classList.remove('d-none');
}

// ── Career Goal Chips ──────────────────────────
$$('.goal-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    $$('.goal-chip').forEach(c => c.classList.remove('selected'));
    chip.classList.add('selected');
    $('#profileGoal').value = chip.dataset.goal;
  });
});

// ── Dashboard ──────────────────────────────────
$('#btnDashboard')?.addEventListener('click', async () => {
  const data = await callAPI('dashboard');
  if (data?.dashboard) {
    renderOutput('dashboardOutput', 'dashboardContent', data.dashboard);
    updateStatCards(getProfile());
  }
});

// ── Roadmap ────────────────────────────────────
$('#btnRoadmap')?.addEventListener('click', async () => {
  const data = await callAPI('roadmap');
  if (data?.roadmap) renderOutput('roadmapOutput', 'roadmapContent', data.roadmap);
});

// ── Certifications ─────────────────────────────
$('#btnCertifications')?.addEventListener('click', async () => {
  const data = await callAPI('certifications');
  if (data?.certifications) renderOutput('certificationsOutput', 'certificationsContent', data.certifications);
});

// ── Skills ─────────────────────────────────────
$('#btnSkills')?.addEventListener('click', async () => {
  const data = await callAPI('skills');
  if (data?.skills) renderOutput('skillsOutput', 'skillsContent', data.skills);
});

// ── Projects ───────────────────────────────────
$('#btnProjects')?.addEventListener('click', async () => {
  const data = await callAPI('projects');
  if (data?.projects) renderOutput('projectsOutput', 'projectsContent', data.projects);
});

// ── Resume ─────────────────────────────────────
$('#btnResume')?.addEventListener('click', async () => {
  const data = await callAPI('resume');
  if (data?.resume) renderOutput('resumeOutput', 'resumeContent', data.resume);
});

// ── Interview ──────────────────────────────────
$('#btnInterview')?.addEventListener('click', async () => {
  const data = await callAPI('interview');
  if (data?.interview) renderOutput('interviewOutput', 'interviewContent', data.interview);
});

// ── Chat ───────────────────────────────────────
function appendChatMessage(role, text) {
  const messages = $('#chatMessages');
  const isAI = role === 'ai';

  const wrapper = document.createElement('div');
  wrapper.className = `chat-msg chat-msg--${isAI ? 'ai' : 'user'}`;

  const avatar = document.createElement('div');
  avatar.className = 'chat-msg__avatar';
  avatar.innerHTML = isAI ? '<i class="bi bi-stars"></i>' : '<i class="bi bi-person-fill"></i>';

  const bubble = document.createElement('div');
  bubble.className = 'chat-msg__bubble';

  const label = document.createElement('strong');
  label.textContent = isAI ? 'CareerAI' : 'You';

  const p = document.createElement('p');
  p.textContent = text;

  bubble.appendChild(label);
  bubble.appendChild(p);
  wrapper.appendChild(avatar);
  wrapper.appendChild(bubble);

  messages.appendChild(wrapper);
  messages.scrollTop = messages.scrollHeight;

  return wrapper;
}

function appendTypingIndicator() {
  const messages = $('#chatMessages');

  const wrapper = document.createElement('div');
  wrapper.className = 'chat-msg chat-msg--ai chat-msg--typing';
  wrapper.id = 'typingIndicator';

  wrapper.innerHTML = `
    <div class="chat-msg__avatar"><i class="bi bi-stars"></i></div>
    <div class="chat-msg__bubble">
      <strong>CareerAI</strong>
      <p>Thinking with IBM Granite…</p>
    </div>
  `;

  messages.appendChild(wrapper);
  messages.scrollTop = messages.scrollHeight;
}

function removeTypingIndicator() {
  $('#typingIndicator')?.remove();
}

async function sendChatMessage() {
  const input   = $('#chatInput');
  const message = input.value.trim();
  if (!message) return;

  input.value = '';
  input.style.height = 'auto';

  appendChatMessage('user', message);
  appendTypingIndicator();

  const btn = $('#btnSendChat');
  btn.disabled = true;

  try {
    const res = await fetch('/api/chat', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ message, profile: getProfile() }),
    });
    const data = await res.json();
    removeTypingIndicator();

    if (!res.ok) throw new Error(data.error || 'Server error');
    appendChatMessage('ai', data.response);
  } catch (err) {
    removeTypingIndicator();
    appendChatMessage('ai', `⚠️ Error: ${err.message}. Please check your API key and project ID.`);
  } finally {
    btn.disabled = false;
    $('#chatMessages').scrollTop = $('#chatMessages').scrollHeight;
  }
}

$('#btnSendChat')?.addEventListener('click', sendChatMessage);

$('#chatInput')?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendChatMessage();
  }
});

// Auto-resize textarea
$('#chatInput')?.addEventListener('input', function () {
  this.style.height = 'auto';
  this.style.height = Math.min(this.scrollHeight, 120) + 'px';
});

// ── Suggestion chips ───────────────────────────
$$('.suggestion-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    const q = chip.dataset.q;
    if (q) {
      $('#chatInput').value = q;
      sendChatMessage();
    }
  });
});

// ── Utilities ──────────────────────────────────
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Init ───────────────────────────────────────
(function init() {
  activateSection('dashboard');
  updateStatCards({});
})();

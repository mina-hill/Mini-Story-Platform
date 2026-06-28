// app.js — shared helpers used by every page

function getToken() { return localStorage.getItem('token'); }
function getUser() {
  try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
}
function setSession(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}
function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}
function isLoggedIn() { return !!getToken(); }

async function api(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`/api${path}`, { ...opts, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

function renderNav(activePage) {
  const user = getUser();
  const el = document.getElementById('nav');
  if (!el) return;
  el.innerHTML = `
    <span class="brand"><a href="/list.html">Mini Stories</a></span>
    <span>
      <a href="/list.html" class="${activePage === 'list' ? 'active' : ''}">Browse</a>
      ${isLoggedIn()
        ? `<a href="/write.html" class="${activePage === 'write' ? 'active' : ''}">Write</a>
           <a href="#" id="logoutLink">Logout (${user?.name || ''})</a>`
        : `<a href="/login.html" class="${activePage === 'login' ? 'active' : ''}">Login</a>`}
    </span>`;
  const logout = document.getElementById('logoutLink');
  if (logout) logout.onclick = (e) => { e.preventDefault(); clearSession(); location.href = '/list.html'; };
}

function qs(name) {
  return new URLSearchParams(location.search).get(name);
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso + 'Z').getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

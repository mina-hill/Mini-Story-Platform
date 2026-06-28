// api.js - Core API interactions and Auth handling
const API_BASE = '/api';

function getToken() { return localStorage.getItem('token'); }
function setToken(token) { localStorage.setItem('token', token); }
function removeToken() { localStorage.removeItem('token'); }
function getUser() { 
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}
function setUser(user) { localStorage.setItem('user', JSON.stringify(user)); }
function removeUser() { localStorage.removeItem('user'); }

async function fetchAPI(endpoint, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'API request failed');
  }
  return res.json();
}

function updateNav() {
  const navLinks = document.getElementById('auth-links');
  if (!navLinks) return;
  const user = getUser();
  
  if (user) {
    navLinks.innerHTML = `
      <span>Hi, ${user.name}</span>
      <a href="/write.html" class="btn btn-primary" style="padding: 0.4rem 1rem; font-size: 0.9rem;">Write</a>
      <button onclick="logout()">Logout</button>
    `;
  } else {
    navLinks.innerHTML = `
      <a href="/login.html">Sign In</a>
      <a href="/login.html?tab=register" class="btn btn-primary" style="padding: 0.4rem 1rem; font-size: 0.9rem;">Get Started</a>
    `;
  }
}

function logout() {
  removeToken();
  removeUser();
  window.location.href = '/';
}

document.addEventListener('DOMContentLoaded', updateNav);

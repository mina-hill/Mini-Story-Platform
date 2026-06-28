// auth.js
document.addEventListener('DOMContentLoaded', () => {
  const tabs = document.querySelectorAll('.tab-btn');
  const registerFields = document.querySelectorAll('.register-only');
  const form = document.getElementById('auth-form');
  const errorMsg = document.getElementById('auth-error');
  const submitBtn = document.getElementById('submit-btn');
  let isLogin = true;

  // Check URL params for register tab
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('tab') === 'register') {
    switchTab('register');
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  function switchTab(tab) {
    isLogin = tab === 'login';
    tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    registerFields.forEach(f => f.classList.toggle('hidden', isLogin));
    submitBtn.textContent = isLogin ? 'Login' : 'Register';
    document.getElementById('name').required = !isLogin;
    errorMsg.classList.add('hidden');
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMsg.classList.add('hidden');
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const name = document.getElementById('name').value;

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Please wait...';

      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const body = isLogin ? { email, password } : { name, email, password };
      
      const res = await fetchAPI(endpoint, {
        method: 'POST',
        body: JSON.stringify(body)
      });

      setToken(res.token);
      setUser(res.user);
      
      window.location.href = '/';
    } catch (err) {
      errorMsg.textContent = err.message;
      errorMsg.classList.remove('hidden');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = isLogin ? 'Login' : 'Register';
    }
  });
});

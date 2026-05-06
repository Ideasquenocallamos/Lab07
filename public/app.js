const API = window.location.origin;
let token = localStorage.getItem('token') || '';
let me = JSON.parse(localStorage.getItem('me') || 'null');
let captchaId = '';
let regCaptchaId = '';

const $ = (id) => document.getElementById(id);
const flash = (message, ok = true) => {
  const alert = $('flash');
  alert.className = `alert ${ok ? 'alert-success' : 'alert-danger'} app-alert`;
  alert.textContent = message;
  alert.classList.remove('d-none');
};
const closeModal = (id) => bootstrap.Modal.getInstance($(id))?.hide();

async function api(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth && !token) throw new Error('Debes iniciar sesión');
  if (auth) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await response.json();

  if (!response.ok) {
    if ([401, 403].includes(response.status)) {
      token = '';
      me = null;
      localStorage.clear();
      renderUI();
      throw new Error('Sesión inválida, inicia sesión de nuevo');
    }
    throw new Error(data.message || 'Error');
  }
  return data;
}

function showTab(tabName) {
  document.querySelectorAll('.tab-section').forEach((section) => section.classList.add('d-none'));
  $(`tab-${tabName}`).classList.remove('d-none');
}

function renderUI() {
  $('session').textContent = me ? `Sesión activa: ${me.nombre} (${me.rol})` : 'Sin sesión';
  $('openRegisterBtn').classList.toggle('d-none', Boolean(me));
  $('openLoginBtn').classList.toggle('d-none', Boolean(me));
  $('logout').classList.toggle('d-none', !me);
  $('authorCodePanel').classList.toggle('d-none', !me || !['autor', 'mixto'].includes(me.rol));
  $('guestHelpPanel').classList.toggle('d-none', Boolean(me && ['autor', 'mixto'].includes(me.rol)));
}

function updateRoleUI() {
  const rol = $('regRol').value;
  const needsAdminCode = ['autor', 'mixto'].includes(rol);
  $('regAdminCode').disabled = !needsAdminCode;
  $('regAdminCode').style.opacity = needsAdminCode ? '1' : '0.6';
  $('adminCodeRequestBox').classList.toggle('d-none', !needsAdminCode);
  $('adminHelp').textContent = needsAdminCode
    ? 'Solicita el código al administrador y pégalo aquí cuando te responda por Gmail.'
    : 'Para lector no necesitas código admin.';
}

renderUI();
updateRoleUI();

document.querySelectorAll('.nav-btn').forEach((button) => {
  button.onclick = () => showTab(button.dataset.tab);
});

$('signup').onclick = async () => {
  try {
    await api('/api/auth/signup', {
      method: 'POST',
      body: {
        nombre: $('regNombre').value,
        email: $('regEmail').value,
        password: $('regPass').value,
        rol: $('regRol').value,
        admin_code: $('regAdminCode').value
      }
    });
    flash('Registro completado. Ahora inicia sesión.');
    closeModal('registerModal');
  } catch (error) {
    flash(error.message, false);
  }
};

$('signin').onclick = async () => {
  try {
    const data = await api('/api/auth/signin', {
      method: 'POST',
      body: { email: $('logEmail').value, password: $('logPass').value }
    });
    token = data.accessToken;
    me = data;
    localStorage.setItem('token', token);
    localStorage.setItem('me', JSON.stringify(me));
    renderUI();
    flash('Sesión iniciada correctamente.');
    closeModal('loginModal');
  } catch (error) {
    flash(error.message, false);
  }
};

$('logout').onclick = () => {
  token = '';
  me = null;
  localStorage.clear();
  renderUI();
  flash('Sesión cerrada.');
};

$('buscar').onclick = async () => {
  try {
    const q = encodeURIComponent($('searchQ').value || '');
    const c = encodeURIComponent($('privateCode').value || '');
    const path = token ? `/api/libros?q=${q}&codigo_privado=${c}` : `/api/libros-publicos?q=${q}`;
    $('outLibros').textContent = JSON.stringify(await api(path, { auth: Boolean(token) }), null, 2);
  } catch (error) {
    flash(error.message, false);
  }
};

$('btnLoadCaptcha').onclick = async () => {
  try {
    const captcha = await api('/api/auth/captcha');
    captchaId = captcha.captcha_id;
    $('captchaImg').src = captcha.image_base64;
    flash('Captcha generado. Tienes 2 minutos para validarlo.');
  } catch (error) {
    flash(error.message, false);
  }
};

$('btnCaptcha').onclick = async () => {
  try {
    if (!me) return flash('Primero inicia sesión para validar el captcha.', false);
    if (!captchaId) return flash('Genera captcha primero.', false);
    const result = await api('/api/auth/author-code', {
      method: 'POST',
      auth: true,
      body: { captcha_id: captchaId, answer: $('captchaAnswer').value }
    });
    $('authorCodeBox').innerHTML = `<span class="badge text-bg-dark">Código autor: ${result.author_code}</span>`;
  } catch (error) {
    flash(error.message, false);
  }
};

$('btnRegCaptcha').onclick = async () => {
  try {
    const captcha = await api('/api/auth/captcha');
    regCaptchaId = captcha.captcha_id;
    $('regCaptchaImg').src = captcha.image_base64;
    $('adminRequestResult').textContent = 'Captcha listo. Escríbelo y solicita el código.';
  } catch (error) {
    flash(error.message, false);
  }
};

$('btnRequestAdminCode').onclick = async () => {
  try {
    if (!regCaptchaId) return flash('Genera captcha de registro primero.', false);
    const result = await api('/api/auth/request-admin-code', {
      method: 'POST',
      body: {
        email: $('regEmail').value,
        rol: $('regRol').value,
        captcha_id: regCaptchaId,
        answer: $('regCaptchaAnswer').value
      }
    });
    $('adminRequestResult').innerHTML = `Solicitud lista para enviar a <b>${result.admin_email}</b>. <a href="${result.gmail_url}" target="_blank" rel="noreferrer">Abrir Gmail</a>`;
    window.open(result.gmail_url, '_blank', 'noreferrer');
  } catch (error) {
    flash(error.message, false);
  }
};

$('regRol').onchange = updateRoleUI;

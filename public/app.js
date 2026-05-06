const API = window.location.origin;
let token = localStorage.getItem('token') || '';
let me = JSON.parse(localStorage.getItem('me') || 'null');
let captchaId = '';
let regCaptchaId = '';
let upgradeCaptchaId = '';

const $ = (id) => document.getElementById(id);
const flash = (message, ok = true) => {
  const alert = $('flash');
  alert.className = `alert ${ok ? 'alert-success' : 'alert-danger'} app-alert`;
  alert.textContent = message;
  alert.classList.remove('d-none');
};
const showSuccess = (title, message = 'La acción se realizó correctamente.') => {
  $('successModalTitle').textContent = title;
  $('successModalMessage').textContent = message;
  bootstrap.Modal.getOrCreateInstance($('successModal')).show();
};
const showWarning = (title, message = 'Hubo un problema al realizar la acción.') => {
  $('warningModalTitle').textContent = title;
  $('warningModalMessage').textContent = message;
  bootstrap.Modal.getOrCreateInstance($('warningModal')).show();
};
const handleError = (error) => {
  const message = error?.message || 'Proceso interrumpido o no completado.';
  flash(message, false);
  showWarning('Proceso no completado', message);
};
const closeModal = (id) => bootstrap.Modal.getInstance($(id))?.hide();
const isGmail = (email) => /^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(email || '');

async function api(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth && !token) throw new Error('Debes iniciar sesión');
  if (auth) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor. Revisa internet o intenta nuevamente.');
  }
  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : { message: await response.text() };

  if (!response.ok) {
    if (auth && response.status === 401) {
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
  $('roleUpgradePanel').classList.toggle('d-none', !me || me.rol === 'mixto');
  $('premiumPanel').classList.toggle('d-none', !me || me.rol !== 'mixto' || !me.is_premium);
}

function updateRoleUI() {
  const rol = $('regRol').value;
  const needsAdminCode = ['autor', 'mixto'].includes(rol);
  $('regAdminCode').disabled = !needsAdminCode;
  $('regAdminCode').style.opacity = needsAdminCode ? '1' : '0.6';
  $('adminCodeRequestBox').classList.toggle('d-none', !needsAdminCode);
  $('adminHelp').textContent = needsAdminCode
    ? 'Pulsa Recibir código para generar un código automático y pégalo aquí.'
    : 'Para lector no necesitas código admin.';
}

renderUI();
updateRoleUI();

document.querySelectorAll('.nav-btn').forEach((button) => {
  button.onclick = () => showTab(button.dataset.tab);
});

$('signup').onclick = async () => {
  try {
    const nombre = $('regNombre').value.trim();
    const email = $('regEmail').value.trim();
    const password = $('regPass').value;
    const rol = $('regRol').value;
    if (!nombre || !email || !password) throw new Error('Completa nombre, Gmail y contraseña.');
    if (!isGmail(email)) throw new Error('Debes usar un correo terminado en @gmail.com.');
    if (['autor', 'mixto'].includes(rol) && !$('regAdminCode').value.trim()) {
      throw new Error('Para autor/mixto primero solicita y escribe el código admin recibido por Gmail.');
    }
    await api('/api/auth/signup', {
      method: 'POST',
      body: { nombre, email, password, rol, admin_code: $('regAdminCode').value.trim() }
    });
    showSuccess('Registro completado', 'Tu cuenta fue creada. Ahora inicia sesión con tu Gmail.');
    closeModal('registerModal');
  } catch (error) {
    handleError(error);
  }
};

$('signin').onclick = async () => {
  try {
    const email = $('logEmail').value.trim();
    const password = $('logPass').value;
    if (!email || !password) throw new Error('Completa Gmail y contraseña.');
    if (!isGmail(email)) throw new Error('Debes iniciar sesión con un correo @gmail.com.');
    const data = await api('/api/auth/signin', {
      method: 'POST',
      body: { email, password }
    });
    token = data.accessToken;
    me = data;
    localStorage.setItem('token', token);
    localStorage.setItem('me', JSON.stringify(me));
    renderUI();
    showSuccess('Sesión iniciada', `Bienvenido, ${me.nombre}.`);
    closeModal('loginModal');
  } catch (error) {
    handleError(error);
  }
};

$('logout').onclick = () => {
  token = '';
  me = null;
  localStorage.clear();
  renderUI();
  showSuccess('Sesión cerrada', 'Saliste correctamente de BookSocial.');
};

$('buscar').onclick = async () => {
  try {
    const q = encodeURIComponent($('searchQ').value || '');
    const c = encodeURIComponent($('privateCode').value || '');
    const path = token ? `/api/libros?q=${q}&codigo_privado=${c}` : `/api/libros-publicos?q=${q}`;
    $('outLibros').textContent = JSON.stringify(await api(path, { auth: Boolean(token) }), null, 2);
    showSuccess('Búsqueda completada', 'Los resultados se cargaron correctamente.');
  } catch (error) {
    handleError(error);
  }
};

$('btnLoadCaptcha').onclick = async () => {
  try {
    const captcha = await api('/api/auth/captcha');
    captchaId = captcha.captcha_id;
    $('captchaImg').src = captcha.image_base64;
    showSuccess('Captcha generado', 'Tienes 2 minutos para escribir el código de la imagen.');
  } catch (error) {
    handleError(error);
  }
};

$('btnCaptcha').onclick = async () => {
  try {
    if (!me) return handleError(new Error('Primero inicia sesión para validar el captcha.'));
    if (!captchaId) return handleError(new Error('Genera captcha primero.'));
    const result = await api('/api/auth/author-code', {
      method: 'POST',
      auth: true,
      body: { captcha_id: captchaId, answer: $('captchaAnswer').value }
    });
    $('authorCodeBox').innerHTML = `<span class="badge text-bg-dark">Código autor: ${result.author_code}</span>`;
    showSuccess('Código de autor validado', 'Tu código de autor se mostró correctamente.');
  } catch (error) {
    handleError(error);
  }
};

$('btnRegCaptcha').onclick = async () => {
  try {
    const captcha = await api('/api/auth/captcha');
    regCaptchaId = captcha.captcha_id;
    $('regCaptchaImg').src = captcha.image_base64;
    $('adminRequestResult').textContent = 'Captcha listo. Escríbelo y pulsa Recibir código.';
    showSuccess('Captcha de registro generado', 'Escribe el código de la imagen para recibir el código automático.');
  } catch (error) {
    handleError(error);
  }
};

$('btnRequestAdminCode').onclick = async () => {
  try {
    if (!regCaptchaId) return handleError(new Error('Genera captcha de registro primero.'));
    const email = $('regEmail').value.trim();
    if (!isGmail(email)) throw new Error('Escribe un Gmail válido antes de solicitar código.');
    const result = await api('/api/auth/request-admin-code', {
      method: 'POST',
      body: {
        email,
        rol: $('regRol').value,
        captcha_id: regCaptchaId,
        answer: $('regCaptchaAnswer').value
      }
    });
    if (result.admin_code) {
      $('regAdminCode').value = result.admin_code;
    }
    $('adminRequestResult').innerHTML = `${result.message}<br><b>Admin:</b> ${result.admin_email}${result.admin_code ? `<br><b>Código:</b> ${result.admin_code}` : ''}`;
    showSuccess('Código automático listo', result.email_sent ? 'Revisa tu Gmail y pega el código recibido.' : 'El código se generó y se copió al campo de registro.');
  } catch (error) {
    handleError(error);
  }
};

$('regRol').onchange = updateRoleUI;

$('btnUpgradeCaptcha').onclick = async () => {
  try {
    if (!me) throw new Error('Inicia sesión para generar códigos de cambio de rol.');
    const captcha = await api('/api/auth/captcha');
    upgradeCaptchaId = captcha.captcha_id;
    $('upgradeCaptchaImg').src = captcha.image_base64;
    $('upgradeCodeResult').textContent = 'Captcha listo. Escríbelo y pulsa Generar códigos.';
    showSuccess('Captcha de cambio generado', 'Escribe el código de la imagen para generar el código admin y, si eliges mixto, el premium.');
  } catch (error) {
    handleError(error);
  }
};

$('btnRequestRoleCode').onclick = async () => {
  try {
    if (!me) throw new Error('Inicia sesión para generar códigos de cambio de rol.');
    if (!upgradeCaptchaId) throw new Error('Genera captcha de cambio de rol primero.');
    const result = await api('/api/auth/request-role-code', {
      method: 'POST',
      auth: true,
      body: {
        target_rol: $('upgradeRol').value,
        captcha_id: upgradeCaptchaId,
        answer: $('upgradeCaptchaAnswer').value
      }
    });
    if (result.admin_code) $('upgradeAdminCode').value = result.admin_code;
    if (result.premium_code) $('upgradePremiumCode').value = result.premium_code;
    $('upgradeCodeResult').innerHTML = `${result.message}<br><b>Admin:</b> ${result.admin_email}${result.admin_code ? `<br><b>Código admin:</b> ${result.admin_code}` : ''}${result.premium_code ? `<br><b>Código premium:</b> ${result.premium_code}` : ''}`;
    showSuccess('Códigos de rol listos', result.email_sent ? 'Revisa Gmail y pega los códigos recibidos.' : 'Los códigos se generaron y se copiaron en los campos.');
  } catch (error) {
    handleError(error);
  }
};


$('btnChangeRole').onclick = async () => {
  try {
    if (!me) throw new Error('Inicia sesión para cambiar el rol de tu cuenta.');
    const data = await api('/api/auth/change-role', {
      method: 'POST',
      auth: true,
      body: {
        target_rol: $('upgradeRol').value,
        admin_code: $('upgradeAdminCode').value.trim(),
        premium_code: $('upgradePremiumCode').value.trim()
      }
    });
    token = data.accessToken;
    me = data;
    localStorage.setItem('token', token);
    localStorage.setItem('me', JSON.stringify(me));
    renderUI();
    showSuccess('Rol actualizado', data.message);
  } catch (error) {
    handleError(error);
  }
};

$('btnAnalytics').onclick = async () => {
  try {
    const id = $('analyticsCommunityId').value.trim();
    if (!id) throw new Error('Escribe el ID de comunidad.');
    const data = await api(`/api/comunidades/${id}/analytics`, { auth: true });
    $('premiumOut').textContent = JSON.stringify(data, null, 2);
    showSuccess('Analítica cargada', 'Revisa la gráfica y datos recolectados de tu comunidad.');
  } catch (error) {
    handleError(error);
  }
};

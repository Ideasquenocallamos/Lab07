const API = window.location.origin;
let token = localStorage.getItem('token') || '';
let me = null;
try {
  me = JSON.parse(localStorage.getItem('me') || 'null');
} catch {
  localStorage.removeItem('me');
}
let captchaId = '';
let regCaptchaId = '';
let upgradeCaptchaId = '';

const $ = (id) => {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Elemento de interfaz no encontrado: ${id}`);
  return element;
};
const maybe = (id) => document.getElementById(id);
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
window.addEventListener('error', (event) => handleError(event.error || new Error(event.message)));
window.addEventListener('unhandledrejection', (event) => handleError(event.reason));
const isGmail = (email) => /^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(email || '');
const isAutorRole = () => me && ['autor', 'mixto'].includes(me.rol);
const isMixtoPremium = () => me?.rol === 'mixto' && me?.is_premium;
const showJson = (id, data) => { $(id).textContent = JSON.stringify(data, null, 2); };
const tabMeta = {
  home: { group: 'Principal', label: 'Home' },
  perfil: { group: 'Principal', label: 'Acceso' },
  lector: { group: 'Aplicaciones', label: 'Panel Lector' },
  autor: { group: 'Aplicaciones', label: 'Panel Autor' },
  mixto: { group: 'Aplicaciones', label: 'Mixto Premium' },
  asistente: { group: 'Aplicaciones', label: 'Asistente IA / Chat' }
};

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

function updateBreadcrumb(tabName) {
  const meta = tabMeta[tabName] || tabMeta.home;
  $('appBreadcrumb').innerHTML = `
    <li class="breadcrumb-item"><i class="bi bi-compass me-1"></i>BookSocial</li>
    <li class="breadcrumb-item">${meta.group}</li>
    <li class="breadcrumb-item active" aria-current="page">${meta.label}</li>
  `;
}

function showTab(tabName) {
  const target = maybe(`tab-${tabName}`) ? tabName : 'home';
  document.querySelectorAll('.tab-section').forEach((section) => section.classList.add('d-none'));
  $(`tab-${target}`).classList.remove('d-none');
  document.querySelectorAll('.nav-btn').forEach((button) => button.classList.toggle('active', button.dataset.tab === target));
  updateBreadcrumb(target);
}

function renderUI() {
  const roleLabel = me ? `${me.rol}${me.is_premium ? ' premium' : ''}` : 'Visitante';
  $('session').textContent = me ? `Sesión activa: ${me.nombre} (${roleLabel})` : 'Sin sesión';
  $('roleBadge').textContent = roleLabel;
  $('roleBadge').className = `badge rounded-pill role-badge ${me?.rol === 'mixto' ? 'text-bg-info' : me?.rol === 'autor' ? 'text-bg-warning' : me ? 'text-bg-success' : 'text-bg-secondary'}`;
  $('openRegisterBtn').classList.toggle('d-none', Boolean(me));
  $('openLoginBtn').classList.toggle('d-none', Boolean(me));
  $('logout').classList.toggle('d-none', !me);
  $('navLector').classList.toggle('d-none', false);
  $('navAutor').classList.toggle('d-none', !isAutorRole());
  $('navMixto').classList.toggle('d-none', !isMixtoPremium());
  $('secondaryHint').textContent = me ? 'Módulos disponibles según tu rol actual.' : 'Inicia sesión para ver módulos por rol.';
  $('authorCodePanel').classList.toggle('d-none', !isAutorRole());
  $('guestHelpPanel').classList.toggle('d-none', Boolean(isAutorRole()));
  const canUpgrade = Boolean(me && !isMixtoPremium());
  $('roleUpgradePanel').classList.toggle('d-none', !canUpgrade);
  if (canUpgrade) {
    const upgradingMixto = me.rol === 'mixto' && !me.is_premium;
    $('upgradeTitle').innerHTML = upgradingMixto
      ? '<i class="bi bi-stars me-1"></i>Mejorar a Mixto Premium'
      : '<i class="bi bi-arrow-up-circle me-1"></i>Cambiar rol de cuenta';
    $('upgradeHelp').textContent = upgradingMixto
      ? 'Tu cuenta ya es mixto. Genera captcha y códigos para activar las funciones premium de analítica y moderación.'
      : 'Si ya tienes lector, no crees otra cuenta con el mismo correo: cambia a Autor o Mixto Premium.';
    $('upgradeRol').value = upgradingMixto ? 'mixto' : $('upgradeRol').value;
    $('upgradeRol').disabled = upgradingMixto;
    $('upgradePremiumCode').classList.toggle('d-none', $('upgradeRol').value !== 'mixto' && !upgradingMixto);
  }
  $('premiumPanel').classList.toggle('d-none', !isMixtoPremium());
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
$('upgradeRol').onchange = () => $('upgradePremiumCode').classList.toggle('d-none', $('upgradeRol').value !== 'mixto');

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


const requireAutorPanel = () => {
  if (!isAutorRole()) throw new Error('Necesitas rol autor o mixto para usar este panel.');
};

$('btnCreateBook').onclick = async () => {
  try {
    requireAutorPanel();
    const result = await api('/api/libros', {
      method: 'POST',
      auth: true,
      body: {
        titulo: $('bookTitle').value.trim(),
        anio_publicacion: Number($('bookYear').value),
        derechos: $('bookRights').value.trim() || 'Autor',
        genero: $('bookGenre').value.trim(),
        etiquetas: $('bookTags').value.trim(),
        audiencia_objetivo: $('bookAudience').value.trim(),
        link_lectura: $('bookReadLink').value.trim(),
        link_wattpad: $('bookWattpad').value.trim(),
        link_ao3: $('bookAo3').value.trim(),
        link_fanfiction: $('bookFanfiction').value.trim(),
        link_webnovel: $('bookWebnovel').value.trim(),
        link_google_drive: $('bookDrive').value.trim(),
        estado_obra: $('bookVisibility').value === 'borrador' ? 'borrador' : 'publicada',
        visibilidad: $('bookVisibility').value
      }
    });
    showJson('autorOut', result);
    showSuccess('Libro creado', 'El contenido quedó registrado en el panel de autor.');
  } catch (error) {
    handleError(error);
  }
};

$('btnCreateCommunity').onclick = async () => {
  try {
    requireAutorPanel();
    const result = await api('/api/comunidades', {
      method: 'POST',
      auth: true,
      body: {
        tipo: $('communityType').value,
        descripcion: $('communityDescription').value.trim(),
        reglas: $('communityRules').value.trim()
      }
    });
    showJson('autorOut', result);
    showSuccess('Comunidad creada', 'La comunidad quedó lista para lectores.');
  } catch (error) {
    handleError(error);
  }
};

$('btnCreatePost').onclick = async () => {
  try {
    requireAutorPanel();
    const result = await api('/api/feed/post', {
      method: 'POST',
      auth: true,
      body: { texto: $('postText').value.trim(), etiquetas: $('postTags').value.trim() }
    });
    showJson('autorOut', result);
    showSuccess('Publicación creada', 'Tu promoción fue publicada.');
  } catch (error) {
    handleError(error);
  }
};

const compactValue = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const renderTablesOverview = (payload) => {
  $('tablesGeneratedAt').textContent = payload.generated_at ? new Date(payload.generated_at).toLocaleString() : 'Actualizado';
  $('tablesOverviewContent').innerHTML = payload.tables.map((table) => {
    const rows = table.rows || [];
    const columns = [...new Set(rows.flatMap((row) => Object.keys(row).slice(0, 6)))];
    const body = rows.length
      ? rows.map((row) => `<tr>${columns.map((column) => `<td>${compactValue(row[column]).slice(0, 80)}</td>`).join('')}</tr>`).join('')
      : `<tr><td class="text-muted">Sin registros recientes</td></tr>`;
    const header = columns.length ? columns.map((column) => `<th>${column}</th>`).join('') : '<th>Estado</th>';
    return `
      <details class="table-detail" ${table.count ? 'open' : ''}>
        <summary><span>${table.label}</span><span class="badge text-bg-primary">${table.count}</span></summary>
        <div class="table-responsive mt-2">
          <table class="table table-sm align-middle mb-0">
            <thead><tr>${header}</tr></thead>
            <tbody>${body}</tbody>
          </table>
        </div>
      </details>
    `;
  }).join('');
};

$('btnMixAnalytics').onclick = async () => {
  try {
    const id = $('mixAnalyticsCommunityId').value.trim();
    if (!id) throw new Error('Escribe el ID de comunidad.');
    const data = await api(`/api/comunidades/${id}/analytics`, { auth: true });
    showJson('mixtoOut', data);
    showSuccess('Analítica cargada', 'Se actualizó el panel Mixto Premium.');
  } catch (error) {
    handleError(error);
  }
};

$('btnModerateMember').onclick = async () => {
  try {
    const result = await api('/api/comunidades/members/moderate', {
      method: 'POST',
      auth: true,
      body: {
        id_comunidad: $('modCommunityId').value.trim(),
        user_id: $('modUserId').value.trim(),
        status: $('modStatus').value,
        moderation_note: $('modNote').value.trim()
      }
    });
    showJson('mixtoOut', result);
    showSuccess('Moderación aplicada', 'El estado del miembro fue actualizado.');
  } catch (error) {
    handleError(error);
  }
};


$('btnTablesOverview').onclick = async () => {
  try {
    const data = await api('/api/admin/tables-overview', { auth: true });
    renderTablesOverview(data);
    showJson('mixtoOut', { resumen_tablas: data.tables.map((table) => ({ tabla: table.key, registros: table.count })) });
    showSuccess('Tablas cargadas', 'La vista inferior muestra registros generales por tabla.');
  } catch (error) {
    handleError(error);
  }
};

const appAnswers = [
  { keys: ['autor', 'cambiar', 'rol'], answer: 'Para cambiar a Autor: inicia sesión, abre Acceso, genera captcha en Cambiar rol, pulsa Generar códigos, pega el código admin y confirma Cambiar rol.' },
  { keys: ['mixto', 'premium'], answer: 'Mixto Premium conserva lectura y autor, añade analítica, moderación, gráfica de búsquedas/vistas y gestión avanzada de comunidades. Requiere código admin y código premium generado con captcha.' },
  { keys: ['codigo', 'captcha'], answer: 'Los códigos de registro, cambio de rol y premium se generan con captcha. Vencen en 10 minutos y pueden llegar por SMTP o mostrarse para pruebas si ADMIN_CODE_RESPONSE está activo.' },
  { keys: ['comunidad', 'moderacion', 'bloquear'], answer: 'En Mixto Premium puedes consultar analítica de comunidad y moderar miembros con estados activo, restringido o bloqueado desde el panel Mixto.' },
  { keys: ['libro', 'publicar'], answer: 'En el panel Autor puedes crear libros con título, año, derechos, género, etiquetas, audiencia, enlaces externos y visibilidad pública/privada/borrador. Las búsquedas y vistas alimentan book_events.' },
  { keys: ['lector', 'enlaces', 'wattpad', 'ao3', 'fanfiction', 'webnovel', 'drive'], answer: 'El panel Lector permite buscar obras, usar código privado o beta, abrir enlaces Wattpad/AO3/FanFiction/Webnovel/Drive y dejar reseñas.' },
  { keys: ['tabla', 'tablas', 'registros'], answer: 'En Mixto Premium, abre Tablas usadas y pulsa Ver registros generales. Verás conteos y registros recientes de users, autores, libros, comunidades, miembros, posts, notificaciones y eventos.' },
  { keys: ['ataque', 'ataques', 'proteccion', 'proteger'], answer: 'Para proteger comunidades usa invitación privada, reglas claras y moderación Mixto Premium: activo, restringido o bloqueado. Las reseñas/eventos ayudan a detectar actividad dañina.' },
  { keys: ['railway', 'mysql', 'deploy'], answer: 'Para Railway usa variables DB_* o MYSQL*, JWT_SECRET, DB_SYNC_ALTER=true si necesitas sincronizar tablas, y npm install --omit=dev para evitar warnings de production.' }
];

const answerBookSocialQuestion = (question) => {
  const clean = question.toLowerCase();
  if (!clean.trim()) return 'Escribe una pregunta relacionada con BookSocial.';
  const hit = appAnswers.find((item) => item.keys.some((key) => clean.includes(key)));
  if (hit) return hit.answer;
  return 'Solo puedo ayudar con este aplicativo BookSocial: acceso, roles, lector, autor, mixto premium, libros, enlaces, comunidades, tablas, analítica, moderación, códigos, captcha o despliegue.';
};

$('btnAskAi').onclick = () => {
  $('aiAnswer').textContent = answerBookSocialQuestion($('aiQuestion').value);
};

document.querySelectorAll('.ai-prompt').forEach((button) => {
  button.onclick = () => {
    $('aiQuestion').value = button.dataset.question;
    $('aiAnswer').textContent = answerBookSocialQuestion(button.dataset.question);
  };
});


const formatBookList = (books) => books.map((book) => ({
  id: book.id_libro,
  titulo: book.titulo,
  autor: book.autore?.nombre_autor || book.autor?.nombre_autor,
  genero: book.genero,
  etiquetas: book.etiquetas,
  visibilidad: book.visibilidad,
  codigo_beta: book.beta_reader_code,
  reseñas: book.comentarios_resenas,
  enlaces: {
    principal: book.link_lectura,
    wattpad: book.link_wattpad,
    ao3: book.link_ao3,
    fanfiction: book.link_fanfiction,
    webnovel: book.link_webnovel,
    drive: book.link_google_drive
  }
}));

$('btnReaderSearch').onclick = async () => {
  try {
    const q = encodeURIComponent($('readerSearchQ').value.trim());
    const code = encodeURIComponent($('readerPrivateCode').value.trim());
    const path = token ? `/api/libros?q=${q}&codigo_privado=${code}&source=lector` : `/api/libros-publicos?q=${q}&source=lector`;
    const books = await api(path, { auth: Boolean(token) });
    showJson('lectorOut', formatBookList(books));
    showSuccess('Obras encontradas', 'Revisa enlaces, reseñas y códigos beta si existen.');
  } catch (error) {
    handleError(error);
  }
};

$('btnSaveReview').onclick = async () => {
  try {
    if (!token) throw new Error('Inicia sesión para guardar reseñas o comentarios.');
    const id = $('reviewBookId').value.trim();
    const review = $('reviewText').value.trim();
    if (!id || !review) throw new Error('Escribe ID de libro y reseña.');
    const result = await api(`/api/libros/${id}/review`, {
      method: 'POST',
      auth: true,
      body: { texto: review }
    });
    showJson('lectorOut', result);
    showSuccess('Reseña guardada', 'Tu comentario alimenta la información de la obra.');
  } catch (error) {
    handleError(error);
  }
};

$('btnJoinCommunity').onclick = async () => {
  try {
    if (!token) throw new Error('Inicia sesión para entrar a comunidades.');
    const result = await api('/api/comunidades/join', {
      method: 'POST',
      auth: true,
      body: { id_comunidad: $('joinCommunityId').value.trim(), codigo: $('joinCommunityCode').value.trim() }
    });
    showJson('lectorOut', result);
    showSuccess('Solicitud procesada', 'La comunidad validó tu acceso o restricciones.');
  } catch (error) {
    handleError(error);
  }
};

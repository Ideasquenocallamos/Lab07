const API = window.location.origin;
let token = localStorage.getItem('token') || '';
const $ = (id) => document.getElementById(id);

function setStatus() {
  $('tokenStatus').textContent = token ? `Token activo: ${token.slice(0, 18)}...` : 'Sin sesión activa';
}
setStatus();

function show(msg, ok = true) {
  const el = $('alerta');
  el.className = `alert mt-3 ${ok ? 'alert-success' : 'alert-danger'}`;
  el.classList.remove('d-none');
  el.textContent = msg;
}

async function api(path, method='GET', body=null, auth=false) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { method, headers, body: body ? JSON.stringify(body) : null });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Error de API');
  return data;
}

$('signupBtn').onclick = async () => {
  try {
    await api('/api/auth/signup', 'POST', { nombre: $('nombre').value, email: $('email').value, password: $('password').value });
    show('Registro exitoso');
  } catch (e) { show(e.message, false); }
};

$('signinBtn').onclick = async () => {
  try {
    const data = await api('/api/auth/signin', 'POST', { email: $('email').value, password: $('password').value });
    token = data.accessToken;
    localStorage.setItem('token', token);
    setStatus();
    show('Login exitoso');
  } catch (e) { show(e.message, false); }
};

$('logoutBtn').onclick = () => {
  token = '';
  localStorage.removeItem('token');
  setStatus();
  show('Sesión cerrada');
};

$('crearAutorBtn').onclick = async () => {
  try {
    await api('/api/autores', 'POST', {
      nombre_autor: $('autorNombre').value,
      pais_origen: $('autorPais').value,
      fecha_nacimiento: $('autorFecha').value
    }, true);
    show('Autor creado');
    listarAutores();
  } catch (e) { show(e.message, false); }
};

$('crearLibroBtn').onclick = async () => {
  try {
    await api('/api/libros', 'POST', {
      titulo: $('libroTitulo').value,
      anio_publicacion: Number($('libroAnio').value),
      id_autor: Number($('libroAutorId').value),
      derechos: $('libroDerechos').value,
      portada: $('libroPortada').value
    }, true);
    show('Libro creado');
    listarLibros();
  } catch (e) { show(e.message, false); }
};

async function eliminarAutor(id) {
  try { await api(`/api/autores/${id}`, 'DELETE', null, true); show('Autor eliminado'); listarAutores(); }
  catch (e) { show(e.message, false); }
}

async function eliminarLibro(id) {
  try { await api(`/api/libros/${id}`, 'DELETE', null, true); show('Libro eliminado'); listarLibros(); }
  catch (e) { show(e.message, false); }
}

async function listarAutores() {
  try {
    const data = await api('/api/autores', 'GET', null, true);
    $('autoresBody').innerHTML = data.map(a => `<tr><td>${a.id_autor}</td><td>${a.nombre_autor}</td><td>${a.pais_origen}</td><td><button class='btn btn-sm btn-outline-danger' onclick='eliminarAutor(${a.id_autor})'>Eliminar</button></td></tr>`).join('');
  } catch (e) { show(e.message, false); }
}

async function listarLibros() {
  try {
    const data = await api('/api/libros', 'GET', null, true);
    $('librosBody').innerHTML = data.map(l => `<tr><td>${l.id_libro}</td><td>${l.titulo}</td><td>${l.autor?.nombre_autor || l.autore?.nombre_autor || '-'}</td><td><button class='btn btn-sm btn-outline-danger' onclick='eliminarLibro(${l.id_libro})'>Eliminar</button></td></tr>`).join('');
  } catch (e) { show(e.message, false); }
}

$('listarAutoresBtn').onclick = listarAutores;
$('listarLibrosBtn').onclick = listarLibros;
window.eliminarAutor = eliminarAutor;
window.eliminarLibro = eliminarLibro;

const API = window.location.origin;
let token = localStorage.getItem('token') || '';

const $ = (id) => document.getElementById(id);
const tokenState = $('tokenState');
const msg = $('msg');

const showMsg = (text, ok = true) => {
  msg.className = `alert mt-4 ${ok ? 'alert-success' : 'alert-danger'}`;
  msg.classList.remove('d-none');
  msg.textContent = typeof text === 'string' ? text : JSON.stringify(text, null, 2);
};

const setTokenState = () => {
  tokenState.textContent = token ? `Sesión activa: ${token.slice(0, 20)}...` : 'No hay sesión activa';
};
setTokenState();

async function req(path, method = 'GET', body = null, secure = false) {
  const headers = { 'Content-Type': 'application/json' };
  if (secure) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { method, headers, body: body ? JSON.stringify(body) : null });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Error en la solicitud');
  return data;
}

$('btnSignup').onclick = async () => {
  try {
    const data = await req('/api/auth/signup', 'POST', { nombre: $('nombre').value, email: $('email').value, password: $('password').value });
    showMsg(data);
  } catch (e) { showMsg(e.message, false); }
};

$('btnSignin').onclick = async () => {
  try {
    const data = await req('/api/auth/signin', 'POST', { email: $('email').value, password: $('password').value });
    token = data.accessToken || '';
    localStorage.setItem('token', token);
    setTokenState();
    showMsg('Login exitoso');
  } catch (e) { showMsg(e.message, false); }
};

$('btnLogout').onclick = () => {
  token = '';
  localStorage.removeItem('token');
  setTokenState();
  showMsg('Sesión cerrada');
};

$('crearAutor').onclick = async () => {
  try {
    await req('/api/autores', 'POST', { nombre_autor: $('nombreAutor').value, pais_origen: $('paisAutor').value, fecha_nacimiento: $('fechaAutor').value }, true);
    showMsg('Autor creado');
    cargarAutores();
  } catch (e) { showMsg(e.message, false); }
};

$('crearLibro').onclick = async () => {
  try {
    await req('/api/libros', 'POST', {
      titulo: $('tituloLibro').value,
      anio_publicacion: Number($('anioLibro').value),
      id_autor: Number($('autorLibro').value),
      derechos: $('derechosLibro').value,
      portada: $('portadaLibro').value
    }, true);
    showMsg('Libro creado');
    cargarLibros();
  } catch (e) { showMsg(e.message, false); }
};

async function cargarAutores() {
  try {
    const autores = await req('/api/autores', 'GET', null, true);
    $('tablaAutores').innerHTML = autores.map(a => `<tr><td>${a.id_autor}</td><td>${a.nombre_autor}</td><td>${a.pais_origen}</td></tr>`).join('');
  } catch (e) { showMsg(e.message, false); }
}

async function cargarLibros() {
  try {
    const libros = await req('/api/libros', 'GET', null, true);
    $('tablaLibros').innerHTML = libros.map(l => `<tr><td>${l.id_libro}</td><td>${l.titulo}</td><td>${l.autor?.nombre_autor || l.autore?.nombre_autor || '-'}</td></tr>`).join('');
  } catch (e) { showMsg(e.message, false); }
}

$('refreshAutores').onclick = cargarAutores;
$('refreshLibros').onclick = cargarLibros;

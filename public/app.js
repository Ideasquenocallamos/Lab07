const API_BASE = window.location.origin;
let token = localStorage.getItem('token') || '';

const $ = (id) => document.getElementById(id);
const flash = (message, ok = true) => {
  const el = $('flash');
  el.className = `alert ${ok ? 'alert-success' : 'alert-danger'}`;
  el.textContent = message;
  el.classList.remove('d-none');
};
const refreshSession = () => $('sessionStatus').textContent = token ? `Token activo: ${token.slice(0, 18)}...` : 'Sin sesión activa';
refreshSession();

async function api(path, { method='GET', body, auth=false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Error en API');
  return data;
}

async function signup() {
  await api('/api/auth/signup', { method:'POST', body: { nombre: $('nombre').value, email: $('email').value, password: $('password').value } });
  flash('Usuario registrado');
}

async function signin() {
  const data = await api('/api/auth/signin', { method:'POST', body: { email: $('email').value, password: $('password').value } });
  token = data.accessToken;
  localStorage.setItem('token', token);
  refreshSession();
  flash('Login correcto');
}

function logout() { token=''; localStorage.removeItem('token'); refreshSession(); flash('Sesión cerrada'); }

async function crearAutor() {
  await api('/api/autores', { method:'POST', auth:true, body:{ nombre_autor:$('aNombre').value, pais_origen:$('aPais').value, fecha_nacimiento:$('aFecha').value } });
  flash('Autor creado');
  await cargarAutores();
}

async function cargarAutores() {
  const autores = await api('/api/autores', { auth:true });
  $('tbAutores').innerHTML = autores.map(a => `
    <tr>
      <td>${a.id_autor}</td><td>${a.nombre_autor}</td><td>${a.pais_origen}</td>
      <td class="text-end d-flex gap-1 justify-content-end">
        <button class="btn btn-sm btn-outline-warning" onclick="editarAutor(${a.id_autor})">Editar</button>
        <button class="btn btn-sm btn-outline-danger" onclick="eliminarAutor(${a.id_autor})">Eliminar</button>
      </td>
    </tr>`).join('');
}

async function editarAutor(id) {
  const nombre_autor = prompt('Nuevo nombre del autor:');
  const pais_origen = prompt('Nuevo país de origen:');
  if (!nombre_autor || !pais_origen) return;
  await api(`/api/autores/${id}`, { method:'PUT', auth:true, body:{ nombre_autor, pais_origen } });
  flash('Autor actualizado');
  await cargarAutores();
}

async function eliminarAutor(id) {
  await api(`/api/autores/${id}`, { method:'DELETE', auth:true });
  flash('Autor eliminado');
  await cargarAutores();
}

async function crearLibro() {
  await api('/api/libros', { method:'POST', auth:true, body:{ titulo:$('lTitulo').value, anio_publicacion:Number($('lAnio').value), id_autor:Number($('lAutor').value), derechos:$('lDerechos').value, portada:$('lPortada').value } });
  flash('Libro creado');
  await cargarLibros();
}

async function cargarLibros() {
  const libros = await api('/api/libros', { auth:true });
  $('tbLibros').innerHTML = libros.map(l => `
    <tr>
      <td>${l.id_libro}</td><td>${l.titulo}</td><td>${l.autor?.nombre_autor || l.autore?.nombre_autor || '-'}</td>
      <td class="text-end d-flex gap-1 justify-content-end">
        <button class="btn btn-sm btn-outline-warning" onclick="editarLibro(${l.id_libro})">Editar</button>
        <button class="btn btn-sm btn-outline-danger" onclick="eliminarLibro(${l.id_libro})">Eliminar</button>
      </td>
    </tr>`).join('');
}

async function editarLibro(id) {
  const titulo = prompt('Nuevo título del libro:');
  if (!titulo) return;
  await api(`/api/libros/${id}`, { method:'PUT', auth:true, body:{ titulo } });
  flash('Libro actualizado');
  await cargarLibros();
}

async function eliminarLibro(id) {
  await api(`/api/libros/${id}`, { method:'DELETE', auth:true });
  flash('Libro eliminado');
  await cargarLibros();
}

$('btnSignup').onclick = () => signup().catch(e => flash(e.message, false));
$('btnSignin').onclick = () => signin().catch(e => flash(e.message, false));
$('btnLogout').onclick = logout;
$('btnCreateAutor').onclick = () => crearAutor().catch(e => flash(e.message, false));
$('btnLoadAutores').onclick = () => cargarAutores().catch(e => flash(e.message, false));
$('btnCreateLibro').onclick = () => crearLibro().catch(e => flash(e.message, false));
$('btnLoadLibros').onclick = () => cargarLibros().catch(e => flash(e.message, false));

window.editarAutor = (id) => editarAutor(id).catch(e => flash(e.message, false));
window.eliminarAutor = (id) => eliminarAutor(id).catch(e => flash(e.message, false));
window.editarLibro = (id) => editarLibro(id).catch(e => flash(e.message, false));
window.eliminarLibro = (id) => eliminarLibro(id).catch(e => flash(e.message, false));

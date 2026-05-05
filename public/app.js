const API = window.location.origin;
let token = localStorage.getItem('token') || '';
let me = JSON.parse(localStorage.getItem('me') || 'null');
const $=(id)=>document.getElementById(id);
const flash=(m,ok=true)=>{const e=$('flash');e.className=`alert ${ok?'alert-success':'alert-danger'}`;e.textContent=m;e.classList.remove('d-none');};
const refreshUI=()=>{
  $('session').textContent = me ? `Sesión: ${me.nombre} (${me.rol})` : 'Sin sesión';
  $('perfil').innerHTML = me ? `<b>${me.nombre}</b><br>${me.email}<br>Rol: ${me.rol}<br>Bio: ${me.bio || 'Sin bio'}` : 'Debes iniciar sesión.';
  $('panelAutor').classList.toggle('d-none', !me || me.rol!=='autor');
  $('panelLector').classList.toggle('d-none', !me || me.rol!=='lector');
};
refreshUI();
async function api(path,{method='GET',body,auth=false}={}){const h={'Content-Type':'application/json'};if(auth)h.Authorization=`Bearer ${token}`;const r=await fetch(`${API}${path}`,{method,headers:h,body:body?JSON.stringify(body):undefined});const d=await r.json();if(!r.ok)throw new Error(d.message||'Error');return d;}

$('signup').onclick=async()=>{try{await api('/api/auth/signup',{method:'POST',body:{nombre:$('nombre').value,email:$('email').value,password:$('password').value,rol:$('rol').value,admin_code:$('adminCode').value}});flash('Registro exitoso, ahora ingresa.');}catch(e){flash(e.message,false)}};
$('signin').onclick=async()=>{try{const d=await api('/api/auth/signin',{method:'POST',body:{email:$('email').value,password:$('password').value}});token=d.accessToken;me=d;localStorage.setItem('token',token);localStorage.setItem('me',JSON.stringify(me));refreshUI();flash('Bienvenido '+d.nombre);}catch(e){flash(e.message,false)}};
$('logout').onclick=()=>{token='';me=null;localStorage.removeItem('token');localStorage.removeItem('me');refreshUI();flash('Sesión cerrada');};

const loadAutores=async()=>$('outAutores').textContent=JSON.stringify(await api('/api/autores',{auth:true}),null,2);
const loadLibros=async()=>{const libros=await api('/api/libros',{auth:true});$('outLibros').textContent=JSON.stringify(libros,null,2); if(me?.rol==='lector'){const links=libros.map(l=>`• ${l.titulo}: ${l.link_lectura || 'sin link'}`).join('\n'); flash('Lectura disponible para cliente:\n'+links,true);} };
$('loadAutores').onclick=()=>loadAutores().catch(e=>flash(e.message,false));
$('loadLibros').onclick=()=>loadLibros().catch(e=>flash(e.message,false));
$('loadAutoresLector').onclick=()=>loadAutores().catch(e=>flash(e.message,false));
$('loadLibrosLector').onclick=()=>loadLibros().catch(e=>flash(e.message,false));

$('crearAutor').onclick=async()=>{try{await api('/api/autores',{method:'POST',auth:true,body:{nombre_autor:$('aNombre').value,pais_origen:$('aPais').value,fecha_nacimiento:$('aFecha').value}});flash('Autor creado');loadAutores();}catch(e){flash(e.message,false)}};
$('crearLibro').onclick=async()=>{try{await api('/api/libros',{method:'POST',auth:true,body:{titulo:$('lTitulo').value,anio_publicacion:Number($('lAnio').value),id_autor:$('lAutor').value?Number($('lAutor').value):null,derechos:$('lDerechos').value,portada:$('lPortada').value,link_lectura:$('lLink').value}});flash('Libro creado');loadLibros();}catch(e){flash(e.message,false)}};

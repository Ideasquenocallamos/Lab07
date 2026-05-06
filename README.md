# CRUD de Libros, Autores y Comunidad (Express + MySQL)

Este proyecto implementa un backend CRUD con autenticación JWT para:
- **Autores**
- **Libros** (relación 1:N con autores)
- Base de **Comunidades** y **Salas** para extensión social

---

## 1) Requisitos

- Node.js 18+
- MySQL 8+ (local o en la nube)
- npm
- Postman/Insomnia (opcional, para pruebas)

---

## 2) Estructura del proyecto

```text
.
├── app
│   ├── config
│   │   ├── auth.config.js
│   │   └── db.config.js
│   ├── controllers
│   │   ├── auth.controller.js
│   │   ├── autor.controller.js
│   │   └── libro.controller.js
│   ├── middlewares
│   │   ├── authJwt.js
│   │   └── validate.js
│   ├── models
│   │   ├── autor.model.js
│   │   ├── comunidad.model.js
│   │   ├── libro.model.js
│   │   ├── sala.model.js
│   │   ├── user.model.js
│   │   └── index.js
│   └── routes
│       ├── auth.routes.js
│       ├── autor.routes.js
│       └── libro.routes.js
├── server.js
└── README.md
```

---

## 3) Modelo de datos

### `autores`
- `id_autor` (PK)
- `nombre_autor`
- `pais_origen`
- `fecha_nacimiento`
- `ultima_actividad` (opcional)

### `libros`
- `id_libro` (PK)
- `titulo`
- `anio_publicacion`
- `portada` (ruta o URL)
- `derechos`
- `id_autor` (FK a `autores`)

### `comunidades`
Base social con tipo pública/privada, descripción, reglas, etc.

### `salas`
Salas de interacción dentro de una comunidad.

### Relaciones
- `Autor hasMany Libro`
- `Autor hasMany Comunidad`
- `Comunidad hasMany Sala`

---

## 4) Configuración local paso a paso

### 4.1 Clonar e instalar

```bash
git clone <TU_REPO_GITHUB>
cd Lab07
npm install
```

### 4.2 Crear base de datos local en MySQL

En MySQL Workbench o consola:

```sql
CREATE DATABASE lab07_libros;
```

> No necesitas crear tablas manualmente si usas `sequelize.sync()` (el proyecto las crea).

### 4.3 Crear archivo `.env`

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=lab07_libros
JWT_SECRET=lab07-secret
PORT=3000
```

### 4.4 Ejecutar proyecto

```bash
npm start
```

Si todo está bien, verás servidor activo en el puerto configurado.

---

## 5) Cómo probar el CRUD (flujo completo)

## 5.1 Registro (puedes usar Gmail)

`POST /api/auth/signup`

```json
{
  "nombre": "Autor Demo",
  "email": "tucorreo+autor1@gmail.com",
  "password": "123456"
}
```

## 5.2 Login

`POST /api/auth/signin`

Guarda el `accessToken` de la respuesta.

## 5.3 Crear autor (protegido)

`POST /api/autores`

Header:
- `Authorization: Bearer <TOKEN>`

Body:
```json
{
  "nombre_autor": "Isabel Allende",
  "pais_origen": "Chile",
  "fecha_nacimiento": "1942-08-02"
}
```

## 5.4 Crear libro (protegido)

`POST /api/libros`

```json
{
  "titulo": "La casa de los espíritus",
  "anio_publicacion": 1982,
  "portada": "https://misitio.com/portadas/libro1.jpg",
  "derechos": "Reservados",
  "id_autor": 1
}
```

## 5.5 Consultar / Editar / Eliminar

- `GET /api/autores`
- `PUT /api/autores/:id`
- `DELETE /api/autores/:id`
- `GET /api/libros`
- `PUT /api/libros/:id`
- `DELETE /api/libros/:id`

---

## 6) Conectar a MySQL online (Railway / Aiven / PlanetScale / Cloud SQL)

> Importante: **MongoDB no es MySQL**. Este proyecto usa Sequelize con dialecto MySQL, por eso necesitas un servicio MySQL compatible.

### Opción A: Railway (rápido)
1. Crea proyecto en Railway.
2. Agrega plugin/base de datos **MySQL**.
3. Copia credenciales: `host`, `port`, `database`, `user`, `password`.
4. En tu app, configura variables:
   - `DB_HOST`
   - `DB_USER`
   - `DB_PASSWORD`
   - `DB_NAME`
5. Despliega el backend y prueba endpoints.

### Opción B: Google Cloud SQL (MySQL)
1. Crear proyecto en Google Cloud.
2. Crear instancia **Cloud SQL for MySQL**.
3. Crear base de datos (`lab07_libros`) y usuario.
4. Autorizar red (IP) o usar conector seguro.
5. Configurar las variables `DB_*` en tu backend desplegado.
6. Desplegar en Render/Railway/Cloud Run y verificar conexión.

### Opción C: PlanetScale (MySQL serverless)
1. Crear base y rama en PlanetScale.
2. Generar password de conexión.
3. Copiar host, usuario, contraseña, database.
4. Cargar estas credenciales en `.env` (local) o variables del host (producción).

---

## 7) Desplegar backend paso a paso (Render ejemplo)

1. Sube este proyecto a GitHub.
2. En Render: **New Web Service**.
3. Conecta tu repositorio.
4. Configura:
   - Build: `npm install`
   - Start: `npm start`
5. Agrega variables de entorno:
   - `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
   - `JWT_SECRET`
   - `PORT` (opcional, Render lo inyecta)
6. Deploy.
7. Copia la URL pública y prueba:
   - `https://tu-app.onrender.com/`
   - `https://tu-app.onrender.com/api/auth/signup`

---

## 8) Entregables solicitados

- Código fuente en GitHub.
- Link funcional desplegado.
- Video máximo 5 minutos mostrando:
  1. Registro/login
  2. CRUD autores
  3. CRUD libros
  4. Relación autor-libros
  5. Ejemplo de conexión a MySQL online

---

## 9) Nota sobre portada de imagen

Actualmente `portada` se maneja como ruta/URL en el JSON del libro. Si deseas, en la siguiente mejora se puede activar carga real de archivos con Multer (`multipart/form-data`) y almacenamiento en disco o en Cloudinary/S3.


## 10) Archivo `.env` y dónde colocarlo

- Debes crear el archivo `.env` en la **raíz del proyecto** (al lado de `server.js`).
- Ya se incluye `\.env.example` para guiarte.

```bash
cp .env.example .env
```

Luego edita tus credenciales reales de MySQL local o online.

## 11) Importar colección de Postman

Se agregó el archivo `postman_collection.json` en la raíz del proyecto.

Pasos:
1. Abre Postman.
2. Click en **Import**.
3. Selecciona `postman_collection.json`.
4. Ajusta variable `base_url`:
   - Local: `http://localhost:3000`
   - Deploy: `https://tu-app.onrender.com`
5. Ejecuta en orden:
   - `Auth - Signup`
   - `Auth - Signin`
   - Copia el token en variable `token`
   - CRUD de `Autores` y `Libros`

## 12) Publicar en GitHub

No puedo publicar directamente en tu cuenta de GitHub sin tus credenciales/token, pero ya te dejo todo listo.

Comandos que debes ejecutar en tu PC:

```bash
git add .
git commit -m "Agregar Postman collection y .env.example"
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git branch -M main
git push -u origin main
```

Si ya tienes `origin` configurado, solo usa:

```bash
git push
```


## 13) Frontend incluido (HTML + Bootstrap)

Se agregó un frontend simple en:
- `public/index.html`
- `public/app.js`

Este frontend permite:
- Signup / Signin
- Crear autores
- Crear libros
- Listar autores y libros

Al levantar el backend, abre:
- `http://localhost:3000/`

## 14) Desplegar en Railway (Backend + Frontend estático)

Como el frontend está dentro de `public/`, Railway lo sirve junto con el backend Express.

Pasos:
1. Sube tu código a GitHub.
2. En Railway, crea **New Project** > **Deploy from GitHub repo**.
3. Selecciona este repositorio.
4. Railway detectará Node automáticamente.
5. En variables de entorno agrega:
   - `DB_HOST`
   - `DB_USER`
   - `DB_PASSWORD`
   - `DB_NAME`
   - `JWT_SECRET`
6. Si tu MySQL también está en Railway, copia esas credenciales del servicio MySQL.
7. Deploy.
8. Abre el dominio generado por Railway:
   - `https://tu-app.up.railway.app/` (Frontend)
   - `https://tu-app.up.railway.app/api/...` (API)

### Recomendación CORS
Si frontend y backend están en el mismo servicio (como aquí), no tendrás problema de CORS porque usan el mismo dominio.



## 15) ¿Qué servicio de Railway usar para la web?

Para este proyecto usa **1 servicio Web (Node.js)** en Railway:

- Tipo: **Web Service** (Deploy from GitHub Repo)
- Este único servicio te sirve:
  - Frontend estático: `/`
  - Backend API: `/api/*`

Además necesitas **1 servicio de base de datos MySQL**:
- Opción A: MySQL dentro de Railway (plugin/servicio DB)
- Opción B: MySQL externo (Cloud SQL, PlanetScale, Aiven, etc.)

### Arquitectura recomendada en Railway
1. `lab07-web` → Servicio Web Node.js (este repositorio).
2. `lab07-mysql` → Servicio MySQL (si lo quieres dentro de Railway).

### Configuración mínima del servicio web
- Build Command: `npm install`
- Start Command: `npm start`
- Variables:
  - `DB_HOST`
  - `DB_USER`
  - `DB_PASSWORD`
  - `DB_NAME`
  - `JWT_SECRET`

Con eso tu dominio Railway quedará así:
- `https://tu-app.up.railway.app/` → Frontend
- `https://tu-app.up.railway.app/api/auth/signin` → API


## 16) Error ECONNREFUSED en Railway (solución)

Si ves errores como `SequelizeConnectionRefusedError` o `ECONNREFUSED`, revisa:

1. Variables correctas en Railway:
   - `DB_HOST`
   - `DB_PORT` (normalmente `3306`)
   - `DB_USER`
   - `DB_PASSWORD`
   - `DB_NAME`
2. Si tu proveedor exige SSL, activa:
   - `DB_SSL=true`
3. Verifica con:
   - `GET /api/health`

Respuesta esperada:
- `200` -> DB conectada
- `503` -> DB no conectada (pero app viva)


## 17) Roles y paneles (Autor admin vs Lector cliente)

- `rol=autor`: panel administrativo (crear/editar/eliminar autores y libros).
- `rol=lector`: panel cliente (solo ver contenido).
- `rol=mixto`: puede leer y gestionar contenido como autor.

Para crear cuenta `autor` o `mixto` en signup debes enviar un `admin_code` vigente. Ese código se genera automáticamente desde `POST /api/auth/request-admin-code`, vence en 10 minutos y se consume al registrarte.

Contacto real del administrador:
- `andersson.guevara.b@tecsup.edu.pe`

Variables recomendadas:
```env
ADMIN_EMAIL=andersson.guevara.b@tecsup.edu.pe
ADMIN_CODE_RESPONSE=true
# Opcional: código fijo de emergencia, no recomendado para producción
# ADMIN_REGISTER_CODE=LAB07_ADMIN
```


## 18) Regla de autor por defecto y anónimo

Al crear libro:
- Si envías `id_autor`, se usa ese autor.
- Si NO envías `id_autor`, el sistema intenta usar el autor vinculado al usuario admin actual (`user_id`).
- Si el admin no tiene autor vinculado, se asigna automáticamente a **Anónimo**.

Además, el libro incluye `link_lectura` para redirigir al panel cliente (estilo Wattpad) y leer contenido digital.


## 19) Captcha código autor, visibilidad y búsqueda

- Botón frontend: **Obtener código autor (Captcha)**.
- Endpoint captcha: `GET /api/auth/captcha`
- Endpoint código autor: `POST /api/auth/author-code`
- Un correo por autor: se mantiene `email` único en `users`.
- Libros con visibilidad: `publico`, `privado`, `borrador`.
- Libros privados se muestran solo con `codigo_privado`.
- Búsqueda por título/referencia con `q` y código privado opcional.
- Campos nuevos de libro: `etiquetas`, `comentarios_resenas`, `link_lectura`.


## 20) Código automático para registro autor/mixto por Gmail

Para registrar una cuenta con rol `autor` o `mixto`:

1. Abre **Acceso** > **Registrarse**.
2. Selecciona rol `Autor` o `Mixto`.
3. Escribe tu correo Gmail.
4. Presiona **Generar captcha** en el bloque “Recibir código admin por Gmail”.
5. Copia manualmente el texto de la imagen captcha.
6. Presiona **Recibir código**.
7. La app genera un código de 6 dígitos, lo guarda por 10 minutos y envía automáticamente un correo al Gmail solicitante con copia al administrador `andersson.guevara.b@tecsup.edu.pe`.
8. Pega el código recibido en “Código admin recibido por Gmail” y completa el registro.

Variables relacionadas para envío automático por SMTP:

```env
ADMIN_EMAIL=andersson.guevara.b@tecsup.edu.pe
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=tu_correo@gmail.com
SMTP_PASS=tu_password_de_aplicacion
MAIL_FROM=tu_correo@gmail.com
ADMIN_CODE_RESPONSE=true
```

> Si SMTP no está configurado, la app sigue generando el código y lo muestra/autocompleta para pruebas rápidas. En producción configura SMTP y usa `ADMIN_CODE_RESPONSE=false` si quieres que el código solo llegue por correo.

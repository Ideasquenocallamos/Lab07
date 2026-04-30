# Laboratorio: Seguridad en Aplicaciones con JWT

Proyecto base con **Node.js + Express + Sequelize + MySQL + JWT + Roles** (`admin`, `moderator`, `user`).

## Estructura (en la carpeta principal)

```text
.
├── app/
│   ├── config/
│   │   ├── auth.config.js
│   │   └── db.config.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   └── user.controller.js
│   ├── middlewares/
│   │   ├── authJwt.js
│   │   ├── index.js
│   │   └── verifySignUp.js
│   ├── models/
│   │   ├── index.js
│   │   ├── role.model.js
│   │   └── user.model.js
│   └── routes/
│       ├── auth.routes.js
│       └── user.routes.js
├── package.json
├── server.js
└── README.md
```

## Pasos

1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Crear base de datos `jwt03` en MySQL.
3. Ajustar credenciales en `app/config/db.config.js`.
4. Ejecutar:
   ```bash
   npm start
   ```

## Pruebas rápidas con curl

Ver endpoints y ejemplos completos en el enunciado del laboratorio.

# 🔐 Guía de Supervisor Premium

## Descripción General

El sistema de Supervisor Premium proporciona un panel de control completo para gestionar usuarios, aplicaciones y auditoría del sistema. Los supervisores tienen acceso a todas las funcionalidades de administración.

## Características Principales

### 1. **Dashboard**
- Estadísticas en tiempo real
- Total de usuarios
- Total de aplicaciones
- Aplicaciones activas y suspendidas
- Registro de actividad reciente

### 2. **Gestión de Usuarios**
- Ver todos los usuarios del sistema
- Modificar datos de usuario (nombre, email, rol, estado premium)
- Deshabilitar usuarios
- Búsqueda y filtrado

### 3. **Gestión de Aplicaciones**
- Ver todas las aplicaciones
- Suspender aplicaciones con razón
- Reactivar aplicaciones suspendidas
- Eliminar aplicaciones
- Ver estado y versión

### 4. **Auditoría**
- Registro completo de todas las acciones
- Quién realizó la acción
- Qué acción se realizó
- Cuándo se realizó
- Detalles de la acción

### 5. **Permisos (Premium)**
- Gestionar permisos de otros supervisores
- Asignar/revocar permisos específicos
- Control granular de acceso

## Permisos Disponibles

```
- can_view_all_users: Ver todos los usuarios
- can_modify_apps: Modificar aplicaciones y usuarios
- can_suspend_apps: Suspender aplicaciones
- can_delete_apps: Eliminar aplicaciones
- can_disable_users: Deshabilitar usuarios
- can_view_analytics: Ver analíticas
- can_manage_permissions: Gestionar permisos (solo premium)
```

## Acceso al Panel

1. Inicia sesión con tu cuenta de supervisor
2. Accede a: `/supervisor-dashboard.html`
3. El panel se cargará automáticamente

## API Endpoints

### Dashboard
```
GET /api/supervisor/dashboard
```

### Usuarios
```
GET /api/supervisor/users
GET /api/supervisor/users/:userId
PUT /api/supervisor/users/:userId
POST /api/supervisor/users/:userId/disable
```

### Aplicaciones
```
GET /api/supervisor/apps
POST /api/supervisor/apps/:appId/suspend
POST /api/supervisor/apps/:appId/reactivate
DELETE /api/supervisor/apps/:appId
```

### Auditoría
```
GET /api/supervisor/audit-logs
```

### Permisos
```
PUT /api/supervisor/permissions/:targetSupervisorId
```

## Modelos de Base de Datos

### Supervisors
```javascript
{
  id: Integer,
  user_id: Integer (FK),
  is_premium: Boolean,
  can_view_all_users: Boolean,
  can_modify_apps: Boolean,
  can_suspend_apps: Boolean,
  can_delete_apps: Boolean,
  can_disable_users: Boolean,
  can_view_analytics: Boolean,
  can_manage_permissions: Boolean,
  created_at: DateTime,
  updated_at: DateTime
}
```

### App Management
```javascript
{
  id: Integer,
  app_name: String,
  owner_id: Integer (FK),
  status: ENUM('active', 'suspended', 'disabled', 'deleted'),
  description: Text,
  version: String,
  last_modified_by: Integer,
  suspension_reason: Text,
  created_at: DateTime,
  updated_at: DateTime
}
```

### Audit Logs
```javascript
{
  id: Integer,
  supervisor_id: Integer (FK),
  action: String,
  target_type: ENUM('user', 'app', 'permission'),
  target_id: Integer,
  details: JSON,
  ip_address: String,
  created_at: DateTime
}
```

## Acciones Registradas en Auditoría

- `MODIFY_USER`: Modificación de datos de usuario
- `SUSPEND_APP`: Suspensión de aplicación
- `REACTIVATE_APP`: Reactivación de aplicación
- `DELETE_APP`: Eliminación de aplicación
- `DISABLE_USER`: Deshabilitación de usuario
- `UPDATE_PERMISSIONS`: Actualización de permisos

## Seguridad

- Todas las acciones requieren autenticación JWT
- Los permisos se validan en cada endpoint
- Se registra cada acción en la auditoría
- Las contraseñas nunca se exponen en las respuestas

## Interfaz Visual

El panel incluye:
- Sidebar de navegación
- Estadísticas en tarjetas
- Tablas interactivas
- Modales para acciones
- Búsqueda y filtrado
- Diseño responsivo
- Tema moderno con gradientes

## Próximas Mejoras

- [ ] Exportar reportes
- [ ] Gráficos de actividad
- [ ] Notificaciones en tiempo real
- [ ] Gestión de roles personalizados
- [ ] Integración con webhooks
- [ ] Análisis de comportamiento


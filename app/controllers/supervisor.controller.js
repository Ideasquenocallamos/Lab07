import db from "../models/index.js";

const { users, supervisors, app_management, audit_logs } = db;

// Obtener dashboard del supervisor
export const getSupervisorDashboard = async (req, res) => {
  try {
    const supervisorId = req.userId;
    const supervisor = await supervisors.findOne({ where: { user_id: supervisorId } });
    
    if (!supervisor) {
      return res.status(403).json({ message: "No tienes permisos de supervisor" });
    }

    const totalUsers = await users.count();
    const totalApps = await app_management.count();
    const suspendedApps = await app_management.count({ where: { status: "suspended" } });
    const recentLogs = await audit_logs.findAll({ 
      limit: 10, 
      order: [["created_at", "DESC"]] 
    });

    res.json({
      supervisor: supervisor,
      stats: {
        totalUsers,
        totalApps,
        suspendedApps,
        activeApps: totalApps - suspendedApps
      },
      recentActivity: recentLogs
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener todos los usuarios (solo supervisores)
export const getAllUsers = async (req, res) => {
  try {
    const supervisorId = req.userId;
    const supervisor = await supervisors.findOne({ where: { user_id: supervisorId } });
    
    if (!supervisor || !supervisor.can_view_all_users) {
      return res.status(403).json({ message: "No tienes permiso para ver usuarios" });
    }

    const allUsers = await users.findAll({
      attributes: { exclude: ["password"] },
      order: [["id", "DESC"]]
    });

    res.json(allUsers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener detalles de un usuario específico
export const getUserDetails = async (req, res) => {
  try {
    const supervisorId = req.userId;
    const { userId } = req.params;
    
    const supervisor = await supervisors.findOne({ where: { user_id: supervisorId } });
    if (!supervisor || !supervisor.can_view_all_users) {
      return res.status(403).json({ message: "No tienes permiso" });
    }

    const user = await users.findByPk(userId, {
      attributes: { exclude: ["password"] }
    });

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const userApps = await app_management.findAll({ where: { owner_id: userId } });

    res.json({ user, apps: userApps });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Modificar datos de usuario
export const modifyUser = async (req, res) => {
  try {
    const supervisorId = req.userId;
    const { userId } = req.params;
    const { nombre, email, rol, is_premium } = req.body;

    const supervisor = await supervisors.findOne({ where: { user_id: supervisorId } });
    if (!supervisor || !supervisor.can_modify_apps) {
      return res.status(403).json({ message: "No tienes permiso para modificar usuarios" });
    }

    const user = await users.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    await user.update({ nombre, email, rol, is_premium });

    // Registrar en audit log
    await audit_logs.create({
      supervisor_id: supervisorId,
      action: "MODIFY_USER",
      target_type: "user",
      target_id: userId,
      details: { nombre, email, rol, is_premium }
    });

    res.json({ message: "Usuario modificado exitosamente", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Suspender aplicación
export const suspendApp = async (req, res) => {
  try {
    const supervisorId = req.userId;
    const { appId } = req.params;
    const { reason } = req.body;

    const supervisor = await supervisors.findOne({ where: { user_id: supervisorId } });
    if (!supervisor || !supervisor.can_suspend_apps) {
      return res.status(403).json({ message: "No tienes permiso para suspender apps" });
    }

    const app = await app_management.findByPk(appId);
    if (!app) {
      return res.status(404).json({ message: "Aplicación no encontrada" });
    }

    await app.update({ 
      status: "suspended", 
      suspension_reason: reason,
      last_modified_by: supervisorId 
    });

    await audit_logs.create({
      supervisor_id: supervisorId,
      action: "SUSPEND_APP",
      target_type: "app",
      target_id: appId,
      details: { reason }
    });

    res.json({ message: "Aplicación suspendida", app });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Reactivar aplicación
export const reactivateApp = async (req, res) => {
  try {
    const supervisorId = req.userId;
    const { appId } = req.params;

    const supervisor = await supervisors.findOne({ where: { user_id: supervisorId } });
    if (!supervisor || !supervisor.can_suspend_apps) {
      return res.status(403).json({ message: "No tienes permiso" });
    }

    const app = await app_management.findByPk(appId);
    if (!app) {
      return res.status(404).json({ message: "Aplicación no encontrada" });
    }

    await app.update({ 
      status: "active", 
      suspension_reason: null,
      last_modified_by: supervisorId 
    });

    await audit_logs.create({
      supervisor_id: supervisorId,
      action: "REACTIVATE_APP",
      target_type: "app",
      target_id: appId
    });

    res.json({ message: "Aplicación reactivada", app });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Eliminar aplicación
export const deleteApp = async (req, res) => {
  try {
    const supervisorId = req.userId;
    const { appId } = req.params;

    const supervisor = await supervisors.findOne({ where: { user_id: supervisorId } });
    if (!supervisor || !supervisor.can_delete_apps) {
      return res.status(403).json({ message: "No tienes permiso para eliminar apps" });
    }

    const app = await app_management.findByPk(appId);
    if (!app) {
      return res.status(404).json({ message: "Aplicación no encontrada" });
    }

    await app.update({ status: "deleted", last_modified_by: supervisorId });

    await audit_logs.create({
      supervisor_id: supervisorId,
      action: "DELETE_APP",
      target_type: "app",
      target_id: appId
    });

    res.json({ message: "Aplicación eliminada", app });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Deshabilitar usuario
export const disableUser = async (req, res) => {
  try {
    const supervisorId = req.userId;
    const { userId } = req.params;
    const { reason } = req.body;

    const supervisor = await supervisors.findOne({ where: { user_id: supervisorId } });
    if (!supervisor || !supervisor.can_disable_users) {
      return res.status(403).json({ message: "No tienes permiso para deshabilitar usuarios" });
    }

    const user = await users.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Marcar como deshabilitado (agregar campo si es necesario)
    await user.update({ is_premium: false });

    await audit_logs.create({
      supervisor_id: supervisorId,
      action: "DISABLE_USER",
      target_type: "user",
      target_id: userId,
      details: { reason }
    });

    res.json({ message: "Usuario deshabilitado", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener logs de auditoría
export const getAuditLogs = async (req, res) => {
  try {
    const supervisorId = req.userId;
    const supervisor = await supervisors.findOne({ where: { user_id: supervisorId } });
    
    if (!supervisor) {
      return res.status(403).json({ message: "No tienes permisos" });
    }

    const logs = await audit_logs.findAll({
      order: [["created_at", "DESC"]],
      limit: 100
    });

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener todas las aplicaciones
export const getAllApps = async (req, res) => {
  try {
    const supervisorId = req.userId;
    const supervisor = await supervisors.findOne({ where: { user_id: supervisorId } });
    
    if (!supervisor) {
      return res.status(403).json({ message: "No tienes permisos" });
    }

    const apps = await app_management.findAll({
      order: [["created_at", "DESC"]]
    });

    res.json(apps);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Actualizar permisos de supervisor (solo para supervisores premium)
export const updateSupervisorPermissions = async (req, res) => {
  try {
    const supervisorId = req.userId;
    const { targetSupervisorId } = req.params;
    const permissions = req.body;

    const supervisor = await supervisors.findOne({ where: { user_id: supervisorId } });
    if (!supervisor || !supervisor.can_manage_permissions) {
      return res.status(403).json({ message: "No tienes permiso para gestionar permisos" });
    }

    const targetSupervisor = await supervisors.findByPk(targetSupervisorId);
    if (!targetSupervisor) {
      return res.status(404).json({ message: "Supervisor no encontrado" });
    }

    await targetSupervisor.update(permissions);

    await audit_logs.create({
      supervisor_id: supervisorId,
      action: "UPDATE_PERMISSIONS",
      target_type: "permission",
      target_id: targetSupervisorId,
      details: permissions
    });

    res.json({ message: "Permisos actualizados", supervisor: targetSupervisor });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

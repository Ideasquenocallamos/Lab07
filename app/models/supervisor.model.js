export default (sequelize, Sequelize) => {
  return sequelize.define("supervisors", {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: Sequelize.INTEGER, allowNull: false, unique: true },
    is_premium: { type: Sequelize.BOOLEAN, defaultValue: false },
    can_view_all_users: { type: Sequelize.BOOLEAN, defaultValue: true },
    can_modify_apps: { type: Sequelize.BOOLEAN, defaultValue: true },
    can_suspend_apps: { type: Sequelize.BOOLEAN, defaultValue: true },
    can_delete_apps: { type: Sequelize.BOOLEAN, defaultValue: true },
    can_disable_users: { type: Sequelize.BOOLEAN, defaultValue: true },
    can_view_analytics: { type: Sequelize.BOOLEAN, defaultValue: true },
    can_manage_permissions: { type: Sequelize.BOOLEAN, defaultValue: false },
    created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
  });
};

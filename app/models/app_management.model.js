export default (sequelize, Sequelize) => {
  return sequelize.define("app_management", {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    app_name: { type: Sequelize.STRING, allowNull: false },
    owner_id: { type: Sequelize.INTEGER, allowNull: false },
    status: { type: Sequelize.ENUM("active", "suspended", "disabled", "deleted"), defaultValue: "active" },
    description: { type: Sequelize.TEXT, allowNull: true },
    version: { type: Sequelize.STRING, defaultValue: "1.0.0" },
    last_modified_by: { type: Sequelize.INTEGER, allowNull: true },
    suspension_reason: { type: Sequelize.TEXT, allowNull: true },
    created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
  });
};

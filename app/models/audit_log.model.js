export default (sequelize, Sequelize) => {
  return sequelize.define("audit_logs", {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    supervisor_id: { type: Sequelize.INTEGER, allowNull: false },
    action: { type: Sequelize.STRING, allowNull: false },
    target_type: { type: Sequelize.ENUM("user", "app", "permission"), defaultValue: "user" },
    target_id: { type: Sequelize.INTEGER, allowNull: false },
    details: { type: Sequelize.JSON, allowNull: true },
    ip_address: { type: Sequelize.STRING, allowNull: true },
    created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
  });
};

export default (sequelize, Sequelize) => {
  return sequelize.define('notifications', {
    id_notification: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: Sequelize.INTEGER, allowNull: false },
    titulo: { type: Sequelize.STRING, allowNull: false },
    detalle: { type: Sequelize.STRING, allowNull: false },
    leido: { type: Sequelize.BOOLEAN, defaultValue: false }
  });
};

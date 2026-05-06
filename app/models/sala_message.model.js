export default (sequelize, Sequelize) => {
  return sequelize.define('sala_messages', {
    id_msg: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    id_sala: { type: Sequelize.INTEGER, allowNull: false },
    user_id: { type: Sequelize.INTEGER, allowNull: false },
    contenido: { type: Sequelize.TEXT, allowNull: false }
  });
};

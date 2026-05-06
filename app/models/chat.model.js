export default (sequelize, Sequelize) => {
  return sequelize.define("chat_messages", {
    id_chat: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    from_user_id: { type: Sequelize.INTEGER, allowNull: false },
    to_user_id: { type: Sequelize.INTEGER, allowNull: false },
    mensaje: { type: Sequelize.TEXT, allowNull: false }
  });
};

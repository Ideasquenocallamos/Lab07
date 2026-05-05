export default (sequelize, Sequelize) => {
  return sequelize.define('posts', {
    id_post: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: Sequelize.INTEGER, allowNull: false },
    texto: { type: Sequelize.TEXT, allowNull: false },
    etiquetas: { type: Sequelize.STRING, allowNull: true }
  });
};

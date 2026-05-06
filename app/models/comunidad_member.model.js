export default (sequelize, Sequelize) => {
  return sequelize.define('comunidad_members', {
    id_member: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    id_comunidad: { type: Sequelize.INTEGER, allowNull: false },
    user_id: { type: Sequelize.INTEGER, allowNull: false }
  });
};

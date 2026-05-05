export default (sequelize, Sequelize) => {
  return sequelize.define("salas", {
    id_sala: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    nombre_sala: { type: Sequelize.STRING, allowNull: false },
    tema: { type: Sequelize.STRING, allowNull: false },
    id_comunidad: { type: Sequelize.INTEGER, allowNull: false }
  });
};

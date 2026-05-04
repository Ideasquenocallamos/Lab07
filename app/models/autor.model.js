export default (sequelize, Sequelize) => {
  return sequelize.define("autores", {
    id_autor: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    nombre_autor: { type: Sequelize.STRING, allowNull: false },
    pais_origen: { type: Sequelize.STRING, allowNull: false },
    fecha_nacimiento: { type: Sequelize.DATEONLY, allowNull: false },
    ultima_actividad: { type: Sequelize.DATE, allowNull: true }
  });
};

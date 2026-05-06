export default (sequelize, Sequelize) => {
  return sequelize.define("comunidades", {
    id_comunidad: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    tipo: { type: Sequelize.ENUM("publica", "privada"), allowNull: false },
    enlace_invitacion: { type: Sequelize.STRING, allowNull: true },
    numero_integrantes: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
    descripcion: { type: Sequelize.TEXT, allowNull: true },
    reglas: { type: Sequelize.TEXT, allowNull: true },
    condicion_actividad: { type: Sequelize.STRING, allowNull: true },
    es_mayor_18: { type: Sequelize.BOOLEAN, defaultValue: false },
    temas_adultos: { type: Sequelize.BOOLEAN, defaultValue: false },
    id_autor: { type: Sequelize.INTEGER, allowNull: false }
  });
};

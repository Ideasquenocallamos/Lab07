export default (sequelize, Sequelize) => {
  return sequelize.define("libros", {
    id_libro: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    titulo: { type: Sequelize.STRING, allowNull: false },
    anio_publicacion: { type: Sequelize.INTEGER, allowNull: false },
    portada: { type: Sequelize.STRING, allowNull: true },
    derechos: { type: Sequelize.STRING, allowNull: false },
    id_autor: { type: Sequelize.INTEGER, allowNull: false }
  });
};

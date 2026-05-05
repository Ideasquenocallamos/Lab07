export default (sequelize, Sequelize) => {
  return sequelize.define("libros", {
    id_libro: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    titulo: { type: Sequelize.STRING, allowNull: false },
    anio_publicacion: { type: Sequelize.INTEGER, allowNull: false },
    portada: { type: Sequelize.STRING, allowNull: true },
    derechos: { type: Sequelize.STRING, allowNull: false },
    link_lectura: { type: Sequelize.STRING, allowNull: true },
    genero: { type: Sequelize.STRING, allowNull: true },
    etiquetas: { type: Sequelize.STRING, allowNull: true },
    comentarios_resenas: { type: Sequelize.TEXT, allowNull: true },
    visibilidad: { type: Sequelize.ENUM("publico", "privado", "borrador"), allowNull: false, defaultValue: "publico" },
    codigo_privado: { type: Sequelize.STRING, allowNull: true },
    id_autor: { type: Sequelize.INTEGER, allowNull: false }
  });
};

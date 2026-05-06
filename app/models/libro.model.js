export default (sequelize, Sequelize) => {
  return sequelize.define("libros", {
    id_libro: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    titulo: { type: Sequelize.STRING, allowNull: false },
    anio_publicacion: { type: Sequelize.INTEGER, allowNull: false },
    portada: { type: Sequelize.STRING, allowNull: true },
    derechos: { type: Sequelize.STRING, allowNull: false },
    link_lectura: { type: Sequelize.STRING, allowNull: true },
    link_wattpad: { type: Sequelize.STRING, allowNull: true },
    link_ao3: { type: Sequelize.STRING, allowNull: true },
    link_fanfiction: { type: Sequelize.STRING, allowNull: true },
    link_webnovel: { type: Sequelize.STRING, allowNull: true },
    link_google_drive: { type: Sequelize.STRING, allowNull: true },
    beta_reader_code: { type: Sequelize.STRING, allowNull: true },
    audiencia_objetivo: { type: Sequelize.STRING, allowNull: true },
    estado_obra: { type: Sequelize.ENUM("idea", "borrador", "en_revision", "publicada"), allowNull: false, defaultValue: "publicada" },
    genero: { type: Sequelize.STRING, allowNull: true },
    etiquetas: { type: Sequelize.STRING, allowNull: true },
    comentarios_resenas: { type: Sequelize.TEXT, allowNull: true },
    visibilidad: { type: Sequelize.ENUM("publico", "privado", "borrador"), allowNull: false, defaultValue: "publico" },
    codigo_privado: { type: Sequelize.STRING, allowNull: true },
    id_autor: { type: Sequelize.INTEGER, allowNull: false }
  });
};

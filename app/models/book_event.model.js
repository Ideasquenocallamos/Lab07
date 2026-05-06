export default (sequelize, Sequelize) => {
  return sequelize.define("book_events", {
    id_event: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: Sequelize.INTEGER, allowNull: true },
    id_libro: { type: Sequelize.INTEGER, allowNull: true },
    event_type: { type: Sequelize.ENUM("vista", "busqueda", "enlace", "resena"), allowNull: false },
    source: { type: Sequelize.STRING, allowNull: true },
    query: { type: Sequelize.STRING, allowNull: true },
    metadata: { type: Sequelize.TEXT, allowNull: true }
  });
};

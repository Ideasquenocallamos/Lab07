import Sequelize from "sequelize";
import dbConfig from "../config/db.config.js";

const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  port: dbConfig.PORT,
  dialect: dbConfig.dialect,
  dialectOptions: dbConfig.dialectOptions,
  pool: dbConfig.pool,
  logging: false
});

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.user = (await import("./user.model.js")).default(sequelize, Sequelize);
db.autor = (await import("./autor.model.js")).default(sequelize, Sequelize);
db.libro = (await import("./libro.model.js")).default(sequelize, Sequelize);
db.comunidad = (await import("./comunidad.model.js")).default(sequelize, Sequelize);
db.sala = (await import("./sala.model.js")).default(sequelize, Sequelize);
db.chat = (await import("./chat.model.js")).default(sequelize, Sequelize);
db.member = (await import("./comunidad_member.model.js")).default(sequelize, Sequelize);
db.salaMessage = (await import("./sala_message.model.js")).default(sequelize, Sequelize);
db.post = (await import("./post.model.js")).default(sequelize, Sequelize);
db.notification = (await import("./notification.model.js")).default(sequelize, Sequelize);
db.bookEvent = (await import("./book_event.model.js")).default(sequelize, Sequelize);

db.user.hasOne(db.autor, { foreignKey: "user_id" });
db.autor.belongsTo(db.user, { foreignKey: "user_id" });

db.autor.hasMany(db.libro, { foreignKey: "id_autor" });
db.libro.belongsTo(db.autor, { foreignKey: "id_autor" });

db.autor.hasMany(db.comunidad, { foreignKey: "id_autor" });
db.comunidad.belongsTo(db.autor, { foreignKey: "id_autor" });

db.comunidad.hasMany(db.sala, { foreignKey: "id_comunidad" });
db.sala.belongsTo(db.comunidad, { foreignKey: "id_comunidad" });

db.comunidad.hasMany(db.member, { foreignKey: "id_comunidad" });
db.member.belongsTo(db.comunidad, { foreignKey: "id_comunidad" });
db.user.hasMany(db.member, { foreignKey: "user_id" });
db.member.belongsTo(db.user, { foreignKey: "user_id" });
db.libro.hasMany(db.bookEvent, { foreignKey: "id_libro" });
db.bookEvent.belongsTo(db.libro, { foreignKey: "id_libro" });

export default db;

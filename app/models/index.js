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
db.users = db.user;
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

// Nuevos modelos para supervisor
db.supervisors = (await import("./supervisor.model.js")).default(sequelize, Sequelize);
db.app_management = (await import("./app_management.model.js")).default(sequelize, Sequelize);
db.audit_logs = (await import("./audit_log.model.js")).default(sequelize, Sequelize);

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

// Relaciones para supervisor
db.user.hasOne(db.supervisors, { foreignKey: "user_id" });
db.supervisors.belongsTo(db.user, { foreignKey: "user_id" });

db.user.hasMany(db.app_management, { foreignKey: "owner_id" });
db.app_management.belongsTo(db.user, { foreignKey: "owner_id" });

db.supervisors.hasMany(db.audit_logs, { foreignKey: "supervisor_id" });
db.audit_logs.belongsTo(db.supervisors, { foreignKey: "supervisor_id" });

export default db;

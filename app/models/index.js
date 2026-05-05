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

db.autor.hasMany(db.libro, { foreignKey: "id_autor" });
db.libro.belongsTo(db.autor, { foreignKey: "id_autor" });

db.autor.hasMany(db.comunidad, { foreignKey: "id_autor" });
db.comunidad.belongsTo(db.autor, { foreignKey: "id_autor" });

db.comunidad.hasMany(db.sala, { foreignKey: "id_comunidad" });
db.sala.belongsTo(db.comunidad, { foreignKey: "id_comunidad" });

export default db;

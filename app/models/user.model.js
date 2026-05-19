export default (sequelize, Sequelize) => {
  return sequelize.define("users", {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    // La API usa "nombre", pero el laboratorio original guardaba ese dato en la columna "username".
    // Mantener el mapeo evita fallos en Railway/MySQL cuando la tabla ya existía con esa columna.
    nombre: { type: Sequelize.STRING, allowNull: false, field: "username" },
    email: { type: Sequelize.STRING, allowNull: false, unique: true },
    password: { type: Sequelize.STRING, allowNull: false },
    rol: { type: Sequelize.ENUM("autor", "lector", "mixto", "supervisor"), allowNull: false, defaultValue: "lector" },
    author_code: { type: Sequelize.STRING, allowNull: true, unique: true },
    is_premium: { type: Sequelize.BOOLEAN, defaultValue: false },
    incognito_mode: { type: Sequelize.BOOLEAN, defaultValue: false },
    linked_author_id: { type: Sequelize.INTEGER, allowNull: true },
    bio: { type: Sequelize.TEXT, allowNull: true },
    avatar_url: { type: Sequelize.STRING, allowNull: true }
  });
};

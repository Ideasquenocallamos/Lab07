export default (sequelize, Sequelize) => {
  return sequelize.define("users", {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: Sequelize.STRING, allowNull: false },
    email: { type: Sequelize.STRING, allowNull: false, unique: true },
    password: { type: Sequelize.STRING, allowNull: false },
    rol: { type: Sequelize.ENUM("autor", "lector", "mixto"), allowNull: false, defaultValue: "lector" },
    author_code: { type: Sequelize.STRING, allowNull: true, unique: true },
    is_premium: { type: Sequelize.BOOLEAN, defaultValue: false },
    incognito_mode: { type: Sequelize.BOOLEAN, defaultValue: false },
    linked_author_id: { type: Sequelize.INTEGER, allowNull: true },
    bio: { type: Sequelize.TEXT, allowNull: true },
    avatar_url: { type: Sequelize.STRING, allowNull: true }
  });
};

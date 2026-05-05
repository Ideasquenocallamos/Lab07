export default (sequelize, Sequelize) => {
  return sequelize.define("users", {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: Sequelize.STRING, allowNull: false },
    email: { type: Sequelize.STRING, allowNull: false, unique: true },
    password: { type: Sequelize.STRING, allowNull: false },
    rol: { type: Sequelize.ENUM("autor", "lector"), allowNull: false, defaultValue: "lector" },
    bio: { type: Sequelize.TEXT, allowNull: true },
    avatar_url: { type: Sequelize.STRING, allowNull: true }
  });
};

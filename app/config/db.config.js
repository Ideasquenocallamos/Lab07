const parseConnectionUrl = () => {
  const rawUrl = process.env.DB_URL || process.env.MYSQL_URL || process.env.MYSQL_PUBLIC_URL || process.env.DATABASE_URL;
  if (!rawUrl) return {};

  try {
    const url = new URL(rawUrl);
    if (!url.protocol.startsWith("mysql")) return {};

    return {
      HOST: url.hostname,
      PORT: Number(url.port || 3306),
      USER: decodeURIComponent(url.username || "root"),
      PASSWORD: decodeURIComponent(url.password || ""),
      DB: decodeURIComponent(url.pathname.replace(/^\//, "") || "lab07_libros")
    };
  } catch {
    return {};
  }
};

const fromUrl = parseConnectionUrl();
const useSSL = (process.env.DB_SSL || "false").toLowerCase() === "true";

export default {
  HOST: process.env.DB_HOST || process.env.MYSQLHOST || fromUrl.HOST || "localhost",
  PORT: Number(process.env.DB_PORT || process.env.MYSQLPORT || fromUrl.PORT || 3306),
  USER: process.env.DB_USER || process.env.MYSQLUSER || fromUrl.USER || "root",
  PASSWORD: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || fromUrl.PASSWORD || "",
  DB: process.env.DB_NAME || process.env.MYSQLDATABASE || fromUrl.DB || "lab07_libros",
  dialect: "mysql",
  dialectOptions: useSSL
    ? {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      }
    : {},
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};

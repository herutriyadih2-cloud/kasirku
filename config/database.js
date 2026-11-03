require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER || 'kasir_user',
    password: process.env.DB_PASS || 'kasir_pass',
    database: process.env.DB_NAME || 'kasir_db',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false,
  },
};

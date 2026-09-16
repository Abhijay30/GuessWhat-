// Simple SQLite setup — no external DB server needed, just a local file.
// Swap the dialect/config here later if you move to Postgres/MySQL in production.
const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '..', 'brandflow.sqlite'),
  logging: false,
});

module.exports = sequelize;

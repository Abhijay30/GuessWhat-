const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// A User is either an admin (agency staff) or a client (belongs to one Company).
const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false }, // bcrypt hash
  phone: { type: DataTypes.STRING },
  role: { type: DataTypes.ENUM('admin', 'client'), allowNull: false, defaultValue: 'client' },
  // companyId is null for admins, required for client users
  companyId: { type: DataTypes.INTEGER, allowNull: true },
});

module.exports = User;

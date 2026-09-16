const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EventFeedback = sequelize.define('EventFeedback', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  eventId: { type: DataTypes.INTEGER, allowNull: false },
  senderName: { type: DataTypes.STRING, allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false },
});

module.exports = EventFeedback;

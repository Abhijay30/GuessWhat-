const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// A file attached to either a CalendarEvent or a Ticket (polymorphic via ownerType/ownerId).
const Attachment = sequelize.define('Attachment', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  ownerType: { type: DataTypes.ENUM('event', 'ticket', 'message'), allowNull: false },
  ownerId: { type: DataTypes.INTEGER, allowNull: false },
  fileName: { type: DataTypes.STRING, allowNull: false },
  filePath: { type: DataTypes.STRING, allowNull: false },
  fileSize: { type: DataTypes.INTEGER }, // bytes
});

module.exports = Attachment;

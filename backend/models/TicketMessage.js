const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// One message in a ticket's back-and-forth conversation.
const TicketMessage = sequelize.define('TicketMessage', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  ticketId: { type: DataTypes.INTEGER, allowNull: false },
  senderId: { type: DataTypes.INTEGER, allowNull: false },
  senderName: { type: DataTypes.STRING, allowNull: false },
  senderRole: { type: DataTypes.ENUM('admin', 'client'), allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false },
});

module.exports = TicketMessage;

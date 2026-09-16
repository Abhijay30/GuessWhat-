const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// A notification for one user (usually a client user, but admins can get them too).
const Notification = sequelize.define('Notification', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  type: {
    type: DataTypes.ENUM('new_activity', 'activity_changed', 'activity_delayed', 'ticket_response', 'ticket_update'),
    allowNull: false,
  },
  message: { type: DataTypes.STRING, allowNull: false },
  read: { type: DataTypes.BOOLEAN, defaultValue: false },
  linkType: { type: DataTypes.STRING }, // 'event' | 'ticket' — what this notification points to
  linkId: { type: DataTypes.INTEGER },
});

module.exports = Notification;

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// A calendar activity (social media post, campaign, event, etc.) tied to one company.
const CalendarEvent = sequelize.define('CalendarEvent', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  companyId: { type: DataTypes.INTEGER, allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  category: {
    type: DataTypes.ENUM('Social Media', 'Event', 'Campaign', 'Content', 'Other'),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('Planned', 'In Progress', 'Completed', 'Delayed'),
    defaultValue: 'Planned',
  },
  platform: { type: DataTypes.STRING }, // optional, e.g. "Instagram"
  date: { type: DataTypes.DATEONLY, allowNull: false },
  time: { type: DataTypes.STRING }, // stored as "10:00 AM" for simplicity
  description: { type: DataTypes.TEXT },
  notes: { type: DataTypes.TEXT }, // free-form bullet notes, newline separated
  createdBy: { type: DataTypes.STRING }, // name of admin who created it
});

module.exports = CalendarEvent;

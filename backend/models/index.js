const sequelize = require('../config/database');
const User = require('./User');
const Company = require('./Company');
const CalendarEvent = require('./CalendarEvent');
const Ticket = require('./Ticket');
const TicketMessage = require('./TicketMessage');
const Notification = require('./Notification');
const Attachment = require('./Attachment');
const EventFeedback = require('./EventFeedback');

// Company <-> Users
Company.hasMany(User, { foreignKey: 'companyId' });
User.belongsTo(Company, { foreignKey: 'companyId' });

// Company <-> CalendarEvent
Company.hasMany(CalendarEvent, { foreignKey: 'companyId' });
CalendarEvent.belongsTo(Company, { foreignKey: 'companyId' });

// Company <-> Ticket
Company.hasMany(Ticket, { foreignKey: 'companyId' });
Ticket.belongsTo(Company, { foreignKey: 'companyId' });

// Ticket <-> TicketMessage
Ticket.hasMany(TicketMessage, { foreignKey: 'ticketId', as: 'messages' });
TicketMessage.belongsTo(Ticket, { foreignKey: 'ticketId' });

// User <-> Notification
User.hasMany(Notification, { foreignKey: 'userId' });
Notification.belongsTo(User, { foreignKey: 'userId' });

// CalendarEvent <-> EventFeedback
CalendarEvent.hasMany(EventFeedback, { foreignKey: 'eventId', as: 'feedback' });
EventFeedback.belongsTo(CalendarEvent, { foreignKey: 'eventId' });

module.exports = {
  sequelize,
  User,
  Company,
  CalendarEvent,
  Ticket,
  TicketMessage,
  Notification,
  Attachment,
  EventFeedback,
};

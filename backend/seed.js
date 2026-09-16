require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, User, Company, CalendarEvent, Ticket, TicketMessage } = require('./models');

async function seed() {
  await sequelize.sync({ force: true }); // wipes and recreates tables — demo data only

  const passwordHash = await bcrypt.hash('password123', 10);

  await User.create({
    name: 'Admin User',
    email: 'admin@brandflow.com',
    password: passwordHash,
    phone: '+1 234 567 8900',
    role: 'admin',
  });

  const companiesData = [
    { name: 'ABC Restaurant', contactPerson: 'John Doe', email: 'john@abcrestaurant.com', status: 'Active' },
    { name: 'Tasty Bites', contactPerson: 'Mary Jane', email: 'mary@tastybites.com', status: 'Active' },
    { name: 'Foodies Hub', contactPerson: 'Alex Morgan', email: 'alex@foodiehub.com', status: 'Active' },
    { name: 'Café Aroma', contactPerson: 'Robert Brown', email: 'robert@cafearoma.com', status: 'Inactive' },
    { name: 'Burger House', contactPerson: 'Michael Lee', email: 'michael@burgerhouse.com', status: 'Active' },
    { name: 'The Grill Bar', contactPerson: 'David Wilson', email: 'david@thegrillbar.com', status: 'Active' },
  ];
  const companies = await Company.bulkCreate(companiesData, { returning: true });
  const abc = companies[0];
  const tastyBites = companies[1];
  const foodiesHub = companies[2];

  // A login user for the client-side portal demo
  await User.create({
    name: 'John Doe',
    email: 'john@abcrestaurant.com',
    password: passwordHash,
    phone: '+1 234 567 8900',
    role: 'client',
    companyId: abc.id,
  });

  // Use September 2026 as the base so demo data lines up with the app's current date
  const BASE = new Date('2026-09-10');
  const iso = (daysFromNow) => {
    const d = new Date(BASE);
    d.setDate(d.getDate() + daysFromNow);
    return d.toISOString().slice(0, 10);
  };

  await CalendarEvent.bulkCreate([
    {
      companyId: abc.id,
      title: 'Instagram Campaign',
      category: 'Social Media',
      status: 'Planned',
      platform: 'Instagram',
      date: iso(3),
      time: '10:00 AM',
      description: 'We will be launching a new Instagram campaign to promote the summer special menu. The campaign will include posts, stories and a giveaway.',
      notes: 'Design approval pending\nCaptions in progress\nInfluencer shortlisting',
      createdBy: 'Admin',
    },
    {
      companyId: tastyBites.id,
      title: 'Product Photoshoot',
      category: 'Content',
      status: 'In Progress',
      date: iso(5),
      time: '2:00 PM',
      description: 'On-site product photoshoot for the new menu items.',
      createdBy: 'Admin',
    },
    {
      companyId: foodiesHub.id,
      title: 'Influencer Event',
      category: 'Event',
      status: 'Planned',
      date: iso(7),
      createdBy: 'Admin',
    },
    {
      companyId: abc.id,
      title: 'Facebook Ad Campaign',
      category: 'Social Media',
      status: 'Completed',
      date: iso(-2),
      createdBy: 'Admin',
    },
    {
      companyId: tastyBites.id,
      title: 'Reel Series Launch',
      category: 'Content',
      status: 'Planned',
      date: iso(13),
      createdBy: 'Admin',
    },
  ]);

  const ticket1 = await Ticket.create({
    companyId: abc.id,
    subject: 'Website booking button not working',
    description: 'The booking button on the website is not working on mobile devices. Please check and fix as soon as possible.',
    category: 'Technical Issue',
    priority: 'High',
    status: 'Open',
  });
  await TicketMessage.bulkCreate([
    { ticketId: ticket1.id, senderId: 1, senderName: 'Admin', senderRole: 'admin', message: 'Hi, we have received your ticket and our developer is looking into this issue.' },
  ]);

  await Ticket.create({
    companyId: tastyBites.id,
    subject: 'Website booking button not working',
    description: 'The booking button on the website is not working on mobile devices.',
    category: 'Technical Issue',
    priority: 'High',
    status: 'In Progress',
  });
  await Ticket.create({
    companyId: foodiesHub.id,
    subject: 'Event details update',
    description: 'Please update the event start time.',
    category: 'Content Update',
    priority: 'Medium',
    status: 'Resolved',
  });

  console.log('Seed complete.');
  console.log('Admin login: admin@brandflow.com / password123');
  console.log('Client login: john@abcrestaurant.com / password123');
  await sequelize.close();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});

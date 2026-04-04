// Script to backfill userId for all contacts based on matching user phone/email
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Contact = require('../models/Contact');
const User = require('../models/User');
const { formatPhone } = require('../utils/phone');

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  const contacts = await Contact.find({});
  let updated = 0;
  for (const contact of contacts) {
    let match = null;
    if (contact.email) {
      match = await User.findOne({ email: String(contact.email).toLowerCase() });
    }
    if (!match && contact.phone) {
      match = await User.findOne({ phone: formatPhone(contact.phone) });
    }
    if (match && (!contact.userId || String(contact.userId) !== String(match._id))) {
      contact.userId = match._id;
      contact.linkedUserId = match._id;
      await contact.save();
      updated++;
      console.log(`Updated contact ${contact._id} with userId ${match._id}`);
    }
  }
  console.log(`Backfill complete. Updated ${updated} contacts.`);
  await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });

const path = require('path');
require('dotenv').config({ path: path.join(process.cwd(), '.env') });
const mongoose = require('mongoose');
const User = require('./models/User');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const total = await User.countDocuments();
  const empties = await User.countDocuments({ $or: [{ email: null }, { email: '' }] });
  const sample = await User.find().sort({ createdAt: -1 }).limit(10).select('email createdAt').lean();
  console.log(JSON.stringify({ total, empties, sample }, null, 2));
  await mongoose.disconnect();
})().catch(async (e) => {
  console.error(e.message);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});

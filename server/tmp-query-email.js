const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const User = require('./models/User');

(async () => {
  const email = process.argv[2];
  if (!email) {
    console.error('usage: node tmp-query-email.js <email>');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  const found = await User.findOne({ email }).select('email createdAt').lean();
  console.log(JSON.stringify({ email, exists: !!found, found }, null, 2));
  await mongoose.disconnect();
})();

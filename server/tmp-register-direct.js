const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

(async () => {
  const email = `direct_${Date.now()}_${Math.floor(Math.random() * 1e6)}@test.local`;
  const normalizedEmail = email.toLowerCase().trim();

  await mongoose.connect(process.env.MONGO_URI);

  const existing = await User.findOne({ email: normalizedEmail }).lean();
  console.log(JSON.stringify({ step: 'findOne', email: normalizedEmail, existing: !!existing }, null, 2));

  if (!existing) {
    try {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('Pass1234!', salt);
      const created = await User.create({ name: 'Direct Test', email: normalizedEmail, password: hash });
      console.log(JSON.stringify({ step: 'create', ok: true, id: created._id, email: created.email }, null, 2));
    } catch (err) {
      console.log(JSON.stringify({
        step: 'create',
        ok: false,
        code: err.code,
        message: err.message,
        keyPattern: err.keyPattern,
        keyValue: err.keyValue,
      }, null, 2));
    }
  }

  await mongoose.disconnect();
})();

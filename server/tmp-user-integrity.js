const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const User = require('./models/User');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const missingEmail = await User.countDocuments({ email: { $exists: false } });
  const nullEmail = await User.countDocuments({ email: null });
  const emptyEmail = await User.countDocuments({ email: '' });
  const duplicateEmailAgg = await User.aggregate([
    { $group: { _id: '$email', count: { $sum: 1 } } },
    { $match: { _id: { $ne: null }, count: { $gt: 1 } } },
    { $limit: 10 },
  ]);

  const sampleMissing = await User.find({ email: { $exists: false } }).limit(5).lean();

  console.log(JSON.stringify({ missingEmail, nullEmail, emptyEmail, duplicateEmailAgg, sampleMissing }, null, 2));

  await mongoose.disconnect();
})();

const mongoose = require('mongoose');

const cleanupLegacyUserIndexes = async () => {
    try {
        const usersCollection = mongoose.connection.db.collection('users');
        const indexes = await usersCollection.indexes();
        const legacyPhoneIndex = indexes.find((idx) => idx.name === 'phone_1');

        if (legacyPhoneIndex) {
            await usersCollection.dropIndex('phone_1');
            console.log('Dropped legacy users.phone_1 index');
        }
    } catch (err) {
        // Non-fatal cleanup: app should still run even if index cleanup is skipped.
        console.warn('Legacy index cleanup skipped:', err.message);
    }
};

const cleanupLegacyContactIndexes = async () => {
    try {
        const contactsCollection = mongoose.connection.db.collection('contacts');
        const indexes = await contactsCollection.indexes();
        const legacyUserPhoneUnique = indexes.find((idx) => idx.name === 'userId_1_phone_1');

        if (legacyUserPhoneUnique) {
            await contactsCollection.dropIndex('userId_1_phone_1');
            console.log('Dropped legacy contacts.userId_1_phone_1 index');
        }
    } catch (err) {
        // Non-fatal cleanup: app should still run even if index cleanup is skipped.
        console.warn('Legacy contact index cleanup skipped:', err.message);
    }
};

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected...');
        await cleanupLegacyUserIndexes();
        await cleanupLegacyContactIndexes();
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

module.exports = connectDB;

require('dotenv').config();
const mongoose = require('mongoose');
const crypto = require('crypto');

// Import models
const User = require('./models/User');
const Contact = require('./models/Contact');
const Message = require('./models/Message');
const ShareLink = require('./models/ShareLink');

async function runTest() {
    console.log('🔄 Connecting to MongoDB...');
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smartcontact');
        console.log('✅ Connected.\n');

        // 1. Setup Test Users
        console.log('📝 Creating test users...');
        const sender = await User.create({
            name: 'Test Sender ' + crypto.randomBytes(2).toString('hex'),
            email: `sender_${Date.now()}@test.com`,
            password: 'password123',
            phone: `123${Date.now().toString().slice(-7)}`
        });

        const receiver = await User.create({
            name: 'Test Receiver ' + crypto.randomBytes(2).toString('hex'),
            email: `receiver_${Date.now()}@test.com`,
            password: 'password123',
            phone: `456${Date.now().toString().slice(-7)}`
        });
        console.log(`   Sender: ${sender.name}\n   Receiver: ${receiver.name}`);

        // 2. Setup Test Contact
        console.log('\n📝 Creating test contact...');
        const contact = await Contact.create({
            ownerId: sender._id,
            userId: receiver._id, // Linked user
            name: 'Contact Alias for Receiver',
            phone: '1234567890',
            email: receiver.email
        });

        // 3. Setup Test Share Link
        console.log('📝 Creating secure share link mapping...');
        await ShareLink.create({
            senderId: sender._id,
            contactId: contact._id,
            receiverId: receiver._id,
            token: crypto.randomBytes(16).toString('hex'),
            expiresAt: new Date(Date.now() + 600000), // 10 mins from now
            isActive: true,
            isOneTime: false
        });

        // 4. Setup Test Message
        console.log('📝 Creating test message mapping...');
        const getPairRoom = (a, b) => `chat:${[String(a), String(b)].sort().join('_')}`;
        await Message.create({
            ownerId: sender._id,
            senderId: sender._id,
            receiverId: receiver._id,
            chatRoomId: getPairRoom(sender._id, receiver._id),
            text: 'Hello, this is a test message to verify mapping.',
            messageType: 'text',
            status: 'delivered'
        });

        // ==========================================
        //         TEST 1: SHARE LINKS MAPPING
        // ==========================================
        console.log('\n----------------------------------------');
        console.log('🧪 TEST 1: SHARE LINKS ROUTE MAPPING');
        console.log('----------------------------------------');
        const links = await ShareLink.find({ senderId: sender._id })
            .populate('contactId', 'name phone email')
            .populate('receiverId', 'name email')
            .lean();

        for (const share of links) {
            // Emulate routes/share.js fallback logic
            const receiverName = share.receiverId?.name || share.receiverId?.email || 'Unknown User';
            console.log(`   Extracted Receiver Name : "${receiverName}"`);
            
            if (receiverName === receiver.name) {
                console.log('   ✅ PASS: Share link correctly mapped Receiver Name.');
            } else if (receiverName === 'Unknown User') {
                console.error('   ❌ FAIL: Displayed "Unknown User"');
            } else {
                console.error(`   ❌ FAIL: Extracted name mismatched. Got "${receiverName}"`);
            }
        }

        // ==========================================
        //         TEST 2: MULTI-CHAT SUMMARIES
        // ==========================================
        console.log('\n----------------------------------------');
        console.log('🧪 TEST 2: CHAT SUMMARIES ROUTE MAPPING');
        console.log('----------------------------------------');
        const rows = await Message.find({
            $or: [{ senderId: sender._id }, { receiverId: sender._id }],
        }).lean();

        // Emulate Map construction for users
        const senderStrId = String(sender._id);
        const userIds = [...new Set(rows.map(r => String(String(r.senderId) === senderStrId ? r.receiverId : r.senderId)))];
        const users = await User.find({ _id: { $in: userIds } }).select('_id name email').lean();
        const userMap = new Map(users.map((u) => [String(u._id), u]));

        for (const row of rows) {
            const targetId = String(String(row.senderId) === senderStrId ? row.receiverId : row.senderId);
            const userObj = userMap.get(targetId);
            
            // Emulate routes/messages.js fallback logic
            const targetName = userObj?.name || userObj?.email || 'Unknown User';

            console.log(`   Extracted Summary Name  : "${targetName}"`);
            if (targetName === receiver.name) {
                console.log('   ✅ PASS: Chat summary correctly mapped target User Name.');
            } else if (targetName === 'Unknown User') {
                console.error('   ❌ FAIL: Displayed "Unknown User"');
            } else {
                console.error(`   ❌ FAIL: Extracted name mismatched.`);
            }
        }

        // ==========================================
        //         TEST 3: MESSAGE THREAD MAPPING
        // ==========================================
        console.log('\n----------------------------------------');
        console.log('🧪 TEST 3: MESSAGE THREAD POPULATION');
        console.log('----------------------------------------');
        const messages = await Message.find({
            $or: [
                { senderId: sender._id, receiverId: receiver._id },
                { senderId: receiver._id, receiverId: sender._id }
            ]
        })
        .populate('senderId', 'name email')
        .populate('receiverId', 'name email')
        .lean();

        for (const msg of messages) {
            const parsedReceiver = msg.receiverId?.name || msg.receiverId?.email || 'Unknown User';
            const parsedSender = msg.senderId?.name || msg.senderId?.email || 'Unknown User';
            
            console.log(`   Populated Sender        : "${parsedSender}"`);
            console.log(`   Populated Receiver      : "${parsedReceiver}"`);

            if (parsedReceiver === receiver.name && parsedSender === sender.name) {
                console.log('   ✅ PASS: Message thread correctly populated both Sender and Receiver names.');
            } else if (parsedReceiver === 'Unknown User' || parsedSender === 'Unknown User') {
                console.error('   ❌ FAIL: Displayed "Unknown User" during deep thread mapping');
            }
        }

    } catch (error) {
        console.error('\n❌ Test interrupted by error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 DB Disconnected.');
    }
}

runTest();
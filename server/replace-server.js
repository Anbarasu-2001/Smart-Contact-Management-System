const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

code = code.replace(
  `emitUserNotification(contactId, {
          type: 'message',
          title: 'New Message',
          body: normalizedMessageType === 'contact_share'`,
  `const contactObj = await mongoose.model('Contact').findById(contactId).lean().catch(() => null);
        const notificationTarget = contactObj ? (contactObj.linkedUserId || contactObj.userId) : contactId;
        
        emitUserNotification(notificationTarget, {
          type: 'message',
          title: 'New Message',
          body: normalizedMessageType === 'contact_share'`
);

fs.writeFileSync('index.js', code);
console.log('Server updated');

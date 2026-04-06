const fs = require('fs');

let code = fs.readFileSync('C:/Users/Anbarasu/OneDrive/Desktop/miniproject/server/index.js', 'utf8');

const targetStr = `        io.to(getChatRoom(userId, contactId)).emit('new-message', payload);
        io.to(getChatRoom(userId, contactId)).emit('receiveMessage', payload);
        io.to(getChatRoom(userId, contactId)).emit('message-delivered', {
          messageId: message._id,
          contactId,
        });
        emitUserNotification(contactId, {
          type: 'message',
          title: 'New Message',
          body: normalizedMessageType === 'contact_share'
            ? (safeText || \`Shared contact: \${sharedContactName || 'Contact'}\`)
            : safeText,
          senderId: userId,
          contactId,
        });`;


const replaceStr = `        const receivingUserId = contact.linkedUserId ? String(contact.linkedUserId) : null;
        
        io.to(getChatRoom(userId, contactId)).emit('new-message', payload);
        io.to(getChatRoom(userId, contactId)).emit('receiveMessage', payload);
        
        if (receivingUserId) {
            io.to(\`user:\${receivingUserId}\`).emit('receiveMessage', payload);
            io.to(\`user:\${receivingUserId}\`).emit('newMessage', payload);
            io.to(\`user:\${receivingUserId}\`).emit('new-message', payload);
            emitUserNotification(receivingUserId, {
                type: 'message',
                title: 'New Message',
                body: normalizedMessageType === 'contact_share'
                    ? (safeText || \`Shared contact: \${sharedContactName || 'Contact'}\`)
                    : safeText,
                senderId: userId,
                contactId,
            });
        }
        
        io.to(getChatRoom(userId, contactId)).emit('message-delivered', {
          messageId: message._id,
          contactId,
        });`;

code = code.replace(targetStr, replaceStr);

if (code.includes('const receivingUserId = contact.linkedUserId')) {
    console.log('Replacement successful.');
}

fs.writeFileSync('C:/Users/Anbarasu/OneDrive/Desktop/miniproject/server/index.js', code);

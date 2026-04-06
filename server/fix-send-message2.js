const fs = require('fs');

let code = fs.readFileSync('C:/Users/Anbarasu/OneDrive/Desktop/miniproject/server/index.js', 'utf8');

// I replaced emitUserNotification manually before, need to find the correct string currently in the file
const findKeyword = `io.to(getChatRoom(userId, contactId)).emit('new-message', payload);`;

const index = code.indexOf(findKeyword);

if (index > -1) {
    // Find the end of the block
    const endKeyword = `trackInteraction({`;
    const endIndex = code.indexOf(endKeyword, index);
    
    if (endIndex > -1) {
        const replaceStr = `
        const receivingUserId = contact.linkedUserId ? String(contact.linkedUserId) : null;
        
        io.to(getChatRoom(userId, contactId)).emit('new-message', payload);
        io.to(getChatRoom(userId, contactId)).emit('receiveMessage', payload);
        
        // Broadcast the message directly to the remote user's socket room if they are online
        if (receivingUserId) {
            io.to(\`user:\${receivingUserId}\`).emit('receiveMessage', payload);
            io.to(\`user:\${receivingUserId}\`).emit('newMessage', payload);
            io.to(\`user:\${receivingUserId}\`).emit('new-message', payload);
            
            // Generate notification for the receiving user, NOT the sender
            emitUserNotification(receivingUserId, {
                type: 'message',
                title: 'New Message',
                body: normalizedMessageType === 'contact_share'
                    ? (safeText || \`Shared contact: \${sharedContactName || 'Contact'}\`)
                    : safeText,
                senderId: userId,
                contactId: String(contact._id),
            });
        }
        
        io.to(getChatRoom(userId, contactId)).emit('message-delivered', {
          messageId: message._id,
          contactId,
        });

        await `;
        
        code = code.substring(0, index) + replaceStr + code.substring(endIndex);
        fs.writeFileSync('C:/Users/Anbarasu/OneDrive/Desktop/miniproject/server/index.js', code);
        console.log('Force Replacement successful.');
    }
}

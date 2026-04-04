// Message controller for SmartContact
const Message = require('../models/Message');

exports.getMessages = async (req, res) => {
  try {
    const { contactId } = req.params;
    const messages = await Message.find({
      $or: [
        { senderId: req.user.id, receiverId: contactId },
        { senderId: contactId, receiverId: req.user.id }
      ]
    }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).send('Server error');
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { contactId, text } = req.body;
    const message = new Message({
      senderId: req.user.id,
      receiverId: contactId,
      text
    });
    await message.save();
    res.json(message);
  } catch (err) {
    res.status(500).send('Server error');
  }
};
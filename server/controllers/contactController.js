// Contact controller for SmartContact
const Contact = require('../models/Contact');

const User = require('../models/User');

exports.getContacts = async (req, res) => {
  try {
    const contacts = await Contact.find({ ownerId: req.user.id, phone: { $ne: req.user.phone } })
      .populate('userId', 'name phone');
    res.json(contacts);
  } catch (err) {
    res.status(500).send('Server error');
  }
};

exports.addContact = async (req, res) => {
  try {
    const { name, phone, email, relationshipType } = req.body;
    const formattedPhone = String(phone).replace(/\D/g, '');
    if (formattedPhone === req.user.phone) return res.status(400).json({ msg: 'Cannot add self as contact' });
    let linkedUser = await User.findOne({ phone: formattedPhone });
    const contact = new Contact({
      ownerId: req.user.id,
      name,
      phone: formattedPhone,
      email,
      relationshipType,
      userId: linkedUser ? linkedUser._id : null
    });
    await contact.save();
    res.json(contact);
  } catch (err) {
    res.status(500).send('Server error');
  }
};

exports.deleteContact = async (req, res) => {
  try {
    await Contact.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Contact removed' });
  } catch (err) {
    res.status(500).send('Server error');
  }
};
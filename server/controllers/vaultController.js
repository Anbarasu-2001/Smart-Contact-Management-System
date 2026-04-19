const VaultItem = require('../models/VaultItem');

// Add a new vault item
exports.addVaultItem = async (req, res) => {
  try {
    const { type, title, content, size } = req.body;
    const ownerId = req.user ? req.user.id : req.body.ownerId; // fallback for testing
    if (!ownerId) return res.status(400).json({ error: 'Missing ownerId' });
    const item = new VaultItem({ ownerId, type, title, content, size });
    await item.save();
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all vault items for a user
exports.getVaultItems = async (req, res) => {
  try {
    const ownerId = req.user ? req.user.id : req.query.ownerId; // fallback for testing
    if (!ownerId) return res.status(400).json({ error: 'Missing ownerId' });
    const items = await VaultItem.find({ ownerId }).sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update vault item
exports.updateVaultItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    const ownerId = req.user.id;
    const item = await VaultItem.findOneAndUpdate(
      { _id: id, ownerId },
      { $set: { title, content } },
      { new: true }
    );
    if (!item) return res.status(404).json({ error: 'Vault item not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

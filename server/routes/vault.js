const express = require('express');
const router = express.Router();
const vaultController = require('../controllers/vaultController');
const auth = require('../middleware/auth');

// Add a vault item (note or asset)
router.post('/', auth, vaultController.addVaultItem);

// Get all vault items for the logged-in user
router.get('/', auth, vaultController.getVaultItems);

// Edit vault item
router.patch('/:id', auth, vaultController.updateVaultItem);

module.exports = router;

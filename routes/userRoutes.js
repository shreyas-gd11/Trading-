const express = require('express');
const auth = require('../middleware/auth');
const userController = require('../controllers/userController');

const router = express.Router();

// GET /api/user/profile - with authentication
router.get('/profile', auth, userController.getProfile);

// PUT /api/user/profile - with authentication
router.put('/profile', auth, userController.updateProfile);

// PUT /api/user/strategy-settings - with authentication
router.put('/strategy-settings', auth, userController.updateStrategySettings);

// POST /api/user/alerts - with authentication
router.post('/alerts', auth, userController.createAlert);

// GET /api/user/alerts - with authentication
router.get('/alerts', auth, userController.getAlerts);

// DELETE /api/user/alerts/:alertId - with authentication
router.delete('/alerts/:alertId', auth, userController.deleteAlert);

module.exports = router;
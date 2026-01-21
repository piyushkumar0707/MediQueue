const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.post('/register/initiate', authController.initiateRegistration);
router.post('/register/complete', authController.completeRegistration);
router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Protected routes
router.use(protect); // All routes below require authentication
router.get('/me', authController.getCurrentUser);
router.post('/logout', authController.logout);
router.post('/logout-all', authController.logoutAll);

module.exports = router;

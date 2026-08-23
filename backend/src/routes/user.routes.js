const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { protect, optionalAuth } = require('../middlewares/auth');
const { updateProfileSchema, validate } = require('../validations/auth.validation');
const { uploadImage } = require('../middlewares/upload');

// Public routes
router.get('/', userController.getAllUsers);
router.get('/:id', optionalAuth, userController.getUserById);
router.get('/search/skills', userController.searchBySkills);

// Protected routes
router.put('/profile', protect, validate(updateProfileSchema), userController.updateProfile);
router.put('/avatar', protect, uploadImage.single('avatar'), userController.updateAvatar);
router.put('/change-password', protect, userController.changePassword);
router.delete('/account', protect, userController.deleteAccount);
router.get('/me/stats', protect, userController.getUserStats);

// Push notifications (Expo mobile app)
router.put('/me/push-tokens', protect, userController.registerPushToken);
router.delete('/me/push-tokens/:token', protect, userController.unregisterPushToken);

module.exports = router;

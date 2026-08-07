const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const { protect } = require('../middlewares/auth');

router.use(protect);

router.post('/direct', chatController.createOrGetDirectChat);
router.post('/group', chatController.createGroupChat);
router.get('/', chatController.getMyChats);
router.get('/:id', chatController.getChatById);
router.get('/:id/messages', chatController.getMessages);
router.post('/:id/messages', chatController.sendMessage);
router.post('/:id/read', chatController.markAsRead);
router.post('/:id/participants', chatController.addParticipant);
router.post('/:id/leave', chatController.leaveChat);

module.exports = router;

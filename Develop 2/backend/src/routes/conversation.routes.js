const express = require('express');

const conversationController = require('../controllers/conversation.controller');
const authenticateToken = require('../middlewares/authenticateToken');

const router = express.Router();

router.use(authenticateToken);

router.get('/', conversationController.listConversations);
router.get('/:id', conversationController.getConversation);
router.post('/', conversationController.createConversation);
router.post('/:id/messages', conversationController.replyToConversation);
router.patch('/:id/status', conversationController.updateConversationStatus);

module.exports = router;
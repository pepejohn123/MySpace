const conversationService = require('../services/conversation.service');

function listConversations(req, res, next) {
  try {
    return res.json({ conversations: conversationService.listConversations(req.user) });
  } catch (error) {
    return next(error);
  }
}

function getConversation(req, res, next) {
  try {
    return res.json({ conversation: conversationService.getConversationById(req.params.id, req.user) });
  } catch (error) {
    return next(error);
  }
}

function createConversation(req, res, next) {
  try {
    return res.status(201).json({ conversation: conversationService.createConversation(req.body, req.user) });
  } catch (error) {
    return next(error);
  }
}

function replyToConversation(req, res, next) {
  try {
    return res.json({ conversation: conversationService.replyToConversation(req.params.id, req.body, req.user) });
  } catch (error) {
    return next(error);
  }
}

function updateConversationStatus(req, res, next) {
  try {
    return res.json({ conversation: conversationService.updateConversationStatus(req.params.id, req.body.status, req.user) });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listConversations,
  getConversation,
  createConversation,
  replyToConversation,
  updateConversationStatus
};
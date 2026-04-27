const ROLES = require('../constants/roles');
const conversationRepository = require('../repositories/conversation.repository');
const userRepository = require('../repositories/user.repository');
const createHttpError = require('../utils/httpError');

function generateConversationId() {
  return `CONV#${Date.now()}`;
}

function generateMessageId() {
  return `MSG#${Date.now()}#${Math.floor(Math.random() * 1000)}`;
}

function ensureConversationAccess(conversation, currentUser) {
  if (!conversation) {
    throw createHttpError(404, 'Conversación no encontrada');
  }

  if (currentUser.role === ROLES.ADMIN && conversation.condominioId !== currentUser.condominioId) {
    throw createHttpError(403, 'No tienes acceso a esta conversación');
  }

  if (currentUser.role === ROLES.RESIDENTE && conversation.residentId !== currentUser.sub) {
    throw createHttpError(403, 'No tienes acceso a esta conversación');
  }

  return conversation;
}

function listConversations(currentUser) {
  if (currentUser.role === ROLES.ADMIN) {
    return conversationRepository.findByCondominioId(currentUser.condominioId);
  }

  return conversationRepository.findByResidentId(currentUser.sub);
}

function getConversationById(conversationId, currentUser) {
  const conversation = conversationRepository.findById(conversationId);
  return ensureConversationAccess(conversation, currentUser);
}

function createConversation(payload, currentUser) {
  if (currentUser.role !== ROLES.RESIDENTE) {
    throw createHttpError(403, 'Solo un residente puede iniciar una conversación');
  }

  const subject = String(payload.subject || '').trim();
  const message = String(payload.message || '').trim();

  if (!subject || !message) {
    throw createHttpError(400, 'Asunto y mensaje son requeridos');
  }

  const now = new Date().toISOString();
  const resident = userRepository.findById(currentUser.sub);

  const conversation = {
    id: generateConversationId(),
    condominioId: currentUser.condominioId,
    residentId: currentUser.sub,
    residentName: resident?.name || currentUser.name || 'Residente',
    subject,
    status: 'abierta',
    createdAt: now,
    updatedAt: now,
    messages: [
      {
        id: generateMessageId(),
        senderId: currentUser.sub,
        senderRole: currentUser.role,
        senderName: resident?.name || currentUser.name || 'Residente',
        body: message,
        createdAt: now
      }
    ]
  };

  return conversationRepository.create(conversation);
}

function replyToConversation(conversationId, payload, currentUser) {
  const conversation = getConversationById(conversationId, currentUser);

  if (conversation.status === 'cerrada') {
    throw createHttpError(400, 'La conversación está cerrada');
  }

  const message = String(payload.message || '').trim();

  if (!message) {
    throw createHttpError(400, 'El mensaje es requerido');
  }

  const now = new Date().toISOString();
  const sender = userRepository.findById(currentUser.sub);
  const nextStatus = currentUser.role === ROLES.ADMIN ? 'respondida' : 'abierta';

  conversation.messages.push({
    id: generateMessageId(),
    senderId: currentUser.sub,
    senderRole: currentUser.role,
    senderName: sender?.name || currentUser.name || 'Usuario',
    body: message,
    createdAt: now
  });

  return conversationRepository.update(conversation.id, {
    messages: conversation.messages,
    updatedAt: now,
    status: nextStatus
  });
}

function updateConversationStatus(conversationId, status, currentUser) {
  if (currentUser.role !== ROLES.ADMIN) {
    throw createHttpError(403, 'Solo admin puede cambiar el estado');
  }

  const conversation = getConversationById(conversationId, currentUser);
  const validStatuses = ['abierta', 'respondida', 'cerrada'];

  if (!validStatuses.includes(status)) {
    throw createHttpError(400, 'Estado inválido');
  }

  return conversationRepository.update(conversation.id, {
    status,
    updatedAt: new Date().toISOString()
  });
}

module.exports = {
  listConversations,
  getConversationById,
  createConversation,
  replyToConversation,
  updateConversationStatus
};
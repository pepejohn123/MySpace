const conversations = require('../data/conversations.json');

function findAll() {
  return conversations;
}

function findById(id) {
  return conversations.find((conversation) => conversation.id === id);
}

function findByCondominioId(condominioId) {
  return conversations.filter((conversation) => conversation.condominioId === condominioId);
}

function findByResidentId(residentId) {
  return conversations.filter((conversation) => conversation.residentId === residentId);
}

function create(conversation) {
  conversations.push(conversation);
  return conversation;
}

function update(id, changes) {
  const conversation = findById(id);

  if (!conversation) {
    return null;
  }

  Object.assign(conversation, changes);
  return conversation;
}

module.exports = {
  findAll,
  findById,
  findByCondominioId,
  findByResidentId,
  create,
  update
};
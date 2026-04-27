const notices = require('../data/notices.json');

function findAll() {
  return notices;
}

function findById(id) {
  return notices.find((notice) => notice.id === id);
}

function findByCondominioId(condominioId) {
  return notices.filter((notice) => notice.condominioId === condominioId);
}

function create(notice) {
  notices.push(notice);
  return notice;
}

function update(id, changes) {
  const notice = findById(id);

  if (!notice) {
    return null;
  }

  Object.assign(notice, changes);
  return notice;
}

function remove(id) {
  const index = notices.findIndex((notice) => notice.id === id);

  if (index === -1) {
    return null;
  }

  const [removedNotice] = notices.splice(index, 1);
  return removedNotice;
}

module.exports = {
  findAll,
  findById,
  findByCondominioId,
  create,
  update,
  remove
};
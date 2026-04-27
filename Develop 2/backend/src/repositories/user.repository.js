const users = require('../data/users.json');

function findByEmail(email) {
  return users.find(
    (user) => user.email.toLowerCase() === String(email).toLowerCase()
  );
}

function findById(id) {
  return users.find((user) => user.id === id);
}

function findAll() {
  return users;
}

function existsByEmail(email) {
  return Boolean(findByEmail(email));
}

function create(user) {
  users.push(user);
  return user;
}

function update(id, changes) {
  const user = findById(id);

  if (!user) {
    return null;
  }

  Object.assign(user, changes);
  return user;
}

function listRoles() {
  return [...new Set(users.map((user) => user.role))];
}

module.exports = {
  findAll,
  findByEmail,
  findById,
  existsByEmail,
  create,
  update,
  listRoles
};
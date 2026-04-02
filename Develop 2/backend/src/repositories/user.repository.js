const users = require('../data/users.json');

function findByEmail(email) {
  return users.find(
    (user) => user.email.toLowerCase() === String(email).toLowerCase()
  );
}

function findById(id) {
  return users.find((user) => user.id === id);
}

function listRoles() {
  return [...new Set(users.map((user) => user.role))];
}

module.exports = {
  findByEmail,
  findById,
  listRoles
};
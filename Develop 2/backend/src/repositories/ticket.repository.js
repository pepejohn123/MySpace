const tickets = require('../data/tickets.json');

function findAll() {
  return tickets;
}

function findById(id) {
  return tickets.find((ticket) => ticket.id === id);
}

function findByResidentId(residentId) {
  return tickets.filter((ticket) => ticket.residentId === residentId);
}

function findByCondominioId(condominioId) {
  return tickets.filter((ticket) => ticket.condominioId === condominioId);
}

function create(ticket) {
  tickets.push(ticket);
  return ticket;
}

function update(id, changes) {
  const ticket = findById(id);

  if (!ticket) {
    return null;
  }

  Object.assign(ticket, changes);
  return ticket;
}

module.exports = {
  findAll,
  findById,
  findByResidentId,
  findByCondominioId,
  create,
  update
};
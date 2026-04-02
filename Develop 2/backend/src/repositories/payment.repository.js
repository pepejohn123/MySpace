const payments = require('../data/payments.json');

function findAll() {
  return payments;
}

function findById(id) {
  return payments.find((payment) => payment.id === id);
}

function findByResidentId(residentId) {
  return payments.filter((payment) => payment.residentId === residentId);
}

function findByCondominioId(condominioId) {
  return payments.filter((payment) => payment.condominioId === condominioId);
}

function create(payment) {
  payments.push(payment);
  return payment;
}

function update(id, changes) {
  const payment = findById(id);

  if (!payment) {
    return null;
  }

  Object.assign(payment, changes);
  return payment;
}

module.exports = {
  findAll,
  findById,
  findByResidentId,
  findByCondominioId,
  create,
  update
};
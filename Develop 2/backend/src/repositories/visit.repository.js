const visits = require('../data/visits.json');

function findAll() {
  return visits;
}

function findById(id) {
  return visits.find((visit) => visit.id === id);
}

function findByResidentId(residentId) {
  return visits.filter((visit) => visit.residentId === residentId);
}

function findByCondominioId(condominioId) {
  return visits.filter((visit) => visit.condominioId === condominioId);
}

function findByAccessCode(accessCode) {
  return visits.find((visit) => visit.accessCode === accessCode);
}

function create(visit) {
  visits.push(visit);
  return visit;
}

function update(id, changes) {
  const visit = findById(id);

  if (!visit) {
    return null;
  }

  Object.assign(visit, changes);
  return visit;
}

module.exports = {
  findAll,
  findById,
  findByResidentId,
  findByCondominioId,
  findByAccessCode,
  create,
  update
};
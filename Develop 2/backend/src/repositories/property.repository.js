const properties = require('../data/properties.json');

function findAll() {
  return properties;
}

function findById(id) {
  return properties.find((property) => property.id === id);
}

function findByCondominioId(condominioId) {
  return properties.filter((property) => property.condominioId === condominioId);
}

function create(property) {
  properties.push(property);
  return property;
}

function update(id, changes) {
  const property = findById(id);

  if (!property) {
    return null;
  }

  Object.assign(property, changes);
  return property;
}

module.exports = {
  findAll,
  findById,
  findByCondominioId,
  create,
  update
};
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

function remove(id) {
  const index = properties.findIndex((property) => property.id === id);

  if (index === -1) {
    return null;
  }

  const [deletedProperty] = properties.splice(index, 1);
  return deletedProperty;
}

module.exports = {
  findAll,
  findById,
  findByCondominioId,
  create,
  update,
  remove
};
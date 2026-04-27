const amenities = require('../data/amenities.json');

function findAll() {
  return amenities;
}

function findById(id) {
  return amenities.find((amenity) => amenity.id === id);
}

function findByCondominioId(condominioId) {
  return amenities.filter((amenity) => amenity.condominioId === condominioId);
}

function create(amenity) {
  amenities.push(amenity);
  return amenity;
}

function update(id, changes) {
  const amenity = findById(id);

  if (!amenity) {
    return null;
  }

  Object.assign(amenity, changes);
  return amenity;
}

function remove(id) {
  const index = amenities.findIndex((amenity) => amenity.id === id);

  if (index === -1) {
    return null;
  }

  const [removedAmenity] = amenities.splice(index, 1);
  return removedAmenity;
}

module.exports = {
  findAll,
  findById,
  findByCondominioId,
  create,
  update,
  remove
};
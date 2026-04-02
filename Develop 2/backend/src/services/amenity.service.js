const amenityRepository = require('../repositories/amenity.repository');
const reservationRepository = require('../repositories/reservation.repository');
const createHttpError = require('../utils/httpError');

function buildAmenityId(name) {
  return `AMENITY#${String(name).toUpperCase().replace(/[^A-Z0-9]+/g, '_')}`;
}

function normalizeAmenityPayload(payload, { isUpdate = false } = {}) {
  const normalized = {
    condominioId: payload.condominioId,
    name: payload.name,
    description: payload.description || '',
    status: payload.status || 'activa'
  };

  if (isUpdate) {
    return Object.fromEntries(Object.entries(normalized).filter(([, value]) => value !== undefined));
  }

  if (!normalized.condominioId || !normalized.name) {
    throw createHttpError(400, 'condominioId y name son requeridos');
  }

  return normalized;
}

function listAmenities(condominioId) {
  if (condominioId) {
    return amenityRepository.findByCondominioId(condominioId);
  }

  return amenityRepository.findAll();
}

function getAmenityById(id) {
  const amenity = amenityRepository.findById(decodeURIComponent(String(id)));

  if (!amenity) {
    throw createHttpError(404, 'Amenidad no encontrada');
  }

  return amenity;
}

function createAmenity(payload) {
  const normalized = normalizeAmenityPayload(payload);
  const now = new Date().toISOString();

  const amenity = {
    id: buildAmenityId(normalized.name),
    ...normalized,
    createdAt: now,
    updatedAt: now
  };

  if (amenityRepository.findById(amenity.id)) {
    throw createHttpError(409, 'Ya existe una amenidad con ese identificador');
  }

  return amenityRepository.create(amenity);
}

function updateAmenity(id, payload) {
  const amenity = amenityRepository.findById(decodeURIComponent(String(id)));

  if (!amenity) {
    throw createHttpError(404, 'Amenidad no encontrada');
  }

  const normalized = normalizeAmenityPayload(payload, { isUpdate: true });

  if (!Object.keys(normalized).length) {
    throw createHttpError(400, 'No se enviaron campos válidos para actualizar');
  }

  return amenityRepository.update(amenity.id, {
    ...normalized,
    updatedAt: new Date().toISOString()
  });
}

function getAmenityAvailability(id, date) {
  const amenity = amenityRepository.findById(decodeURIComponent(String(id)));

  if (!amenity) {
    throw createHttpError(404, 'Amenidad no encontrada');
  }

  if (!date) {
    throw createHttpError(400, 'date es requerido');
  }

  const availableSlots = Array.isArray(amenity.availableSlots) ? amenity.availableSlots : [];
  const approvedReservations = reservationRepository.findByAmenityAndDate({
    condominioId: amenity.condominioId,
    amenityId: amenity.id,
    reservationDate: date
  });

  const reservedSlots = approvedReservations.map((reservation) => reservation.timeSlot);
  const freeSlots = availableSlots.filter((slot) => !reservedSlots.includes(slot));

  return {
    amenityId: amenity.id,
    date,
    availableSlots: freeSlots,
    reservedSlots
  };
}

function deleteAmenity(id) {
  const amenity = amenityRepository.findById(decodeURIComponent(String(id)));

  if (!amenity) {
    throw createHttpError(404, 'Amenidad no encontrada');
  }

  const relatedReservations = reservationRepository.findByAmenityId(amenity.id);

  if (relatedReservations.length) {
    throw createHttpError(409, 'No se puede eliminar una amenidad con reservas asociadas. Cámbiala a inactiva o mantenimiento.');
  }

  return amenityRepository.remove(amenity.id);
}

module.exports = {
  listAmenities,
  getAmenityById,
  createAmenity,
  updateAmenity,
  getAmenityAvailability,
  deleteAmenity
};
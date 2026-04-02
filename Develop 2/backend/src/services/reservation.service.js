const reservationRepository = require('../repositories/reservation.repository');
const amenityRepository = require('../repositories/amenity.repository');
const userRepository = require('../repositories/user.repository');
const createHttpError = require('../utils/httpError');
const ROLES = require('../constants/roles');

const ALLOWED_STATUSES = ['pendiente', 'aprobada', 'rechazada'];

function buildReservationId() {
  return `RESERVATION#${Date.now()}`;
}

function normalizeReservationId(id) {
  return decodeURIComponent(String(id));
}

function ensureResidentUser(residentId) {
  const resident = userRepository.findById(residentId);

  if (!resident || resident.role !== ROLES.RESIDENTE) {
    throw createHttpError(400, 'residentId no corresponde a un residente válido');
  }

  return resident;
}

function listReservations(currentUser) {
  if (currentUser.role === ROLES.ADMIN) {
    return reservationRepository.findByCondominioId(currentUser.condominioId);
  }

  if (currentUser.role === ROLES.RESIDENTE) {
    return reservationRepository.findByResidentId(currentUser.sub);
  }

  throw createHttpError(403, 'No tienes permisos para consultar reservas');
}

function getReservationById(id, currentUser) {
  const reservation = reservationRepository.findById(normalizeReservationId(id));

  if (!reservation) {
    throw createHttpError(404, 'Reserva no encontrada');
  }

  if (currentUser.role === ROLES.ADMIN && reservation.condominioId === currentUser.condominioId) {
    return reservation;
  }

  if (currentUser.role === ROLES.RESIDENTE && reservation.residentId === currentUser.sub) {
    return reservation;
  }

  throw createHttpError(403, 'No tienes permisos para consultar esta reserva');
}

function createReservation(payload, currentUser) {
  if (currentUser.role !== ROLES.RESIDENTE) {
    throw createHttpError(403, 'Solo un residente puede crear reservas');
  }

  const amenityId = String(payload.amenityId || '').trim();
  const amenityName = String(payload.amenityName || '').trim();
  const reservationDate = String(payload.reservationDate || '').trim();
  const timeSlot = String(payload.timeSlot || '').trim();

  if (!amenityId || !amenityName || !reservationDate || !timeSlot) {
    throw createHttpError(400, 'amenityId, amenityName, reservationDate y timeSlot son requeridos');
  }

  const resident = ensureResidentUser(currentUser.sub);

  const amenity = amenityRepository.findById(amenityId);

  if (!amenity || amenity.condominioId !== resident.condominioId) {
    throw createHttpError(400, 'La amenidad seleccionada no es válida');
  }

  const availableSlots = Array.isArray(amenity.availableSlots) ? amenity.availableSlots : [];

  if (!availableSlots.includes(timeSlot)) {
    throw createHttpError(400, 'El horario seleccionado no es válido para la amenidad');
  }

  const conflictingReservation = reservationRepository.findConflictingReservation({
    condominioId: resident.condominioId,
    amenityId,
    reservationDate,
    timeSlot
  });

  if (conflictingReservation) {
    throw createHttpError(409, 'Ese horario ya fue aprobado para la amenidad seleccionada');
  }

  const now = new Date().toISOString();

  const reservation = {
    id: buildReservationId(),
    condominioId: resident.condominioId,
    residentId: resident.id,
    propertyId: resident.propertyId || null,
    amenityId,
    amenityName,
    reservationDate,
    timeSlot,
    status: 'pendiente',
    createdAt: now,
    updatedAt: now
  };

  return reservationRepository.create(reservation);
}

function updateReservationStatus(id, payload, currentUser) {
  if (currentUser.role !== ROLES.ADMIN) {
    throw createHttpError(403, 'Solo un administrador puede actualizar el estado de la reserva');
  }

  const reservation = reservationRepository.findById(normalizeReservationId(id));

  if (!reservation) {
    throw createHttpError(404, 'Reserva no encontrada');
  }

  if (reservation.condominioId !== currentUser.condominioId) {
    throw createHttpError(403, 'No tienes permisos para actualizar esta reserva');
  }

  const status = payload.status;

  if (!ALLOWED_STATUSES.includes(status)) {
    throw createHttpError(400, 'status inválido');
  }

  if (status === 'aprobada') {
    const conflict = reservationRepository.findConflictingReservation({
      condominioId: reservation.condominioId,
      amenityId: reservation.amenityId,
      reservationDate: reservation.reservationDate,
      timeSlot: reservation.timeSlot
    });

    if (conflict && conflict.id !== reservation.id) {
      throw createHttpError(409, 'Ya existe una reserva aprobada para ese horario');
    }
  }

  return reservationRepository.update(reservation.id, {
    status,
    updatedAt: new Date().toISOString()
  });
}

module.exports = {
  listReservations,
  getReservationById,
  createReservation,
  updateReservationStatus
};
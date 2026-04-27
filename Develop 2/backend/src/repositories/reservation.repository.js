const reservations = require('../data/reservations.json');

function findAll() {
  return reservations;
}

function findById(id) {
  return reservations.find((reservation) => reservation.id === id);
}

function findByResidentId(residentId) {
  return reservations.filter((reservation) => reservation.residentId === residentId);
}

function findByCondominioId(condominioId) {
  return reservations.filter((reservation) => reservation.condominioId === condominioId);
}

function findConflictingReservation({ condominioId, amenityId, reservationDate, timeSlot }) {
  return reservations.find(
    (reservation) =>
      reservation.condominioId === condominioId &&
      reservation.amenityId === amenityId &&
      reservation.reservationDate === reservationDate &&
      reservation.timeSlot === timeSlot &&
      reservation.status === 'aprobada'
  );
}

function findByAmenityAndDate({ condominioId, amenityId, reservationDate }) {
  return reservations.filter(
    (reservation) =>
      reservation.condominioId === condominioId &&
      reservation.amenityId === amenityId &&
      reservation.reservationDate === reservationDate &&
      reservation.status === 'aprobada'
  );
}

function findByAmenityId(amenityId) {
  return reservations.filter((reservation) => reservation.amenityId === amenityId);
}

function create(reservation) {
  reservations.push(reservation);
  return reservation;
}

function update(id, changes) {
  const reservation = findById(id);

  if (!reservation) {
    return null;
  }

  Object.assign(reservation, changes);
  return reservation;
}

module.exports = {
  findAll,
  findById,
  findByResidentId,
  findByCondominioId,
  findConflictingReservation,
  findByAmenityAndDate,
  findByAmenityId,
  create,
  update
};
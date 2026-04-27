const reservationService = require('../services/reservation.service');

function listReservations(req, res, next) {
  try {
    const reservations = reservationService.listReservations(req.user);
    return res.json({ reservations });
  } catch (error) {
    return next(error);
  }
}

function getReservationById(req, res, next) {
  try {
    const reservation = reservationService.getReservationById(req.params.id, req.user);
    return res.json({ reservation });
  } catch (error) {
    return next(error);
  }
}

function createReservation(req, res, next) {
  try {
    const reservation = reservationService.createReservation(req.body, req.user);
    return res.status(201).json({ reservation });
  } catch (error) {
    return next(error);
  }
}

function updateReservationStatus(req, res, next) {
  try {
    const reservation = reservationService.updateReservationStatus(req.params.id, req.body, req.user);
    return res.json({ reservation });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listReservations,
  getReservationById,
  createReservation,
  updateReservationStatus
};
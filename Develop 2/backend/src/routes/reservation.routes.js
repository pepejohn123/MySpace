const express = require('express');

const reservationController = require('../controllers/reservation.controller');
const authenticateToken = require('../middlewares/authenticateToken');
const authorizeRole = require('../middlewares/authorizeRole');
const ROLES = require('../constants/roles');

const router = express.Router();

router.use(authenticateToken);

router.get('/', authorizeRole(ROLES.ADMIN, ROLES.RESIDENTE), reservationController.listReservations);
router.get('/:id', authorizeRole(ROLES.ADMIN, ROLES.RESIDENTE), reservationController.getReservationById);
router.post('/', authorizeRole(ROLES.RESIDENTE), reservationController.createReservation);
router.patch('/:id/status', authorizeRole(ROLES.ADMIN), reservationController.updateReservationStatus);

module.exports = router;
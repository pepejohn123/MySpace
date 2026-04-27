const express = require('express');

const exportController = require('../controllers/export.controller');
const authenticateToken = require('../middlewares/authenticateToken');
const authorizeRole = require('../middlewares/authorizeRole');
const ROLES = require('../constants/roles');

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRole(ROLES.ADMIN));

router.get('/payments.xlsx', exportController.exportPayments);
router.get('/tickets.xlsx', exportController.exportTickets);
router.get('/reservations.xlsx', exportController.exportReservations);
router.get('/visits.xlsx', exportController.exportVisits);

module.exports = router;
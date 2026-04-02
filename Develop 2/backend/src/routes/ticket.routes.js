const express = require('express');

const ticketController = require('../controllers/ticket.controller');
const authenticateToken = require('../middlewares/authenticateToken');
const authorizeRole = require('../middlewares/authorizeRole');
const ROLES = require('../constants/roles');

const router = express.Router();

router.use(authenticateToken);

router.get('/', authorizeRole(ROLES.ADMIN, ROLES.RESIDENTE), ticketController.listTickets);
router.get('/:id', authorizeRole(ROLES.ADMIN, ROLES.RESIDENTE), ticketController.getTicketById);
router.post('/', authorizeRole(ROLES.RESIDENTE), ticketController.createTicket);
router.patch('/:id/status', authorizeRole(ROLES.ADMIN), ticketController.updateTicketStatus);

module.exports = router;
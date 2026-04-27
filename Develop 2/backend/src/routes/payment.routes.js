const express = require('express');

const paymentController = require('../controllers/payment.controller');
const authenticateToken = require('../middlewares/authenticateToken');
const authorizeRole = require('../middlewares/authorizeRole');
const ROLES = require('../constants/roles');

const router = express.Router();

router.use(authenticateToken);

router.get('/', authorizeRole(ROLES.ADMIN, ROLES.RESIDENTE), paymentController.listPayments);
router.get('/:id', authorizeRole(ROLES.ADMIN, ROLES.RESIDENTE), paymentController.getPaymentById);
router.post('/', authorizeRole(ROLES.RESIDENTE), paymentController.createPayment);
router.patch('/:id/status', authorizeRole(ROLES.ADMIN), paymentController.updatePaymentStatus);

module.exports = router;
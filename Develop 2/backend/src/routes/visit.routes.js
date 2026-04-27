const express = require('express');

const visitController = require('../controllers/visit.controller');
const authenticateToken = require('../middlewares/authenticateToken');
const authorizeRole = require('../middlewares/authorizeRole');
const ROLES = require('../constants/roles');

const router = express.Router();

router.use(authenticateToken);

router.get('/', authorizeRole(ROLES.ADMIN, ROLES.RESIDENTE, ROLES.GUARDIA), visitController.listVisits);
router.get('/:id', authorizeRole(ROLES.ADMIN, ROLES.RESIDENTE, ROLES.GUARDIA), visitController.getVisitById);
router.post('/', authorizeRole(ROLES.RESIDENTE), visitController.createVisit);
router.get('/validate/:accessCode', authorizeRole(ROLES.ADMIN, ROLES.GUARDIA), visitController.validateVisit);

module.exports = router;
const express = require('express');

const amenityController = require('../controllers/amenity.controller');
const authenticateToken = require('../middlewares/authenticateToken');
const authorizeRole = require('../middlewares/authorizeRole');
const ROLES = require('../constants/roles');

const router = express.Router();

router.use(authenticateToken);

router.get('/', authorizeRole(ROLES.ADMIN, ROLES.RESIDENTE), amenityController.listAmenities);
router.get('/:id', authorizeRole(ROLES.ADMIN, ROLES.RESIDENTE), amenityController.getAmenityById);
router.get('/:id/availability', authorizeRole(ROLES.ADMIN, ROLES.RESIDENTE), amenityController.getAmenityAvailability);
router.post('/', authorizeRole(ROLES.ADMIN), amenityController.createAmenity);
router.patch('/:id', authorizeRole(ROLES.ADMIN), amenityController.updateAmenity);
router.delete('/:id', authorizeRole(ROLES.ADMIN), amenityController.deleteAmenity);

module.exports = router;
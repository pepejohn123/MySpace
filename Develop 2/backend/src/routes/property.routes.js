const express = require('express');

const propertyController = require('../controllers/property.controller');
const authenticateToken = require('../middlewares/authenticateToken');
const authorizeRole = require('../middlewares/authorizeRole');
const authorizeSuperAdmin = require('../middlewares/authorizeSuperAdmin');
const ROLES = require('../constants/roles');

const router = express.Router();

router.use(authenticateToken, authorizeRole(ROLES.ADMIN));

router.get('/', propertyController.listProperties);
router.get('/:id', propertyController.getPropertyById);
router.post('/', authorizeSuperAdmin, propertyController.createProperty);
router.patch('/:id', authorizeSuperAdmin, propertyController.updateProperty);
router.delete('/:id', authorizeSuperAdmin, propertyController.deleteProperty);
router.patch('/:id/assign-resident', authorizeSuperAdmin, propertyController.assignResident);

module.exports = router;
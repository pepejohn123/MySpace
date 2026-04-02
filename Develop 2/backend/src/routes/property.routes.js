const express = require('express');

const propertyController = require('../controllers/property.controller');
const authenticateToken = require('../middlewares/authenticateToken');
const authorizeRole = require('../middlewares/authorizeRole');
const ROLES = require('../constants/roles');

const router = express.Router();

router.use(authenticateToken, authorizeRole(ROLES.ADMIN));

router.get('/', propertyController.listProperties);
router.get('/:id', propertyController.getPropertyById);
router.post('/', propertyController.createProperty);
router.patch('/:id', propertyController.updateProperty);

module.exports = router;
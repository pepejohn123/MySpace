const express = require('express');

const authController = require('../controllers/auth.controller');
const userController = require('../controllers/user.controller');
const authenticateToken = require('../middlewares/authenticateToken');
const authorizeRole = require('../middlewares/authorizeRole');
const ROLES = require('../constants/roles');

const router = express.Router();

router.post('/login', authController.login);
router.post('/register', userController.registerUser);
router.get('/me', authenticateToken, authController.me);
router.get('/admin/test', authenticateToken, authorizeRole(ROLES.ADMIN), authController.adminTest);
router.get('/residente/test', authenticateToken, authorizeRole(ROLES.RESIDENTE), authController.residenteTest);

module.exports = router;
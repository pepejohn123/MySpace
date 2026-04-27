const express = require('express');

const noticeController = require('../controllers/notice.controller');
const authenticateToken = require('../middlewares/authenticateToken');
const authorizeRole = require('../middlewares/authorizeRole');
const ROLES = require('../constants/roles');

const router = express.Router();

router.use(authenticateToken);

router.get('/', authorizeRole(ROLES.ADMIN, ROLES.RESIDENTE), noticeController.listNotices);
router.get('/:id', authorizeRole(ROLES.ADMIN, ROLES.RESIDENTE), noticeController.getNoticeById);
router.post('/', authorizeRole(ROLES.ADMIN), noticeController.createNotice);
router.patch('/:id/status', authorizeRole(ROLES.ADMIN), noticeController.updateNoticeStatus);
router.delete('/:id', authorizeRole(ROLES.ADMIN), noticeController.deleteNotice);

module.exports = router;
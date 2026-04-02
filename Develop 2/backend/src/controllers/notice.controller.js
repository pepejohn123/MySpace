const noticeService = require('../services/notice.service');

function listNotices(req, res, next) {
  try {
    const notices = noticeService.listNotices(req.user);
    return res.json({ notices });
  } catch (error) {
    return next(error);
  }
}

function getNoticeById(req, res, next) {
  try {
    const notice = noticeService.getNoticeById(req.params.id, req.user);
    return res.json({ notice });
  } catch (error) {
    return next(error);
  }
}

function createNotice(req, res, next) {
  try {
    const notice = noticeService.createNotice(req.body, req.user);
    return res.status(201).json({ notice });
  } catch (error) {
    return next(error);
  }
}

function updateNoticeStatus(req, res, next) {
  try {
    const notice = noticeService.updateNoticeStatus(req.params.id, req.body, req.user);
    return res.json({ notice });
  } catch (error) {
    return next(error);
  }
}

function deleteNotice(req, res, next) {
  try {
    const notice = noticeService.deleteNotice(req.params.id, req.user);
    return res.json({ notice });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listNotices,
  getNoticeById,
  createNotice,
  updateNoticeStatus,
  deleteNotice
};
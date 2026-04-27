const visitService = require('../services/visit.service');

function listVisits(req, res, next) {
  try {
    const visits = visitService.listVisits(req.user);
    return res.json({ visits });
  } catch (error) {
    return next(error);
  }
}

function getVisitById(req, res, next) {
  try {
    const visit = visitService.getVisitById(req.params.id, req.user);
    return res.json({ visit });
  } catch (error) {
    return next(error);
  }
}

function createVisit(req, res, next) {
  try {
    const visit = visitService.createVisit(req.body, req.user);
    return res.status(201).json({ visit });
  } catch (error) {
    return next(error);
  }
}

function validateVisit(req, res, next) {
  try {
    const visit = visitService.validateVisit(req.params.accessCode, req.user);
    return res.json({ visit });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listVisits,
  getVisitById,
  createVisit,
  validateVisit
};
const propertyService = require('../services/property.service');

function listProperties(req, res, next) {
  try {
    const properties = propertyService.listProperties(req.query.condominioId);
    return res.json({ properties });
  } catch (error) {
    return next(error);
  }
}

function getPropertyById(req, res, next) {
  try {
    const property = propertyService.getPropertyById(req.params.id);
    return res.json({ property });
  } catch (error) {
    return next(error);
  }
}

function createProperty(req, res, next) {
  try {
    const property = propertyService.createProperty(req.body);
    return res.status(201).json({ property });
  } catch (error) {
    return next(error);
  }
}

function updateProperty(req, res, next) {
  try {
    const property = propertyService.updateProperty(req.params.id, req.body);
    return res.json({ property });
  } catch (error) {
    return next(error);
  }
}

function deleteProperty(req, res, next) {
  try {
    const property = propertyService.deleteProperty(req.params.id);
    return res.json({ property });
  } catch (error) {
    return next(error);
  }
}

function assignResident(req, res, next) {
  try {
    const property = propertyService.assignResident(req.params.id, req.body.residentId);
    return res.json({ property });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  assignResident
};
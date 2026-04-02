const amenityService = require('../services/amenity.service');

function listAmenities(req, res, next) {
  try {
    const amenities = amenityService.listAmenities(req.query.condominioId);
    return res.json({ amenities });
  } catch (error) {
    return next(error);
  }
}

function getAmenityById(req, res, next) {
  try {
    const amenity = amenityService.getAmenityById(req.params.id);
    return res.json({ amenity });
  } catch (error) {
    return next(error);
  }
}

function createAmenity(req, res, next) {
  try {
    const amenity = amenityService.createAmenity(req.body);
    return res.status(201).json({ amenity });
  } catch (error) {
    return next(error);
  }
}

function updateAmenity(req, res, next) {
  try {
    const amenity = amenityService.updateAmenity(req.params.id, req.body);
    return res.json({ amenity });
  } catch (error) {
    return next(error);
  }
}

function getAmenityAvailability(req, res, next) {
  try {
    const availability = amenityService.getAmenityAvailability(req.params.id, req.query.date);
    return res.json({ availability });
  } catch (error) {
    return next(error);
  }
}

function deleteAmenity(req, res, next) {
  try {
    const amenity = amenityService.deleteAmenity(req.params.id);
    return res.json({ amenity });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listAmenities,
  getAmenityById,
  createAmenity,
  updateAmenity,
  getAmenityAvailability,
  deleteAmenity
};
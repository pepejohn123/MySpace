const paymentService = require('../services/payment.service');

function listPayments(req, res, next) {
  try {
    const result = paymentService.listPayments(req.user);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
}

function getPaymentById(req, res, next) {
  try {
    const payment = paymentService.getPaymentById(req.params.id, req.user);
    return res.json({ payment });
  } catch (error) {
    return next(error);
  }
}

function createPayment(req, res, next) {
  try {
    const payment = paymentService.createPayment(req.body, req.user);
    return res.status(201).json({ payment });
  } catch (error) {
    return next(error);
  }
}

function updatePaymentStatus(req, res, next) {
  try {
    const payment = paymentService.updatePaymentStatus(req.params.id, req.body, req.user);
    return res.json({ payment });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listPayments,
  getPaymentById,
  createPayment,
  updatePaymentStatus
};
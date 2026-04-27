const ticketService = require('../services/ticket.service');

function listTickets(req, res, next) {
  try {
    const tickets = ticketService.listTickets(req.user);
    return res.json({ tickets });
  } catch (error) {
    return next(error);
  }
}

function getTicketById(req, res, next) {
  try {
    const ticket = ticketService.getTicketById(req.params.id, req.user);
    return res.json({ ticket });
  } catch (error) {
    return next(error);
  }
}

function createTicket(req, res, next) {
  try {
    const ticket = ticketService.createTicket(req.body, req.user);
    return res.status(201).json({ ticket });
  } catch (error) {
    return next(error);
  }
}

function updateTicketStatus(req, res, next) {
  try {
    const ticket = ticketService.updateTicketStatus(req.params.id, req.body, req.user);
    return res.json({ ticket });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listTickets,
  getTicketById,
  createTicket,
  updateTicketStatus
};
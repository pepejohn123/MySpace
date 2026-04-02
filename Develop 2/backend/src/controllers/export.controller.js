const exportService = require('../services/export.service');

async function exportWorkbook(res, filename, builder, currentUser, filters, next) {
  try {
    const buffer = await builder(currentUser, filters);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(buffer);
  } catch (error) {
    return next(error);
  }
}

function exportPayments(req, res, next) {
  return exportWorkbook(res, 'payments.xlsx', exportService.buildPaymentsWorkbook, req.user, req.query, next);
}

function exportTickets(req, res, next) {
  return exportWorkbook(res, 'tickets.xlsx', exportService.buildTicketsWorkbook, req.user, req.query, next);
}

function exportReservations(req, res, next) {
  return exportWorkbook(res, 'reservations.xlsx', exportService.buildReservationsWorkbook, req.user, req.query, next);
}

function exportVisits(req, res, next) {
  return exportWorkbook(res, 'visits.xlsx', exportService.buildVisitsWorkbook, req.user, req.query, next);
}

module.exports = {
  exportPayments,
  exportTickets,
  exportReservations,
  exportVisits
};
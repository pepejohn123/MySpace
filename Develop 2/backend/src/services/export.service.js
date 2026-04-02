const ExcelJS = require('exceljs');

const paymentRepository = require('../repositories/payment.repository');
const propertyRepository = require('../repositories/property.repository');
const reservationRepository = require('../repositories/reservation.repository');
const ticketRepository = require('../repositories/ticket.repository');
const visitRepository = require('../repositories/visit.repository');
const userRepository = require('../repositories/user.repository');

function createWorkbook(sheetName, columns, rows) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  worksheet.columns = columns;
  worksheet.addRows(rows);

  worksheet.getRow(1).font = { bold: true };
  worksheet.views = [{ state: 'frozen', ySplit: 1 }];

  return workbook.xlsx.writeBuffer();
}

function getResidentName(residentId) {
  return userRepository.findById(residentId)?.name || residentId || 'Sin residente';
}

function getPropertyName(propertyId) {
  return propertyRepository.findById(propertyId)?.name || propertyId || 'Sin propiedad';
}

function applyPaymentFilters(payments, filters = {}) {
  return payments.filter((payment) => {
    const matchesProperty = !filters.property || payment.propertyId === filters.property;
    const matchesResident = !filters.resident || payment.residentId === filters.resident;
    const matchesStatus = !filters.status || payment.status === filters.status;
    const matchesSearch = !filters.search || payment.concept.toLowerCase().includes(String(filters.search).toLowerCase());
    return matchesProperty && matchesResident && matchesStatus && matchesSearch;
  });
}

function applyTicketFilters(tickets, filters = {}) {
  const now = new Date();

  return tickets.filter((ticket) => {
    const matchesStatus = !filters.status || ticket.status === filters.status;
    const matchesPriority = !filters.priority || ticket.priority === filters.priority;
    const matchesSearch = !filters.search || `${ticket.title} ${ticket.description}`.toLowerCase().includes(String(filters.search).toLowerCase());

    let matchesPeriod = true;
    if (filters.period === '7d') {
      matchesPeriod = ((now - new Date(ticket.createdAt || 0)) / (1000 * 60 * 60 * 24)) <= 7;
    }

    if (filters.period === '30d') {
      matchesPeriod = ((now - new Date(ticket.createdAt || 0)) / (1000 * 60 * 60 * 24)) <= 30;
    }

    if (filters.period === 'recent_closed') {
      if (!ticket.closedAt) {
        matchesPeriod = false;
      } else {
        matchesPeriod = ((now - new Date(ticket.closedAt)) / (1000 * 60 * 60 * 24)) <= 7;
      }
    }

    return matchesStatus && matchesPriority && matchesSearch && matchesPeriod;
  });
}

function applyVisitFilters(visits, filters = {}) {
  return visits.filter((visit) => {
    const matchesStatus = !filters.status || visit.status === filters.status;
    const matchesSearch = !filters.search || `${visit.visitorName} ${visit.accessCode}`.toLowerCase().includes(String(filters.search).toLowerCase());
    return matchesStatus && matchesSearch;
  });
}

async function buildPaymentsWorkbook(currentUser, filters = {}) {
  const payments = applyPaymentFilters(paymentRepository.findByCondominioId(currentUser.condominioId), filters);
  const rows = payments.map((payment) => ({
    id: payment.id,
    property: getPropertyName(payment.propertyId),
    resident: getResidentName(payment.residentId),
    concept: payment.concept,
    amount: payment.amount,
    status: payment.status,
    paymentDate: payment.paymentDate || '',
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt
  }));

  return createWorkbook('Pagos', [
    { header: 'ID', key: 'id', width: 22 },
    { header: 'Propiedad', key: 'property', width: 24 },
    { header: 'Residente', key: 'resident', width: 24 },
    { header: 'Concepto', key: 'concept', width: 34 },
    { header: 'Monto', key: 'amount', width: 14 },
    { header: 'Estado', key: 'status', width: 16 },
    { header: 'Fecha de pago', key: 'paymentDate', width: 18 },
    { header: 'Creado', key: 'createdAt', width: 24 },
    { header: 'Actualizado', key: 'updatedAt', width: 24 }
  ], rows);
}

async function buildTicketsWorkbook(currentUser, filters = {}) {
  const tickets = applyTicketFilters(ticketRepository.findByCondominioId(currentUser.condominioId), filters);
  const rows = tickets.map((ticket) => ({
    id: ticket.id,
    title: ticket.title,
    description: ticket.description,
    priority: ticket.priority,
    status: ticket.status,
    property: getPropertyName(ticket.propertyId),
    resident: getResidentName(ticket.residentId),
    createdAt: ticket.createdAt,
    closedAt: ticket.closedAt || ''
  }));

  return createWorkbook('Tickets', [
    { header: 'ID', key: 'id', width: 22 },
    { header: 'Título', key: 'title', width: 28 },
    { header: 'Descripción', key: 'description', width: 40 },
    { header: 'Prioridad', key: 'priority', width: 14 },
    { header: 'Estado', key: 'status', width: 16 },
    { header: 'Propiedad', key: 'property', width: 24 },
    { header: 'Residente', key: 'resident', width: 24 },
    { header: 'Creado', key: 'createdAt', width: 24 },
    { header: 'Cerrado', key: 'closedAt', width: 24 }
  ], rows);
}

async function buildReservationsWorkbook(currentUser, filters = {}) {
  const reservations = reservationRepository.findByCondominioId(currentUser.condominioId);
  const rows = reservations.map((reservation) => ({
    id: reservation.id,
    amenity: reservation.amenityName,
    reservationDate: reservation.reservationDate,
    timeSlot: reservation.timeSlot,
    status: reservation.status,
    resident: getResidentName(reservation.residentId),
    property: getPropertyName(reservation.propertyId),
    createdAt: reservation.createdAt
  }));

  return createWorkbook('Reservas', [
    { header: 'ID', key: 'id', width: 22 },
    { header: 'Amenidad', key: 'amenity', width: 26 },
    { header: 'Fecha', key: 'reservationDate', width: 16 },
    { header: 'Horario', key: 'timeSlot', width: 18 },
    { header: 'Estado', key: 'status', width: 16 },
    { header: 'Residente', key: 'resident', width: 24 },
    { header: 'Propiedad', key: 'property', width: 24 },
    { header: 'Creado', key: 'createdAt', width: 24 }
  ], rows);
}

async function buildVisitsWorkbook(currentUser, filters = {}) {
  const visits = applyVisitFilters(visitRepository.findByCondominioId(currentUser.condominioId), filters);
  const rows = visits.map((visit) => ({
    id: visit.id,
    visitorName: visit.visitorName,
    visitDate: visit.visitDate,
    accessCode: visit.accessCode,
    status: visit.status,
    resident: getResidentName(visit.residentId),
    property: getPropertyName(visit.propertyId),
    validatedAt: visit.validatedAt || '',
    createdAt: visit.createdAt
  }));

  return createWorkbook('Visitas', [
    { header: 'ID', key: 'id', width: 22 },
    { header: 'Visitante', key: 'visitorName', width: 24 },
    { header: 'Fecha de visita', key: 'visitDate', width: 18 },
    { header: 'Código de acceso', key: 'accessCode', width: 22 },
    { header: 'Estado', key: 'status', width: 16 },
    { header: 'Residente', key: 'resident', width: 24 },
    { header: 'Propiedad', key: 'property', width: 24 },
    { header: 'Validado en', key: 'validatedAt', width: 24 },
    { header: 'Creado', key: 'createdAt', width: 24 }
  ], rows);
}

module.exports = {
  buildPaymentsWorkbook,
  buildTicketsWorkbook,
  buildReservationsWorkbook,
  buildVisitsWorkbook
};
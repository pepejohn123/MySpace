const ticketRepository = require('../repositories/ticket.repository');
const userRepository = require('../repositories/user.repository');
const createHttpError = require('../utils/httpError');
const ROLES = require('../constants/roles');

const ALLOWED_STATUSES = ['pendiente', 'en_proceso', 'cerrado'];
const ALLOWED_PRIORITIES = ['baja', 'media', 'alta'];

function buildTicketId() {
  return `TICKET#${Date.now()}`;
}

function normalizeTicketId(id) {
  return decodeURIComponent(String(id));
}

function ensureResidentUser(residentId) {
  const resident = userRepository.findById(residentId);

  if (!resident || resident.role !== ROLES.RESIDENTE) {
    throw createHttpError(400, 'residentId no corresponde a un residente válido');
  }

  return resident;
}

function listTickets(currentUser) {
  if (currentUser.role === ROLES.ADMIN) {
    return ticketRepository.findByCondominioId(currentUser.condominioId);
  }

  if (currentUser.role === ROLES.RESIDENTE) {
    return ticketRepository.findByResidentId(currentUser.sub);
  }

  throw createHttpError(403, 'No tienes permisos para consultar tickets');
}

function getTicketById(id, currentUser) {
  const ticket = ticketRepository.findById(normalizeTicketId(id));

  if (!ticket) {
    throw createHttpError(404, 'Ticket no encontrado');
  }

  if (currentUser.role === ROLES.ADMIN && ticket.condominioId === currentUser.condominioId) {
    return ticket;
  }

  if (currentUser.role === ROLES.RESIDENTE && ticket.residentId === currentUser.sub) {
    return ticket;
  }

  throw createHttpError(403, 'No tienes permisos para consultar este ticket');
}

function createTicket(payload, currentUser) {
  if (currentUser.role !== ROLES.RESIDENTE) {
    throw createHttpError(403, 'Solo un residente puede crear tickets');
  }

  const title = String(payload.title || '').trim();
  const description = String(payload.description || '').trim();
  const priority = payload.priority || 'media';

  if (!title || !description) {
    throw createHttpError(400, 'title y description son requeridos');
  }

  if (!ALLOWED_PRIORITIES.includes(priority)) {
    throw createHttpError(400, 'priority inválida');
  }

  const resident = ensureResidentUser(currentUser.sub);
  const now = new Date().toISOString();

  const ticket = {
    id: buildTicketId(),
    condominioId: resident.condominioId,
    residentId: resident.id,
    propertyId: resident.propertyId || null,
    title,
    description,
    status: 'pendiente',
    priority,
    closedAt: null,
    createdAt: now,
    updatedAt: now
  };

  return ticketRepository.create(ticket);
}

function updateTicketStatus(id, payload, currentUser) {
  if (currentUser.role !== ROLES.ADMIN) {
    throw createHttpError(403, 'Solo un administrador puede actualizar el estado del ticket');
  }

  const ticket = ticketRepository.findById(normalizeTicketId(id));

  if (!ticket) {
    throw createHttpError(404, 'Ticket no encontrado');
  }

  if (ticket.condominioId !== currentUser.condominioId) {
    throw createHttpError(403, 'No tienes permisos para actualizar este ticket');
  }

  const status = payload.status;

  if (!ALLOWED_STATUSES.includes(status)) {
    throw createHttpError(400, 'status inválido');
  }

  const now = new Date().toISOString();

  return ticketRepository.update(ticket.id, {
    status,
    closedAt: status === 'cerrado' ? now : null,
    updatedAt: now
  });
}

module.exports = {
  listTickets,
  getTicketById,
  createTicket,
  updateTicketStatus
};
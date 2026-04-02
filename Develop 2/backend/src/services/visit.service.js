const visitRepository = require('../repositories/visit.repository');
const userRepository = require('../repositories/user.repository');
const createHttpError = require('../utils/httpError');
const ROLES = require('../constants/roles');

function buildVisitId() {
  return `VISIT#${Date.now()}`;
}

function buildAccessCode() {
  return `ACCESS-${Date.now()}`;
}

function normalizeVisitId(id) {
  return decodeURIComponent(String(id));
}

function ensureResidentUser(residentId) {
  const resident = userRepository.findById(residentId);

  if (!resident || resident.role !== ROLES.RESIDENTE) {
    throw createHttpError(400, 'residentId no corresponde a un residente válido');
  }

  return resident;
}

function listVisits(currentUser) {
  if (currentUser.role === ROLES.RESIDENTE) {
    return visitRepository.findByResidentId(currentUser.sub);
  }

  if (currentUser.role === ROLES.ADMIN || currentUser.role === ROLES.GUARDIA) {
    return visitRepository.findByCondominioId(currentUser.condominioId);
  }

  throw createHttpError(403, 'No tienes permisos para consultar visitas');
}

function getVisitById(id, currentUser) {
  const visit = visitRepository.findById(normalizeVisitId(id));

  if (!visit) {
    throw createHttpError(404, 'Visita no encontrada');
  }

  if (currentUser.role === ROLES.RESIDENTE && visit.residentId === currentUser.sub) {
    return visit;
  }

  if (
    (currentUser.role === ROLES.ADMIN || currentUser.role === ROLES.GUARDIA) &&
    visit.condominioId === currentUser.condominioId
  ) {
    return visit;
  }

  throw createHttpError(403, 'No tienes permisos para consultar esta visita');
}

function createVisit(payload, currentUser) {
  if (currentUser.role !== ROLES.RESIDENTE) {
    throw createHttpError(403, 'Solo un residente puede crear pases de visita');
  }

  const visitorName = String(payload.visitorName || '').trim();
  const visitDate = String(payload.visitDate || '').trim();

  if (!visitorName || !visitDate) {
    throw createHttpError(400, 'visitorName y visitDate son requeridos');
  }

  const resident = ensureResidentUser(currentUser.sub);
  const now = new Date().toISOString();

  const visit = {
    id: buildVisitId(),
    condominioId: resident.condominioId,
    residentId: resident.id,
    propertyId: resident.propertyId || null,
    visitorName,
    visitDate,
    accessCode: buildAccessCode(),
    status: 'pendiente',
    validatedAt: null,
    createdAt: now,
    updatedAt: now
  };

  return visitRepository.create(visit);
}

function validateVisit(accessCode, currentUser) {
  if (![ROLES.ADMIN, ROLES.GUARDIA].includes(currentUser.role)) {
    throw createHttpError(403, 'Solo admin o guardia pueden validar accesos');
  }

  const visit = visitRepository.findByAccessCode(String(accessCode).trim());

  if (!visit) {
    throw createHttpError(404, 'Código de acceso no encontrado');
  }

  if (visit.condominioId !== currentUser.condominioId) {
    throw createHttpError(403, 'No tienes permisos para validar esta visita');
  }

  const today = new Date().toISOString().slice(0, 10);

  if (visit.visitDate < today) {
    return visitRepository.update(visit.id, {
      status: 'expirada',
      updatedAt: new Date().toISOString()
    });
  }

  return visitRepository.update(visit.id, {
    status: 'validada',
    validatedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
}

module.exports = {
  listVisits,
  getVisitById,
  createVisit,
  validateVisit
};
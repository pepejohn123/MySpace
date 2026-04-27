const paymentRepository = require('../repositories/payment.repository');
const propertyRepository = require('../repositories/property.repository');
const userRepository = require('../repositories/user.repository');
const createHttpError = require('../utils/httpError');
const ROLES = require('../constants/roles');

const ALLOWED_STATUSES = ['pendiente', 'en_revision', 'pagado', 'rechazado'];

function buildPaymentId() {
  return `PAYMENT#${Date.now()}`;
}

function normalizePaymentId(id) {
  return decodeURIComponent(String(id));
}

function ensureResidentUser(residentId) {
  const resident = userRepository.findById(residentId);

  if (!resident || resident.role !== ROLES.RESIDENTE) {
    throw createHttpError(400, 'residentId no corresponde a un residente válido');
  }

  return resident;
}

function calculateSummary(payments) {
  return payments.reduce(
    (summary, payment) => {
      summary.total += payment.amount;

      if (payment.status === 'pagado') {
        summary.pagado += payment.amount;
      }

      if (payment.status === 'en_revision') {
        summary.enRevision += payment.amount;
      }

      if (payment.status === 'pendiente' || payment.status === 'rechazado') {
        summary.porCobrar += payment.amount;
      }

      return summary;
    },
    {
      total: 0,
      pagado: 0,
      enRevision: 0,
      porCobrar: 0
    }
  );
}

function enrichPayment(payment) {
  const resident = payment.residentId ? userRepository.findById(payment.residentId) : null;
  const property = payment.propertyId ? propertyRepository.findById(payment.propertyId) : null;

  return {
    ...payment,
    residentName: resident?.name || payment.residentId || 'Sin residente asignado',
    propertyName: property?.name || payment.propertyId || 'Sin propiedad asignada'
  };
}

function listPayments(currentUser) {
  if (currentUser.role === ROLES.ADMIN) {
    const payments = paymentRepository.findByCondominioId(currentUser.condominioId).map(enrichPayment);
    return {
      payments,
      summary: calculateSummary(payments)
    };
  }

  if (currentUser.role === ROLES.RESIDENTE) {
    const payments = paymentRepository.findByResidentId(currentUser.sub).map(enrichPayment);
    return {
      payments,
      summary: calculateSummary(payments)
    };
  }

  throw createHttpError(403, 'No tienes permisos para consultar pagos');
}

function getPaymentById(id, currentUser) {
  const payment = paymentRepository.findById(normalizePaymentId(id));

  if (!payment) {
    throw createHttpError(404, 'Pago no encontrado');
  }

  if (currentUser.role === ROLES.ADMIN && payment.condominioId === currentUser.condominioId) {
      return enrichPayment(payment);
  }

  if (currentUser.role === ROLES.RESIDENTE && payment.residentId === currentUser.sub) {
      return enrichPayment(payment);
  }

  throw createHttpError(403, 'No tienes permisos para consultar este pago');
}

function createPayment(payload, currentUser) {
  if (currentUser.role !== ROLES.RESIDENTE) {
    throw createHttpError(403, 'Solo un residente puede registrar pagos');
  }

  const concept = String(payload.concept || '').trim();
  const amount = Number(payload.amount);
  const receiptUrl = payload.receiptUrl || null;
  const paymentDate = payload.paymentDate || new Date().toISOString().slice(0, 10);

  if (!concept || !Number.isFinite(amount) || amount <= 0) {
    throw createHttpError(400, 'concept y amount válidos son requeridos');
  }

  const resident = ensureResidentUser(currentUser.sub);
  const now = new Date().toISOString();

  const payment = {
    id: buildPaymentId(),
    condominioId: resident.condominioId,
    residentId: resident.id,
    propertyId: resident.propertyId || null,
    concept,
    amount,
    status: 'en_revision',
    paymentDate,
    receiptUrl,
    createdAt: now,
    updatedAt: now
  };

  return paymentRepository.create(payment);
}

function updatePaymentStatus(id, payload, currentUser) {
  if (currentUser.role !== ROLES.ADMIN) {
    throw createHttpError(403, 'Solo un administrador puede actualizar el estado del pago');
  }

  const payment = paymentRepository.findById(normalizePaymentId(id));

  if (!payment) {
    throw createHttpError(404, 'Pago no encontrado');
  }

  if (payment.condominioId !== currentUser.condominioId) {
    throw createHttpError(403, 'No tienes permisos para actualizar este pago');
  }

  const status = payload.status;

  if (!ALLOWED_STATUSES.includes(status)) {
    throw createHttpError(400, 'status inválido');
  }

  return paymentRepository.update(payment.id, {
    status,
    updatedAt: new Date().toISOString()
  });
}

module.exports = {
  listPayments,
  getPaymentById,
  createPayment,
  updatePaymentStatus
};
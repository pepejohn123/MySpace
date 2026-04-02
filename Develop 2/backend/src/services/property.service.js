const propertyRepository = require('../repositories/property.repository');
const createHttpError = require('../utils/httpError');

function buildPropertyId(name) {
  return `PROPERTY#${String(name).toUpperCase().replace(/[^A-Z0-9]+/g, '')}`;
}

function normalizePropertyId(id) {
  return decodeURIComponent(String(id));
}

function normalizePropertyPayload(payload, { isUpdate = false } = {}) {
  const normalized = {
    condominioId: payload.condominioId,
    type: payload.type,
    name: payload.name,
    residentId: payload.residentId ?? null,
    status: payload.status || 'ok'
  };

  if (isUpdate) {
    return Object.fromEntries(
      Object.entries(normalized).filter(([, value]) => value !== undefined)
    );
  }

  if (!normalized.condominioId || !normalized.type || !normalized.name) {
    throw createHttpError(400, 'condominioId, type y name son requeridos');
  }

  return normalized;
}

function listProperties(condominioId) {
  if (condominioId) {
    return propertyRepository.findByCondominioId(condominioId);
  }

  return propertyRepository.findAll();
}

function getPropertyById(id) {
  const property = propertyRepository.findById(normalizePropertyId(id));

  if (!property) {
    throw createHttpError(404, 'Propiedad no encontrada');
  }

  return property;
}

function createProperty(payload) {
  const normalized = normalizePropertyPayload(payload);
  const now = new Date().toISOString();

  const property = {
    id: buildPropertyId(normalized.name),
    ...normalized,
    createdAt: now,
    updatedAt: now
  };

  if (propertyRepository.findById(property.id)) {
    throw createHttpError(409, 'Ya existe una propiedad con ese identificador');
  }

  return propertyRepository.create(property);
}

function updateProperty(id, payload) {
  const normalizedId = normalizePropertyId(id);
  const existingProperty = propertyRepository.findById(normalizedId);

  if (!existingProperty) {
    throw createHttpError(404, 'Propiedad no encontrada');
  }

  const normalized = normalizePropertyPayload(payload, { isUpdate: true });

  if (!Object.keys(normalized).length) {
    throw createHttpError(400, 'No se enviaron campos válidos para actualizar');
  }

  return propertyRepository.update(normalizedId, {
    ...normalized,
    updatedAt: new Date().toISOString()
  });
}

module.exports = {
  listProperties,
  getPropertyById,
  createProperty,
  updateProperty
};
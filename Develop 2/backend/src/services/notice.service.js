const noticeRepository = require('../repositories/notice.repository');
const createHttpError = require('../utils/httpError');
const ROLES = require('../constants/roles');

function buildNoticeId() {
  return `NOTICE#${Date.now()}`;
}

function normalizeNoticeId(id) {
  return decodeURIComponent(String(id));
}

function listNotices(currentUser) {
  if (![ROLES.ADMIN, ROLES.RESIDENTE].includes(currentUser.role)) {
    throw createHttpError(403, 'No tienes permisos para consultar avisos');
  }

  return noticeRepository.findByCondominioId(currentUser.condominioId).filter((notice) => notice.status !== 'archivado' || currentUser.role === ROLES.ADMIN);
}

function getNoticeById(id, currentUser) {
  const notice = noticeRepository.findById(normalizeNoticeId(id));

  if (!notice) {
    throw createHttpError(404, 'Aviso no encontrado');
  }

  if (notice.condominioId !== currentUser.condominioId) {
    throw createHttpError(403, 'No tienes permisos para consultar este aviso');
  }

  return notice;
}

function createNotice(payload, currentUser) {
  if (currentUser.role !== ROLES.ADMIN) {
    throw createHttpError(403, 'Solo un administrador puede publicar avisos');
  }

  const title = String(payload.title || '').trim();
  const message = String(payload.message || '').trim();
  const audience = String(payload.audience || 'general').trim();

  if (!title || !message) {
    throw createHttpError(400, 'title y message son requeridos');
  }

  const now = new Date().toISOString();

  const notice = {
    id: buildNoticeId(),
    condominioId: currentUser.condominioId,
    authorId: currentUser.sub,
    title,
    message,
    audience,
    status: 'activo',
    createdAt: now,
    updatedAt: now
  };

  return noticeRepository.create(notice);
}

function updateNoticeStatus(id, payload, currentUser) {
  if (currentUser.role !== ROLES.ADMIN) {
    throw createHttpError(403, 'Solo un administrador puede actualizar avisos');
  }

  const notice = noticeRepository.findById(normalizeNoticeId(id));

  if (!notice) {
    throw createHttpError(404, 'Aviso no encontrado');
  }

  if (notice.condominioId !== currentUser.condominioId) {
    throw createHttpError(403, 'No tienes permisos para actualizar este aviso');
  }

  const status = String(payload.status || '').trim();

  if (!['activo', 'archivado'].includes(status)) {
    throw createHttpError(400, 'status inválido');
  }

  return noticeRepository.update(notice.id, {
    status,
    updatedAt: new Date().toISOString()
  });
}

function deleteNotice(id, currentUser) {
  if (currentUser.role !== ROLES.ADMIN) {
    throw createHttpError(403, 'Solo un administrador puede eliminar avisos');
  }

  const notice = noticeRepository.findById(normalizeNoticeId(id));

  if (!notice) {
    throw createHttpError(404, 'Aviso no encontrado');
  }

  if (notice.condominioId !== currentUser.condominioId) {
    throw createHttpError(403, 'No tienes permisos para eliminar este aviso');
  }

  return noticeRepository.remove(notice.id);
}

module.exports = {
  listNotices,
  getNoticeById,
  createNotice,
  updateNoticeStatus,
  deleteNotice
};
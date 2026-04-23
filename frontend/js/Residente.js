const DEFAULT_DEPT_IMAGE = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80';

function buildTicketColor(status) {
  const colorMap = {
    pendiente: '#F59E0B',
    en_proceso: '#4F46E5',
    cerrado: '#00C853'
  };

  return colorMap[status] || '#6B7280';
}

function buildPaymentColor(status) {
  const colorMap = {
    pagado: '#00C853',
    en_revision: '#4F46E5',
    pendiente: '#F59E0B',
    rechazado: '#DC2626'
  };

  return colorMap[status] || '#6B7280';
}

function buildReservationColor(status) {
  const colorMap = {
    pendiente: '#F59E0B',
    aprobada: '#00C853',
    rechazada: '#DC2626'
  };

  return colorMap[status] || '#6B7280';
}

function buildVisitColor(status) {
  const colorMap = {
    pendiente: '#F59E0B',
    validada: '#00C853',
    expirada: '#DC2626'
  };

  return colorMap[status] || '#6B7280';
}

function buildResidentViewModel(user) {
  const propertyId = user.propertyId || 'SIN-ASIGNAR';
  const propertyLabel = propertyId.replace('PROPERTY#', '').replace(/([A-Z])([0-9])/g, '$1 $2');

  return {
    nombre: user.name || 'Residente',
    departamento: propertyLabel,
    imagen: DEFAULT_DEPT_IMAGE,
    estado_pago: 'Pendiente de sincronizar',
    caracteristicas: [
      { icono: 'fa-solid fa-house', texto: 'Propiedad activa' },
      { icono: 'fa-solid fa-id-card', texto: user.role || 'residente' },
      { icono: 'fa-solid fa-building', texto: user.condominioId || 'Sin condominio' },
      { icono: 'fa-solid fa-key', texto: propertyId }
    ],
    servicios: [
      'Mantenimiento de Áreas Comunes',
      'Recolección de Basura',
      'Seguridad 24/7',
      'Acceso digital MySpace'
    ],
    movimientos: []
  };
}

function mapTicketsToMovimientos(tickets) {
  return tickets.map((ticket) => ({
    tipo: 'Ticket',
    titulo: ticket.title,
    fecha: ticket.id,
    estado: ticket.status,
    color: buildTicketColor(ticket.status)
  }));
}

function mapPaymentsToMovimientos(payments) {
  return payments.map((payment) => ({
    tipo: 'Pago',
    titulo: payment.concept,
    fecha: payment.paymentDate || payment.id,
    estado: `$${payment.amount} • ${payment.status}`,
    color: buildPaymentColor(payment.status)
  }));
}

function mapPaymentToResidentCard(payment) {
  return {
    concepto: payment.concept,
    fecha: payment.paymentDate || payment.createdAt || 'Sin fecha',
    monto: payment.amount,
    estado: payment.status,
    color: buildPaymentColor(payment.status)
  };
}

function mapReservationsToMovimientos(reservations) {
  return reservations.map((reservation) => ({
    tipo: 'Reserva',
    titulo: reservation.amenityName,
    fecha: `${reservation.reservationDate} • ${reservation.timeSlot}`,
    estado: reservation.status,
    color: buildReservationColor(reservation.status)
  }));
}

function mapVisitsToMovimientos(visits) {
  return visits.map((visit) => ({
    tipo: 'Visita',
    titulo: `Visita: ${visit.visitorName}`,
    fecha: `${visit.visitDate} • ${visit.accessCode}`,
    estado: visit.status,
    color: buildVisitColor(visit.status)
  }));
}

function mapVisitToResidentCard(visit) {
  return {
    visitorName: visit.visitorName,
    visitDate: visit.visitDate,
    accessCode: visit.accessCode,
    status: visit.status,
    color: buildVisitColor(visit.status)
  };
}

function mapNoticeToCard(notice) {
  return {
    titulo: notice.title,
    mensaje: notice.message,
    audiencia: notice.audience,
    fecha: notice.createdAt || ''
  };
}

function getConversationStatusClass(status) {
  return `conversation-status-${status || 'abierta'}`;
}

async function cargarConversacionesDesdeApi() {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}/api/conversations`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'No se pudieron cargar las conversaciones');
  }

  const data = await response.json();
  return data.conversations || [];
}

async function crearConversacion(payload) {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}/api/conversations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'No se pudo crear la conversación');
  }

  const data = await response.json();
  return data.conversation;
}

async function cargarDetalleConversacion(conversationId) {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}/api/conversations/${encodeURIComponent(conversationId)}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'No se pudo cargar la conversación');
  }

  const data = await response.json();
  return data.conversation;
}

async function responderConversacion(conversationId, payload) {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}/api/conversations/${encodeURIComponent(conversationId)}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'No se pudo responder la conversación');
  }

  const data = await response.json();
  return data.conversation;
}

function renderResidentConversations(conversations) {
  const container = document.getElementById('resident-conversations-list');

  if (!container) {
    return;
  }

  container.innerHTML = '';

  if (!conversations.length) {
    container.innerHTML = '<div class="resident-empty-state">Todavía no has enviado consultas a administración.</div>';
    return;
  }

  conversations.forEach((conversation) => {
    const lastMessage = conversation.messages?.[conversation.messages.length - 1];

    container.innerHTML += `
      <button class="resident-conversation-card" onclick="openConversationDetail('${conversation.id}')">
        <div class="resident-conversation-header">
          <div>
            <h4 class="resident-conversation-subject">${conversation.subject}</h4>
            <div class="resident-conversation-meta">Actualizado: ${conversation.updatedAt || conversation.createdAt}</div>
          </div>
          <span class="conversation-status-badge ${getConversationStatusClass(conversation.status)}">${conversation.status}</span>
        </div>
        <p class="resident-conversation-preview">${lastMessage?.body || 'Sin mensajes'}</p>
      </button>
    `;
  });
}

function renderConversationDetail(conversation) {
  const title = document.getElementById('conversation-detail-title');
  const status = document.getElementById('conversation-detail-status');
  const messages = document.getElementById('conversation-detail-messages');
  const replyInput = document.getElementById('conversationReplyInput');
  const replyForm = document.getElementById('conversation-reply-form');

  window.__residentConversationDetail = conversation;

  if (title) {
    title.textContent = conversation.subject;
  }

  if (status) {
    status.innerHTML = `<span class="conversation-status-badge ${getConversationStatusClass(conversation.status)}">${conversation.status}</span>`;
  }

  if (messages) {
    messages.innerHTML = '';
    conversation.messages.forEach((message) => {
      const isMine = message.senderRole === 'residente';
      messages.innerHTML += `
        <div class="conversation-message ${isMine ? 'mine' : ''}">
          <div class="conversation-message-header">
            <strong>${message.senderName}</strong>
            <span>${message.createdAt}</span>
          </div>
          <p class="conversation-message-body">${message.body}</p>
        </div>
      `;
    });
  }

  if (replyInput) {
    replyInput.value = '';
  }

  if (replyForm) {
    replyForm.style.display = conversation.status === 'cerrada' ? 'none' : 'flex';
  }
}

async function refrescarConversacionesResidente() {
  try {
    const conversations = await cargarConversacionesDesdeApi();
    renderResidentConversations(conversations);
  } catch (error) {
    const container = document.getElementById('resident-conversations-list');
    if (container) {
      container.innerHTML = `<div class="resident-error-state">${error.message}</div>`;
    }
  }
}

async function openConversationDetail(conversationId) {
  try {
    const conversation = await cargarDetalleConversacion(conversationId);
    renderConversationDetail(conversation);
    document.getElementById('conversation-detail-modal').style.display = 'flex';
  } catch (error) {
    showFeedback(error.message, 'error');
  }
}

function closeConversationDetail(event, overlay) {
  if (event.target === overlay) {
    closeConversationDetailModal();
  }
}

function closeConversationDetailModal() {
  const modal = document.getElementById('conversation-detail-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

async function cargarTicketsDesdeApi() {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}/api/tickets`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'No se pudieron cargar los tickets');
  }

  const data = await response.json();
  return data.tickets || [];
}

async function crearTicket(payload) {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}/api/tickets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'No se pudo crear el ticket');
  }

  const data = await response.json();
  return data.ticket;
}

async function cargarPagosDesdeApi() {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}/api/payments`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'No se pudieron cargar los pagos');
  }

  return response.json();
}

async function crearPago(payload) {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}/api/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'No se pudo registrar el pago');
  }

  const data = await response.json();
  return data.payment;
}

async function cargarReservasDesdeApi() {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}/api/reservations`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'No se pudieron cargar las reservas');
  }

  const data = await response.json();
  return data.reservations || [];
}

async function cargarAmenidadesDesdeApi() {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}/api/amenities`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'No se pudieron cargar las amenidades');
  }

  const data = await response.json();
  return data.amenities || [];
}

async function crearReserva(payload) {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}/api/reservations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'No se pudo crear la reserva');
  }

  const data = await response.json();
  return data.reservation;
}

function resetReservationAvailabilityState(message = '') {
  const timeSlotSelect = document.getElementById('reservationTimeSlot');
  const slotsFeedback = document.getElementById('reservation-slots-feedback');

  if (timeSlotSelect) {
    timeSlotSelect.innerHTML = '<option value="">Selecciona un horario</option>';
    timeSlotSelect.disabled = true;
  }

  if (slotsFeedback) {
    slotsFeedback.textContent = message;
    slotsFeedback.className = 'modal-feedback';
  }
}

function setReservationAvailabilityLoadingState(message) {
  const timeSlotSelect = document.getElementById('reservationTimeSlot');
  const slotsFeedback = document.getElementById('reservation-slots-feedback');

  if (timeSlotSelect) {
    timeSlotSelect.innerHTML = '<option value="">Consultando horarios...</option>';
    timeSlotSelect.disabled = true;
  }

  if (slotsFeedback) {
    slotsFeedback.textContent = message;
    slotsFeedback.className = 'modal-feedback';
  }
}

async function cargarDisponibilidadAmenidad(amenityId, date) {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}/api/amenities/${encodeURIComponent(amenityId)}/availability?date=${encodeURIComponent(date)}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'No se pudo cargar la disponibilidad');
  }

  const data = await response.json();
  return data.availability;
}

async function cargarVisitasDesdeApi() {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}/api/visits`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'No se pudieron cargar las visitas');
  }

  const data = await response.json();
  return data.visits || [];
}

async function crearVisita(payload) {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}/api/visits`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'No se pudo crear el pase de visita');
  }

  const data = await response.json();
  return data.visit;
}

async function cargarAvisosDesdeApi() {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}/api/notices`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'No se pudieron cargar los avisos');
  }

  const data = await response.json();
  return (data.notices || []).filter((notice) => (notice.status || 'activo') === 'activo');
}

function cargarAvisos(notices) {
  const noticesContainer = document.getElementById('notices-list');

  if (!noticesContainer) {
    return;
  }

  noticesContainer.innerHTML = '';

  if (!notices.length) {
    noticesContainer.innerHTML = '<div class="resident-empty-state">No hay avisos nuevos del condominio.</div>';
    return;
  }

  notices.map(mapNoticeToCard).forEach((notice) => {
    noticesContainer.innerHTML += `
      <div class="activity-item">
        <div>
          <b>${notice.titulo}</b>
          <br>
          <small class="notice-meta">${notice.mensaje}</small>
          <br>
          <small class="notice-meta">Audiencia: ${notice.audiencia}</small>
        </div>
      </div>
    `;
  });
}

function actualizarEstadoPagoVisual(summary) {
  const paymentStatus = document.getElementById('payment-status');

  if (!paymentStatus) {
    return;
  }

  if (summary.porCobrar > 0) {
    paymentStatus.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Pago pendiente';
    return;
  }

  if (summary.enRevision > 0) {
    paymentStatus.innerHTML = '<i class="fa-solid fa-hourglass-half"></i> Pago en revisión';
    return;
  }

  paymentStatus.innerHTML = '<i class="fa-solid fa-circle-check"></i> Al corriente';
}

function renderResidentFinanceSummary(summary) {
  const container = document.getElementById('resident-finance-summary');

  if (!container) {
    return;
  }

  container.innerHTML = `
    <div class="resident-finance-card accent-neutral">
      <span class="resident-finance-label">Total registrado</span>
      <strong class="resident-finance-amount">$${summary.total || 0}</strong>
      <p class="resident-finance-copy">Suma acumulada de tus pagos registrados.</p>
    </div>
    <div class="resident-finance-card accent-success">
      <span class="resident-finance-label">Pagado</span>
      <strong class="resident-finance-amount success">$${summary.pagado || 0}</strong>
      <p class="resident-finance-copy">Pagos ya validados por administración.</p>
    </div>
    <div class="resident-finance-card accent-review">
      <span class="resident-finance-label">En revisión</span>
      <strong class="resident-finance-amount review">$${summary.enRevision || 0}</strong>
      <p class="resident-finance-copy">Pagos enviados pendientes de validación.</p>
    </div>
    <div class="resident-finance-card accent-danger">
      <span class="resident-finance-label">Por cobrar</span>
      <strong class="resident-finance-amount danger">$${summary.porCobrar || 0}</strong>
      <p class="resident-finance-copy">Montos pendientes o con estatus rechazado.</p>
    </div>
  `;
}

function renderResidentPayments(payments) {
  const container = document.getElementById('resident-payments-list');

  if (!container) {
    return;
  }

  container.innerHTML = '';

  if (!payments.length) {
    container.innerHTML = '<div class="resident-empty-state">Todavía no tienes pagos registrados.</div>';
    return;
  }

  payments.map(mapPaymentToResidentCard).forEach((payment) => {
    container.innerHTML += `
      <div class="resident-payment-card">
        <div class="resident-payment-main">
          <div class="resident-payment-header">
            <h4>${payment.concepto}</h4>
            <span class="resident-payment-status" style="background:${payment.color}15;color:${payment.color};">${payment.estado}</span>
          </div>
          <div class="resident-payment-meta">
            <span>Fecha: ${payment.fecha}</span>
            <span>Monto: $${payment.monto}</span>
          </div>
        </div>
      </div>
    `;
  });
}

function renderVisitPassCard(visit) {
  const visitResult = document.getElementById('visit-result');

  if (!visitResult) {
    return;
  }

  visitResult.innerHTML = `
    <div class="visit-pass-card">
      <div class="visit-pass-header">
        <div>
          <span class="visit-pass-label">Pase generado</span>
          <h4 class="visit-pass-title">${visit.visitorName}</h4>
        </div>
        <span class="resident-visit-status" style="background:${buildVisitColor(visit.status)}15;color:${buildVisitColor(visit.status)};">${visit.status}</span>
      </div>
      <div class="visit-pass-meta">
        <span><strong>Fecha:</strong> ${visit.visitDate}</span>
        <span><strong>Código:</strong> ${visit.accessCode}</span>
      </div>
      <div class="visit-pass-qr">
        <div class="visit-pass-qr-box" id="visit-qr-current"></div>
        <small>Presenta este QR en el acceso o comparte tu código.</small>
      </div>
    </div>
  `;

  renderVisitQr('visit-qr-current', visit);
}

function renderVisitQr(containerId, visit) {
  const container = document.getElementById(containerId);

  if (!container || typeof QRCode === 'undefined') {
    return;
  }

  container.innerHTML = '';

  const qrPayload = `VISIT|${visit.id}|${visit.accessCode}|${visit.visitDate}`;

  new QRCode(container, {
    text: qrPayload,
    width: 110,
    height: 110,
    colorDark: '#111827',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.M
  });
}

function renderResidentVisits(visits) {
  const container = document.getElementById('resident-visits-list');

  if (!container) {
    return;
  }

  container.innerHTML = '';

  if (!visits.length) {
    container.innerHTML = '<div class="resident-empty-state">Todavía no has generado visitas.</div>';
    return;
  }

  visits.map(mapVisitToResidentCard).forEach((visit) => {
    container.innerHTML += `
      <div class="resident-visit-card">
        <div class="resident-visit-main">
          <div class="resident-visit-header">
            <h4>${visit.visitorName}</h4>
            <span class="resident-visit-status" style="background:${visit.color}15;color:${visit.color};">${visit.status}</span>
          </div>
          <div class="resident-visit-meta">
            <span>Fecha: ${visit.visitDate}</span>
            <span>Código: ${visit.accessCode}</span>
          </div>
        </div>
      </div>
    `;
  });
}

async function refrescarMovimientos() {
  try {
    const tickets = await cargarTicketsDesdeApi();
    const paymentData = await cargarPagosDesdeApi();
    const reservations = await cargarReservasDesdeApi();
    const visits = await cargarVisitasDesdeApi();
    const notices = await cargarAvisosDesdeApi();
    const movimientos = [
      ...mapTicketsToMovimientos(tickets),
      ...mapPaymentsToMovimientos(paymentData.payments || []),
      ...mapReservationsToMovimientos(reservations),
      ...mapVisitsToMovimientos(visits)
    ];

    actualizarEstadoPagoVisual(paymentData.summary || { porCobrar: 0, enRevision: 0 });
    renderResidentFinanceSummary(paymentData.summary || { total: 0, pagado: 0, enRevision: 0, porCobrar: 0 });
    renderResidentPayments(paymentData.payments || []);
    renderResidentVisits(visits);
    cargarAvisos(notices);
      await refrescarConversacionesResidente();

    if (!movimientos.length) {
      cargarMovimientos([
        {
          titulo: 'Sin reportes todavía',
          fecha: 'No has generado tickets',
          estado: 'Disponible',
          color: '#6B7280'
        }
      ]);
      return;
    }

    cargarMovimientos(movimientos);
  } catch (error) {
    actualizarEstadoPagoVisual({ porCobrar: 0, enRevision: 0 });
    renderResidentFinanceSummary({ total: 0, pagado: 0, enRevision: 0, porCobrar: 0 });
    renderResidentPayments([]);
    renderResidentVisits([]);
    cargarAvisos([]);
    cargarMovimientos([
      {
        tipo: 'Error',
        titulo: 'Error al cargar datos',
        fecha: error.message,
        estado: 'Reintenta más tarde',
        color: '#DC2626'
      }
    ]);
  }
}
//Cargar perfil
function cargarPerfil(data) {
  document.getElementById("user-name").innerText = "Hola," + data.nombre;
  document.getElementById("dept-name").innerText = data.departamento;
  document.getElementById("dept-owner").innerText = "Titular:" + data.nombre;
  document.getElementById("dept-image").src = data.imagen;
  document.getElementById("payment-status").innerHTML =
    '<i class="fa-solid fa-circle-check"></i> ' + data.estado_pago;
  cargarFeatures(data.caracteristicas);
  cargarServicios(data.servicios);
  cargarMovimientos(data.movimientos);
}
//Cargar Features
function cargarFeatures(features) {
  const container = document.getElementById("features-container");
  container.innerHTML = "";
  features.forEach((f) => {
    container.innerHTML += `
        <div class="feature">
        <i class="${f.icono}"></i>
        <span>${f.texto}</span>
        </div>
        `
  });
}
//Servicios Activos
function cargarServicios(servicios) {
  const list = document.getElementById("services-list");
  list.innerHTML = "";
  servicios.forEach((s) => {
    list.innerHTML += `
        <li>
            <i class="fa-solid fa-circle-check"></i>
            ${s} 
        </li>
        `
  });
}

function cargarAmenidadesEnSelector(amenities) {
  const amenitySelect = document.getElementById('reservationAmenityId');

  if (!amenitySelect) {
    return;
  }

  window.__amenitiesCache = amenities;

  amenitySelect.innerHTML = '<option value="">Selecciona una amenidad</option>';

  amenities.forEach((amenity) => {
    amenitySelect.innerHTML += `<option value="${amenity.id}" data-name="${amenity.name}">${amenity.name}</option>`;
  });
}

function actualizarSlotsDisponibles(amenityId) {
  const timeSlotSelect = document.getElementById('reservationTimeSlot');
  const amenities = window.__amenitiesCache || [];

  if (!timeSlotSelect) {
    return;
  }

  timeSlotSelect.innerHTML = '<option value="">Selecciona un horario</option>';

  const amenity = amenities.find((item) => item.id === amenityId);

  if (!amenity || !Array.isArray(amenity.availableSlots)) {
    return;
  }

  amenity.availableSlots.forEach((slot) => {
    timeSlotSelect.innerHTML += `<option value="${slot}">${slot}</option>`;
  });
}

function refrescarDisponibilidadReserva() {
  const amenitySelect = document.getElementById('reservationAmenityId');
  const reservationDateInput = document.getElementById('reservationDate');

  if (!amenitySelect || !reservationDateInput) {
    return;
  }

  const amenityId = amenitySelect.value;
  const reservationDate = reservationDateInput.value;

  if (!amenityId) {
    resetReservationAvailabilityState('Selecciona una amenidad para consultar horarios.');
    return;
  }

  if (!reservationDate) {
    resetReservationAvailabilityState('Selecciona una fecha para ver disponibilidad.');
    return;
  }

  actualizarDisponibilidadPorFecha();
}

async function actualizarDisponibilidadPorFecha() {
  const amenitySelect = document.getElementById('reservationAmenityId');
  const reservationDateInput = document.getElementById('reservationDate');
  const slotsFeedback = document.getElementById('reservation-slots-feedback');
  const timeSlotSelect = document.getElementById('reservationTimeSlot');

  if (!amenitySelect || !reservationDateInput || !slotsFeedback || !timeSlotSelect) {
    return;
  }

  const amenityId = amenitySelect.value;
  const reservationDate = reservationDateInput.value;

  if (!amenityId || !reservationDate) {
    resetReservationAvailabilityState();
    return;
  }

  setReservationAvailabilityLoadingState('Consultando disponibilidad...');

  try {
    const availability = await cargarDisponibilidadAmenidad(amenityId, reservationDate);
    timeSlotSelect.innerHTML = '<option value="">Selecciona un horario</option>';
    timeSlotSelect.disabled = false;

    if (!availability.availableSlots.length) {
      slotsFeedback.textContent = 'No hay horarios disponibles para esta fecha';
      slotsFeedback.className = 'modal-feedback error';
      timeSlotSelect.disabled = true;
      return;
    }

    availability.availableSlots.forEach((slot) => {
      timeSlotSelect.innerHTML += `<option value="${slot}">${slot}</option>`;
    });

    slotsFeedback.textContent = `Horarios disponibles: ${availability.availableSlots.length}`;
    slotsFeedback.className = 'modal-feedback success';
  } catch (error) {
    timeSlotSelect.innerHTML = '<option value="">Selecciona un horario</option>';
    timeSlotSelect.disabled = true;
    slotsFeedback.textContent = error.message;
    slotsFeedback.className = 'modal-feedback error';
  }
}
//Movimientos Recientes
function cargarMovimientos(movs) {
  const container = document.getElementById("activity-list");
  container.innerHTML = "";

  const sortedMovs = [...movs].sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
  sortedMovs.forEach((m) => {
    container.innerHTML += `
        <div class="activity-item resident-activity-item">
          <div class="resident-activity-main">
            ${m.tipo ? `<span class="movement-tag">${m.tipo}</span>` : ''}
            <b>${m.titulo}</b>
            <small class="resident-activity-date">${m.fecha}</small>
          </div>
          <span class="resident-activity-status" style="background:${m.color}15;color:${m.color};">
            ${m.estado}
          </span>
        </div>
        `
  });
}
//Modales
function openModal(id){
    document.getElementById(id).style.display = "flex";
}
function closeModal(event, overlay){
    if(event.target === overlay){
        overlay.style.display = "none";
    }
}
function closeAllModals(){
    document.querySelectorAll(".modal-overlay").forEach(m => m.style.display = "none");
}

function switchAssistantTab(tabName) {
    document.querySelectorAll('.assistant-tab-btn').forEach((button) => {
        button.classList.toggle('active', button.dataset.tab === tabName);
    });

    const helpPanel = document.getElementById('assistant-tab-help');
    const messagesPanel = document.getElementById('assistant-tab-messages');

    if (helpPanel) {
        helpPanel.classList.toggle('active', tabName === 'help');
    }

    if (messagesPanel) {
        messagesPanel.classList.toggle('active', tabName === 'messages');
    }
}
//Chat
function toggleChat(){
    const chat = document.getElementById("chat-window")
    if(chat.style.display === "flex"){
        chat.style.display = "none";
    }else{
        chat.style.display = "flex";
        switchAssistantTab('help');
    }
}
function mostrarRespuesta(tipo){
    if(tipo === "wifi"){
        showFeedback("La clave del WiFi es: WIFI_CONDO_2026", 'info');
    }
    if(tipo === "basura"){
        showFeedback("La basura se saca de 8pm a 10pm", 'info');
    }
}
//Inicio del Dashboard
document.addEventListener("DOMContentLoaded", async () => {
    const currentUser = await requireAuth('residente');

    if (!currentUser) {
        return;
    }

    const logoutLink = document.getElementById('logout-link');

    if (logoutLink) {
        logoutLink.addEventListener('click', (event) => {
            event.preventDefault();
            logout();
        });
    }

    const cachedUser = getUser() || {
        id: currentUser.sub,
        email: currentUser.email,
        name: currentUser.name,
        role: currentUser.role,
        condominioId: currentUser.condominioId,
        propertyId: currentUser.propertyId || null
    };

    const residentViewModel = buildResidentViewModel(cachedUser);
    cargarPerfil(residentViewModel);

    setLoadingState('activity-list', 'Cargando movimientos...');
    setLoadingState('notices-list', 'Cargando avisos...');

    await refrescarMovimientos();

    try {
      const amenities = await cargarAmenidadesDesdeApi();
      cargarAmenidadesEnSelector(amenities.filter((amenity) => amenity.status === 'activa'));
      resetReservationAvailabilityState('Selecciona una amenidad para consultar horarios.');
    } catch (error) {
      showFeedback(error.message, 'error');
    }

    const ticketForm = document.getElementById('ticketForm');
    const paymentForm = document.getElementById('paymentForm');
    const reservationForm = document.getElementById('reservationForm');
    const visitForm = document.getElementById('visitForm');
    const visitResult = document.getElementById('visit-result');
    const ticketFeedback = document.getElementById('ticket-feedback');
    const paymentFeedback = document.getElementById('payment-feedback');
    const reservationFeedback = document.getElementById('reservation-feedback');
    const reservationSlotsFeedback = document.getElementById('reservation-slots-feedback');
    const visitFeedback = document.getElementById('visit-feedback');
    const conversationForm = document.getElementById('conversationForm');
    const conversationFeedback = document.getElementById('conversation-feedback');
    const conversationReplyForm = document.getElementById('conversation-reply-form');
    const reservationAmenitySelect = document.getElementById('reservationAmenityId');
    const reservationDateInput = document.getElementById('reservationDate');

    if (ticketForm) {
      ticketForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const title = document.getElementById('ticketTitle').value.trim();
        const description = document.getElementById('ticketDescription').value.trim();

        if (!title || !description) {
          ticketFeedback.textContent = 'Título y descripción son requeridos';
          ticketFeedback.className = 'modal-feedback error';
          showFeedback('Título y descripción son requeridos', 'error');
          return;
        }

        try {
          ticketFeedback.textContent = '';
          setButtonLoadingState(ticketForm.querySelector('button[type="submit"]'), true, 'Enviando...');
          await crearTicket({ title, description });
          ticketForm.reset();
          closeAllModals();
          await refrescarMovimientos();
          showFeedback('Reporte enviado correctamente', 'success');
        } catch (error) {
          ticketFeedback.textContent = error.message;
          ticketFeedback.className = 'modal-feedback error';
          showFeedback(error.message, 'error');
        } finally {
          setButtonLoadingState(ticketForm.querySelector('button[type="submit"]'), false);
        }
      });
    }

    if (conversationForm) {
      conversationForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const subject = document.getElementById('conversationSubject').value.trim();
        const message = document.getElementById('conversationMessage').value.trim();

        if (!subject || !message) {
          conversationFeedback.textContent = 'Asunto y mensaje son requeridos';
          conversationFeedback.className = 'modal-feedback error';
          return;
        }

        try {
          setButtonLoadingState(conversationForm.querySelector('button[type="submit"]'), true, 'Enviando...');
          await crearConversacion({ subject, message });
          conversationForm.reset();
          closeAllModals();
          await refrescarConversacionesResidente();
          const chat = document.getElementById('chat-window');
          if (chat) {
            chat.style.display = 'flex';
          }
          switchAssistantTab('messages');
          showFeedback('Consulta enviada correctamente', 'success');
        } catch (error) {
          conversationFeedback.textContent = error.message;
          conversationFeedback.className = 'modal-feedback error';
          showFeedback(error.message, 'error');
        } finally {
          setButtonLoadingState(conversationForm.querySelector('button[type="submit"]'), false);
        }
      });
    }

    if (conversationReplyForm) {
      conversationReplyForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const activeConversation = window.__residentConversationDetail;
        const message = document.getElementById('conversationReplyInput').value.trim();

        if (!activeConversation || !message) {
          return;
        }

        try {
          setButtonLoadingState(conversationReplyForm.querySelector('button[type="submit"]'), true, 'Enviando...');
          const updatedConversation = await responderConversacion(activeConversation.id, { message });
          renderConversationDetail(updatedConversation);
          await refrescarConversacionesResidente();
          showFeedback('Respuesta enviada correctamente', 'success');
        } catch (error) {
          showFeedback(error.message, 'error');
        } finally {
          setButtonLoadingState(conversationReplyForm.querySelector('button[type="submit"]'), false);
        }
      });
    }

    if (paymentForm) {
      paymentForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const concept = document.getElementById('paymentConcept').value.trim();
        const amount = Number(document.getElementById('paymentAmount').value);

        if (!concept || !Number.isFinite(amount) || amount <= 0) {
          paymentFeedback.textContent = 'Concepto y monto válidos son requeridos';
          paymentFeedback.className = 'modal-feedback error';
          showFeedback('Concepto y monto válidos son requeridos', 'error');
          return;
        }

        try {
          paymentFeedback.textContent = '';
          setButtonLoadingState(paymentForm.querySelector('button[type="submit"]'), true, 'Registrando...');
          await crearPago({ concept, amount });
          paymentForm.reset();
          closeAllModals();
          await refrescarMovimientos();
          showFeedback('Pago registrado correctamente', 'success');
        } catch (error) {
          paymentFeedback.textContent = error.message;
          paymentFeedback.className = 'modal-feedback error';
          showFeedback(error.message, 'error');
        } finally {
          setButtonLoadingState(paymentForm.querySelector('button[type="submit"]'), false);
        }
      });
    }

    if (reservationForm) {
      reservationForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const amenitySelect = document.getElementById('reservationAmenityId');
        const amenityId = amenitySelect.value.trim();
        const amenityName = amenitySelect.options[amenitySelect.selectedIndex]?.dataset.name || '';
        const reservationDate = document.getElementById('reservationDate').value;
        const timeSlot = document.getElementById('reservationTimeSlot').value.trim();

        if (!amenityId || !amenityName || !reservationDate || !timeSlot) {
          reservationFeedback.textContent = 'Todos los campos de reserva son requeridos';
          reservationFeedback.className = 'modal-feedback error';
          showFeedback('Todos los campos de reserva son requeridos', 'error');
          return;
        }

        try {
          reservationFeedback.textContent = '';
          reservationSlotsFeedback.textContent = '';
          setButtonLoadingState(reservationForm.querySelector('button[type="submit"]'), true, 'Solicitando...');
          await crearReserva({ amenityId, amenityName, reservationDate, timeSlot });
          reservationForm.reset();
          resetReservationAvailabilityState('Selecciona una amenidad para consultar horarios.');
          closeAllModals();
          await refrescarMovimientos();
          showFeedback('Reserva solicitada correctamente', 'success');
        } catch (error) {
          reservationFeedback.textContent = error.message;
          reservationFeedback.className = 'modal-feedback error';
          showFeedback(error.message, 'error');
        } finally {
          setButtonLoadingState(reservationForm.querySelector('button[type="submit"]'), false);
        }
      });
    }

    if (visitForm) {
      visitForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const visitorName = document.getElementById('visitVisitorName').value.trim();
        const visitDate = document.getElementById('visitDate').value;

        if (!visitorName || !visitDate) {
          visitFeedback.textContent = 'Nombre del visitante y fecha son requeridos';
          visitFeedback.className = 'modal-feedback error';
          showFeedback('Nombre del visitante y fecha son requeridos', 'error');
          return;
        }

        try {
          visitFeedback.textContent = '';
          setButtonLoadingState(visitForm.querySelector('button[type="submit"]'), true, 'Generando...');
          const visit = await crearVisita({ visitorName, visitDate });
          visitForm.reset();
          renderVisitPassCard(visit);
          await refrescarMovimientos();
          showFeedback('Pase generado correctamente', 'success');
        } catch (error) {
          visitFeedback.textContent = error.message;
          visitFeedback.className = 'modal-feedback error';
          showFeedback(error.message, 'error');
        } finally {
          setButtonLoadingState(visitForm.querySelector('button[type="submit"]'), false);
        }
      });
    }

    if (reservationAmenitySelect) {
      reservationAmenitySelect.addEventListener('change', () => {
        refrescarDisponibilidadReserva();
      });
    }

    if (reservationDateInput) {
      reservationDateInput.addEventListener('change', () => {
        refrescarDisponibilidadReserva();
      });
    }
})

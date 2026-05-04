const DEFAULT_DEPT_IMAGE = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80';
window.DEFAULT_DEPT_IMAGE = DEFAULT_DEPT_IMAGE;

function buildTicketColor(status) {
  if (window.ResidentShared?.buildTicketColor) {
    return window.ResidentShared.buildTicketColor(status);
  }

  const colorMap = {
    pendiente: '#F59E0B',
    en_proceso: '#4F46E5',
    cerrado: '#00C853'
  };

  return colorMap[status] || '#6B7280';
}

function buildPaymentColor(status) {
  if (window.ResidentShared?.buildPaymentColor) {
    return window.ResidentShared.buildPaymentColor(status);
  }

  const colorMap = {
    pagado: '#00C853',
    en_revision: '#4F46E5',
    pendiente: '#F59E0B',
    rechazado: '#DC2626'
  };

  return colorMap[status] || '#6B7280';
}

function buildReservationColor(status) {
  if (window.ResidentShared?.buildReservationColor) {
    return window.ResidentShared.buildReservationColor(status);
  }

  const colorMap = {
    pendiente: '#F59E0B',
    aprobada: '#00C853',
    rechazada: '#DC2626'
  };

  return colorMap[status] || '#6B7280';
}

function buildVisitColor(status) {
  if (window.ResidentShared?.buildVisitColor) {
    return window.ResidentShared.buildVisitColor(status);
  }

  const colorMap = {
    pendiente: '#F59E0B',
    validada: '#00C853',
    expirada: '#DC2626'
  };

  return colorMap[status] || '#6B7280';
}

function buildResidentViewModel(user) {
  if (window.ResidentHomeScreen?.buildResidentViewModel) {
    return window.ResidentHomeScreen.buildResidentViewModel(user);
  }

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
  if (window.ResidentTicketsScreen?.mapToMovements) {
    return window.ResidentTicketsScreen.mapToMovements(tickets);
  }

  return tickets.map((ticket) => ({
    tipo: 'Ticket',
    titulo: ticket.title,
    fecha: ticket.id,
    estado: ticket.status,
    color: buildTicketColor(ticket.status)
  }));
}

function mapPaymentsToMovimientos(payments) {
  if (window.ResidentPaymentsScreen?.mapToMovements) {
    return window.ResidentPaymentsScreen.mapToMovements(payments);
  }

  return payments.map((payment) => ({
    tipo: 'Pago',
    titulo: payment.concept,
    fecha: payment.paymentDate || payment.id,
    estado: `$${payment.amount} • ${payment.status}`,
    color: buildPaymentColor(payment.status)
  }));
}

function mapPaymentToResidentCard(payment) {
  if (window.ResidentPaymentsScreen?.mapToCard) {
    return window.ResidentPaymentsScreen.mapToCard(payment);
  }

  return {
    concepto: payment.concept,
    fecha: payment.paymentDate || payment.createdAt || 'Sin fecha',
    monto: payment.amount,
    estado: payment.status,
    color: buildPaymentColor(payment.status)
  };
}

function mapReservationsToMovimientos(reservations) {
  if (window.ResidentReservationsScreen?.mapToMovements) {
    return window.ResidentReservationsScreen.mapToMovements(reservations);
  }

  return reservations.map((reservation) => ({
    tipo: 'Reserva',
    titulo: reservation.amenityName,
    fecha: `${reservation.reservationDate} • ${reservation.timeSlot}`,
    estado: reservation.status,
    color: buildReservationColor(reservation.status)
  }));
}

function mapVisitsToMovimientos(visits) {
  if (window.ResidentVisitsScreen?.mapToMovements) {
    return window.ResidentVisitsScreen.mapToMovements(visits);
  }

  return visits.map((visit) => ({
    tipo: 'Visita',
    titulo: `Visita: ${visit.visitorName}`,
    fecha: `${visit.visitDate} • ${visit.accessCode}`,
    estado: visit.status,
    color: buildVisitColor(visit.status)
  }));
}

function mapVisitToResidentCard(visit) {
  if (window.ResidentVisitsScreen?.mapToCard) {
    return window.ResidentVisitsScreen.mapToCard(visit);
  }

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

async function cargarTicketsDesdeApi() {
  if (window.ResidentTicketsScreen?.fetchList) {
    return window.ResidentTicketsScreen.fetchList();
  }

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
  if (window.ResidentTicketsScreen?.createTicket) {
    return window.ResidentTicketsScreen.createTicket(payload);
  }

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
  if (window.ResidentPaymentsScreen?.fetchData) {
    return window.ResidentPaymentsScreen.fetchData();
  }

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
  if (window.ResidentPaymentsScreen?.createPayment) {
    return window.ResidentPaymentsScreen.createPayment(payload);
  }

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
  if (window.ResidentReservationsScreen?.fetchList) {
    return window.ResidentReservationsScreen.fetchList();
  }

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
  if (window.ResidentReservationsScreen?.fetchAmenities) {
    return window.ResidentReservationsScreen.fetchAmenities();
  }

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
  if (window.ResidentReservationsScreen?.createReservation) {
    return window.ResidentReservationsScreen.createReservation(payload);
  }

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
  if (window.ResidentReservationsScreen?.resetAvailabilityState) {
    return window.ResidentReservationsScreen.resetAvailabilityState(message);
  }

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
  if (window.ResidentReservationsScreen?.setLoadingAvailabilityState) {
    return window.ResidentReservationsScreen.setLoadingAvailabilityState(message);
  }

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
  if (window.ResidentReservationsScreen?.fetchAvailability) {
    return window.ResidentReservationsScreen.fetchAvailability(amenityId, date);
  }

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
  if (window.ResidentVisitsScreen?.fetchList) {
    return window.ResidentVisitsScreen.fetchList();
  }

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
  if (window.ResidentVisitsScreen?.createVisit) {
    return window.ResidentVisitsScreen.createVisit(payload);
  }

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
  if (window.ResidentNoticesScreen?.fetchActiveList) {
    return window.ResidentNoticesScreen.fetchActiveList();
  }

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
  if (window.ResidentNoticesScreen?.renderList) {
    return window.ResidentNoticesScreen.renderList(notices);
  }

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
  if (window.ResidentPaymentsScreen?.renderPaymentStatus) {
    return window.ResidentPaymentsScreen.renderPaymentStatus(summary);
  }

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
  if (window.ResidentPaymentsScreen?.renderFinanceSummary) {
    return window.ResidentPaymentsScreen.renderFinanceSummary(summary);
  }

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
  if (window.ResidentPaymentsScreen?.renderPayments) {
    return window.ResidentPaymentsScreen.renderPayments(payments);
  }

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
  if (window.ResidentVisitsScreen?.renderVisitPassCard) {
    return window.ResidentVisitsScreen.renderVisitPassCard(visit);
  }

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
  if (window.ResidentVisitsScreen?.renderVisitQr) {
    return window.ResidentVisitsScreen.renderVisitQr(containerId, visit);
  }

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
  if (window.ResidentVisitsScreen?.renderResidentVisits) {
    return window.ResidentVisitsScreen.renderResidentVisits(visits);
  }

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
  if (window.ResidentHomeScreen?.refreshDashboard) {
    return window.ResidentHomeScreen.refreshDashboard();
  }

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
  if (window.ResidentHomeScreen?.renderProfile) {
    return window.ResidentHomeScreen.renderProfile(data);
  }

  document.getElementById("user-name").innerText = "Hola, " + data.nombre;
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
  if (window.ResidentHomeScreen?.renderFeatures) {
    return window.ResidentHomeScreen.renderFeatures(features);
  }

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
  if (window.ResidentHomeScreen?.renderServices) {
    return window.ResidentHomeScreen.renderServices(servicios);
  }

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
  if (window.ResidentReservationsScreen?.renderAmenitiesSelect) {
    return window.ResidentReservationsScreen.renderAmenitiesSelect(amenities);
  }

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
  if (window.ResidentReservationsScreen?.refreshAvailability) {
    return window.ResidentReservationsScreen.refreshAvailability();
  }

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
  if (window.ResidentReservationsScreen?.updateAvailabilityByDate) {
    return window.ResidentReservationsScreen.updateAvailabilityByDate();
  }

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
  if (window.ResidentHomeScreen?.renderMovements) {
    return window.ResidentHomeScreen.renderMovements(movs);
  }

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
    if (window.ResidentShared?.openModal) {
        return window.ResidentShared.openModal(id);
    }
    document.getElementById(id).style.display = "flex";
}
function closeModal(event, overlay){
    if (window.ResidentShared?.closeModal) {
        return window.ResidentShared.closeModal(event, overlay);
    }
    if(event.target === overlay){
        overlay.style.display = "none";
    }
}
function closeAllModals(){
    if (window.ResidentShared?.closeAllModals) {
        return window.ResidentShared.closeAllModals();
    }
    document.querySelectorAll(".modal-overlay").forEach(m => m.style.display = "none");
}

function switchAssistantTab(tabName) {
    if (window.ResidentShared?.switchAssistantTab) {
        return window.ResidentShared.switchAssistantTab(tabName);
    }
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
    if (window.ResidentShared?.toggleChat) {
        return window.ResidentShared.toggleChat();
    }
    const chat = document.getElementById("chat-window")
    if(chat.style.display === "flex"){
        chat.style.display = "none";
    }else{
        chat.style.display = "flex";
        switchAssistantTab('help');
    }
}
function mostrarRespuesta(tipo){
    if (window.ResidentShared?.mostrarRespuesta) {
        return window.ResidentShared.mostrarRespuesta(tipo);
    }
    if(tipo === "wifi"){
        showFeedback("La clave del WiFi es: WIFI_CONDO_2026", 'info');
    }
    if(tipo === "basura"){
        showFeedback("La basura se saca de 8pm a 10pm", 'info');
    }
}

const DEFAULT_PROPERTY_IMAGE = 'https://images.unsplash.com/photo-1560448204?auto=format&fit=crop&w=800&q=80';
let amenityModalMode = 'create';
let selectedAmenityId = null;
let ticketsHistoryCache = [];

function getAmenityStatusClass(status) {
  return `service-status-${status || 'inactiva'}`;
}

function getTicketPriorityClass(priority) {
  return `ticket-priority-${priority || 'media'}`;
}

function cargarTickets(data) {
  const ticketsContainer = document.getElementById('tickets-container');

  if (!ticketsContainer) {
    return;
  }

  ticketsContainer.innerHTML = '';

  const activeTickets = data.filter((ticket) => ticket.estado !== 'cerrado');

  if (!activeTickets.length) {
    ticketsContainer.innerHTML = '<div class="admin-empty-state">No hay tickets registrados todavía.</div>';
    return;
  }

  activeTickets.forEach((ticket) => {
    ticketsContainer.innerHTML += `
      <div class="card">
        <div class="card-info">
          <h3>${ticket.titulo}</h3>
          <p>${ticket.descripcion}</p>
          <p><strong>Estado:</strong> ${ticket.estado}</p>
          <p><strong>Prioridad:</strong> ${ticket.prioridad}</p>
          ${ticket.siguienteEstado ? `
            <button class="admin-action-btn" onclick="actualizarEstadoTicket('${ticket.id}', '${ticket.siguienteEstado}')">
              Marcar como ${ticket.siguienteEstadoLabel}
            </button>
          ` : '<span class="ticket-status-badge ticket-status-cerrado">Sin acciones disponibles</span>'}
        </div>
      </div>
    `;
  });
}

function cargarTicketsCerradosRecientes(data) {
  const closedTicketsContainer = document.getElementById('closed-tickets-container');

  if (!closedTicketsContainer) {
    return;
  }

  const now = new Date();
  const recentClosedTickets = data.filter((ticket) => {
    if (ticket.estado !== 'cerrado' || !ticket.closedAt) {
      return false;
    }

    const closedDate = new Date(ticket.closedAt);
    const diffInDays = (now - closedDate) / (1000 * 60 * 60 * 24);
    return diffInDays <= 7;
  });

  closedTicketsContainer.innerHTML = '';

  if (!recentClosedTickets.length) {
    closedTicketsContainer.innerHTML = '<div class="admin-empty-state">No hay tickets cerrados en los últimos 7 días.</div>';
    return;
  }

  recentClosedTickets.forEach((ticket) => {
    closedTicketsContainer.innerHTML += `
      <div class="card">
        <div class="card-info">
          <h3>${ticket.titulo}</h3>
          <p>${ticket.descripcion}</p>
          <p><strong>Estado:</strong> ${ticket.estado}</p>
          <p><strong>Prioridad:</strong> ${ticket.prioridad}</p>
          <p><strong>Cerrado:</strong> ${ticket.closedAt}</p>
          <span class="ticket-status-badge ticket-status-cerrado">Cerrado</span>
        </div>
      </div>
    `;
  });
}

function filtrarTicketsHistorial(tickets, filters) {
  const now = new Date();

  return tickets.filter((ticket) => {
    const matchesStatus = filters.status === 'all' || ticket.estado === filters.status;
    const matchesPriority = filters.priority === 'all' || ticket.prioridad === filters.priority;
    const searchTarget = `${ticket.titulo} ${ticket.descripcion}`.toLowerCase();
    const matchesSearch = !filters.search || searchTarget.includes(filters.search.toLowerCase());

    let matchesPeriod = true;
    if (filters.period === '7d') {
      const createdAt = new Date(ticket.createdAt || 0);
      matchesPeriod = ((now - createdAt) / (1000 * 60 * 60 * 24)) <= 7;
    }

    if (filters.period === '30d') {
      const createdAt = new Date(ticket.createdAt || 0);
      matchesPeriod = ((now - createdAt) / (1000 * 60 * 60 * 24)) <= 30;
    }

    if (filters.period === 'recent_closed') {
      if (!ticket.closedAt) {
        matchesPeriod = false;
      } else {
        const closedAt = new Date(ticket.closedAt);
        matchesPeriod = ((now - closedAt) / (1000 * 60 * 60 * 24)) <= 7;
      }
    }

    return matchesStatus && matchesPriority && matchesSearch && matchesPeriod;
  });
}

function renderHistorialTickets(tickets) {
  const historyContainer = document.getElementById('tickets-history-container');

  if (!historyContainer) {
    return;
  }

  historyContainer.innerHTML = '';

  if (!tickets.length) {
    historyContainer.innerHTML = '<div class="admin-empty-state">No hay tickets que coincidan con los filtros seleccionados.</div>';
    return;
  }

  tickets.forEach((ticket) => {
    historyContainer.innerHTML += `
      <div class="card">
        <div class="card-info">
          <h3>${ticket.titulo}</h3>
          <p>${ticket.descripcion}</p>
          <div class="history-ticket-meta">
            <span><strong>Estado:</strong> ${ticket.estado}</span>
            <span><strong>Creado:</strong> ${ticket.createdAt}</span>
            <span><strong>Cerrado:</strong> ${ticket.closedAt || '—'}</span>
            <span><strong>Propiedad:</strong> ${ticket.propertyId || '—'}</span>
          </div>
          <span class="ticket-priority-badge ${getTicketPriorityClass(ticket.prioridad)}">${ticket.prioridad}</span>
        </div>
      </div>
    `;
  });
}

function actualizarHistorialTickets() {
  const filters = {
    status: document.getElementById('history-status-filter')?.value || 'all',
    priority: document.getElementById('history-priority-filter')?.value || 'all',
    period: document.getElementById('history-period-filter')?.value || 'all',
    search: document.getElementById('history-search-filter')?.value || ''
  };

  const filteredTickets = filtrarTicketsHistorial(ticketsHistoryCache, filters);
  renderHistorialTickets(filteredTickets);
}

function cargarReservas(data) {
  const reservasContainer = document.getElementById('reservas-container');

  if (!reservasContainer) {
    return;
  }

  reservasContainer.innerHTML = '';

  if (!data.length) {
    reservasContainer.innerHTML = '<div class="admin-empty-state">No hay reservas registradas todavía.</div>';
    return;
  }

  data.forEach((reserva) => {
    reservasContainer.innerHTML += `
      <div class="card">
        <div class="card-info">
          <h3>${reserva.amenidad}</h3>
          <p><strong>Fecha:</strong> ${reserva.fecha}</p>
          <p><strong>Horario:</strong> ${reserva.horario}</p>
          <p><strong>Estado:</strong> ${reserva.estado}</p>
          <button class="admin-action-btn" onclick="actualizarEstadoReserva('${reserva.id}', '${reserva.siguienteEstado}')">
            Marcar como ${reserva.siguienteEstadoLabel}
          </button>
        </div>
      </div>
    `;
  });
}

function cargarPagos(data, summary) {
  const finanzasContainer = document.getElementById('finanzas-container');

  if (!finanzasContainer) {
    return;
  }

  finanzasContainer.innerHTML = `
    <div class="card">
      <div class="card-info">
        <h3>Resumen Financiero</h3>
        <p><strong>Total:</strong> $${summary.total}</p>
        <p><strong>Pagado:</strong> $${summary.pagado}</p>
        <p><strong>En revisión:</strong> $${summary.enRevision}</p>
        <p><strong>Por cobrar:</strong> $${summary.porCobrar}</p>
      </div>
    </div>
  `;

  if (!data.length) {
    finanzasContainer.innerHTML += '<div class="admin-empty-state">No hay pagos registrados todavía.</div>';
    return;
  }

  data.forEach((pago) => {
    finanzasContainer.innerHTML += `
      <div class="card">
        <div class="card-info">
          <h3>${pago.concepto}</h3>
          <p><strong>Monto:</strong> $${pago.monto}</p>
          <p><strong>Estado:</strong> ${pago.estado}</p>
          <button class="admin-action-btn" onclick="actualizarEstadoPago('${pago.id}', '${pago.siguienteEstado}')">
            Marcar como ${pago.siguienteEstadoLabel}
          </button>
        </div>
      </div>
    `;
  });
}

function cargarAvisos(data) {
  const avisosContainer = document.getElementById('avisos-container');

  if (!avisosContainer) {
    return;
  }

  avisosContainer.innerHTML = '';

  const activeNotices = data.filter((aviso) => aviso.status !== 'archivado');

  if (!activeNotices.length) {
    avisosContainer.innerHTML += '<div class="admin-empty-state">No hay avisos activos.</div>';
    return;
  }

  activeNotices.forEach((aviso) => {
    avisosContainer.innerHTML += `
      <div class="card">
        <div class="card-info">
          <h3>${aviso.titulo}</h3>
          <p>${aviso.mensaje}</p>
          <p><strong>Audiencia:</strong> ${aviso.audiencia}</p>
          <div class="service-card-actions">
            <button class="admin-action-btn" onclick="actualizarEstadoAviso('${aviso.id}', 'archivado')">Archivar aviso</button>
            <button class="admin-danger-btn" onclick="eliminarAviso('${aviso.id}')">Eliminar</button>
          </div>
        </div>
      </div>
    `;
  });
}

function cargarAvisosArchivados(data) {
  const archivedContainer = document.getElementById('archived-avisos-container');

  if (!archivedContainer) {
    return;
  }

  const archivedNotices = data.filter((aviso) => aviso.status === 'archivado');
  archivedContainer.innerHTML = '';

  if (!archivedNotices.length) {
    archivedContainer.innerHTML += '<div class="admin-empty-state">No hay avisos archivados.</div>';
    return;
  }

  archivedNotices.forEach((aviso) => {
    archivedContainer.innerHTML += `
      <div class="card">
        <div class="card-info">
          <h3>${aviso.titulo}</h3>
          <p>${aviso.mensaje}</p>
          <p><strong>Audiencia:</strong> ${aviso.audiencia}</p>
          <div class="service-card-actions">
            <button class="admin-action-btn" onclick="actualizarEstadoAviso('${aviso.id}', 'activo')">Reactivar aviso</button>
            <button class="admin-danger-btn" onclick="eliminarAviso('${aviso.id}')">Eliminar</button>
          </div>
        </div>
      </div>
    `;
  });
}

function cargarAmenidades(data) {
  const serviciosContainer = document.getElementById('servicios-container');

  if (!serviciosContainer) {
    return;
  }

  serviciosContainer.innerHTML = `
    <div class="service-toolbar">
      <div class="service-toolbar-copy">
        <h3>Amenidades del condominio</h3>
        <p>Administra creación, edición, estado y eliminación de áreas comunes.</p>
      </div>
      <div class="service-actions">
        <button class="admin-action-btn" onclick="openAmenityModal('create')">Nueva amenidad</button>
      </div>
    </div>
  `;

  if (!data.length) {
    serviciosContainer.innerHTML += '<div class="admin-empty-state">No hay amenidades registradas todavía.</div>';
    return;
  }

  data.forEach((amenity) => {
    serviciosContainer.innerHTML += `
      <div class="service-card-admin">
        <div class="service-card-header">
          <div>
            <h3>${amenity.name}</h3>
          </div>
          <span class="service-status-badge ${getAmenityStatusClass(amenity.status)}">${amenity.status}</span>
        </div>
        <div class="service-card-body">
          <p class="service-card-description">${amenity.description || 'Sin descripción'}</p>
          <p class="service-card-meta"><strong>ID:</strong> ${amenity.id}</p>
        </div>
        <div class="service-card-actions">
          <button class="admin-secondary-btn" onclick="openAmenityModal('edit', '${amenity.id}')">Editar</button>
          <button class="admin-secondary-btn" onclick="cambiarEstadoAmenidad('${amenity.id}', '${amenity.status === 'activa' ? 'mantenimiento' : 'activa'}')">${amenity.status === 'activa' ? 'Poner en mantenimiento' : 'Activar'}</button>
          <button class="admin-danger-btn" onclick="eliminarAmenidad('${amenity.id}')">Eliminar</button>
        </div>
      </div>
    `;
  });
}

function mapTicketToCard(ticket) {
  const statusTransitions = {
    pendiente: { next: 'en_proceso', label: 'En Proceso' },
    en_proceso: { next: 'cerrado', label: 'Cerrado' },
    cerrado: null
  };

  const transition = statusTransitions[ticket.status] || null;

  return {
    id: ticket.id,
    titulo: ticket.title,
    descripcion: ticket.description,
    estado: ticket.status,
    prioridad: ticket.priority,
    closedAt: ticket.closedAt || null,
    createdAt: ticket.createdAt || null,
    propertyId: ticket.propertyId || null,
    siguienteEstado: transition?.next || null,
    siguienteEstadoLabel: transition?.label || null
  };
}

function mapReservationToCard(reservation) {
  const statusTransitions = {
    pendiente: { next: 'aprobada', label: 'Aprobada' },
    aprobada: { next: 'rechazada', label: 'Rechazada' },
    rechazada: { next: 'rechazada', label: 'Rechazada' }
  };

  const transition = statusTransitions[reservation.status] || statusTransitions.rechazada;

  return {
    id: reservation.id,
    amenidad: reservation.amenityName,
    fecha: reservation.reservationDate,
    horario: reservation.timeSlot,
    estado: reservation.status,
    siguienteEstado: transition.next,
    siguienteEstadoLabel: transition.label
  };
}

function mapPaymentToCard(payment) {
  const statusTransitions = {
    pendiente: { next: 'pagado', label: 'Pagado' },
    en_revision: { next: 'pagado', label: 'Pagado' },
    pagado: { next: 'rechazado', label: 'Rechazado' },
    rechazado: { next: 'pagado', label: 'Pagado' }
  };

  const transition = statusTransitions[payment.status] || statusTransitions.pagado;

  return {
    id: payment.id,
    concepto: payment.concept,
    monto: payment.amount,
    estado: payment.status,
    siguienteEstado: transition.next,
    siguienteEstadoLabel: transition.label
  };
}

function mapNoticeToCard(notice) {
  return {
    id: notice.id,
    titulo: notice.title,
    mensaje: notice.message,
    audiencia: notice.audience,
    status: notice.status || 'activo'
  };
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
  return (data.tickets || []).map(mapTicketToCard);
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
  return (data.reservations || []).map(mapReservationToCard);
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

  const data = await response.json();
  return {
    payments: (data.payments || []).map(mapPaymentToCard),
    summary: data.summary || { total: 0, pagado: 0, enRevision: 0, porCobrar: 0 }
  };
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
  return (data.notices || []).map(mapNoticeToCard);
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

async function crearAviso(payload) {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}/api/notices`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'No se pudo crear el aviso');
  }

  const data = await response.json();
  return data.notice;
}

async function actualizarEstadoAviso(noticeId, status) {
  const token = getToken();

  try {
    const response = await fetch(`${API_BASE_URL}/api/notices/${encodeURIComponent(noticeId)}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'No se pudo actualizar el aviso');
    }

    changeTab('mensajes');
    showFeedback('Aviso actualizado correctamente', 'success');
  } catch (error) {
    showFeedback(error.message, 'error');
  }
}

async function eliminarAviso(noticeId) {
  const token = getToken();

  if (!window.confirm('¿Seguro que quieres eliminar este aviso?')) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/notices/${encodeURIComponent(noticeId)}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'No se pudo eliminar el aviso');
    }

    changeTab('mensajes');
    showFeedback('Aviso eliminado correctamente', 'success');
  } catch (error) {
    showFeedback(error.message, 'error');
  }
}

async function crearAmenidad(payload) {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}/api/amenities`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'No se pudo crear la amenidad');
  }

  const data = await response.json();
  return data.amenity;
}

async function actualizarAmenidad(amenityId, payload) {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}/api/amenities/${encodeURIComponent(amenityId)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'No se pudo actualizar la amenidad');
  }

  const data = await response.json();
  return data.amenity;
}

async function eliminarAmenidad(amenityId) {
  const token = getToken();

  if (!window.confirm('¿Seguro que quieres eliminar esta amenidad?')) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/amenities/${encodeURIComponent(amenityId)}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'No se pudo eliminar la amenidad');
    }

    changeTab('servicios');
    showFeedback('Amenidad eliminada correctamente', 'success');
  } catch (error) {
    showFeedback(error.message, 'error');
  }
}

async function cambiarEstadoAmenidad(amenityId, status) {
  try {
    await actualizarAmenidad(amenityId, { status });
    changeTab('servicios');
    showFeedback('Estado de amenidad actualizado correctamente', 'success');
  } catch (error) {
    showFeedback(error.message, 'error');
  }
}

async function actualizarEstadoTicket(ticketId, nextStatus) {
  const token = getToken();

  try {
    const response = await fetch(`${API_BASE_URL}/api/tickets/${encodeURIComponent(ticketId)}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status: nextStatus })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'No se pudo actualizar el ticket');
    }

    changeTab('mensajes');
    showFeedback('Ticket actualizado correctamente', 'success');
  } catch (error) {
    showFeedback(error.message, 'error');
  }
}

async function actualizarEstadoReserva(reservationId, nextStatus) {
  const token = getToken();

  try {
    const response = await fetch(`${API_BASE_URL}/api/reservations/${encodeURIComponent(reservationId)}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status: nextStatus })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'No se pudo actualizar la reserva');
    }

    changeTab('reservas');
    showFeedback('Reserva actualizada correctamente', 'success');
  } catch (error) {
    showFeedback(error.message, 'error');
  }
}

async function actualizarEstadoPago(paymentId, nextStatus) {
  const token = getToken();

  try {
    const response = await fetch(`${API_BASE_URL}/api/payments/${encodeURIComponent(paymentId)}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status: nextStatus })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'No se pudo actualizar el pago');
    }

    changeTab('finanzas');
    showFeedback('Pago actualizado correctamente', 'success');
  } catch (error) {
    showFeedback(error.message, 'error');
  }
}

function changeTab(tabName) {
  const tabs = document.querySelectorAll('.nav-tab');
  tabs.forEach((tab) => tab.classList.remove('active'));

  const activeButton = Array.from(tabs).find((tab) => tab.textContent.trim().toLowerCase() === tabName.toLowerCase());

  if (activeButton) {
    activeButton.classList.add('active');
  }

  const title = document.querySelector('.page-title');
  const propertyContainer = document.getElementById('propiedades-container');
  const ticketsContainer = document.getElementById('tickets-container');
  const reservasContainer = document.getElementById('reservas-container');
  const finanzasContainer = document.getElementById('finanzas-container');
  const avisosContainer = document.getElementById('avisos-container');
  const serviciosContainer = document.getElementById('servicios-container');
  const archivedAvisosContainer = document.getElementById('archived-avisos-container');
  const messagesWrapper = document.getElementById('messages-wrapper');
  const closedTicketsContainer = document.getElementById('closed-tickets-container');
  const ticketsHistoryWrapper = document.getElementById('tickets-history-wrapper');

  if (!title || !propertyContainer || !ticketsContainer || !reservasContainer || !finanzasContainer || !avisosContainer || !serviciosContainer || !archivedAvisosContainer || !messagesWrapper || !closedTicketsContainer || !ticketsHistoryWrapper) {
    return;
  }

  propertyContainer.classList.add('admin-hidden');
  ticketsContainer.classList.add('admin-hidden');
  reservasContainer.classList.add('admin-hidden');
  finanzasContainer.classList.add('admin-hidden');
  avisosContainer.classList.add('admin-hidden');
  serviciosContainer.classList.add('admin-hidden');
  archivedAvisosContainer.classList.add('admin-hidden');
  messagesWrapper.classList.add('admin-hidden');
  closedTicketsContainer.classList.add('admin-hidden');
  ticketsHistoryWrapper.classList.add('admin-hidden');
  if (tabName === 'servicios') {
    title.textContent = 'Gestión de Servicios';
    serviciosContainer.classList.remove('admin-hidden');
    setLoadingState('servicios-container', 'Cargando amenidades...');
    cargarAmenidadesDesdeApi()
      .then(cargarAmenidades)
      .catch((error) => {
        serviciosContainer.innerHTML = `<div class="admin-error-state">${error.message}</div>`;
      });
    return;
  }


  if (tabName === 'propiedades') {
    title.textContent = 'Gestión de Inmuebles';
    propertyContainer.classList.remove('admin-hidden');
    setLoadingState('propiedades-container', 'Cargando propiedades...');
    cargarPropiedadesDesdeApi()
      .then(cargarPropiedades)
      .catch((error) => {
        propertyContainer.innerHTML = `<div class="admin-error-state">${error.message}</div>`;
      });
    return;
  }

  if (tabName === 'mensajes') {
    title.textContent = 'Mensajes y Avisos';
    messagesWrapper.classList.remove('admin-hidden');
    setLoadingState('tickets-container', 'Cargando tickets...');
    setLoadingState('avisos-container', 'Cargando avisos...');
    setLoadingState('archived-avisos-container', 'Cargando avisos archivados...');
    Promise.all([cargarTicketsDesdeApi(), cargarAvisosDesdeApi()])
      .then(([tickets, avisos]) => {
        cargarTickets(tickets);
        cargarTicketsCerradosRecientes(tickets);
        cargarAvisos(avisos);
        cargarAvisosArchivados(avisos);
      })
      .catch((error) => {
        ticketsContainer.innerHTML = `<div class="admin-error-state">${error.message}</div>`;
        closedTicketsContainer.innerHTML = `<div class="admin-error-state">${error.message}</div>`;
        avisosContainer.innerHTML = `<div class="admin-error-state">${error.message}</div>`;
        archivedAvisosContainer.innerHTML = `<div class="admin-error-state">${error.message}</div>`;
      });
    return;
  }

  if (tabName === 'reservas') {
    title.textContent = 'Gestión de Reservas';
    reservasContainer.classList.remove('admin-hidden');
    setLoadingState('reservas-container', 'Cargando reservas...');
    cargarReservasDesdeApi()
      .then(cargarReservas)
      .catch((error) => {
        reservasContainer.innerHTML = `<div class="admin-error-state">${error.message}</div>`;
      });
    return;
  }

  if (tabName === 'finanzas') {
    title.textContent = 'Panel Financiero';
    finanzasContainer.classList.remove('admin-hidden');
    setLoadingState('finanzas-container', 'Cargando finanzas...');
    cargarPagosDesdeApi()
      .then(({ payments, summary }) => cargarPagos(payments, summary))
      .catch((error) => {
        finanzasContainer.innerHTML = `<div class="admin-error-state">${error.message}</div>`;
      });
    return;
  }

  if (tabName === 'historial') {
    title.textContent = 'Historial de Tickets';
    ticketsHistoryWrapper.classList.remove('admin-hidden');
    const historyContainer = document.getElementById('tickets-history-container');
    if (historyContainer) {
      setLoadingState('tickets-history-container', 'Cargando historial de tickets...');
    }

    cargarTicketsDesdeApi()
      .then((tickets) => {
        ticketsHistoryCache = tickets;
        actualizarHistorialTickets();
      })
      .catch((error) => {
        if (historyContainer) {
          historyContainer.innerHTML = `<div class="admin-error-state">${error.message}</div>`;
        }
      });
    return;
  }

  const tabLabels = {
    servicios: 'Gestión de Servicios',
    mensajes: 'Mensajes y Avisos'
  };

  title.textContent = tabLabels[tabName] || 'Panel de Administración';
  propertyContainer.classList.remove('admin-hidden');
  propertyContainer.innerHTML = `<div class="admin-empty-state">La sección <strong>${title.textContent}</strong> se conectará en el siguiente paso.</div>`;
}

// ===============================
// CARGAR PROPIEDADES
// ===============================

function cargarPropiedades(data) {
  const container = document.getElementById("propiedades-container");

  container.innerHTML = "";

  if (!data.length) {
    container.innerHTML = '<p>No hay propiedades registradas todavía.</p>';
    return;
  }

  data.forEach((p) => {
    container.innerHTML += `
<button class="property-card-button" onclick="verDetallePropiedad('${p.id}')">
  <div class="card">
    <div class="card-img-wrap">
      <img src="${p.imagen}">
    </div>
    <div class="card-info">
      <h3>${p.nombre}</h3>
      <p>${p.residente}</p>
    </div>
  </div>
</button>
`;
  });
}

function mapPropertyToCard(property) {
  return {
    id: property.id,
    nombre: property.name,
    residente: property.residentId || 'Sin residente asignado',
    imagen: property.imagen || DEFAULT_PROPERTY_IMAGE
  };
}

async function cargarPropiedadesDesdeApi() {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}/api/properties`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'No se pudieron cargar las propiedades');
  }

  const data = await response.json();
  return (data.properties || []).map(mapPropertyToCard);
}

async function cargarDetallePropiedadDesdeApi(propertyId) {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}/api/properties/${encodeURIComponent(propertyId)}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'No se pudo cargar el detalle de la propiedad');
  }

  const data = await response.json();
  return data.property;
}

function renderDetallePropiedad(property) {
  const detailContent = document.getElementById('property-detail-content');

  if (!detailContent) {
    return;
  }

  detailContent.innerHTML = `
    <div class="property-detail-header">
      <h3 class="property-detail-title">${property.name}</h3>
      <span class="badge ${property.status === 'ok' ? 'bg-green' : 'bg-yellow'}">${property.status}</span>
    </div>
    <div class="property-detail-grid">
      <div class="property-detail-item">
        <span class="property-detail-label">ID</span>
        <span class="property-detail-value">${property.id}</span>
      </div>
      <div class="property-detail-item">
        <span class="property-detail-label">Tipo</span>
        <span class="property-detail-value">${property.type}</span>
      </div>
      <div class="property-detail-item">
        <span class="property-detail-label">Condominio</span>
        <span class="property-detail-value">${property.condominioId}</span>
      </div>
      <div class="property-detail-item">
        <span class="property-detail-label">Residente asignado</span>
        <span class="property-detail-value">${property.residentId || 'Sin residente asignado'}</span>
      </div>
      <div class="property-detail-item">
        <span class="property-detail-label">Creado</span>
        <span class="property-detail-value">${property.createdAt}</span>
      </div>
      <div class="property-detail-item">
        <span class="property-detail-label">Actualizado</span>
        <span class="property-detail-value">${property.updatedAt}</span>
      </div>
    </div>
  `;
}

async function verDetallePropiedad(propertyId) {
  const modal = document.getElementById('property-detail-modal');
  const detailContent = document.getElementById('property-detail-content');

  if (!modal || !detailContent) {
    return;
  }

  modal.style.display = 'flex';
  detailContent.innerHTML = '<div class="loading-state">Cargando detalle de propiedad...</div>';

  try {
    const property = await cargarDetallePropiedadDesdeApi(propertyId);
    renderDetallePropiedad(property);
  } catch (error) {
    detailContent.innerHTML = `<div class="admin-error-state">${error.message}</div>`;
  }
}

function closePropertyDetail(event, overlay) {
  if (event.target === overlay) {
    closePropertyDetailModal();
  }
}

function closePropertyDetailModal() {
  const modal = document.getElementById('property-detail-modal');
  const detailContent = document.getElementById('property-detail-content');

  if (modal) {
    modal.style.display = 'none';
  }

  if (detailContent) {
    detailContent.innerHTML = '<div class="loading-state">Cargando detalle de propiedad...</div>';
  }
}

function openAmenityModal(mode = 'create', amenityId = null) {
  const modal = document.getElementById('amenity-modal');
  const title = document.getElementById('amenity-modal-title');
  const submitButton = document.getElementById('amenity-submit-btn');
  const form = document.getElementById('amenity-form');

  amenityModalMode = mode;
  selectedAmenityId = amenityId;

  if (form) {
    form.reset();
  }

  if (title) {
    title.textContent = mode === 'edit' ? 'Editar amenidad' : 'Nueva amenidad';
  }

  if (submitButton) {
    submitButton.textContent = mode === 'edit' ? 'Guardar cambios' : 'Guardar amenidad';
  }

  if (mode === 'edit' && amenityId) {
    cargarAmenidadesDesdeApi().then((amenities) => {
      const amenity = amenities.find((item) => item.id === amenityId);

      if (!amenity) {
        showFeedback('Amenidad no encontrada', 'error');
        return;
      }

      document.getElementById('amenity-name').value = amenity.name || '';
      document.getElementById('amenity-description').value = amenity.description || '';
      document.getElementById('amenity-status').value = amenity.status || 'activa';
    }).catch((error) => {
      showFeedback(error.message, 'error');
    });
  }

  if (modal) {
    modal.style.display = 'flex';
  }
}

function closeAmenityModal(event, overlay) {
  if (!event || event.target === overlay) {
    const modal = document.getElementById('amenity-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  }
}

function openNoticeModal() {
  const modal = document.getElementById('notice-modal');
  if (modal) {
    modal.style.display = 'flex';
  }
}

function closeNoticeModal(event, overlay) {
  if (!event || event.target === overlay) {
    const modal = document.getElementById('notice-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  }
}

// ===============================
// INIT
// ===============================

document.addEventListener("DOMContentLoaded", async () => {
  const currentUser = await requireAuth('admin');

  if (!currentUser) {
    return;
  }

  const logoutButton = document.getElementById('logout-btn');
  const amenityForm = document.getElementById('amenity-form');
  const noticeForm = document.getElementById('notice-form');
  const historyStatusFilter = document.getElementById('history-status-filter');
  const historyPriorityFilter = document.getElementById('history-priority-filter');
  const historyPeriodFilter = document.getElementById('history-period-filter');
  const historySearchFilter = document.getElementById('history-search-filter');

  if (logoutButton) {
    logoutButton.addEventListener('click', logout);
  }

  try {
    const propiedades = await cargarPropiedadesDesdeApi();
    cargarPropiedades(propiedades);
  } catch (error) {
    const container = document.getElementById('propiedades-container');
    container.innerHTML = `<div class="admin-error-state">${error.message}</div>`;
  }

  if (amenityForm) {
    amenityForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      try {
        const payload = {
          condominioId: 'CONDO#101',
          name: document.getElementById('amenity-name').value.trim(),
          description: document.getElementById('amenity-description').value.trim(),
          status: document.getElementById('amenity-status').value
        };

        if (amenityModalMode === 'edit' && selectedAmenityId) {
          await actualizarAmenidad(selectedAmenityId, payload);
          showFeedback('Amenidad actualizada correctamente', 'success');
        } else {
          await crearAmenidad(payload);
          showFeedback('Amenidad creada correctamente', 'success');
        }

        amenityForm.reset();
        closeAmenityModal();
        changeTab('servicios');
      } catch (error) {
        showFeedback(error.message, 'error');
      }
    });
  }

  if (noticeForm) {
    noticeForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      try {
        await crearAviso({
          title: document.getElementById('notice-title').value.trim(),
          message: document.getElementById('notice-message').value.trim(),
          audience: document.getElementById('notice-audience').value
        });
        noticeForm.reset();
        closeNoticeModal();
        changeTab('mensajes');
        showFeedback('Aviso publicado correctamente', 'success');
      } catch (error) {
        showFeedback(error.message, 'error');
      }
    });
  }

  [historyStatusFilter, historyPriorityFilter, historyPeriodFilter].forEach((element) => {
    if (element) {
      element.addEventListener('change', actualizarHistorialTickets);
    }
  });

  if (historySearchFilter) {
    historySearchFilter.addEventListener('input', actualizarHistorialTickets);
  }
});

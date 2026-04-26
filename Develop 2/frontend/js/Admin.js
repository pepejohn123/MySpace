const DEFAULT_PROPERTY_IMAGE = 'https://images.unsplash.com/photo-1560448204?auto=format&fit=crop&w=800&q=80';
let amenityModalMode = 'create';
let selectedAmenityId = null;
let propertyModalMode = 'create';
let selectedPropertyId = null;
let ticketsHistoryCache = [];
let visitsCache = [];
let ticketsCache = [];
let reservationsCache = [];
let paymentsFinanzasCache = [];
let conversationsAdminCache = [];
let currentFinanceFilters = {
  property: 'all',
  resident: 'all',
  status: 'all',
  search: ''
};
let financeShellRendered = false;
const exportConfigByTab = {
  reservas: {
    label: 'Exportar reservas',
    endpoint: '/api/exports/reservations',
    filename: 'reservations.xlsx',
    getFilters: () => ({})
  },
  visitas: {
    label: 'Exportar visitas',
    endpoint: '/api/exports/visits',
    filename: 'visits.xlsx',
    getFilters: getVisitsExportFilters
  },
  historial: {
    label: 'Exportar tickets',
    endpoint: '/api/exports/tickets',
    filename: 'tickets.xlsx',
    getFilters: getHistoryExportFilters
  },
  finanzas: {
    label: 'Exportar pagos',
    endpoint: '/api/exports/payments',
    filename: 'payments.xlsx',
    getFilters: getFinanceExportFilters
  }
};

function getAmenityStatusClass(status) {
  return `service-status-${status || 'inactiva'}`;
}

function getTicketPriorityClass(priority) {
  return `ticket-priority-${priority || 'media'}`;
}

function getConversationStatusClass(status) {
  return `conversation-status-${status || 'abierta'}`;
}

function buildPropertyStatusClass(status) {
  if (status === 'ocupada') return 'bg-yellow';
  if (status === 'mantenimiento' || status === 'inactiva') return 'bg-red';
  return 'bg-green';
}

function getApiErrorMessage(errorData, fallbackMessage) {
  return errorData?.error || errorData?.message || fallbackMessage;
}

async function cargarConversacionesAdminDesdeApi() {
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

async function cargarDetalleConversacionAdmin(conversationId) {
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

async function responderConversacionAdmin(conversationId, payload) {
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

async function cerrarConversacionAdmin(conversationId) {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}/api/conversations/${encodeURIComponent(conversationId)}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ status: 'cerrada' })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'No se pudo cerrar la conversación');
  }

  const data = await response.json();
  return data.conversation;
}

function renderAdminConversations(conversations) {
  const container = document.getElementById('admin-conversations-container');

  if (!container) {
    return;
  }

  container.innerHTML = '';

  if (!conversations.length) {
    container.innerHTML = '<div class="admin-empty-state">No hay consultas de residentes todavía.</div>';
    return;
  }

  conversations.forEach((conversation) => {
    const lastMessage = conversation.messages?.[conversation.messages.length - 1];

    container.innerHTML += `
      <div class="admin-conversation-card">
        <div class="admin-conversation-header">
          <div>
            <h4 class="admin-conversation-title-text">${conversation.subject}</h4>
            <div class="admin-conversation-meta">
              <span><strong>Residente:</strong> ${conversation.residentName}</span>
              <span><strong>Actualizado:</strong> ${conversation.updatedAt || conversation.createdAt}</span>
            </div>
          </div>
          <span class="conversation-status-badge ${getConversationStatusClass(conversation.status)}">${conversation.status}</span>
        </div>
        <p class="admin-conversation-preview">${lastMessage?.body || 'Sin mensajes'}</p>
        <div class="service-card-actions">
          <button class="admin-action-btn admin-toolbar-btn" onclick="openAdminConversationModal('${conversation.id}')">Ver conversación</button>
        </div>
      </div>
    `;
  });
}

function renderAdminConversationDetail(conversation) {
  const title = document.getElementById('admin-conversation-title');
  const status = document.getElementById('admin-conversation-status');
  const messages = document.getElementById('admin-conversation-messages');
  const closeButton = document.getElementById('admin-conversation-close-btn');
  const replyForm = document.getElementById('admin-conversation-reply-form');
  const replyInput = document.getElementById('adminConversationReplyInput');

  window.__adminConversationDetail = conversation;

  if (title) {
    title.textContent = conversation.subject;
  }

  if (status) {
    status.innerHTML = `<span class="conversation-status-badge ${getConversationStatusClass(conversation.status)}">${conversation.status}</span>`;
  }

  if (messages) {
    messages.innerHTML = '';
    conversation.messages.forEach((message) => {
      const isMine = message.senderRole === 'admin';
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

  if (closeButton) {
    closeButton.style.display = conversation.status === 'cerrada' ? 'none' : 'inline-flex';
  }

  if (replyForm) {
    replyForm.style.display = conversation.status === 'cerrada' ? 'none' : 'block';
  }
}

async function openAdminConversationModal(conversationId) {
  try {
    const conversation = await cargarDetalleConversacionAdmin(conversationId);
    renderAdminConversationDetail(conversation);
    document.getElementById('admin-conversation-modal').style.display = 'flex';
  } catch (error) {
    showFeedback(error.message, 'error');
  }
}

function closeAdminConversationModal(event, overlay) {
  if (!event || event.target === overlay) {
    const modal = document.getElementById('admin-conversation-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  }
}


function cargarTickets(data) {
    const ticketsContainer = document.getElementById('tickets-container');
    if (!ticketsContainer) return;

    ticketsCache = data;
    let htmlContent = '';

    if (!data.length) {
        ticketsContainer.innerHTML = '<div class="admin-empty-state">No hay tickets registrados todavía.</div>';
        return;
    }

    const priorityColors = { alta: '#ef4444', media: '#f59e0b', baja: '#10b981' };

    data.forEach(ticket => {
        const pColor = priorityColors[ticket.priority] || '#6b7280';

        ticketsContainer.innerHTML += `
            <div class="card" onclick="window.openTicketActionModal('${ticket.id}')" style="cursor: pointer;">

                <div class="card-info" style="pointer-events: none;">
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                        <h3>${ticket.title}</h3>
                        <span style="font-size: 10px; padding: 2px 6px; border-radius: 4px; color: white; background: ${pColor}; text-transform: uppercase; font-weight: bold;">
                            ${ticket.priority || 'baja'}
                        </span>
                    </div>
                    <p><strong>Estado:</strong> <span style="text-transform: capitalize;">${ticket.status}</span></p>
                </div>

            </div>
        `;
    });

    ticketsContainer.innerHTML = htmlContent;
}

window.openTicketActionModal = function(ticketId) {
    let ticket = null;
    if (typeof ticketsCache !== 'undefined') {
        ticket = ticketsCache.find(t => t.id === ticketId);
    }
    if (!ticket && typeof ticketsHistoryCache !== 'undefined') {
        ticket = ticketsHistoryCache.find(t => t.id === ticketId);
    }

    if (!ticket) {
        console.error("❌ No se encontró el ticket en ninguna caché. ID buscado:", ticketId);
        return;
    }

    const modal = document.getElementById('modal-ticket-action');
    if (!modal) {
        console.error("❌ El HTML del modal no existe en esta página.");
        return;
    }

    document.getElementById('ticket-title').textContent = ticket.titulo || ticket.title || 'Sin título';
    document.getElementById('ticket-desc').textContent = ticket.descripcion || ticket.description || 'Sin descripción';
    document.getElementById('ticket-status-select').value = ticket.estado || ticket.status || 'pendiente';
    document.getElementById('ticket-priority-select').value = ticket.prioridad || ticket.priority || 'baja';

    const saveBtn = document.getElementById('ticket-save-btn');

    saveBtn.onclick = async (e) => {
        if(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        const newStatus = document.getElementById('ticket-status-select').value;
        const newPriority = document.getElementById('ticket-priority-select').value;

        setButtonLoadingState(saveBtn, true, 'Guardando...');
        await actualizarEstadoTicket(ticket.id, newStatus, newPriority);
        modal.style.display = 'none';
        setButtonLoadingState(saveBtn, false);
    };

    modal.style.display = 'flex';
}

async function actualizarEstadoTicket(ticketId, nuevoEstado, nuevaPrioridad) {
    const token = getToken();
    try {
        const response = await fetch(`${API_BASE_URL}/api/tickets/${encodeURIComponent(ticketId)}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                status: nuevoEstado,
                priority: nuevaPrioridad
            })
        });

        if (!response.ok) throw new Error('Error al actualizar');

        const ticketsFrescos = await cargarTicketsDesdeApi();
        cargarTickets(ticketsFrescos);

        if (typeof ticketsHistoryCache !== 'undefined') {
            const index = ticketsHistoryCache.findIndex(t => t.id === ticketId);

            if (index !== -1) {
                ticketsHistoryCache[index].estado = nuevoEstado;
                ticketsHistoryCache[index].status = nuevoEstado;
                ticketsHistoryCache[index].prioridad = nuevaPrioridad;
                ticketsHistoryCache[index].priority = nuevaPrioridad;

                if (typeof actualizarHistorialTickets === 'function') {
                    actualizarHistorialTickets();
                }
            }
        }

        showFeedback('Ticket actualizado correctamente', 'success');
    } catch (error) {
        showFeedback(error.message, 'error');
    }
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
      <div class="card" onclick="window.openTicketActionModal('${ticket.id}')" style="cursor: pointer;">

        <div class="card-info" style="pointer-events: none;">
          <h3>${ticket.titulo || ticket.title}</h3>
          <p>${ticket.descripcion || ticket.description}</p>
          <div class="history-ticket-meta">
            <span><strong>Estado:</strong> ${ticket.estado || ticket.status}</span>
            <span><strong>Creado:</strong> ${ticket.createdAt}</span>
            <span><strong>Cerrado:</strong> ${ticket.closedAt || '—'}</span>
            <span><strong>Propiedad:</strong> ${ticket.propertyId || '—'}</span>
          </div>
          <span class="ticket-priority-badge ${getTicketPriorityClass(ticket.prioridad || ticket.priority)}">${ticket.prioridad || ticket.priority || 'baja'}</span>
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
  if (!reservasContainer) return;

  reservationsCache = data;
  reservasContainer.innerHTML = '';

  if (!data.length) {
    reservasContainer.innerHTML = '<div class="admin-empty-state">No hay reservas registradas todavía.</div>';
    return;
  }

  data.forEach((reserva) => {
    reservasContainer.innerHTML += `
      <div class="card" onclick="openReservaActionModal('${reserva.id}')" style="cursor: pointer;">
        <div class="card-info">
          <h3>${reserva.amenidad}</h3>
          <p><strong>Fecha:</strong> ${reserva.fecha}</p>
          <p><strong>Horario:</strong> ${reserva.horario}</p>
          <p><strong>Estado:</strong> <span class="badge ${reserva.estado === 'aprobada' ? 'bg-green' : (reserva.estado === 'pendiente' ? 'bg-yellow' : 'bg-red')}">${reserva.estado}</span></p>
        </div>
      </div>
    `;
  });
}

function openReservaActionModal(reservaId) {
  window.openReservaActionModal = function(reservaId) {
  console.log("Clic en reserva ID:", reservaId);
  console.log("Data en caché:", reservationsCache);

  const reserva = reservationsCache.find(r => r.id === reservaId);

  if (!reserva) {
      console.error("Reserva no encontrada en la caché. Verifica los IDs.");
      return;
  }

  document.getElementById('res-area').textContent = reserva.amenidad;
  document.getElementById('res-user').textContent = reserva.residente || 'Cargando...';
  document.getElementById('res-date').textContent = `${reserva.fecha} | ${reserva.horario}`;
  document.getElementById('res-status').textContent = reserva.estado;

  const actionBtn = document.getElementById('reserva-toggle-btn');

  const nextStatus = reserva.estado === 'aprobada' ? 'rechazada' : 'aprobada';
  actionBtn.textContent = nextStatus === 'aprobada' ? 'Aprobar Reserva' : 'Rechazar Reserva';
  actionBtn.style.background = nextStatus === 'aprobada' ? '#059669' : '#DC2626';

  actionBtn.onclick = async () => {
    setButtonLoadingState(actionBtn, true, 'Procesando...');
    await actualizarEstadoReserva(reserva.id, nextStatus);
    document.getElementById('modal-reserva-action').style.display = 'none';
    setButtonLoadingState(actionBtn, false);
  };

  document.getElementById('modal-reserva-action').style.display = 'flex';
}
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

function mapVisitToAdminCard(visit) {
  return {
    id: visit.id,
    visitante: visit.visitorName,
    fecha: visit.visitDate,
    codigo: visit.accessCode,
    estado: visit.status,
    propiedad: visit.propertyId || 'Sin propiedad',
    residente: visit.residentName || visit.residentId || 'Sin residente'
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
    propiedadId: payment.propertyId || null,
    propiedadNombre: payment.propertyName || payment.propertyId || 'Sin propiedad',
    residenteId: payment.residentId || null,
    residenteNombre: payment.residentName || payment.residentId || 'Sin residente',
    fecha: payment.paymentDate || payment.createdAt || 'Sin fecha',
    siguienteEstado: transition.next,
    siguienteEstadoLabel: transition.label
  };
}

function getFinanceExportFilters() {
  return {
    property: document.getElementById('finance-property-filter')?.value || 'all',
    resident: document.getElementById('finance-resident-filter')?.value || 'all',
    status: document.getElementById('finance-status-filter')?.value || 'all',
    search: document.getElementById('finance-search-filter')?.value || ''
  };
}

function getHistoryExportFilters() {
  return {
    status: document.getElementById('history-status-filter')?.value || 'all',
    priority: document.getElementById('history-priority-filter')?.value || 'all',
    period: document.getElementById('history-period-filter')?.value || 'all',
    search: document.getElementById('history-search-filter')?.value || ''
  };
}

function getVisitsExportFilters() {
  return {
    status: document.getElementById('visit-status-filter')?.value || 'all',
    search: document.getElementById('visit-search-filter')?.value || ''
  };
}

async function descargarExcel(endpoint, filename, filters = {}) {
  const token = getToken();
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value && value !== 'all') {
      params.set(key, value);
    }
  });

  const requestUrl = params.toString() ? `${API_BASE_URL}${endpoint}?${params.toString()}` : `${API_BASE_URL}${endpoint}`;

  const response = await fetch(requestUrl, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'No se pudo descargar el archivo');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

function updateExportButtonForTab(tabName) {
  const exportButton = document.getElementById('export-context-btn');

  if (!exportButton) {
    return;
  }

  const exportConfig = exportConfigByTab[tabName];

  if (!exportConfig) {
    exportButton.classList.add('admin-hidden');
    exportButton.textContent = 'Exportar';
    delete exportButton.dataset.endpoint;
    delete exportButton.dataset.filename;
    return;
  }

  exportButton.textContent = exportConfig.label;
  exportButton.dataset.endpoint = exportConfig.endpoint;
  exportButton.dataset.filename = exportConfig.filename;
  exportButton.classList.remove('admin-hidden');
}

function filtrarPagosFinanzas(payments, filters) {
  return payments.filter((payment) => {
    const matchesProperty = filters.property === 'all' || payment.propiedadId === filters.property;
    const matchesResident = filters.resident === 'all' || payment.residenteId === filters.resident;
    const matchesStatus = filters.status === 'all' || payment.estado === filters.status;
    const matchesSearch = !filters.search || payment.concepto.toLowerCase().includes(filters.search.toLowerCase());

    return matchesProperty && matchesResident && matchesStatus && matchesSearch;
  });
}

function renderFinanceSummarySection(summary) {
  return `
    <section class="finance-summary-section">
      <div class="finance-section-header">
        <div>
          <h3 class="messages-section-title">Resumen financiero</h3>
          <p class="messages-section-copy">Vista general de montos acumulados del condominio.</p>
        </div>
      </div>
      <div class="finance-summary-grid">
        <div class="fin-card"><p class="fin-label">Total registrado</p><p class="fin-amount">$${summary.total}</p></div>
        <div class="fin-card"><p class="fin-label">Pagado</p><p class="fin-amount text-success">$${summary.pagado}</p></div>
        <div class="fin-card"><p class="fin-label">En revisión</p><p class="fin-amount text-dark">$${summary.enRevision}</p></div>
        <div class="fin-card"><p class="fin-label">Por cobrar</p><p class="fin-amount text-danger">$${summary.porCobrar}</p></div>
      </div>
    </section>
  `;
}

function renderFinanceIndicatorsSection(payments) {
  return `
    <section class="finance-summary-section secondary-summary-section">
      <div class="finance-section-header">
        <div>
          <h3 class="messages-section-title">Indicadores rápidos</h3>
          <p class="messages-section-copy">Conteo de pagos según su situación actual.</p>
        </div>
      </div>
      <div class="finance-summary-grid secondary-summary-grid">
        <div class="fin-card compact"><p class="fin-label">Pagos listados</p><p class="fin-amount">${payments.length}</p></div>
        <div class="fin-card compact"><p class="fin-label">Pagados</p><p class="fin-amount text-success">${payments.filter((payment) => payment.estado === 'pagado').length}</p></div>
        <div class="fin-card compact"><p class="fin-label">En revisión</p><p class="fin-amount">${payments.filter((payment) => payment.estado === 'en_revision').length}</p></div>
        <div class="fin-card compact"><p class="fin-label">Pendientes/Rechazados</p><p class="fin-amount text-danger">${payments.filter((payment) => payment.estado === 'pendiente' || payment.estado === 'rechazado').length}</p></div>
      </div>
    </section>
  `;
}

function renderFiltrosFinanzas() {
  return `
    <section class="finance-filters-section">
      <div class="finance-section-header">
        <div>
          <h3 class="messages-section-title">Filtros de pagos</h3>
          <p class="messages-section-copy">Filtra por propiedad o por residente, además de estado y concepto.</p>
        </div>
      </div>
      <div class="finance-filter-hint">Solo puedes filtrar por <strong>propiedad</strong> o por <strong>residente</strong> a la vez.</div>
      <div class="finance-filters-grid">
        <select id="finance-property-filter" class="modal-input"></select>
        <select id="finance-resident-filter" class="modal-input"></select>
        <select id="finance-status-filter" class="modal-input">
          <option value="all">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="en_revision">En revisión</option>
          <option value="pagado">Pagado</option>
          <option value="rechazado">Rechazado</option>
        </select>
        <input id="finance-search-filter" class="modal-input" type="text" placeholder="Buscar por concepto" />
      </div>
    </section>
  `;
}

function renderResultadosFinanzasShell() {
  return `
    <section class="finance-results-section">
      <div class="finance-section-header finance-results-header">
        <div>
          <h3 class="messages-section-title">Resultados de pagos</h3>
          <p class="messages-section-copy" id="finance-results-copy">0 pago(s) encontrados con los filtros actuales.</p>
        </div>
      </div>
      <div class="finance-results-grid" id="finance-results-grid"></div>
    </section>
  `;
}

function populateFinanceFilters() {
  const propertyFilter = document.getElementById('finance-property-filter');
  const residentFilter = document.getElementById('finance-resident-filter');
  const statusFilter = document.getElementById('finance-status-filter');
  const searchFilter = document.getElementById('finance-search-filter');

  if (propertyFilter) {
    const propertyOptions = [...new Map(paymentsFinanzasCache.map((payment) => [payment.propiedadId, payment.propiedadNombre])).entries()];
    propertyFilter.innerHTML = '<option value="all">Todas las propiedades</option>';
    propertyOptions.forEach(([id, name]) => {
      propertyFilter.innerHTML += `<option value="${id}">${name}</option>`;
    });
    propertyFilter.value = currentFinanceFilters.property;
  }

  if (residentFilter) {
    const residentOptions = [...new Map(paymentsFinanzasCache.map((payment) => [payment.residenteId, payment.residenteNombre])).entries()];
    residentFilter.innerHTML = '<option value="all">Todos los residentes</option>';
    residentOptions.forEach(([id, name]) => {
      residentFilter.innerHTML += `<option value="${id}">${name}</option>`;
    });
    residentFilter.value = currentFinanceFilters.resident;
  }

  if (statusFilter) {
    statusFilter.value = currentFinanceFilters.status;
  }

  if (searchFilter) {
    searchFilter.value = currentFinanceFilters.search;
  }

  syncFinanceFilterLock();
}

function syncFinanceFilterLock() {
  const propertyFilter = document.getElementById('finance-property-filter');
  const residentFilter = document.getElementById('finance-resident-filter');

  if (!propertyFilter || !residentFilter) {
    return;
  }

  const propertySelected = currentFinanceFilters.property !== 'all';
  const residentSelected = currentFinanceFilters.resident !== 'all';

  residentFilter.disabled = propertySelected;
  propertyFilter.disabled = residentSelected;
}

function getCurrentFinanceFiltersFromDom() {
  return {
    property: document.getElementById('finance-property-filter')?.value || 'all',
    resident: document.getElementById('finance-resident-filter')?.value || 'all',
    status: document.getElementById('finance-status-filter')?.value || 'all',
    search: document.getElementById('finance-search-filter')?.value || ''
  };
}

function renderFinanceResults(filteredPayments) {
  const resultsGrid = document.getElementById('finance-results-grid');
  const resultsCopy = document.getElementById('finance-results-copy');

  if (!resultsGrid || !resultsCopy) {
    return;
  }

  resultsGrid.innerHTML = '';
  resultsCopy.textContent = `${filteredPayments.length} pago(s) encontrados con los filtros actuales.`;

  if (!filteredPayments.length) {
    resultsCopy.textContent = 'No se encontraron coincidencias con los filtros seleccionados.';
    resultsGrid.innerHTML = '<div class="admin-empty-state">No hay pagos que coincidan con los filtros seleccionados.</div>';
    return;
  }

  filteredPayments.forEach((pago) => {
    resultsGrid.innerHTML += `
      <div class="card finance-payment-card">
        <div class="card-info">
          <h3>${pago.concepto}</h3>
          <p><strong>Propiedad:</strong> ${pago.propiedadNombre}</p>
          <p><strong>Residente:</strong> ${pago.residenteNombre}</p>
          <p><strong>Fecha:</strong> ${pago.fecha}</p>
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

function applyFinanceFilters() {
  currentFinanceFilters = getCurrentFinanceFiltersFromDom();
  const filteredPayments = filtrarPagosFinanzas(paymentsFinanzasCache, currentFinanceFilters);
  const summaryContainer = document.getElementById('finance-summary-wrapper');
  const indicatorsContainer = document.getElementById('finance-indicators-wrapper');

  if (summaryContainer) {
    summaryContainer.innerHTML = renderFinanceSummarySection(window.__financeSummaryCache || { total: 0, pagado: 0, enRevision: 0, porCobrar: 0 });
  }

  if (indicatorsContainer) {
    indicatorsContainer.innerHTML = renderFinanceIndicatorsSection(filteredPayments);
  }

  syncFinanceFilterLock();
  renderFinanceResults(filteredPayments);
}

function bindFinanceFilters() {
  const propertyFilter = document.getElementById('finance-property-filter');
  const residentFilter = document.getElementById('finance-resident-filter');
  const statusFilter = document.getElementById('finance-status-filter');
  const searchFilter = document.getElementById('finance-search-filter');

  if (propertyFilter) {
    propertyFilter.addEventListener('change', () => {
      if (propertyFilter.value !== 'all') {
        currentFinanceFilters.resident = 'all';
        if (residentFilter) {
          residentFilter.value = 'all';
        }
      }
      applyFinanceFilters();
    });
  }

  if (residentFilter) {
    residentFilter.addEventListener('change', () => {
      if (residentFilter.value !== 'all') {
        currentFinanceFilters.property = 'all';
        if (propertyFilter) {
          propertyFilter.value = 'all';
        }
      }
      applyFinanceFilters();
    });
  }

  if (statusFilter) {
    statusFilter.addEventListener('change', applyFinanceFilters);
  }

  if (searchFilter) {
    searchFilter.addEventListener('input', applyFinanceFilters);
  }
}

function actualizarVistaFinanzas() {
  const finanzasContainer = document.getElementById('finanzas-container');

  if (!finanzasContainer) {
    return;
  }

  if (!financeShellRendered) {
    finanzasContainer.innerHTML = `
      <div class="finance-dashboard-layout">
        <div id="finance-summary-wrapper"></div>
        <div id="finance-indicators-wrapper"></div>
        <div id="finance-filters-wrapper">${renderFiltrosFinanzas()}</div>
        <div id="finance-results-wrapper">${renderResultadosFinanzasShell()}</div>
      </div>
    `;
    populateFinanceFilters();
    bindFinanceFilters();
    financeShellRendered = true;
  }

  applyFinanceFilters();
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
  return (data.visits || []).map(mapVisitToAdminCard);
}

async function validarVisitaPorCodigo(accessCode) {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}/api/visits/${encodeURIComponent(accessCode)}/validate`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'No se pudo validar la visita');
  }

  const data = await response.json();
  return mapVisitToAdminCard(data.visit);
}

function renderVisitas(visits) {
  const visitsContainer = document.getElementById('visits-container');

  if (!visitsContainer) {
    return;
  }

  visitsContainer.innerHTML = '';

  if (!visits.length) {
    visitsContainer.innerHTML = '<div class="admin-empty-state">No hay visitas registradas todavía.</div>';
    return;
  }

  visits.forEach((visit) => {
    visitsContainer.innerHTML += `
      <div class="card visit-card">
        <div class="card-info">
          <h3>${visit.visitante}</h3>
          <div class="visit-card-meta">
            <span><strong>Fecha:</strong> ${visit.fecha}</span>
            <span><strong>Código:</strong> ${visit.codigo}</span>
            <span><strong>Propiedad:</strong> ${visit.propiedad}</span>
            <span><strong>Residente:</strong> ${visit.residente}</span>
          </div>
          <span class="visit-status-badge visit-status-${visit.estado}">${visit.estado}</span>
          ${visit.estado === 'pendiente' ? `
            <div class="visit-card-actions">
              <button class="admin-action-btn" onclick="validarVisitaDesdeCard('${visit.codigo}')">Validar visita</button>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  });
}

function filtrarVisitas(visits, filters) {
  return visits.filter((visit) => {
    const matchesStatus = filters.status === 'all' || visit.estado === filters.status;
    const searchTarget = `${visit.visitante} ${visit.codigo}`.toLowerCase();
    const matchesSearch = !filters.search || searchTarget.includes(filters.search.toLowerCase());

    return matchesStatus && matchesSearch;
  });
}

function actualizarVistaVisitas() {
  const filters = {
    status: document.getElementById('visit-status-filter')?.value || 'all',
    search: document.getElementById('visit-search-filter')?.value || ''
  };

  const filteredVisits = filtrarVisitas(visitsCache, filters);
  renderVisitas(filteredVisits);
}

async function validarVisitaDesdeCard(accessCode) {
  try {
    const visit = await validarVisitaPorCodigo(accessCode);
    renderVisitValidationResult(visit);
    visitsCache = await cargarVisitasDesdeApi();
    actualizarVistaVisitas();
    showFeedback('Acceso validado correctamente', 'success');
  } catch (error) {
    renderVisitValidationResult(error.message, true);
    showFeedback(error.message, 'error');
  }
}

function renderVisitValidationResult(visit, isError = false) {
  const resultContainer = document.getElementById('visit-validation-result');

  if (!resultContainer) {
    return;
  }

  if (isError) {
    resultContainer.innerHTML = `<div class="admin-error-state">${visit}</div>`;
    return;
  }

  resultContainer.innerHTML = `
    <div class="visit-validation-card visit-validation-${visit.estado}">
      <h4>${visit.visitante}</h4>
      <div class="visit-card-meta">
        <span><strong>Fecha:</strong> ${visit.fecha}</span>
        <span><strong>Código:</strong> ${visit.codigo}</span>
        <span><strong>Propiedad:</strong> ${visit.propiedad}</span>
        <span><strong>Residente:</strong> ${visit.residente}</span>
      </div>
      <span class="visit-status-badge visit-status-${visit.estado}">${visit.estado}</span>
    </div>
  `;
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
      throw new Error(errorData.error || errorData.message || 'No se pudo actualizar la reserva');
    }

    const modal = document.getElementById('modal-reserva-action');
    if (modal) {
        modal.style.display = 'none';
    }

    const reservasFrescas = await cargarReservasDesdeApi();
    cargarReservas(reservasFrescas);

    showFeedback(`Reserva marcada como ${nextStatus}`, 'success');
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
  const visitsWrapper = document.getElementById('visits-wrapper');
  const avisosContainer = document.getElementById('avisos-container');
  const serviciosContainer = document.getElementById('servicios-container');
  const archivedAvisosContainer = document.getElementById('archived-avisos-container');
  const conversationsContainer = document.getElementById('admin-conversations-container');
  const messagesWrapper = document.getElementById('messages-wrapper');
  const closedTicketsContainer = document.getElementById('closed-tickets-container');
  const ticketsHistoryWrapper = document.getElementById('tickets-history-wrapper');
  const openPropertyFormButton = document.getElementById('open-property-form-btn');

  if (!title || !propertyContainer || !ticketsContainer || !reservasContainer || !finanzasContainer || !visitsWrapper || !avisosContainer || !serviciosContainer || !archivedAvisosContainer || !conversationsContainer || !messagesWrapper || !closedTicketsContainer || !ticketsHistoryWrapper) {
    return;
  }

  updateExportButtonForTab(tabName);

  propertyContainer.classList.add('admin-hidden');
  ticketsContainer.classList.add('admin-hidden');
  reservasContainer.classList.add('admin-hidden');
  finanzasContainer.classList.add('admin-hidden');
  visitsWrapper.classList.add('admin-hidden');
  avisosContainer.classList.add('admin-hidden');
  serviciosContainer.classList.add('admin-hidden');
  archivedAvisosContainer.classList.add('admin-hidden');
  messagesWrapper.classList.add('admin-hidden');
  closedTicketsContainer.classList.add('admin-hidden');
  ticketsHistoryWrapper.classList.add('admin-hidden');

  if (openPropertyFormButton) {
    if (tabName === 'propiedades') {
      openPropertyFormButton.classList.remove('admin-hidden');
    } else {
      openPropertyFormButton.classList.add('admin-hidden');
    }
  }

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
    Promise.all([cargarTicketsDesdeApi(), cargarAvisosDesdeApi(), cargarConversacionesAdminDesdeApi()])
      .then(([tickets, avisos, conversations]) => {
        conversationsAdminCache = conversations;
        cargarTickets(tickets);
        cargarTicketsCerradosRecientes(tickets);
        cargarAvisos(avisos);
        cargarAvisosArchivados(avisos);
        renderAdminConversations(conversations);
      })
      .catch((error) => {
        ticketsContainer.innerHTML = `<div class="admin-error-state">${error.message}</div>`;
        closedTicketsContainer.innerHTML = `<div class="admin-error-state">${error.message}</div>`;
        avisosContainer.innerHTML = `<div class="admin-error-state">${error.message}</div>`;
        archivedAvisosContainer.innerHTML = `<div class="admin-error-state">${error.message}</div>`;
        conversationsContainer.innerHTML = `<div class="admin-error-state">${error.message}</div>`;
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

  if (tabName === 'visitas') {
    title.textContent = 'Control de Visitas';
    visitsWrapper.classList.remove('admin-hidden');
    const visitsContainer = document.getElementById('visits-container');
    if (visitsContainer) {
      setLoadingState('visits-container', 'Cargando visitas...');
    }

    cargarVisitasDesdeApi()
      .then((visits) => {
        visitsCache = visits;
        actualizarVistaVisitas();
      })
      .catch((error) => {
        if (visitsContainer) {
          visitsContainer.innerHTML = `<div class="admin-error-state">${error.message}</div>`;
        }
      });
    return;
  }

  if (tabName === 'finanzas') {
    title.textContent = 'Panel Financiero';
    finanzasContainer.classList.remove('admin-hidden');
    setLoadingState('finanzas-container', 'Cargando finanzas...');
    cargarPagosDesdeApi()
      .then(({ payments, summary }) => {
        paymentsFinanzasCache = payments;
        window.__financeSummaryCache = summary;
        actualizarVistaFinanzas();
      })
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
      <img src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=500&q=60">
      <span class="status-badge ${buildPropertyStatusClass(p.status)}">${p.status || 'disponible'}</span>
    </div>
    <div class="card-info">
      <h3>${p.name}</h3>

      <p style="color: #666; font-size: 0.9em;">
        ${p.residentName ? `👤 ${p.residentName}` : '🏠 Sin residente'}
      </p>
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
    residente: property.residentName || property.residentId || 'Nombre de residente no encontrado',
    building: property.building || 'General',
    status: property.status || 'disponible',
    imagen: property.imagen || "DEFAULT_PROPERTY_IMAGE"
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
    throw new Error(getApiErrorMessage(errorData, 'No se pudieron cargar las propiedades'));
  }

  const data = await response.json();
  const properties = Array.isArray(data) ? data : (data.properties || []);

  // 🚨 EL FIX: Devolvemos los DATOS PUROS, no texto HTML
  return properties;
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
    throw new Error(getApiErrorMessage(errorData, 'No se pudo cargar el detalle de la propiedad'));
  }

  const data = await response.json();
  return data.property || data;
}

async function crearPropiedad(payload) {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}/api/properties`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'No se pudo crear la propiedad');
  }

  return response.json();
}

async function actualizarPropiedad(propertyId, payload) {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}/api/properties/${encodeURIComponent(propertyId)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'No se pudo actualizar la propiedad');
  }

  return response.json();
}

async function eliminarPropiedad(propertyId) {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}/api/properties/${encodeURIComponent(propertyId)}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'No se pudo eliminar la propiedad');
  }

  return response.json();
}

async function asignarResidentePropiedad(propertyId, residentId, residentName) {
  const token = getToken();

  const payload = {
      residentId: residentId !== null ? residentId : null,
      residentName: residentName !== null ? residentName : null
  };

  const response = await fetch(`${API_BASE_URL}/api/properties/${encodeURIComponent(propertyId)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'No se pudo actualizar la propiedad');
  }

  return response.json();
}

function formatearFechaLegible(fechaIso) {
  if (!fechaIso) return 'N/A';
  const fecha = new Date(fechaIso);
  return fecha.toLocaleString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function renderDetallePropiedad(property) {
  const detailContent = document.getElementById('property-detail-content');

  if (!detailContent) {
    return;
  }

  const fechaCreacion = formatearFechaLegible(property.createdAt);
  const fechaActualizacion = formatearFechaLegible(property.updatedAt);

  detailContent.innerHTML = `
    <div class="property-detail-header">
      <h3 class="property-detail-title">${property.name}</h3>
      <span class="badge ${buildPropertyStatusClass(property.status)}">${property.status || 'disponible'}</span>
    </div>
    <div class="property-detail-grid">
      <div class="property-detail-item">
        <span class="property-detail-label">ID</span>
        <span class="property-detail-value">${property.id}</span>
      </div>
      <div class="property-detail-item">
        <span class="property-detail-label">Edificio / sección</span>
        <span class="property-detail-value">${property.building || 'General'}</span>
      </div>
      <div class="property-detail-item">
        <span class="property-detail-label">Condominio</span>
        <span class="property-detail-value">${property.condominioId || property.PK || 'Sin condominio'}</span>
      </div>
      <div class="property-detail-item">
        <span class="property-detail-label">Residente asignado</span>
        <span class="property-detail-value">${property.residentName || property.residentId || 'Nombre de residente no disponible'}</span>
      </div>
      <div class="property-detail-item">
        <span class="property-detail-label">Creado</span>
        <span class="property-detail-value">${fechaCreacion}</span>
      </div>
      <div class="property-detail-item">
        <span class="property-detail-label">Actualizado</span>
        <span class="property-detail-value">${fechaActualizacion}</span>
      </div>
    </div>
    <div class="service-card-actions" style="margin-top:20px;">
      <button class="admin-secondary-btn" onclick="openPropertyFormModal('edit', '${property.id}')">Editar</button>
      <button class="admin-secondary-btn" onclick="openAssignResidentModal('${property.id}', '${property.residentId || ''}')">Asignar residente</button>
      <button class="admin-danger-btn" onclick="confirmarEliminarPropiedad('${property.id}')">Eliminar</button>
    </div>
  `;
}

function openPropertyFormModal(mode = 'create', propertyId = null) {
  const modal = document.getElementById('property-form-modal');
  const title = document.getElementById('property-form-title');
  const submitButton = document.getElementById('property-form-submit-btn');
  const form = document.getElementById('property-form');

  propertyModalMode = mode;
  selectedPropertyId = propertyId;

  if (form) {
    form.reset();
  }

  if (title) {
    title.textContent = mode === 'edit' ? 'Editar propiedad' : 'Nueva propiedad';
  }

  if (submitButton) {
    submitButton.textContent = mode === 'edit' ? 'Guardar cambios' : 'Guardar propiedad';
  }

  if (mode === 'edit' && propertyId) {
    cargarDetallePropiedadDesdeApi(propertyId)
      .then((property) => {
        document.getElementById('property-form-name').value = property.name || '';
        document.getElementById('property-form-building').value = property.building || '';
        document.getElementById('property-form-status').value = property.status || 'disponible';
      })
      .catch((error) => showFeedback(error.message, 'error'));
  }

  if (modal) {
    modal.style.display = 'flex';
  }
}

async function handlePropertyFormSubmit(event) {
  if (event) event.preventDefault();

  const name = document.getElementById('property-form-name').value;
  const building = document.getElementById('property-form-building').value;
  const status = document.getElementById('property-form-status').value;

  const payload = {
    name: name,
    building: building || 'General',
    status: status || 'disponible'
  };

  try {
    if (propertyModalMode === 'edit' && selectedPropertyId) {
      await actualizarPropiedad(selectedPropertyId, payload);
    } else {
      await crearPropiedad(payload);
    }

    // 1. Cerramos el modal primero
    const modal = document.getElementById('property-form-modal');
    if (modal) modal.style.display = 'none';

    // 2. 🚨 TRUCO DE REFRESCO: Esperamos un breve momento para asegurar consistencia en AWS
    // A veces DynamoDB tarda milisegundos en propagar el cambio
    await new Promise(resolve => setTimeout(resolve, 500));

    // 3. Forzamos la recarga completa de los datos
    const propiedadesFrescas = await cargarPropiedadesDesdeApi();

    // 4. Limpiamos y redibujamos
    if (typeof cargarPropiedades === 'function') {
        cargarPropiedades(propiedadesFrescas);
    } else if (typeof renderizarPropiedades === 'function') {
        cargarPropiedades(propiedadesFrescas);
    }

    // 5. Si el detalle estaba abierto, lo actualizamos también
    const detailModal = document.getElementById('property-detail-modal');
    if (detailModal && detailModal.style.display === 'flex' && selectedPropertyId) {
        verDetallePropiedad(selectedPropertyId);
    }

    showFeedback('¡Información actualizada en pantalla!', 'success');

  } catch (error) {
    showFeedback(error.message, 'error');
  }
}

function closePropertyFormModal(event, overlay) {
  if (!event || event.target === overlay) {
    const modal = document.getElementById('property-form-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  }
}

async function openAssignResidentModal(propertyId) {
  const modal = document.getElementById('assign-resident-modal');
  const selectElement = document.getElementById('assign-resident-id');
  const propertyInput = document.getElementById('assign-resident-property-id');

  propertyInput.value = propertyId;
  modal.style.display = 'flex';

  selectElement.innerHTML = '<option value="">Cargando residentes...</option>';
  selectElement.disabled = true;

  try {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/api/residents?unassigned=true`, {
  headers: { 'Authorization': `Bearer ${token}` }
});

    const data = await response.json();
    const residentes = data.residents || [];

    if (residentes.length === 0) {
      selectElement.innerHTML = `
        <option value="">No hay residentes disponibles</option>
        <option value="UNASSIGN">-- Sin residente (Desasignar) --</option>
      `;
    } else {
      selectElement.innerHTML = `
        <option value="">-- Selecciona una opción --</option>
        <option value="UNASSIGN">-- Sin residente (Desasignar) --</option>
      `;
      residentes.forEach(res => {
        if (!res.id || !res.name || res.name === 'undefined') return;

        const option = document.createElement('option');
        option.value = res.id;
        option.textContent = res.name;
        selectElement.appendChild(option);
      });
      selectElement.disabled = false;
    }
  } catch (error) {
    showFeedback('Error al cargar residentes', 'error');
    selectElement.innerHTML = '<option value="">Error al cargar</option>';
  }
}


async function confirmarAsignacionResidente(event) {
  if (event) event.preventDefault();

  const select = document.getElementById('assign-resident-id');
  const propId = document.getElementById('assign-resident-property-id').value;

  let resId = select.value;
  let resName = null;

  if (resId === "UNASSIGN" || resId === "") {
      resId = null;
  } else {
      resName = select.options[select.selectedIndex].textContent;
  }

  console.log("🚀 Payload a enviar:", { propId, resId, resName });

  try {
    await asignarResidentePropiedad(propId, resId, resName);

    const modal = document.getElementById('assign-resident-modal');
    if (modal) modal.style.display = 'none';

    const properties = await cargarPropiedadesDesdeApi();
    if (typeof renderizarPropiedades === 'function') {
        renderizarPropiedades(properties);
    } else if (typeof cargarPropiedades === 'function') {
        cargarPropiedades(properties);
    }

    const detailModal = document.getElementById('property-detail-modal');
    if (detailModal && detailModal.style.display === 'flex') {
        verDetallePropiedad(propId);
    }

    showFeedback(resId ? 'Residente asignado' : 'Propiedad liberada', 'success');
  } catch (e) {
    showFeedback(e.message, 'error');
  }
}

function closeAssignResidentModal(event, overlay) {
  if (!event || event.target === overlay) {
    const modal = document.getElementById('assign-resident-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  }
}

async function confirmarEliminarPropiedad(propertyId) {
  if (!window.confirm('¿Seguro que quieres dar de baja esta propiedad?')) {
    return;
  }

  try {
    await eliminarPropiedad(propertyId);
    closePropertyDetailModal();
    const propiedades = await cargarPropiedadesDesdeApi();
    cargarPropiedades(propiedades);
    showFeedback('Propiedad actualizada correctamente', 'success');
  } catch (error) {
    showFeedback(error.message, 'error');
  }
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
  const openPropertyFormButton = document.getElementById('open-property-form-btn');
  const propertyForm = document.getElementById('property-form');
  const assignResidentForm = document.getElementById('assign-resident-form');
  const amenityForm = document.getElementById('amenity-form');
  const noticeForm = document.getElementById('notice-form');
  const historyStatusFilter = document.getElementById('history-status-filter');
  const historyPriorityFilter = document.getElementById('history-priority-filter');
  const historyPeriodFilter = document.getElementById('history-period-filter');
  const historySearchFilter = document.getElementById('history-search-filter');
  const validateVisitButton = document.getElementById('validate-visit-btn');
  const visitAccessCodeInput = document.getElementById('visit-access-code-input');
  const visitStatusFilter = document.getElementById('visit-status-filter');
  const visitSearchFilter = document.getElementById('visit-search-filter');
  const exportContextButton = document.getElementById('export-context-btn');
  const adminConversationReplyForm = document.getElementById('admin-conversation-reply-form');
  const adminConversationCloseButton = document.getElementById('admin-conversation-close-btn');

  if (logoutButton) {
    logoutButton.addEventListener('click', logout);
  }

  if (openPropertyFormButton) {
    openPropertyFormButton.addEventListener('click', () => openPropertyFormModal('create'));
  }

  if (propertyForm) {
    propertyForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const payload = {
        name: document.getElementById('property-form-name').value.trim(),
        building: document.getElementById('property-form-building').value.trim(),
        status: document.getElementById('property-form-status').value
      };

      if (!payload.name) {
        showFeedback('El nombre de la propiedad es requerido', 'error');
        return;
      }

      try {
        setButtonLoadingState(document.getElementById('property-form-submit-btn'), true, propertyModalMode === 'edit' ? 'Guardando...' : 'Creando...');

        if (propertyModalMode === 'edit' && selectedPropertyId) {
          await actualizarPropiedad(selectedPropertyId, payload);
          showFeedback('Propiedad actualizada correctamente', 'success');
        } else {
          await crearPropiedad(payload);
          showFeedback('Propiedad creada correctamente', 'success');
        }

        closePropertyFormModal();
        const propiedades = await cargarPropiedadesDesdeApi();
        cargarPropiedades(propiedades);
      } catch (error) {
        showFeedback(error.message, 'error');
      } finally {
        setButtonLoadingState(document.getElementById('property-form-submit-btn'), false);
      }
    });
  }

  if (assignResidentForm) {
    assignResidentForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const propertyId = document.getElementById('assign-resident-property-id').value;
      const residentId = document.getElementById('assign-resident-id').value.trim();

      try {
        await asignarResidentePropiedad(propertyId, residentId || null);
        closeAssignResidentModal();
        const property = await cargarDetallePropiedadDesdeApi(propertyId);
        renderDetallePropiedad(property);
        const propiedades = await cargarPropiedadesDesdeApi();
        cargarPropiedades(propiedades);
        showFeedback('Asignación actualizada correctamente', 'success');
      } catch (error) {
        showFeedback(error.message, 'error');
      }
    });
  }

  if (exportContextButton) {
    exportContextButton.addEventListener('click', async () => {
      const { endpoint, filename } = exportContextButton.dataset;

      if (!endpoint || !filename) {
        return;
      }

      try {
        const activeTab = Array.from(document.querySelectorAll('.nav-tab')).find((tab) => tab.classList.contains('active'))?.textContent.trim().toLowerCase();
        const exportConfig = exportConfigByTab[activeTab];
        const filters = exportConfig?.getFilters ? exportConfig.getFilters() : {};
        await descargarExcel(endpoint, filename, filters);
        showFeedback('Archivo exportado correctamente', 'success');
      } catch (error) {
        showFeedback(error.message, 'error');
      }
    });
  }

  if (adminConversationReplyForm) {
    adminConversationReplyForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const activeConversation = window.__adminConversationDetail;
      const message = document.getElementById('adminConversationReplyInput').value.trim();

      if (!activeConversation || !message) {
        return;
      }

      try {
        setButtonLoadingState(adminConversationReplyForm.querySelector('button[type="submit"]'), true, 'Enviando...');
        const updatedConversation = await responderConversacionAdmin(activeConversation.id, { message });
        renderAdminConversationDetail(updatedConversation);
        conversationsAdminCache = await cargarConversacionesAdminDesdeApi();
        renderAdminConversations(conversationsAdminCache);
        showFeedback('Respuesta enviada correctamente', 'success');
      } catch (error) {
        showFeedback(error.message, 'error');
      } finally {
        setButtonLoadingState(adminConversationReplyForm.querySelector('button[type="submit"]'), false);
      }
    });
  }

  if (adminConversationCloseButton) {
    adminConversationCloseButton.addEventListener('click', async () => {
      const activeConversation = window.__adminConversationDetail;

      if (!activeConversation) {
        return;
      }

      try {
        await cerrarConversacionAdmin(activeConversation.id);
        const updatedConversation = await cargarDetalleConversacionAdmin(activeConversation.id);
        renderAdminConversationDetail(updatedConversation);
        conversationsAdminCache = await cargarConversacionesAdminDesdeApi();
        renderAdminConversations(conversationsAdminCache);
        showFeedback('Conversación cerrada correctamente', 'success');
      } catch (error) {
        showFeedback(error.message, 'error');
      }
    });
  }

  changeTab('propiedades');

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

  if (validateVisitButton && visitAccessCodeInput) {
    validateVisitButton.addEventListener('click', async () => {
      const accessCode = visitAccessCodeInput.value.trim();

      if (!accessCode) {
        renderVisitValidationResult('Ingresa un código de acceso válido.', true);
        return;
      }

      try {
        setButtonLoadingState(validateVisitButton, true, 'Validando...');
        const visit = await validarVisitaPorCodigo(accessCode);
        renderVisitValidationResult(visit);
        visitsCache = await cargarVisitasDesdeApi();
        actualizarVistaVisitas();
        showFeedback('Acceso validado correctamente', 'success');
      } catch (error) {
        renderVisitValidationResult(error.message, true);
        showFeedback(error.message, 'error');
      } finally {
        setButtonLoadingState(validateVisitButton, false);
      }
    });
  }

  if (visitStatusFilter) {
    visitStatusFilter.addEventListener('change', actualizarVistaVisitas);
  }

  if (visitSearchFilter) {
    visitSearchFilter.addEventListener('input', actualizarVistaVisitas);
  }
});

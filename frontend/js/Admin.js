const DEFAULT_PROPERTY_IMAGE = 'https://images.unsplash.com/photo-1560448204?auto=format&fit=crop&w=800&q=80';
let amenityModalMode = 'create';
let selectedAmenityId = null;
let ticketsHistoryCache = [];
let visitsCache = [];
let paymentsFinanzasCache = [];
let conversationsAdminCache = [];
let propiedadesCache = [];
let condominiosCache = [];
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
    endpoint: '/api/exports/reservations.xlsx',
    filename: 'reservations.xlsx',
    getFilters: () => ({})
  },
  visitas: {
    label: 'Exportar visitas',
    endpoint: '/api/exports/visits.xlsx',
    filename: 'visits.xlsx',
    getFilters: getVisitsExportFilters
  },
  historial: {
    label: 'Exportar tickets',
    endpoint: '/api/exports/tickets.xlsx',
    filename: 'tickets.xlsx',
    getFilters: getHistoryExportFilters
  },
  finanzas: {
    label: 'Exportar pagos',
    endpoint: '/api/exports/payments.xlsx',
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

// ===============================
// GESTIÓN DE CONDOMINIOS
// ===============================

function getCondominioIcon(type) {
  const normalizedType = String(type || '').toLowerCase();
  if (normalizedType === 'coto') return '<i class="fa-solid fa-tree"></i>';
  if (normalizedType === 'torre') return '<i class="fa-regular fa-building"></i>';
  return '<i class="fa-solid fa-building"></i>';
}

function renderCondominios(condominios) {
  const list = document.getElementById('condominios-list');
  if (!list) return;

  list.innerHTML = '';

  if (!condominios.length) {
    list.innerHTML = '<div class="empty-state">No hay condominios registrados</div>';
    return;
  }

  condominios.forEach(condominio => {
    const icon = getCondominioIcon(condominio.type);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'condominio-item';
    button.innerHTML = `
      <span class="condominio-left">
        <span class="condominio-icon">${icon}</span>
        <span class="condominio-name">${condominio.name}</span>
      </span>
      <span class="condominio-count">${condominio.count || 0}</span>
    `;
    button.addEventListener('click', () => filtrarPorCondominio(condominio.name, button));
    list.appendChild(button);
  });
}

function filtrarPorCondominio(condominioName, selectedButton = null) {
  document.querySelectorAll('.condominio-view-all-btn, .condominio-item').forEach(btn => {
    btn.classList.remove('active');
  });

  if (condominioName === 'all') {
    document.getElementById('filter-all-btn').classList.add('active');
  } else if (selectedButton) {
    selectedButton.classList.add('active');
  }

  console.log('Filtro activo:', condominioName);
}

function cargarCondominiosDesdeApi() {
  const token = getToken();
  
  return fetch(`${API_BASE_URL}/api/properties`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('No se pudieron cargar los condominios');
      }
      return response.json();
    })
    .then(data => {
      // Agrupar propiedades por condominio
      const properties = data.properties || [];
      const condominios = {};
      
      properties.forEach(prop => {
        const key = prop.name.split(' - ')[0]; // Usar primera parte del nombre como clave
        if (!condominios[key]) {
          condominios[key] = {
            name: key,
            type: prop.type === 'departamento' ? 'torre' : prop.type,
            count: 0,
            originalKey: key
          };
        }
        condominios[key].count++;
      });
      
      condominiosCache = Object.values(condominios);
      renderCondominios(condominiosCache);
      
      return condominiosCache;
    })
    .catch(error => {
      console.error('Error cargando condominios:', error);
    });
}

function openAddCondominioModal() {
  const modal = document.getElementById('add-condominio-modal');
  if (modal) {
    modal.style.display = 'flex';
  }
}

function closeAddCondominioModal(event, overlay) {
  if (!event || event.target === overlay) {
    const modal = document.getElementById('add-condominio-modal');
    if (modal) {
      modal.style.display = 'none';
    }
    // Limpiar el formulario
    const form = document.getElementById('add-condominio-form');
    if (form) {
      form.reset();
    }
  }
}

function guardarCondominio(event) {
  event.preventDefault();
  
  const name = document.getElementById('condominio-name').value;
  const type = document.getElementById('condominio-type').value;
  
  if (!name || !type) {
    showFeedback('Completa todos los campos', 'error');
    return;
  }
  
  // Agregar a la lista local
  const newCondominio = {
    name,
    type,
    count: 0,
    originalKey: name
  };
  
  condominiosCache.push(newCondominio);
  renderCondominios(condominiosCache);
  
  // Cerrar modal
  closeAddCondominioModal();
  
  showFeedback('Condominio agregado exitosamente', 'success');
}

// ===============================
// GESTIÓN DE PROPIEDADES
// ===============================

function openAddPropertyModal() {
  const modal = document.getElementById('add-property-modal');
  if (modal) {
    modal.style.display = 'flex';
  }
}

function closeAddPropertyModal(event, overlay) {
  if (!event || event.target === overlay) {
    const modal = document.getElementById('add-property-modal');
    if (modal) {
      modal.style.display = 'none';
    }
    // Limpiar el formulario
    const form = document.getElementById('add-property-form');
    if (form) {
      form.reset();
    }
  }
}

function guardarPropiedad(event) {
  event.preventDefault();
  
  const type = document.getElementById('property-type').value;
  const name = document.getElementById('property-name').value;
  const resident = document.getElementById('property-resident').value;
  
  if (!type || !name) {
    showFeedback('Completa los campos requeridos', 'error');
    return;
  }
  
  // Crear nueva propiedad
  const newProperty = {
    id: `PROPERTY#${Date.now()}`,
    nombre: name,
    type,
    residente: resident || 'Sin residente asignado',
    imagen: DEFAULT_PROPERTY_IMAGE
  };
  
  propiedadesCache.push(newProperty);
  actualizarPropiedadesConFiltros();
  
  // Cerrar modal
  closeAddPropertyModal();
  
  showFeedback('Propiedad creada exitosamente', 'success');
}

function openEditResidentModal(event, propertyId) {
  event.stopPropagation();
  
  const property = propiedadesCache.find(p => p.id === propertyId);
  if (!property) return;
  
  showFeedback('Funcionalidad de edición disponible solo para superadmin', 'info');
}

function getConversationStatusClass(status) {
  return `conversation-status-${status || 'abierta'}`;
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
  const propertiesLayout = document.getElementById('properties-layout');
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

  if (!title || !propertyContainer || !ticketsContainer || !reservasContainer || !finanzasContainer || !visitsWrapper || !avisosContainer || !serviciosContainer || !archivedAvisosContainer || !conversationsContainer || !messagesWrapper || !closedTicketsContainer || !ticketsHistoryWrapper || !propertiesLayout) {
    return;
  }

  updateExportButtonForTab(tabName);

  propertyContainer.classList.add('admin-hidden');
  propertiesLayout.classList.add('admin-hidden');
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
    propertiesLayout.classList.remove('admin-hidden');
    setLoadingState('propiedades-container', 'Cargando propiedades...');
    Promise.all([cargarPropiedadesDesdeApi(), cargarCondominiosDesdeApi()])
      .then(([properties]) => {
        cargarPropiedades(properties);
      })
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

function filtrarPropiedades(propiedades, filters) {
  return propiedades.filter((p) => {
    const matchesType = filters.type === 'all' || p.type === filters.type;
    const searchTarget = `${p.nombre} ${p.type}`.toLowerCase();
    const matchesSearch = !filters.search || searchTarget.includes(filters.search.toLowerCase());
    
    return matchesType && matchesSearch;
  });
}

function actualizarPropiedadesConFiltros() {
  const filters = {
    type: document.getElementById('property-type-filter')?.value || 'all',
    search: document.getElementById('property-name-filter')?.value || ''
  };

  const filteredProperties = filtrarPropiedades(propiedadesCache, filters);
  cargarPropiedades(filteredProperties);
}

function limpiarFiltrosPropiedades() {
  document.getElementById('property-type-filter').value = 'all';
  document.getElementById('property-name-filter').value = '';
  actualizarPropiedadesConFiltros();
}

function cargarPropiedades(data) {
  const container = document.getElementById("propiedades-container");

  container.innerHTML = "";

  if (!data.length) {
    container.innerHTML = '<p>No hay propiedades que coincidan con los filtros seleccionados.</p>';
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
    type: property.type,
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
  const mappedProperties = (data.properties || []).map(mapPropertyToCard);
  propiedadesCache = mappedProperties;
  
  // Configurar event listeners para los filtros
  const typeFilter = document.getElementById('property-type-filter');
  const nameFilter = document.getElementById('property-name-filter');
  
  if (typeFilter) {
    typeFilter.addEventListener('change', actualizarPropiedadesConFiltros);
  }
  
  if (nameFilter) {
    nameFilter.addEventListener('input', actualizarPropiedadesConFiltros);
  }
  
  return mappedProperties;
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
      <div class="property-detail-item resident-section">
        <div class="resident-label-wrapper">
          <span class="property-detail-label">Residente asignado</span>
          ${property.residentId ? `
            <button class="btn-edit-resident-detail" onclick="openEditResidentModal(event, '${property.id}')">
              <i class="fas fa-pencil"></i>
            </button>
          ` : ''}
        </div>
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

(function initAdminTicketsScreen() {
  function renderList(data) {
    const ticketsContainer = document.getElementById('tickets-container');
    if (!ticketsContainer) return;

    const tickets = Array.isArray(data) ? data : [];
    ticketsContainer.innerHTML = '';

    if (!tickets.length) {
      ticketsContainer.innerHTML = '<div class="admin-empty-state">No hay tickets registrados todavía.</div>';
      return;
    }

    const priorityColors = { alta: '#ef4444', media: '#f59e0b', baja: '#10b981' };

    tickets.forEach((ticket) => {
      const ticketPriority = ticket.prioridad || ticket.priority || 'baja';
      const ticketTitle = ticket.titulo || ticket.title || 'Sin título';
      const ticketStatus = ticket.estado || ticket.status || 'pendiente';
      const pColor = priorityColors[ticketPriority] || '#6b7280';

      ticketsContainer.innerHTML += `
        <div class="card" onclick="window.openTicketActionModal('${ticket.id}')" style="cursor: pointer;">
          <div class="card-info" style="pointer-events: none;">
            <div style="display: flex; justify-content: space-between; align-items: start;">
              <h3>${ticketTitle}</h3>
              <span style="font-size: 10px; padding: 2px 6px; border-radius: 4px; color: white; background: ${pColor}; text-transform: uppercase; font-weight: bold;">
                ${ticketPriority}
              </span>
            </div>
            <p><strong>Estado:</strong> <span style="text-transform: capitalize;">${ticketStatus}</span></p>
          </div>
        </div>
      `;
    });
  }

  async function fetchList() {
    const data = await apiGet('/api/tickets', 'No se pudieron cargar los tickets');
    const tickets = Array.isArray(data) ? data : (data.tickets || []);
    return tickets.map((ticket) => {
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
    });
  }

  async function updateStatus(ticketId, nextStatus, nextPriority) {
    await apiPatch(`/api/tickets/${encodeURIComponent(ticketId)}/status`, {
      status: nextStatus,
      priority: nextPriority
    }, 'Error al actualizar');
  }

  function renderClosedRecent(data) {
    const closedTicketsContainer = document.getElementById('closed-tickets-container');
    if (!closedTicketsContainer) return;

    const tickets = Array.isArray(data) ? data : [];
    const now = new Date();
    const recentClosedTickets = tickets.filter((ticket) => {
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

  function openModal(ticketId) {
    const tickets = window.AdminStore?.get('tickets') || [];
    const ticketsHistory = window.AdminStore?.get('ticketsHistory') || [];
    let ticket = tickets.find((item) => item.id === ticketId) || ticketsHistory.find((item) => item.id === ticketId);

    if (!ticket) {
      console.error('❌ No se encontró el ticket en ninguna caché. ID buscado:', ticketId);
      return;
    }

    const modal = document.getElementById('modal-ticket-action');
    if (!modal) {
      return;
    }

    document.getElementById('ticket-title').textContent = ticket.titulo || ticket.title || 'Sin título';
    document.getElementById('ticket-desc').textContent = ticket.descripcion || ticket.description || 'Sin descripción';
    document.getElementById('ticket-status-select').value = ticket.estado || ticket.status || 'pendiente';
    document.getElementById('ticket-priority-select').value = ticket.prioridad || ticket.priority || 'baja';

    const saveBtn = document.getElementById('ticket-save-btn');
    saveBtn.onclick = async (event) => {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }

      const newStatus = document.getElementById('ticket-status-select').value;
      const newPriority = document.getElementById('ticket-priority-select').value;

      try {
        setButtonLoadingState(saveBtn, true, 'Guardando...');
        await updateStatus(ticket.id, newStatus, newPriority);
        const freshTickets = await fetchList();
        window.AdminStore?.patch({ tickets: freshTickets, ticketsHistory: freshTickets });
        renderList(freshTickets);
        renderClosedRecent(freshTickets);
        if (window.AdminHistoryScreen?.refresh) {
          window.AdminHistoryScreen.refresh();
        }
        modal.style.display = 'none';
        showFeedback('Ticket actualizado correctamente', 'success');
      } catch (error) {
        showFeedback(error.message, 'error');
      } finally {
        setButtonLoadingState(saveBtn, false);
      }
    };

    modal.style.display = 'flex';
  }

  window.AdminTicketsScreen = {
    renderList,
    fetchList,
    updateStatus,
    renderClosedRecent,
    openModal
  };

  window.openTicketActionModal = openModal;
})();
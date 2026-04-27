(function initAdminHistoryScreen() {
  function filterList(tickets, filters) {
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

  function renderList(tickets) {
    const historyContainer = document.getElementById('tickets-history-container');
    if (!historyContainer) return;

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

  function refresh() {
    const tickets = window.AdminStore?.get('ticketsHistory') || [];
    const filters = {
      status: document.getElementById('history-status-filter')?.value || 'all',
      priority: document.getElementById('history-priority-filter')?.value || 'all',
      period: document.getElementById('history-period-filter')?.value || 'all',
      search: document.getElementById('history-search-filter')?.value || ''
    };

    renderList(filterList(tickets, filters));
  }

  window.AdminHistoryScreen = {
    filterList,
    renderList,
    refresh
  };
})();
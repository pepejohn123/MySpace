(function initAdminHistoryScreen() {
  function isClosed(ticket) {
    return (ticket.estado || ticket.status) === 'cerrado';
  }

  function filterList(tickets, filters) {
    const now = new Date();
    return tickets.filter((ticket) => {
      if (!isClosed(ticket)) return false;
      const matchesPriority = filters.priority === 'all' || ticket.prioridad === filters.priority || ticket.priority === filters.priority;
      const searchTarget = `${ticket.titulo || ticket.title || ''} ${ticket.descripcion || ticket.description || ''}`.toLowerCase();
      const matchesSearch = !filters.search || searchTarget.includes(filters.search.toLowerCase());
      let matchesPeriod = true;

      if (filters.period === '7d') {
        const closedAt = new Date(ticket.closedAt || 0);
        matchesPeriod = ((now - closedAt) / (1000 * 60 * 60 * 24)) <= 7;
      }

      if (filters.period === '30d') {
        const closedAt = new Date(ticket.closedAt || 0);
        matchesPeriod = ((now - closedAt) / (1000 * 60 * 60 * 24)) <= 30;
      }

      if (filters.period === 'recent_closed') {
        const closedAt = new Date(ticket.closedAt || 0);
        matchesPeriod = Boolean(ticket.closedAt) && ((now - closedAt) / (1000 * 60 * 60 * 24)) <= 7;
      }

      return matchesPriority && matchesSearch && matchesPeriod;
    });
  }

  function renderList(tickets) {
    const historyContainer = document.getElementById('tickets-history-container');
    if (!historyContainer) return;
    historyContainer.innerHTML = '';

    if (!tickets.length) {
      historyContainer.innerHTML = '<div class="admin-empty-state">No hay tickets cerrados que coincidan con los filtros seleccionados.</div>';
      return;
    }

    tickets.forEach((ticket) => {
      historyContainer.innerHTML += `
        <div class="card history-ticket-card">
          <div class="card-info">
            <h3>${ticket.titulo || ticket.title}</h3>
            <p>${ticket.descripcion || ticket.description}</p>
            <div class="history-ticket-meta">
              <span><strong>Creado:</strong> ${ticket.createdAt || '—'}</span>
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
      priority: document.getElementById('history-priority-filter')?.value || 'all',
      period: document.getElementById('history-period-filter')?.value || 'all',
      search: document.getElementById('history-search-filter')?.value || ''
    };
    renderList(filterList(tickets, filters));
  }

  window.AdminHistoryScreen = { filterList, renderList, refresh };
})();

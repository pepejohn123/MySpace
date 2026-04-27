(function initResidentTicketsScreen() {
  async function fetchList() {
    const data = await apiGet('/api/tickets', 'No se pudieron cargar los tickets');
    return data.tickets || [];
  }

  async function createTicket(payload) {
    const data = await apiPost('/api/tickets', payload, 'No se pudo crear el ticket');
    return data.ticket;
  }

  function mapToMovements(tickets) {
    return tickets.map((ticket) => ({
      tipo: 'Ticket',
      titulo: ticket.title,
      fecha: ticket.id,
      estado: ticket.status,
      color: ResidentShared.buildTicketColor(ticket.status)
    }));
  }

  window.ResidentTicketsScreen = {
    fetchList,
    createTicket,
    mapToMovements
  };
})();

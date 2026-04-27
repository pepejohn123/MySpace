(function initAdminShared() {
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

  function debugPayload(scope, payload, extra = {}) {
    const debugEnabled = localStorage.getItem('myspaceDebug') !== 'false';
    if (!debugEnabled) return;

    const timestamp = new Date().toISOString();
    console.groupCollapsed(`[MySpace Debug][${timestamp}] ${scope}`);
    if (Object.keys(extra).length) {
      console.log('extra:', extra);
    }
    console.log('payload:', payload);
    console.groupEnd();
  }

  window.AdminShared = {
    getAmenityStatusClass,
    getTicketPriorityClass,
    getConversationStatusClass,
    buildPropertyStatusClass,
    getApiErrorMessage,
    formatearFechaLegible,
    debugPayload
  };
})();
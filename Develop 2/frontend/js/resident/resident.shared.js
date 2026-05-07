(function initResidentShared() {
  function buildTicketColor(status) {
    return {
      pendiente: '#F59E0B',
      en_proceso: '#4F46E5',
      cerrado: '#00C853'
    }[status] || '#6B7280';
  }

  function buildPaymentColor(status) {
    return {
      pagado: '#00C853',
      en_revision: '#4F46E5',
      pendiente: '#F59E0B',
      rechazado: '#DC2626'
    }[status] || '#6B7280';
  }

  function buildReservationColor(status) {
    return {
      pendiente: '#F59E0B',
      aprobada: '#00C853',
      rechazada: '#DC2626'
    }[status] || '#6B7280';
  }

  function buildVisitColor(status) {
    return {
      pendiente: '#F59E0B',
      validada: '#00C853',
      expirada: '#DC2626'
    }[status] || '#6B7280';
  }

  function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'flex';
  }

  function closeModal(event, overlay) {
    if (event?.target === overlay && overlay) {
      overlay.style.display = 'none';
    }
  }

  function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach((modal) => {
      modal.style.display = 'none';
    });
  }

  window.ResidentShared = {
    buildTicketColor,
    buildPaymentColor,
    buildReservationColor,
    buildVisitColor,
    openModal,
    closeModal,
    closeAllModals
  };

  window.openModal = openModal;
  window.closeModal = closeModal;
  window.closeAllModals = closeAllModals;
})();

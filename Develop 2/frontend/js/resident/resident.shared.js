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

  function getConversationStatusClass(status) {
    return `conversation-status-${status || 'abierta'}`;
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

  function switchAssistantTab(tabName) {
    document.querySelectorAll('.assistant-tab-btn').forEach((button) => {
      button.classList.toggle('active', button.dataset.tab === tabName);
    });

    const helpPanel = document.getElementById('assistant-tab-help');
    const messagesPanel = document.getElementById('assistant-tab-messages');

    if (helpPanel) helpPanel.classList.toggle('active', tabName === 'help');
    if (messagesPanel) messagesPanel.classList.toggle('active', tabName === 'messages');
  }

  function toggleChat() {
    const chat = document.getElementById('chat-window');
    if (!chat) return;

    if (chat.style.display === 'flex') {
      chat.style.display = 'none';
    } else {
      chat.style.display = 'flex';
      switchAssistantTab('help');
    }
  }

  function mostrarRespuesta(tipo) {
    if (tipo === 'wifi') {
      showFeedback('La clave del WiFi es: WIFI_CONDO_2026', 'info');
    }
    if (tipo === 'basura') {
      showFeedback('La basura se saca de 8pm a 10pm', 'info');
    }
  }

  window.ResidentShared = {
    buildTicketColor,
    buildPaymentColor,
    buildReservationColor,
    buildVisitColor,
    getConversationStatusClass,
    openModal,
    closeModal,
    closeAllModals,
    switchAssistantTab,
    toggleChat,
    mostrarRespuesta
  };

  window.openModal = openModal;
  window.closeModal = closeModal;
  window.closeAllModals = closeAllModals;
  window.switchAssistantTab = switchAssistantTab;
  window.toggleChat = toggleChat;
  window.mostrarRespuesta = mostrarRespuesta;
})();

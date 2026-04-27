(function initAdminConversationsScreen() {
  async function fetchList() {
    const data = await apiGet('/api/conversations', 'No se pudieron cargar las conversaciones');
    return data.conversations || [];
  }

  async function fetchDetail(conversationId) {
    const data = await apiGet(`/api/conversations/${encodeURIComponent(conversationId)}`, 'No se pudo cargar la conversación');
    return data.conversation;
  }

  async function reply(conversationId, payload) {
    const data = await apiPost(`/api/conversations/${encodeURIComponent(conversationId)}/messages`, payload, 'No se pudo responder la conversación');
    return data.conversation;
  }

  async function closeConversation(conversationId) {
    const data = await apiPatch(`/api/conversations/${encodeURIComponent(conversationId)}/status`, { status: 'cerrada' }, 'No se pudo cerrar la conversación');
    return data.conversation;
  }

  function renderList(conversations) {
    const container = document.getElementById('admin-conversations-container');
    if (!container) return;

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

  function renderDetail(conversation) {
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

  async function openModal(conversationId) {
    try {
      const conversation = await fetchDetail(conversationId);
      renderDetail(conversation);
      document.getElementById('admin-conversation-modal').style.display = 'flex';
    } catch (error) {
      showFeedback(error.message, 'error');
    }
  }

  function closeModal(event, overlay) {
    if (!event || event.target === overlay) {
      const modal = document.getElementById('admin-conversation-modal');
      if (modal) {
        modal.style.display = 'none';
      }
    }
  }

  window.AdminConversationsScreen = {
    fetchList,
    fetchDetail,
    reply,
    closeConversation,
    renderList,
    renderDetail,
    openModal,
    closeModal
  };

  window.openAdminConversationModal = openModal;
  window.closeAdminConversationModal = closeModal;
})();
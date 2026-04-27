(function initResidentConversationsScreen() {
  async function fetchList() {
    const data = await apiGet('/api/conversations', 'No se pudieron cargar las conversaciones');
    return data.conversations || [];
  }

  async function createConversation(payload) {
    const data = await apiPost('/api/conversations', payload, 'No se pudo crear la conversación');
    return data.conversation;
  }

  async function fetchDetail(conversationId) {
    const data = await apiGet(`/api/conversations/${encodeURIComponent(conversationId)}`, 'No se pudo cargar la conversación');
    return data.conversation;
  }

  async function reply(conversationId, payload) {
    const data = await apiPost(`/api/conversations/${encodeURIComponent(conversationId)}/messages`, payload, 'No se pudo responder la conversación');
    return data.conversation;
  }

  function renderList(conversations) {
    const container = document.getElementById('resident-conversations-list');
    if (!container) return;

    container.innerHTML = '';

    if (!conversations.length) {
      container.innerHTML = '<div class="resident-empty-state">Todavía no has enviado consultas a administración.</div>';
      return;
    }

    conversations.forEach((conversation) => {
      const lastMessage = conversation.messages?.[conversation.messages.length - 1];

      container.innerHTML += `
        <button class="resident-conversation-card" onclick="openConversationDetail('${conversation.id}')">
          <div class="resident-conversation-header">
            <div>
              <h4 class="resident-conversation-subject">${conversation.subject}</h4>
              <div class="resident-conversation-meta">Actualizado: ${conversation.updatedAt || conversation.createdAt}</div>
            </div>
            <span class="conversation-status-badge ${ResidentShared.getConversationStatusClass(conversation.status)}">${conversation.status}</span>
          </div>
          <p class="resident-conversation-preview">${lastMessage?.body || 'Sin mensajes'}</p>
        </button>
      `;
    });
  }

  function renderDetail(conversation) {
    const title = document.getElementById('conversation-detail-title');
    const status = document.getElementById('conversation-detail-status');
    const messages = document.getElementById('conversation-detail-messages');
    const replyInput = document.getElementById('conversationReplyInput');
    const replyForm = document.getElementById('conversation-reply-form');

    window.__residentConversationDetail = conversation;

    if (title) title.textContent = conversation.subject;
    if (status) {
      status.innerHTML = `<span class="conversation-status-badge ${ResidentShared.getConversationStatusClass(conversation.status)}">${conversation.status}</span>`;
    }

    if (messages) {
      messages.innerHTML = '';
      conversation.messages.forEach((message) => {
        const isMine = message.senderRole === 'residente';
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

    if (replyInput) replyInput.value = '';
    if (replyForm) replyForm.style.display = conversation.status === 'cerrada' ? 'none' : 'flex';
  }

  async function refreshList() {
    try {
      const conversations = await fetchList();
      ResidentStore.set('conversations', conversations);
      renderList(conversations);
    } catch (error) {
      const container = document.getElementById('resident-conversations-list');
      if (container) container.innerHTML = `<div class="resident-error-state">${error.message}</div>`;
    }
  }

  async function openDetail(conversationId) {
    try {
      const conversation = await fetchDetail(conversationId);
      renderDetail(conversation);
      const modal = document.getElementById('conversation-detail-modal');
      if (modal) modal.style.display = 'flex';
    } catch (error) {
      showFeedback(error.message, 'error');
    }
  }

  function closeDetail(event, overlay) {
    if (!event || event.target === overlay) {
      closeDetailModal();
    }
  }

  function closeDetailModal() {
    const modal = document.getElementById('conversation-detail-modal');
    if (modal) modal.style.display = 'none';
  }

  window.ResidentConversationsScreen = {
    fetchList,
    createConversation,
    fetchDetail,
    reply,
    renderList,
    renderDetail,
    refreshList,
    openDetail,
    closeDetail,
    closeDetailModal
  };

  window.openConversationDetail = openDetail;
  window.closeConversationDetail = closeDetail;
  window.closeConversationDetailModal = closeDetailModal;
})();

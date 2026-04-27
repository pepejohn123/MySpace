(function initAdminNoticesScreen() {
  async function fetchList() {
    const data = await apiGet('/api/notices', 'No se pudieron cargar los avisos');
    const notices = Array.isArray(data) ? data : (data.notices || []);
    return notices.map((notice) => ({
      id: notice.id,
      titulo: notice.title,
      mensaje: notice.message,
      audiencia: notice.audience,
      status: notice.status || 'activo'
    }));
  }

  async function createNotice(payload) {
    const data = await apiPost('/api/notices', payload, 'No se pudo crear el aviso');
    return data.notice;
  }

  async function updateNoticeStatus(noticeId, status) {
    await apiPatch(`/api/notices/${encodeURIComponent(noticeId)}/status`, { status }, 'No se pudo actualizar el aviso');
  }

  async function deleteNotice(noticeId) {
    await apiDelete(`/api/notices/${encodeURIComponent(noticeId)}`, 'No se pudo eliminar el aviso');
  }

  function renderActive(notices) {
    const avisosContainer = document.getElementById('avisos-container');
    if (!avisosContainer) return;

    avisosContainer.innerHTML = '';
    const activeNotices = notices.filter((notice) => notice.status !== 'archivado');

    if (!activeNotices.length) {
      avisosContainer.innerHTML = '<div class="admin-empty-state">No hay avisos activos.</div>';
      return;
    }

    activeNotices.forEach((notice) => {
      avisosContainer.innerHTML += `
        <div class="card">
          <div class="card-info">
            <h3>${notice.titulo}</h3>
            <p>${notice.mensaje}</p>
            <p><strong>Audiencia:</strong> ${notice.audiencia}</p>
            <div class="service-card-actions">
              <button class="admin-action-btn" onclick="actualizarEstadoAviso('${notice.id}', 'archivado')">Archivar aviso</button>
              <button class="admin-danger-btn" onclick="eliminarAviso('${notice.id}')">Eliminar</button>
            </div>
          </div>
        </div>
      `;
    });
  }

  function renderArchived(notices) {
    const archivedContainer = document.getElementById('archived-avisos-container');
    if (!archivedContainer) return;

    const archivedNotices = notices.filter((notice) => notice.status === 'archivado');
    archivedContainer.innerHTML = '';

    if (!archivedNotices.length) {
      archivedContainer.innerHTML = '<div class="admin-empty-state">No hay avisos archivados.</div>';
      return;
    }

    archivedNotices.forEach((notice) => {
      archivedContainer.innerHTML += `
        <div class="card">
          <div class="card-info">
            <h3>${notice.titulo}</h3>
            <p>${notice.mensaje}</p>
            <p><strong>Audiencia:</strong> ${notice.audiencia}</p>
            <div class="service-card-actions">
              <button class="admin-action-btn" onclick="actualizarEstadoAviso('${notice.id}', 'activo')">Reactivar aviso</button>
              <button class="admin-danger-btn" onclick="eliminarAviso('${notice.id}')">Eliminar</button>
            </div>
          </div>
        </div>
      `;
    });
  }

  window.AdminNoticesScreen = {
    fetchList,
    createNotice,
    updateNoticeStatus,
    deleteNotice,
    renderActive,
    renderArchived
  };
})();
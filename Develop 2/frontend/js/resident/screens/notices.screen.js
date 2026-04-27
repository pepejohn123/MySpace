(function initResidentNoticesScreen() {
  async function fetchActiveList() {
    const data = await apiGet('/api/notices', 'No se pudieron cargar los avisos');
    return (data.notices || []).filter((notice) => (notice.status || 'activo') === 'activo');
  }

  function renderList(notices) {
    const noticesContainer = document.getElementById('notices-list');
    if (!noticesContainer) return;

    noticesContainer.innerHTML = '';
    if (!notices.length) {
      noticesContainer.innerHTML = '<div class="resident-empty-state">No hay avisos nuevos del condominio.</div>';
      return;
    }

    notices.forEach((notice) => {
      noticesContainer.innerHTML += `
        <div class="activity-item">
          <div>
            <b>${notice.title}</b>
            <br>
            <small class="notice-meta">${notice.message}</small>
            <br>
            <small class="notice-meta">Audiencia: ${notice.audience}</small>
          </div>
        </div>
      `;
    });
  }

  window.ResidentNoticesScreen = {
    fetchActiveList,
    renderList
  };
})();

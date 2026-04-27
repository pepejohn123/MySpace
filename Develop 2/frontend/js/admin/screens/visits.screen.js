(function initAdminVisitsScreen() {
  async function fetchList() {
    const data = await apiGet('/api/visits', 'No se pudieron cargar las visitas');
    const visits = Array.isArray(data) ? data : (data.visits || []);
    return visits.map((visit) => ({
      id: visit.id,
      visitante: visit.visitorName,
      fecha: visit.visitDate,
      codigo: visit.accessCode,
      estado: visit.status,
      propiedad: visit.propertyId || 'Sin propiedad',
      residente: visit.residentName || visit.residentId || 'Sin residente'
    }));
  }

  async function validateByCode(accessCode) {
    const data = await apiPatch(`/api/visits/${encodeURIComponent(accessCode)}/validate`, {}, 'No se pudo validar la visita');
    const visit = data.visit;
    return {
      id: visit.id,
      visitante: visit.visitorName,
      fecha: visit.visitDate,
      codigo: visit.accessCode,
      estado: visit.status,
      propiedad: visit.propertyId || 'Sin propiedad',
      residente: visit.residentName || visit.residentId || 'Sin residente'
    };
  }

  function renderList(visits) {
    const visitsContainer = document.getElementById('visits-container');
    if (!visitsContainer) return;

    visitsContainer.innerHTML = '';

    if (!visits.length) {
      visitsContainer.innerHTML = '<div class="admin-empty-state">No hay visitas registradas todavía.</div>';
      return;
    }

    visits.forEach((visit) => {
      visitsContainer.innerHTML += `
        <div class="card visit-card">
          <div class="card-info">
            <h3>${visit.visitante}</h3>
            <div class="visit-card-meta">
              <span><strong>Fecha:</strong> ${visit.fecha}</span>
              <span><strong>Código:</strong> ${visit.codigo}</span>
              <span><strong>Propiedad:</strong> ${visit.propiedad}</span>
              <span><strong>Residente:</strong> ${visit.residente}</span>
            </div>
            <span class="visit-status-badge visit-status-${visit.estado}">${visit.estado}</span>
            ${visit.estado === 'pendiente' ? `
              <div class="visit-card-actions">
                <button class="admin-action-btn" onclick="validarVisitaDesdeCard('${visit.codigo}')">Validar visita</button>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    });
  }

  function filterList(visits, filters) {
    return visits.filter((visit) => {
      const matchesStatus = filters.status === 'all' || visit.estado === filters.status;
      const searchTarget = `${visit.visitante} ${visit.codigo}`.toLowerCase();
      const matchesSearch = !filters.search || searchTarget.includes(filters.search.toLowerCase());

      return matchesStatus && matchesSearch;
    });
  }

  function refresh() {
    const visits = window.AdminStore?.get('visits') || [];
    const filters = {
      status: document.getElementById('visit-status-filter')?.value || 'all',
      search: document.getElementById('visit-search-filter')?.value || ''
    };

    renderList(filterList(visits, filters));
  }

  function renderValidationResult(visit, isError = false) {
    const resultContainer = document.getElementById('visit-validation-result');
    if (!resultContainer) return;

    if (isError) {
      resultContainer.innerHTML = `<div class="admin-error-state">${visit}</div>`;
      return;
    }

    resultContainer.innerHTML = `
      <div class="visit-validation-card visit-validation-${visit.estado}">
        <h4>${visit.visitante}</h4>
        <div class="visit-card-meta">
          <span><strong>Fecha:</strong> ${visit.fecha}</span>
          <span><strong>Código:</strong> ${visit.codigo}</span>
          <span><strong>Propiedad:</strong> ${visit.propiedad}</span>
          <span><strong>Residente:</strong> ${visit.residente}</span>
        </div>
        <span class="visit-status-badge visit-status-${visit.estado}">${visit.estado}</span>
      </div>
    `;
  }

  async function validateFromCard(accessCode) {
    try {
      const visit = await validateByCode(accessCode);
      renderValidationResult(visit);
      const freshVisits = await fetchList();
      window.AdminStore?.set('visits', freshVisits);
      refresh();
      showFeedback('Acceso validado correctamente', 'success');
    } catch (error) {
      renderValidationResult(error.message, true);
      showFeedback(error.message, 'error');
    }
  }

  window.AdminVisitsScreen = {
    fetchList,
    validateByCode,
    renderList,
    filterList,
    refresh,
    renderValidationResult,
    validateFromCard
  };

  window.validarVisitaDesdeCard = validateFromCard;
})();
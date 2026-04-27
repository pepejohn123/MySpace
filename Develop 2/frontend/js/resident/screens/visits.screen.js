(function initResidentVisitsScreen() {
  async function fetchList() {
    const data = await apiGet('/api/visits', 'No se pudieron cargar las visitas');
    return data.visits || [];
  }

  async function createVisit(payload) {
    const data = await apiPost('/api/visits', payload, 'No se pudo crear el pase de visita');
    return data.visit;
  }

  function mapToMovements(visits) {
    return visits.map((visit) => ({
      tipo: 'Visita',
      titulo: `Visita: ${visit.visitorName}`,
      fecha: `${visit.visitDate} • ${visit.accessCode}`,
      estado: visit.status,
      color: ResidentShared.buildVisitColor(visit.status)
    }));
  }

  function mapToCard(visit) {
    return {
      visitorName: visit.visitorName,
      visitDate: visit.visitDate,
      accessCode: visit.accessCode,
      status: visit.status,
      color: ResidentShared.buildVisitColor(visit.status)
    };
  }

  function renderVisitQr(containerId, visit) {
    const container = document.getElementById(containerId);
    if (!container || typeof QRCode === 'undefined') return;

    container.innerHTML = '';
    const qrPayload = `VISIT|${visit.id}|${visit.accessCode}|${visit.visitDate}`;
    new QRCode(container, {
      text: qrPayload,
      width: 110,
      height: 110,
      colorDark: '#111827',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.M
    });
  }

  function renderVisitPassCard(visit) {
    const visitResult = document.getElementById('visit-result');
    if (!visitResult) return;

    visitResult.innerHTML = `
      <div class="visit-pass-card">
        <div class="visit-pass-header">
          <div>
            <span class="visit-pass-label">Pase generado</span>
            <h4 class="visit-pass-title">${visit.visitorName}</h4>
          </div>
          <span class="resident-visit-status" style="background:${ResidentShared.buildVisitColor(visit.status)}15;color:${ResidentShared.buildVisitColor(visit.status)};">${visit.status}</span>
        </div>
        <div class="visit-pass-meta">
          <span><strong>Fecha:</strong> ${visit.visitDate}</span>
          <span><strong>Código:</strong> ${visit.accessCode}</span>
        </div>
        <div class="visit-pass-qr">
          <div class="visit-pass-qr-box" id="visit-qr-current"></div>
          <small>Presenta este QR en el acceso o comparte tu código.</small>
        </div>
      </div>
    `;

    renderVisitQr('visit-qr-current', visit);
  }

  function renderResidentVisits(visits) {
    const container = document.getElementById('resident-visits-list');
    if (!container) return;

    container.innerHTML = '';

    if (!visits.length) {
      container.innerHTML = '<div class="resident-empty-state">Todavía no has generado visitas.</div>';
      return;
    }

    visits.map(mapToCard).forEach((visit) => {
      container.innerHTML += `
        <div class="resident-visit-card">
          <div class="resident-visit-main">
            <div class="resident-visit-header">
              <h4>${visit.visitorName}</h4>
              <span class="resident-visit-status" style="background:${visit.color}15;color:${visit.color};">${visit.status}</span>
            </div>
            <div class="resident-visit-meta">
              <span>Fecha: ${visit.visitDate}</span>
              <span>Código: ${visit.accessCode}</span>
            </div>
          </div>
        </div>
      `;
    });
  }

  window.ResidentVisitsScreen = {
    fetchList,
    createVisit,
    mapToMovements,
    renderVisitQr,
    renderVisitPassCard,
    renderResidentVisits
  };
})();

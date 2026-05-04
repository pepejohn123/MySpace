(function initResidentHomeScreen() {
  function buildResidentViewModel(user) {
    const propertyId = user.propertyId || 'SIN-ASIGNAR';
    const propertyLabel = propertyId.replace('PROPERTY#', '').replace(/([A-Z])([0-9])/g, '$1 $2');

    return {
      nombre: user.name || 'Residente',
      departamento: propertyLabel,
      imagen: window.DEFAULT_DEPT_IMAGE || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
      estado_pago: 'Pendiente de sincronizar',
      caracteristicas: [
        { icono: 'fa-solid fa-house', texto: 'Propiedad activa' },
        { icono: 'fa-solid fa-id-card', texto: user.role || 'residente' },
        { icono: 'fa-solid fa-building', texto: user.condominioId || 'Sin condominio' },
        { icono: 'fa-solid fa-key', texto: propertyId }
      ],
      servicios: [
        'Mantenimiento de Áreas Comunes',
        'Recolección de Basura',
        'Seguridad 24/7',
        'Acceso digital MySpace'
      ],
      movimientos: []
    };
  }

  function renderProfile(data) {
    document.getElementById('user-name').innerText = `Hola,${data.nombre}`;
    document.getElementById('dept-name').innerText = data.departamento;
    document.getElementById('dept-owner').innerText = `Titular:${data.nombre}`;
    document.getElementById('dept-image').src = data.imagen;
    document.getElementById('payment-status').innerHTML = `<i class="fa-solid fa-circle-check"></i> ${data.estado_pago}`;
    renderFeatures(data.caracteristicas);
    renderServices(data.servicios);
    renderMovements(data.movimientos);
  }

  function renderFeatures(features) {
    const container = document.getElementById('features-container');
    if (!container) return;
    container.innerHTML = '';
    features.forEach((feature) => {
      container.innerHTML += `
        <div class="feature">
          <i class="${feature.icono}"></i>
          <span>${feature.texto}</span>
        </div>
      `;
    });
  }

  function renderServices(servicios) {
    const list = document.getElementById('services-list');
    if (!list) return;
    list.innerHTML = '';
    servicios.forEach((service) => {
      list.innerHTML += `
        <li>
          <i class="fa-solid fa-circle-check"></i>
          ${service}
        </li>
      `;
    });
  }

  function renderMovements(movs) {
    const container = document.getElementById('activity-list');
    if (!container) return;
    container.innerHTML = '';

    const sortedMovs = [...movs].sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
    sortedMovs.forEach((movement) => {
      container.innerHTML += `
        <div class="activity-item resident-activity-item">
          <div class="resident-activity-main">
            ${movement.tipo ? `<span class="movement-tag">${movement.tipo}</span>` : ''}
            <b>${movement.titulo}</b>
            <small class="resident-activity-date">${movement.fecha}</small>
          </div>
          <span class="resident-activity-status" style="background:${movement.color}15;color:${movement.color};">
            ${movement.estado}
          </span>
        </div>
      `;
    });
  }

  async function refreshDashboard() {
    try {
      const [tickets, paymentData, reservations, visits, notices] = await Promise.all([
        ResidentTicketsScreen.fetchList(),
        ResidentPaymentsScreen.fetchData(),
        ResidentReservationsScreen.fetchList(),
        ResidentVisitsScreen.fetchList(),
        ResidentNoticesScreen.fetchActiveList()
      ]);

      ResidentStore.patch({
        tickets,
        payments: paymentData.payments || [],
        paymentSummary: paymentData.summary || { total: 0, pagado: 0, enRevision: 0, porCobrar: 0 },
        reservations,
        visits,
        notices
      });

      const movimientos = [
        ...ResidentTicketsScreen.mapToMovements(tickets),
        ...ResidentPaymentsScreen.mapToMovements(paymentData.payments || []),
        ...ResidentReservationsScreen.mapToMovements(reservations),
        ...ResidentVisitsScreen.mapToMovements(visits)
      ];

      ResidentPaymentsScreen.renderPaymentStatus(paymentData.summary || { porCobrar: 0, enRevision: 0 });
      ResidentPaymentsScreen.renderFinanceSummary(paymentData.summary || { total: 0, pagado: 0, enRevision: 0, porCobrar: 0 });
      ResidentPaymentsScreen.renderPayments(paymentData.payments || []);
      ResidentVisitsScreen.renderResidentVisits(visits);
      ResidentNoticesScreen.renderList(notices);

      if (!movimientos.length) {
        renderMovements([
          {
            titulo: 'Sin reportes todavía',
            fecha: 'No has generado tickets',
            estado: 'Disponible',
            color: '#6B7280'
          }
        ]);
        return;
      }

      renderMovements(movimientos);
    } catch (error) {
      ResidentPaymentsScreen.renderPaymentStatus({ porCobrar: 0, enRevision: 0 });
      ResidentPaymentsScreen.renderFinanceSummary({ total: 0, pagado: 0, enRevision: 0, porCobrar: 0 });
      ResidentPaymentsScreen.renderPayments([]);
      ResidentVisitsScreen.renderResidentVisits([]);
      ResidentNoticesScreen.renderList([]);
      renderMovements([
        {
          tipo: 'Error',
          titulo: 'Error al cargar datos',
          fecha: error.message,
          estado: 'Reintenta más tarde',
          color: '#DC2626'
        }
      ]);
    }
  }

  window.ResidentHomeScreen = {
    buildResidentViewModel,
    renderProfile,
    renderFeatures,
    renderServices,
    renderMovements,
    refreshDashboard
  };
})();

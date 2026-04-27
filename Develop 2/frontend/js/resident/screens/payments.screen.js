(function initResidentPaymentsScreen() {
  async function fetchData() {
    return apiGet('/api/payments', 'No se pudieron cargar los pagos');
  }

  async function createPayment(payload) {
    const data = await apiPost('/api/payments', payload, 'No se pudo registrar el pago');
    return data.payment;
  }

  function mapToMovements(payments) {
    return payments.map((payment) => ({
      tipo: 'Pago',
      titulo: payment.concept,
      fecha: payment.paymentDate || payment.id,
      estado: `$${payment.amount} • ${payment.status}`,
      color: ResidentShared.buildPaymentColor(payment.status)
    }));
  }

  function mapToCard(payment) {
    return {
      concepto: payment.concept,
      fecha: payment.paymentDate || payment.createdAt || 'Sin fecha',
      monto: payment.amount,
      estado: payment.status,
      color: ResidentShared.buildPaymentColor(payment.status)
    };
  }

  function renderPaymentStatus(summary) {
    const paymentStatus = document.getElementById('payment-status');
    if (!paymentStatus) return;

    if (summary.porCobrar > 0) {
      paymentStatus.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Pago pendiente';
      return;
    }

    if (summary.enRevision > 0) {
      paymentStatus.innerHTML = '<i class="fa-solid fa-hourglass-half"></i> Pago en revisión';
      return;
    }

    paymentStatus.innerHTML = '<i class="fa-solid fa-circle-check"></i> Al corriente';
  }

  function renderFinanceSummary(summary) {
    const container = document.getElementById('resident-finance-summary');
    if (!container) return;

    container.innerHTML = `
      <div class="resident-finance-card accent-neutral">
        <span class="resident-finance-label">Total registrado</span>
        <strong class="resident-finance-amount">$${summary.total || 0}</strong>
        <p class="resident-finance-copy">Suma acumulada de tus pagos registrados.</p>
      </div>
      <div class="resident-finance-card accent-success">
        <span class="resident-finance-label">Pagado</span>
        <strong class="resident-finance-amount success">$${summary.pagado || 0}</strong>
        <p class="resident-finance-copy">Pagos ya validados por administración.</p>
      </div>
      <div class="resident-finance-card accent-review">
        <span class="resident-finance-label">En revisión</span>
        <strong class="resident-finance-amount review">$${summary.enRevision || 0}</strong>
        <p class="resident-finance-copy">Pagos enviados pendientes de validación.</p>
      </div>
      <div class="resident-finance-card accent-danger">
        <span class="resident-finance-label">Por cobrar</span>
        <strong class="resident-finance-amount danger">$${summary.porCobrar || 0}</strong>
        <p class="resident-finance-copy">Montos pendientes o con estatus rechazado.</p>
      </div>
    `;
  }

  function renderPayments(payments) {
    const container = document.getElementById('resident-payments-list');
    if (!container) return;

    container.innerHTML = '';
    if (!payments.length) {
      container.innerHTML = '<div class="resident-empty-state">Todavía no tienes pagos registrados.</div>';
      return;
    }

    payments.map(mapToCard).forEach((payment) => {
      container.innerHTML += `
        <div class="resident-payment-card">
          <div class="resident-payment-main">
            <div class="resident-payment-header">
              <h4>${payment.concepto}</h4>
              <span class="resident-payment-status" style="background:${payment.color}15;color:${payment.color};">${payment.estado}</span>
            </div>
            <div class="resident-payment-meta">
              <span>Fecha: ${payment.fecha}</span>
              <span>Monto: $${payment.monto}</span>
            </div>
          </div>
        </div>
      `;
    });
  }

  window.ResidentPaymentsScreen = {
    fetchData,
    createPayment,
    mapToMovements,
    renderPaymentStatus,
    renderFinanceSummary,
    renderPayments
  };
})();

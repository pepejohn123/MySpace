(function initResidentPaymentsScreen() {
  let stripeInstance = null;
  let stripeElements = null;
  let stripePaymentElement = null;

  function getStripe() {
    if (!stripeInstance) {
      const key = window.APP_CONFIG?.STRIPE_PUBLISHABLE_KEY;
      if (!key || key.includes('REEMPLAZA')) {
        throw new Error('Configura STRIPE_PUBLISHABLE_KEY en config.js');
      }
      stripeInstance = Stripe(key);
    }
    return stripeInstance;
  }

  async function fetchRentAmount() {
    try {
      const data = await apiGet('/api/properties', 'No se pudo obtener la propiedad');
      const properties = data.properties || [];
      const property = properties[0];
      return property?.rentAmount != null ? Number(property.rentAmount) : null;
    } catch (_) {
      return null;
    }
  }

  async function fetchData() {
    const data = await apiGet('/api/payments', 'No se pudieron cargar los pagos');
    const payments = data.payments || [];
    const summary = data.summary || buildSummary(payments);
    return { payments, summary };
  }

  function buildSummary(payments) {
    return {
      total: payments.reduce((s, p) => s + (Number(p.amount) || 0), 0),
      pagado: payments.filter((p) => p.status === 'pagado').reduce((s, p) => s + (Number(p.amount) || 0), 0),
      enRevision: payments.filter((p) => p.status === 'en_revision' || p.status === 'pendiente').reduce((s, p) => s + (Number(p.amount) || 0), 0),
      porCobrar: payments.filter((p) => p.status === 'rechazado').reduce((s, p) => s + (Number(p.amount) || 0), 0)
    };
  }

  async function createPaymentIntent(payload) {
    const data = await apiPost('/api/payments', payload, 'No se pudo iniciar el pago');
    return { clientSecret: data.clientSecret, paymentId: data.paymentId, payment: data.payment };
  }

  function mountStripeElement(clientSecret) {
    const stripe = getStripe();
    stripeElements = stripe.elements({ clientSecret, locale: 'es' });
    stripePaymentElement = stripeElements.create('payment');
    const container = document.getElementById('stripe-payment-element');
    if (container) {
      container.innerHTML = '';
      stripePaymentElement.on('loaderror', (event) => {
        const errDiv = document.getElementById('stripe-error-message');
        if (errDiv) {
          errDiv.textContent = event.error?.message || 'No se pudo cargar el formulario de pago. Verifica la configuración de Stripe.';
          errDiv.style.display = 'block';
        }
        const payBtn = document.getElementById('stripe-pay-btn');
        if (payBtn) payBtn.disabled = true;
      });
      stripePaymentElement.mount('#stripe-payment-element');
    }
    return stripeElements;
  }

  async function confirmPayment() {
    const stripe = getStripe();
    const { error } = await stripe.confirmPayment({ elements: stripeElements, redirect: 'if_required' });
    if (error) throw new Error(error.message);
  }

  function unmountStripeElement() {
    if (stripePaymentElement) {
      try { stripePaymentElement.unmount(); } catch (_) {}
      stripePaymentElement = null;
    }
    stripeElements = null;
  }

  function mapToMovements(payments) {
    return payments.map((payment) => ({
      tipo: 'Pago',
      titulo: payment.concept,
      fecha: payment.paymentDate || payment.createdAt || payment.id,
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
    if (summary.porCobrar > 0) { paymentStatus.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Pago pendiente'; return; }
    if (summary.enRevision > 0) { paymentStatus.innerHTML = '<i class="fa-solid fa-hourglass-half"></i> Pago en revisión'; return; }
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
    fetchRentAmount, fetchData, createPaymentIntent, mountStripeElement, confirmPayment, unmountStripeElement,
    mapToMovements, renderPaymentStatus, renderFinanceSummary, renderPayments
  };
})();

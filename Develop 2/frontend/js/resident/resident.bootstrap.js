(function initResidentBootstrap() {
  window.__residentBootstrapSkipLegacy = true;

  async function bootResident() {
    if (window.__residentBootstrapInitialized) {
      return;
    }

    if (window.ResidentSections?.loadAll) {
      try {
        await window.ResidentSections.loadAll();
      } catch (error) {
        console.error('Error cargando fragments de Residente:', error);
        showFeedback?.(error.message || 'No se pudieron cargar las secciones del dashboard', 'error');
        return;
      }
    }

    window.__residentBootstrapInitialized = true;

    const currentUser = await requireAuth('residente');
    if (!currentUser) {
      return;
    }

    const logoutLink = document.getElementById('logout-link');
    if (logoutLink) {
      logoutLink.addEventListener('click', (event) => {
        event.preventDefault();
        logout();
      });
    }

    const cachedUser = getUser() || {
      id: currentUser.sub,
      email: currentUser.email,
      name: currentUser.name,
      role: currentUser.role,
      condominioId: currentUser.condominioId,
      propertyId: currentUser.propertyId || null
    };

    ResidentStore.set('currentUser', cachedUser);
    const residentViewModel = ResidentHomeScreen.buildResidentViewModel(cachedUser);
    ResidentStore.set('residentViewModel', residentViewModel);
    ResidentHomeScreen.renderProfile(residentViewModel);

    ResidentHomeScreen.applyPaymentWindowToButton(cachedUser);
    const paymentWindowHint = document.getElementById('payment-window-hint');
    if (paymentWindowHint && cachedUser.paymentDayStart && cachedUser.paymentDayEnd) {
      paymentWindowHint.textContent = `Días ${cachedUser.paymentDayStart}–${cachedUser.paymentDayEnd} del mes`;
    }

    setLoadingState('activity-list', 'Cargando movimientos...');
    setLoadingState('notices-list', 'Cargando avisos...');

    await ResidentHomeScreen.refreshDashboard();

    try {
      const amenities = await ResidentReservationsScreen.fetchAmenities();
      ResidentStore.set('amenities', amenities);
      ResidentReservationsScreen.renderAmenitiesSelect(amenities.filter((amenity) => amenity.status === 'activa'));
      ResidentReservationsScreen.resetAvailabilityState('Selecciona una amenidad para consultar horarios.');
    } catch (error) {
      showFeedback(error.message, 'error');
    }

    const ticketForm = document.getElementById('ticketForm');
    const paymentForm = document.getElementById('paymentForm');
    const reservationForm = document.getElementById('reservationForm');
    const visitForm = document.getElementById('visitForm');
    const ticketFeedback = document.getElementById('ticket-feedback');
    const paymentFeedback = document.getElementById('payment-feedback');
    const reservationFeedback = document.getElementById('reservation-feedback');
    const reservationSlotsFeedback = document.getElementById('reservation-slots-feedback');
    const visitFeedback = document.getElementById('visit-feedback');
    const reservationAmenitySelect = document.getElementById('reservationAmenityId');
    const reservationDateInput = document.getElementById('reservationDate');

    if (ticketForm) {
      ticketForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const title = document.getElementById('ticketTitle').value.trim();
        const description = document.getElementById('ticketDescription').value.trim();

        if (!title || !description) {
          ticketFeedback.textContent = 'Título y descripción son requeridos';
          ticketFeedback.className = 'modal-feedback error';
          showFeedback('Título y descripción son requeridos', 'error');
          return;
        }

        try {
          ticketFeedback.textContent = '';
          setButtonLoadingState(ticketForm.querySelector('button[type="submit"]'), true, 'Enviando...');
          await ResidentTicketsScreen.createTicket({ title, description });
          ticketForm.reset();
          ResidentShared.closeAllModals();
          await ResidentHomeScreen.refreshDashboard();
          showFeedback('Reporte enviado correctamente', 'success');
        } catch (error) {
          ticketFeedback.textContent = error.message;
          ticketFeedback.className = 'modal-feedback error';
          showFeedback(error.message, 'error');
        } finally {
          setButtonLoadingState(ticketForm.querySelector('button[type="submit"]'), false);
        }
      });
    }

    let cachedRentAmount = null;
    let paymentOrigin = 'service';
    let activePaymentId = null;

    function resetPaymentModal() {
      ResidentPaymentsScreen.unmountStripeElement();
      const s0 = document.getElementById('stripe-step-0');
      const s1 = document.getElementById('stripe-step-1');
      const s2 = document.getElementById('stripe-step-2');
      if (s0) s0.style.display = 'block';
      if (s1) s1.style.display = 'none';
      if (s2) s2.style.display = 'none';
      if (paymentForm) paymentForm.reset();
      if (paymentFeedback) { paymentFeedback.textContent = ''; paymentFeedback.className = 'modal-feedback'; }
      activePaymentId = null;
    }
    window.resetPaymentModal = resetPaymentModal;

    async function goToStripeStep(concept, amount) {
      const { clientSecret, paymentId } = await ResidentPaymentsScreen.createPaymentIntent({ concept, amount });
      activePaymentId = paymentId || null;
      ResidentPaymentsScreen.mountStripeElement(clientSecret);
      document.getElementById('stripe-payment-summary').textContent = `${concept} — $${Number(amount).toLocaleString('es-MX')} MXN`;
      document.getElementById('stripe-step-0').style.display = 'none';
      document.getElementById('stripe-step-1').style.display = 'none';
      document.getElementById('stripe-step-2').style.display = 'block';
    }

    ResidentPaymentsScreen.fetchRentAmount().then((amount) => {
      cachedRentAmount = amount;
      const rentLabel = document.getElementById('pay-rent-amount-label');
      if (rentLabel) rentLabel.textContent = amount != null ? `$${Number(amount).toLocaleString('es-MX')} MXN` : 'No configurada';
      const rentBtn = document.getElementById('pay-rent-btn');
      if (rentBtn) rentBtn.disabled = amount == null;
    });

    const payRentBtn = document.getElementById('pay-rent-btn');
    if (payRentBtn) {
      payRentBtn.addEventListener('click', async () => {
        if (cachedRentAmount == null) return;
        paymentOrigin = 'rent';
        const now = new Date();
        const concept = `Renta ${now.toLocaleString('es-MX', { month: 'long', year: 'numeric' })}`;
        try {
          setButtonLoadingState(payRentBtn, true, 'Procesando...');
          await goToStripeStep(concept, cachedRentAmount);
        } catch (error) {
          showFeedback(error.message, 'error');
        } finally {
          setButtonLoadingState(payRentBtn, false);
        }
      });
    }

    const payServiceBtn = document.getElementById('pay-service-btn');
    if (payServiceBtn) {
      payServiceBtn.addEventListener('click', () => {
        paymentOrigin = 'service';
        document.getElementById('stripe-step-0').style.display = 'none';
        document.getElementById('stripe-step-1').style.display = 'block';
      });
    }

    const stripeStep1BackBtn = document.getElementById('stripe-step1-back-btn');
    if (stripeStep1BackBtn) {
      stripeStep1BackBtn.addEventListener('click', () => {
        document.getElementById('stripe-step-1').style.display = 'none';
        document.getElementById('stripe-step-0').style.display = 'block';
        if (paymentForm) paymentForm.reset();
        if (paymentFeedback) { paymentFeedback.textContent = ''; paymentFeedback.className = 'modal-feedback'; }
      });
    }

    if (paymentForm) {
      paymentForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const concept = document.getElementById('paymentConcept').value.trim();
        const amount = Number(document.getElementById('paymentAmount').value);

        if (!concept || !Number.isFinite(amount) || amount <= 0) {
          paymentFeedback.textContent = 'Concepto y monto válidos son requeridos';
          paymentFeedback.className = 'modal-feedback error';
          return;
        }

        try {
          paymentFeedback.textContent = '';
          setButtonLoadingState(paymentForm.querySelector('button[type="submit"]'), true, 'Procesando...');
          await goToStripeStep(concept, amount);
        } catch (error) {
          paymentFeedback.textContent = error.message;
          paymentFeedback.className = 'modal-feedback error';
          showFeedback(error.message, 'error');
        } finally {
          setButtonLoadingState(paymentForm.querySelector('button[type="submit"]'), false);
        }
      });
    }

    const stripeBackBtn = document.getElementById('stripe-back-btn');
    if (stripeBackBtn) {
      stripeBackBtn.addEventListener('click', () => {
        ResidentPaymentsScreen.unmountStripeElement();
        document.getElementById('stripe-step-2').style.display = 'none';
        if (paymentOrigin === 'rent') {
          document.getElementById('stripe-step-0').style.display = 'block';
        } else {
          document.getElementById('stripe-step-1').style.display = 'block';
        }
      });
    }

    const stripePayBtn = document.getElementById('stripe-pay-btn');
    if (stripePayBtn) {
      stripePayBtn.addEventListener('click', async () => {
        const errDiv = document.getElementById('stripe-error-message');
        try {
          setButtonLoadingState(stripePayBtn, true, 'Procesando...');
          if (errDiv) errDiv.style.display = 'none';
          await ResidentPaymentsScreen.confirmPayment();
          if (activePaymentId) {
            try { await apiGet(`/api/payments/${encodeURIComponent(activePaymentId)}`); } catch (_) {}
          }
          resetPaymentModal();
          ResidentShared.closeAllModals();
          await ResidentHomeScreen.refreshDashboard();
          showFeedback('Pago procesado correctamente', 'success');
        } catch (error) {
          if (errDiv) { errDiv.textContent = error.message; errDiv.style.display = 'block'; }
          showFeedback(error.message, 'error');
        } finally {
          setButtonLoadingState(stripePayBtn, false);
        }
      });
    }

    if (reservationForm) {
      reservationForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const amenitySelect = document.getElementById('reservationAmenityId');
        const amenityId = amenitySelect.value.trim();
        const amenityName = amenitySelect.options[amenitySelect.selectedIndex]?.dataset.name || '';
        const reservationDate = document.getElementById('reservationDate').value;
        const timeSlot = document.getElementById('reservationTimeSlot').value.trim();

        if (!amenityId || !amenityName || !reservationDate || !timeSlot) {
          reservationFeedback.textContent = 'Todos los campos de reserva son requeridos';
          reservationFeedback.className = 'modal-feedback error';
          showFeedback('Todos los campos de reserva son requeridos', 'error');
          return;
        }

        try {
          reservationFeedback.textContent = '';
          reservationSlotsFeedback.textContent = '';
          setButtonLoadingState(reservationForm.querySelector('button[type="submit"]'), true, 'Solicitando...');
          await ResidentReservationsScreen.createReservation({ amenityId, amenityName, reservationDate, timeSlot });
          reservationForm.reset();
          ResidentReservationsScreen.resetAvailabilityState('Selecciona una amenidad para consultar horarios.');
          ResidentShared.closeAllModals();
          await ResidentHomeScreen.refreshDashboard();
          showFeedback('Reserva solicitada correctamente', 'success');
        } catch (error) {
          reservationFeedback.textContent = error.message;
          reservationFeedback.className = 'modal-feedback error';
          showFeedback(error.message, 'error');
        } finally {
          setButtonLoadingState(reservationForm.querySelector('button[type="submit"]'), false);
        }
      });
    }

    if (visitForm) {
      visitForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const visitorName = document.getElementById('visitVisitorName').value.trim();
        const visitDate = document.getElementById('visitDate').value;

        if (!visitorName || !visitDate) {
          visitFeedback.textContent = 'Nombre del visitante y fecha son requeridos';
          visitFeedback.className = 'modal-feedback error';
          showFeedback('Nombre del visitante y fecha son requeridos', 'error');
          return;
        }

        try {
          visitFeedback.textContent = '';
          setButtonLoadingState(visitForm.querySelector('button[type="submit"]'), true, 'Generando...');
          const visit = await ResidentVisitsScreen.createVisit({ visitorName, visitDate });
          visitForm.reset();
          ResidentVisitsScreen.renderVisitPassCard(visit);
          await ResidentHomeScreen.refreshDashboard();
          showFeedback('Pase generado correctamente', 'success');
        } catch (error) {
          visitFeedback.textContent = error.message;
          visitFeedback.className = 'modal-feedback error';
          showFeedback(error.message, 'error');
        } finally {
          setButtonLoadingState(visitForm.querySelector('button[type="submit"]'), false);
        }
      });
    }

    if (reservationAmenitySelect) {
      reservationAmenitySelect.addEventListener('change', ResidentReservationsScreen.refreshAvailability);
    }

    if (reservationDateInput) {
      reservationDateInput.addEventListener('change', ResidentReservationsScreen.refreshAvailability);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootResident);
  } else {
    void bootResident();
  }
})();
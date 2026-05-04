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

    if (paymentForm) {
      paymentForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const concept = document.getElementById('paymentConcept').value.trim();
        const amount = Number(document.getElementById('paymentAmount').value);

        if (!concept || !Number.isFinite(amount) || amount <= 0) {
          paymentFeedback.textContent = 'Concepto y monto válidos son requeridos';
          paymentFeedback.className = 'modal-feedback error';
          showFeedback('Concepto y monto válidos son requeridos', 'error');
          return;
        }

        try {
          paymentFeedback.textContent = '';
          setButtonLoadingState(paymentForm.querySelector('button[type="submit"]'), true, 'Registrando...');
          await ResidentPaymentsScreen.createPayment({ concept, amount });
          paymentForm.reset();
          ResidentShared.closeAllModals();
          await ResidentHomeScreen.refreshDashboard();
          showFeedback('Pago registrado correctamente', 'success');
        } catch (error) {
          paymentFeedback.textContent = error.message;
          paymentFeedback.className = 'modal-feedback error';
          showFeedback(error.message, 'error');
        } finally {
          setButtonLoadingState(paymentForm.querySelector('button[type="submit"]'), false);
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
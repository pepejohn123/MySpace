(function initResidentReservationsScreen() {
  async function fetchList() {
    const data = await apiGet('/api/reservations', 'No se pudieron cargar las reservas');
    return data.reservations || [];
  }

  async function fetchAmenities() {
    const data = await apiGet('/api/amenities', 'No se pudieron cargar las amenidades');
    return data.amenities || [];
  }

  async function createReservation(payload) {
    const data = await apiPost('/api/reservations', payload, 'No se pudo crear la reserva');
    return data.reservation;
  }

  async function fetchAvailability(amenityId, date) {
    const data = await apiGet(`/api/amenities/${encodeURIComponent(amenityId)}/availability?date=${encodeURIComponent(date)}`, 'No se pudo cargar la disponibilidad');
    return data.availability;
  }

  function mapToMovements(reservations) {
    return reservations.map((reservation) => ({
      tipo: 'Reserva',
      titulo: reservation.amenityName,
      fecha: `${reservation.reservationDate} • ${reservation.timeSlot}`,
      estado: reservation.status,
      color: ResidentShared.buildReservationColor(reservation.status)
    }));
  }

  function resetAvailabilityState(message = '') {
    const timeSlotSelect = document.getElementById('reservationTimeSlot');
    const slotsFeedback = document.getElementById('reservation-slots-feedback');

    if (timeSlotSelect) {
      timeSlotSelect.innerHTML = '<option value="">Selecciona un horario</option>';
      timeSlotSelect.disabled = true;
    }

    if (slotsFeedback) {
      slotsFeedback.textContent = message;
      slotsFeedback.className = 'modal-feedback';
    }
  }

  function setLoadingAvailabilityState(message) {
    const timeSlotSelect = document.getElementById('reservationTimeSlot');
    const slotsFeedback = document.getElementById('reservation-slots-feedback');

    if (timeSlotSelect) {
      timeSlotSelect.innerHTML = '<option value="">Consultando horarios...</option>';
      timeSlotSelect.disabled = true;
    }

    if (slotsFeedback) {
      slotsFeedback.textContent = message;
      slotsFeedback.className = 'modal-feedback';
    }
  }

  function renderAmenitiesSelect(amenities) {
    const amenitySelect = document.getElementById('reservationAmenityId');
    if (!amenitySelect) return;

    window.__amenitiesCache = amenities;
    amenitySelect.innerHTML = '<option value="">Selecciona una amenidad</option>';

    amenities.forEach((amenity) => {
      amenitySelect.innerHTML += `<option value="${amenity.id}" data-name="${amenity.name}">${amenity.name}</option>`;
    });
  }

  function refreshAvailability() {
    const amenitySelect = document.getElementById('reservationAmenityId');
    const reservationDateInput = document.getElementById('reservationDate');

    if (!amenitySelect || !reservationDateInput) return;

    const amenityId = amenitySelect.value;
    const reservationDate = reservationDateInput.value;

    if (!amenityId) {
      resetAvailabilityState('Selecciona una amenidad para consultar horarios.');
      return;
    }

    if (!reservationDate) {
      resetAvailabilityState('Selecciona una fecha para ver disponibilidad.');
      return;
    }

    updateAvailabilityByDate();
  }

  async function updateAvailabilityByDate() {
    const amenitySelect = document.getElementById('reservationAmenityId');
    const reservationDateInput = document.getElementById('reservationDate');
    const slotsFeedback = document.getElementById('reservation-slots-feedback');
    const timeSlotSelect = document.getElementById('reservationTimeSlot');

    if (!amenitySelect || !reservationDateInput || !slotsFeedback || !timeSlotSelect) return;

    const amenityId = amenitySelect.value;
    const reservationDate = reservationDateInput.value;

    if (!amenityId || !reservationDate) {
      resetAvailabilityState();
      return;
    }

    setLoadingAvailabilityState('Consultando disponibilidad...');

    try {
      const availability = await fetchAvailability(amenityId, reservationDate);
      timeSlotSelect.innerHTML = '<option value="">Selecciona un horario</option>';
      timeSlotSelect.disabled = false;

      if (!availability.availableSlots.length) {
        slotsFeedback.textContent = 'No hay horarios disponibles para esta fecha';
        slotsFeedback.className = 'modal-feedback error';
        timeSlotSelect.disabled = true;
        return;
      }

      availability.availableSlots.forEach((slot) => {
        timeSlotSelect.innerHTML += `<option value="${slot}">${slot}</option>`;
      });

      slotsFeedback.textContent = `Horarios disponibles: ${availability.availableSlots.length}`;
      slotsFeedback.className = 'modal-feedback success';
    } catch (error) {
      timeSlotSelect.innerHTML = '<option value="">Selecciona un horario</option>';
      timeSlotSelect.disabled = true;
      slotsFeedback.textContent = error.message;
      slotsFeedback.className = 'modal-feedback error';
    }
  }

  window.ResidentReservationsScreen = {
    fetchList,
    fetchAmenities,
    createReservation,
    fetchAvailability,
    mapToMovements,
    resetAvailabilityState,
    setLoadingAvailabilityState,
    renderAmenitiesSelect,
    refreshAvailability,
    updateAvailabilityByDate
  };
})();

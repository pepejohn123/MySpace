(function initAdminReservationsScreen() {
  const state = {
    reservations: [],
    amenities: [],
    currentMode: 'window',
    currentFilters: {
      status: 'all',
      amenityId: 'all',
      search: '',
      startDate: '',
      endDate: ''
    }
  };

  function normalizarFecha(dateValue) {
    const safeValue = String(dateValue || '').trim();
    if (!safeValue) {
      return null;
    }

    const normalized = safeValue.length <= 10 ? `${safeValue}T12:00:00` : safeValue;
    const parsed = new Date(normalized);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  function getWindowMeta(reservation) {
    const reservationDate = normalizarFecha(reservation.fecha);
    if (!reservationDate) {
      return {
        isWithinWindow: false,
        bucket: 'fuera_de_rango',
        diffDays: Number.POSITIVE_INFINITY,
        label: 'Fecha inválida'
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(reservationDate);
    compareDate.setHours(0, 0, 0, 0);

    const diffDays = Math.round((compareDate - today) / (1000 * 60 * 60 * 24));
    const isWithinWindow = diffDays >= -7 && diffDays <= 7;

    if (diffDays < 0) {
      return {
        isWithinWindow,
        bucket: 'expired_recently',
        diffDays,
        label: `Vencida hace ${Math.abs(diffDays)} día(s)`
      };
    }

    if (diffDays === 0) {
      return {
        isWithinWindow,
        bucket: 'today',
        diffDays,
        label: 'Ocurre hoy'
      };
    }

    return {
      isWithinWindow,
      bucket: 'upcoming',
      diffDays,
      label: `En ${diffDays} día(s)`
    };
  }

  function getStatusClass(status) {
    const normalized = String(status || '').toLowerCase().replace(/\s+/g, '_');
    return `reservation-status-${normalized || 'pendiente'}`;
  }

  function getContainer() {
    return document.getElementById('reservas-container');
  }

  function compareReservationsDesc(left, right) {
    const leftDate = normalizarFecha(left.fecha);
    const rightDate = normalizarFecha(right.fecha);

    const leftTime = leftDate ? leftDate.getTime() : 0;
    const rightTime = rightDate ? rightDate.getTime() : 0;

    if (leftTime !== rightTime) {
      return rightTime - leftTime;
    }

    return String(right.horario || '').localeCompare(String(left.horario || ''), 'es', { numeric: true });
  }

  function getSourceReservationsByMode() {
    const sorted = [...state.reservations].sort(compareReservationsDesc);

    if (state.currentMode === 'all_recent') {
      return sorted.slice(0, 20);
    }

    if (state.currentMode === 'custom') {
      const startDate = normalizarFecha(state.currentFilters.startDate);
      const endDate = normalizarFecha(state.currentFilters.endDate);

      return sorted.filter((reservation) => {
        const reservationDate = normalizarFecha(reservation.fecha);
        if (!reservationDate) {
          return false;
        }

        if (startDate && reservationDate < startDate) {
          return false;
        }

        if (endDate && reservationDate > endDate) {
          return false;
        }

        return true;
      });
    }

    return sorted.filter((reservation) => getWindowMeta(reservation).isWithinWindow);
  }

  function buildSummary(list) {
    return {
      total: list.length,
      upcoming: list.filter((reservation) => {
        const meta = getWindowMeta(reservation);
        return meta.bucket === 'upcoming' || meta.bucket === 'today';
      }).length,
      expired: list.filter((reservation) => getWindowMeta(reservation).bucket === 'expired_recently').length,
      pending: list.filter((reservation) => String(reservation.estado || '').toLowerCase() === 'pendiente').length
    };
  }

  function getWindowLabel() {
    if (state.currentMode === 'custom') {
      if (state.currentFilters.startDate || state.currentFilters.endDate) {
        return `Intervalo: ${state.currentFilters.startDate || '...'} → ${state.currentFilters.endDate || '...'}`;
      }
      return 'Intervalo personalizado';
    }

    if (state.currentMode === 'all_recent') {
      return 'Todas recientes · top 20';
    }

    return 'Ventana activa: hoy ± 7 días';
  }

  function syncDateRangeVisibility() {
    const dateRange = document.getElementById('reservas-date-range');
    if (!dateRange) {
      return;
    }

    dateRange.classList.toggle('admin-hidden', state.currentMode !== 'custom');
  }

  function populateAmenityOptions() {
    const amenityFilter = document.getElementById('reservas-amenity-filter');
    if (!amenityFilter) {
      return;
    }

    const currentValue = state.currentFilters.amenityId || 'all';
    amenityFilter.innerHTML = '<option value="all">Todas las amenidades</option>';
    state.amenities.forEach((amenity) => {
      amenityFilter.innerHTML += `<option value="${amenity.id}">${amenity.name}</option>`;
    });

    const hasCurrentValue = Array.from(amenityFilter.options).some((option) => option.value === currentValue);
    amenityFilter.value = hasCurrentValue ? currentValue : 'all';
  }

  function renderShell(baseList) {
    const summary = buildSummary(baseList);
    const modeFilter = document.getElementById('reservas-view-mode-filter');
    const statusFilter = document.getElementById('reservas-status-filter');
    const amenityFilter = document.getElementById('reservas-amenity-filter');
    const searchFilter = document.getElementById('reservas-search-filter');
    const startDateFilter = document.getElementById('reservas-start-date-filter');
    const endDateFilter = document.getElementById('reservas-end-date-filter');
    const totalValue = document.getElementById('reservas-summary-total');
    const upcomingValue = document.getElementById('reservas-summary-upcoming');
    const expiredValue = document.getElementById('reservas-summary-expired');
    const pendingValue = document.getElementById('reservas-summary-pending');
    const windowLabel = document.getElementById('reservas-window-label');

    if (totalValue) totalValue.textContent = String(summary.total);
    if (upcomingValue) upcomingValue.textContent = String(summary.upcoming);
    if (expiredValue) expiredValue.textContent = String(summary.expired);
    if (pendingValue) pendingValue.textContent = String(summary.pending);
    if (windowLabel) windowLabel.textContent = getWindowLabel();

    if (modeFilter) modeFilter.value = state.currentMode;
    if (statusFilter) statusFilter.value = state.currentFilters.status;
    populateAmenityOptions();
    if (searchFilter) searchFilter.value = state.currentFilters.search;
    if (startDateFilter) startDateFilter.value = state.currentFilters.startDate;
    if (endDateFilter) endDateFilter.value = state.currentFilters.endDate;

    syncDateRangeVisibility();

    bindEvents();
  }

  function bindEvents() {
    const modeFilter = document.getElementById('reservas-view-mode-filter');
    const statusFilter = document.getElementById('reservas-status-filter');
    const amenityFilter = document.getElementById('reservas-amenity-filter');
    const searchFilter = document.getElementById('reservas-search-filter');
    const startDateFilter = document.getElementById('reservas-start-date-filter');
    const endDateFilter = document.getElementById('reservas-end-date-filter');

    if (modeFilter && modeFilter.dataset.boundReservationsScreen !== 'true') {
      modeFilter.addEventListener('change', (event) => {
        state.currentMode = event.target.value;
        syncDateRangeVisibility();
        applyFilters();
      });
      modeFilter.dataset.boundReservationsScreen = 'true';
    }

    if (statusFilter && statusFilter.dataset.boundReservationsScreen !== 'true') {
      statusFilter.addEventListener('change', (event) => {
        state.currentFilters.status = event.target.value;
        applyFilters();
      });
      statusFilter.dataset.boundReservationsScreen = 'true';
    }

    if (amenityFilter && amenityFilter.dataset.boundReservationsScreen !== 'true') {
      amenityFilter.addEventListener('change', (event) => {
        state.currentFilters.amenityId = event.target.value;
        applyFilters();
      });
      amenityFilter.dataset.boundReservationsScreen = 'true';
    }

    if (searchFilter && searchFilter.dataset.boundReservationsScreen !== 'true') {
      searchFilter.addEventListener('input', (event) => {
        state.currentFilters.search = event.target.value;
        applyFilters();
      });
      searchFilter.dataset.boundReservationsScreen = 'true';
    }

    if (startDateFilter && startDateFilter.dataset.boundReservationsScreen !== 'true') {
      startDateFilter.addEventListener('change', (event) => {
        state.currentFilters.startDate = event.target.value;
        applyFilters();
      });
      startDateFilter.dataset.boundReservationsScreen = 'true';
    }

    if (endDateFilter && endDateFilter.dataset.boundReservationsScreen !== 'true') {
      endDateFilter.addEventListener('change', (event) => {
        state.currentFilters.endDate = event.target.value;
        applyFilters();
      });
      endDateFilter.dataset.boundReservationsScreen = 'true';
    }
  }

  function renderList(list) {
    const resultsGrid = document.getElementById('reservas-results-grid');
    if (!resultsGrid) {
      return;
    }

    resultsGrid.innerHTML = '';

    if (!list.length) {
      resultsGrid.innerHTML = '<div class="admin-empty-state">No hay reservas que coincidan con los filtros seleccionados.</div>';
      return;
    }

    list.forEach((reservation) => {
      const meta = getWindowMeta(reservation);
      resultsGrid.innerHTML += `
        <div class="card reservation-card" onclick="openReservaActionModal('${reservation.id}')" style="cursor: pointer;">
          <div class="card-info">
            <div class="reservation-card-header">
              <div>
                <h3>${reservation.amenidad}</h3>
                <p>${reservation.residente || 'Sin residente'}</p>
              </div>
              <span class="reservation-status-badge ${getStatusClass(reservation.estado)}">${reservation.estado}</span>
            </div>
            <div class="reservation-card-meta">
              <span><strong>Fecha:</strong> ${reservation.fecha}</span>
              <span><strong>Horario:</strong> ${reservation.horario}</span>
              <span><strong>Propiedad:</strong> ${reservation.propertyId || 'Sin propiedad'}</span>
              <span><strong>Ventana:</strong> ${meta.label}</span>
            </div>
          </div>
        </div>
      `;
    });
  }

  function applyFilters() {
    const modeList = getSourceReservationsByMode();
    renderShell(modeList);

    const filtered = modeList.filter((reservation) => {
      const matchesStatus = state.currentFilters.status === 'all' || String(reservation.estado || '').toLowerCase() === state.currentFilters.status;
      const matchesAmenity = state.currentFilters.amenityId === 'all' || reservation.amenityId === state.currentFilters.amenityId;
      const searchTarget = `${reservation.amenidad || ''} ${reservation.residente || ''} ${reservation.propertyId || ''} ${reservation.horario || ''}`.toLowerCase();
      const matchesSearch = !state.currentFilters.search || searchTarget.includes(state.currentFilters.search.toLowerCase());
      return matchesStatus && matchesAmenity && matchesSearch;
    });

    renderList(filtered);
    return filtered;
  }

  function openDetail(reservationId) {
    const reservation = state.reservations.find((item) => item.id === reservationId);
    if (!reservation) {
      return;
    }

    document.getElementById('res-area').textContent = reservation.amenidad;
    document.getElementById('res-user').textContent = [reservation.residente || 'Sin residente', reservation.propertyId || 'Sin propiedad'].join(' · ');
    document.getElementById('res-date').textContent = `${reservation.fecha} | ${reservation.horario}`;
    document.getElementById('res-status').textContent = reservation.estado;
    document.getElementById('modal-reserva-action').style.display = 'flex';
  }

  function getExportFilters() {
    return {
      viewMode: state.currentMode,
      status: state.currentFilters.status,
      amenityId: state.currentFilters.amenityId,
      search: state.currentFilters.search,
      startDate: state.currentFilters.startDate,
      endDate: state.currentFilters.endDate,
      limit: state.currentMode === 'all_recent' ? 20 : undefined,
      sort: 'desc'
    };
  }

  function mount({ containerId, reservations = [], amenities = [] } = {}) {
    if (containerId && containerId !== 'reservas-container') {
      return;
    }

    state.reservations = Array.isArray(reservations) && reservations.length
      ? reservations
      : (window.AdminStore?.get('reservations') || []);
    state.amenities = Array.isArray(amenities) && amenities.length
      ? amenities
      : (window.AdminStore?.get('amenities') || []);
    state.currentMode = 'window';
    state.currentFilters = {
      status: 'all',
      amenityId: 'all',
      search: '',
      startDate: '',
      endDate: ''
    };

    applyFilters();
  }

  window.AdminReservationsScreen = {
    mount,
    openDetail,
    applyFilters,
    renderList,
    getExportFilters,
    normalizarFecha,
    getWindowMeta,
    getStatusClass
  };

  window.openReservaActionModal = openDetail;
})();
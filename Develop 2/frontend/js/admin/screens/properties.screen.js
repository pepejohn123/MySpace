(function initAdminPropertiesScreen() {
  const state = {
    properties: [],
    modalMode: 'create',
    selectedPropertyId: null
  };

  function getCardsContainer() {
    return document.getElementById('propiedades-container');
  }

  function getPropertyDetailModal() {
    return document.getElementById('property-detail-modal');
  }

  function getPropertyFormModal() {
    return document.getElementById('property-form-modal');
  }

  function getAssignResidentModal() {
    return document.getElementById('assign-resident-modal');
  }

  function getFilters() {
    return {
      search: document.getElementById('property-name-filter')?.value.trim().toLowerCase() || '',
      status: document.getElementById('property-status-filter')?.value || 'all',
      building: document.getElementById('property-building-filter')?.value || 'all',
      resident: document.getElementById('property-resident-filter')?.value || 'all'
    };
  }

  function mapProperty(property) {
    if (typeof mapAwsPropertyToCard === 'function') {
      return {
        ...mapAwsPropertyToCard(property),
        id: property.id,
        nombre: property.name || property.id,
        residente: property.residentName || property.residentId || 'Sin residente asignado',
        building: property.building || 'General',
        status: property.status || 'disponible'
      };
    }

    return {
      id: property.id,
      nombre: property.name,
      residente: property.residentName || property.residentId || 'Sin residente asignado',
      building: property.building || 'General',
      status: property.status || 'disponible',
      imagen: window.DEFAULT_PROPERTY_IMAGE || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=500&q=60'
    };
  }

  function formatearFechaLegible(fechaIso) {
    if (!fechaIso) return 'N/A';
    const fecha = new Date(fechaIso);
    return fecha.toLocaleString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function filterList(properties, filters) {
    return properties.filter((property) => {
      const searchTarget = `${property.name || ''} ${property.id || ''}`.toLowerCase();
      const matchesSearch = !filters.search || searchTarget.includes(filters.search);
      const matchesStatus = filters.status === 'all' || property.status === filters.status;
      const matchesBuilding = filters.building === 'all' || (property.building || 'General') === filters.building;
      const hasResident = Boolean(property.residentId || property.residentName);
      const matchesResident =
        filters.resident === 'all'
        || (filters.resident === 'assigned' && hasResident)
        || (filters.resident === 'unassigned' && !hasResident);

      return matchesSearch && matchesStatus && matchesBuilding && matchesResident;
    });
  }

  function renderCards(list) {
    const container = getCardsContainer();
    if (!container) {
      return;
    }

    container.innerHTML = '';

    if (!list.length) {
      container.innerHTML = '<p>No hay propiedades registradas todavía.</p>';
      return;
    }

    list.forEach((propertyRaw) => {
      const property = mapProperty(propertyRaw);
      container.innerHTML += `
<button class="property-card-button" onclick="verDetallePropiedad('${property.id}')">
  <div class="card">
    <div class="card-img-wrap">
      <img src="${property.imagen}">
      <span class="status-badge ${typeof buildPropertyStatusClass === 'function' ? buildPropertyStatusClass(property.status) : ''}">${property.status || 'disponible'}</span>
    </div>
    <div class="card-info">
      <h3>${property.nombre}</h3>
      <p>${property.building}</p>
      <p style="color: #666; font-size: 0.9em;">
        ${property.residente && property.residente !== 'Sin residente asignado' ? `👤 ${property.residente}` : '🏠 Sin residente'}
      </p>
    </div>
  </div>
</button>
`;
    });
  }

  function populateFilters(properties = state.properties) {
    state.properties = Array.isArray(properties) ? properties : state.properties;
    const buildingFilter = document.getElementById('property-building-filter');
    if (!buildingFilter) {
      return;
    }

    const currentValue = buildingFilter.value || 'all';
    const buildings = [...new Set(state.properties.map((property) => property.building || 'General'))].sort();

    buildingFilter.innerHTML = '<option value="all">Todos los edificios</option>';
    buildings.forEach((building) => {
      buildingFilter.innerHTML += `<option value="${building}">${building}</option>`;
    });
    buildingFilter.value = buildings.includes(currentValue) ? currentValue : 'all';
  }

  function applyFilters() {
    const filtered = filterList(state.properties, getFilters());
    renderCards(filtered);
    return filtered;
  }

  function bindEvents() {
    ['property-name-filter', 'property-status-filter', 'property-building-filter', 'property-resident-filter'].forEach((id) => {
      const element = document.getElementById(id);
      if (!element || element.dataset.boundPropertiesScreen === 'true') {
        return;
      }

      const eventName = element.tagName === 'INPUT' ? 'input' : 'change';
      element.addEventListener(eventName, applyFilters);
      element.dataset.boundPropertiesScreen = 'true';
    });
  }

  async function reloadProperties() {
    const data = await apiGet('/api/properties', 'No se pudieron cargar las propiedades');
    const properties = Array.isArray(data) ? data : (data.properties || []);
    state.properties = properties;
    window.AdminStore?.set('properties', properties);
    populateFilters(properties);
    applyFilters();
    return properties;
  }

  function renderDetail(property) {
    const detailContent = document.getElementById('property-detail-content');
    if (!detailContent) {
      return;
    }

    const fechaCreacion = formatearFechaLegible(property.createdAt);
    const fechaActualizacion = formatearFechaLegible(property.updatedAt);

    detailContent.innerHTML = `
      <div class="property-detail-header">
        <h3 class="property-detail-title">${property.name}</h3>
        <span class="badge ${typeof buildPropertyStatusClass === 'function' ? buildPropertyStatusClass(property.status) : ''}">${property.status || 'disponible'}</span>
      </div>
      <div class="property-detail-grid">
        <div class="property-detail-item">
          <span class="property-detail-label">ID</span>
          <span class="property-detail-value">${property.id}</span>
        </div>
        <div class="property-detail-item">
          <span class="property-detail-label">Edificio / sección</span>
          <span class="property-detail-value">${property.building || 'General'}</span>
        </div>
        <div class="property-detail-item">
          <span class="property-detail-label">Condominio</span>
          <span class="property-detail-value">${property.condominioId || property.PK || 'Sin condominio'}</span>
        </div>
        <div class="property-detail-item">
          <span class="property-detail-label">Residente asignado</span>
          <span class="property-detail-value">${property.residentName || property.residentId || 'Nombre de residente no disponible'}</span>
        </div>
        <div class="property-detail-item">
          <span class="property-detail-label">Creado</span>
          <span class="property-detail-value">${fechaCreacion}</span>
        </div>
        <div class="property-detail-item">
          <span class="property-detail-label">Actualizado</span>
          <span class="property-detail-value">${fechaActualizacion}</span>
        </div>
      </div>
      <div class="service-card-actions" style="margin-top:20px;">
        <button class="admin-secondary-btn" onclick="openPropertyFormModal('edit', '${property.id}')">Editar</button>
        <button class="admin-secondary-btn" onclick="openAssignResidentModal('${property.id}')">Asignar residente</button>
        <button class="admin-danger-btn" onclick="confirmarEliminarPropiedad('${property.id}')">Eliminar</button>
      </div>
    `;
  }

  async function openDetail(propertyId) {
    const modal = getPropertyDetailModal();
    const detailContent = document.getElementById('property-detail-content');
    if (!modal || !detailContent) {
      return;
    }

    modal.style.display = 'flex';
    detailContent.innerHTML = '<div class="loading-state">Cargando detalle de propiedad...</div>';

    try {
      const data = await apiGet(`/api/properties/${encodeURIComponent(propertyId)}`, 'No se pudo cargar el detalle de la propiedad');
      renderDetail(data.property || data);
    } catch (error) {
      detailContent.innerHTML = `<div class="admin-error-state">${error.message}</div>`;
    }
  }

  function closeDetail(event, overlay) {
    if (event && overlay && event.target !== overlay) {
      return;
    }

    const modal = getPropertyDetailModal();
    const detailContent = document.getElementById('property-detail-content');
    if (modal) {
      modal.style.display = 'none';
    }
    if (detailContent) {
      detailContent.innerHTML = '<div class="loading-state">Cargando detalle de propiedad...</div>';
    }
  }

  function openForm(mode = 'create', propertyId = null) {
    const modal = getPropertyFormModal();
    const title = document.getElementById('property-form-title');
    const submitButton = document.getElementById('property-form-submit-btn');
    const form = document.getElementById('property-form');

    state.modalMode = mode;
    state.selectedPropertyId = propertyId;

    if (form) form.reset();
    if (title) title.textContent = mode === 'edit' ? 'Editar propiedad' : 'Nueva propiedad';
    if (submitButton) submitButton.textContent = mode === 'edit' ? 'Guardar cambios' : 'Guardar propiedad';

    if (mode === 'edit' && propertyId) {
      apiGet(`/api/properties/${encodeURIComponent(propertyId)}`, 'No se pudo cargar el detalle de la propiedad')
        .then((data) => {
          const property = data.property || data;
          document.getElementById('property-form-name').value = property.name || '';
          document.getElementById('property-form-building').value = property.building || '';
          document.getElementById('property-form-status').value = property.status || 'disponible';
        })
        .catch((error) => showFeedback(error.message, 'error'));
    }

    if (modal) modal.style.display = 'flex';
  }

  function closeForm(event, overlay) {
    if (event && overlay && event.target !== overlay) {
      return;
    }

    const modal = getPropertyFormModal();
    if (modal) modal.style.display = 'none';
  }

  async function submitForm(event) {
    if (event) event.preventDefault();

    const payload = {
      name: document.getElementById('property-form-name').value,
      building: document.getElementById('property-form-building').value || 'General',
      status: document.getElementById('property-form-status').value || 'disponible'
    };

    try {
      if (state.modalMode === 'edit' && state.selectedPropertyId) {
        await apiPatch(`/api/properties/${encodeURIComponent(state.selectedPropertyId)}`, payload, 'No se pudo actualizar la propiedad');
      } else {
        await apiPost('/api/properties', payload, 'No se pudo crear la propiedad');
      }

      closeForm();
      await new Promise((resolve) => setTimeout(resolve, 500));
      await reloadProperties();

      const detailModal = getPropertyDetailModal();
      if (detailModal && detailModal.style.display === 'flex' && state.selectedPropertyId) {
        openDetail(state.selectedPropertyId);
      }

      showFeedback('¡Información actualizada en pantalla!', 'success');
    } catch (error) {
      showFeedback(error.message, 'error');
    }
  }

  async function openAssignResident(propertyId) {
    const modal = getAssignResidentModal();
    const selectElement = document.getElementById('assign-resident-id');
    const propertyInput = document.getElementById('assign-resident-property-id');
    if (!modal || !selectElement || !propertyInput) {
      return;
    }

    propertyInput.value = propertyId;
    modal.style.display = 'flex';
    selectElement.innerHTML = '<option value="">Cargando residentes...</option>';
    selectElement.disabled = true;

    try {
      const data = await apiGet('/api/residents?unassigned=true', 'Error al cargar residentes');
      const residents = data.residents || [];

      if (!residents.length) {
        selectElement.innerHTML = `
          <option value="">No hay residentes disponibles</option>
          <option value="UNASSIGN">-- Sin residente (Desasignar) --</option>
        `;
        return;
      }

      selectElement.innerHTML = `
        <option value="">-- Selecciona una opción --</option>
        <option value="UNASSIGN">-- Sin residente (Desasignar) --</option>
      `;

      residents.forEach((resident) => {
        if (!resident.id || !resident.name || resident.name === 'undefined') return;
        const option = document.createElement('option');
        option.value = resident.id;
        option.textContent = resident.name;
        selectElement.appendChild(option);
      });

      selectElement.disabled = false;
    } catch (_error) {
      showFeedback('Error al cargar residentes', 'error');
      selectElement.innerHTML = '<option value="">Error al cargar</option>';
    }
  }

  function closeAssignResident(event, overlay) {
    if (event && overlay && event.target !== overlay) {
      return;
    }
    const modal = getAssignResidentModal();
    if (modal) modal.style.display = 'none';
  }

  async function confirmAssignResident(event) {
    if (event) event.preventDefault();

    const select = document.getElementById('assign-resident-id');
    const propertyId = document.getElementById('assign-resident-property-id')?.value;
    if (!select || !propertyId) {
      return;
    }

    let residentId = select.value;
    let residentName = null;

    if (residentId === 'UNASSIGN' || residentId === '') {
      residentId = null;
    } else {
      residentName = select.options[select.selectedIndex].textContent;
    }

    try {
      await apiPatch(`/api/properties/${encodeURIComponent(propertyId)}`, {
        residentId,
        residentName
      }, 'No se pudo actualizar la propiedad');

      closeAssignResident();
      await reloadProperties();

      const detailModal = getPropertyDetailModal();
      if (detailModal && detailModal.style.display === 'flex') {
        openDetail(propertyId);
      }

      showFeedback(residentId ? 'Residente asignado' : 'Propiedad liberada', 'success');
    } catch (error) {
      showFeedback(error.message, 'error');
    }
  }

  async function confirmDelete(propertyId) {
    if (!window.confirm('¿Seguro que quieres dar de baja esta propiedad?')) {
      return;
    }

    try {
      await apiDelete(`/api/properties/${encodeURIComponent(propertyId)}`, 'No se pudo eliminar la propiedad');
      closeDetail();
      await reloadProperties();
      showFeedback('Propiedad actualizada correctamente', 'success');
    } catch (error) {
      showFeedback(error.message, 'error');
    }
  }

  function mount({ properties = [] } = {}) {
    state.properties = Array.isArray(properties) && properties.length
      ? properties
      : (window.AdminStore?.get('properties') || []);
    populateFilters(state.properties);
    bindEvents();
    applyFilters();
  }

  window.AdminPropertiesScreen = {
    mount,
    bindEvents,
    applyFilters,
    filterList,
    getCurrentFilters: getFilters,
    populateFilters,
    mapProperty,
    renderDetail,
    openDetail,
    closeDetail,
    openForm,
    closeForm,
    submitForm,
    openAssignResident,
    closeAssignResident,
    confirmAssignResident,
    confirmDelete,
    reloadProperties
  };

  window.verDetallePropiedad = openDetail;
  window.closePropertyDetail = closeDetail;
  window.closePropertyDetailModal = () => closeDetail();
  window.openPropertyFormModal = openForm;
  window.closePropertyFormModal = closeForm;
  window.handlePropertyFormSubmit = submitForm;
  window.openAssignResidentModal = openAssignResident;
  window.closeAssignResidentModal = closeAssignResident;
  window.confirmarAsignacionResidente = confirmAssignResident;
  window.confirmarEliminarPropiedad = confirmDelete;
})();
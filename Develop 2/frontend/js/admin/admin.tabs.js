(function initAdminTabs() {
  function debug(scope, payload, extra = {}) {
    window.AdminShared?.debugPayload?.(scope, payload, extra);
  }

  function bindHistoryControls() {
    ['history-status-filter', 'history-priority-filter', 'history-period-filter'].forEach((id) => {
      const element = document.getElementById(id);
      if (!element || element.dataset.boundAdminTabs === 'true') return;
      element.addEventListener('change', actualizarHistorialTickets);
      element.dataset.boundAdminTabs = 'true';
    });

    const search = document.getElementById('history-search-filter');
    if (search && search.dataset.boundAdminTabs !== 'true') {
      search.addEventListener('input', actualizarHistorialTickets);
      search.dataset.boundAdminTabs = 'true';
    }
  }

  function bindVisitControls() {
    const validateVisitButton = document.getElementById('validate-visit-btn');
    const visitAccessCodeInput = document.getElementById('visit-access-code-input');
    const visitStatusFilter = document.getElementById('visit-status-filter');
    const visitSearchFilter = document.getElementById('visit-search-filter');

    if (validateVisitButton && visitAccessCodeInput && validateVisitButton.dataset.boundAdminTabs !== 'true') {
      validateVisitButton.addEventListener('click', async () => {
        const accessCode = visitAccessCodeInput.value.trim();

        if (!accessCode) {
          renderVisitValidationResult('Ingresa un código de acceso válido.', true);
          return;
        }

        try {
          setButtonLoadingState(validateVisitButton, true, 'Validando...');
          const visit = await validarVisitaPorCodigo(accessCode);
          renderVisitValidationResult(visit);
          visitsCache = await cargarVisitasDesdeApi();
          window.AdminStore?.set('visits', visitsCache);
          actualizarVistaVisitas();
          showFeedback('Acceso validado correctamente', 'success');
        } catch (error) {
          debug('Tab visitas validar error', error, { message: error.message });
          renderVisitValidationResult(error.message, true);
          showFeedback(error.message, 'error');
        } finally {
          setButtonLoadingState(validateVisitButton, false);
        }
      });
      validateVisitButton.dataset.boundAdminTabs = 'true';
    }

    if (visitStatusFilter && visitStatusFilter.dataset.boundAdminTabs !== 'true') {
      visitStatusFilter.addEventListener('change', actualizarVistaVisitas);
      visitStatusFilter.dataset.boundAdminTabs = 'true';
    }

    if (visitSearchFilter && visitSearchFilter.dataset.boundAdminTabs !== 'true') {
      visitSearchFilter.addEventListener('input', actualizarVistaVisitas);
      visitSearchFilter.dataset.boundAdminTabs = 'true';
    }
  }

  function bindAmenityForm() {
    const amenityForm = document.getElementById('amenity-form');
    if (!amenityForm || amenityForm.dataset.boundAdminTabs === 'true') return;

    amenityForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      try {
        const payload = {
          condominioId: 'CONDO#101',
          name: document.getElementById('amenity-name').value.trim(),
          description: document.getElementById('amenity-description').value.trim(),
          status: document.getElementById('amenity-status').value
        };

        debug('Tab servicios submit amenidad payload', payload);

        if (amenityModalMode === 'edit' && selectedAmenityId) {
          await actualizarAmenidad(selectedAmenityId, payload);
          showFeedback('Amenidad actualizada correctamente', 'success');
        } else {
          await crearAmenidad(payload);
          showFeedback('Amenidad creada correctamente', 'success');
        }

        amenityForm.reset();
        closeAmenityModal();
        changeTab('servicios');
      } catch (error) {
        debug('Tab servicios submit amenidad error', error, { message: error.message });
        showFeedback(error.message, 'error');
      }
    });

    amenityForm.dataset.boundAdminTabs = 'true';
  }

  function bindMessageForms() {
    const noticeForm = document.getElementById('notice-form');
    const adminConversationReplyForm = document.getElementById('admin-conversation-reply-form');
    const adminConversationCloseButton = document.getElementById('admin-conversation-close-btn');

    if (noticeForm && noticeForm.dataset.boundAdminTabs !== 'true') {
      noticeForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        try {
          const payload = {
            title: document.getElementById('notice-title').value.trim(),
            message: document.getElementById('notice-message').value.trim(),
            audience: document.getElementById('notice-audience').value
          };
          debug('Tab mensajes submit aviso payload', payload);
          await crearAviso(payload);
          noticeForm.reset();
          closeNoticeModal();
          changeTab('mensajes');
          showFeedback('Aviso publicado correctamente', 'success');
        } catch (error) {
          debug('Tab mensajes submit aviso error', error, { message: error.message });
          showFeedback(error.message, 'error');
        }
      });
      noticeForm.dataset.boundAdminTabs = 'true';
    }

    if (adminConversationReplyForm && adminConversationReplyForm.dataset.boundAdminTabs !== 'true') {
      adminConversationReplyForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const activeConversation = window.__adminConversationDetail;
        const message = document.getElementById('adminConversationReplyInput').value.trim();

        if (!activeConversation || !message) return;

        try {
          setButtonLoadingState(adminConversationReplyForm.querySelector('button[type="submit"]'), true, 'Enviando...');
          const updatedConversation = await responderConversacionAdmin(activeConversation.id, { message });
          renderAdminConversationDetail(updatedConversation);
          conversationsAdminCache = await cargarConversacionesAdminDesdeApi();
          renderAdminConversations(conversationsAdminCache);
          showFeedback('Respuesta enviada correctamente', 'success');
        } catch (error) {
          debug('Tab mensajes responder conversación error', error, { message: error.message });
          showFeedback(error.message, 'error');
        } finally {
          setButtonLoadingState(adminConversationReplyForm.querySelector('button[type="submit"]'), false);
        }
      });
      adminConversationReplyForm.dataset.boundAdminTabs = 'true';
    }

    if (adminConversationCloseButton && adminConversationCloseButton.dataset.boundAdminTabs !== 'true') {
      adminConversationCloseButton.addEventListener('click', async () => {
        const activeConversation = window.__adminConversationDetail;
        if (!activeConversation) return;

        try {
          await cerrarConversacionAdmin(activeConversation.id);
          const updatedConversation = await cargarDetalleConversacionAdmin(activeConversation.id);
          renderAdminConversationDetail(updatedConversation);
          conversationsAdminCache = await cargarConversacionesAdminDesdeApi();
          renderAdminConversations(conversationsAdminCache);
          showFeedback('Conversación cerrada correctamente', 'success');
        } catch (error) {
          debug('Tab mensajes cerrar conversación error', error, { message: error.message });
          showFeedback(error.message, 'error');
        }
      });
      adminConversationCloseButton.dataset.boundAdminTabs = 'true';
    }
  }

  async function changeTab(tabName) {
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach((tab) => tab.classList.remove('active'));

    const activeButton = Array.from(tabs).find((tab) => tab.textContent.trim().toLowerCase() === tabName.toLowerCase());
    if (activeButton) activeButton.classList.add('active');

    const title = document.querySelector('.page-title');
    let propertyContainer = document.getElementById('propiedades-container');
    let ticketsContainer = document.getElementById('tickets-container');
    let reservasContainer = document.getElementById('reservas-container');
    let finanzasContainer = document.getElementById('finanzas-container');
    let visitsWrapper = document.getElementById('visits-wrapper');
    let avisosContainer = document.getElementById('avisos-container');
    let serviciosContainer = document.getElementById('servicios-container');
    let archivedAvisosContainer = document.getElementById('archived-avisos-container');
    let conversationsContainer = document.getElementById('admin-conversations-container');
    let messagesWrapper = document.getElementById('messages-wrapper');
    let closedTicketsContainer = document.getElementById('closed-tickets-container');
    let ticketsHistoryWrapper = document.getElementById('tickets-history-wrapper');
    let propertyFiltersWrapper = document.getElementById('property-filters-wrapper');
    const openPropertyFormButton = document.getElementById('open-property-form-btn');

    if (!title) return;

    if (typeof updateExportButtonForTab === 'function') updateExportButtonForTab(tabName);

    propertyContainer?.classList.add('admin-hidden');
    ticketsContainer?.classList.add('admin-hidden');
    reservasContainer?.classList.add('admin-hidden');
    finanzasContainer?.classList.add('admin-hidden');
    visitsWrapper?.classList.add('admin-hidden');
    avisosContainer?.classList.add('admin-hidden');
    serviciosContainer?.classList.add('admin-hidden');
    archivedAvisosContainer?.classList.add('admin-hidden');
    messagesWrapper?.classList.add('admin-hidden');
    closedTicketsContainer?.classList.add('admin-hidden');
    ticketsHistoryWrapper?.classList.add('admin-hidden');
    propertyFiltersWrapper?.classList.add('admin-hidden');

    if (openPropertyFormButton) {
      openPropertyFormButton.classList.toggle('admin-hidden', tabName !== 'propiedades');
    }

    if (tabName === 'servicios') {
      if (!serviciosContainer && window.AdminSections?.load) {
        await window.AdminSections.load('servicios');
        serviciosContainer = document.getElementById('servicios-container');
      }
      if (!serviciosContainer) return;

      title.textContent = 'Gestión de Servicios';
      bindAmenityForm();
      serviciosContainer.classList.remove('admin-hidden');
      if (typeof setLoadingState === 'function') setLoadingState('servicios-container', 'Cargando amenidades...');

      cargarAmenidadesDesdeApi()
        .then((amenities) => {
          debug('Tab servicios payload', amenities, { count: amenities.length });
          cargarAmenidades(amenities);
        })
        .catch((error) => {
          debug('Tab servicios error', error, { message: error.message });
          serviciosContainer.innerHTML = `<div class="admin-error-state">${error.message}</div>`;
        });
      return;
    }

    if (tabName === 'propiedades') {
      title.textContent = 'Gestión de Inmuebles';
      if ((!propertyContainer || !propertyFiltersWrapper) && window.AdminSections?.load) {
        await window.AdminSections.load('propiedades');
        propertyContainer = document.getElementById('propiedades-container');
        propertyFiltersWrapper = document.getElementById('property-filters-wrapper');
      }
      if (!propertyContainer || !propertyFiltersWrapper) return;

      propertyContainer.classList.remove('admin-hidden');
      propertyFiltersWrapper.classList.remove('admin-hidden');
      if (typeof setLoadingState === 'function') setLoadingState('propiedades-container', 'Cargando propiedades...');

      cargarPropiedadesDesdeApi()
        .then((properties) => {
          debug('Tab propiedades payload', properties, { count: properties.length });
          if (typeof propertiesCache !== 'undefined') propertiesCache = properties;
          cargarPropiedades(properties);
          bindPropertyFilters();
        })
        .catch((error) => {
          debug('Tab propiedades error', error, { message: error.message });
          propertyContainer.innerHTML = `<div class="admin-error-state">${error.message}</div>`;
        });
      return;
    }

    if (tabName === 'mensajes') {
      if ((!messagesWrapper || !ticketsContainer || !avisosContainer || !archivedAvisosContainer || !conversationsContainer || !closedTicketsContainer) && window.AdminSections?.load) {
        await window.AdminSections.load('mensajes');
        messagesWrapper = document.getElementById('messages-wrapper');
        ticketsContainer = document.getElementById('tickets-container');
        avisosContainer = document.getElementById('avisos-container');
        archivedAvisosContainer = document.getElementById('archived-avisos-container');
        conversationsContainer = document.getElementById('admin-conversations-container');
        closedTicketsContainer = document.getElementById('closed-tickets-container');
      }
      if (!messagesWrapper || !ticketsContainer || !avisosContainer || !archivedAvisosContainer || !conversationsContainer || !closedTicketsContainer) return;

      title.textContent = 'Mensajes y Avisos';
      bindMessageForms();
      messagesWrapper.classList.remove('admin-hidden');

      [
        ticketsContainer,
        closedTicketsContainer,
        avisosContainer,
        archivedAvisosContainer,
        conversationsContainer
      ].forEach((container) => container?.classList.remove('admin-hidden'));

      if (typeof setLoadingState === 'function') {
        setLoadingState('tickets-container', 'Cargando tickets...');
        setLoadingState('avisos-container', 'Cargando avisos...');
        setLoadingState('archived-avisos-container', 'Cargando avisos archivados...');
      }

      Promise.all([cargarTicketsDesdeApi(), cargarAvisosDesdeApi(), cargarConversacionesAdminDesdeApi()])
        .then(([tickets, avisos, conversations]) => {
          debug('Tab mensajes payload', { tickets, avisos, conversations }, {
            tickets: tickets.length,
            avisos: avisos.length,
            conversations: conversations.length
          });
          if (typeof conversationsAdminCache !== 'undefined') conversationsAdminCache = conversations;
          cargarTickets(tickets);
          cargarTicketsCerradosRecientes(tickets);
          cargarAvisos(avisos);
          cargarAvisosArchivados(avisos);
          renderAdminConversations(conversations);
        })
        .catch((error) => {
          debug('Tab mensajes error', error, { message: error.message });
          ticketsContainer.innerHTML = `<div class="admin-error-state">${error.message}</div>`;
          closedTicketsContainer.innerHTML = `<div class="admin-error-state">${error.message}</div>`;
          avisosContainer.innerHTML = `<div class="admin-error-state">${error.message}</div>`;
          archivedAvisosContainer.innerHTML = `<div class="admin-error-state">${error.message}</div>`;
          conversationsContainer.innerHTML = `<div class="admin-error-state">${error.message}</div>`;
        });
      return;
    }

    if (tabName === 'reservas') {
      if (!reservasContainer && window.AdminSections?.load) {
        await window.AdminSections.load('reservas');
        reservasContainer = document.getElementById('reservas-container');
      }
      if (!reservasContainer) return;

      title.textContent = 'Gestión de Reservas';
      reservasContainer.classList.remove('admin-hidden');
      if (typeof setLoadingState === 'function') setLoadingState('reservas-results-grid', 'Cargando reservas...');

      Promise.all([
        cargarReservasDesdeApi(),
        cargarAmenidadesDesdeApi().catch(() => [])
      ])
        .then(([reservations, amenities]) => {
          debug('Tab reservas payload', { reservations, amenities }, {
            reservations: reservations.length,
            amenities: amenities.length,
            firstReservation: reservations[0] || null
          });
          if (typeof reservationsAmenitiesCache !== 'undefined') {
            reservationsAmenitiesCache = Array.isArray(amenities)
              ? amenities.map((amenity) => ({ id: amenity.id, name: amenity.name }))
              : [];
          }
          cargarReservas(reservations);
        })
        .catch((error) => {
          debug('Tab reservas error', error, { message: error.message });
          reservasContainer.innerHTML = `<div class="admin-error-state">${error.message}</div>`;
        });
      return;
    }

    if (tabName === 'visitas') {
      if (!visitsWrapper && window.AdminSections?.load) {
        await window.AdminSections.load('visitas');
        visitsWrapper = document.getElementById('visits-wrapper');
      }
      if (!visitsWrapper) return;

      title.textContent = 'Control de Visitas';
      bindVisitControls();
      visitsWrapper.classList.remove('admin-hidden');
      const visitsContainer = document.getElementById('visits-container');
      if (visitsContainer && typeof setLoadingState === 'function') setLoadingState('visits-container', 'Cargando visitas...');

      cargarVisitasDesdeApi()
        .then((visits) => {
          debug('Tab visitas payload', visits, { count: visits.length });
          if (typeof visitsCache !== 'undefined') visitsCache = visits;
          window.AdminStore?.set('visits', visits);
          actualizarVistaVisitas();
        })
        .catch((error) => {
          debug('Tab visitas error', error, { message: error.message });
          if (visitsContainer) visitsContainer.innerHTML = `<div class="admin-error-state">${error.message}</div>`;
        });
      return;
    }

    if (tabName === 'finanzas') {
      if (!finanzasContainer && window.AdminSections?.load) {
        await window.AdminSections.load('finanzas');
        finanzasContainer = document.getElementById('finanzas-container');
      }
      if (!finanzasContainer) return;

      title.textContent = 'Panel Financiero';
      finanzasContainer.classList.remove('admin-hidden');

      const financeResultsGrid = document.getElementById('finance-results-grid');
      debug('Tab finanzas estado shell', {
        financeShellRendered: typeof financeShellRendered !== 'undefined' ? financeShellRendered : null,
        hasResultsGrid: Boolean(financeResultsGrid)
      });

      if (typeof setLoadingState === 'function') {
        if (financeResultsGrid) {
          setLoadingState('finance-results-grid', 'Cargando finanzas...');
        } else {
          if (typeof financeShellRendered !== 'undefined') {
            financeShellRendered = false;
          }
          setLoadingState('finanzas-container', 'Cargando finanzas...');
        }
      }

      cargarPagosDesdeApi()
        .then(({ payments, summary }) => {
          debug('Tab finanzas payload', { payments, summary }, { payments: payments.length });
          if (typeof paymentsFinanzasCache !== 'undefined') paymentsFinanzasCache = payments;
          window.__financeSummaryCache = summary;
          actualizarVistaFinanzas();
        })
        .catch((error) => {
          debug('Tab finanzas error', error, { message: error.message });
          finanzasContainer.innerHTML = `<div class="admin-error-state">${error.message}</div>`;
        });
      return;
    }

    if (tabName === 'historial') {
      if (!ticketsHistoryWrapper && window.AdminSections?.load) {
        await window.AdminSections.load('historial');
        ticketsHistoryWrapper = document.getElementById('tickets-history-wrapper');
      }
      if (!ticketsHistoryWrapper) return;

      title.textContent = 'Historial de Tickets';
      bindHistoryControls();
      ticketsHistoryWrapper.classList.remove('admin-hidden');
      const historyContainer = document.getElementById('tickets-history-container');
      if (historyContainer && typeof setLoadingState === 'function') setLoadingState('tickets-history-container', 'Cargando historial de tickets...');

      cargarTicketsDesdeApi()
        .then((tickets) => {
          debug('Tab historial payload', tickets, { count: tickets.length, sample: tickets[0] || null });
          if (typeof ticketsHistoryCache !== 'undefined') ticketsHistoryCache = tickets;
          window.AdminStore?.set('ticketsHistory', tickets);
          actualizarHistorialTickets();
        })
        .catch((error) => {
          debug('Tab historial error', error, { message: error.message });
          if (historyContainer) historyContainer.innerHTML = `<div class="admin-error-state">${error.message}</div>`;
        });
      return;
    }

    const tabLabels = {
      servicios: 'Gestión de Servicios',
      mensajes: 'Mensajes y Avisos'
    };

    title.textContent = tabLabels[tabName] || 'Panel de Administración';
    propertyContainer?.classList.remove('admin-hidden');
    if (propertyContainer) {
      propertyContainer.innerHTML = `<div class="admin-empty-state">La sección <strong>${title.textContent}</strong> se conectará en el siguiente paso.</div>`;
    }
  }

  window.AdminTabs = { changeTab };
})();

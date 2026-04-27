(function initAdminSections() {
  const sections = {
    propiedades: {
      hostId: 'admin-properties-host',
      path: './sections/properties.html'
    },
    reservas: {
      hostId: 'admin-reservations-host',
      path: './sections/reservations.html'
    },
    visitas: {
      hostId: 'admin-visits-host',
      path: './sections/visits.html'
    },
    historial: {
      hostId: 'admin-history-host',
      path: './sections/history.html'
    },
    finanzas: {
      hostId: 'admin-finances-host',
      path: './sections/finances.html'
    },
    servicios: {
      hostId: 'admin-amenities-host',
      path: './sections/amenities.html'
    },
    mensajes: {
      hostId: 'admin-messages-host',
      path: './sections/messages.html'
    }
  };

  async function load(tabName) {
    const config = sections[tabName];
    if (!config) {
      return null;
    }

    const host = document.getElementById(config.hostId);
    if (!host) {
      return null;
    }

    if (host.dataset.loaded === 'true') {
      return host;
    }

    const response = await fetch(config.path, { cache: 'no-cache' });
    if (!response.ok) {
      throw new Error(`No se pudo cargar la sección ${tabName}`);
    }

    host.innerHTML = await response.text();
    host.dataset.loaded = 'true';
    return host;
  }

  window.AdminSections = {
    load,
    sections
  };
})();

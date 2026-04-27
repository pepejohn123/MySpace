(function initResidentSections() {
  const sections = {
    dashboard: {
      hostId: 'resident-dashboard-host',
      path: './sections/dashboard-main.html'
    },
    modals: {
      hostId: 'resident-modals-host',
      path: './sections/modals.html'
    },
    assistant: {
      hostId: 'resident-assistant-host',
      path: './sections/assistant.html'
    }
  };

  async function load(sectionName) {
    const config = sections[sectionName];
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
      throw new Error(`No se pudo cargar la sección ${sectionName}`);
    }

    host.innerHTML = await response.text();
    host.dataset.loaded = 'true';
    return host;
  }

  async function loadAll() {
    await load('dashboard');
    await load('modals');
    await load('assistant');
  }

  window.ResidentSections = {
    load,
    loadAll,
    sections
  };
})();

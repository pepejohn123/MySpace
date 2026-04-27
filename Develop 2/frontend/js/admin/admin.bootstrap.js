(function initAdminBootstrap() {
  window.__adminBootstrapSkipLegacy = true;

  async function bootAdmin() {
    if (window.__adminBootstrapInitialized) {
      return;
    }

    window.__adminBootstrapInitialized = true;

    const currentUser = await requireAuth('admin');
    if (!currentUser) {
      return;
    }

    const logoutButton = document.getElementById('logout-btn');
    const openPropertyFormButton = document.getElementById('open-property-form-btn');
    const exportContextButton = document.getElementById('export-context-btn');

    if (logoutButton) {
      logoutButton.addEventListener('click', logout);
    }

    if (openPropertyFormButton) {
      openPropertyFormButton.addEventListener('click', () => openPropertyFormModal('create'));
    }

    if (exportContextButton) {
      exportContextButton.addEventListener('click', async () => {
        const { endpoint, filename } = exportContextButton.dataset;

        if (!endpoint || !filename) {
          return;
        }

        try {
          const activeTab = Array.from(document.querySelectorAll('.nav-tab')).find((tab) => tab.classList.contains('active'))?.textContent.trim().toLowerCase();
          const exportConfig = exportConfigByTab[activeTab];
          const filters = exportConfig?.getFilters ? exportConfig.getFilters() : {};
          await descargarExcel(endpoint, filename, filters);
          showFeedback('Archivo exportado correctamente', 'success');
        } catch (error) {
          showFeedback(error.message, 'error');
        }
      });
    }

    await changeTab('propiedades');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootAdmin);
  } else {
    void bootAdmin();
  }
})();
(function initAdminStore() {
  const state = {
    properties: [],
    reservations: [],
    tickets: [],
    ticketsHistory: [],
    visits: [],
    payments: [],
    financeSummary: null,
    amenities: []
  };

  function cloneValue(value) {
    if (Array.isArray(value)) {
      return [...value];
    }

    if (value && typeof value === 'object') {
      return { ...value };
    }

    return value;
  }

  window.AdminStore = {
    get(key) {
      return state[key];
    },
    set(key, value) {
      state[key] = cloneValue(value);
      return state[key];
    },
    patch(partialState = {}) {
      Object.entries(partialState).forEach(([key, value]) => {
        state[key] = cloneValue(value);
      });

      return { ...state };
    },
    snapshot() {
      return {
        properties: [...state.properties],
        reservations: [...state.reservations],
        tickets: [...state.tickets],
        ticketsHistory: [...state.ticketsHistory],
        visits: [...state.visits],
        payments: [...state.payments],
        financeSummary: state.financeSummary ? { ...state.financeSummary } : null,
        amenities: [...state.amenities]
      };
    }
  };
})();
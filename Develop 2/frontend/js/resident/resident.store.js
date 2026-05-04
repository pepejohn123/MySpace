(function initResidentStore() {
  const state = {
    currentUser: null,
    residentViewModel: null,
    tickets: [],
    payments: [],
    paymentSummary: null,
    reservations: [],
    amenities: [],
    visits: [],
    notices: []
  };

  function cloneValue(value) {
    if (Array.isArray(value)) return [...value];
    if (value && typeof value === 'object') return { ...value };
    return value;
  }

  window.ResidentStore = {
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
        currentUser: state.currentUser ? { ...state.currentUser } : null,
        residentViewModel: state.residentViewModel ? { ...state.residentViewModel } : null,
        tickets: [...state.tickets],
        payments: [...state.payments],
        paymentSummary: state.paymentSummary ? { ...state.paymentSummary } : null,
        reservations: [...state.reservations],
        amenities: [...state.amenities],
        visits: [...state.visits],
        notices: [...state.notices]
      };
    }
  };
})();

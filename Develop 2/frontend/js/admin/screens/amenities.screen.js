(function initAdminAmenitiesScreen() {
  async function fetchList() {
    const data = await apiGet('/api/amenities', 'No se pudieron cargar las amenidades');
    return Array.isArray(data) ? data : (data.amenities || []);
  }

  async function createAmenity(payload) {
    const data = await apiPost('/api/amenities', payload, 'No se pudo crear la amenidad');
    return data.amenity;
  }

  async function updateAmenity(amenityId, payload) {
    const data = await apiPatch(`/api/amenities/${encodeURIComponent(amenityId)}`, payload, 'No se pudo actualizar la amenidad');
    return data.amenity;
  }

  async function deleteAmenity(amenityId) {
    await apiDelete(`/api/amenities/${encodeURIComponent(amenityId)}`, 'No se pudo eliminar la amenidad');
  }

  window.AdminAmenitiesScreen = {
    fetchList,
    createAmenity,
    updateAmenity,
    deleteAmenity
  };
})();
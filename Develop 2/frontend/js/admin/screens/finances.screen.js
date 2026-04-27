(function initAdminFinancesScreen() {
  function mapPayment(payment) {
    return {
      id: payment.id,
      concepto: payment.concept,
      monto: payment.amount,
      estado: payment.status,
      propiedadId: payment.propertyId || null,
      propiedadNombre: payment.propertyName || payment.propertyId || 'Sin propiedad',
      residenteId: payment.residentId || null,
      residenteNombre: payment.residentName || payment.residentId || 'Sin residente',
      fecha: payment.paymentDate || payment.createdAt || 'Sin fecha'
    };
  }

  async function fetchData() {
    const data = await apiGet('/api/payments', 'No se pudieron cargar los pagos');
    const payments = Array.isArray(data) ? data : (data.payments || []);
    const summary = data.summary || {
      total: payments.reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
      pagado: payments.filter((item) => item.status === 'pagado').reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
      enRevision: payments.filter((item) => item.status === 'en_revision').reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
      porCobrar: payments.filter((item) => item.status === 'pendiente' || item.status === 'rechazado').reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
    };

    return {
      payments: payments.map(mapPayment),
      summary
    };
  }

  async function updateStatus(paymentId, nextStatus) {
    await apiPatch(`/api/payments/${encodeURIComponent(paymentId)}/status`, { status: nextStatus }, 'No se pudo actualizar el pago');
  }

  window.AdminFinancesScreen = {
    fetchData,
    updateStatus,
    mapPayment
  };
})();
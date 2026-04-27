function mapAwsPropertyToCard(property) {
  return {
    id: property.id,
    nombre: property.name || property.id,
    residente: property.residentName || property.residentId || 'Sin residente asignado',
    building: property.building || 'General',
    status: property.status || 'disponible',
    imagen: property.imageUrl || property.imagen || window.DEFAULT_PROPERTY_IMAGE || window.DEFAULT_DEPT_IMAGE || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=500&q=60'
  };
}

function mapAwsTicketToCard(ticket) {
  return {
    id: ticket.id,
    titulo: ticket.title,
    descripcion: ticket.description,
    estado: ticket.status,
    prioridad: ticket.priority,
    closedAt: ticket.closedAt || null,
    createdAt: ticket.createdAt || null,
    propertyId: ticket.propertyId || null
  };
}

function mapAwsPaymentToAdminCard(payment) {
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

function mapAwsReservationToAdminCard(reservation) {
  return {
    id: reservation.id,
    amenidad: reservation.amenityName,
    amenityId: reservation.amenityId || null,
    propertyId: reservation.propertyId || null,
    fecha: reservation.reservationDate,
    horario: reservation.timeSlot,
    estado: reservation.status,
    residente: reservation.residentName || reservation.residentId || 'Sin residente'
  };
}

function mapAwsVisitToAdminCard(visit) {
  return {
    id: visit.id,
    visitante: visit.visitorName,
    fecha: visit.visitDate,
    codigo: visit.accessCode || visit.id,
    estado: visit.status,
    propiedad: visit.propertyId || 'Sin propiedad',
    residente: visit.residentName || visit.residentId || 'Sin residente'
  };
}

function mapAwsConversationToCard(conversation) {
  return {
    ...conversation,
    residentName: conversation.residentName || 'Residente',
    subject: conversation.subject || 'Sin asunto',
    status: conversation.status || 'abierta',
    messages: Array.isArray(conversation.messages) ? conversation.messages : []
  };
}

function mapAwsNoticeToCard(notice) {
  return {
    id: notice.id,
    titulo: notice.title,
    mensaje: notice.message,
    audiencia: notice.audience,
    status: notice.status || 'activo',
    fecha: notice.createdAt || ''
  };
}

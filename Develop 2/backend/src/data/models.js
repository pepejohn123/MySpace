module.exports = {
  user: {
    requiredFields: ['id', 'email', 'passwordHash', 'role', 'name', 'condominioId', 'createdAt', 'updatedAt']
  },
  property: {
    requiredFields: ['id', 'condominioId', 'type', 'name', 'status', 'createdAt', 'updatedAt']
  },
  amenity: {
    requiredFields: ['id', 'condominioId', 'name', 'status', 'createdAt', 'updatedAt']
  },
  payment: {
    requiredFields: ['id', 'condominioId', 'residentId', 'propertyId', 'amount', 'status', 'createdAt', 'updatedAt']
  },
  ticket: {
    requiredFields: ['id', 'condominioId', 'residentId', 'title', 'description', 'status', 'createdAt', 'updatedAt']
  },
  reservation: {
    requiredFields: ['id', 'condominioId', 'residentId', 'amenityId', 'reservationDate', 'status', 'createdAt', 'updatedAt']
  },
  visit: {
    requiredFields: ['id', 'condominioId', 'residentId', 'visitorName', 'visitDate', 'status', 'createdAt', 'updatedAt']
  },
  notice: {
    requiredFields: ['id', 'condominioId', 'authorId', 'title', 'message', 'createdAt', 'updatedAt']
  }
};
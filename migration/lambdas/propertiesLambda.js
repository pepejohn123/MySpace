// handler.js (PropertiesLambda)

// MOCK: Reemplazar por comandos a DynamoDB
const dbMock = { properties: [] };

exports.handler = async (event) => {
    try {
        // 1. Extraer identidad del Token de Cognito inyectado por API Gateway
        const claims = event.requestContext?.authorizer?.claims || {};
        const currentUser = {
            sub: claims.sub,
            role: claims['custom:role'] || 'admin',
            // El condominioId viene firmado en el token JWT, es in-hackeable
            condominioId: claims['custom:condominioId']
        };

        const method = event.httpMethod;
        const path = event.resource;

        // GET /api/properties
        if (method === 'GET' && path === '/api/properties') {
            let properties = [];

            if (currentUser.role === 'admin') {
                // El Admin SOLO puede ver las propiedades de su propio condominio
                properties = dbMock.properties.filter(p => p.condominioId === currentUser.condominioId);
            } else if (currentUser.role === 'residente') {
                // El Residente SOLO ve la propiedad que habita
                properties = dbMock.properties.filter(p => p.residentId === currentUser.sub);
            }

            return { statusCode: 200, body: JSON.stringify(properties) };
        }

        // POST /api/properties
        if (method === 'POST' && path === '/api/properties') {
            if (currentUser.role !== 'admin') {
                return { statusCode: 403, body: JSON.stringify({ error: 'Solo admins pueden crear propiedades' }) };
            }

            const body = JSON.parse(event.body);

            const newProperty = {
                id: `PROPERTY#${body.name.toUpperCase().replace(/[^A-Z0-9]+/g, '')}`,
                // SEGURIDAD CRÍTICA: Forzamos el condominioId del token, ignoramos el del body
                condominioId: currentUser.condominioId,
                type: body.type, // ej. 'Departamento'
                name: body.name, // ej. '401A'
                residentId: body.residentId || null,
                status: 'ok',
                createdAt: new Date().toISOString()
            };

            dbMock.properties.push(newProperty);
            return { statusCode: 201, body: JSON.stringify(newProperty) };
        }

        // PATCH /api/properties/{id}
        if (method === 'PATCH' && path === '/api/properties/{id}') {
            if (currentUser.role !== 'admin') {
                return { statusCode: 403, body: JSON.stringify({ error: 'Acceso denegado' }) };
            }

            const propertyId = decodeURIComponent(event.pathParameters.id);
            const body = JSON.parse(event.body);

            const propIndex = dbMock.properties.findIndex(p => p.id === propertyId);
            if (propIndex === -1) return { statusCode: 404, body: JSON.stringify({ error: 'Propiedad no encontrada' }) };

            // Validación de seguridad: ¿Esta propiedad pertenece al condominio de este Admin?
            if (dbMock.properties[propIndex].condominioId !== currentUser.condominioId) {
                return { statusCode: 403, body: JSON.stringify({ error: 'Esta propiedad no pertenece a tu condominio' }) };
            }

            // Actualizar residente o status
            if (body.residentId !== undefined) dbMock.properties[propIndex].residentId = body.residentId;
            if (body.status !== undefined) dbMock.properties[propIndex].status = body.status;

            return { statusCode: 200, body: JSON.stringify(dbMock.properties[propIndex]) };
        }

        return { statusCode: 404, body: JSON.stringify({ error: 'Ruta no encontrada' }) };

    } catch (error) {
        console.error(error);
        return { statusCode: 500, body: JSON.stringify({ error: 'Error interno' }) };
    }
};
// handler.js (CondosLambda)

const dbMock = { condos: [] };

exports.handler = async (event) => {
    try {
        const claims = event.requestContext?.authorizer?.claims || {};
        const currentUser = {
            role: claims['custom:role'] || 'superadmin'
        };

        const method = event.httpMethod;
        const path = event.resource;

        // POST /api/condos
        if (method === 'POST' && path === '/api/condos') {
            // Solo el dueño del sistema (ustedes) puede dar de alta nuevos edificios
            if (currentUser.role !== 'superadmin') {
                return { statusCode: 403, body: JSON.stringify({ error: 'Acceso exclusivo de SuperAdmin' }) };
            }

            const body = JSON.parse(event.body);
            const newCondo = {
                id: `CONDO#${Date.now()}`,
                name: body.name,
                address: body.address,
                cuentaClabe: body.cuentaClabe || null,
                createdAt: new Date().toISOString()
            };

            dbMock.condos.push(newCondo);
            return { statusCode: 201, body: JSON.stringify(newCondo) };
        }

        // GET /api/condos/{id}
        if (method === 'GET' && path === '/api/condos/{id}') {
            const condoId = decodeURIComponent(event.pathParameters.id);
            const condo = dbMock.condos.find(c => c.id === condoId);

            if (!condo) return { statusCode: 404, body: JSON.stringify({ error: 'Condominio no encontrado' }) };

            return { statusCode: 200, body: JSON.stringify(condo) };
        }

        return { statusCode: 404, body: JSON.stringify({ error: 'Ruta no encontrada' }) };

    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: 'Error interno' }) };
    }
};

/*
Elimina dbMock.

Instala el SDK de AWS (npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb).

Inicializa el cliente (const ddbDocClient = DynamoDBDocumentClient.from(new DynamoDBClient({}))).

Reemplaza los .push() por comandos PutCommand y los .filter() por comandos QueryCommand usando tu estructura de tabla única (Condominio_Core_Table)
*/
// handler.js (Lambda para Tickets)

// MOCK: Reemplazar por llamadas reales a DynamoDB (ej. dynamoClient.put(), dynamoClient.query())
const dbMock = {
    tickets: []
};

exports.handler = async (event) => {
    try {
        // 1. Extraer usuario validado por Cognito desde API Gateway
        const claims = event.requestContext?.authorizer?.claims || {};
        const currentUser = {
            sub: claims.sub, // ID del usuario
            role: claims['custom:role'] || 'residente',
            condominioId: claims['custom:condominioId']
        };

        const method = event.httpMethod;
        const path = event.resource; // ej. '/tickets' o '/tickets/{id}/estatus'

        // GET /tickets
        if (method === 'GET' && path === '/tickets') {
            let userTickets = [];
            if (currentUser.role === 'admin') {
                userTickets = dbMock.tickets.filter(t => t.condominioId === currentUser.condominioId);
            } else {
                userTickets = dbMock.tickets.filter(t => t.residentId === currentUser.sub);
            }
            return { statusCode: 200, body: JSON.stringify(userTickets) };
        }

        // POST /tickets
        if (method === 'POST' && path === '/tickets') {
            if (currentUser.role !== 'residente') {
                return { statusCode: 403, body: JSON.stringify({ error: 'Solo residentes pueden crear tickets' }) };
            }

            const body = JSON.parse(event.body);
            const newTicket = {
                id: `TICKET#${Date.now()}`,
                condominioId: currentUser.condominioId,
                residentId: currentUser.sub,
                title: body.title,
                description: body.description,
                status: 'pendiente',
                createdAt: new Date().toISOString()
            };

            // REEMPLAZAR: Guardar en DynamoDB
            dbMock.tickets.push(newTicket);

            return { statusCode: 201, body: JSON.stringify(newTicket) };
        }

        // PATCH /tickets/{id}/estatus
        if (method === 'PATCH' && path === '/tickets/{id}/estatus') {
            if (currentUser.role !== 'admin') {
                return { statusCode: 403, body: JSON.stringify({ error: 'Solo admins pueden actualizar estatus' }) };
            }

            const ticketId = decodeURIComponent(event.pathParameters.id);
            const body = JSON.parse(event.body);

            // REEMPLAZAR: Buscar y actualizar en DynamoDB
            const ticketIndex = dbMock.tickets.findIndex(t => t.id === ticketId);
            if (ticketIndex === -1) return { statusCode: 404, body: JSON.stringify({ error: 'Ticket no encontrado' }) };

            dbMock.tickets[ticketIndex].status = body.status;
            dbMock.tickets[ticketIndex].updatedAt = new Date().toISOString();

            return { statusCode: 200, body: JSON.stringify(dbMock.tickets[ticketIndex]) };
        }

        return { statusCode: 404, body: JSON.stringify({ error: 'Ruta no encontrada' }) };

    } catch (error) {
        console.error(error);
        return { statusCode: 500, body: JSON.stringify({ error: 'Error interno del servidor' }) };
    }
};

/*
Elimina dbMock.

Instala el SDK de AWS (npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb).

Inicializa el cliente (const ddbDocClient = DynamoDBDocumentClient.from(new DynamoDBClient({}))).

Reemplaza los .push() por comandos PutCommand y los .filter() por comandos QueryCommand usando tu estructura de tabla única (Condominio_Core_Table)
*/
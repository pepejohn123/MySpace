// handler.js (Lambda para Pagos)

// MOCK: Reemplazar por DynamoDB
const dbMock = {
    payments: []
};

exports.handler = async (event) => {
    try {
        const claims = event.requestContext?.authorizer?.claims || {};
        const currentUser = {
            sub: claims.sub,
            role: claims['custom:role'] || 'residente',
            condominioId: claims['custom:condominioId']
        };

        const method = event.httpMethod;

        // GET /pagos
        if (method === 'GET') {
            let payments = [];
            // REEMPLAZAR: Consultar DynamoDB usando GSI o PK
            if (currentUser.role === 'admin') {
                payments = dbMock.payments.filter(p => p.condominioId === currentUser.condominioId);
            } else {
                payments = dbMock.payments.filter(p => p.residentId === currentUser.sub);
            }

            // Lógica de sumario
            const summary = payments.reduce((acc, curr) => {
                acc.total += curr.amount;
                if (curr.status === 'pagado') acc.pagado += curr.amount;
                return acc;
            }, { total: 0, pagado: 0 });

            return { statusCode: 200, body: JSON.stringify({ payments, summary }) };
        }

        // POST /pagos
        if (method === 'POST') {
            if (currentUser.role !== 'residente') {
                return { statusCode: 403, body: JSON.stringify({ error: 'Solo residentes pueden pagar' }) };
            }

            const body = JSON.parse(event.body);
            const newPayment = {
                id: `PAYMENT#${Date.now()}`,
                condominioId: currentUser.condominioId,
                residentId: currentUser.sub,
                concept: body.concept,
                amount: Number(body.amount),
                status: 'en_revision', // O 'pagado' si usan Stripe webhooks
                createdAt: new Date().toISOString()
            };

            // REEMPLAZAR: Guardar en DynamoDB
            dbMock.payments.push(newPayment);

            return { statusCode: 201, body: JSON.stringify(newPayment) };
        }

        return { statusCode: 404, body: JSON.stringify({ error: 'Ruta no encontrada' }) };

    } catch (error) {
        console.error(error);
        return { statusCode: 500, body: JSON.stringify({ error: 'Error interno' }) };
    }
};

/*
Elimina dbMock.

Instala el SDK de AWS (npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb).

Inicializa el cliente (const ddbDocClient = DynamoDBDocumentClient.from(new DynamoDBClient({}))).

Reemplaza los .push() por comandos PutCommand y los .filter() por comandos QueryCommand usando tu estructura de tabla única (Condominio_Core_Table)
*/
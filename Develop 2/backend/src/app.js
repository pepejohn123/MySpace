const express = require('express');
const cors = require('cors');

const { PORT } = require('./config/env');
const errorHandler = require('./middlewares/errorHandler');
const authRoutes = require('./routes/auth.routes');
const amenityRoutes = require('./routes/amenity.routes');
const conversationRoutes = require('./routes/conversation.routes');
const exportRoutes = require('./routes/export.routes');
const noticeRoutes = require('./routes/notice.routes');
const paymentRoutes = require('./routes/payment.routes');
const propertyRoutes = require('./routes/property.routes');
const reservationRoutes = require('./routes/reservation.routes');
const ticketRoutes = require('./routes/ticket.routes');
const userRoutes = require('./routes/user.routes');
const visitRoutes = require('./routes/visit.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'myspace-auth-api' });
});

app.use('/api', authRoutes);
app.use('/api/amenities', amenityRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/exports', exportRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/users', userRoutes);
app.use('/api/visits', visitRoutes);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`MySpace auth API running on http://localhost:${PORT}`);
});
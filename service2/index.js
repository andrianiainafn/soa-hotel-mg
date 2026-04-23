const express = require('express');
const mongoose = require('mongoose');
const rabbitmq = require('./config/rabbitmq');
const messageService = require('./services/message.service');

const app = express();
app.use(express.json());

// Routes
app.use('/rooms', require('./routes/room.routes'));
app.use('/reservations', require('./routes/reservation.routes'));
app.use('/invoices', require('./routes/invoice.routes'));
app.use('/payments', require('./routes/payment.routes'));

app.get('/health', (req, res) => {
  res.json({ status: 'UP', service: 'service2-nodejs' });
});

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('MongoDB connecté');
  } catch (err) {
    console.error('Erreur MongoDB:', err.message);
    setTimeout(connectDB, 3000);
  }
}

connectDB().then(async () => {
  // Initialiser RabbitMQ
  await rabbitmq.connect();
  
  // Consommer les messages entrants
  await rabbitmq.consume(rabbitmq.QUEUES.USER_VERIFIED, messageService.handleUserVerified);
  await rabbitmq.consume(rabbitmq.QUEUES.ROOM_CLEANED, messageService.handleRoomCleaned);
  
  const PORT = process.env.PORT || 8081;
  app.listen(PORT, () => console.log(`Service2 Node.js sur :${PORT}`));
});

// config/rabbitmq.js
const amqp = require('amqplib');

let connection = null;
let channel = null;
let isConnecting = false;

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://admin:secret@rabbitmq:5672';

const QUEUES = {
  RESERVATION_CREATED: 'service2.reservation.created',
  PAYMENT_DONE: 'service2.payment.done',
  RESERVATION_CONFIRMED: 'service2.reservation.confirmed',
  USER_VERIFIED: 'service1.user.verified',
  ROOM_CLEANED: 'service3.room.cleaned'
};

const EXCHANGES = {
  RESERVATION_EVENTS: 'reservation.events.exchange',
  PAYMENT_EVENTS: 'payment.events.exchange',
  USER_EVENTS: 'user.events.exchange'
};

const ROUTING_KEYS = {
  RESERVATION_CREATED: 'reservation.created',
  RESERVATION_CONFIRMED: 'reservation.confirmed',
  PAYMENT_DONE: 'payment.done',
  USER_VERIFIED: 'user.verified',
  ROOM_CLEANED: 'room.cleaned'
};

// Attendre que la connexion soit prête — avec retry infini
async function waitForConnection(retryDelay = 3000) {
  while (!channel) {
    if (!isConnecting) {
      isConnecting = true;
      try {
        connection = await amqp.connect(RABBITMQ_URL);
        channel = await connection.createChannel();
        console.log('✅ RabbitMQ connecté');

        await channel.assertExchange(EXCHANGES.RESERVATION_EVENTS, 'topic', { durable: true });
        await channel.assertExchange(EXCHANGES.PAYMENT_EVENTS, 'topic', { durable: true });
        await channel.assertExchange(EXCHANGES.USER_EVENTS, 'topic', { durable: true });

        await channel.assertQueue(QUEUES.USER_VERIFIED, { durable: true });
        await channel.assertQueue(QUEUES.ROOM_CLEANED, { durable: true });

        await channel.bindQueue(QUEUES.USER_VERIFIED, EXCHANGES.USER_EVENTS, ROUTING_KEYS.USER_VERIFIED);
        await channel.bindQueue(QUEUES.ROOM_CLEANED, EXCHANGES.RESERVATION_EVENTS, ROUTING_KEYS.ROOM_CLEANED);

        // Gérer la perte de connexion
        connection.on('close', () => {
          console.warn('⚠️ Connexion RabbitMQ perdue, reconnexion...');
          channel = null;
          connection = null;
          isConnecting = false;
          waitForConnection(); // relance en background
        });

        isConnecting = false;
        return channel;
      } catch (error) {
        console.error('❌ Erreur connexion RabbitMQ:', error.message, '— retry dans', retryDelay / 1000, 's');
        channel = null;
        connection = null;
        isConnecting = false;
        await new Promise(res => setTimeout(res, retryDelay));
      }
    } else {
      // Une tentative est déjà en cours, on attend
      await new Promise(res => setTimeout(res, 500));
    }
  }
  return channel;
}

async function connect() {
  return waitForConnection();
}

async function publish(exchange, routingKey, message) {
  const ch = await waitForConnection();
  const messageStr = JSON.stringify(message);
  ch.publish(exchange, routingKey, Buffer.from(messageStr), { persistent: true });
  console.log(`📤 Publié sur ${exchange} (${routingKey}):`, message);
}

async function consume(queue, callback) {
  const ch = await waitForConnection();
  await ch.consume(queue, (msg) => {
    if (msg) {
      try {
        const content = JSON.parse(msg.content.toString());
        console.log(`📥 Reçu de ${queue}:`, content);
        callback(content);
        ch.ack(msg);
      } catch (error) {
        console.error(`Erreur traitement message ${queue}:`, error.message);
        ch.nack(msg, false, false);
      }
    }
  });
}

async function disconnect() {
  if (connection) {
    await connection.close();
    console.log('RabbitMQ déconnecté');
  }
}

module.exports = {
  connect,
  publish,
  consume,
  disconnect,
  QUEUES,
  EXCHANGES,
  ROUTING_KEYS
};
// services/message.service.js
const rabbitmq = require('../config/rabbitmq');

// Publier un événement de réservation créée
const publishReservationCreated = async (reservation) => {
  await rabbitmq.publish(
    rabbitmq.EXCHANGES.RESERVATION_EVENTS,
    rabbitmq.ROUTING_KEYS.RESERVATION_CREATED,
    {
      type: 'RESERVATION_CREATED',
      reservationId: reservation._id,
      clientId: reservation.clientId,
      chambreId: reservation.chambreId,
      dateArrivee: reservation.dateArrivee,
      dateDepart: reservation.dateDepart,
      timestamp: new Date().toISOString()
    }
  );
};

// Publier un événement de réservation confirmée
const publishReservationConfirmed = async (reservation) => {
  await rabbitmq.publish(
    rabbitmq.EXCHANGES.RESERVATION_EVENTS,
    rabbitmq.ROUTING_KEYS.RESERVATION_CONFIRMED,
    {
      type: 'RESERVATION_CONFIRMED',
      reservationId: reservation._id,
      clientId: reservation.clientId,
      chambreId: reservation.chambreId,
      statut: reservation.statut,
      timestamp: new Date().toISOString()
    }
  );
};

// Publier un événement de paiement effectué
const publishPaymentDone = async (payment, invoice) => {
  await rabbitmq.publish(
    rabbitmq.EXCHANGES.PAYMENT_EVENTS,
    rabbitmq.ROUTING_KEYS.PAYMENT_DONE,
    {
      type: 'PAYMENT_DONE',
      paymentId: payment._id,
      invoiceId: payment.factureId,
      montant: payment.montant,
      methode: payment.methode,
      timestamp: new Date().toISOString()
    }
  );
};

// Gérer un utilisateur vérifié (reçu de service1)
const handleUserVerified = async (data) => {
  console.log('✅ Utilisateur vérifié reçu:', data);
  // Ici, on pourrait mettre à jour une réservation ou autre
  // Par exemple, marquer la réservation comme vérifiée
  
  // Si on a un reservationId, on pourrait mettre à jour la réservation
  if (data.reservationId) {
    const reservationService = require('./reservation.service');
    try {
      await reservationService.confirmReservation(data.reservationId);
      console.log(`✅ Réservation ${data.reservationId} confirmée après vérification identité`);
    } catch (error) {
      console.error('Erreur confirmation réservation après vérification:', error.message);
    }
  }
};

// Gérer une chambre nettoyée (reçu de service3)
const handleRoomCleaned = async (data) => {
  console.log('🧹 Chambre nettoyée reçue:', data);
  // Mettre à jour le statut de la chambre à 'disponible'
  const roomService = require('./room.service');
  try {
    await roomService.updateRoomStatus(data.roomId, 'disponible');
    console.log(`✅ Chambre ${data.roomId} maintenant disponible`);
  } catch (error) {
    console.error('Erreur mise à jour statut chambre:', error.message);
  }
};

module.exports = {
  publishReservationCreated,
  publishReservationConfirmed,
  publishPaymentDone,
  handleUserVerified,
  handleRoomCleaned
};
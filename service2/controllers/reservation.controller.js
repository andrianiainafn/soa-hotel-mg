// controllers/reservation.controller.js
const reservationService = require('../services/reservation.service');
const messageService = require('../services/message.service');

exports.getAllReservations = async (req, res) => {
  try {
    const reservations = await reservationService.getAllReservations();
    res.json(reservations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getReservationById = async (req, res) => {
  try {
    const reservation = await reservationService.getReservationById(req.params.id);
    if (!reservation) return res.status(404).json({ error: 'Réservation introuvable' });
    res.json(reservation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createReservation = async (req, res) => {
  try {
    const reservation = await reservationService.createReservation(req.body);
    
    // Publier l'événement de réservation créée
    try {
      await messageService.publishReservationCreated(reservation);
    } catch (mqError) {
      console.error('Erreur publication événement réservation:', mqError.message);
      // On ne bloque pas la réponse pour autant
    }
    
    res.status(201).json(reservation);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.confirmReservation = async (req, res) => {
  try {
    const reservation = await reservationService.confirmReservation(req.params.id);
    
    // Publier l'événement de réservation confirmée
    try {
      await messageService.publishReservationConfirmed(reservation);
    } catch (mqError) {
      console.error('Erreur publication événement confirmation:', mqError.message);
    }
    
    res.json(reservation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.cancelReservation = async (req, res) => {
  try {
    const reservation = await reservationService.cancelReservation(req.params.id);
    res.json(reservation);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
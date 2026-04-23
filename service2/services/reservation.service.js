// services/reservation.service.js
const Reservation = require('../models/Reservation');
const Room = require('../models/Room');

const getAllReservations = async () => {
  return await Reservation.find().populate('chambreId');
};

const getReservationById = async (id) => {
  return await Reservation.findById(id).populate('chambreId');
};

const createReservation = async (data) => {
  const room = await Room.findById(data.chambreId);
  if (!room) throw new Error('Chambre introuvable');
  if (room.statut !== 'disponible') throw new Error('Chambre non disponible');

  const nombreNuits = Math.ceil(
    (new Date(data.dateDepart) - new Date(data.dateArrivee)) / (1000 * 60 * 60 * 24)
  );

  const reservation = new Reservation({ ...data, nombreNuits });
  await reservation.save();

  // Marquer la chambre comme occupée
  await Room.findByIdAndUpdate(data.chambreId, { statut: 'occupee' });

  return reservation;
};

const confirmReservation = async (id) => {
  return await Reservation.findByIdAndUpdate(
    id,
    { statut: 'confirmee' },
    { new: true }
  );
};

const cancelReservation = async (id) => {
  const reservation = await Reservation.findById(id);
  if (!reservation) throw new Error('Réservation introuvable');

  await Room.findByIdAndUpdate(reservation.chambreId, { statut: 'disponible' });

  return await Reservation.findByIdAndUpdate(
    id,
    { statut: 'annulee' },
    { new: true }
  );
};

module.exports = {
  getAllReservations,
  getReservationById,
  createReservation,
  confirmReservation,
  cancelReservation
};
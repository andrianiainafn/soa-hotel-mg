// services/invoice.service.js
const Invoice = require('../models/Invoice');
const Reservation = require('../models/Reservation');
const Room = require('../models/Room');

const getAllInvoices = async () => {
  return await Invoice.find();
};

const getInvoiceById = async (id) => {
  return await Invoice.findById(id);
};

const generateInvoice = async (reservationId) => {
  const reservation = await Reservation.findById(reservationId);
  if (!reservation) throw new Error('Réservation introuvable');

  const room = await Room.findById(reservation.chambreId);
  if (!room) throw new Error('Chambre introuvable');

  const montantChambre = room.tarif * reservation.nombreNuits;

  const invoice = new Invoice({
    reservationId,
    clientId: reservation.clientId,
    chambre: {
      numero: room.numero,
      categorie: room.categorie,
      tarif: room.tarif
    },
    montantChambre,
    montantRestaurant: 0,
    montantTotal: montantChambre,
    statut: 'emise'
  });

  return await invoice.save();
};

const addRestaurantAmount = async (id, montantRestaurant) => {
  const invoice = await Invoice.findById(id);
  if (!invoice) throw new Error('Facture introuvable');

  const montantTotal = invoice.montantChambre + montantRestaurant;

  return await Invoice.findByIdAndUpdate(
    id,
    { montantRestaurant, montantTotal },
    { new: true }
  );
};

module.exports = {
  getAllInvoices,
  getInvoiceById,
  generateInvoice,
  addRestaurantAmount
};
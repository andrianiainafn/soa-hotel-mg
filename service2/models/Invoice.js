const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  reservationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Reservation', required: true },
  clientId: { type: String, required: true },
  chambre: {
    numero: String,
    categorie: String,
    tarif: Number
  },
  montantChambre: { type: Number, required: true },
  montantRestaurant: { type: Number, default: 0 },
  montantTotal: { type: Number, required: true },
  statut: {
    type: String,
    enum: ['emise', 'payee'],
    default: 'emise'
  },
  dateEmission: { type: Date, default: Date.now },
  datePaiement: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Invoice', invoiceSchema);
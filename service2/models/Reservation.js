const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  clientId: { type: String, required: true },
  chambreId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  dateArrivee: { type: Date, required: true },
  dateDepart: { type: Date, required: true },
  nombreNuits: { type: Number, required: true },
  statut: {
    type: String,
    enum: ['en_attente', 'confirmee', 'annulee', 'terminee'],
    default: 'en_attente'
  }
}, { timestamps: true });

module.exports = mongoose.model('Reservation', reservationSchema);
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  factureId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true },
  montant: { type: Number, required: true },
  methode: {
    type: String,
    enum: ['espece', 'carte', 'virement'],
    required: true
  },
  statut: {
    type: String,
    enum: ['en_attente', 'valide', 'echoue'],
    default: 'en_attente'
  }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
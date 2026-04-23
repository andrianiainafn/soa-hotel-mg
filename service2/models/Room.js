const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  numero: { type: String, required: true, unique: true },
  categorie: {
    type: String,
    enum: ['Standard', 'Suite Senior', 'Suite Prestige'],
    required: true
  },
  tarif: { type: Number, required: true },
  statut: {
    type: String,
    enum: ['disponible', 'occupee', 'en_nettoyage'],
    default: 'disponible'
  },
  etage: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);
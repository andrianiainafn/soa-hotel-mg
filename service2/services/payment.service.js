// services/payment.service.js
const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');

const processPayment = async (invoiceId, data) => {
  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) throw new Error('Facture introuvable');
  if (invoice.statut === 'payee') throw new Error('Facture déjà payée');

  const payment = new Payment({
    factureId: invoiceId,
    montant: invoice.montantTotal,
    methode: data.methode,
    statut: 'valide'
  });
  await payment.save();

  await Invoice.findByIdAndUpdate(invoiceId, {
    statut: 'payee',
    datePaiement: new Date()
  });

  return payment;
};

const getPaymentById = async (id) => {
  return await Payment.findById(id).populate('factureId');
};

module.exports = { processPayment, getPaymentById };
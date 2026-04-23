// controllers/payment.controller.js
const paymentService = require('../services/payment.service');
const messageService = require('../services/message.service');

exports.processPayment = async (req, res) => {
  try {
    const payment = await paymentService.processPayment(req.params.invoiceId, req.body);
    
    // Publier l'événement de paiement effectué
    try {
      const invoice = await paymentService.getInvoiceById(payment.factureId);
      await messageService.publishPaymentDone(payment, invoice);
    } catch (mqError) {
      console.error('Erreur publication événement paiement:', mqError.message);
    }
    
    res.status(201).json(payment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getPaymentById = async (req, res) => {
  try {
    const payment = await paymentService.getPaymentById(req.params.id);
    if (!payment) return res.status(404).json({ error: 'Paiement introuvable' });
    res.json(payment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
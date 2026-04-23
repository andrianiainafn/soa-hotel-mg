// controllers/invoice.controller.js
const invoiceService = require('../services/invoice.service');

exports.getAllInvoices = async (req, res) => {
  try {
    const invoices = await invoiceService.getAllInvoices();
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getInvoiceById = async (req, res) => {
  try {
    const invoice = await invoiceService.getInvoiceById(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Facture introuvable' });
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.generateInvoice = async (req, res) => {
  try {
    const invoice = await invoiceService.generateInvoice(req.params.reservationId);
    res.status(201).json(invoice);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.addRestaurantAmount = async (req, res) => {
  try {
    const invoice = await invoiceService.addRestaurantAmount(
      req.params.id,
      req.body.montantRestaurant
    );
    res.json(invoice);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
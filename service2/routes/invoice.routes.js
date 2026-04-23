// routes/invoice.routes.js
const router = require('express').Router();
const ctrl = require('../controllers/invoice.controller');

router.get('/', ctrl.getAllInvoices);
router.get('/:id', ctrl.getInvoiceById);
router.post('/:reservationId', ctrl.generateInvoice);
router.put('/:id/add-restaurant', ctrl.addRestaurantAmount);

module.exports = router;
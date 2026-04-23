// routes/payment.routes.js
const router = require('express').Router();
const ctrl = require('../controllers/payment.controller');

router.post('/:invoiceId', ctrl.processPayment);
router.get('/:id', ctrl.getPaymentById);

module.exports = router;
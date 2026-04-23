// routes/reservation.routes.js
const router = require('express').Router();
const ctrl = require('../controllers/reservation.controller');

router.get('/', ctrl.getAllReservations);
router.get('/:id', ctrl.getReservationById);
router.post('/', ctrl.createReservation);
router.put('/:id/confirm', ctrl.confirmReservation);
router.put('/:id/cancel', ctrl.cancelReservation);

module.exports = router;
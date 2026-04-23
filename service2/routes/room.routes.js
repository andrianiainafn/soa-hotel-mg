// routes/room.routes.js
const router = require('express').Router();
const ctrl = require('../controllers/room.controller');

router.get('/', ctrl.getAllRooms);
router.get('/available', ctrl.getAvailableRooms);
router.get('/:id', ctrl.getRoomById);
router.post('/', ctrl.createRoom);
router.put('/:id/status', ctrl.updateRoomStatus);

module.exports = router;
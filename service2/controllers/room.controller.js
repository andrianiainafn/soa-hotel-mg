// controllers/room.controller.js
const roomService = require('../services/room.service');

exports.getAllRooms = async (req, res) => {
  try {
    const rooms = await roomService.getAllRooms();
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAvailableRooms = async (req, res) => {
  try {
    const rooms = await roomService.getAvailableRooms();
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getRoomById = async (req, res) => {
  try {
    const room = await roomService.getRoomById(req.params.id);
    if (!room) return res.status(404).json({ error: 'Chambre introuvable' });
    res.json(room);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createRoom = async (req, res) => {
  try {
    const room = await roomService.createRoom(req.body);
    res.status(201).json(room);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateRoomStatus = async (req, res) => {
  try {
    const room = await roomService.updateRoomStatus(req.params.id, req.body.statut);
    res.json(room);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
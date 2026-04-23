// services/room.service.js
const Room = require('../models/Room');

const getAllRooms = async () => {
  return await Room.find();
};

const getAvailableRooms = async () => {
  return await Room.find({ statut: 'disponible' });
};

const getRoomById = async (id) => {
  return await Room.findById(id);
};

const createRoom = async (data) => {
  const room = new Room(data);
  return await room.save();
};

const updateRoomStatus = async (id, statut) => {
  return await Room.findByIdAndUpdate(
    id,
    { statut },
    { new: true }
  );
};

module.exports = {
  getAllRooms,
  getAvailableRooms,
  getRoomById,
  createRoom,
  updateRoomStatus
};
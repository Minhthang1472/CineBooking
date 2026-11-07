import axiosClient from './axiosClient';

export const roomApi = {
  getAllRooms: () => {
    return axiosClient.get('/Rooms'); 
  },

  getRoomTypes: () => {
    return axiosClient.get('/RoomTypes');
  },

  addRoomTypeImageUrl: (id, imageUrl) => {
    return axiosClient.post(`/RoomTypes/${id}/images/url`, { imageUrl });
  },

  deleteRoomTypeImage: (imageId) => {
    return axiosClient.delete(`/RoomTypes/images/${imageId}`);
  },

  setPrimaryImage: (roomTypeId, imageId) => {
    return axiosClient.patch(`/RoomTypes/${roomTypeId}/images/${imageId}/set-primary`);
  },

  getRoomInventory: (roomId) => {
    return axiosClient.get(`/RoomInventories/room/${roomId}`);
  },

  cloneInventory: (data) => {
    return axiosClient.post('/RoomInventories/clone', data);
  },

  syncFromWarehouse: (data) => {
    return axiosClient.post('/RoomInventories/sync-from-warehouse', data);
  },

  createRoom: (data) => {
    return axiosClient.post('/Rooms', data);
  },

      updateRoom: (id, data) => {
    return axiosClient.put(`/Rooms/${id}`, data);
  },

  deleteRoom: (id) => {
    return axiosClient.delete(`/Rooms/${id}`);
  },

  // API dành riêng cho Housekeeping (Đổi trạng thái nhanh)
  updateRoomStatus: (id, newStatus) => {
    return axiosClient.patch(`/Rooms/${id}/status`, `"${newStatus}"`, {
      headers: { 'Content-Type': 'application/json' }
    });
  },

  bulkCreate: (roomsArray) => {
    return axiosClient.post('/Rooms/bulk-create', roomsArray);
  }
};
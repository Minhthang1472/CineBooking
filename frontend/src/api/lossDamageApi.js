import axiosClient from './axiosClient';

export const lossDamageApi = {
  // Lấy danh sách đền bù (Hàm GET của bạn trả về object có ItemName, RoomNumber...)
  getAllLossAndDamages: () => {
    return axiosClient.get('/LossAndDamages');
  },

  // Tạo biên bản mới (Hàm POST)
  createLossAndDamage: (data) => {
    return axiosClient.post('/LossAndDamages', data);
  },

  // Xóa biên bản (Hàm DELETE)
  deleteLossAndDamage: (id) => {
    return axiosClient.delete(`/LossAndDamages/${id}`);
  }
};
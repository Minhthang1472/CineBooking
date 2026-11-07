import axiosClient from './axiosClient';

export const userApi = {
  // Lấy danh sách tất cả users
  getAllUsers: () => {
    return axiosClient.get('/UserManagement');
  },

  // Tạo user mới
  createUser: (userData) => {
    return axiosClient.post('/UserManagement', userData);
  },

  // Cập nhật thông tin user
  updateUser: (userId, userData) => {
    return axiosClient.put(`/UserManagement/${userId}`, userData);
  },

  // Xóa user
  deleteUser: (userId) => {
    return axiosClient.delete(`/UserManagement/${userId}`);
  },

  // Thay đổi Role của user
  changeUserRole: (userId, newRoleId) => {
    return axiosClient.put(`/UserManagement/${userId}/change-role`, newRoleId);
  },
};

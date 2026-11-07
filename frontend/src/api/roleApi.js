import axiosClient from './axiosClient';

export const roleApi = {
  // Lấy danh sách Vai trò
  getAllRoles: () => {
    return axiosClient.get('/Roles'); 
  },
  
  // Gửi ID của Vai trò và ID của Quyền xuống Backend để cấp quyền
  assignPermission: (data) => {
    return axiosClient.post('/Roles/assign-permission', data);
  }
};
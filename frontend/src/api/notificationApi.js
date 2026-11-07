import axiosClient from './axiosClient';

export const notificationApi = {
  getAll: () => {
    return axiosClient.get('/Notifications');
  },
  
  getByUser: (userId) => {
    return axiosClient.get(`/Notifications/user/${userId}`);
  },

  create: (data) => {
    return axiosClient.post('/Notifications', data);
  },

  markAsRead: (id) => {
    return axiosClient.patch(`/Notifications/${id}/read`);
  },

  markAllAsRead: (userId) => {
    return axiosClient.patch(`/Notifications/read-all/user/${userId}`);
  },

  delete: (id) => {
    return axiosClient.delete(`/Notifications/${id}`);
  },

  deleteAll: () => {
    return axiosClient.delete('/Notifications/delete-all');
  }
};

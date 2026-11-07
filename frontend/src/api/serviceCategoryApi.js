import axiosClient from './axiosClient';

export const serviceCategoryApi = {
  getAll: () => {
    return axiosClient.get('/ServiceCategories');
  },

  getById: (id) => {
    return axiosClient.get(`/ServiceCategories/${id}`);
  },

  create: (data) => {
    return axiosClient.post('/ServiceCategories', data);
  },

  update: (id, data) => {
    return axiosClient.put(`/ServiceCategories/${id}`, data);
  },

  delete: (id) => {
    return axiosClient.delete(`/ServiceCategories/${id}`);
  }
};

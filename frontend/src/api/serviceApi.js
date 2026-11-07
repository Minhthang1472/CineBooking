import axiosClient from './axiosClient';

export const serviceApi = {
  getAllServices: () => {
    return axiosClient.get('/Services');
  },
  getServiceById: (id) => {
    return axiosClient.get(`/Services/${id}`);
  },
  createService: (data) => {
    return axiosClient.post('/Services', data);
  },
  updateService: (id, data) => {
    return axiosClient.put(`/Services/${id}`, data);
  },
  deleteService: (id) => {
    return axiosClient.delete(`/Services/${id}`);
  }
};

import axiosClient from './axiosClient';

export const amenityApi = {
  getAllAmenities: () => {
    return axiosClient.get('/Amenities');
  },
  getAmenityById: (id) => {
    return axiosClient.get(`/Amenities/${id}`);
  },
  createAmenity: (data) => {
    return axiosClient.post('/Amenities', data);
  },
  updateAmenity: (id, data) => {
    return axiosClient.put(`/Amenities/${id}`, data);
  },
  deleteAmenity: (id) => {
    return axiosClient.delete(`/Amenities/${id}`);
  }
};

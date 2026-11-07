import axiosClient from './axiosClient';

export const bookingApi = {
  getAllBookings: () => {
    return axiosClient.get('/Bookings');
  },
  getByUser: (userId) => {
    return axiosClient.get(`/Bookings/user/${userId}`);
  },

  getBookingById: (id) => {
    return axiosClient.get(`/Bookings/${id}`);
  },
  createBooking: (data) => {
    return axiosClient.post('/Bookings', data);
  },
  updateBooking: (id, data) => {
    return axiosClient.put(`/Bookings/${id}`, data);
  },
  updateBookingDetails: (id, details) => {
    return axiosClient.put(`/Bookings/${id}/details`, details);
  },
  updateStatus: (id, status) => {
    return axiosClient.put(`/Bookings/${id}/status`, status, {
      headers: { 'Content-Type': 'application/json' }
    });
  },
  deleteBooking: (id) => {
    return axiosClient.delete(`/Bookings/${id}`);
  }
};

import axiosClient from './axiosClient';

export const invoiceApi = {
  getAllInvoices: () => axiosClient.get('/Invoices'),
  getInvoiceById: (id) => axiosClient.get(`/Invoices/${id}`),
  createInvoice: (data) => axiosClient.post('/Invoices', data),
  updateInvoice: (id, data) => axiosClient.put(`/Invoices/${id}`, data),
  deleteInvoice: (id) => axiosClient.delete(`/Invoices/${id}`),
};

export const membershipApi = {
  getAllMemberships: () => axiosClient.get('/Memberships'),
  getMembershipById: (id) => axiosClient.get(`/Memberships/${id}`),
  createMembership: (data) => axiosClient.post('/Memberships', data),
  updateMembership: (id, data) => axiosClient.put(`/Memberships/${id}`, data),
  deleteMembership: (id) => axiosClient.delete(`/Memberships/${id}`),
};

export const paymentApi = {
  getAllPayments: () => axiosClient.get('/Payments'),
  createPayment: (data) => axiosClient.post('/Payments', data),
  deletePayment: (id) => axiosClient.delete(`/Payments/${id}`),
};

export const orderServiceApi = {
  getAllOrderServices: () => axiosClient.get('/OrderServices'),
  getOrderServiceById: (id) => axiosClient.get(`/OrderServices/${id}`),
  createOrderService: (data) => axiosClient.post('/OrderServices', data),
  updateOrderService: (id, data) => axiosClient.put(`/OrderServices/${id}`, data),
  updateStatus: (id, status) => axiosClient.patch(`/OrderServices/${id}/status`, JSON.stringify(status), { headers: { 'Content-Type': 'application/json' } }),
  deleteOrderService: (id) => axiosClient.delete(`/OrderServices/${id}`),
};

export const auditLogApi = {
  getAllAuditLogs: () => axiosClient.get('/AuditLogs'),
};

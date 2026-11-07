import axiosClient from './axiosClient';

// Export trực tiếp object
export const equipmentApi = {
    getEquipments: (params) => axiosClient.get('/Equipments', { params }),
    getEquipmentById: (id) => axiosClient.get(`/Equipments/${id}`),
    createEquipment: (data) => axiosClient.post('/Equipments', data),
    updateEquipment: (id, data) => axiosClient.put(`/Equipments/${id}`, data),
    toggleStatus: (id) => axiosClient.patch(`/Equipments/${id}/toggle-status`)
};
import axiosClient from './axiosClient';

export const dashboardApi = {
  getCurrentDashboard: (roleName, periodType = 'MONTHLY') =>
    axiosClient.get('/dashboard-periods/current', {
      params: { roleName, periodType },
    }),

  rebuildCurrent: () =>
    axiosClient.post('/dashboard-periods/rebuild-current'),

  rebuildDashboard: (roleName, periodType = 'MONTHLY') =>
    axiosClient.post('/dashboard-periods/rebuild', { roleName, periodType }),
};

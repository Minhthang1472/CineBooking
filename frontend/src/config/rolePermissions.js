// ─── Cấu hình phân quyền theo vai trò ─────────────────────────────────────
// Mỗi role được map với danh sách routes được phép truy cập
// và các hành động được phép thực hiện

export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  RECEPTIONIST: 'receptionist',
  HOUSEKEEPING: 'housekeeping',
  ACCOUNTANT: 'accountant',
  MARKETING: 'marketing',
  GUEST: 'guest', // Khách hàng hoặc user chưa phân quyền
};

// ─── Routes được phép theo từng role ──────────────────────────────────────
export const ROLE_ALLOWED_ROUTES = {
  [ROLES.ADMIN]: '*', // Toàn quyền

  [ROLES.MANAGER]: [
    '/admin/dashboard',
    '/admin/bookings', '/admin/arrivals', '/admin/in-house', '/admin/checkout',
    '/admin/rooms', '/admin/rooms/create',
    '/admin/housekeeping',
    '/admin/services', '/admin/service-categories', '/admin/amenities',
    '/admin/articles', '/admin/attractions', '/admin/vouchers', '/admin/reviews',
    '/admin/invoices', '/admin/payments', '/admin/order-services',
    '/admin/memberships', '/admin/equipments', '/admin/loss-compensation',
    '/admin/notifications', '/admin/profile',
    '/admin/users', // Manager có thể xem nhân sự, không phân quyền
  ],

  [ROLES.RECEPTIONIST]: [
    '/admin/dashboard',
    '/admin/bookings', '/admin/arrivals', '/admin/in-house', '/admin/checkout',
    '/admin/services', '/admin/service-categories',
    '/admin/notifications', '/admin/profile',
  ],

  [ROLES.HOUSEKEEPING]: [
    '/admin/dashboard',
    '/admin/housekeeping',
    '/admin/rooms',
    '/admin/equipments',
    '/admin/loss-compensation',
    '/admin/notifications', '/admin/profile',
  ],

  [ROLES.ACCOUNTANT]: [
    '/admin/dashboard',
    '/admin/invoices', '/admin/payments', '/admin/order-services',
    '/admin/notifications', '/admin/profile',
  ],

  [ROLES.MARKETING]: [
    '/admin/dashboard',
    '/admin/articles', '/admin/attractions', '/admin/vouchers', '/admin/reviews',
    '/admin/amenities', '/admin/services',
    '/admin/notifications', '/admin/profile',
  ],

  [ROLES.GUEST]: [
    '/admin/dashboard', // Cho phép truy cập trang chủ để không bị loop redirect
    '/admin/profile',
  ],
};

// ─── Hành động được phép theo từng role ───────────────────────────────────
export const ROLE_ACTIONS = {
  [ROLES.ADMIN]: {
    canCreate: true, canEdit: true, canDelete: true,
    canExport: true, canViewAll: true, canManageUsers: true,
    canManageRoles: true, canViewAuditLogs: true,
  },
  [ROLES.MANAGER]: {
    canCreate: true, canEdit: true, canDelete: true,
    canExport: true, canViewAll: true, canManageUsers: false,
    canManageRoles: false, canViewAuditLogs: false,
  },
  [ROLES.RECEPTIONIST]: {
    canCreate: true, canEdit: true, canDelete: false,
    canExport: false, canViewAll: false, canManageUsers: false,
    canManageRoles: false, canViewAuditLogs: false,
  },
  [ROLES.HOUSEKEEPING]: {
    canCreate: false, canEdit: true, canDelete: false,
    canExport: false, canViewAll: false, canManageUsers: false,
    canManageRoles: false, canViewAuditLogs: false,
  },
  [ROLES.ACCOUNTANT]: {
    canCreate: true, canEdit: true, canDelete: false,
    canExport: true, canViewAll: false, canManageUsers: false,
    canManageRoles: false, canViewAuditLogs: false,
  },
  [ROLES.MARKETING]: {
    canCreate: true, canEdit: true, canDelete: true,
    canExport: false, canViewAll: false, canManageUsers: false,
    canManageRoles: false, canViewAuditLogs: false,
  },
};

// ─── Menu sidebar được phép theo từng role ────────────────────────────────
// Key tương ứng với key trong AdminLayout menuItems
export const ROLE_MENU_KEYS = {
  [ROLES.ADMIN]: '*',

  [ROLES.MANAGER]: [
    '/admin/dashboard',
    'g1', '/admin/bookings', '/admin/arrivals', '/admin/in-house', '/admin/checkout',
    '/admin/housekeeping', '/admin/services', '/admin/service-categories', '/admin/loss-compensation',
    'g2', '/admin/rooms', '/admin/equipments', '/admin/amenities',
    'g3', '/admin/articles', '/admin/attractions', '/admin/vouchers', '/admin/reviews',
    'g4', '/admin/users', '/admin/memberships',
    'g5', '/admin/invoices', '/admin/payments', '/admin/order-services',
    'g6', '/admin/notifications',
  ],

  [ROLES.RECEPTIONIST]: [
    '/admin/dashboard',
    'g1', '/admin/bookings', '/admin/arrivals', '/admin/in-house', '/admin/checkout',
    '/admin/services', '/admin/service-categories',
    'g6', '/admin/notifications',
  ],

  [ROLES.HOUSEKEEPING]: [
    '/admin/dashboard',
    'g1', '/admin/housekeeping', '/admin/loss-compensation',
    'g2', '/admin/rooms', '/admin/equipments',
    'g6', '/admin/notifications',
  ],

  [ROLES.ACCOUNTANT]: [
    '/admin/dashboard',
    'g5', '/admin/invoices', '/admin/payments', '/admin/order-services',
    'g6', '/admin/notifications',
  ],

  [ROLES.MARKETING]: [
    '/admin/dashboard',
    'g3', '/admin/articles', '/admin/attractions', '/admin/vouchers', '/admin/reviews',
    'g1', '/admin/services', '/admin/amenities',
    'g6', '/admin/notifications',
  ],

  [ROLES.GUEST]: [],
};

// ─── Label hiển thị cho từng role ────────────────────────────────────────
export const ROLE_LABELS = {
  [ROLES.ADMIN]: { label: 'Quản Trị Viên', color: '#ff4d4f', bg: 'rgba(255,77,79,0.1)' },
  [ROLES.MANAGER]: { label: 'Quản Lý', color: '#722ed1', bg: 'rgba(114,46,209,0.1)' },
  [ROLES.RECEPTIONIST]: { label: 'Lễ Tân', color: '#1677ff', bg: 'rgba(22,119,255,0.1)' },
  [ROLES.HOUSEKEEPING]: { label: 'Buồng Phòng', color: '#fa8c16', bg: 'rgba(250,140,22,0.1)' },
  [ROLES.ACCOUNTANT]: { label: 'Kế Toán', color: '#52c41a', bg: 'rgba(82,196,26,0.1)' },
  [ROLES.MARKETING]: { label: 'Marketing', color: '#eb2f96', bg: 'rgba(235,47,150,0.1)' },
  [ROLES.GUEST]: { label: 'Khách Hàng', color: '#888888', bg: 'rgba(136,136,136,0.1)' },
};

// ─── Normalize role name ───────────────────────────────────────────────────
export const normalizeRole = (roleValue) => {
  if (!roleValue) return ROLES.RECEPTIONIST; // default fallback
  // roleValue can be string like "Admin", "Receptionist", object {id, name}, or object {name: "Receptionist"}
  const raw = (typeof roleValue === 'object' ? (roleValue.name || roleValue.roleName || '') : roleValue) || '';
  const lower = raw.toLowerCase().trim().replace(/\s+/g, '');

  // Exact SQL Roles table names first (case-insensitive)
  if (lower === 'admin') return ROLES.ADMIN;
  if (lower === 'manager' || lower === 'quanly' || lower === 'quảnlý') return ROLES.MANAGER;
  if (lower === 'receptionist' || lower === 'letan' || lower === 'lễtân') return ROLES.RECEPTIONIST;
  if (lower === 'housekeeping' || lower === 'buongphong' || lower === 'buồngphòng') return ROLES.HOUSEKEEPING;
  if (lower === 'accountant' || lower === 'ketoan' || lower === 'kếtoán') return ROLES.ACCOUNTANT;
  if (lower === 'marketing') return ROLES.MARKETING;

  // Partial match fallback
  if (lower.includes('admin')) return ROLES.ADMIN;
  if (lower.includes('manager') || lower.includes('quanly')) return ROLES.MANAGER;
  if (lower.includes('recept') || lower.includes('letan')) return ROLES.RECEPTIONIST;
  if (lower.includes('house') || lower.includes('buong')) return ROLES.HOUSEKEEPING;
  if (lower.includes('account') || lower.includes('ketoan')) return ROLES.ACCOUNTANT;
  if (lower.includes('market')) return ROLES.MARKETING;
  if (lower.includes('khach') || lower.includes('guest')) return ROLES.GUEST;

  return ROLES.GUEST; // safe default cho các user không thuộc quản trị
};

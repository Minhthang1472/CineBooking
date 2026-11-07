import { useAuthStore } from '../store/authStore';
import {
  normalizeRole,
  ROLE_ALLOWED_ROUTES,
  ROLE_ACTIONS,
  ROLE_MENU_KEYS,
  ROLE_LABELS,
} from '../config/rolePermissions';

/**
 * Hook usePermission — hệ thống phân quyền
 * Sử dụng khắp nơi để kiểm tra quyền trước khi render UI
 *
 * @example
 * const { canCreate, canDelete, hasAccess, isAdmin, roleLabel } = usePermission();
 */
const usePermission = () => {
  const { user } = useAuthStore();
  const role = normalizeRole(user?.role || user?.roleName);
  const actions = ROLE_ACTIONS[role] || {};
  const allowedRoutes = ROLE_ALLOWED_ROUTES[role];
  const allowedMenuKeys = ROLE_MENU_KEYS[role];
  const roleMeta = ROLE_LABELS[role] || { label: role, color: '#888', bg: '#f5f5f5' };

  /**
   * Kiểm tra xem route/path có được phép không
   * @param {string} path - VD: '/admin/users'
   */
  const hasAccess = (path) => {
    if (allowedRoutes === '*') return true;
    if (!allowedRoutes) return false;
    return allowedRoutes.some(r => path.startsWith(r));
  };

  /**
   * Kiểm tra menu key có được phép không (cho sidebar)
   * @param {string} key - VD: '/admin/users' hoặc group key 'g4'
   */
  const canSeeMenu = (key) => {
    if (allowedMenuKeys === '*') return true;
    if (!allowedMenuKeys) return false;
    return allowedMenuKeys.includes(key);
  };

  return {
    role,
    isAdmin: role === 'admin',
    isManager: role === 'manager',
    isReceptionist: role === 'receptionist',
    isHousekeeping: role === 'housekeeping',
    isAccountant: role === 'accountant',
    isMarketing: role === 'marketing',

    // Actions
    canCreate: actions.canCreate ?? false,
    canEdit: actions.canEdit ?? false,
    canDelete: actions.canDelete ?? false,
    canExport: actions.canExport ?? false,
    canViewAll: actions.canViewAll ?? false,
    canManageUsers: actions.canManageUsers ?? false,
    canManageRoles: actions.canManageRoles ?? false,
    canViewAuditLogs: actions.canViewAuditLogs ?? false,

    // Route & Menu
    hasAccess,
    canSeeMenu,

    // Label
    roleLabel: roleMeta.label,
    roleColor: roleMeta.color,
    roleBg: roleMeta.bg,
  };
};

export default usePermission;

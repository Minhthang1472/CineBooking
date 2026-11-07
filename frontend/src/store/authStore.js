import { create } from 'zustand';
import { jwtDecode } from 'jwt-decode';

// Helper: extract user info from JWT token
const extractUserFromToken = (token) => {
  try {
    const decoded = jwtDecode(token);
    const id = parseInt(
      decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ||
      decoded.sub || decoded.nameid || '0'
    );
    const name = decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || decoded.name || 'Khách';
    const role = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || decoded.role || 'Guest';
    const email = decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || decoded.email || '';
    return { id, name, role, email };
  } catch { return null; }
};

// Auto-fix: nếu user cũ có id=0, decode lại token để lấy đúng id
const _token = localStorage.getItem('token') || null;
let _user = JSON.parse(localStorage.getItem('user')) || null;
if (_token && _user && (!_user.id || _user.id === 0)) {
  const fresh = extractUserFromToken(_token);
  if (fresh && fresh.id > 0) {
    _user = fresh;
    localStorage.setItem('user', JSON.stringify(_user));
  }
}

export const useAuthStore = create((set) => ({
  token: _token,
  user: _user,

  setAuth: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ token, user });
  },

  clearAuth: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null });
  },
}));
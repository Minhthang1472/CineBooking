import React, { createContext, useContext, useState, useCallback } from 'react';

// Tạo Context
const NotificationContext = createContext();

const STORAGE_KEY = 'hotel_erp_notifications';

const loadFromStorage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    // Chuyển timestamp string → Date object
    return parsed.map(n => ({ ...n, timestamp: new Date(n.timestamp) }));
  } catch {
    return [];
  }
};

const saveToStorage = (notifications) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  } catch {}
};

// Provider Component
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState(() => loadFromStorage());

  // Thêm thông báo mới
  const addNotification = useCallback((title, description, type = 'info') => {
    const newNotification = {
      id: Date.now(),
      title,
      description,
      type, // 'info', 'success', 'warning', 'error'
      timestamp: new Date(),
    };

    setNotifications((prev) => {
      const updated = [newNotification, ...prev];
      saveToStorage(updated);
      return updated;
    });

    // Tự động xóa thông báo sau 30 giây
    setTimeout(() => {
      removeNotification(newNotification.id);
    }, 30000);

    return newNotification.id;
  }, []);

  // Xóa thông báo
  const removeNotification = useCallback((id) => {
    setNotifications((prev) => {
      const updated = prev.filter((n) => n.id !== id);
      saveToStorage(updated);
      return updated;
    });
  }, []);

  // Xóa tất cả thông báo
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
  };

  return React.createElement(
    NotificationContext.Provider,
    { value },
    children
  );
};

// Custom Hook để dùng Notification
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification phải được dùng trong NotificationProvider');
  }
  return context;
};

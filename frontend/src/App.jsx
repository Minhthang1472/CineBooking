import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import AdminLayout from './layouts/AdminLayout';
import WebsiteLayout from './layouts/WebsiteLayout';

import HomePage from './pages/website/HomePage';
import RoomsPage from './pages/website/RoomsPage';
import RoomDetailPage from './pages/website/RoomDetailPage';
import ServicesPage from './pages/website/ServicesPage';
import ReviewsPage from './pages/website/ReviewsPage';
import WebsiteLoginPage from './pages/website/WebsiteLoginPage';
import PaymentPage from './pages/website/PaymentPage';
import PromotionsPage from './pages/website/PromotionsPage';
import WebsiteProfilePage from './pages/website/WebsiteProfilePage';
import NewsPage from './pages/website/NewsPage';
import AttractionsWebPage from './pages/website/AttractionsWebPage';

import RoleManagePage from './pages/admin/roles/RoleManagePage';
import UserManagementPage from './pages/admin/UserManagement/UserManagementPage';
import EquipmentsPage from './pages/admin/Equipments/EquipmentsPage';
import RoomManagementPage from './pages/admin/RoomManagement/RoomManagementPage';
import RoomCreatePage from './pages/admin/RoomManagement/RoomCreatePage';
import RoomTypesPage from './pages/admin/RoomTypes/RoomTypesPage';
import LossCompensationPage from './pages/admin/LossCompensation/LossCompensationPage';
import HousekeepingPage from './pages/admin/Housekeeping/HousekeepingPage';
import BookingsPage from './pages/admin/Bookings/BookingsPage';
import ArrivalsPage from './pages/admin/Bookings/ArrivalsPage';
import InHousePage from './pages/admin/Bookings/InHousePage';
import CheckoutPage from './pages/admin/Bookings/CheckoutPage';
import ServicesAdminPage from './pages/admin/Services/ServicesPage';
import AmenitiesPage from './pages/admin/Amenities/AmenitiesPage';
import ArticlesPage from './pages/admin/Articles/ArticlesPage';
import AttractionsPage from './pages/admin/Attractions/AttractionsPage';
import VouchersPage from './pages/admin/Vouchers/VouchersPage';
import DashboardPage from './pages/admin/Dashboard/DashboardPage';
import ReviewsAdminPage from './pages/admin/Reviews/ReviewsPage';
import InvoicesPage from './pages/admin/Invoices/InvoicesPage';
import MembershipsPage from './pages/admin/Memberships/MembershipsPage';
import PaymentsPage from './pages/admin/Payments/PaymentsPage';
import OrderServicesPage from './pages/admin/OrderServices/OrderServicesPage';
import AuditLogsPage from './pages/admin/AuditLogs/AuditLogsPage';
import NotificationsPage from './pages/admin/Notifications/NotificationsPage';
import ProfilePage from './pages/admin/Profile/ProfilePage';

import { useAuthStore } from './store/authStore';
import { NotificationProvider } from './context/notificationContext';
import usePermission from './hooks/usePermission';
import { message } from 'antd';
import 'antd/dist/reset.css';

const ProtectedRoute = ({ children }) => {
  const token = useAuthStore((state) => state.token);
  if (!token) {
    return <Navigate to="/website-login" replace />;
  }
  return children;
};

const RoleProtectedRoute = ({ path, children }) => {
  const { hasAccess } = usePermission();
  if (!hasAccess(path)) {
    message.warning('Bạn không có quyền truy cập trang này!', 3);
    return <Navigate to="/admin/dashboard" replace />;
  }
  return children;
};

function App() {
  return (
    <NotificationProvider>
      <BrowserRouter>
        <Routes>
          {/* ===== PUBLIC WEBSITE ROUTES ===== */}
          <Route element={<WebsiteLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/rooms" element={<RoomsPage />} />
            <Route path="/rooms/:id" element={<RoomDetailPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/reviews" element={<ReviewsPage />} />
            <Route path="/my-bookings" element={<PaymentPage />} />
            <Route path="/payment" element={<Navigate to="/my-bookings" replace />} />
            <Route path="/promotions" element={<PromotionsPage />} />
            <Route path="/news" element={<NewsPage />} />
            <Route path="/attractions" element={<AttractionsWebPage />} />
            <Route path="/profile" element={<ProtectedRoute><WebsiteProfilePage /></ProtectedRoute>} />
          </Route>


          {/* Auth pages (no layout wrapper) */}
          <Route path="/website-login" element={<WebsiteLoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* ===== ADMIN ROUTES ===== */}
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />

            <Route path="roles" element={<RoleProtectedRoute path="/admin/roles"><RoleManagePage /></RoleProtectedRoute>} />
            <Route path="users" element={<RoleProtectedRoute path="/admin/users"><UserManagementPage /></RoleProtectedRoute>} />
            <Route path="audit-logs" element={<RoleProtectedRoute path="/admin/audit-logs"><AuditLogsPage /></RoleProtectedRoute>} />

            <Route path="invoices" element={<RoleProtectedRoute path="/admin/invoices"><InvoicesPage /></RoleProtectedRoute>} />
            <Route path="payments" element={<RoleProtectedRoute path="/admin/payments"><PaymentsPage /></RoleProtectedRoute>} />
            <Route path="order-services" element={<RoleProtectedRoute path="/admin/order-services"><OrderServicesPage /></RoleProtectedRoute>} />

            <Route path="equipments" element={<RoleProtectedRoute path="/admin/equipments"><EquipmentsPage /></RoleProtectedRoute>} />
            <Route path="rooms" element={<RoleProtectedRoute path="/admin/rooms"><RoomManagementPage /></RoleProtectedRoute>} />
            <Route path="room-types" element={<RoleProtectedRoute path="/admin/room-types"><RoomTypesPage /></RoleProtectedRoute>} />
            <Route path="rooms/create" element={<RoleProtectedRoute path="/admin/rooms/create"><RoomCreatePage /></RoleProtectedRoute>} />
            <Route path="loss-compensation" element={<RoleProtectedRoute path="/admin/loss-compensation"><LossCompensationPage /></RoleProtectedRoute>} />
            <Route path="housekeeping" element={<RoleProtectedRoute path="/admin/housekeeping"><HousekeepingPage /></RoleProtectedRoute>} />

            <Route path="bookings" element={<RoleProtectedRoute path="/admin/bookings"><BookingsPage /></RoleProtectedRoute>} />
            <Route path="arrivals" element={<RoleProtectedRoute path="/admin/arrivals"><ArrivalsPage /></RoleProtectedRoute>} />
            <Route path="in-house" element={<RoleProtectedRoute path="/admin/in-house"><InHousePage /></RoleProtectedRoute>} />
            <Route path="checkout" element={<RoleProtectedRoute path="/admin/checkout"><CheckoutPage /></RoleProtectedRoute>} />

            <Route path="services" element={<RoleProtectedRoute path="/admin/services"><ServicesAdminPage /></RoleProtectedRoute>} />
            <Route path="amenities" element={<RoleProtectedRoute path="/admin/amenities"><AmenitiesPage /></RoleProtectedRoute>} />
            <Route path="articles" element={<RoleProtectedRoute path="/admin/articles"><ArticlesPage /></RoleProtectedRoute>} />
            <Route path="attractions" element={<RoleProtectedRoute path="/admin/attractions"><AttractionsPage /></RoleProtectedRoute>} />
            <Route path="vouchers" element={<RoleProtectedRoute path="/admin/vouchers"><VouchersPage /></RoleProtectedRoute>} />
            <Route path="reviews" element={<RoleProtectedRoute path="/admin/reviews"><ReviewsAdminPage /></RoleProtectedRoute>} />
            <Route path="memberships" element={<RoleProtectedRoute path="/admin/memberships"><MembershipsPage /></RoleProtectedRoute>} />

            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="service-categories" element={<ServicesAdminPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </NotificationProvider>
  );
}

export default App;

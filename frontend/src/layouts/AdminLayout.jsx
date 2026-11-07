import React, { useState, useEffect } from 'react';
import { Layout, Menu, Typography, Badge, Avatar, Space, Dropdown, Popover, Button, Empty, Divider, ConfigProvider, theme } from 'antd';
import { 
  DashboardOutlined, 
  TeamOutlined, 
  SafetyCertificateOutlined,
  BellOutlined,
  UserOutlined,
  DeleteOutlined,
  ClearOutlined,
  InboxOutlined,
  BankOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  CalendarOutlined,
  AppstoreAddOutlined,
  CoffeeOutlined,
  FileTextOutlined,
  EnvironmentOutlined,
  GiftOutlined,
  StarOutlined,
  CreditCardOutlined,
  DollarOutlined,
  CrownOutlined,
  AuditOutlined,
  AppstoreOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BulbOutlined,
  BulbFilled,
  LoginOutlined,
  LogoutOutlined,
  HomeOutlined
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

import { useAuthStore } from '../store/authStore';
import { useNotification } from '../context/notificationContext';
import usePermission from '../hooks/usePermission';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

function getItem(label, key, icon, children, type) {
  return { key, icon, children, label, type };
}

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { notifications, removeNotification, clearAllNotifications } = useNotification();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const { user } = useAuthStore();
  const { canSeeMenu, roleLabel, roleColor, roleBg, isAdmin } = usePermission();
  const [collapsed, setCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    document.body.style.backgroundColor = isDarkMode ? '#141414' : '#f7f9fa';
  }, [isDarkMode]);

  // Menu loc theo role — chi hien thi items duoc phep
  const allMenuGroups = [
    { key: 'g1', label: 'LỄ TÂN & BUỒNG', children: [
      getItem('Quản lý Đặt phòng', '/admin/bookings', <CalendarOutlined />),
      getItem('Khách đến hôm nay', '/admin/arrivals', <LoginOutlined />),
      getItem('Khách đang lưu trú', '/admin/in-house', <HomeOutlined />),
      getItem('Thủ tục trả phòng', '/admin/checkout', <LogoutOutlined />),
      getItem('Sơ đồ phòng (Housekeeping)', '/admin/housekeeping', <CheckCircleOutlined />),
      getItem('Quản lý Dịch vụ', '/admin/services', <AppstoreAddOutlined />),
      getItem('Danh mục Dịch vụ', '/admin/service-categories', <AppstoreAddOutlined />),
      getItem('Thất thoát & Đền bù', '/admin/loss-compensation', <WarningOutlined />),
    ]},
    { key: 'g2', label: 'CƠ SỞ VẬT CHẤT', children: [
      getItem('Hạng Phòng & Hình Ảnh', '/admin/room-types', <AppstoreAddOutlined />),
      getItem('Quản lý Phòng', '/admin/rooms', <BankOutlined />),
      getItem('Kho vật tư', '/admin/equipments', <InboxOutlined />),
      getItem('Tiện ích phòng (Amenities)', '/admin/amenities', <CoffeeOutlined />),
    ]},
    { key: 'g3', label: 'MARKETING & NỘI DUNG', children: [
      getItem('Tin tức & Bài viết', '/admin/articles', <FileTextOutlined />),
      getItem('Địa điểm lân cận', '/admin/attractions', <EnvironmentOutlined />),
      getItem('Khuyến mãi (Vouchers)', '/admin/vouchers', <GiftOutlined />),
      getItem('Đánh giá khách hàng', '/admin/reviews', <StarOutlined />),
    ]},
    { key: 'g4', label: 'BẢO MẬT & NHÂN SỰ', children: [
      getItem('Danh sách Nhân sự', '/admin/users', <TeamOutlined />),
      getItem('Vai trò & Phân quyền', '/admin/roles', <SafetyCertificateOutlined />),
      getItem('Hạng Thành Viên', '/admin/memberships', <CrownOutlined />),
    ]},
    { key: 'g5', label: 'TÀI CHÍNH & KẾ TOÁN', children: [
      getItem('Hóa Đơn', '/admin/invoices', <FileTextOutlined />),
      getItem('Thanh Toán', '/admin/payments', <CreditCardOutlined />),
      getItem('Đơn Dịch Vụ', '/admin/order-services', <AppstoreOutlined />),
    ]},
    { key: 'g6', label: 'HỆ THỐNG', children: [
      isAdmin ? getItem('Nhật Ký Hệ Thống', '/admin/audit-logs', <AuditOutlined />) : null,
      getItem('Quản lý Thông báo', '/admin/notifications', <BellOutlined />),
    ].filter(Boolean)},
  ];

  const filteredMenuItems = [
    getItem('Dashboard', '/admin/dashboard', <DashboardOutlined />),
    ...allMenuGroups.map(g => {
      const visibleChildren = g.children.filter(c => canSeeMenu(c.key));
      if (visibleChildren.length === 0) return null;
      return getItem(g.label, g.key, null, visibleChildren, 'group');
    }).filter(Boolean),
  ];

  const getNotificationColor = (type) => {
    switch (type) {
      case 'success': return '#52c41a';
      case 'error': return '#ff4d4f';
      case 'warning': return '#faad14';
      case 'info':
      default: return '#1890ff';
    }
  };

  const notificationContent = (
    <div style={{ width: '350px', maxHeight: '500px', overflowY: 'auto' }}>
      {notifications.length === 0 ? (
        <Empty description="Không có thông báo nào" style={{ margin: '20px 0' }} />
      ) : (
        <div>
          {notifications.map((notif, index) => (
            <div key={notif.id}>
              <div style={{ padding: '12px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: getNotificationColor(notif.type),
                      }}
                    />
                    <Text strong style={{ color: '#000' }}>
                      {notif.title}
                    </Text>
                  </div>
                  <Text style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '4px' }}>
                    {notif.description}
                  </Text>
                  <Text type="secondary" style={{ fontSize: '11px' }}>
                    {notif.timestamp.toLocaleTimeString('vi-VN')}
                  </Text>
                </div>
                <Button
                  type="text"
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() => removeNotification(notif.id)}
                  style={{ marginLeft: '8px', color: '#999' }}
                />
              </div>
              {index < notifications.length - 1 && <Divider style={{ margin: '8px 0' }} />}
            </div>
          ))}
          
          {notifications.length > 0 && (
            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f0f0f0' }}>
              <Button
                type="text"
                danger
                size="small"
                icon={<ClearOutlined />}
                onClick={clearAllNotifications}
                block
              >
                Xóa tất cả
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 8,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          colorBgLayout: isDarkMode ? '#141414' : '#f7f9fa',
        },
      }}
    >
      <Layout style={{ minHeight: '100vh', background: isDarkMode ? '#141414' : '#f7f9fa' }}>
        {/* SIDEBAR VỚI GIAO DIỆN PREMIUM */}
        <Sider 
          width={280} 
          theme={isDarkMode ? 'dark' : 'light'}
          breakpoint="lg"
          collapsedWidth="0"
          onCollapse={(value) => setCollapsed(value)}
          collapsed={collapsed}
          style={{ 
            boxShadow: '4px 0 24px rgba(0,0,0,0.02)',
            zIndex: 20
          }}
        >
          {/* Logo */}
          <div style={{
            padding: '20px 20px 8px',
            display: 'flex', alignItems: 'center', gap: '12px',
          }}>
            <div style={{
              width: '36px', height: '36px',
              background: 'linear-gradient(135deg, #1677ff 0%, #0958d9 100%)',
              borderRadius: '10px', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: 'white', fontWeight: 'bold',
              fontSize: '18px', boxShadow: '0 4px 12px rgba(22, 119, 255, 0.3)', flexShrink: 0
            }}>36</div>
            {!collapsed && (
              <Title level={4} style={{ margin: 0, fontWeight: 700, letterSpacing: '-0.5px' }}>
                ThirtySix ERP
              </Title>
            )}
          </div>
          {/* Role Badge */}
          {!collapsed && (
            <div style={{
              margin: '0 12px 10px',
              padding: '8px 12px',
              background: roleBg,
              borderRadius: 10,
              display: 'flex', alignItems: 'center', gap: 8,
              border: `1px solid ${roleColor}40`,
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: roleColor, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, color: '#888', lineHeight: 1.2 }}>Vai trò</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: roleColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{roleLabel}</div>
              </div>
              <div style={{ fontSize: 11, color: '#999', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.fullName || user?.name || ''}
              </div>
            </div>
          )}
          
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={filteredMenuItems}
            onClick={(e) => navigate(e.key)}
            style={{ borderRight: 0, padding: '0 12px' }}
          />
        </Sider>

        <Layout style={{ background: isDarkMode ? '#141414' : '#f7f9fa' }}>
          {/* HEADER VỚI HIỆU ỨNG GLASSMORPHISM */}
          <Header style={{ 
            background: isDarkMode ? 'rgba(20, 20, 20, 0.8)' : 'rgba(255, 255, 255, 0.8)', 
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            padding: '0 24px', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            position: 'sticky',
            top: 0,
            zIndex: 10,
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
          }}>
            {/* Header Left (breadcrumbs or greeting) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                style={{
                  fontSize: '16px',
                  width: 40,
                  height: 40,
                  display: window.innerWidth < 992 ? 'flex' : 'none' // Chỉ hiển thị trên mobile/tablet
                }}
              />
              <Text type="secondary" style={{ fontWeight: 500 }}>
                Xin chào trở lại, <Text strong style={{ color: isDarkMode ? 'white' : '#111827' }}>{user?.name || 'Admin'}</Text> 👋
              </Text>
            </div>

            {/* Header Right */}
            <Space size="large" align="center">
              {/* Nút Toggle Chế Độ Tối */}
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: isDarkMode ? '#333' : '#f3f4f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
              onClick={() => setIsDarkMode(!isDarkMode)}
              >
                {isDarkMode ? <BulbFilled style={{ fontSize: '18px', color: '#fadb14' }} /> : <BulbOutlined style={{ fontSize: '18px', color: '#4b5563' }} />}
              </div>

              <Popover
                content={notificationContent}
                title={`Thông báo (${notifications.length})`}
                trigger="click"
                placement="bottomRight"
                open={isNotificationOpen}
                onOpenChange={setIsNotificationOpen}
              >
                <Badge count={notifications.length} overflowCount={99} style={{ backgroundColor: '#ff4d4f' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: isDarkMode ? '#333' : '#f3f4f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = isDarkMode ? '#444' : '#e5e7eb'}
                  onMouseOut={(e) => e.currentTarget.style.background = isDarkMode ? '#333' : '#f3f4f6'}
                  >
                    <BellOutlined style={{ fontSize: '18px', color: isDarkMode ? '#fff' : '#4b5563' }} />
                  </div>
                </Badge>
              </Popover>
              
              <Dropdown 
                menu={{
                  items: [
                    { 
                      key: 'profile',
                      icon: <UserOutlined />,
                      label: 'Tài khoản của tôi',
                      onClick: () => navigate('/admin/profile')
                    },
                    { type: 'divider' },
                    { 
                      key: 'logout', 
                      danger: true, 
                      icon: <DeleteOutlined />,
                      label: 'Đăng xuất',
                      onClick: () => {
                        useAuthStore.getState().clearAuth();
                        navigate('/login');
                      }
                    }
                  ]
                }} 
                placement="bottomRight"
              >
                <Space style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: '40px', background: isDarkMode ? '#333' : '#f9fafb', border: isDarkMode ? 'none' : '1px solid #e5e7eb', transition: 'all 0.3s' }}
                 onMouseOver={(e) => e.currentTarget.style.background = isDarkMode ? '#444' : '#f3f4f6'}
                 onMouseOut={(e) => e.currentTarget.style.background = isDarkMode ? '#333' : '#f9fafb'}
                >
                  <Avatar size="small" src={`https://api.dicebear.com/7.x/notionists/svg?seed=${user?.name || 'Guest'}`} />
                  <Text strong style={{ fontSize: '13px', color: isDarkMode ? 'white' : 'inherit' }}>{user?.name || 'Khách'}</Text>
                </Space>
              </Dropdown>
            </Space>
          </Header>

          {/* CONTENT AREA */}
          <Content style={{ margin: '24px', background: 'transparent' }}>
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
};

export default AdminLayout;
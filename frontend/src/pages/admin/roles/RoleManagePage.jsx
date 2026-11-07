import React, { useState, useEffect } from 'react';
import { Table, Button, Typography, message, Drawer, Checkbox, Space, Divider, Card, Tag, Avatar } from 'antd';
import { SafetyCertificateOutlined, SaveOutlined, TeamOutlined } from '@ant-design/icons';
import { roleApi } from '../../../api/roleApi';
import { useNotification } from '../../../context/notificationContext';

const { Title, Text } = Typography;

const MOCK_PERMISSIONS = [
  { label: '👥 Quản lý Nhân sự', value: 1 },
  { label: '🛏️ Quản lý Phòng', value: 2 },
  { label: '📅 Quản lý Booking', value: 3 },
  { label: '💰 Quản lý Hóa đơn & Kế toán', value: 4 },
  { label: '🎟️ Quản lý Voucher', value: 5 },
  { label: '⭐ Quản lý Đánh giá', value: 6 },
  { label: '🧹 Dịn phòng (Housekeeping)', value: 7 },
  { label: '🛎️ Đơn Dịch vụ', value: 8 },
  { label: '📊 Dashboard & Thống kê', value: 9 },
  { label: '📰 Quản lý Nội dung (CMS)', value: 10 },
  { label: '🔍 Nhật ký hệ thống', value: 11 },
];

const ROLE_COLORS = {
  Admin: '#1677ff',
  Manager: '#722ed1',
  Staff: '#52c41a',
  Guest: '#8c8c8c',
};

const RoleManagePage = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [checkedPermissions, setCheckedPermissions] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const { addNotification } = useNotification();

  const MOCK_ROLES = [
    { id: 1, name: 'Admin', description: 'Quản trị viên cao cấp, toàn quyền hệ thống', userCount: 1 },
    { id: 2, name: 'Manager', description: 'Quản lý khach sạn: phòng, nhân viên, báo cáo', userCount: 2 },
    { id: 3, name: 'Staff', description: 'Nhân viên lễ tân & dịch vụ khách hàng', userCount: 8 },
    { id: 4, name: 'Housekeeper', description: 'Nhân viên buồng phòng & dịn dẹp', userCount: 5 },
    { id: 5, name: 'Guest', description: 'Khách lưu trú - quyền xem giới hạn', userCount: 312 },
  ];

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const response = await roleApi.getAllRoles();
      const rolesData = response.data?.data || response.data || [];
      setRoles(Array.isArray(rolesData) && rolesData.length > 0 ? rolesData : MOCK_ROLES);
    } catch {
      setRoles(MOCK_ROLES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleOpenDrawer = (role) => {
    setSelectedRole(role);
    setCheckedPermissions([]);
    setIsDrawerOpen(true);
  };

  const handleSavePermissions = async () => {
    if (checkedPermissions.length === 0) {
      message.warning('Vui lòng chọn ít nhất 1 quyền!');
      return;
    }
    setIsSaving(true);
    try {
      const promises = checkedPermissions.map(permissionId =>
        roleApi.assignPermission({ roleId: selectedRole.id, permissionId })
      );
      await Promise.all(promises);
      message.success(`Đã cấp quyền thành công cho vai trò: ${selectedRole.name}`);
      addNotification('Cấp quyền thành công', `Đã cấp ${checkedPermissions.length} quyền cho vai trò: ${selectedRole.name}`, 'success');
      setIsDrawerOpen(false);
      fetchRoles();
    } catch (error) {
      const errMsg = error.response?.data?.Message || JSON.stringify(error.response?.data) || 'Lỗi máy chủ!';
      message.error(errMsg);
      addNotification('Lỗi cấp quyền', errMsg, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const columns = [
    {
      title: 'Vai Trò',
      key: 'name',
      render: (_, record) => (
        <Space>
          <Avatar
            size={40}
            style={{
              background: `${ROLE_COLORS[record.name] || '#8c8c8c'}20`,
              color: ROLE_COLORS[record.name] || '#8c8c8c',
              fontWeight: 700,
              fontSize: '16px',
            }}
          >
            {record.name?.charAt(0)}
          </Avatar>
          <div>
            <Text strong style={{ display: 'block', fontSize: '14px' }}>{record.name}</Text>
            <Text type="secondary" style={{ fontSize: '12px' }}>ID: {record.id}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      render: (text) => <Text type={text ? undefined : 'secondary'}>{text || 'Chưa có mô tả'}</Text>,
    },
    {
      title: 'Cấp độ',
      key: 'level',
      render: (_, record) => {
        const color = ROLE_COLORS[record.name] || '#8c8c8c';
        return (
          <Tag
            style={{
              background: `${color}18`,
              color,
              border: `1px solid ${color}40`,
              borderRadius: '6px',
              padding: '2px 10px',
              fontWeight: 600,
            }}
          >
            {record.name}
          </Tag>
        );
      },
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Button
          type="primary"
          ghost
          icon={<SafetyCertificateOutlined />}
          disabled={record.name === 'Guest' || record.name === 'Admin'}
          onClick={() => handleOpenDrawer(record)}
          style={{ borderRadius: '8px' }}
        >
          Phân quyền
        </Button>
      ),
    },
  ];

  return (
    <div>
      {/* Banner Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #001529 0%, #722ed1 100%)',
          borderRadius: '16px',
          padding: '32px 40px',
          marginBottom: '28px',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 10px 30px rgba(114,46,209,0.2)',
        }}
      >
        <div>
          <Title level={2} style={{ color: 'white', margin: '0 0 8px 0', fontWeight: 700 }}>
            Vai Trò & Phân Quyền (RBAC)
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '15px' }}>
            Quản lý các cấp bậc nhân sự và quyền truy cập hệ thống. Thay đổi tại đây sẽ ảnh hưởng đến tất cả nhân viên giữ vai trò tương ứng.
          </Text>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255,255,255,0.15)',
            padding: '12px 20px',
            borderRadius: '12px',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.2)',
          }}
        >
          <TeamOutlined style={{ fontSize: '24px' }} />
          <div>
            <div style={{ fontSize: '24px', fontWeight: 800 }}>{roles.length}</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Vai trò</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <Card style={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }} styles={{ body: { padding: 0 } }}>
        <Table
          dataSource={roles}
          columns={columns}
          rowKey="id"
          pagination={false}
          loading={loading}
          style={{ borderRadius: '16px', overflow: 'hidden' }}
        />
      </Card>

      {/* Drawer Phân Quyền */}
      <Drawer
        title={
          <Space>
            <SafetyCertificateOutlined style={{ color: '#722ed1' }} />
            <span>
              Phân quyền: <strong>{selectedRole?.name}</strong>
            </span>
          </Space>
        }
        placement="right"
        size="default"
        onClose={() => setIsDrawerOpen(false)}
        open={isDrawerOpen}
        extra={
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSavePermissions}
            loading={isSaving}
            style={{ borderRadius: '8px' }}
          >
            Lưu thay đổi
          </Button>
        }
      >
        <Text type="secondary">Chọn các module mà vai trò này được phép truy cập:</Text>
        <Divider />
        <Checkbox.Group
          style={{ width: '100%' }}
          value={checkedPermissions}
          onChange={(checkedValues) => setCheckedPermissions(checkedValues)}
        >
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {MOCK_PERMISSIONS.map(item => (
              <div
                key={item.value}
                style={{
                  padding: '12px 16px',
                  background: checkedPermissions.includes(item.value) ? '#e6f4ff' : '#fafafa',
                  borderRadius: '10px',
                  border: `1px solid ${checkedPermissions.includes(item.value) ? '#91caff' : '#f0f0f0'}`,
                  transition: 'all 0.2s',
                }}
              >
                <Checkbox value={item.value}>
                  <Text
                    strong
                    style={{ color: checkedPermissions.includes(item.value) ? '#1677ff' : '#374151' }}
                  >
                    {item.label}
                  </Text>
                </Checkbox>
              </div>
            ))}
          </Space>
        </Checkbox.Group>
      </Drawer>
    </div>
  );
};

export default RoleManagePage;
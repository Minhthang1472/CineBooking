import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Typography,
  message,
  Space,
  Input,
  Popconfirm,
  Form,
  Select,
  Tooltip,
  Card,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  LockOutlined,
  UnlockOutlined,
  SearchOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { userApi } from '../../../api/userApi';
import { roleApi } from '../../../api/roleApi';
import UserForm from './UserForm';
import { useNotification } from '../../../context/notificationContext';

const { Title, Text } = Typography;

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  // State quản lý Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [form] = Form.useForm();

  // ✅ Gọi hook Notification
  const { addNotification } = useNotification();

  const MOCK_USERS = [
    { id: 1, fullName: 'Nguyễn Minh Quân', email: 'admin@luxstay.vn', phone: '0901234567', roleId: 1, roleName: 'Admin', status: true, createdAt: '2026-01-01' },
    { id: 2, fullName: 'Trần Thị Hoa', email: 'manager@luxstay.vn', phone: '0912345678', roleId: 2, roleName: 'Manager', status: true, createdAt: '2026-01-15' },
    { id: 3, fullName: 'Lê Văn Tâm', email: 'staff1@luxstay.vn', phone: '0923456789', roleId: 3, roleName: 'Staff', status: true, createdAt: '2026-02-01' },
    { id: 4, fullName: 'Phạm Thị Lan', email: 'staff2@luxstay.vn', phone: '0934567890', roleId: 3, roleName: 'Staff', status: false, createdAt: '2026-02-15' },
    { id: 5, fullName: 'Hoàng Minh Đức', email: 'housekeeper@luxstay.vn', phone: '0945678901', roleId: 3, roleName: 'Staff', status: true, createdAt: '2026-03-01' },
  ];

  // Lấy danh sách users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await userApi.getAllUsers();
      const usersData = response.data || [];
      const list = Array.isArray(usersData) ? usersData : [];
      setUsers(list.length > 0 ? list : MOCK_USERS);
    } catch {
      setUsers(MOCK_USERS);
    } finally {
      setLoading(false);
    }
  };

  // Lấy danh sách roles
  const fetchRoles = async () => {
    try {
      const response = await roleApi.getAllRoles();
      const rolesData = response.data?.data || response.data || [];
      setRoles(Array.isArray(rolesData) ? rolesData : []);
    } catch (error) {
      console.error('❌ Lỗi gọi API roles:', error);
      message.error('Không thể tải danh sách vị trí!');
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  // Mở modal thêm user
  const handleOpenAddModal = () => {
    form.resetFields();
    setIsEditMode(false);
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  // Mở modal sửa user
  const handleOpenEditModal = (user) => {
    setIsEditMode(true);
    setSelectedUser(user);
    form.setFieldsValue({
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      roleId: user.roleId,
      status: user.status,
    });
    setIsModalOpen(true);
  };

  // Xử lý submit form (thêm/sửa)
  const handleFormSubmit = async (values) => {
    setFormLoading(true);
    try {
      if (isEditMode && selectedUser) {
        // Sửa user
        await userApi.updateUser(selectedUser.id, {
          ...selectedUser,
          ...values,
        });
        message.success('✅ Cập nhật thông tin nhân sự thành công!');
        // ✅ Gửi thông báo lên Global
        addNotification(
          'Cập nhật nhân sự',
          `Đã cập nhật thông tin: ${values.fullName}`,
          'success'
        );
      } else {
        // Thêm user mới
        await userApi.createUser(values);
        message.success('✅ Tạo tài khoản nhân sự thành công!');
        // ✅ Gửi thông báo lên Global
        addNotification(
          'Thêm nhân sự mới',
          `Đã tạo tài khoản: ${values.fullName}`,
          'success'
        );
      }

      setIsModalOpen(false);
      form.resetFields();
      fetchUsers();
    } catch (error) {
      console.error('❌ Lỗi:', error);
      if (error.response?.data?.Message) {
        message.error(error.response.data.Message);
      } else {
        message.error('Có lỗi xảy ra!');
      }
    } finally {
      setFormLoading(false);
    }
  };

  // Xóa user
  const handleDeleteUser = async (userId, userName) => {
    try {
      await userApi.deleteUser(userId);
      message.success('✅ Đã xóa nhân sự!');
      // ✅ Gửi thông báo lên Global
      addNotification('Xóa nhân sự', `Đã xóa nhân sự: ${userName}`, 'warning');
      fetchUsers();
    } catch (error) {
      console.error('❌ Lỗi xóa:', error);
      message.error('Không thể xóa nhân sự!');
    }
  };

  // Thay đổi role của user
  const handleChangeRole = async (userId, newRoleId, userName) => {
    try {
      await userApi.changeUserRole(userId, newRoleId);
      message.success('✅ Cập nhật vị trí thành công!');
      const roleName = roles.find((r) => r.id === newRoleId)?.name || 'không xác định';
      // ✅ Gửi thông báo lên Global
      addNotification(
        'Thay đổi vị trí',
        `Đã thay đổi vị trí của ${userName} thành ${roleName}`,
        'info'
      );
      fetchUsers();
    } catch (error) {
      console.error('❌ Lỗi thay đổi role:', error);
      message.error('Không thể thay đổi vị trí!');
    }
  };

  // Toggle Status (Bật/Tắt trạng thái)
  const handleToggleStatus = async (user) => {
    try {
      const newStatus = !user.status;
      await userApi.updateUser(user.id, {
        ...user,
        status: newStatus,
      });

      message.success(`✅ ${newStatus ? 'Kích hoạt' : 'Vô hiệu hóa'} nhân sự thành công!`);
      // ✅ Gửi thông báo lên Global
      addNotification(
        newStatus ? 'Kích hoạt nhân sự' : 'Vô hiệu hóa nhân sự',
        `${user.fullName} đã được ${newStatus ? 'kích hoạt' : 'vô hiệu hóa'}`,
        newStatus ? 'success' : 'warning'
      );
      fetchUsers();
    } catch (error) {
      console.error('❌ Lỗi thay đổi trạng thái:', error);
      message.error('Không thể thay đổi trạng thái!');
    }
  };

  // Bộ lọc search
  const filteredUsers = users.filter((user) =>
    user.fullName?.toLowerCase().includes(searchText.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchText.toLowerCase()) ||
    user.phone?.includes(searchText)
  );

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: '6%',
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: 'Họ và Tên',
      dataIndex: 'fullName',
      key: 'fullName',
      width: '18%',
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: '22%',
      render: (email) => <a href={`mailto:${email}`}>{email}</a>,
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone',
      key: 'phone',
      width: '12%',
      render: (phone) => phone || <Text type="secondary">-</Text>,
    },
    {
      title: 'Vị trí',
      dataIndex: ['role', 'name'],
      key: 'roleName',
      width: '14%',
      render: (roleName, record) => (
        <Tooltip title="Click để thay đổi vị trí">
          <Select
            value={record.roleId}
            style={{ width: '100%' }}
            onClick={(e) => e.stopPropagation()}
            onChange={(newRoleId) => handleChangeRole(record.id, newRoleId, record.fullName)}
          >
            {roles.map((role) => (
              <Select.Option key={role.id} value={role.id}>
                {role.name}
              </Select.Option>
            ))}
          </Select>
        </Tooltip>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: '12%',
      render: (status, record) => (
        <Tooltip title="Click để bật/tắt">
          <Button
            type={status ? 'primary' : 'default'}
            icon={status ? <UnlockOutlined /> : <LockOutlined />}
            onClick={() => handleToggleStatus(record)}
            style={{
              backgroundColor: status ? '#52c41a' : '#d9d9d9',
              borderColor: status ? '#52c41a' : '#d9d9d9',
              color: status ? 'white' : '#000',
            }}
          >
            {status ? 'Hoạt động' : 'Vô hiệu'}
          </Button>
        </Tooltip>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: '16%',
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleOpenEditModal(record)}
          >
            Sửa
          </Button>

          <Popconfirm
            title="Xóa nhân sự"
            description={`Bạn có chắc chắn muốn xóa nhân sự: ${record.fullName}?`}
            onConfirm={() => handleDeleteUser(record.id, record.fullName)}
            okText="Có"
            cancelText="Không"
          >
            <Button
              type="primary"
              danger
              icon={<DeleteOutlined />}
              size="small"
            >
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* Banner Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #001529 0%, #1677ff 100%)',
          borderRadius: '16px',
          padding: '32px 40px',
          marginBottom: '28px',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: '0 10px 30px rgba(22,119,255,0.15)',
        }}
      >
        <div>
          <Title level={2} style={{ color: 'white', margin: '0 0 8px 0', fontWeight: 700 }}>
            Danh Sách Nhân Sự & Người Dùng
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '15px' }}>
            Quản lý toàn bộ tài khoản nhân viên và phân công vị trí trong hệ thống.
          </Text>
        </div>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchUsers}
            loading={loading}
            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', backdropFilter: 'blur(8px)', borderRadius: '10px' }}
          >
            Làm mới
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleOpenAddModal}
            style={{ background: 'white', color: '#1677ff', border: 'none', borderRadius: '10px', fontWeight: 600 }}
          >
            Thêm nhân sự
          </Button>
        </Space>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '20px' }}>
        <Input.Search
          placeholder="Tìm kiếm theo tên, email hoặc số điện thoại..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: '100%', maxWidth: '420px', borderRadius: '10px' }}
          allowClear
          size="large"
        />
      </div>

      {/* Table */}
      <Card style={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }} bodyStyle={{ padding: 0 }}>
        <Table
          columns={columns}
          dataSource={filteredUsers}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} nhân sự`,
          }}
          scroll={{ x: 1200 }}
          style={{ borderRadius: '16px', overflow: 'hidden' }}
        />
      </Card>

      {/* Modal thêm/sửa user */}
      <Modal
        title={isEditMode ? `Sửa thông tin: ${selectedUser?.fullName}` : 'Thêm nhân sự mới'}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={600}
      >
        <UserForm
          form={form}
          onFinish={handleFormSubmit}
          loading={formLoading}
          roles={roles}
          isEditMode={isEditMode}
        />
      </Modal>
    </div>
  );
};

export default UserManagementPage;

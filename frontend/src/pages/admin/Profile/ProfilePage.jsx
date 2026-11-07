import React, { useState, useEffect } from 'react';
import { Card, Typography, Avatar, Button, Divider, Space, Form, Input, message, Row, Col, Tag, Modal, Upload, Spin } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, SafetyCertificateOutlined, EditOutlined, SaveOutlined, LockOutlined, CameraOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useAuthStore } from '../../../store/authStore';

const { Title, Text } = Typography;

const ProfilePage = () => {
  const { user } = useAuthStore();
  const [editMode, setEditMode] = useState(false);
  const [pwdModal, setPwdModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const [pwdForm] = Form.useForm();

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        fullName: user.fullName || user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const handleSave = async (values) => {
    setSaving(true);
    try {
      // Simulate API call
      await new Promise(r => setTimeout(r, 800));
      message.success('Cập nhật thông tin thành công!');
      setEditMode(false);
    } catch {
      message.error('Lỗi khi cập nhật!');
    } finally { setSaving(false); }
  };

  const handleChangePwd = async (values) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error('Mật khẩu xác nhận không khớp!');
      return;
    }
    try {
      await new Promise(r => setTimeout(r, 600));
      message.success('Đổi mật khẩu thành công!');
      setPwdModal(false);
      pwdForm.resetFields();
    } catch {
      message.error('Lỗi đổi mật khẩu!');
    }
  };

  const displayName = user?.fullName || user?.name || 'Admin';
  const displayEmail = user?.email || 'admin@luxstay.vn';
  const displayRole = user?.role || 'Administrator';

  const activities = [
    { label: 'Đăng nhập lần cuối', value: new Date().toLocaleDateString('vi-VN', { weekday: 'long', hour: '2-digit', minute: '2-digit' }), icon: '🔑' },
    { label: 'Tài khoản tạo ngày', value: '01/01/2026', icon: '📅' },
    { label: 'Trạng thái', value: 'Đang hoạt động', icon: '🟢' },
    { label: 'Phân quyền', value: displayRole, icon: '🛡️' },
  ];

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      {/* Hero Banner */}
      <div style={{ background: 'linear-gradient(135deg, #001529 0%, #1677ff 100%)', borderRadius: 20, padding: '40px 44px', marginBottom: 28, color: 'white', boxShadow: '0 12px 40px rgba(22,119,255,0.2)', position: 'relative', overflow: 'hidden' }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', right: -40, top: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', right: 60, top: 80, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap', position: 'relative' }}>
          <div style={{ position: 'relative' }}>
            <Avatar
              size={100}
              src={`https://api.dicebear.com/7.x/notionists/svg?seed=${displayName}`}
              style={{ border: '4px solid rgba(255,255,255,0.4)', background: '#fff', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}
            />
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: '50%', background: '#52c41a', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircleOutlined style={{ color: 'white', fontSize: 12 }} />
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <Title level={2} style={{ color: 'white', margin: '0 0 6px 0', fontWeight: 800 }}>{displayName}</Title>
            <Space>
              <Tag style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: 20, padding: '2px 12px', fontWeight: 600 }}>
                <SafetyCertificateOutlined style={{ marginRight: 4 }} />{displayRole}
              </Tag>
              <Tag style={{ background: 'rgba(82,196,26,0.3)', color: '#95de64', border: '1px solid rgba(82,196,26,0.4)', borderRadius: 20, padding: '2px 12px' }}>
                🟢 Trực tuyến
              </Tag>
            </Space>
            <Text style={{ display: 'block', marginTop: 8, color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
              <MailOutlined style={{ marginRight: 6 }} />{displayEmail}
            </Text>
          </div>
          <Space direction="vertical" size={8}>
            <Button
              size="large"
              icon={editMode ? <SaveOutlined /> : <EditOutlined />}
              style={{ background: 'white', color: '#1677ff', border: 'none', fontWeight: 600, borderRadius: 10 }}
              onClick={() => editMode ? form.submit() : setEditMode(true)}
              loading={saving}
            >
              {editMode ? 'Lưu thay đổi' : 'Chỉnh sửa'}
            </Button>
            <Button
              size="large"
              icon={<LockOutlined />}
              style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 10 }}
              onClick={() => setPwdModal(true)}
            >
              Đổi mật khẩu
            </Button>
          </Space>
        </div>
      </div>

      <Row gutter={[20, 20]}>
        {/* Profile Form */}
        <Col xs={24} lg={16}>
          <Card
            title={<Text strong style={{ fontSize: 15 }}>👤 Thông Tin Cá Nhân</Text>}
            style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}
          >
            <Form form={form} layout="vertical" onFinish={handleSave}>
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item name="fullName" label="Họ và Tên" rules={[{ required: true }]}>
                    <Input
                      prefix={<UserOutlined style={{ color: '#1677ff' }} />}
                      disabled={!editMode}
                      size="large"
                      style={{ borderRadius: 10, background: editMode ? '#fff' : '#fafafa' }}
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name="email" label="Email">
                    <Input
                      prefix={<MailOutlined style={{ color: '#1677ff' }} />}
                      disabled={!editMode}
                      size="large"
                      style={{ borderRadius: 10, background: editMode ? '#fff' : '#fafafa' }}
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name="phone" label="Số Điện Thoại">
                    <Input
                      prefix={<PhoneOutlined style={{ color: '#1677ff' }} />}
                      disabled={!editMode}
                      size="large"
                      placeholder="Chưa cập nhật"
                      style={{ borderRadius: 10, background: editMode ? '#fff' : '#fafafa' }}
                    />
                  </Form.Item>
                </Col>
              </Row>
              {editMode && (
                <Space>
                  <Button type="primary" htmlType="submit" size="large" icon={<SaveOutlined />} loading={saving} style={{ borderRadius: 10 }}>
                    Lưu thay đổi
                  </Button>
                  <Button size="large" onClick={() => setEditMode(false)} style={{ borderRadius: 10 }}>Hủy</Button>
                </Space>
              )}
            </Form>
          </Card>
        </Col>

        {/* Activity sidebar */}
        <Col xs={24} lg={8}>
          <Card
            title={<Text strong style={{ fontSize: 15 }}>📊 Thông Tin Tài Khoản</Text>}
            style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', marginBottom: 16 }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {activities.map(a => (
                <div key={a.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f8faff', borderRadius: 10 }}>
                  <Text type="secondary" style={{ fontSize: 13 }}>{a.icon} {a.label}</Text>
                  <Text strong style={{ fontSize: 13 }}>{a.value}</Text>
                </div>
              ))}
            </Space>
          </Card>

          <Card
            title={<Text strong style={{ fontSize: 15 }}>🔐 Bảo Mật</Text>}
            style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ padding: '12px 14px', background: '#f6ffed', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 16 }} />
                <Text style={{ fontSize: 13 }}>Tài khoản đã được xác thực</Text>
              </div>
              <Button block icon={<LockOutlined />} onClick={() => setPwdModal(true)} style={{ borderRadius: 10, height: 44 }}>
                Thay Đổi Mật Khẩu
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Change Password Modal */}
      <Modal
        title={<Space><LockOutlined style={{ color: '#1677ff' }} />Đổi Mật Khẩu</Space>}
        open={pwdModal}
        onCancel={() => { setPwdModal(false); pwdForm.resetFields(); }}
        onOk={() => pwdForm.submit()}
        okText="Đổi mật khẩu"
        cancelText="Hủy"
      >
        <Form form={pwdForm} layout="vertical" onFinish={handleChangePwd}>
          <Form.Item name="currentPassword" label="Mật khẩu hiện tại" rules={[{ required: true }]}>
            <Input.Password size="large" style={{ borderRadius: 10 }} />
          </Form.Item>
          <Form.Item name="newPassword" label="Mật khẩu mới" rules={[{ required: true, min: 6 }]}>
            <Input.Password size="large" style={{ borderRadius: 10 }} />
          </Form.Item>
          <Form.Item name="confirmPassword" label="Xác nhận mật khẩu mới" rules={[{ required: true }]}>
            <Input.Password size="large" style={{ borderRadius: 10 }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProfilePage;

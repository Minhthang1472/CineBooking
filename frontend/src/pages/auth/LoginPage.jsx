import React, { useState } from 'react';
import { Form, Input, Button, Typography, message, Checkbox, Divider } from 'antd';
import { MailOutlined, LockOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const { Title, Text } = Typography;
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5262';

const LoginPage = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/api/Auth/login`, {
        email: values.email,
        password: values.password
      });

      const token = res.data.token;
      const decodedToken = jwtDecode(token);

      const realName = decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name']
        || decodedToken.name || decodedToken.FullName || 'Người dùng ẩn danh';

      const realRole = decodedToken['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']
        || decodedToken.role || decodedToken.Role || 'Nhân viên';

      setAuth(token, { name: realName, role: realRole });
      message.success('Đăng nhập thành công!');
      navigate('/admin/dashboard');

    } catch (error) {
      console.error(error);
      message.error('Sai email hoặc mật khẩu, vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      {/* --- LEFT PANEL: Hotel Brand --- */}
      <div
        style={{
          flex: 1,
          display: 'none',
          backgroundImage: 'url(https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1920&auto=format&fit=crop)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
        className="login-left-panel"
      >
        {/* Overlay gradient */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, rgba(0,21,41,0.75) 0%, rgba(22,119,255,0.5) 100%)' }} />

        {/* Brand content */}
        <div style={{ position: 'relative', zIndex: 2, padding: '48px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '42px', height: '42px', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '20px', border: '1px solid rgba(255,255,255,0.3)' }}>
              36
            </div>
            <Text style={{ color: 'white', fontSize: '20px', fontWeight: 700 }}>ThirtySix ERP</Text>
          </div>

          <div>
            <Title level={1} style={{ color: 'white', fontWeight: 800, lineHeight: 1.2, marginBottom: '16px', fontSize: '42px' }}>
              Quản lý khách sạn theo tiêu chuẩn hiện đại
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '16px', lineHeight: 1.7 }}>
              Nền tảng quản trị tập trung — đặt phòng, nhân sự, kho vật tư và doanh thu — tất cả trong một bảng điều khiển duy nhất.
            </Text>

            <div style={{ display: 'flex', gap: '24px', marginTop: '32px' }}>
              {[{ num: '48+', label: 'Phòng' }, { num: '99%', label: 'Uptime' }, { num: '24/7', label: 'Hỗ trợ' }].map(item => (
                <div key={item.label} style={{ textAlign: 'center' }}>
                  <div style={{ color: 'white', fontSize: '22px', fontWeight: 800 }}>{item.num}</div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* --- RIGHT PANEL: Login Form --- */}
      <div style={{ width: '100%', maxWidth: '520px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 40px', background: '#fff' }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          {/* Mobile logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px' }}>
            <div style={{ width: '38px', height: '38px', background: 'linear-gradient(135deg, #1677ff 0%, #0958d9 100%)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '18px', boxShadow: '0 4px 12px rgba(22,119,255,0.3)' }}>
              36
            </div>
            <Text style={{ fontSize: '18px', fontWeight: 700, color: '#111827' }}>ThirtySix ERP</Text>
          </div>

          <Title level={2} style={{ margin: '0 0 8px 0', fontWeight: 700, color: '#111827', fontSize: '28px' }}>
            Đăng nhập vào hệ thống
          </Title>
          <Text type="secondary" style={{ fontSize: '15px', display: 'block', marginBottom: '36px' }}>
            Nhập thông tin tài khoản của bạn để tiếp tục.
          </Text>

          <Form name="login_form" onFinish={onFinish} size="large" layout="vertical">
            <Form.Item
              name="email"
              label={<Text strong style={{ color: '#374151' }}>Địa chỉ Email</Text>}
              rules={[
                { required: true, message: 'Vui lòng nhập Email!' },
                { type: 'email', message: 'Email không đúng định dạng!' }
              ]}
            >
              <Input
                prefix={<MailOutlined style={{ color: '#9ca3af' }} />}
                placeholder="admin@hotel.com"
                style={{ borderRadius: '10px', padding: '12px 14px' }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              label={<Text strong style={{ color: '#374151' }}>Mật khẩu</Text>}
              rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#9ca3af' }} />}
                placeholder="••••••••"
                style={{ borderRadius: '10px', padding: '12px 14px' }}
              />
            </Form.Item>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox>Ghi nhớ đăng nhập</Checkbox>
              </Form.Item>
              <a style={{ color: '#1677ff', fontSize: '14px' }} href="#">Quên mật khẩu?</a>
            </div>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                icon={<ArrowRightOutlined />}
                iconPosition="end"
                style={{
                  height: '50px',
                  fontSize: '16px',
                  fontWeight: 600,
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #1677ff, #0958d9)',
                  border: 'none',
                  boxShadow: '0 4px 14px rgba(22, 119, 255, 0.35)',
                }}
              >
                Đăng nhập ngay
              </Button>
            </Form.Item>

            <Divider plain>
              <Text type="secondary" style={{ fontSize: '13px' }}>Bạn chưa có tài khoản?</Text>
            </Divider>

            <Link to="/register">
              <Button block style={{ height: '44px', borderRadius: '12px', fontWeight: 500 }}>
                Tạo tài khoản mới
              </Button>
            </Link>
          </Form>
        </div>
      </div>

      {/* CSS for responsive left panel */}
      <style>{`
        @media (min-width: 768px) {
          .login-left-panel { display: block !important; }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
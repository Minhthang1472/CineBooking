import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, message, Checkbox } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const { Title, Text } = Typography;
const API = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5262'}/api`;

const RegisterPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/Auth/register`, {
        fullName: values.fullName,
        phone: values.phone,
        email: values.email,
        password: values.password,
      });
      message.success(response.data.message || response.data.Message || 'Đăng ký thành công! Vui lòng đăng nhập.');
      navigate('/login');
    } catch (error) {
      const responseData = error.response?.data;
      const validationMessage = responseData?.errors
        ? Object.values(responseData.errors).flat()[0]
        : null;
      message.error(responseData?.message || responseData?.Message || validationMessage ||
        'Đăng ký thất bại. Vui lòng kiểm tra thông tin và thử lại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      backgroundImage: 'url(https://images.unsplash.com/photo-1542314831-c6a4d27ce6a2?q=80&w=1920&auto=format&fit=crop)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)' }}></div>

      <Card style={{ 
        width: 500, 
        zIndex: 1, 
        borderRadius: '12px', 
        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
        padding: '10px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={2} style={{ color: '#1890ff', margin: 0, letterSpacing: '1px' }}>TẠO TÀI KHOẢN</Title>
          <Text type="secondary">Trải nghiệm dịch vụ đẳng cấp cùng Hotel ERP</Text>
        </div>

        <Form name="register_form" onFinish={onFinish} size="large" layout="vertical">
          <Form.Item 
            name="fullName" 
            rules={[{ required: true, message: 'Vui lòng nhập Họ và tên!' }]}
          >
            <Input prefix={<UserOutlined style={{ color: '#bfbfbf' }} />} placeholder="Họ và tên (VD: Võ Trần Minh Thắng)" />
          </Form.Item>

          <Form.Item 
            name="phone" 
            rules={[
              { required: true, message: 'Vui lòng nhập Số điện thoại!' },
              { pattern: /^[0-9]{10}$/, message: 'Số điện thoại phải gồm 10 chữ số!' }
            ]}
          >
            <Input prefix={<PhoneOutlined style={{ color: '#bfbfbf' }} />} placeholder="Số điện thoại liên hệ" />
          </Form.Item>

          <Form.Item 
            name="email" 
            rules={[
              { required: true, message: 'Vui lòng nhập Email!' },
              { type: 'email', message: 'Email không đúng định dạng!' }
            ]}
          >
            <Input prefix={<MailOutlined style={{ color: '#bfbfbf' }} />} placeholder="Địa chỉ Email" />
          </Form.Item>

          <Form.Item 
            name="password" 
            rules={[
              { required: true, message: 'Vui lòng nhập Mật khẩu!' },
              { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' }
            ]}
          >
            <Input.Password prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} placeholder="Mật khẩu" />
          </Form.Item>

          <Form.Item 
            name="confirmPassword" 
            dependencies={['password']}
            rules={[
              { required: true, message: 'Vui lòng xác nhận lại Mật khẩu!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} placeholder="Xác nhận lại mật khẩu" />
          </Form.Item>

          <Form.Item 
            name="agreement" 
            valuePropName="checked"
            rules={[
              { validator: (_, value) => value ? Promise.resolve() : Promise.reject(new Error('Bạn phải đồng ý với điều khoản dịch vụ!')) }
            ]}
          >
            <Checkbox>
              Tôi đã đọc và đồng ý với <a href="#">Điều khoản dịch vụ</a> và <a href="#">Chính sách bảo mật</a>
            </Checkbox>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block style={{ height: '45px', fontSize: '16px', fontWeight: '500' }}>
              ĐĂNG KÝ
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            <Text type="secondary">Đã có tài khoản? </Text>
            <Link to="/login" style={{ fontWeight: 'bold' }}>Đăng nhập ngay</Link>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default RegisterPage;
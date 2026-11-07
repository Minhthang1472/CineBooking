import React, { useState } from 'react';
import { message } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import {
  MailOutlined, LockOutlined, UserOutlined, PhoneOutlined, EyeOutlined, EyeInvisibleOutlined
} from '@ant-design/icons';

const GOLD = '#C9A84C';
const DARK = '#0D1B2A';
const API = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5262'}/api`;

// ✅ Đặt InputField NGOÀI component để tránh re-mount mỗi lần render
const inputStyle = {
  width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 10,
  padding: '12px 14px 12px 44px', fontSize: 15, outline: 'none',
  boxSizing: 'border-box', background: '#fff', transition: 'border-color 0.2s',
  fontFamily: 'inherit',
};

function InputField({ icon: Icon, placeholder, type = 'text', value, onChange, rightIcon, onFocus, onBlur }) {
  return (
    <div style={{ position: 'relative' }}>
      <Icon style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 16 }} />
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        style={inputStyle}
        onFocus={e => { e.target.style.borderColor = GOLD; onFocus && onFocus(e); }}
        onBlur={e => { e.target.style.borderColor = '#e5e7eb'; onBlur && onBlur(e); }}
      />
      {rightIcon && (
        <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#9ca3af' }}>
          {rightIcon}
        </span>
      )}
    </div>
  );
}

export default function WebsiteLoginPage() {
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const setAuth = useAuthStore(s => s.setAuth);
  const navigate = useNavigate();

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [regForm, setRegForm] = useState({ fullName: '', phone: '', email: '', password: '', confirmPassword: '' });

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginForm.email || !loginForm.password) {
      message.error('Vui lòng nhập đầy đủ thông tin!');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API}/Auth/login`, {
        email: loginForm.email,
        password: loginForm.password,
      });
      const token = res.data.token;
      const decoded = jwtDecode(token);
      const realName = decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || decoded.name || 'Khách';
      const realRole = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || decoded.role || 'Guest';
      const realEmail = decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || decoded.email || '';
      const realId = parseInt(
        decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ||
        decoded.sub || decoded.nameid || '0'
      );
      setAuth(token, { id: realId, name: realName, role: realRole, email: realEmail });
      message.success('Đăng nhập thành công! Chào mừng trở lại.');
      if (realRole !== 'Guest' && realRole !== 'guest') {
        navigate('/admin/dashboard');
      } else {
        navigate('/');
      }
    } catch {
      message.error('Email hoặc mật khẩu không đúng. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!regForm.fullName || !regForm.email || !regForm.password || !regForm.phone) {
      message.error('Vui lòng điền đầy đủ thông tin!');
      return;
    }
    if (regForm.password !== regForm.confirmPassword) {
      message.error('Mật khẩu xác nhận không khớp!');
      return;
    }
    if (regForm.password.length < 6) {
      message.error('Mật khẩu phải có ít nhất 6 ký tự!');
      return;
    }
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(regForm.phone)) {
      message.error('Số điện thoại phải gồm 10 chữ số!');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API}/Auth/register`, {
        fullName: regForm.fullName,
        phone: regForm.phone,
        email: regForm.email,
        password: regForm.password,
      });
      message.success('Đăng ký thành công! Vui lòng đăng nhập để tiếp tục.');
      setMode('login');
      setLoginForm({ email: regForm.email, password: '' });
    } catch (err) {
      const responseData = err.response?.data;
      const validationMessage = responseData?.errors
        ? Object.values(responseData.errors).flat()[0]
        : null;
      const errMsg = responseData?.message || responseData?.Message || validationMessage ||
        'Đăng ký thất bại. Vui lòng kiểm tra thông tin và thử lại!';
      message.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Left panel */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'none' }} className="auth-left">
        <img src="https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=1920&auto=format&fit=crop" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, rgba(13,27,42,0.85) 0%, rgba(13,27,42,0.6) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', padding: 48, justifyContent: 'space-between' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: `linear-gradient(135deg, ${GOLD}, #E8C96B)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18, color: DARK }}>36</div>
            <div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 18, letterSpacing: '1px' }}>THIRTYSIX</div>
              <div style={{ color: GOLD, fontSize: 10, letterSpacing: '3px' }}>RESORT & SPA</div>
            </div>
          </Link>
          <div>
            <h1 style={{ color: '#fff', fontSize: 40, fontWeight: 800, lineHeight: 1.2, marginBottom: 16 }}>
              Kỳ Nghỉ Hoàn Hảo<br />Bắt Đầu Từ Đây
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 16, lineHeight: 1.8, marginBottom: 32 }}>
              Đăng nhập để quản lý đặt phòng, xem hóa đơn và trải nghiệm dịch vụ cá nhân hóa dành riêng cho bạn.
            </p>
            <div style={{ display: 'flex', gap: 24 }}>
              {[{ num: '36+', label: 'Phòng & Villa' }, { num: '98%', label: 'Hài Lòng' }, { num: '24/7', label: 'Hỗ Trợ' }].map(s => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <div style={{ color: GOLD, fontSize: 24, fontWeight: 800 }}>{s.num}</div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div style={{ width: '100%', maxWidth: 520, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 40px', background: '#fff', minHeight: '100vh' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          {/* Mobile logo */}
          <div className="mobile-logo" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36 }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
              <div style={{ width: 38, height: 38, borderRadius: 8, background: `linear-gradient(135deg, ${GOLD}, #E8C96B)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 17, color: DARK }}>36</div>
              <div>
                <div style={{ color: DARK, fontWeight: 800, fontSize: 16, letterSpacing: '0.5px' }}>THIRTYSIX</div>
                <div style={{ color: GOLD, fontSize: 9, letterSpacing: '2px' }}>RESORT & SPA</div>
              </div>
            </Link>
          </div>

          {/* Tab toggle */}
          <div style={{ display: 'flex', background: '#f9fafb', borderRadius: 12, padding: 4, marginBottom: 32 }}>
            {['login', 'register'].map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                flex: 1, padding: '10px', border: 'none', borderRadius: 9, cursor: 'pointer', fontSize: 15, fontWeight: 700, transition: 'all 0.2s',
                background: mode === m ? '#fff' : 'transparent',
                color: mode === m ? DARK : '#9ca3af',
                boxShadow: mode === m ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
              }}>
                {m === 'login' ? 'Đăng Nhập' : 'Đăng Ký'}
              </button>
            ))}
          </div>

          {/* LOGIN */}
          {mode === 'login' && (
            <form onSubmit={handleLogin}>
              <h2 style={{ margin: '0 0 6px', fontSize: 26, fontWeight: 800, color: DARK }}>Chào Mừng Trở Lại</h2>
              <p style={{ color: '#6b7280', fontSize: 14, margin: '0 0 28px' }}>Đăng nhập vào tài khoản của bạn</p>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 7, letterSpacing: '0.5px' }}>EMAIL</label>
                <InputField
                  icon={MailOutlined}
                  type="email"
                  placeholder="email@example.com"
                  value={loginForm.email}
                  onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div style={{ marginBottom: 8 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 7, letterSpacing: '0.5px' }}>MẬT KHẨU</label>
                <InputField
                  icon={LockOutlined}
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={loginForm.password}
                  onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                  rightIcon={<span onClick={() => setShowPw(s => !s)}>{showPw ? <EyeInvisibleOutlined /> : <EyeOutlined />}</span>}
                />
              </div>
              <div style={{ textAlign: 'right', marginBottom: 24 }}>
                <a href="#" style={{ color: GOLD, fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>Quên mật khẩu?</a>
              </div>
              <button type="submit" disabled={loading} style={{
                width: '100%', background: `linear-gradient(135deg, ${GOLD}, #E8C96B)`,
                border: 'none', borderRadius: 12, padding: '15px', color: DARK,
                fontWeight: 800, fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 6px 20px rgba(201,168,76,0.4)', letterSpacing: '0.5px', marginBottom: 20,
              }}>
                {loading ? 'Đang đăng nhập...' : 'Đăng Nhập Ngay →'}
              </button>

              <div style={{ textAlign: 'center', fontSize: 14, color: '#6b7280' }}>
                Chưa có tài khoản?{' '}
                <span onClick={() => setMode('register')} style={{ color: GOLD, fontWeight: 700, cursor: 'pointer' }}>Đăng Ký Ngay</span>
              </div>
            </form>
          )}

          {/* REGISTER */}
          {mode === 'register' && (
            <form onSubmit={handleRegister}>
              <h2 style={{ margin: '0 0 6px', fontSize: 26, fontWeight: 800, color: DARK }}>Tạo Tài Khoản Mới</h2>
              <p style={{ color: '#6b7280', fontSize: 14, margin: '0 0 24px' }}>Đăng ký để nhận ưu đãi độc quyền</p>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 7, letterSpacing: '0.5px' }}>HỌ VÀ TÊN</label>
                <InputField icon={UserOutlined} type="text" placeholder="Nhập họ và tên đầy đủ"
                  value={regForm.fullName} onChange={e => setRegForm(f => ({ ...f, fullName: e.target.value }))} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 7, letterSpacing: '0.5px' }}>SỐ ĐIỆN THOẠI</label>
                <InputField icon={PhoneOutlined} type="tel" placeholder="0900 xxx xxx"
                  value={regForm.phone} onChange={e => setRegForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 7, letterSpacing: '0.5px' }}>EMAIL</label>
                <InputField icon={MailOutlined} type="email" placeholder="email@example.com"
                  value={regForm.email} onChange={e => setRegForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 7, letterSpacing: '0.5px' }}>MẬT KHẨU</label>
                <InputField icon={LockOutlined} type={showPw ? 'text' : 'password'} placeholder="Ít nhất 6 ký tự"
                  value={regForm.password} onChange={e => setRegForm(f => ({ ...f, password: e.target.value }))}
                  rightIcon={<span onClick={() => setShowPw(s => !s)}>{showPw ? <EyeInvisibleOutlined /> : <EyeOutlined />}</span>} />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 7, letterSpacing: '0.5px' }}>XÁC NHẬN MẬT KHẨU</label>
                <InputField icon={LockOutlined} type={showConfirmPw ? 'text' : 'password'} placeholder="Nhập lại mật khẩu"
                  value={regForm.confirmPassword} onChange={e => setRegForm(f => ({ ...f, confirmPassword: e.target.value }))}
                  rightIcon={<span onClick={() => setShowConfirmPw(s => !s)}>{showConfirmPw ? <EyeInvisibleOutlined /> : <EyeOutlined />}</span>} />
              </div>

              <button type="submit" disabled={loading} style={{
                width: '100%', background: `linear-gradient(135deg, ${GOLD}, #E8C96B)`,
                border: 'none', borderRadius: 12, padding: '15px', color: DARK,
                fontWeight: 800, fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 6px 20px rgba(201,168,76,0.4)', letterSpacing: '0.5px', marginBottom: 20,
              }}>
                {loading ? 'Đang đăng ký...' : 'Tạo Tài Khoản →'}
              </button>

              <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', margin: '0 0 16px', lineHeight: 1.6 }}>
                Bằng cách đăng ký, bạn đồng ý với <a href="#" style={{ color: GOLD }}>Điều khoản dịch vụ</a> và <a href="#" style={{ color: GOLD }}>Chính sách bảo mật</a>
              </p>

              <div style={{ textAlign: 'center', fontSize: 14, color: '#6b7280' }}>
                Đã có tài khoản?{' '}
                <span onClick={() => setMode('login')} style={{ color: GOLD, fontWeight: 700, cursor: 'pointer' }}>Đăng Nhập Ngay</span>
              </div>
            </form>
          )}
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .auth-left { display: block !important; }
          .mobile-logo { display: none !important; }
        }
      `}</style>
    </div>
  );
}

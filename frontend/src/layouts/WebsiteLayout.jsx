import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Dropdown, message } from 'antd';
import {
  UserOutlined, MenuOutlined, CloseOutlined, PhoneOutlined,
  MailOutlined, FacebookOutlined, InstagramOutlined
} from '@ant-design/icons';
import { Outlet } from 'react-router-dom';

const GOLD = '#C9A84C';
const DARK = '#0D1B2A';
const CREAM = '#FAF7F2';

const navLinks = [
  { label: 'Trang Chủ', to: '/' },
  { label: 'Phòng & Villa', to: '/rooms' },
  { label: 'Dịch Vụ', to: '/services' },
  { label: 'Khuyến Mãi', to: '/promotions' },
  { label: 'Đánh Giá', to: '/reviews' },
  { label: 'Tin Tức', to: '/news' },
  { label: 'Địa Điểm', to: '/attractions' },
];

export default function WebsiteLayout() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { token, user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => {
    clearAuth();
    message.success('Đã đăng xuất thành công!');
    navigate('/');
  };

  const userMenuItems = [
    { key: 'bookings', label: <Link to="/my-bookings">Đặt phòng của tôi</Link> },
    { key: 'profile', label: <Link to="/profile">Hồ sơ tài khoản</Link> },
    ...(user?.role && user.role !== 'Guest' ? [{ key: 'admin', label: <Link to="/admin/dashboard">Trang quản trị</Link> }] : []),
    { type: 'divider' },
    { key: 'logout', label: <span style={{ color: '#ef4444' }} onClick={handleLogout}>Đăng xuất</span> },
  ];

  const navBg = isHome
    ? scrolled ? DARK : 'transparent'
    : DARK;

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: CREAM, minHeight: '100vh' }}>
      {/* ===== NAVBAR ===== */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        background: navBg,
        backdropFilter: scrolled || !isHome ? 'blur(12px)' : 'none',
        borderBottom: scrolled || !isHome ? '1px solid rgba(201,168,76,0.2)' : 'none',
        transition: 'all 0.35s ease',
        padding: '0 5vw',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 72 }}>
          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
            <div style={{
              width: 42, height: 42, borderRadius: 8,
              background: `linear-gradient(135deg, ${GOLD}, #E8C96B)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: 18, color: DARK, letterSpacing: '-1px',
              boxShadow: '0 4px 14px rgba(201,168,76,0.4)',
            }}>36</div>
            <div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 18, lineHeight: 1, letterSpacing: '1px' }}>THIRTYSIX</div>
              <div style={{ color: GOLD, fontSize: 10, letterSpacing: '3px', fontWeight: 500 }}>RESORT & SPA</div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 36 }} className="desktop-nav">
            {navLinks.map(link => (
              <Link key={link.to} to={link.to} style={{
                color: location.pathname === link.to ? GOLD : 'rgba(255,255,255,0.85)',
                textDecoration: 'none', fontWeight: 500, fontSize: 14, letterSpacing: '0.5px',
                borderBottom: location.pathname === link.to ? `2px solid ${GOLD}` : '2px solid transparent',
                paddingBottom: 2, transition: 'all 0.2s',
              }}>
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }} className="desktop-nav">
            {token && user ? (
              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
                <button style={{
                  display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                  background: 'rgba(255,255,255,0.1)', border: `1px solid rgba(201,168,76,0.4)`,
                  borderRadius: 8, padding: '8px 16px', color: '#fff', fontSize: 14,
                  backdropFilter: 'blur(8px)',
                }}>
                  <UserOutlined style={{ color: GOLD }} />
                  {user.name}
                </button>
              </Dropdown>
            ) : (
              <Link to="/website-login">
                <button style={{
                  background: `linear-gradient(135deg, ${GOLD}, #E8C96B)`,
                  border: 'none', borderRadius: 8, padding: '10px 22px',
                  color: DARK, fontWeight: 700, fontSize: 14, cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(201,168,76,0.35)', letterSpacing: '0.5px',
                }}>Đăng Nhập</button>
              </Link>
            )}
            <Link to="/rooms">
              <button style={{
                background: 'transparent', border: `1px solid ${GOLD}`,
                borderRadius: 8, padding: '9px 20px',
                color: GOLD, fontWeight: 600, fontSize: 14, cursor: 'pointer',
              }}>Đặt Phòng Ngay</button>
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="mobile-menu-btn"
            onClick={() => setMenuOpen(o => !o)}
            style={{ background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer', display: 'none' }}
          >
            {menuOpen ? <CloseOutlined /> : <MenuOutlined />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div style={{ background: DARK, padding: '12px 24px 24px', borderTop: `1px solid rgba(201,168,76,0.2)` }}>
            {navLinks.map(link => (
              <Link key={link.to} to={link.to} onClick={() => setMenuOpen(false)} style={{
                display: 'block', color: 'rgba(255,255,255,0.85)', textDecoration: 'none',
                fontWeight: 500, fontSize: 15, padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.07)',
              }}>{link.label}</Link>
            ))}
            <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
              {token ? (
                <button onClick={handleLogout} style={{ flex: 1, background: '#ef4444', border: 'none', borderRadius: 8, padding: '12px', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Đăng Xuất</button>
              ) : (
                <Link to="/website-login" onClick={() => setMenuOpen(false)} style={{ flex: 1 }}>
                  <button style={{ width: '100%', background: `linear-gradient(135deg, ${GOLD}, #E8C96B)`, border: 'none', borderRadius: 8, padding: '12px', color: DARK, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Đăng Nhập</button>
                </Link>
              )}
              <Link to="/rooms" onClick={() => setMenuOpen(false)} style={{ flex: 1 }}>
                <button style={{ width: '100%', background: 'transparent', border: `1px solid ${GOLD}`, borderRadius: 8, padding: '12px', color: GOLD, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Đặt Phòng</button>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ===== PAGE CONTENT ===== */}
      <main>
        <Outlet />
      </main>

      {/* ===== FOOTER ===== */}
      <footer style={{ background: DARK, color: 'rgba(255,255,255,0.7)', paddingTop: 60 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 5vw' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 40, paddingBottom: 48, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            {/* Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: `linear-gradient(135deg, ${GOLD}, #E8C96B)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 17, color: DARK }}>36</div>
                <div>
                  <div style={{ color: '#fff', fontWeight: 800, fontSize: 17, letterSpacing: '1px' }}>THIRTYSIX</div>
                  <div style={{ color: GOLD, fontSize: 10, letterSpacing: '3px' }}>RESORT & SPA</div>
                </div>
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.8, marginBottom: 20 }}>
                Thiên đường nghỉ dưỡng đẳng cấp với không gian xanh mát, dịch vụ tận tâm và những trải nghiệm khó quên.
              </p>
              <div style={{ display: 'flex', gap: 12 }}>
                {[FacebookOutlined, InstagramOutlined].map((Icon, i) => (
                  <button key={i} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: `1px solid rgba(201,168,76,0.3)`, color: GOLD, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                    <Icon />
                  </button>
                ))}
              </div>
            </div>

            {/* Links */}
            <div>
              <h4 style={{ color: '#fff', fontSize: 14, letterSpacing: '2px', fontWeight: 700, marginBottom: 20 }}>KHÁM PHÁ</h4>
              {[
                { label: 'Trang Chủ', to: '/' },
                { label: 'Phòng & Villa', to: '/rooms' },
                { label: 'Dịch Vụ', to: '/services' },
                { label: 'Khuyến Mãi & Voucher', to: '/promotions' },
                { label: 'Đánh Giá Khách Hàng', to: '/reviews' },
                { label: 'Tin Tức & Bài Viết', to: '/news' },
                { label: 'Địa Điểm Lân Cận', to: '/attractions' },
              ].map(l => (
                <Link key={l.to} to={l.to} style={{ display: 'block', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: 14, marginBottom: 10, transition: 'color 0.2s' }}
                  onMouseEnter={e => e.target.style.color = GOLD} onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.6)'}>
                  {l.label}
                </Link>
              ))}
            </div>

            {/* Policies */}
            <div>
              <h4 style={{ color: '#fff', fontSize: 14, letterSpacing: '2px', fontWeight: 700, marginBottom: 20 }}>CHÍNH SÁCH</h4>
              {['Chính Sách Đặt Phòng', 'Chính Sách Hủy Phòng', 'Điều Khoản Dịch Vụ', 'Bảo Mật Thông Tin'].map(t => (
                <a key={t} href="#" style={{ display: 'block', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: 14, marginBottom: 10 }}>{t}</a>
              ))}
            </div>

            {/* Contact */}
            <div>
              <h4 style={{ color: '#fff', fontSize: 14, letterSpacing: '2px', fontWeight: 700, marginBottom: 20 }}>LIÊN HỆ</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <PhoneOutlined style={{ color: GOLD, marginTop: 3 }} />
                  <div>
                    <div style={{ color: '#fff', fontSize: 14 }}>+84 900 360 360</div>
                    <div style={{ fontSize: 12 }}>Hỗ trợ 24/7</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <MailOutlined style={{ color: GOLD, marginTop: 3 }} />
                  <div>
                    <div style={{ color: '#fff', fontSize: 14 }}>contact@thirtysix.vn</div>
                    <div style={{ fontSize: 12 }}>Phản hồi trong 2 giờ</div>
                  </div>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 1.6 }}>
                  36 Đường Biển Xanh, Phường An Mỹ, Quảng Nam, Việt Nam
                </div>
              </div>
            </div>
          </div>

          <div style={{ padding: '20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <span style={{ fontSize: 13 }}>© 2026 ThirtySix Resort & Spa. All rights reserved.</span>
            <span style={{ fontSize: 13, color: GOLD }}>Thiết kế với tất cả tình yêu</span>
          </div>
        </div>
      </footer>

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </div>
  );
}

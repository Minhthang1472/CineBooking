import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import { message, Modal } from 'antd';
import { bookingApi } from '../../api/bookingApi';
import axiosClient from '../../api/axiosClient';
import {
  UserOutlined, CalendarOutlined, CrownOutlined,
  CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined,
  StarFilled, EditOutlined, PhoneOutlined, MailOutlined,
} from '@ant-design/icons';

const GOLD = '#C9A84C';
const DARK = '#0D1B2A';

// Mapping dynamic — dùng tierName từ API làm key
const tierConfig = {
  'Khách Mới': { color: '#9ca3af', bg: '#f9fafb', icon: '👤', label: 'Khách Mới' },
  'Đồng':      { color: '#cd7f32', bg: '#fdf3e7', icon: '🥉', label: 'Đồng' },
  'Bạc':       { color: '#6b7280', bg: '#f3f4f6', icon: '🥈', label: 'Bạc' },
  'Vàng':       { color: '#C9A84C', bg: '#fef9ee', icon: '🥇', label: 'Vàng' },
  'Bạch Kim':  { color: '#8b5cf6', bg: '#f5f3ff', icon: '💎', label: 'Bạch Kim' },
  'Kim Cương': { color: '#06b6d4', bg: '#ecfeff', icon: '💊', label: 'Kim Cương' },
  'Elite':      { color: '#0ea5e9', bg: '#f0f9ff', icon: '⭐', label: 'Elite' },
  'VIP':        { color: '#f59e0b', bg: '#fffbeb', icon: '👑', label: 'VIP' },
  'VVIP':       { color: '#ef4444', bg: '#fef2f2', icon: '🔥', label: 'VVIP' },
  'Signature':  { color: '#0D1B2A', bg: '#f8fafc', icon: '✨', label: 'Signature' },
};
const getTierCfg = (name) => tierConfig[name] || { color: '#C9A84C', bg: '#fef9ee', icon: '🥇', label: name || 'Khách Mới' };

const statusMap = {
  Pending:    { label: 'Chờ Xác Nhận', color: '#f59e0b', bg: '#fef9ee', icon: <ClockCircleOutlined /> },
  Confirmed:  { label: 'Đã Xác Nhận',  color: '#10b981', bg: '#ecfdf5', icon: <CheckCircleOutlined /> },
  CheckedIn:  { label: 'Đang Lưu Trú', color: '#3b82f6', bg: '#eff6ff', icon: <CheckCircleOutlined /> },
  CheckedOut: { label: 'Đã Trả Phòng', color: '#6b7280', bg: '#f9fafb', icon: <CheckCircleOutlined /> },
  Cancelled:  { label: 'Đã Hủy',       color: '#ef4444', bg: '#fef2f2', icon: <CloseCircleOutlined /> },
};

export default function WebsiteProfilePage() {
  const { token, user, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [membership, setMembership] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [editModal, setEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ fullName: user?.name || '', phone: '', email: '' });
  const [saving, setSaving] = useState(false);
  const [userDetail, setUserDetail] = useState(null);

  useEffect(() => {
    if (!token) {
      message.info('Vui lòng đăng nhập để xem hồ sơ!');
      navigate('/website-login');
      return;
    }
    const userId = user?.id;
    if (!userId) { setLoading(false); return; }

    Promise.all([
      bookingApi.getByUser(userId).catch(() => ({ data: [] })),
      axiosClient.get('/Memberships').catch(() => ({ data: [] })),
    ]).then(([bRes, mRes]) => {
      const userBookings = Array.isArray(bRes.data) ? bRes.data : [];
      setBookings(userBookings);

      // Tính điểm thực tế: 500đ mỗi booking hoàn thành (CheckedOut/Confirmed), 100đ mỗi booking Pending
      const earnedPoints = userBookings.reduce((acc, b) => {
        if (b.status === 'CheckedOut') return acc + 500;
        if (b.status === 'Confirmed' || b.status === 'CheckedIn') return acc + 300;
        if (b.status === 'Pending') return acc + 100;
        return acc;
      }, 0);

      // Xếp hạng dựa trên điểm
      const memberships = Array.isArray(mRes.data) ? mRes.data : [];
      // Sắp xếp memberships theo minPoints giảm dần để tìm tier cao nhất phù hợp
      const sorted = [...memberships].sort((a, b) => (b.minPoints || 0) - (a.minPoints || 0));
      const matchedTier = sorted.find(m => earnedPoints >= (m.minPoints || 0));
      const defaultTier = memberships.find(m => m.minPoints === 0) || memberships[memberships.length - 1] || { tierName: 'Khách Mới', minPoints: 0, discountPercent: 0 };
      setMembership({ ...(matchedTier || defaultTier), earnedPoints });
    }).finally(() => setLoading(false));
  }, [token, user?.id]);


  const handleLogout = () => {
    clearAuth();
    message.success('Đã đăng xuất!');
    navigate('/');
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '—';

  const tier = getTierCfg(membership?.tierName);
  // Điểm tích lũy từ tính toán thực tế ở useEffect
  const points = membership?.earnedPoints || 0;


  const tabs = [
    { key: 'profile', label: 'Hồ Sơ', icon: <UserOutlined /> },
    { key: 'bookings', label: 'Đặt Phòng', icon: <CalendarOutlined /> },
    { key: 'membership', label: 'Thành Viên', icon: <CrownOutlined /> },
  ];

  return (
    <div style={{ paddingTop: 72, minHeight: '100vh', background: '#FAF7F2' }}>
      {/* Hero Header */}
      <section style={{ background: DARK, padding: '48px 5vw 80px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 300, height: 300, borderRadius: '50%', background: `radial-gradient(circle, ${GOLD}20, transparent 70%)` }} />
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap' }}>
          {/* Avatar */}
          <div style={{
            width: 88, height: 88, borderRadius: '50%',
            background: `linear-gradient(135deg, ${GOLD}, #E8C96B)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 36, fontWeight: 800, color: DARK,
            boxShadow: '0 8px 24px rgba(201,168,76,0.4)',
            border: '4px solid rgba(255,255,255,0.2)', flexShrink: 0,
          }}>
            {(user?.name || 'K')[0]}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, letterSpacing: '3px', color: GOLD, fontWeight: 700, marginBottom: 6 }}>HỒ SƠ THÀNH VIÊN</div>
            <h1 style={{ color: '#fff', fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 800, margin: '0 0 8px' }}>{user?.name || 'Khách Hàng'}</h1>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              {membership && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: tier.bg, color: tier.color,
                  borderRadius: 20, padding: '4px 14px', fontWeight: 700, fontSize: 13,
                  border: `1px solid ${tier.color}40`,
                }}>
                  {tier.icon} Thành viên {tier.label}
                </span>
              )}
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
                ✦ {points.toLocaleString('vi-VN')} điểm tích lũy
              </span>
            </div>
          </div>
          <button onClick={handleLogout} style={{
            background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)',
            borderRadius: 10, padding: '10px 20px', color: '#fca5a5',
            fontWeight: 600, fontSize: 14, cursor: 'pointer',
          }}>
            Đăng Xuất
          </button>
        </div>
      </section>

      {/* Tabs */}
      <div style={{ maxWidth: 1100, margin: '-40px auto 0', padding: '0 5vw', position: 'relative', zIndex: 10 }}>
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          {/* Tab bar */}
          <div style={{ display: 'flex', borderBottom: '1px solid #f0ebe0' }}>
            {tabs.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '16px', border: 'none', background: 'none', cursor: 'pointer',
                fontWeight: 700, fontSize: 14, transition: 'all 0.2s',
                color: activeTab === t.key ? GOLD : '#6b7280',
                borderBottom: activeTab === t.key ? `3px solid ${GOLD}` : '3px solid transparent',
              }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          <div style={{ padding: '32px 28px' }}>
            {/* ===== PROFILE TAB ===== */}
            {activeTab === 'profile' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: DARK }}>Thông Tin Cá Nhân</h3>
                  <button onClick={() => setEditModal(true)} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: '#f9fafb', border: '1.5px solid #e5e7eb',
                    borderRadius: 8, padding: '8px 16px', color: DARK,
                    fontWeight: 600, fontSize: 13, cursor: 'pointer',
                  }}>
                    <EditOutlined /> Chỉnh sửa
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                  {[
                    { icon: <UserOutlined />, label: 'Họ và Tên', value: user?.name || '—' },
                    { icon: <MailOutlined />, label: 'Email', value: user?.email || 'Chưa cập nhật' },
                    { icon: <PhoneOutlined />, label: 'Số Điện Thoại', value: 'Chưa cập nhật' },
                    { icon: <CrownOutlined />, label: 'Hạng Thành Viên', value: `${tier.icon} ${tier.label}` },
                    { icon: <StarFilled style={{ color: GOLD }} />, label: 'Điểm Tích Lũy', value: `${points.toLocaleString('vi-VN')} điểm` },
                    { icon: <CalendarOutlined />, label: 'Tổng Đặt Phòng', value: `${bookings.length} lần` },
                  ].map(item => (
                    <div key={item.label} style={{ background: '#f9fafb', borderRadius: 12, padding: '16px 20px', border: '1px solid #f0ebe0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, color: '#9ca3af', fontSize: 12, fontWeight: 600, letterSpacing: '0.5px' }}>
                        {item.icon} {item.label.toUpperCase()}
                      </div>
                      <div style={{ fontWeight: 700, color: DARK, fontSize: 15 }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ===== BOOKINGS TAB ===== */}
            {activeTab === 'bookings' && (
              <div>
                <h3 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700, color: DARK }}>Lịch Sử Đặt Phòng</h3>
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>Đang tải...</div>
                ) : bookings.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 0' }}>
                    <div style={{ fontSize: 56, marginBottom: 16 }}>🏨</div>
                    <h4 style={{ color: DARK, fontWeight: 700, marginBottom: 8 }}>Chưa có đặt phòng</h4>
                    <p style={{ color: '#6b7280', marginBottom: 24 }}>Hãy đặt phòng ngay để trải nghiệm kỳ nghỉ hoàn hảo!</p>
                    <a href="/rooms">
                      <button style={{ background: `linear-gradient(135deg, ${GOLD}, #E8C96B)`, border: 'none', borderRadius: 10, padding: '12px 28px', color: DARK, fontWeight: 700, cursor: 'pointer' }}>
                        Khám Phá Phòng
                      </button>
                    </a>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {bookings.map(b => {
                      const st = statusMap[b.status] || statusMap.Pending;
                      const detail = b.bookingDetails?.[0];
                      return (
                        <div key={b.id} style={{ background: '#f9fafb', borderRadius: 12, padding: '18px 20px', border: '1px solid #f0ebe0' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                            <div>
                              <div style={{ fontSize: 11, color: '#9ca3af', letterSpacing: '1px', marginBottom: 4 }}>MÃ ĐẶT PHÒNG</div>
                              <div style={{ fontSize: 16, fontWeight: 800, color: DARK }}>{b.bookingCode}</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: st.bg, color: st.color, borderRadius: 8, padding: '5px 12px', fontWeight: 600, fontSize: 12 }}>
                              {st.icon} {st.label}
                            </div>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginTop: 14, paddingTop: 14, borderTop: '1px solid #e5e7eb' }}>
                            <div>
                              <div style={{ fontSize: 10, color: '#9ca3af', letterSpacing: '1px' }}>LOẠI PHÒNG</div>
                              <div style={{ fontWeight: 600, color: DARK, fontSize: 13 }}>{detail?.roomTypeName || '—'}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: 10, color: '#9ca3af', letterSpacing: '1px' }}>NHẬN PHÒNG</div>
                              <div style={{ fontWeight: 600, color: DARK, fontSize: 13 }}>{formatDate(detail?.checkInDate)}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: 10, color: '#9ca3af', letterSpacing: '1px' }}>TRẢ PHÒNG</div>
                              <div style={{ fontWeight: 600, color: DARK, fontSize: 13 }}>{formatDate(detail?.checkOutDate)}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: 10, color: '#9ca3af', letterSpacing: '1px' }}>TẠM TÍNH</div>
                              <div style={{ fontWeight: 700, color: GOLD, fontSize: 13 }}>{(detail?.subtotal || 0).toLocaleString('vi-VN')} ₫</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ===== MEMBERSHIP TAB ===== */}
            {activeTab === 'membership' && (
              <div>
                <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700, color: DARK }}>Chương Trình Thành Viên</h3>
                <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 28 }}>Tích lũy điểm từ mỗi lần đặt phòng để nâng cấp hạng và nhận ưu đãi đặc biệt.</p>

                {/* Current tier card */}
                <div style={{
                  background: tier.bg, border: `2px solid ${tier.color}40`,
                  borderRadius: 16, padding: '24px 28px', marginBottom: 28,
                  display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap',
                }}>
                  <div style={{ fontSize: 56 }}>{tier.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: tier.color, fontWeight: 700, letterSpacing: '1px', marginBottom: 4 }}>HẠNG HIỆN TẠI</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: DARK, marginBottom: 4 }}>Thành viên {tier.label}</div>
                    <div style={{ color: '#6b7280', fontSize: 14 }}>
                      Điểm tích lũy: <strong style={{ color: tier.color }}>{points.toLocaleString('vi-VN')} điểm</strong>
                      {membership?.discountPercent > 0 && (
                        <span style={{ marginLeft: 12, display: 'inline-flex', alignItems: 'center', gap: 4, background: `${tier.color}18`, borderRadius: 6, padding: '2px 10px', color: tier.color, fontWeight: 700, fontSize: 13 }}>
                          🎁 Giảm {membership.discountPercent}% mọi đặt phòng
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tier comparison — lấy từ API memberships */}
                <h4 style={{ margin: '0 0 16px', color: DARK, fontWeight: 700 }}>Tất Cả Hạng Thành Viên</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
                  {Object.entries(tierConfig).map(([key, cfg]) => (
                    <div key={key} style={{
                      borderRadius: 14, padding: '16px 14px', textAlign: 'center',
                      border: membership?.tierName === key ? `2px solid ${cfg.color}` : '1.5px solid #e5e7eb',
                      background: membership?.tierName === key ? cfg.bg : '#fff',
                      position: 'relative',
                    }}>
                      {membership?.tierName === key && (
                        <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: cfg.color, color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 10, padding: '2px 10px', whiteSpace: 'nowrap' }}>
                          ✓ Hạng của bạn
                        </div>
                      )}
                      <div style={{ fontSize: 30, marginBottom: 6 }}>{cfg.icon}</div>
                      <div style={{ fontWeight: 800, color: cfg.color, fontSize: 14, marginBottom: 2 }}>{cfg.label}</div>
                    </div>
                  ))}
                </div>

                <div style={{ background: '#f9fafb', borderRadius: 12, padding: '16px 20px', marginTop: 24, border: '1px solid #f0ebe0' }}>
                  <div style={{ fontWeight: 700, color: DARK, marginBottom: 10, fontSize: 14 }}>💡 Cách tích lũy điểm</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                      '500 điểm mỗi lần đặt phòng hoàn thành (CheckedOut)',
                      '300 điểm mỗi booking đã xác nhận (Confirmed/CheckedIn)',
                      '100 điểm mỗi booking đang chờ (Pending)',
                      'Điểm đôi vào các dịp lễ, Tết đặc biệt',
                    ].map((item, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#374151' }}>
                        <CheckCircleOutlined style={{ color: GOLD }} /> {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom spacing */}
      <div style={{ height: 60 }} />

      {/* Edit Modal */}
      <Modal open={editModal} onCancel={() => setEditModal(false)} footer={null} title={null}
        styles={{ content: { borderRadius: 16, padding: '28px' } }}>
        <h3 style={{ margin: '0 0 20px', color: DARK, fontWeight: 800 }}>Chỉnh Sửa Thông Tin</h3>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>HỌ VÀ TÊN</label>
          <input value={editForm.fullName} onChange={e => setEditForm(f => ({ ...f, fullName: e.target.value }))}
            style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '10px 12px', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>SỐ ĐIỆN THOẠI</label>
          <input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} placeholder="0900 xxx xxx"
            style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '10px 12px', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button onClick={() => setEditModal(false)} style={{ flex: 1, background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '12px', fontWeight: 600, cursor: 'pointer' }}>
            Hủy
          </button>
          <button onClick={() => { message.success('Đã cập nhật thông tin!'); setEditModal(false); }}
            style={{ flex: 2, background: `linear-gradient(135deg, ${GOLD}, #E8C96B)`, border: 'none', borderRadius: 8, padding: '12px', color: DARK, fontWeight: 700, cursor: 'pointer' }}>
            Lưu Thay Đổi
          </button>
        </div>
      </Modal>
    </div>
  );
}

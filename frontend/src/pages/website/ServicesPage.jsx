import React, { useEffect, useState } from 'react';
import { CheckCircleFilled, PhoneOutlined, CalendarOutlined, TeamOutlined, CloseOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { Modal, message } from 'antd';
import axiosClient from '../../api/axiosClient';
import { roomApi } from '../../api/roomApi';
import { bookingApi } from '../../api/bookingApi';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const GOLD = '#C9A84C';
const DARK = '#0D1B2A';

const defaultServices = [
  { id: 1, name: 'Spa & Chăm Sóc Sức Khỏe', price: 800000, description: 'Liệu pháp massage truyền thống kết hợp phương pháp Á Đông.', icon: '🧖', category: { name: 'Wellness' } },
  { id: 2, name: 'Nhà Hàng Fine Dining', price: 0, description: 'Trải nghiệm ẩm thực đỉnh cao với đầu bếp quốc tế.', icon: '🍽️', category: { name: 'F&B' } },
  { id: 3, name: 'Bể Bơi & Vui Chơi Dưới Nước', price: 0, description: 'Hệ thống 3 bể bơi vô cực, trẻ em và khoáng nóng.', icon: '🏊', category: { name: 'Recreation' } },
  { id: 4, name: 'Thể Thao Biển', price: 350000, description: 'Lặn biển, lướt sóng, kayak với hướng dẫn viên chuyên nghiệp.', icon: '🤿', category: { name: 'Sports' } },
  { id: 5, name: 'Dịch Vụ Trẻ Em', price: 200000, description: 'Kids club với hoạt động sáng tạo, an toàn.', icon: '🎨', category: { name: 'Family' } },
  { id: 6, name: 'Thuê Xe & Đưa Đón', price: 500000, description: 'Đưa đón sân bay và thuê xe có tài xế riêng.', icon: '🚗', category: { name: 'Transport' } },
  { id: 7, name: 'Yoga & Thiền Định', price: 300000, description: 'Lớp yoga buổi sáng và thiền định trên bãi biển.', icon: '🧘', category: { name: 'Wellness' } },
  { id: 8, name: 'Tổ Chức Sự Kiện', price: 0, description: 'Hội nghị, tiệc cưới, sinh nhật chuyên nghiệp.', icon: '🎊', category: { name: 'Events' } },
];

const highlights = [
  { icon: '🌟', title: 'Tiêu Chuẩn 5 Sao', desc: 'Mọi dịch vụ đều theo chuẩn quốc tế, kiểm soát chất lượng chặt chẽ.' },
  { icon: '🔒', title: 'An Toàn Tuyệt Đối', desc: 'Đội ngũ an ninh 24/7 và quy trình an toàn chuẩn quốc tế.' },
  { icon: '🌿', title: 'Thân Thiện Môi Trường', desc: '80% nguyên liệu từ địa phương, giảm thiểu rác thải.' },
  { icon: '💎', title: 'Cá Nhân Hóa', desc: 'Mọi yêu cầu được lắng nghe và đáp ứng riêng biệt.' },
];

const packages = [
  {
    id: 'basic', name: 'Gói Cơ Bản', price: 2500000, per: '/đêm', color: '#6b7280', featured: false,
    features: ['Phòng tiêu chuẩn', 'Bữa sáng cho 2 người', 'Hồ bơi miễn phí', 'WiFi tốc độ cao'],
    services: ['Bể Bơi & Vui Chơi Dưới Nước', 'Nhà Hàng Fine Dining'],
  },
  {
    id: 'luxury', name: 'Gói Sang Trọng', price: 5800000, per: '/đêm', color: GOLD, featured: true,
    features: ['Phòng Deluxe view biển', 'Bữa sáng + bữa tối', 'Spa 60 phút', 'Hồ bơi & Beach club', 'Đưa đón sân bay'],
    services: ['Spa & Chăm Sóc Sức Khỏe', 'Nhà Hàng Fine Dining', 'Bể Bơi & Vui Chơi Dưới Nước', 'Thuê Xe & Đưa Đón'],
  },
  {
    id: 'villa', name: 'Gói Villa Riêng', price: 12000000, per: '/đêm', color: DARK, featured: false,
    features: ['Villa riêng hồ bơi', 'All-inclusive', 'Butler service', 'Tour độc quyền', 'Xe đưa đón 24/7'],
    services: ['Spa & Chăm Sóc Sức Khỏe', 'Nhà Hàng Fine Dining', 'Thể Thao Biển', 'Yoga & Thiền Định', 'Thuê Xe & Đưa Đón'],
  },
];

export default function ServicesPage() {
  const [services, setServices] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [pkgModal, setPkgModal] = useState(null); // selected package
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('2');
  const [booking, setBooking] = useState(false); // loading
  const [successModal, setSuccessModal] = useState(null); // booking code after success
  const [allRooms, setAllRooms] = useState([]);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const navigate = useNavigate();
  const { token, user } = useAuthStore();

  useEffect(() => {
    axiosClient.get('/Services')
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : [];
        setServices(data.length ? data : defaultServices);
      })
      .catch(() => setServices(defaultServices))
      .finally(() => setLoading(false));
    // Load tất cả phòng để tìm phòng trống khi đặt gói
    roomApi.getAllRooms().then(r => setAllRooms(r.data?.data || [])).catch(() => {});
    // Pre-fill tên nếu đã đăng nhập
    if (user?.name) setGuestName(user.name);
  }, [user]);

  const displayServices = services.length ? services : defaultServices;
  const categories = ['all', ...new Set(displayServices.map(s => s.category?.name).filter(Boolean))];
  const filtered = activeCategory === 'all' ? displayServices : displayServices.filter(s => s.category?.name === activeCategory);
  const categoryIcons = { Wellness: '🧖', 'F&B': '🍽️', Recreation: '🏊', Sports: '🤿', Family: '🎨', Transport: '🚗', Events: '🎊' };

  const handleBookPackage = async () => {
    if (!checkIn || !checkOut) {
      message.warning('Vui lòng chọn ngày nhận và trả phòng!');
      return;
    }
    if (new Date(checkOut) <= new Date(checkIn)) {
      message.warning('Ngày trả phòng phải sau ngày nhận phòng!');
      return;
    }
    if (!token) {
      message.warning('Vui lòng đăng nhập để đặt gói dịch vụ!');
      navigate('/website-login');
      return;
    }
    if (!guestName.trim() || !guestPhone.trim()) {
      message.warning('Vui lòng điền họ tên và số điện thoại!');
      return;
    }

    setBooking(true);
    try {
      // Tìm phòng trống phù hợp với số khách
      const guestsNum = parseInt(guests, 10);
      const availRoom = allRooms.find(r =>
        r.status === 'Available' &&
        (r.roomType?.capacityAdults || 0) >= guestsNum
      );

      const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / 86400000);
      const pricePerNight = pkgModal.price / Math.max(nights, 1);

      const payload = {
        bookingCode: 'PKG' + Date.now(),
        guestName: guestName.trim(),
        guestPhone: guestPhone.trim(),
        guestEmail: user?.email || '',
        status: 'Pending',
        userId: user?.id || null,
        bookingDetails: [{
          roomId: availRoom?.id || null,
          roomTypeId: availRoom?.roomType?.id || null,
          checkInDate: checkIn + 'T14:00:00',
          checkOutDate: checkOut + 'T12:00:00',
          pricePerNight: pricePerNight,
        }]
      };

      const res = await bookingApi.createBooking(payload);
      const bookingCode = res.data?.bookingCode || payload.bookingCode;

      // Cập nhật trạng thái phòng
      if (availRoom?.id) {
        await roomApi.updateRoomStatus(availRoom.id, 'Occupied').catch(() => {});
      }

      setPkgModal(null);
      setSuccessModal({ code: bookingCode, pkg: pkgModal.name, checkIn, checkOut, nights, price: pkgModal.price });
      setCheckIn(''); setCheckOut(''); setGuests('2'); setGuestName(user?.name || ''); setGuestPhone('');
    } catch {
      message.error('Không thể đặt gói. Vui lòng thử lại!');
    } finally {
      setBooking(false);
    }
  };

  return (
    <div style={{ paddingTop: 72, background: '#FAF7F2', minHeight: '100vh' }}>
      {/* Hero */}
      <section style={{ position: 'relative', height: 420, overflow: 'hidden' }}>
        <img src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1920&auto=format&fit=crop" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(13,27,42,0.5), rgba(13,27,42,0.85))' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 20px' }}>
          <div style={{ fontSize: 12, letterSpacing: '4px', color: GOLD, fontWeight: 700, marginBottom: 12 }}>DỊCH VỤ CAO CẤP</div>
          <h1 style={{ color: '#fff', fontSize: 'clamp(30px, 5vw, 56px)', fontWeight: 800, margin: '0 0 14px' }}>Trải Nghiệm Đẳng Cấp</h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16, maxWidth: 520, lineHeight: 1.7 }}>Hơn 20 dịch vụ cao cấp thiết kế cho kỳ nghỉ hoàn hảo</p>
        </div>
      </section>

      {/* Highlights */}
      <section style={{ background: DARK, padding: '48px 5vw' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 28 }}>
          {highlights.map(h => (
            <div key={h.title} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ fontSize: 32, flexShrink: 0 }}>{h.icon}</div>
              <div>
                <div style={{ color: GOLD, fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{h.title}</div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 1.7 }}>{h.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Services list */}
      <section style={{ padding: '60px 5vw', maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 12, letterSpacing: '4px', color: GOLD, fontWeight: 700, marginBottom: 12 }}>ĐA DẠNG LỰA CHỌN</div>
          <h2 style={{ fontSize: 'clamp(26px, 4vw, 42px)', fontWeight: 800, color: DARK, margin: 0 }}>Danh Sách Dịch Vụ</h2>
        </div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 40, flexWrap: 'wrap', justifyContent: 'center' }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)} style={{
              padding: '9px 22px', borderRadius: 30,
              background: activeCategory === cat ? `linear-gradient(135deg, ${GOLD}, #E8C96B)` : '#fff',
              border: activeCategory === cat ? 'none' : '1.5px solid #e5e7eb',
              color: activeCategory === cat ? DARK : '#374151', fontWeight: 600, fontSize: 14, cursor: 'pointer',
            }}>
              {cat === 'all' ? 'Tất Cả' : `${categoryIcons[cat] || ''} ${cat}`}
            </button>
          ))}
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>Đang tải dịch vụ...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
            {filtered.map(svc => (
              <div key={svc.id} style={{ background: '#fff', borderRadius: 18, padding: 28, boxShadow: '0 4px 24px rgba(0,0,0,0.07)', transition: 'all 0.3s', border: '1px solid transparent' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = GOLD; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'transparent'; }}>
                <div style={{ fontSize: 44, marginBottom: 16 }}>{svc.icon || categoryIcons[svc.category?.name] || '✨'}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: DARK, flex: 1 }}>{svc.name}</h3>
                  {svc.price > 0 && <span style={{ fontSize: 13, fontWeight: 700, color: GOLD, whiteSpace: 'nowrap', marginLeft: 10, background: '#fef9ee', borderRadius: 6, padding: '3px 8px' }}>{svc.price.toLocaleString('vi-VN')}₫</span>}
                  {svc.price === 0 && <span style={{ fontSize: 12, fontWeight: 700, color: '#10b981', background: '#ecfdf5', borderRadius: 6, padding: '3px 8px', whiteSpace: 'nowrap', marginLeft: 10 }}>Miễn Phí</span>}
                </div>
                {svc.category?.name && <span style={{ fontSize: 11, background: '#f3f4f6', borderRadius: 4, padding: '2px 8px', color: '#6b7280', display: 'inline-block', marginBottom: 10 }}>{svc.category.name}</span>}
                <p style={{ color: '#6b7280', fontSize: 14, lineHeight: 1.7, margin: 0 }}>{svc.description}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Package section */}
      <section style={{ background: '#fff', padding: '72px 5vw' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontSize: 12, letterSpacing: '4px', color: GOLD, fontWeight: 700, marginBottom: 12 }}>GÓI DỊCH VỤ</div>
            <h2 style={{ fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 800, color: DARK, margin: 0 }}>Gói Nghỉ Dưỡng Trọn Vẹn</h2>
            <p style={{ color: '#6b7280', fontSize: 15, marginTop: 12 }}>Chọn gói phù hợp — bao gồm phòng và các dịch vụ đi kèm</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 28 }}>
            {packages.map(pkg => (
              <div key={pkg.id} style={{
                borderRadius: 20, overflow: 'hidden',
                border: pkg.featured ? `2px solid ${GOLD}` : '1px solid #e5e7eb',
                boxShadow: pkg.featured ? '0 16px 48px rgba(201,168,76,0.2)' : '0 4px 16px rgba(0,0,0,0.06)',
                transform: pkg.featured ? 'scale(1.03)' : 'scale(1)',
                position: 'relative',
              }}>
                {pkg.featured && (
                  <div style={{ background: `linear-gradient(135deg, ${GOLD}, #E8C96B)`, padding: '8px', textAlign: 'center', fontSize: 12, fontWeight: 700, color: DARK, letterSpacing: '1px' }}>
                    ✦ PHỔ BIẾN NHẤT ✦
                  </div>
                )}
                <div style={{ padding: 28 }}>
                  <h3 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700, color: pkg.featured ? GOLD : DARK }}>{pkg.name}</h3>
                  <div style={{ margin: '0 0 20px' }}>
                    <span style={{ fontSize: 32, fontWeight: 800, color: pkg.featured ? GOLD : DARK }}>{pkg.price.toLocaleString('vi-VN')}</span>
                    <span style={{ color: '#9ca3af', fontSize: 14 }}> ₫{pkg.per}</span>
                  </div>
                  {pkg.features.map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <CheckCircleFilled style={{ color: pkg.featured ? GOLD : '#10b981', fontSize: 14 }} />
                      <span style={{ color: '#374151', fontSize: 14 }}>{f}</span>
                    </div>
                  ))}
                  {/* Dịch vụ đi kèm */}
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px dashed #e5e7eb' }}>
                    <div style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600, letterSpacing: '0.5px', marginBottom: 8 }}>DỊCH VỤ ĐI KÈM</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {pkg.services.map(s => (
                        <span key={s} style={{ fontSize: 12, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 6, padding: '3px 8px', color: '#374151' }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => setPkgModal(pkg)}
                    style={{
                      width: '100%', marginTop: 24, borderRadius: 10, padding: '13px',
                      background: pkg.featured ? `linear-gradient(135deg, ${GOLD}, #E8C96B)` : '#f9fafb',
                      border: pkg.featured ? 'none' : '1.5px solid #e5e7eb',
                      color: pkg.featured ? DARK : '#374151', fontWeight: 700, fontSize: 15, cursor: 'pointer',
                      boxShadow: pkg.featured ? '0 4px 14px rgba(201,168,76,0.35)' : 'none',
                    }}>
                    Chọn Gói Này →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section style={{ background: DARK, padding: '60px 5vw', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{ fontSize: 12, letterSpacing: '4px', color: GOLD, fontWeight: 700, marginBottom: 14 }}>HỖ TRỢ 24/7</div>
          <h2 style={{ color: '#fff', fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 800, margin: '0 0 16px' }}>Cần Tư Vấn Thêm?</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15, lineHeight: 1.7, marginBottom: 32 }}>Đội ngũ concierge luôn sẵn sàng hỗ trợ bạn lập kế hoạch kỳ nghỉ hoàn hảo.</p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="tel:+84900360360">
              <button style={{ display: 'flex', alignItems: 'center', gap: 10, background: `linear-gradient(135deg, ${GOLD}, #E8C96B)`, border: 'none', borderRadius: 12, padding: '14px 32px', color: DARK, fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>
                <PhoneOutlined /> Gọi Ngay
              </button>
            </a>
            <a href="/rooms">
              <button style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(201,168,76,0.4)', borderRadius: 12, padding: '14px 32px', color: '#fff', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}>
                Đặt Phòng Online
              </button>
            </a>
          </div>
        </div>
      </section>

      {/* ===== PACKAGE SELECTION MODAL ===== */}
      <Modal open={!!pkgModal} onCancel={() => setPkgModal(null)} footer={null} width={560} title={null}
        styles={{ content: { borderRadius: 20, padding: '32px' } }}>
        {pkgModal && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 11, color: GOLD, letterSpacing: '2px', fontWeight: 700, marginBottom: 4 }}>GÓI DỊCH VỤ</div>
                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: DARK }}>{pkgModal.name}</h2>
                <div style={{ fontSize: 20, fontWeight: 800, color: GOLD, marginTop: 4 }}>
                  {pkgModal.price.toLocaleString('vi-VN')} ₫<span style={{ fontSize: 14, color: '#9ca3af', fontWeight: 400 }}>{pkgModal.per}</span>
                </div>
              </div>
            </div>

            {/* Services included */}
            <div style={{ background: '#f9fafb', borderRadius: 12, padding: '14px 18px', marginBottom: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', letterSpacing: '0.5px', marginBottom: 10 }}>DỊCH VỤ BAO GỒM</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {pkgModal.features.concat(pkgModal.services).filter((v, i, a) => a.indexOf(v) === i).map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151' }}>
                    <CheckCircleFilled style={{ color: GOLD, fontSize: 12 }} /> {f}
                  </div>
                ))}
              </div>
            </div>

            {/* Date pickers */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 5 }}>NHẬN PHÒNG *</label>
                <input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '9px 12px', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 5 }}>TRẢ PHÒNG *</label>
                <input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)}
                  min={checkIn || new Date().toISOString().split('T')[0]}
                  style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '9px 12px', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>

            {checkIn && checkOut && new Date(checkOut) > new Date(checkIn) && (
              <div style={{ background: '#f0fdf4', borderRadius: 8, padding: '8px 14px', marginBottom: 10, fontSize: 13, color: '#10b981', fontWeight: 600 }}>
                ✓ {Math.ceil((new Date(checkOut) - new Date(checkIn)) / 86400000)} đêm — Tổng: {pkgModal.price.toLocaleString('vi-VN')} ₫
              </div>
            )}

            {/* Name + Phone */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 5 }}>HỌ VÀ TÊN *</label>
                <input value={guestName} onChange={e => setGuestName(e.target.value)} placeholder="Nhập họ và tên"
                  style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '9px 12px', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 5 }}>SỐ ĐIỆN THOẠI *</label>
                <input value={guestPhone} onChange={e => setGuestPhone(e.target.value)} placeholder="0900 xxx xxx"
                  style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '9px 12px', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>

            {/* Guests */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 5 }}>SỐ KHÁCH</label>
              <select value={guests} onChange={e => setGuests(e.target.value)}
                style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '9px 12px', fontSize: 14, outline: 'none', background: '#fff' }}>
                {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} Khách</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setPkgModal(null)}
                style={{ flex: 1, background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '12px', fontWeight: 600, cursor: 'pointer' }}>
                Hủy
              </button>
              <button onClick={handleBookPackage} disabled={booking}
                style={{ flex: 2, background: `linear-gradient(135deg, ${GOLD}, #E8C96B)`, border: 'none', borderRadius: 10, padding: '12px', color: DARK, fontWeight: 700, fontSize: 15, cursor: booking ? 'not-allowed' : 'pointer', boxShadow: '0 4px 14px rgba(201,168,76,0.35)', opacity: booking ? 0.8 : 1 }}>
                {booking ? 'Đang xử lý...' : '✦ Xác Nhận Đặt Gói'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ===== SUCCESS MODAL ===== */}
      <Modal open={!!successModal} onCancel={() => setSuccessModal(null)} footer={null} width={460} title={null}
        styles={{ content: { borderRadius: 20, padding: '40px 36px', textAlign: 'center' } }}>
        {successModal && (
          <div>
            <div style={{ fontSize: 64, marginBottom: 14 }}>🎉</div>
            <div style={{ fontSize: 11, letterSpacing: '3px', color: GOLD, fontWeight: 700, marginBottom: 8 }}>ĐẶT GÓI THÀNH CÔNG</div>
            <h2 style={{ margin: '0 0 16px', color: DARK, fontWeight: 800, fontSize: 20 }}>{successModal.pkg}</h2>
            <div style={{ background: '#fef9ee', border: `2px dashed ${GOLD}`, borderRadius: 12, padding: '14px', marginBottom: 18 }}>
              <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>MÃ ĐẶT PHÒNG</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: DARK, letterSpacing: '2px' }}>{successModal.code}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 18 }}>
              {[
                { label: 'Nhận phòng', val: successModal.checkIn },
                { label: 'Trả phòng', val: successModal.checkOut },
                { label: 'Số đêm', val: `${successModal.nights} đêm` },
              ].map(item => (
                <div key={item.label} style={{ background: '#f9fafb', borderRadius: 10, padding: '10px 8px' }}>
                  <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 4 }}>{item.label.toUpperCase()}</div>
                  <div style={{ fontWeight: 700, color: DARK, fontSize: 12 }}>{item.val}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#ecfdf5', borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: '#10b981', fontWeight: 600, justifyContent: 'center' }}>
              <CheckCircleOutlined /> Đặt phòng đã được ghi nhận! Chúng tôi sẽ xác nhận sớm nhất.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setSuccessModal(null)}
                style={{ flex: 1, background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '11px', fontWeight: 600, cursor: 'pointer' }}>
                Đóng
              </button>
              <button onClick={() => { setSuccessModal(null); window.location.href = '/my-bookings'; }}
                style={{ flex: 2, background: `linear-gradient(135deg, ${GOLD}, #E8C96B)`, border: 'none', borderRadius: 10, padding: '11px', color: DARK, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                Xem Đặt Phòng Của Tôi →
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
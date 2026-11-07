import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { roomApi } from '../../api/roomApi';
import { bookingApi } from '../../api/bookingApi';
import { serviceApi } from '../../api/serviceApi';
import { voucherApi } from '../../api/marketingApi';
import axiosClient, { API_BASE } from '../../api/axiosClient';
import { useAuthStore } from '../../store/authStore';
import { message, Modal } from 'antd';
import { StarFilled, UserOutlined, CheckOutlined } from '@ant-design/icons';

const GOLD = '#C9A84C';
const DARK = '#0D1B2A';

export default function RoomsPage() {
  const [roomTypes, setRoomTypes] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [services, setServices] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [bookModal, setBookModal] = useState(null);      // roomType
  const [bookStep, setBookStep] = useState(1);            // 1=chọn ngày, 2=chọn phòng, 3=xác nhận
  const [selectedRoom, setSelectedRoom] = useState(null); // phòng cụ thể được chọn
  const [availableRooms, setAvailableRooms] = useState([]);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [selectedServices, setSelectedServices] = useState({});
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [searchParams] = useSearchParams();
  const { token, user } = useAuthStore();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    guestName: user?.name || '',
    guestPhone: '',
    guestEmail: '',
    checkIn: searchParams.get('checkIn') || '',
    checkOut: searchParams.get('checkOut') || '',
  });

  useEffect(() => {
    Promise.all([
      roomApi.getRoomTypes(), 
      roomApi.getAllRooms(),
      serviceApi.getAllServices(),
      voucherApi.getAllVouchers()
    ]).then(([rtRes, rRes, sRes, vRes]) => {
      setRoomTypes(rtRes.data?.data || []);
      setRooms(rRes.data?.data || []);
      setServices(sRes.data?.data || sRes.data || []);
      setVouchers(vRes.data?.data || vRes.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (user) setForm(f => ({ ...f, guestName: user.name }));
  }, [user]);

  // Auto-mo booking modal khi co ?book=id (tu trang chi tiet phong)
  useEffect(() => {
    const bookId = searchParams.get('book');
    if (bookId && roomTypes.length > 0) {
      const target = roomTypes.find(rt => String(rt.id) === String(bookId));
      if (target) {
        setBookModal(target);
        setBookStep(1);
      }
    }
  }, [searchParams, roomTypes]);

  const getPrimaryImage = (rt) => {
    const primary = rt.roomImages?.find(i => i.isPrimary) || rt.roomImages?.[0];
    if (primary?.imageUrl) {
      if (primary.imageUrl.startsWith('http')) return primary.imageUrl;
      return `${API_BASE}${primary.imageUrl}`;
    }
    return `https://images.unsplash.com/photo-1631049307264-da0ec9d70304?q=80&w=800&auto=format&fit=crop`;
  };

  const getAvailableRoomForType = (roomTypeId) => {
    return rooms.find(r => r.roomType?.id === roomTypeId && r.status === 'Available');
  };

  const handleBook = (rt) => {
    if (!token) {
      message.warning('Vui lòng đăng nhập để đặt phòng!');
      navigate('/website-login');
      return;
    }
    setBookModal(rt);
    setBookStep(1);
    setSelectedRoom(null);
    setAvailableRooms([]);
    setSelectedServices({});
    setAppliedVoucher(null);
    setVoucherCode('');
  };

  // Bước 1 → 2: kiểm tra ngày và lọc phòng trống
  const handlePickDates = () => {
    if (!form.checkIn || !form.checkOut) {
      message.error('Vui lòng chọn ngày nhận và trả phòng!');
      return;
    }
    if (new Date(form.checkOut) <= new Date(form.checkIn)) {
      message.error('Ngày trả phòng phải sau ngày nhận phòng!');
      return;
    }
    // Chỉ lọc đúng loại phòng và còn trống — không lọc theo capacity
    // vì user đã chủ động chọn loại phòng này rồi
    const filtered = rooms.filter(r =>
      r.roomType?.id === bookModal.id &&
      r.status === 'Available'
    );
    setAvailableRooms(filtered);
    setBookStep(2);
  };


  const handleServiceChange = (id, delta) => {
    setSelectedServices(prev => {
      const newVal = (prev[id] || 0) + delta;
      return { ...prev, [id]: newVal < 0 ? 0 : newVal };
    });
  };

  const nights = (form.checkIn && form.checkOut && new Date(form.checkOut) > new Date(form.checkIn)) 
    ? Math.ceil((new Date(form.checkOut) - new Date(form.checkIn)) / 86400000) : 0;
  const roomSubtotal = nights > 0 ? (bookModal?.basePrice || 0) * nights : 0;
  const totalServiceCost = services.reduce((acc, s) => acc + (selectedServices[s.id] || 0) * s.price, 0);
  const subtotal = roomSubtotal + totalServiceCost;
  
  let discountAmount = 0;
  if (appliedVoucher) {
    if (appliedVoucher.discountType === 'Percentage') discountAmount = (subtotal * appliedVoucher.discountValue) / 100;
    else discountAmount = appliedVoucher.discountValue;
  }
  const finalTotal = subtotal - discountAmount > 0 ? subtotal - discountAmount : 0;

  const handleApplyVoucher = () => {
    if (!voucherCode.trim()) return;
    const v = vouchers.find(v => v.code === voucherCode);
    if (!v) {
      message.error('Mã giảm giá không hợp lệ!');
      setAppliedVoucher(null);
      return;
    }
    if (v.validTo && new Date(v.validTo) < new Date()) {
      message.error('Mã giảm giá đã hết hạn!');
      setAppliedVoucher(null);
      return;
    }
    if (v.minBookingValue && subtotal < v.minBookingValue) {
      message.warning(`Đơn hàng tối thiểu ${v.minBookingValue.toLocaleString('vi-VN')} ₫ để áp dụng mã này!`);
      return;
    }
    setAppliedVoucher(v);
    message.success('Đã áp dụng mã giảm giá!');
  };

  const submitBooking = async () => {
    if (!selectedRoom && availableRooms.length > 0) {
      message.error('Vui lòng chọn phòng cụ thể!');
      return;
    }
    if (!form.guestName || !form.guestPhone) {
      message.error('Vui lòng điền đầy đủ họ tên và số điện thoại!');
      return;
    }
    const roomToBook = selectedRoom || availableRooms[0];

    setBookingLoading(true);
    try {
      const payload = {
        bookingCode: 'BK' + Date.now(),
        guestName: form.guestName,
        guestPhone: form.guestPhone,
        guestEmail: form.guestEmail,
        status: 'Pending',
        userId: user?.id || null,
        voucherId: appliedVoucher?.id || null,
        bookingDetails: [{
          roomId: roomToBook?.id || null,
          roomTypeId: bookModal.id,
          checkInDate: form.checkIn + 'T14:00:00',
          checkOutDate: form.checkOut + 'T12:00:00',
          pricePerNight: bookModal.basePrice,
        }]
      };
      
      const res = await bookingApi.createBooking(payload);
      const newBookingId = res.data.id;

      // Cập nhật trạng thái phòng thành Occupied
      if (roomToBook?.id) {
        await roomApi.updateRoomStatus(roomToBook.id, 'Occupied').catch(() => {});
      }

      // Handle Extra Services
      const serviceKeys = Object.keys(selectedServices).filter(k => selectedServices[k] > 0);
      if (serviceKeys.length > 0) {
        const bRes = await bookingApi.getBookingById(newBookingId);
        const bookingDetailId = bRes.data.bookingDetails[0].id;
        
        const orderServiceData = {
          BookingDetailId: bookingDetailId,
          OrderDate: new Date().toISOString(),
          TotalAmount: totalServiceCost,
          Status: 'Pending',
          OrderServiceDetails: serviceKeys.map(k => {
            const srv = services.find(s => s.id == parseInt(k));
            return {
              ServiceId: parseInt(k),
              Quantity: selectedServices[k],
              UnitPrice: srv.price
            };
          })
        };
        await axiosClient.post('/OrderServices', orderServiceData);
      }

      message.success(`Đặt phòng thành công! Mã: ${res.data.bookingCode || 'BK...'}. Chúng tôi sẽ liên hệ xác nhận sớm nhất.`);
      setBookModal(null);
      setBookStep(1);
      setSelectedRoom(null);
      setAvailableRooms([]);
      setForm(f => ({ ...f, guestPhone: '', guestEmail: '' }));
      setSelectedServices({});
      setVoucherCode('');
      setAppliedVoucher(null);
      // Reload lại danh sách phòng để cập nhật trạng thái
      roomApi.getAllRooms().then(r => setRooms(r.data?.data || [])).catch(() => {});

    } catch {
      message.error('Đặt phòng thất bại. Vui lòng thử lại!');
    } finally {
      setBookingLoading(false);
    }
  };

  const priceRanges = [
    { key: 'all', label: 'Tất Cả' },
    { key: 'budget', label: 'Dưới 3 triệu' },
    { key: 'mid', label: '3 – 8 triệu' },
    { key: 'luxury', label: 'Trên 8 triệu' },
  ];

  const filtered = roomTypes.filter(rt => {
    if (filter === 'budget') return rt.basePrice < 3000000;
    if (filter === 'mid') return rt.basePrice >= 3000000 && rt.basePrice < 8000000;
    if (filter === 'luxury') return rt.basePrice >= 8000000;
    return true;
  });

  return (
    <div style={{ paddingTop: 72, minHeight: '100vh', background: '#FAF7F2' }}>
      {/* Hero */}
      <section style={{ position: 'relative', height: 400, overflow: 'hidden' }}>
        <img src="https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1920&auto=format&fit=crop" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(13,27,42,0.6), rgba(13,27,42,0.85))' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 20px' }}>
          <div style={{ fontSize: 12, letterSpacing: '4px', color: GOLD, fontWeight: 700, marginBottom: 12 }}>KHÔNG GIAN NGHỈ DƯỠNG</div>
          <h1 style={{ color: '#fff', fontSize: 'clamp(30px, 5vw, 56px)', fontWeight: 800, margin: '0 0 14px', lineHeight: 1.1 }}>Phòng & Villa Hạng Sang</h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16, maxWidth: 500 }}>Lựa chọn không gian nghỉ dưỡng hoàn hảo theo phong cách và ngân sách của bạn</p>
        </div>
      </section>

      {/* Filter + List */}
      <section style={{ padding: '48px 5vw', maxWidth: 1280, margin: '0 auto' }}>
        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 36, flexWrap: 'wrap' }}>
          {priceRanges.map(p => (
            <button key={p.key} onClick={() => setFilter(p.key)} style={{
              padding: '10px 22px', borderRadius: 30, border: filter === p.key ? 'none' : '1.5px solid #d1d5db',
              background: filter === p.key ? `linear-gradient(135deg, ${GOLD}, #E8C96B)` : '#fff',
              color: filter === p.key ? DARK : '#374151', fontWeight: 600, fontSize: 14, cursor: 'pointer',
              boxShadow: filter === p.key ? '0 4px 14px rgba(201,168,76,0.3)' : 'none',
              transition: 'all 0.2s',
            }}>{p.label}</button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#9ca3af', fontSize: 16 }}>Đang tải danh sách phòng...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#9ca3af', fontSize: 16 }}>Không có phòng phù hợp</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 28 }}>
            {filtered.map(rt => {
              const availRoom = getAvailableRoomForType(rt.id);
              const isAvailable = !!availRoom;
              return (
                <div key={rt.id} style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.07)', transition: 'transform 0.3s, box-shadow 0.3s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 16px 48px rgba(0,0,0,0.13)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.07)'; }}>
                  {/* Images */}
                  <div style={{ position: 'relative', height: 260, overflow: 'hidden' }}>
                    <img src={getPrimaryImage(rt)} alt={rt.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }}
                      onMouseEnter={e => e.target.style.transform = 'scale(1.08)'}
                      onMouseLeave={e => e.target.style.transform = 'scale(1)'} />
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 50%)' }} />
                    <div style={{
                      position: 'absolute', top: 16, left: 16,
                      background: isAvailable ? 'rgba(16,185,129,0.9)' : 'rgba(239,68,68,0.9)',
                      borderRadius: 6, padding: '4px 12px', fontSize: 12, fontWeight: 600, color: '#fff', backdropFilter: 'blur(4px)',
                    }}>
                      {isAvailable ? '✓ Còn Phòng' : '✗ Hết Phòng'}
                    </div>
                    {rt.roomImages?.length > 1 && (
                      <div style={{ position: 'absolute', bottom: 12, right: 12, background: 'rgba(0,0,0,0.5)', borderRadius: 6, padding: '3px 10px', fontSize: 12, color: '#fff' }}>
                        +{rt.roomImages.length - 1} ảnh
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div style={{ padding: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: DARK, lineHeight: 1.2 }}>{rt.name}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 3, background: '#fef9ee', border: `1px solid ${GOLD}`, borderRadius: 6, padding: '2px 8px' }}>
                        <StarFilled style={{ color: GOLD, fontSize: 11 }} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: DARK }}>5.0</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#6b7280', fontSize: 13 }}>
                        <UserOutlined /> {rt.capacityAdults} người lớn{rt.capacityChildren > 0 ? ` + ${rt.capacityChildren} trẻ em` : ''}
                      </span>
                    </div>

                    {rt.description && (
                      <p style={{ color: '#6b7280', fontSize: 13, lineHeight: 1.7, marginBottom: 16, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {rt.description}
                      </p>
                    )}

                    {/* Amenities */}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                      {['WiFi', 'Điều hòa', 'TV', 'Minibar'].map(a => (
                        <span key={a} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 4, padding: '2px 8px', fontSize: 12, color: '#6b7280' }}>{a}</span>
                      ))}
                    </div>

                    <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 2 }}>Giá từ</div>
                        <div style={{ fontSize: 24, fontWeight: 800, color: GOLD }}>{(rt.basePrice || 0).toLocaleString('vi-VN')} <span style={{ fontSize: 14, fontWeight: 500, color: '#9ca3af' }}>₫/đêm</span></div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => window.open('/rooms/' + rt.id, '_blank')}
                          style={{
                            background: '#fff', border: `1.5px solid ${GOLD}`, borderRadius: 10,
                            padding: '10px 14px', color: GOLD, fontWeight: 700, fontSize: 13, cursor: 'pointer',
                          }}
                        >
                          👁 Chi Tiết
                        </button>
                        <button onClick={() => handleBook(rt)} disabled={!isAvailable}
                          style={{
                            background: isAvailable ? `linear-gradient(135deg, ${GOLD}, #E8C96B)` : '#e5e7eb',
                            border: 'none', borderRadius: 10, padding: '12px 18px',
                            color: isAvailable ? DARK : '#9ca3af', fontWeight: 700, fontSize: 13, cursor: isAvailable ? 'pointer' : 'not-allowed',
                            boxShadow: isAvailable ? '0 4px 14px rgba(201,168,76,0.35)' : 'none',
                          }}>
                          {isAvailable ? 'Đặt Phòng' : 'Hết Phòng'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <Modal
        open={!!bookModal}
        onCancel={() => { setBookModal(null); setBookStep(1); }}
        footer={null}
        width={580}
        title={null}
        styles={{ content: { borderRadius: 20, padding: 0, overflow: 'hidden' } }}
      >
        {bookModal && (
          <div>
            {/* Header ảnh */}
            <div style={{ position: 'relative', height: 180 }}>
              <img src={getPrimaryImage(bookModal)} alt={bookModal.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(13,27,42,0.85), transparent)' }} />
              <div style={{ position: 'absolute', bottom: 16, left: 24 }}>
                <div style={{ color: '#fff', fontSize: 20, fontWeight: 800 }}>{bookModal.name}</div>
                <div style={{ color: GOLD, fontSize: 14, fontWeight: 700 }}>{(bookModal.basePrice || 0).toLocaleString('vi-VN')} ₫/đêm</div>
              </div>
              {/* Step indicator */}
              <div style={{ position: 'absolute', top: 14, right: 16, display: 'flex', gap: 6 }}>
                {['Ngày', 'Chọn Phòng', 'Xác Nhận'].map((label, idx) => (
                  <div key={idx} style={{
                    padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700,
                    background: bookStep === idx + 1 ? GOLD : 'rgba(255,255,255,0.3)',
                    color: bookStep === idx + 1 ? DARK : '#fff',
                  }}>{idx + 1}. {label}</div>
                ))}
              </div>
            </div>

            <div style={{ padding: '24px 28px 28px' }}>

              {/* ===== BƯỚC 1: CHỌN NGÀY ===== */}
              {bookStep === 1 && (
                <div>
                  <h3 style={{ margin: '0 0 18px', color: DARK, fontWeight: 800, fontSize: 17 }}>Chọn Ngày Lưu Trú</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 6, letterSpacing: '0.5px' }}>NGÀY NHẬN PHÒNG *</label>
                      <input type="date" value={form.checkIn} onChange={e => setForm(f => ({ ...f, checkIn: e.target.value }))}
                        min={new Date().toISOString().split('T')[0]}
                        style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '10px 12px', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 6, letterSpacing: '0.5px' }}>NGÀY TRẢ PHÒNG *</label>
                      <input type="date" value={form.checkOut} onChange={e => setForm(f => ({ ...f, checkOut: e.target.value }))}
                        min={form.checkIn || new Date().toISOString().split('T')[0]}
                        style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '10px 12px', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                  </div>
                  {nights > 0 && (
                    <div style={{ background: '#f0fdf4', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 14, color: '#10b981', fontWeight: 600 }}>
                      ✓ {nights} đêm — Tạm tính: {((bookModal.basePrice || 0) * nights).toLocaleString('vi-VN')} ₫
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                    <button onClick={() => { setBookModal(null); setBookStep(1); }}
                      style={{ flex: 1, background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '12px', fontWeight: 600, cursor: 'pointer' }}>
                      Hủy
                    </button>
                    <button onClick={handlePickDates}
                      style={{ flex: 2, background: `linear-gradient(135deg, ${GOLD}, #E8C96B)`, border: 'none', borderRadius: 10, padding: '12px', color: DARK, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
                      Tiếp Theo: Chọn Phòng →
                    </button>
                  </div>
                </div>
              )}

              {/* ===== BƯỚC 2: CHỌN PHÒNG TRỐNG ===== */}
              {bookStep === 2 && (
                <div>
                  <h3 style={{ margin: '0 0 6px', color: DARK, fontWeight: 800, fontSize: 17 }}>Chọn Phòng Cụ Thể</h3>
                  <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 16 }}>
                    {form.checkIn} → {form.checkOut} ({nights} đêm)
                  </p>

                  {availableRooms.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px 0' }}>
                      <div style={{ fontSize: 48, marginBottom: 8 }}>😔</div>
                      <div style={{ fontWeight: 700, color: DARK, marginBottom: 6 }}>Không còn phòng trống</div>
                      <p style={{ color: '#6b7280', fontSize: 13 }}>Vui lòng chọn ngày khác hoặc loại phòng khác.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 280, overflowY: 'auto', marginBottom: 16 }}>
                      {availableRooms.map(r => (
                        <div key={r.id}
                          onClick={() => setSelectedRoom(r)}
                          style={{
                            border: selectedRoom?.id === r.id ? `2px solid ${GOLD}` : '1.5px solid #e5e7eb',
                            background: selectedRoom?.id === r.id ? '#fef9ee' : '#fff',
                            borderRadius: 12, padding: '14px 16px', cursor: 'pointer',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            transition: 'all 0.2s',
                          }}>
                          <div>
                            <div style={{ fontWeight: 700, color: DARK, marginBottom: 4 }}>
                              Phòng {r.roomNumber}
                              {selectedRoom?.id === r.id && <span style={{ marginLeft: 8, color: GOLD, fontSize: 12 }}>✓ Đã chọn</span>}
                            </div>
                            <div style={{ fontSize: 12, color: '#6b7280' }}>Tầng {r.floor} • {r.roomType?.capacityAdults || 2} người lớn</div>
                          </div>
                          <div style={{ background: '#10b981', color: '#fff', borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>Trống</div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => setBookStep(1)}
                      style={{ flex: 1, background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '12px', fontWeight: 600, cursor: 'pointer' }}>
                      ← Quay Lại
                    </button>
                    <button onClick={() => { if (!selectedRoom) { message.warning('Vui lòng chọn phòng!'); return; } setBookStep(3); }}
                      disabled={availableRooms.length === 0}
                      style={{ flex: 2, background: availableRooms.length === 0 ? '#e5e7eb' : `linear-gradient(135deg, ${GOLD}, #E8C96B)`, border: 'none', borderRadius: 10, padding: '12px', color: availableRooms.length === 0 ? '#9ca3af' : DARK, fontWeight: 700, fontSize: 15, cursor: availableRooms.length === 0 ? 'not-allowed' : 'pointer' }}>
                      Tiếp Theo: Xác Nhận →
                    </button>
                  </div>
                </div>
              )}

              {/* ===== BƯỚC 3: XÁC NHẬN ===== */}
              {bookStep === 3 && (
                <div>
                  <h3 style={{ margin: '0 0 16px', color: DARK, fontWeight: 800, fontSize: 17 }}>Xác Nhận Đặt Phòng</h3>

                  {/* Info tóm tắt */}
                  <div style={{ background: '#f9fafb', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ color: '#6b7280' }}>Phòng đã chọn:</span>
                      <span style={{ fontWeight: 700, color: DARK }}>Phòng {selectedRoom?.roomNumber} – Tầng {selectedRoom?.floor}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#6b7280' }}>Thời gian:</span>
                      <span style={{ fontWeight: 600, color: DARK }}>{form.checkIn} → {form.checkOut} ({nights} đêm)</span>
                    </div>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 6 }}>HỌ VÀ TÊN *</label>
                    <input value={form.guestName} onChange={e => setForm(f => ({ ...f, guestName: e.target.value }))} placeholder="Nhập họ và tên"
                      style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '10px 12px', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 6 }}>SỐ ĐIỆN THOẠI *</label>
                      <input value={form.guestPhone} onChange={e => setForm(f => ({ ...f, guestPhone: e.target.value }))} placeholder="0900 xxx xxx"
                        style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '10px 12px', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 6 }}>EMAIL</label>
                      <input type="email" value={form.guestEmail} onChange={e => setForm(f => ({ ...f, guestEmail: e.target.value }))} placeholder="email@example.com"
                        style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '10px 12px', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                  </div>

                  {/* Dịch vụ */}
                  {services.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8 }}>DỊCH VỤ ĐI KÈM</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {services.map(s => (
                          <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9fafb', padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                            <div>
                              <div style={{ fontWeight: 600, color: DARK, fontSize: 13 }}>{s.name}</div>
                              <div style={{ fontSize: 12, color: GOLD }}>{s.price.toLocaleString('vi-VN')} ₫</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <button onClick={() => handleServiceChange(s.id, -1)} style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontWeight: 600 }}>-</button>
                              <span style={{ fontWeight: 600, width: 18, textAlign: 'center' }}>{selectedServices[s.id] || 0}</span>
                              <button onClick={() => handleServiceChange(s.id, 1)} style={{ width: 26, height: 26, borderRadius: 6, border: 'none', background: `linear-gradient(135deg, ${GOLD}, #E8C96B)`, color: DARK, cursor: 'pointer', fontWeight: 600 }}>+</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Voucher */}
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8 }}>MÃ GIẢM GIÁ</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input value={voucherCode} onChange={e => setVoucherCode(e.target.value)} placeholder="Nhập mã voucher..."
                        style={{ flex: 1, border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '9px 12px', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                      <button onClick={handleApplyVoucher} style={{ background: '#374151', color: '#fff', border: 'none', borderRadius: 8, padding: '0 16px', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
                        Áp Dụng
                      </button>
                    </div>
                    {appliedVoucher && <div style={{ marginTop: 6, fontSize: 13, color: '#10b981', fontWeight: 600 }}>✓ Đã áp dụng: {appliedVoucher.code}</div>}
                  </div>

                  {/* Tổng tiền */}
                  {nights > 0 && (
                    <div style={{ background: '#fef9ee', border: `1px solid ${GOLD}`, borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ color: '#6b7280', fontSize: 13 }}>Tiền phòng ({nights} đêm)</span>
                        <span style={{ fontWeight: 600 }}>{roomSubtotal.toLocaleString('vi-VN')} ₫</span>
                      </div>
                      {totalServiceCost > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ color: '#6b7280', fontSize: 13 }}>Dịch vụ</span>
                          <span style={{ fontWeight: 600 }}>{totalServiceCost.toLocaleString('vi-VN')} ₫</span>
                        </div>
                      )}
                      {discountAmount > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ color: '#6b7280', fontSize: 13 }}>Giảm giá</span>
                          <span style={{ fontWeight: 600, color: '#10b981' }}>-{discountAmount.toLocaleString('vi-VN')} ₫</span>
                        </div>
                      )}
                      <div style={{ borderTop: `1px dashed ${GOLD}`, paddingTop: 10, marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 700, color: DARK }}>Tổng thanh toán</span>
                        <span style={{ fontWeight: 800, color: GOLD, fontSize: 18 }}>{finalTotal.toLocaleString('vi-VN')} ₫</span>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => setBookStep(2)}
                      style={{ flex: 1, background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '12px', fontWeight: 600, cursor: 'pointer' }}>
                      ← Quay Lại
                    </button>
                    <button onClick={submitBooking} disabled={bookingLoading}
                      style={{ flex: 2, background: `linear-gradient(135deg, ${GOLD}, #E8C96B)`, border: 'none', borderRadius: 10, padding: '12px', color: DARK, fontWeight: 700, fontSize: 15, cursor: bookingLoading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 14px rgba(201,168,76,0.35)' }}>
                      {bookingLoading ? 'Đang xử lý...' : '✓ Xác Nhận Đặt Phòng'}
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}

import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { roomApi } from '../../api/roomApi';
import { API_BASE } from '../../api/axiosClient';
import { StarFilled, CheckCircleFilled, ArrowRightOutlined, SearchOutlined, TeamOutlined } from '@ant-design/icons';

const GOLD = '#C9A84C';
const DARK = '#0D1B2A';

const features = [
  { icon: '🌊', title: 'Bãi Biển Riêng Tư', desc: 'Tận hưởng bãi biển cát trắng dành riêng cho cư dân resort' },
  { icon: '🍽️', title: 'Ẩm Thực Đỉnh Cao', desc: 'Nhà hàng 5 sao với đầu bếp quốc tế và nguyên liệu tươi ngon' },
  { icon: '🧖', title: 'Spa & Wellness', desc: 'Liệu pháp chăm sóc sức khỏe toàn diện theo phong cách phương Đông' },
  { icon: '🏊', title: 'Bể Bơi Vô Cực', desc: 'Hồ bơi tràn bờ với view biển panoramic tuyệt đẹp' },
  { icon: '🤿', title: 'Thể Thao Biển', desc: 'Đa dạng hoạt động: lặn, lướt sóng, kayak, paddleboard' },
  { icon: '🌿', title: 'Vườn Thiền Định', desc: 'Không gian xanh yên tĩnh cho những buổi thiền định buổi sáng' },
];

const stats = [
  { num: '36+', label: 'Phòng & Villa' },
  { num: '15+', label: 'Năm Kinh Nghiệm' },
  { num: '98%', label: 'Khách Hàng Hài Lòng' },
  { num: '24/7', label: 'Hỗ Trợ Tận Tình' },
];

const heroSlides = [
  {
    img: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=1920&auto=format&fit=crop',
    title: 'Thiên Đường Nghỉ Dưỡng',
    subtitle: 'Nơi mỗi khoảnh khắc trở thành ký ức không thể quên',
  },
  {
    img: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=1920&auto=format&fit=crop',
    title: 'Villa Riêng Tư Sang Trọng',
    subtitle: 'Không gian sống đẳng cấp giữa thiên nhiên bao la',
  },
  {
    img: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=1920&auto=format&fit=crop',
    title: 'Trải Nghiệm 5 Sao',
    subtitle: 'Dịch vụ tận tâm từng chi tiết nhỏ nhất',
  },
];

export default function HomePage() {
  const [roomTypes, setRoomTypes] = useState([]);
  const [slide, setSlide] = useState(0);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('2');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState(null); // null = chưa tìm
  const [allRooms, setAllRooms] = useState([]);
  const timerRef = useRef(null);
  const resultsRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    roomApi.getRoomTypes().then(res => {
      const data = res.data?.data || res.data || [];
      setRoomTypes(Array.isArray(data) ? data.slice(0, 3) : []);
    }).catch(() => {});
    roomApi.getAllRooms().then(res => {
      const data = res.data?.data || [];
      setAllRooms(Array.isArray(data) ? data : []);
    }).catch(() => {});
    timerRef.current = setInterval(() => setSlide(s => (s + 1) % heroSlides.length), 5000);
    return () => clearInterval(timerRef.current);
  }, []);

  const handleSearch = async () => {
    if (!checkIn || !checkOut) {
      // Nếu chưa chọn ngày, navigate sang trang phòng
      navigate(`/rooms?guests=${guests}`);
      return;
    }
    setSearching(true);
    try {
      const guestsNum = parseInt(guests, 10);
      // Lọc phòng Available và đủ sức chứa
      const available = allRooms.filter(room =>
        room.status === 'Available' &&
        (room.roomType?.capacityAdults || 0) >= guestsNum
      );
      setSearchResults(available);
      // Scroll xuống kết quả
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const getPrimaryImage = (rt) => {
    const primary = rt.roomImages?.find(i => i.isPrimary) || rt.roomImages?.[0];
    if (primary?.imageUrl) {
      if (primary.imageUrl.startsWith('http')) return primary.imageUrl;
      return `${API_BASE}${primary.imageUrl}`;
    }
    return 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&q=80&w=1000';
  };

  return (
    <div>
      {/* ===== HERO ===== */}
      <section style={{ position: 'relative', height: '100vh', minHeight: 600, overflow: 'hidden' }}>
        {heroSlides.map((s, i) => (
          <div key={i} style={{
            position: 'absolute', inset: 0, transition: 'opacity 1.2s ease',
            opacity: i === slide ? 1 : 0, zIndex: i === slide ? 1 : 0,
          }}>
            <img src={s.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, rgba(13,27,42,0.7) 0%, rgba(13,27,42,0.4) 60%, rgba(13,27,42,0.3) 100%)' }} />
          </div>
        ))}

        <div style={{ position: 'relative', zIndex: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', padding: '0 20px', paddingTop: 72 }}>
          <div style={{ fontSize: 12, letterSpacing: '5px', color: GOLD, fontWeight: 600, marginBottom: 16, textTransform: 'uppercase' }}>
            ✦ Welcome to ThirtySix Resort ✦
          </div>
          <h1 style={{ color: '#fff', fontSize: 'clamp(36px, 6vw, 76px)', fontWeight: 800, lineHeight: 1.1, margin: '0 0 20px', maxWidth: 800 }}>
            {heroSlides[slide].title}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 'clamp(15px, 2vw, 20px)', maxWidth: 560, lineHeight: 1.7, marginBottom: 40 }}>
            {heroSlides[slide].subtitle}
          </p>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link to="/rooms">
              <button style={{ background: `linear-gradient(135deg, ${GOLD}, #E8C96B)`, border: 'none', borderRadius: 10, padding: '14px 36px', color: DARK, fontWeight: 700, fontSize: 16, cursor: 'pointer', boxShadow: '0 6px 20px rgba(201,168,76,0.4)', letterSpacing: '0.5px' }}>
                Khám Phá Phòng Ngay
              </button>
            </Link>
            <Link to="/services">
              <button style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 10, padding: '14px 36px', color: '#fff', fontWeight: 600, fontSize: 16, cursor: 'pointer', backdropFilter: 'blur(8px)' }}>
                Xem Dịch Vụ
              </button>
            </Link>
          </div>

          {/* Slide dots */}
          <div style={{ position: 'absolute', bottom: 32, display: 'flex', gap: 8 }}>
            {heroSlides.map((_, i) => (
              <button key={i} onClick={() => setSlide(i)} style={{ width: i === slide ? 28 : 8, height: 8, borderRadius: 4, background: i === slide ? GOLD : 'rgba(255,255,255,0.4)', border: 'none', cursor: 'pointer', transition: 'all 0.3s' }} />
            ))}
          </div>
        </div>
      </section>

      {/* ===== BOOKING SEARCH BAR ===== */}
      <section style={{ background: '#fff', boxShadow: '0 8px 40px rgba(0,0,0,0.12)', margin: '-1px 0 0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 5vw', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, letterSpacing: '2px', color: DARK, fontWeight: 700, marginBottom: 8 }}>NGÀY NHẬN PHÒNG</label>
            <input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)}
              style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '12px 14px', fontSize: 15, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, letterSpacing: '2px', color: DARK, fontWeight: 700, marginBottom: 8 }}>NGÀY TRẢ PHÒNG</label>
            <input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)}
              style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '12px 14px', fontSize: 15, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, letterSpacing: '2px', color: DARK, fontWeight: 700, marginBottom: 8 }}>SỐ KHÁCH</label>
            <select value={guests} onChange={e => setGuests(e.target.value)}
              style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '12px 14px', fontSize: 15, outline: 'none', background: '#fff', boxSizing: 'border-box' }}>
              {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} Khách</option>)}
            </select>
          </div>
          <button onClick={handleSearch} disabled={searching} style={{ background: `linear-gradient(135deg, ${GOLD}, #E8C96B)`, border: 'none', borderRadius: 10, padding: '14px 28px', color: DARK, fontWeight: 700, fontSize: 15, cursor: 'pointer', boxShadow: '0 4px 14px rgba(201,168,76,0.4)', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 8 }}>
            <SearchOutlined /> {searching ? 'Đang tìm...' : 'Tìm Phòng Trống'}
          </button>
        </div>
      </section>

      {/* ===== KẾT QUẢ TÌM KIẾM ===== */}
      {searchResults !== null && (
        <section ref={resultsRef} style={{ background: '#fff', padding: '48px 5vw', borderBottom: `3px solid ${GOLD}` }}>
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: DARK }}>
                  {searchResults.length > 0 ? `${searchResults.length} Phòng Trống Phù Hợp` : 'Không Tìm Thấy Phòng Trống'}
                </h2>
                <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 14 }}>
                  {checkIn && checkOut ? `${new Date(checkIn).toLocaleDateString('vi-VN')} → ${new Date(checkOut).toLocaleDateString('vi-VN')} • ${guests} khách` : `${guests} khách`}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setSearchResults(null)} style={{ background: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '10px 18px', color: '#374151', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                  Xóa Tìm Kiếm
                </button>
                <Link to={`/rooms?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`}>
                  <button style={{ background: DARK, border: 'none', borderRadius: 8, padding: '10px 18px', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                    Xem Tất Cả Phòng →
                  </button>
                </Link>
              </div>
            </div>

            {searchResults.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ fontSize: 56, marginBottom: 12 }}>🏨</div>
                <h3 style={{ color: DARK, fontWeight: 700, marginBottom: 8 }}>Không có phòng trống</h3>
                <p style={{ color: '#6b7280', marginBottom: 20 }}>Vui lòng thử ngày khác hoặc số khách khác</p>
                <Link to="/rooms"><button style={{ background: `linear-gradient(135deg, ${GOLD}, #E8C96B)`, border: 'none', borderRadius: 10, padding: '12px 28px', color: DARK, fontWeight: 700, cursor: 'pointer' }}>Xem Tất Cả Phòng</button></Link>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 22 }}>
                {searchResults.map(room => (
                  <div key={room.id} style={{ background: '#fff', borderRadius: 14, border: '1px solid #f0ebe0', boxShadow: '0 4px 16px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
                    <div style={{ background: `linear-gradient(135deg, ${DARK}, #1a2f4a)`, padding: '20px 20px 16px', color: '#fff' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: 11, color: GOLD, letterSpacing: '1px', fontWeight: 700, marginBottom: 4 }}>PHÒNG {room.roomNumber}</div>
                          <div style={{ fontSize: 18, fontWeight: 800 }}>{room.roomType?.name || 'Phòng Tiêu Chuẩn'}</div>
                        </div>
                        <div style={{ background: '#10b981', borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 700, color: '#fff' }}>Trống</div>
                      </div>
                      <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                          <TeamOutlined /> {room.roomType?.capacityAdults || 2} người lớn
                        </div>
                        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>Tầng {room.floor}</div>
                      </div>
                    </div>
                    <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ color: '#9ca3af', fontSize: 12 }}>Từ </span>
                        <span style={{ fontSize: 20, fontWeight: 800, color: GOLD }}>{(room.roomType?.basePrice || 0).toLocaleString('vi-VN')}</span>
                        <span style={{ color: '#9ca3af', fontSize: 12 }}> ₫/đêm</span>
                      </div>
                      <Link to={`/rooms?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}&roomId=${room.id}`}>
                        <button style={{ background: `linear-gradient(135deg, ${GOLD}, #E8C96B)`, border: 'none', borderRadius: 8, padding: '10px 20px', color: DARK, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                          Đặt Phòng
                        </button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ===== STATS ===== */}
      <section style={{ background: DARK, padding: '48px 5vw' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 32, textAlign: 'center' }}>
          {stats.map(s => (
            <div key={s.label}>
              <div style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 800, color: GOLD, lineHeight: 1 }}>{s.num}</div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 8, letterSpacing: '1px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== FEATURED ROOMS ===== */}
      <section style={{ padding: '80px 5vw', background: '#FAF7F2' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ fontSize: 12, letterSpacing: '4px', color: GOLD, fontWeight: 700, marginBottom: 12 }}>KHÔNG GIAN NGHỈ DƯỠNG</div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, color: DARK, margin: 0, lineHeight: 1.2 }}>Phòng & Villa Nổi Bật</h2>
            <p style={{ color: '#6b7280', fontSize: 16, marginTop: 14, maxWidth: 520, margin: '14px auto 0' }}>Mỗi không gian được thiết kế tinh tế, kết hợp nét đẹp truyền thống với tiện nghi hiện đại</p>
          </div>

          {roomTypes.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 28 }}>
              {roomTypes.map(rt => (
                <div key={rt.id} style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', transition: 'transform 0.3s, box-shadow 0.3s', cursor: 'pointer' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 16px 48px rgba(0,0,0,0.14)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.08)'; }}>
                  <div style={{ position: 'relative', height: 240, overflow: 'hidden' }}>
                    <img src={getPrimaryImage(rt)} alt={rt.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s' }}
                      onMouseEnter={e => e.target.style.transform = 'scale(1.06)'}
                      onMouseLeave={e => e.target.style.transform = 'scale(1)'} />
                    <div style={{ position: 'absolute', top: 16, right: 16, background: `linear-gradient(135deg, ${GOLD}, #E8C96B)`, borderRadius: 6, padding: '4px 12px', fontSize: 13, fontWeight: 700, color: DARK }}>
                      {rt.capacityAdults} Khách
                    </div>
                  </div>
                  <div style={{ padding: 24 }}>
                    <h3 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700, color: DARK }}>{rt.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 16 }}>
                      {[1,2,3,4,5].map(i => <StarFilled key={i} style={{ color: GOLD, fontSize: 12 }} />)}
                      <span style={{ color: '#6b7280', fontSize: 13, marginLeft: 4 }}>5.0</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <span style={{ color: '#9ca3af', fontSize: 13 }}>Từ </span>
                        <span style={{ fontSize: 22, fontWeight: 800, color: GOLD }}>{(rt.basePrice || 0).toLocaleString('vi-VN')}</span>
                        <span style={{ color: '#9ca3af', fontSize: 13 }}> ₫/đêm</span>
                      </div>
                      <Link to={`/rooms`}>
                        <button style={{ background: DARK, border: 'none', borderRadius: 8, padding: '10px 20px', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                          Đặt Ngay
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 28 }}>
              {[
                { name: 'Phòng Deluxe Biển', price: '2,500,000', img: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?q=80&w=800' },
                { name: 'Villa Garden View', price: '5,800,000', img: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=800' },
                { name: 'Suite Presidential', price: '12,000,000', img: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?q=80&w=800' },
              ].map(rt => (
                <div key={rt.name} style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
                  <div style={{ height: 240 }}><img src={rt.img} alt={rt.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
                  <div style={{ padding: 24 }}>
                    <h3 style={{ margin: '0 0 16px', fontSize: 20, fontWeight: 700, color: DARK }}>{rt.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 22, fontWeight: 800, color: GOLD }}>{rt.price} ₫/đêm</span>
                      <Link to="/rooms"><button style={{ background: DARK, border: 'none', borderRadius: 8, padding: '10px 20px', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Đặt Ngay</button></Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <Link to="/rooms">
              <button style={{ background: 'transparent', border: `2px solid ${GOLD}`, borderRadius: 10, padding: '14px 36px', color: DARK, fontWeight: 700, fontSize: 15, cursor: 'pointer', letterSpacing: '0.5px' }}>
                Xem Tất Cả Phòng & Villa <ArrowRightOutlined style={{ marginLeft: 8 }} />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section style={{ padding: '80px 5vw', background: '#fff' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ fontSize: 12, letterSpacing: '4px', color: GOLD, fontWeight: 700, marginBottom: 12 }}>TIỆN ÍCH CAO CẤP</div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, color: DARK, margin: 0 }}>Trải Nghiệm Đặc Quyền</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 28 }}>
            {features.map(f => (
              <div key={f.title} style={{ padding: 28, borderRadius: 16, border: '1px solid #f0ebe0', transition: 'all 0.3s', cursor: 'default' }}
                onMouseEnter={e => { e.currentTarget.style.background = DARK; e.currentTarget.style.borderColor = DARK; e.currentTarget.querySelector('.feat-title').style.color = GOLD; e.currentTarget.querySelector('.feat-desc').style.color = 'rgba(255,255,255,0.7)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#f0ebe0'; e.currentTarget.querySelector('.feat-title').style.color = DARK; e.currentTarget.querySelector('.feat-desc').style.color = '#6b7280'; }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>{f.icon}</div>
                <h3 className="feat-title" style={{ margin: '0 0 10px', fontSize: 18, fontWeight: 700, color: DARK, transition: 'color 0.3s' }}>{f.title}</h3>
                <p className="feat-desc" style={{ margin: 0, fontSize: 14, color: '#6b7280', lineHeight: 1.7, transition: 'color 0.3s' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== ABOUT / STORY ===== */}
      <section style={{ padding: '80px 5vw', background: '#FAF7F2' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }} className="about-grid">
          <div>
            <div style={{ fontSize: 12, letterSpacing: '4px', color: GOLD, fontWeight: 700, marginBottom: 14 }}>CÂU CHUYỆN CỦA CHÚNG TÔI</div>
            <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 42px)', fontWeight: 800, color: DARK, lineHeight: 1.2, margin: '0 0 24px' }}>Hơn 15 Năm Kiến Tạo<br />Những Kỳ Nghỉ Hoàn Hảo</h2>
            <p style={{ color: '#6b7280', fontSize: 15, lineHeight: 1.8, marginBottom: 24 }}>
              ThirtySix Resort ra đời từ khát vọng tạo ra một thiên đường nghỉ dưỡng thực sự — nơi con người được chữa lành, tái tạo năng lượng và sống trọn vẹn với từng khoảnh khắc.
            </p>
            <p style={{ color: '#6b7280', fontSize: 15, lineHeight: 1.8, marginBottom: 32 }}>
              Với đội ngũ hơn 200 nhân viên tận tâm và không gian xanh bao la, chúng tôi cam kết mang đến dịch vụ chuẩn 5 sao quốc tế, chạm đến từng cảm xúc của quý khách.
            </p>
            {['Thiết kế hài hòa với thiên nhiên', 'Nguyên liệu địa phương sạch và tươi ngon', 'Đội ngũ đào tạo chuẩn quốc tế'].map(t => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <CheckCircleFilled style={{ color: GOLD, fontSize: 16 }} />
                <span style={{ color: DARK, fontSize: 15, fontWeight: 500 }}>{t}</span>
              </div>
            ))}
          </div>
          <div style={{ position: 'relative' }}>
            <img src="https://images.unsplash.com/photo-1455587734955-081b22074882?q=80&w=800&auto=format&fit=crop" alt="Resort" style={{ width: '100%', borderRadius: 20, objectFit: 'cover', height: 480 }} />
            <div style={{ position: 'absolute', bottom: -24, left: -24, background: `linear-gradient(135deg, ${GOLD}, #E8C96B)`, borderRadius: 16, padding: '24px 28px', boxShadow: '0 12px 32px rgba(201,168,76,0.35)' }}>
              <div style={{ fontSize: 36, fontWeight: 800, color: DARK, lineHeight: 1 }}>4.9</div>
              <div style={{ color: DARK, fontWeight: 600, fontSize: 14, marginTop: 6 }}>★★★★★ Điểm Đánh Giá</div>
              <div style={{ color: 'rgba(13,27,42,0.7)', fontSize: 12, marginTop: 4 }}>Từ 1,200+ đánh giá</div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section style={{ position: 'relative', padding: '100px 5vw', overflow: 'hidden' }}>
        <img src="https://images.unsplash.com/photo-1540541338287-41700207dee6?q=80&w=1920&auto=format&fit=crop" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(13,27,42,0.9) 40%, rgba(13,27,42,0.5) 100%)' }} />
        <div style={{ position: 'relative', maxWidth: 650, padding: '0 20px' }}>
          <div style={{ fontSize: 12, letterSpacing: '4px', color: GOLD, fontWeight: 700, marginBottom: 14 }}>ĐẶT PHÒNG NGAY HÔM NAY</div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, color: '#fff', lineHeight: 1.2, margin: '0 0 20px' }}>Kỳ Nghỉ Hoàn Hảo Chỉ Cách Một Cú Click</h2>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 16, lineHeight: 1.7, marginBottom: 36 }}>Đặt phòng ngay và nhận ưu đãi chào mừng lên đến 20% cho lần đầu trải nghiệm tại ThirtySix Resort.</p>
          <Link to="/rooms">
            <button style={{ background: `linear-gradient(135deg, ${GOLD}, #E8C96B)`, border: 'none', borderRadius: 12, padding: '16px 40px', color: DARK, fontWeight: 800, fontSize: 17, cursor: 'pointer', boxShadow: '0 8px 24px rgba(201,168,76,0.4)', letterSpacing: '0.5px' }}>
              Đặt Phòng Ngay ✦
            </button>
          </Link>
        </div>
      </section>

      <style>{`
        @media (max-width: 768px) {
          .about-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

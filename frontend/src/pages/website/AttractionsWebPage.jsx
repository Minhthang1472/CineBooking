import React, { useEffect, useState } from 'react';
import { attractionApi } from '../../api/marketingApi';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5262';
const GOLD = '#C9A84C';
const DARK = '#0D1B2A';

const CATEGORY_ICONS = {
  'Bãi biển': '🏖️', 'Cầu': '🌉', 'Núi': '⛰️', 'Di tích': '🏛️',
  'Nhà hàng': '🍽️', 'Mua sắm': '🛍️', 'Vui chơi': '🎡', 'Khác': '📍',
  'Thiên nhiên': '🌿', 'Văn hoá': '🎭',
};

const CATEGORY_BG = {
  'Bãi biển': 'linear-gradient(135deg, #e0f2fe, #bae6fd)',
  'Cầu': 'linear-gradient(135deg, #ede9fe, #ddd6fe)',
  'Núi': 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
  'Di tích': 'linear-gradient(135deg, #fef3c7, #fde68a)',
  'Nhà hàng': 'linear-gradient(135deg, #fee2e2, #fecaca)',
  'Mua sắm': 'linear-gradient(135deg, #fce7f3, #fbcfe8)',
  'Vui chơi': 'linear-gradient(135deg, #fff7ed, #fed7aa)',
  'Thiên nhiên': 'linear-gradient(135deg, #f0fdf4, #bbf7d0)',
  'Văn hoá': 'linear-gradient(135deg, #fef9ee, #fde68a)',
  'Khác': 'linear-gradient(135deg, #f1f5f9, #e2e8f0)',
};

const getDistanceLabel = (km) => {
  const n = parseFloat(km);
  if (!n) return null;
  if (n < 1) return { text: `${Math.round(n * 1000)}m`, icon: '🚶', note: 'Đi bộ' };
  if (n < 5) return { text: `${n} km`, icon: '🚲', note: 'Xe đạp ~15 phút' };
  if (n < 20) return { text: `${n} km`, icon: '🚗', note: 'Xe máy ~30 phút' };
  return { text: `${n} km`, icon: '🚌', note: 'Xe khách / tour' };
};

export default function AttractionsWebPage() {
  const [attractions, setAttractions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCat, setSelectedCat] = useState('all');
  const [selectedAttr, setSelectedAttr] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    attractionApi.getAllAttractions()
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : [];
        setAttractions(data);
      })
      .catch(err => {
        console.error('[AttractionsWebPage] Lỗi:', err);
        setError('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
      })
      .finally(() => setLoading(false));
  }, []);

  // Chuan hoa category: neu null/empty thi gan la 'Khac'
  const normalizedAttractions = attractions.map(a => ({
    ...a,
    category: a.category?.trim() || 'Khac',
  }));

  // Lay tat ca categories tu du lieu (loai tru 'all')
  const allCats = [...new Set(normalizedAttractions.map(a => a.category))];
  // Sap xep: dua 'Khac' xuong cuoi
  const sortedCats = allCats.filter(c => c !== 'Khac').sort();
  if (allCats.includes('Khac')) sortedCats.push('Khac');
  const categories = ['all', ...sortedCats];

  // Dem so luong moi category
  const catCount = normalizedAttractions.reduce((acc, a) => {
    acc[a.category] = (acc[a.category] || 0) + 1;
    return acc;
  }, {});

  const filtered = selectedCat === 'all'
    ? normalizedAttractions
    : normalizedAttractions.filter(a => a.category === selectedCat);

  const extractSrc = (html) => {
    if (!html) return '';
    if (html.includes('<iframe') && html.includes('src="')) {
      const m = html.match(/src="([^"]+)"/);
      return m ? m[1] : html;
    }
    return html;
  };

  return (
    <div style={{ paddingTop: 72, minHeight: '100vh', background: '#FAF7F2' }}>
      {/* Hero */}
      <section style={{ position: 'relative', height: 380, overflow: 'hidden' }}>
        <img
          src="https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=1920&auto=format&fit=crop"
          alt="Đà Nẵng"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(13,27,42,0.5), rgba(13,27,42,0.87))' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 20px' }}>
          <div style={{ fontSize: 11, letterSpacing: '4px', color: GOLD, fontWeight: 700, marginBottom: 12 }}>KHÁM PHÁ XUNG QUANH</div>
          <h1 style={{ color: '#fff', fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 800, margin: '0 0 12px', lineHeight: 1.1 }}>
            Địa Điểm Lân Cận
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 15, maxWidth: 540 }}>
            Khám phá những địa điểm tham quan, ẩm thực và vui chơi giải trí tuyệt vời xung quanh ThirtySix Resort
          </p>
        </div>

        {/* Stats bar chỉ hiện nếu có dữ liệu */}
        {attractions.length > 0 && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
            {attractions.slice(0, 4).map((a, i) => {
              const dist = getDistanceLabel(a.distanceKm);
              return (
                <div key={i} style={{
                  flex: 1, padding: '14px 10px', textAlign: 'center',
                  background: 'rgba(13,27,42,0.75)', backdropFilter: 'blur(8px)',
                  borderRight: i < 3 ? '1px solid rgba(255,255,255,0.1)' : 'none',
                }}>
                  <div style={{ fontSize: 18, marginBottom: 2 }}>{CATEGORY_ICONS[a.category] || '📍'}</div>
                  <div style={{ color: GOLD, fontWeight: 800, fontSize: 14 }}>{dist ? dist.text : '—'}</div>
                  <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.name}</div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section style={{ padding: '48px 5vw', maxWidth: 1200, margin: '0 auto' }}>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🗺️</div>
            <p style={{ color: '#9ca3af', fontSize: 16 }}>Đang tải địa điểm từ hệ thống...</p>
          </div>
        )}

        {/* Lỗi */}
        {!loading && error && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
            <p style={{ color: '#ef4444', fontWeight: 600, marginBottom: 8 }}>{error}</p>
            <button onClick={() => window.location.reload()} style={{ background: GOLD, border: 'none', borderRadius: 8, padding: '10px 24px', color: DARK, fontWeight: 700, cursor: 'pointer' }}>
              Thử Lại
            </button>
          </div>
        )}

        {/* Không có dữ liệu */}
        {!loading && !error && attractions.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🗺️</div>
            <h3 style={{ color: DARK, fontWeight: 700, marginBottom: 8 }}>Chưa có địa điểm nào</h3>
            <p style={{ color: '#9ca3af', fontSize: 14 }}>Quản trị viên chưa thêm địa điểm. Hãy quay lại sau!</p>
          </div>
        )}

        {/* Có dữ liệu */}
        {!loading && !error && attractions.length > 0 && (
          <>
            {/* Category Filter */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 36, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ color: '#6b7280', fontSize: 13, fontWeight: 600, marginRight: 4 }}>Loc theo:</span>
              {categories.map(cat => {
                const isAll = cat === 'all';
                const isActive = selectedCat === cat;
                const count = isAll ? normalizedAttractions.length : (catCount[cat] || 0);
                const icon = CATEGORY_ICONS[cat] || (isAll ? '' : '');
                const label = isAll ? 'Tat Ca' : cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCat(cat)}
                    style={{
                      padding: '8px 18px', borderRadius: 30, border: 'none', cursor: 'pointer',
                      fontWeight: 600, fontSize: 13, transition: 'all 0.2s',
                      background: isActive
                        ? `linear-gradient(135deg, ${GOLD}, #E8C96B)`
                        : '#fff',
                      color: isActive ? DARK : '#6b7280',
                      boxShadow: isActive
                        ? '0 4px 14px rgba(201,168,76,0.35)'
                        : '0 1px 4px rgba(0,0,0,0.08)',
                      transform: isActive ? 'translateY(-1px)' : 'none',
                    }}
                  >
                    {icon && <span style={{ marginRight: 4 }}>{icon}</span>}
                    {label}
                    <span style={{
                      marginLeft: 6, fontSize: 11,
                      background: isActive ? 'rgba(0,0,0,0.12)' : '#f3f4f6',
                      color: isActive ? DARK : '#9ca3af',
                      borderRadius: 10, padding: '1px 7px', fontWeight: 700,
                    }}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>Không có địa điểm trong danh mục này</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
                {filtered.map(item => {
                  const dist = getDistanceLabel(item.distanceKm);
                  const catBg = CATEGORY_BG[item.category] || CATEGORY_BG['Khác'];
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedAttr(item)}
                      style={{
                        background: '#fff', borderRadius: 20, overflow: 'hidden',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.07)', cursor: 'pointer',
                        transition: 'transform 0.3s, box-shadow 0.3s',
                        display: 'flex', flexDirection: 'column',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 20px 48px rgba(0,0,0,0.13)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.07)'; }}
                    >
                      {/* Anh Cloudinary hoac emoji fallback */}
                      {item.imageUrl ? (
                        <div style={{ position: 'relative', height: 180, overflow: 'hidden' }}>
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          {/* Overlay gradient */}
                          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0) 50%, rgba(0,0,0,0.55))' }} />
                          {/* Category badge */}
                          {item.category && (
                            <span style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(0,0,0,0.55)', borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 700, color: '#fff', backdropFilter: 'blur(4px)' }}>
                              {CATEGORY_ICONS[item.category] || ''} {item.category}
                            </span>
                          )}
                          <h3 style={{ position: 'absolute', bottom: 12, left: 16, right: 16, margin: 0, color: '#fff', fontSize: 16, fontWeight: 800, lineHeight: 1.2 }}>{item.name}</h3>
                        </div>
                      ) : (
                        <div style={{ background: catBg, padding: '28px 24px 20px', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                          <div style={{ fontSize: 44, lineHeight: 1, flexShrink: 0 }}>
                            {CATEGORY_ICONS[item.category] || '📍'}
                          </div>
                          <div>
                            <h3 style={{ margin: '0 0 6px', color: DARK, fontSize: 17, fontWeight: 800, lineHeight: 1.2 }}>{item.name}</h3>
                            {item.category && (
                              <span style={{ display: 'inline-block', background: 'rgba(255,255,255,0.7)', borderRadius: 5, padding: '2px 10px', fontSize: 11, fontWeight: 700, color: '#374151' }}>
                                {item.category}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <div style={{ padding: '16px 22px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        {item.description && (
                          <p style={{ color: '#6b7280', fontSize: 13, lineHeight: 1.65, marginBottom: 16, flex: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {item.description}
                          </p>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f3f4f6', paddingTop: 14 }}>
                          {dist ? (
                            <span style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '5px 12px', fontSize: 13, fontWeight: 700, color: '#059669', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                              📍 {dist.icon} {dist.text}
                            </span>
                          ) : <span />}
                          <span style={{ color: GOLD, fontWeight: 700, fontSize: 12 }}>Xem chi tiết →</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Travel Tips */}
            <div style={{ marginTop: 56 }}>
              <h2 style={{ color: DARK, fontSize: 24, fontWeight: 800, marginBottom: 4 }}>💡 Mẹo Di Chuyển</h2>
              <p style={{ color: '#6b7280', marginBottom: 24 }}>Từ ThirtySix Resort & Spa đến các địa điểm xung quanh</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                {[
                  { icon: '🚶', title: 'Đi Bộ', desc: 'Phù hợp với các địa điểm trong bán kính 1km', color: '#f0fdf4', border: '#bbf7d0', text: '#059669' },
                  { icon: '🛵', title: 'Thuê Xe Máy', desc: 'Tự do khám phá trong bán kính 20km, ~100k/ngày', color: '#fff7ed', border: '#fed7aa', text: '#d97706' },
                  { icon: '🚌', title: 'Xe Tour', desc: 'Hỏi Concierge để đặt tour trọn gói Bà Nà, Hội An', color: '#eff6ff', border: '#bfdbfe', text: '#2563eb' },
                  { icon: '🚖', title: 'Taxi / Grab', desc: 'Tiện lợi, an toàn cho các chuyến đi về đêm', color: '#fdf4ff', border: '#e9d5ff', text: '#7c3aed' },
                ].map((tip, i) => (
                  <div key={i} style={{ background: tip.color, border: `1px solid ${tip.border}`, borderRadius: 14, padding: '18px 20px' }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>{tip.icon}</div>
                    <div style={{ fontWeight: 700, color: tip.text, marginBottom: 4, fontSize: 14 }}>{tip.title}</div>
                    <div style={{ color: '#6b7280', fontSize: 12, lineHeight: 1.5 }}>{tip.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </section>

      {/* Detail Modal */}
      {selectedAttr && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setSelectedAttr(null); }}
        >
          <div style={{ background: '#fff', borderRadius: 20, maxWidth: 560, width: '100%', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}>
            <div style={{
              background: CATEGORY_BG[selectedAttr.category] || 'linear-gradient(135deg,#f1f5f9,#e2e8f0)',
              padding: selectedAttr.imageUrl ? 0 : '32px 32px 24px',
              position: 'relative', borderRadius: '20px 20px 0 0', overflow: 'hidden',
            }}>
              <button
                onClick={() => setSelectedAttr(null)}
                style={{ position: 'absolute', top: 16, right: 16, zIndex: 2, width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,0,0,0.35)', border: 'none', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}
              >X</button>
              {selectedAttr.imageUrl ? (
                <div style={{ position: 'relative', height: 200 }}>
                  <img
                    src={selectedAttr.imageUrl}
                    alt={selectedAttr.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(13,27,42,0.7))' }} />
                  <h2 style={{ position: 'absolute', bottom: 16, left: 24, right: 24, margin: 0, color: '#fff', fontSize: 22, fontWeight: 800 }}>{selectedAttr.name}</h2>
                </div>
              ) : (
                <div style={{ padding: '32px 32px 24px' }}>
                  <div style={{ fontSize: 56, marginBottom: 12 }}>{CATEGORY_ICONS[selectedAttr.category] || '📍'}</div>
                  <h2 style={{ margin: '0 0 8px', color: DARK, fontSize: 22, fontWeight: 800 }}>{selectedAttr.name}</h2>
                  {selectedAttr.category && (
                    <span style={{ background: 'rgba(255,255,255,0.7)', borderRadius: 6, padding: '3px 12px', fontSize: 12, fontWeight: 700, color: '#374151' }}>
                      {selectedAttr.category}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div style={{ padding: '24px 32px 32px' }}>
              {selectedAttr.distanceKm && (() => {
                const dist = getDistanceLabel(selectedAttr.distanceKm);
                if (!dist) return null;
                return (
                  <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                    <span style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 700, color: '#059669' }}>
                      📍 {dist.icon} {dist.text} từ khách sạn
                    </span>
                    <span style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '8px 16px', fontSize: 12, color: '#2563eb', fontWeight: 600 }}>
                      ⏱ {dist.note}
                    </span>
                  </div>
                );
              })()}

              {selectedAttr.description && (
                <p style={{ color: '#374151', fontSize: 14, lineHeight: 1.8, marginBottom: 20 }}>{selectedAttr.description}</p>
              )}

              {/* Google Map Embed */}
              {selectedAttr.mapEmbedLink && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontWeight: 700, color: DARK, marginBottom: 10, fontSize: 14 }}>📍 Bản Đồ</div>
                  <iframe
                    src={extractSrc(selectedAttr.mapEmbedLink)}
                    width="100%" height="240"
                    style={{ border: 0, borderRadius: 12 }}
                    allowFullScreen loading="lazy"
                    title={selectedAttr.name}
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <a href="/rooms" style={{ flex: 1 }}>
                  <button style={{ width: '100%', background: `linear-gradient(135deg, ${GOLD}, #E8C96B)`, border: 'none', borderRadius: 10, padding: '12px', color: DARK, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                    🏨 Đặt Phòng Gần Đây
                  </button>
                </a>
                <button onClick={() => setSelectedAttr(null)} style={{ background: '#f3f4f6', border: 'none', borderRadius: 10, padding: '12px 20px', color: '#6b7280', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

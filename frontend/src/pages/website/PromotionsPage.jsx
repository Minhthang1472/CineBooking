import React, { useEffect, useState } from 'react';
import { message } from 'antd';
import { TagOutlined, CopyOutlined, CheckOutlined, GiftOutlined, ClockCircleOutlined, FireOutlined, CrownOutlined, LockOutlined } from '@ant-design/icons';
import axiosClient from '../../api/axiosClient';
import { useAuthStore } from '../../store/authStore';

const GOLD = '#C9A84C';
const DARK = '#0D1B2A';

const mockVouchers = [
  {
    id: 1,
    code: 'WELCOME20',
    discountType: 'Percentage',
    discountValue: 20,
    minBookingValue: 2000000,
    validFrom: '2026-01-01T00:00:00Z',
    validTo: '2026-12-31T00:00:00Z',
    usageLimit: 500,
    tag: 'Khách Mới',
    tagColor: '#10b981',
    description: 'Ưu đãi đặc biệt dành cho khách hàng lần đầu trải nghiệm ThirtySix Resort. Giảm ngay 20% tổng hóa đơn đặt phòng.',
    icon: '🎉',
    highlight: true,
  },
  {
    id: 2,
    code: 'SUMMER30',
    discountType: 'Percentage',
    discountValue: 30,
    minBookingValue: 5000000,
    validFrom: '2026-06-01T00:00:00Z',
    validTo: '2026-08-31T00:00:00Z',
    usageLimit: 200,
    tag: 'Mùa Hè',
    tagColor: '#f59e0b',
    description: 'Chào hè với ưu đãi lớn nhất trong năm! Giảm 30% khi đặt phòng từ tháng 6 đến tháng 8 năm 2026.',
    icon: '☀️',
    highlight: false,
  },
  {
    id: 3,
    code: 'LUXURY500K',
    discountType: 'FixedAmount',
    discountValue: 500000,
    minBookingValue: 3000000,
    validFrom: '2026-01-01T00:00:00Z',
    validTo: '2026-12-31T00:00:00Z',
    usageLimit: 1000,
    tag: 'Phổ Biến',
    tagColor: '#3b82f6',
    description: 'Giảm cố định 500,000₫ cho mọi đơn đặt phòng từ 3 triệu trở lên. Không giới hạn loại phòng.',
    icon: '💎',
    highlight: false,
  },
  {
    id: 4,
    code: 'COUPLE15',
    discountType: 'Percentage',
    discountValue: 15,
    minBookingValue: 4000000,
    validFrom: '2026-01-01T00:00:00Z',
    validTo: '2026-12-31T00:00:00Z',
    usageLimit: 300,
    tag: 'Cặp Đôi',
    tagColor: '#ec4899',
    description: 'Gói ưu đãi lãng mạn dành riêng cho các cặp đôi. Tận hưởng kỳ nghỉ trăng mật với giá cực ưu đãi.',
    icon: '💑',
    highlight: false,
  },
  {
    id: 5,
    code: 'FAMILY25',
    discountType: 'Percentage',
    discountValue: 25,
    minBookingValue: 6000000,
    validFrom: '2026-04-01T00:00:00Z',
    validTo: '2026-09-30T00:00:00Z',
    usageLimit: 150,
    tag: 'Gia Đình',
    tagColor: '#8b5cf6',
    description: 'Gói gia đình siêu tiết kiệm! Đặt phòng từ 6 triệu trở lên, giảm ngay 25% cho kỳ nghỉ cùng gia đình.',
    icon: '👨‍👩‍👧‍👦',
    highlight: false,
  },
  {
    id: 6,
    code: 'VIP1000K',
    discountType: 'FixedAmount',
    discountValue: 1000000,
    minBookingValue: 8000000,
    validFrom: '2026-01-01T00:00:00Z',
    validTo: '2026-12-31T00:00:00Z',
    usageLimit: 100,
    tag: 'VIP',
    tagColor: '#ef4444',
    description: 'Ưu đãi VIP độc quyền — giảm thẳng 1,000,000₫ cho đơn đặt Villa từ 8 triệu trở lên. Số lượng có hạn!',
    icon: '👑',
    highlight: true,
  },
];

const categoryFilters = [
  { key: 'all', label: 'Tất Cả' },
  { key: 'Percentage', label: 'Giảm Theo %' },
  { key: 'FixedAmount', label: 'Giảm Cố Định' },
];

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const isExpired = (v) => v.validTo && new Date(v.validTo) < new Date();
const isNew = (v) => v.validFrom && (new Date() - new Date(v.validFrom)) < 30 * 86400000;

export default function PromotionsPage() {
  const [vouchers, setVouchers] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [copiedCode, setCopiedCode] = useState('');
  const [searchCode, setSearchCode] = useState('');
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const { token, user } = useAuthStore();

  useEffect(() => {
    Promise.all([
      axiosClient.get('/Vouchers').catch(() => ({ data: [] })),
      axiosClient.get('/Memberships').catch(() => ({ data: [] })),
    ]).then(([vRes, mRes]) => {
      const data = Array.isArray(vRes.data) ? vRes.data : [];
      if (data.length > 0) {
        const enriched = data.map((v, i) => ({
          ...v,
          description: mockVouchers[i % mockVouchers.length]?.description || 'Ưu đãi đặc biệt từ ThirtySix Resort.',
          icon: mockVouchers[i % mockVouchers.length]?.icon || '🎁',
          tag: mockVouchers[i % mockVouchers.length]?.tag || 'Ưu Đãi',
          tagColor: mockVouchers[i % mockVouchers.length]?.tagColor || GOLD,
          highlight: i < 2,
        }));
        setVouchers(enriched);
      } else {
        setVouchers(mockVouchers);
      }
      setMemberships(Array.isArray(mRes.data) ? mRes.data : []);
    }).finally(() => setLoading(false));
  }, []);

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code);
      message.success(`Đã sao chép mã: ${code}`);
      setTimeout(() => setCopiedCode(''), 2500);
    });
  };

  const handleVerify = () => {
    if (!searchCode.trim()) {
      message.warning('Vui lòng nhập mã voucher để kiểm tra!');
      return;
    }
    setVerifying(true);
    setTimeout(() => {
      const found = vouchers.find(v => v.code.toUpperCase() === searchCode.trim().toUpperCase());
      if (found) {
        if (isExpired(found)) {
          setVerifyResult({ valid: false, msg: 'Mã voucher này đã hết hạn sử dụng.' });
        } else {
          setVerifyResult({ valid: true, voucher: found });
        }
      } else {
        setVerifyResult({ valid: false, msg: 'Mã voucher không tồn tại hoặc không hợp lệ.' });
      }
      setVerifying(false);
    }, 800);
  };

  const displayVouchers = vouchers.filter(v => filter === 'all' || v.discountType === filter);
  const highlighted = displayVouchers.filter(v => v.highlight);
  const regular = displayVouchers.filter(v => !v.highlight);

  const formatDiscount = (v) => {
    if (v.discountType === 'Percentage') return `-${v.discountValue}%`;
    return `-${(v.discountValue || 0).toLocaleString('vi-VN')}₫`;
  };

  return (
    <div style={{ paddingTop: 72, minHeight: '100vh', background: '#FAF7F2' }}>
      {/* Hero */}
      <section style={{ position: 'relative', height: 420, overflow: 'hidden' }}>
        <img
          src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1920&auto=format&fit=crop"
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(13,27,42,0.9) 0%, rgba(13,27,42,0.6) 60%, rgba(201,168,76,0.3) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 20px' }}>
          <div style={{ fontSize: 12, letterSpacing: '5px', color: GOLD, fontWeight: 700, marginBottom: 14 }}>
            ✦ ƯU ĐÃI ĐẶC BIỆT ✦
          </div>
          <h1 style={{ color: '#fff', fontSize: 'clamp(30px, 5vw, 58px)', fontWeight: 800, margin: '0 0 14px', lineHeight: 1.1 }}>
            Khuyến Mãi & Voucher
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16, maxWidth: 540, lineHeight: 1.7, marginBottom: 28 }}>
            Săn ngay những ưu đãi hấp dẫn nhất — tiết kiệm lên đến 30% cho kỳ nghỉ dưỡng trong mơ của bạn
          </p>
          {/* Verify box */}
          <div style={{ display: 'flex', gap: 10, maxWidth: 480, width: '100%', flexWrap: 'wrap', justifyContent: 'center' }}>
            <input
              value={searchCode}
              onChange={e => { setSearchCode(e.target.value.toUpperCase()); setVerifyResult(null); }}
              onKeyDown={e => e.key === 'Enter' && handleVerify()}
              placeholder="Nhập mã voucher để kiểm tra..."
              style={{
                flex: 1, minWidth: 200, border: `2px solid ${GOLD}`, borderRadius: 10,
                padding: '13px 18px', fontSize: 15, outline: 'none', background: 'rgba(255,255,255,0.95)',
                fontWeight: 600, letterSpacing: '1px', boxSizing: 'border-box',
              }}
            />
            <button
              onClick={handleVerify}
              disabled={verifying}
              style={{
                background: `linear-gradient(135deg, ${GOLD}, #E8C96B)`, border: 'none',
                borderRadius: 10, padding: '13px 24px', color: DARK, fontWeight: 700,
                fontSize: 15, cursor: 'pointer', boxShadow: '0 4px 14px rgba(201,168,76,0.4)', whiteSpace: 'nowrap',
              }}
            >
              {verifying ? '...' : <><TagOutlined /> Kiểm Tra</>}
            </button>
          </div>

          {/* Verify result */}
          {verifyResult && (
            <div style={{
              marginTop: 14, padding: '12px 20px', borderRadius: 10, maxWidth: 460,
              background: verifyResult.valid ? 'rgba(16,185,129,0.9)' : 'rgba(239,68,68,0.85)',
              color: '#fff', fontWeight: 600, fontSize: 14, backdropFilter: 'blur(8px)',
            }}>
              {verifyResult.valid ? (
                <span>
                  ✓ Mã hợp lệ! <strong>{verifyResult.voucher.code}</strong> — Giảm <strong>{formatDiscount(verifyResult.voucher)}</strong>
                  {verifyResult.voucher.minBookingValue > 0 && ` (Đơn từ ${(verifyResult.voucher.minBookingValue).toLocaleString('vi-VN')}₫)`}
                </span>
              ) : (
                <span>✗ {verifyResult.msg}</span>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Stats bar */}
      <section style={{ background: DARK, padding: '24px 5vw' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 20, textAlign: 'center' }}>
          {[
            { icon: <GiftOutlined />, num: `${vouchers.length}+`, label: 'Mã Khuyến Mãi' },
            { icon: <FireOutlined />, num: 'Đến 30%', label: 'Giảm Tối Đa' },
            { icon: <ClockCircleOutlined />, num: '24/7', label: 'Hỗ Trợ Áp Dụng' },
            { icon: <TagOutlined />, num: '100%', label: 'Miễn Phí Sử Dụng' },
          ].map(s => (
            <div key={s.label}>
              <div style={{ color: GOLD, fontSize: 22, marginBottom: 4 }}>{s.icon}</div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 20 }}>{s.num}</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, letterSpacing: '0.5px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== VOUCHER THEO HẠNG THÀNH VIÊN ===== */}
      <section style={{ background: '#fff', padding: '56px 5vw', borderBottom: `3px solid ${GOLD}30` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ fontSize: 12, letterSpacing: '4px', color: GOLD, fontWeight: 700, marginBottom: 10 }}>ƯU ĐÃI THÀNH VIÊN</div>
            <h2 style={{ margin: 0, fontSize: 'clamp(22px, 3vw, 36px)', fontWeight: 800, color: DARK }}>Đặc Quyền Theo Hạng Thành Viên</h2>
            <p style={{ color: '#6b7280', fontSize: 15, marginTop: 10 }}>
              Hạng thành viên càng cao, ưu đãi càng lớn. {!token && <span>Hãy <a href="/website-login" style={{ color: GOLD, fontWeight: 700 }}>đăng nhập</a> để xem ưu đãi của bạn.</span>}
            </p>
          </div>

          {memberships.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
              {memberships.map((tier, idx) => {
                const tierStyles = [
                  { color: '#cd7f32', bg: 'linear-gradient(135deg, #fdf3e7, #fce8c0)', icon: '🥉', border: '#cd7f3240' },
                  { color: '#9ca3af', bg: 'linear-gradient(135deg, #f9fafb, #e5e7eb)', icon: '🥈', border: '#9ca3af40' },
                  { color: GOLD,      bg: `linear-gradient(135deg, #fef9ee, #fde68a)`, icon: '🥇', border: `${GOLD}40` },
                  { color: '#8b5cf6', bg: 'linear-gradient(135deg, #f5f3ff, #ddd6fe)', icon: '💎', border: '#8b5cf640' },
                ][idx % 4];
                return (
                  <div key={tier.id} style={{
                    background: tierStyles.bg, borderRadius: 18,
                    border: `2px solid ${tierStyles.border}`,
                    padding: '24px 20px', textAlign: 'center',
                    position: 'relative', overflow: 'hidden',
                  }}>
                    <div style={{ fontSize: 44, marginBottom: 8 }}>{tierStyles.icon}</div>
                    <div style={{ fontWeight: 800, fontSize: 20, color: tierStyles.color, marginBottom: 4 }}>{tier.tierName}</div>
                    <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
                      Từ {(tier.minPoints || 0).toLocaleString('vi-VN')} điểm
                    </div>
                    <div style={{
                      background: tierStyles.color, color: '#fff',
                      borderRadius: 10, padding: '10px 14px', fontWeight: 800, fontSize: 22,
                      marginBottom: 12,
                    }}>
                      -{tier.discountPercent || 0}%
                    </div>
                    <div style={{ fontSize: 13, color: '#374151', fontWeight: 600, marginBottom: 8 }}>
                      Giảm giá mọi đặt phòng
                    </div>
                    {tier.description && (
                      <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6, marginTop: 8 }}>
                        {tier.description}
                      </div>
                    )}
                    {token && (
                      <div style={{ marginTop: 14, fontSize: 12, color: tierStyles.color, fontWeight: 700, background: 'rgba(255,255,255,0.6)', borderRadius: 6, padding: '4px 10px' }}>
                        Ưu đãi áp dụng tự động khi đặt phòng
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* Fallback khi không có data từ API */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
              {[
                { name: 'Đồng', icon: '🥉', color: '#cd7f32', bg: 'linear-gradient(135deg, #fdf3e7, #fce8c0)', pts: '0', pct: 5 },
                { name: 'Bạc',  icon: '🥈', color: '#9ca3af', bg: 'linear-gradient(135deg, #f9fafb, #e5e7eb)', pts: '1,000', pct: 10 },
                { name: 'Vàng', icon: '🥇', color: GOLD,      bg: `linear-gradient(135deg, #fef9ee, #fde68a)`, pts: '5,000', pct: 15 },
                { name: 'Bạch Kim', icon: '💎', color: '#8b5cf6', bg: 'linear-gradient(135deg, #f5f3ff, #ddd6fe)', pts: '15,000', pct: 25 },
              ].map(t => (
                <div key={t.name} style={{ background: t.bg, borderRadius: 18, border: `2px solid ${t.color}40`, padding: '24px 20px', textAlign: 'center' }}>
                  <div style={{ fontSize: 44, marginBottom: 8 }}>{t.icon}</div>
                  <div style={{ fontWeight: 800, fontSize: 20, color: t.color, marginBottom: 4 }}>Hạng {t.name}</div>
                  <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>Từ {t.pts} điểm</div>
                  <div style={{ background: t.color, color: '#fff', borderRadius: 10, padding: '10px 14px', fontWeight: 800, fontSize: 22, marginBottom: 10 }}>
                    -{t.pct}%
                  </div>
                  <div style={{ fontSize: 13, color: '#374151', fontWeight: 600 }}>Giảm giá mọi đặt phòng</div>
                </div>
              ))}
            </div>
          )}

          {!token && (
            <div style={{ textAlign: 'center', marginTop: 32 }}>
              <a href="/website-login">
                <button style={{ background: `linear-gradient(135deg, ${GOLD}, #E8C96B)`, border: 'none', borderRadius: 12, padding: '14px 36px', color: DARK, fontWeight: 700, fontSize: 15, cursor: 'pointer', boxShadow: '0 4px 14px rgba(201,168,76,0.35)' }}>
                  <CrownOutlined style={{ marginRight: 8 }} />Đăng Nhập Để Nhận Ưu Đãi
                </button>
              </a>
            </div>
          )}
        </div>
      </section>

      {/* Main content */}
      <section style={{ padding: '56px 5vw', maxWidth: 1200, margin: '0 auto' }}>
        {/* Filter */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 40 }}>
          <div>
            <div style={{ fontSize: 12, letterSpacing: '4px', color: GOLD, fontWeight: 700, marginBottom: 6 }}>DANH SÁCH ƯU ĐÃI</div>
            <h2 style={{ margin: 0, fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 800, color: DARK }}>Tất Cả Voucher Hiện Hành</h2>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {categoryFilters.map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)} style={{
                padding: '9px 18px', borderRadius: 24,
                background: filter === f.key ? `linear-gradient(135deg, ${GOLD}, #E8C96B)` : '#fff',
                border: filter === f.key ? 'none' : '1.5px solid #e5e7eb',
                color: filter === f.key ? DARK : '#374151', fontWeight: 600, fontSize: 13,
                cursor: 'pointer', boxShadow: filter === f.key ? '0 4px 14px rgba(201,168,76,0.3)' : 'none',
              }}>{f.label}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#9ca3af', fontSize: 16 }}>Đang tải voucher...</div>
        ) : (
          <>
            {/* Highlighted vouchers */}
            {highlighted.length > 0 && (
              <div style={{ marginBottom: 40 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                  <FireOutlined style={{ color: '#ef4444', fontSize: 18 }} />
                  <span style={{ fontWeight: 700, color: DARK, fontSize: 16, letterSpacing: '0.5px' }}>NỔI BẬT NHẤT</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))', gap: 20 }}>
                  {highlighted.map(v => <VoucherCard key={v.id} v={v} copiedCode={copiedCode} onCopy={handleCopy} formatDiscount={formatDiscount} featured />)}
                </div>
              </div>
            )}

            {/* Regular vouchers */}
            {regular.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 20 }}>
                {regular.map(v => <VoucherCard key={v.id} v={v} copiedCode={copiedCode} onCopy={handleCopy} formatDiscount={formatDiscount} />)}
              </div>
            )}

            {displayVouchers.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af', fontSize: 16 }}>
                Không có voucher nào phù hợp.
              </div>
            )}
          </>
        )}
      </section>

      {/* How to use */}
      <section style={{ background: '#fff', padding: '72px 5vw' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontSize: 12, letterSpacing: '4px', color: GOLD, fontWeight: 700, marginBottom: 12 }}>HƯỚNG DẪN SỬ DỤNG</div>
            <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 38px)', fontWeight: 800, color: DARK, margin: 0 }}>Cách Áp Dụng Voucher</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 32 }}>
            {[
              { step: '01', icon: '🔍', title: 'Chọn Voucher', desc: 'Duyệt qua danh sách voucher và chọn mã phù hợp với đơn đặt phòng của bạn.' },
              { step: '02', icon: '📋', title: 'Sao Chép Mã', desc: 'Nhấn nút "Sao Chép" để lấy mã voucher. Mã sẽ tự động lưu vào clipboard.' },
              { step: '03', icon: '🏨', title: 'Đặt Phòng', desc: 'Chuyển đến trang Phòng & Villa, chọn phòng mong muốn và tiến hành đặt phòng.' },
              { step: '04', icon: '✅', title: 'Nhận Ưu Đãi', desc: 'Nhập mã voucher khi thanh toán. Ưu đãi sẽ được áp dụng ngay lập tức!' },
            ].map(s => (
              <div key={s.step} style={{ position: 'relative', padding: '28px 24px', borderRadius: 16, border: '1px solid #f0ebe0', textAlign: 'center', transition: 'all 0.3s' }}
                onMouseEnter={e => { e.currentTarget.style.background = DARK; e.currentTarget.style.borderColor = DARK; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#f0ebe0'; }}>
                <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: `linear-gradient(135deg, ${GOLD}, #E8C96B)`, borderRadius: 8, padding: '4px 12px', fontSize: 11, fontWeight: 800, color: DARK, letterSpacing: '1px' }}>
                  BƯỚC {s.step}
                </div>
                <div style={{ fontSize: 44, marginBottom: 14, marginTop: 8 }}>{s.icon}</div>
                <h3 style={{ margin: '0 0 10px', fontSize: 17, fontWeight: 700, color: 'inherit' }}>{s.title}</h3>
                <p style={{ margin: 0, fontSize: 14, color: 'inherit', lineHeight: 1.7, opacity: 0.75 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Terms */}
      <section style={{ background: '#FAF7F2', padding: '56px 5vw' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 12, letterSpacing: '4px', color: GOLD, fontWeight: 700, marginBottom: 12 }}>ĐIỀU KHOẢN</div>
            <h2 style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 800, color: DARK, margin: 0 }}>Điều Kiện Áp Dụng</h2>
          </div>
          <div style={{ background: '#fff', borderRadius: 16, padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #f0ebe0' }}>
            {[
              'Mỗi mã voucher chỉ được sử dụng một lần trên mỗi tài khoản khách hàng.',
              'Voucher không có giá trị quy đổi thành tiền mặt hoặc chuyển nhượng cho người khác.',
              'Voucher không áp dụng đồng thời với các chương trình khuyến mãi khác của resort.',
              'Giá trị đặt phòng tối thiểu được áp dụng trước khi tính giảm giá.',
              'Resort có quyền hủy bỏ hoặc điều chỉnh chương trình khuyến mãi mà không cần thông báo trước.',
              'Mọi tranh chấp liên quan đến việc sử dụng voucher sẽ do ThirtySix Resort quyết định cuối cùng.',
            ].map((t, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: i < 5 ? 14 : 0 }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: `linear-gradient(135deg, ${GOLD}, #E8C96B)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: DARK, flexShrink: 0, marginTop: 2 }}>
                  {i + 1}
                </div>
                <span style={{ color: '#374151', fontSize: 14, lineHeight: 1.7 }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: DARK, padding: '60px 5vw', textAlign: 'center' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <div style={{ fontSize: 12, letterSpacing: '4px', color: GOLD, fontWeight: 700, marginBottom: 14 }}>SẴN SÀNG TRẢI NGHIỆM?</div>
          <h2 style={{ color: '#fff', fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 800, margin: '0 0 16px' }}>Đặt Phòng Và Tiết Kiệm Ngay</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15, lineHeight: 1.7, marginBottom: 32 }}>
            Sử dụng voucher vừa sao chép và đặt phòng ngay hôm nay để nhận ưu đãi tốt nhất!
          </p>
          <a href="/rooms">
            <button style={{ background: `linear-gradient(135deg, ${GOLD}, #E8C96B)`, border: 'none', borderRadius: 12, padding: '15px 40px', color: DARK, fontWeight: 800, fontSize: 16, cursor: 'pointer', boxShadow: '0 6px 20px rgba(201,168,76,0.4)', letterSpacing: '0.5px' }}>
              Đặt Phòng Ngay ✦
            </button>
          </a>
        </div>
      </section>
    </div>
  );
}

function VoucherCard({ v, copiedCode, onCopy, formatDiscount, featured }) {
  const GOLD = '#C9A84C';
  const DARK = '#0D1B2A';
  const expired = isExpired(v);
  const newVoucher = isNew(v);

  return (
    <div style={{
      background: featured ? DARK : '#fff',
      borderRadius: 18,
      overflow: 'hidden',
      boxShadow: featured ? `0 12px 40px rgba(13,27,42,0.25)` : '0 4px 20px rgba(0,0,0,0.07)',
      border: featured ? `1px solid rgba(201,168,76,0.3)` : '1px solid #f0ebe0',
      transition: 'transform 0.3s, box-shadow 0.3s',
      opacity: expired ? 0.6 : 1,
      position: 'relative',
    }}
      onMouseEnter={e => { if (!expired) { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = featured ? '0 20px 56px rgba(13,27,42,0.35)' : '0 12px 36px rgba(201,168,76,0.15)'; } }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = featured ? '0 12px 40px rgba(13,27,42,0.25)' : '0 4px 20px rgba(0,0,0,0.07)'; }}
    >
      {/* Top accent bar */}
      <div style={{ height: 4, background: `linear-gradient(90deg, ${GOLD}, #E8C96B, ${GOLD})` }} />

      <div style={{ padding: '24px 24px 20px' }}>
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div style={{ display: 'flex', align: 'center', gap: 12 }}>
            <div style={{ fontSize: 36, lineHeight: 1 }}>{v.icon || '🎁'}</div>
            <div>
              {v.tag && (
                <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, color: '#fff', background: v.tagColor || GOLD, borderRadius: 4, padding: '2px 8px', letterSpacing: '0.5px', marginBottom: 4 }}>
                  {v.tag}
                </span>
              )}
              {newVoucher && !expired && (
                <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, color: '#fff', background: '#10b981', borderRadius: 4, padding: '2px 8px', marginLeft: 4, letterSpacing: '0.5px' }}>
                  MỚI
                </span>
              )}
              {expired && (
                <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, color: '#fff', background: '#9ca3af', borderRadius: 4, padding: '2px 8px', marginLeft: 4 }}>
                  HẾT HẠN
                </span>
              )}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 'clamp(28px, 4vw, 36px)', fontWeight: 800, color: GOLD, lineHeight: 1 }}>{formatDiscount(v)}</div>
            <div style={{ fontSize: 12, color: featured ? 'rgba(255,255,255,0.5)' : '#9ca3af', marginTop: 2 }}>
              {v.discountType === 'Percentage' ? 'phần trăm' : 'cố định'}
            </div>
          </div>
        </div>

        {/* Description */}
        <p style={{ margin: '0 0 16px', fontSize: 14, color: featured ? 'rgba(255,255,255,0.75)' : '#6b7280', lineHeight: 1.7 }}>
          {v.description}
        </p>

        {/* Details */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
          {v.minBookingValue > 0 && (
            <div style={{ background: featured ? 'rgba(255,255,255,0.07)' : '#f9fafb', borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ fontSize: 11, color: featured ? 'rgba(255,255,255,0.4)' : '#9ca3af', letterSpacing: '0.5px', marginBottom: 3 }}>ĐƠN TỐI THIỂU</div>
              <div style={{ fontWeight: 700, color: featured ? '#fff' : DARK, fontSize: 14 }}>{(v.minBookingValue).toLocaleString('vi-VN')}₫</div>
            </div>
          )}
          {v.validTo && (
            <div style={{ background: featured ? 'rgba(255,255,255,0.07)' : '#f9fafb', borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ fontSize: 11, color: featured ? 'rgba(255,255,255,0.4)' : '#9ca3af', letterSpacing: '0.5px', marginBottom: 3 }}>HẾT HẠN</div>
              <div style={{ fontWeight: 700, color: expired ? '#ef4444' : (featured ? '#fff' : DARK), fontSize: 14 }}>{formatDate(v.validTo)}</div>
            </div>
          )}
          {v.usageLimit && (
            <div style={{ background: featured ? 'rgba(255,255,255,0.07)' : '#f9fafb', borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ fontSize: 11, color: featured ? 'rgba(255,255,255,0.4)' : '#9ca3af', letterSpacing: '0.5px', marginBottom: 3 }}>SỐ LƯỢT</div>
              <div style={{ fontWeight: 700, color: featured ? '#fff' : DARK, fontSize: 14 }}>{v.usageLimit} lượt</div>
            </div>
          )}
        </div>

        {/* Code + copy button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            flex: 1, border: `2px dashed ${GOLD}`, borderRadius: 10, padding: '12px 16px',
            background: featured ? 'rgba(201,168,76,0.08)' : '#fef9ee',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontWeight: 800, fontSize: 18, color: GOLD, letterSpacing: '3px' }}>{v.code}</span>
            <TagOutlined style={{ color: GOLD, fontSize: 16 }} />
          </div>
          <button
            onClick={() => !expired && onCopy(v.code)}
            disabled={expired}
            style={{
              padding: '12px 18px', borderRadius: 10, border: 'none', cursor: expired ? 'not-allowed' : 'pointer',
              background: copiedCode === v.code
                ? 'linear-gradient(135deg, #10b981, #34d399)'
                : `linear-gradient(135deg, ${GOLD}, #E8C96B)`,
              color: DARK, fontWeight: 700, fontSize: 13, transition: 'all 0.2s', whiteSpace: 'nowrap',
              boxShadow: expired ? 'none' : '0 4px 12px rgba(201,168,76,0.35)',
            }}
          >
            {copiedCode === v.code
              ? <><CheckOutlined /> Đã Chép</>
              : <><CopyOutlined /> Sao Chép</>}
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { roomApi } from '../../api/roomApi';
import axiosClient, { API_BASE } from '../../api/axiosClient';
import { message, Spin, Modal, InputNumber } from 'antd';
import { CheckOutlined, LeftOutlined, StarFilled } from '@ant-design/icons';

const GOLD = '#C9A84C';
const DARK = '#0D1B2A';

const getImgSrc = (url) => {
  if (!url) return 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?q=80&w=1200&auto=format&fit=crop';
  if (url.startsWith('http')) return url;
  return `${API_BASE}${url}`;
};

export default function RoomDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [roomType, setRoomType] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imgIdx, setImgIdx] = useState(0);
  const [reportModal, setReportModal] = useState(null);
  const [reportQty, setReportQty] = useState(1);
  const [reportNote, setReportNote] = useState('');
  const [reporting, setReporting] = useState(false);
  const [usageLog, setUsageLog] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const rtRes = await roomApi.getRoomTypes();
        const types = rtRes.data?.data || rtRes.data || [];
        const found = types.find(t => String(t.id) === String(id));
        if (!found) {
          message.error('Không tìm thấy hạng phòng!');
          navigate('/rooms');
          return;
        }
        setRoomType(found);

        const roomsRes = await roomApi.getAllRooms();
        const allRooms = roomsRes.data?.data || roomsRes.data || [];
        const matchRoom = allRooms.find(r => r.roomType?.id === found.id || r.roomTypeId === found.id);
        if (matchRoom) {
          try {
            const invRes = await axiosClient.get(`/RoomInventories/room/${matchRoom.id}`);
            setInventory(invRes.data?.data || []);
          } catch { setInventory([]); }
        }
      } catch (err) {
        console.error(err);
        message.error('Lỗi tải dữ liệu!');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  const handleReportUsage = async () => {
    if (!reportModal) return;
    setReporting(true);
    try {
      const res = await axiosClient.post('/LossAndDamages/report-usage', {
        roomInventoryId: reportModal.id,
        quantity: reportQty,
        description: reportNote || `Sử dụng: ${reportModal.itemName} x${reportQty}`,
      });
      const cost = res.data?.Data?.totalCost || 0;
      message.success(`Đã báo cáo ${reportModal.itemName} x${reportQty} — ${cost.toLocaleString('vi-VN')} ₫`);
      setUsageLog(prev => [{
        itemName: reportModal.itemName,
        quantity: reportQty,
        cost,
        time: new Date().toLocaleTimeString('vi-VN'),
      }, ...prev]);
      setReportModal(null);
      setReportQty(1);
      setReportNote('');
    } catch (err) {
      message.error('Lỗi báo cáo: ' + (err.response?.data?.Message || err.message));
    } finally {
      setReporting(false);
    }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAF7F2' }}>
      <Spin size="large" tip="Đang tải chi tiết phòng..." />
    </div>
  );
  if (!roomType) return null;

  const imgs = roomType.roomImages || [];
  const heroSrc = getImgSrc(imgs[imgIdx]?.imageUrl);

  const amenities = [
    'WiFi miễn phí', 'Điều hòa', 'TV màn hình phẳng', 'Minibar', 'Tủ lạnh',
    'Két sắt', 'Bồn tắm', 'Máy sấy tóc', 'Dép & Áo choàng', 'Ban công/Terrace',
  ];

  return (
    <div style={{ paddingTop: 72, minHeight: '100vh', background: '#FAF7F2', fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      {/* Nút quay lại */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '18px 5vw 0' }}>
        <button onClick={() => window.close() || navigate('/rooms')}
          style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'none', border: 'none', color: '#6b7280', fontSize: 14, cursor: 'pointer', fontWeight: 600 }}>
          <LeftOutlined /> Quay lại danh sách phòng
        </button>
      </div>

      {/* Hero gallery */}
      <div style={{ position: 'relative', height: 460, overflow: 'hidden', marginTop: 12 }}>
        <img src={heroSrc} alt={roomType.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 0.4s' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.05), rgba(13,27,42,0.75))' }} />

        {imgs.length > 1 && (
          <>
            <button onClick={() => setImgIdx(i => (i - 1 + imgs.length) % imgs.length)}
              style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', width: 42, height: 42, borderRadius: '50%', background: 'rgba(255,255,255,0.92)', border: 'none', cursor: 'pointer', fontSize: 20, fontWeight: 700, zIndex: 2 }}>‹</button>
            <button onClick={() => setImgIdx(i => (i + 1) % imgs.length)}
              style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', width: 42, height: 42, borderRadius: '50%', background: 'rgba(255,255,255,0.92)', border: 'none', cursor: 'pointer', fontSize: 20, fontWeight: 700, zIndex: 2 }}>›</button>
            <div style={{ position: 'absolute', bottom: 90, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6 }}>
              {imgs.map((_, i) => (
                <div key={i} onClick={() => setImgIdx(i)}
                  style={{ width: i === imgIdx ? 22 : 8, height: 8, borderRadius: 4, background: i === imgIdx ? GOLD : 'rgba(255,255,255,0.6)', cursor: 'pointer', transition: 'all 0.25s' }} />
              ))}
            </div>
          </>
        )}

        <div style={{ position: 'absolute', bottom: 28, left: '5vw', right: '5vw' }}>
          <h1 style={{ color: '#fff', fontSize: 'clamp(22px,4vw,40px)', fontWeight: 800, margin: '0 0 6px', textShadow: '0 2px 12px rgba(0,0,0,0.4)' }}>
            {roomType.name}
          </h1>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ color: GOLD, fontSize: 22, fontWeight: 800 }}>{(roomType.basePrice || 0).toLocaleString('vi-VN')} ₫/đêm</span>
            {[...Array(5)].map((_, i) => <StarFilled key={i} style={{ color: GOLD, fontSize: 13 }} />)}
          </div>
        </div>
      </div>

      {/* Thumbnail strip */}
      {imgs.length > 1 && (
        <div style={{ maxWidth: 1100, margin: '14px auto 0', padding: '0 5vw', display: 'flex', gap: 10, overflowX: 'auto' }}>
          {imgs.map((img, i) => (
            <img key={i} src={getImgSrc(img.imageUrl)} alt="" onClick={() => setImgIdx(i)}
              style={{ width: 90, height: 64, objectFit: 'cover', borderRadius: 8, cursor: 'pointer', flexShrink: 0,
                border: i === imgIdx ? `3px solid ${GOLD}` : '2px solid transparent', opacity: i === imgIdx ? 1 : 0.7, transition: 'all 0.2s' }} />
          ))}
        </div>
      )}

      {/* Nội dung chính */}
      <div style={{ maxWidth: 1100, margin: '28px auto 60px', padding: '0 5vw', display: 'grid', gridTemplateColumns: '1fr 360px', gap: 28 }}>

        {/* Cột trái */}
        <div>
          {/* Thông số cơ bản */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
            {[
              { icon: '👥', label: `${roomType.capacityAdults || 2} người lớn${roomType.capacityChildren > 0 ? ` + ${roomType.capacityChildren} trẻ em` : ''}` },
              { icon: '🛏️', label: roomType.bedType || 'Giường đôi' },
              { icon: '📐', label: roomType.area ? `${roomType.area} m²` : 'Diện tích rộng' },
              { icon: '🌊', label: roomType.view || 'View đẹp' },
            ].map((x, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '9px 16px', fontSize: 13, color: DARK, fontWeight: 600, boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
                {x.icon} {x.label}
              </div>
            ))}
          </div>

          {/* Mô tả */}
          {roomType.description && (
            <div style={{ background: '#fff', borderRadius: 16, padding: '22px 26px', marginBottom: 20, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
              <h2 style={{ margin: '0 0 10px', color: DARK, fontWeight: 800, fontSize: 17 }}>Mô Tả</h2>
              <p style={{ color: '#6b7280', fontSize: 14, lineHeight: 1.85, margin: 0 }}>{roomType.description}</p>
            </div>
          )}

          {/* Tiện nghi */}
          <div style={{ background: '#fff', borderRadius: 16, padding: '22px 26px', marginBottom: 20, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <h2 style={{ margin: '0 0 14px', color: DARK, fontWeight: 800, fontSize: 17 }}>✨ Tiện Nghi</h2>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {amenities.map(a => (
                <span key={a} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fef9ee', border: `1px solid ${GOLD}40`, borderRadius: 8, padding: '6px 14px', fontSize: 13, color: DARK, fontWeight: 600 }}>
                  <CheckOutlined style={{ color: GOLD, fontSize: 11 }} /> {a}
                </span>
              ))}
            </div>
          </div>

          {/* Kho vật tư trong phòng */}
          <div style={{ background: '#fff', borderRadius: 16, padding: '22px 26px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <h2 style={{ margin: '0 0 6px', color: DARK, fontWeight: 800, fontSize: 17 }}>📦 Kho Vật Tư Trong Phòng</h2>
            <p style={{ color: '#6b7280', fontSize: 13, margin: '0 0 18px', lineHeight: 1.6 }}>
              Danh sách vật tư có sẵn trong phòng. Nếu sử dụng, nhấn <strong style={{ color: DARK }}>"Báo Cáo Sử Dụng"</strong> để hệ thống tự động cập nhật vào hóa đơn của bạn.
            </p>
            {inventory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '28px 0', color: '#bbb' }}>
                <div style={{ fontSize: 38, marginBottom: 8 }}>📦</div>
                Chưa có vật tư nào được khai báo cho hạng phòng này.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 12 }}>
                {inventory.map(item => (
                  <div key={item.id} style={{ border: '1.5px solid #e5e7eb', borderRadius: 12, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6, background: '#fafafa', transition: 'box-shadow 0.2s' }}>
                    <div style={{ fontWeight: 700, color: DARK, fontSize: 14 }}>📦 {item.itemName}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Số lượng: <strong>{item.quantity || 1}</strong></div>
                    {item.priceIfLost > 0 && (
                      <div style={{ fontSize: 12, color: '#ef4444', fontWeight: 600 }}>
                        Phí mất/hỏng: {item.priceIfLost?.toLocaleString('vi-VN')} ₫
                      </div>
                    )}
                    {item.note && <div style={{ fontSize: 11, color: '#9ca3af', fontStyle: 'italic' }}>{item.note}</div>}
                    <button
                      onClick={() => { setReportModal(item); setReportQty(1); setReportNote(''); }}
                      style={{ marginTop: 6, background: `linear-gradient(135deg, ${GOLD}, #E8C96B)`, border: 'none', borderRadius: 8, padding: '8px', color: DARK, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                    >
                      Báo Cáo Sử Dụng
                    </button>
                  </div>
                ))}
              </div>
            )}

            {usageLog.length > 0 && (
              <div style={{ marginTop: 20, borderTop: '1px solid #f3f4f6', paddingTop: 16 }}>
                <div style={{ fontWeight: 700, color: DARK, marginBottom: 10, fontSize: 13 }}>Lịch sử báo cáo (phiên này):</div>
                {usageLog.map((log, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '5px 0', borderBottom: '1px dashed #f3f4f6', gap: 8 }}>
                    <span>📦 {log.itemName} x{log.quantity}</span>
                    <span style={{ color: GOLD, fontWeight: 700 }}>{log.cost.toLocaleString('vi-VN')} ₫</span>
                    <span style={{ color: '#9ca3af' }}>{log.time}</span>
                  </div>
                ))}
                <div style={{ marginTop: 8, textAlign: 'right', fontWeight: 700, color: DARK, fontSize: 13 }}>
                  Tổng: {usageLog.reduce((s, l) => s + l.cost, 0).toLocaleString('vi-VN')} ₫
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cột phải — Booking CTA sticky */}
        <div style={{ position: 'sticky', top: 90, height: 'fit-content' }}>
          <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 8px 32px rgba(0,0,0,0.10)', padding: '26px 26px 28px', border: `1.5px solid ${GOLD}30` }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: DARK, marginBottom: 2 }}>
              {(roomType.basePrice || 0).toLocaleString('vi-VN')} <span style={{ fontSize: 13, color: '#9ca3af', fontWeight: 400 }}>₫/đêm</span>
            </div>
            <div style={{ display: 'flex', gap: 4, marginBottom: 18 }}>
              {[...Array(5)].map((_, i) => <StarFilled key={i} style={{ color: GOLD, fontSize: 12 }} />)}
              <span style={{ fontSize: 12, color: '#6b7280', marginLeft: 6 }}>5.0 · Hạng 5 sao</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {[
                { icon: '👥', label: `${roomType.capacityAdults || 2} người lớn` },
                { icon: '🛏️', label: roomType.bedType || 'Giường đôi' },
                { icon: '📐', label: roomType.area ? `${roomType.area} m²` : 'Rộng rãi' },
              ].map((x, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#374151' }}>
                  <span>{x.icon}</span> {x.label}
                </div>
              ))}
            </div>

            <button
              onClick={() => { window.location.href = '/rooms?book=' + roomType.id; }}
              style={{ width: '100%', background: `linear-gradient(135deg, ${GOLD}, #E8C96B)`, border: 'none', borderRadius: 12, padding: '15px', color: DARK, fontWeight: 800, fontSize: 16, cursor: 'pointer', boxShadow: '0 6px 20px rgba(201,168,76,0.35)', marginBottom: 10 }}
            >
              🛎 Đặt Phòng Ngay
            </button>
            <div style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af' }}>
              Miễn phí hủy trong vòng 24h · Bao gồm thuế phí
            </div>
          </div>

          <div style={{ marginTop: 14, background: '#0D1B2A', borderRadius: 16, padding: '18px 20px' }}>
            <div style={{ color: GOLD, fontWeight: 700, marginBottom: 8, fontSize: 14 }}>Cần tư vấn? Liên hệ ngay</div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginBottom: 4 }}>📞 +84 236 888 8888</div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>✉ info@thirtysix.vn</div>
          </div>
        </div>
      </div>

      {/* Modal báo cáo sử dụng */}
      <Modal open={!!reportModal} onCancel={() => setReportModal(null)} footer={null} title={null}
        styles={{ content: { borderRadius: 16, padding: 0, overflow: 'hidden' } }} width={420}>
        {reportModal && (
          <div>
            <div style={{ background: `linear-gradient(135deg, ${DARK}, #1d4ed8)`, padding: '22px 26px', color: '#fff' }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>Báo cáo sử dụng vật tư</div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>📦 {reportModal.itemName}</div>
              {reportModal.priceIfLost > 0 && (
                <div style={{ color: GOLD, fontSize: 14, marginTop: 4 }}>
                  Đơn giá: {reportModal.priceIfLost?.toLocaleString('vi-VN')} ₫/cái
                </div>
              )}
            </div>
            <div style={{ padding: '22px 26px 26px' }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontWeight: 700, color: DARK, marginBottom: 8, fontSize: 13 }}>SỐ LƯỢNG ĐÃ SỬ DỤNG *</label>
                <InputNumber min={1} max={reportModal.quantity || 99} value={reportQty} onChange={v => setReportQty(v || 1)} style={{ width: '100%' }} size="large" />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontWeight: 700, color: DARK, marginBottom: 8, fontSize: 13 }}>GHI CHÚ (Tùy chọn)</label>
                <input value={reportNote} onChange={e => setReportNote(e.target.value)}
                  placeholder="VD: Uống Coca trong minibar, mất 1 cái khăn..."
                  style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '10px 12px', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
              </div>
              {reportModal.priceIfLost > 0 && (
                <div style={{ background: '#fef9ee', border: `1px solid ${GOLD}40`, borderRadius: 10, padding: '12px 16px', marginBottom: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6b7280', fontSize: 13 }}>Tổng chi phí phát sinh:</span>
                    <span style={{ fontWeight: 800, color: GOLD, fontSize: 16 }}>
                      {(reportModal.priceIfLost * reportQty).toLocaleString('vi-VN')} ₫
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>Sẽ được cộng vào hóa đơn/đền bù của booking này</div>
                </div>
              )}
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setReportModal(null)}
                  style={{ flex: 1, background: '#f3f4f6', border: 'none', borderRadius: 10, padding: '12px', color: '#6b7280', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Hủy
                </button>
                <button onClick={handleReportUsage} disabled={reporting}
                  style={{ flex: 2, background: `linear-gradient(135deg, ${DARK}, #1d4ed8)`, border: 'none', borderRadius: 10, padding: '12px', color: '#fff', fontWeight: 700, fontSize: 14, cursor: reporting ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                  {reporting ? 'Đang gửi...' : '✓ Xác Nhận Báo Cáo'}
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

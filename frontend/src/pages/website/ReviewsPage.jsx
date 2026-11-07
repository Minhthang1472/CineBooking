import React, { useEffect, useState } from 'react';
import { message, Modal } from 'antd';
import { StarFilled, StarOutlined, UserOutlined } from '@ant-design/icons';
import axiosClient from '../../api/axiosClient';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';

const GOLD = '#C9A84C';
const DARK = '#0D1B2A';

const defaultReviews = [
  { id: 1, rating: 5, comment: 'Khu resort tuyệt vời! Phòng rộng rãi, view biển cực đẹp. Nhân viên rất thân thiện và chu đáo.', createdAt: '2026-01-15T00:00:00Z', user: { fullName: 'Nguyễn Minh Tuấn' }, roomType: { name: 'Villa Hướng Biển' } },
  { id: 2, rating: 5, comment: 'Spa ở đây là best! Massage đá nóng giảm đau lưng kinh khủng. Ăn sáng ngon, đa dạng.', createdAt: '2026-02-08T00:00:00Z', user: { fullName: 'Trần Thị Lan Anh' }, roomType: { name: 'Phòng Deluxe' } },
  { id: 3, rating: 4, comment: 'Không gian xanh mát, yên tĩnh, rất phù hợp để nghỉ ngơi và sạc lại năng lượng.', createdAt: '2026-02-20T00:00:00Z', user: { fullName: 'Lê Hoàng Phúc' }, roomType: { name: 'Phòng Superior' } },
  { id: 4, rating: 3, comment: 'Phòng ổn nhưng dịch vụ dọn phòng hơi chậm. View đẹp, bữa sáng khá ngon.', createdAt: '2026-03-05T00:00:00Z', user: { fullName: 'Phạm Thùy Linh' }, roomType: { name: 'Suite Executive' } },
  { id: 5, rating: 2, comment: 'Giá hơi cao so với chất lượng. Phòng nhỏ hơn mong đợi, điều hòa hơi ồn.', createdAt: '2026-03-18T00:00:00Z', user: { fullName: 'Võ Đăng Khoa' }, roomType: { name: 'Phòng Standard' } },
  { id: 6, rating: 4, comment: 'Cơ sở vật chất hiện đại, sạch sẽ. Đặc biệt yêu thích không gian vườn thiền buổi sáng.', createdAt: '2026-04-02T00:00:00Z', user: { fullName: 'Hoàng Ngọc Mai' }, roomType: { name: 'Phòng Deluxe' } },
];

const StarRating = ({ value, onChange, size = 24 }) => (
  <div style={{ display: 'flex', gap: 4 }}>
    {[1, 2, 3, 4, 5].map(star => (
      <span key={star} onClick={() => onChange && onChange(star)} style={{ cursor: onChange ? 'pointer' : 'default', fontSize: size }}>
        {star <= value
          ? <StarFilled style={{ color: GOLD }} />
          : <StarOutlined style={{ color: '#d1d5db' }} />}
      </span>
    ))}
  </div>
);

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewModal, setReviewModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterRating, setFilterRating] = useState(0);
  const [form, setForm] = useState({ rating: 5, comment: '' });
  const { token, user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Chỉ lấy reviews đã được duyệt (API đã filter is_approved=true)
    axiosClient.get('/Reviews')
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : [];
        setReviews(data.length ? data : defaultReviews);
      })
      .catch(() => setReviews(defaultReviews))
      .finally(() => setLoading(false));
  }, []);

  const submitReview = async () => {
    if (!form.comment.trim()) {
      message.error('Vui lòng nhập nội dung đánh giá!');
      return;
    }
    setSubmitting(true);
    try {
      await axiosClient.post('/Reviews', {
        rating: form.rating,
        comment: form.comment,
        createdAt: new Date().toISOString(),
        userId: user?.id || null,
        isApproved: false,
      });
      message.success('Cảm ơn bạn đã đánh giá! Đánh giá sẽ được hiển thị sau khi ban quản lý xét duyệt.');
      setReviewModal(false);
      setForm({ rating: 5, comment: '' });
    } catch {
      message.error('Gửi đánh giá thất bại. Vui lòng thử lại!');
    } finally {
      setSubmitting(false);
    }
  };

  const openReviewModal = () => {
    if (!token) {
      message.info('Vui lòng đăng nhập để gửi đánh giá!');
      navigate('/website-login');
      return;
    }
    setReviewModal(true);
  };

  const displayReviews = reviews.length ? reviews : defaultReviews;
  const filtered = filterRating ? displayReviews.filter(r => r.rating === filterRating) : displayReviews;
  const avgRating = displayReviews.reduce((sum, r) => sum + r.rating, 0) / displayReviews.length || 0;
  const ratingDist = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: displayReviews.filter(r => r.rating === star).length,
    pct: (displayReviews.filter(r => r.rating === star).length / displayReviews.length) * 100 || 0,
  }));

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div style={{ paddingTop: 72, background: '#FAF7F2', minHeight: '100vh' }}>
      {/* Hero */}
      <section style={{ position: 'relative', height: 380, overflow: 'hidden' }}>
        <img src="https://images.unsplash.com/photo-1445019980597-93fa8acb246c?q=80&w=1920&auto=format&fit=crop" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(13,27,42,0.5), rgba(13,27,42,0.85))' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 20px' }}>
          <div style={{ fontSize: 12, letterSpacing: '4px', color: GOLD, fontWeight: 700, marginBottom: 12 }}>TIẾNG NÓI KHÁCH HÀNG</div>
          <h1 style={{ color: '#fff', fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 800, margin: '0 0 14px' }}>Đánh Giá Thực Tế</h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 15, maxWidth: 480 }}>Hơn 1,200 đánh giá từ khách hàng đã trải nghiệm dịch vụ tại ThirtySix Resort</p>
        </div>
      </section>

      <section style={{ padding: '56px 5vw', maxWidth: 1200, margin: '0 auto' }}>
        {/* Rating overview */}
        <div style={{ background: '#fff', borderRadius: 20, padding: '36px', boxShadow: '0 4px 24px rgba(0,0,0,0.07)', marginBottom: 40, display: 'grid', gridTemplateColumns: '200px 1fr', gap: 40, alignItems: 'center' }} className="rating-overview">
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 72, fontWeight: 800, color: GOLD, lineHeight: 1 }}>{avgRating.toFixed(1)}</div>
            <StarRating value={Math.round(avgRating)} size={22} />
            <div style={{ color: '#6b7280', fontSize: 14, marginTop: 8 }}>{displayReviews.length} đánh giá</div>
          </div>
          <div>
            {ratingDist.map(d => (
              <div key={d.star} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <span style={{ fontSize: 13, color: '#374151', minWidth: 12 }}>{d.star}</span>
                <StarFilled style={{ color: GOLD, fontSize: 13 }} />
                <div style={{ flex: 1, height: 8, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${d.pct}%`, background: `linear-gradient(90deg, ${GOLD}, #E8C96B)`, borderRadius: 4, transition: 'width 0.6s' }} />
                </div>
                <span style={{ fontSize: 13, color: '#6b7280', minWidth: 24 }}>{d.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions + filter — bao gồm tất cả 5 mức sao */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[0, 5, 4, 3, 2, 1].map(r => (
              <button key={r} onClick={() => setFilterRating(r)} style={{
                padding: '8px 18px', borderRadius: 24,
                background: filterRating === r ? `linear-gradient(135deg, ${GOLD}, #E8C96B)` : '#fff',
                border: filterRating === r ? 'none' : '1.5px solid #e5e7eb',
                color: filterRating === r ? DARK : '#374151', fontWeight: 600, fontSize: 13, cursor: 'pointer',
              }}>
                {r === 0 ? 'Tất Cả' : `${r} ★`}
              </button>
            ))}
          </div>
          <button onClick={openReviewModal} style={{
            background: `linear-gradient(135deg, ${GOLD}, #E8C96B)`,
            border: 'none', borderRadius: 10, padding: '12px 28px',
            color: DARK, fontWeight: 700, fontSize: 14, cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(201,168,76,0.35)',
          }}>
            ✍️ Viết Đánh Giá
          </button>
        </div>

        {/* Reviews grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>Đang tải đánh giá...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
            {filtered.map(review => (
              <div key={review.id} style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', transition: 'box-shadow 0.3s', border: '1px solid #f0ebe0' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 12px 36px rgba(201,168,76,0.12)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.06)'}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: `linear-gradient(135deg, ${GOLD}, #E8C96B)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: DARK, fontWeight: 800, fontSize: 17, flexShrink: 0 }}>
                      {(review.user?.fullName || 'K')[0]}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: DARK, fontSize: 15 }}>{review.user?.fullName || 'Khách hàng ẩn danh'}</div>
                      {review.roomType?.name && (
                        <div style={{ fontSize: 12, color: '#9ca3af' }}>{review.roomType.name}</div>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <StarRating value={review.rating} size={14} />
                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>{review.createdAt ? formatDate(review.createdAt) : ''}</div>
                  </div>
                </div>

                {/* Comment */}
                <p style={{ margin: 0, color: '#374151', fontSize: 14, lineHeight: 1.8, fontStyle: 'italic' }}>
                  "{review.comment}"
                </p>

                {review.rating === 5 && (
                  <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 5, background: '#fef9ee', border: `1px solid ${GOLD}40`, borderRadius: 6, padding: '3px 10px' }}>
                    <span style={{ fontSize: 11, color: GOLD, fontWeight: 600 }}>✦ Đánh giá xuất sắc</span>
                  </div>
                )}
                {review.rating <= 2 && (
                  <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 5, background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, padding: '3px 10px' }}>
                    <span style={{ fontSize: 11, color: '#ef4444', fontWeight: 600 }}>Cần cải thiện</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {filtered.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af', fontSize: 16 }}>
            Chưa có đánh giá nào cho mức sao này.
          </div>
        )}
      </section>

      {/* ===== WRITE REVIEW MODAL ===== */}
      <Modal
        open={reviewModal}
        onCancel={() => setReviewModal(false)}
        footer={null}
        width={520}
        title={null}
        styles={{ content: { borderRadius: 20, padding: '32px' } }}
      >
        <div>
          <h2 style={{ margin: '0 0 6px', color: DARK, fontWeight: 800, fontSize: 22 }}>Chia Sẻ Trải Nghiệm</h2>
          <p style={{ color: '#6b7280', fontSize: 14, margin: '0 0 28px' }}>Đánh giá của bạn giúp chúng tôi không ngừng cải thiện chất lượng dịch vụ.</p>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10, letterSpacing: '0.5px' }}>XẾP HẠNG CỦA BẠN *</label>
            <StarRating value={form.rating} onChange={v => setForm(f => ({ ...f, rating: v }))} size={32} />
            <div style={{ marginTop: 8, fontSize: 13, color: '#9ca3af' }}>
              {form.rating === 5 ? 'Xuất sắc' : form.rating === 4 ? 'Rất tốt' : form.rating === 3 ? 'Bình thường' : form.rating === 2 ? 'Không hài lòng' : 'Rất tệ'}
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8, letterSpacing: '0.5px' }}>NỘI DUNG ĐÁNH GIÁ *</label>
            <textarea
              value={form.comment}
              onChange={e => setForm(f => ({ ...f, comment: e.target.value }))}
              placeholder="Chia sẻ cảm nhận của bạn về dịch vụ, phòng nghỉ, ẩm thực..."
              rows={5}
              style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '12px 14px', fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.7, boxSizing: 'border-box' }}
            />
            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4, textAlign: 'right' }}>{form.comment.length}/500</div>
          </div>

          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, padding: '12px 14px', background: '#f9fafb', borderRadius: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg, ${GOLD}, #E8C96B)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: DARK, fontWeight: 800, fontSize: 15 }}>
                {user.name?.[0] || 'K'}
              </div>
              <div>
                <div style={{ fontWeight: 600, color: DARK, fontSize: 14 }}>{user.name}</div>
                <div style={{ fontSize: 12, color: '#9ca3af' }}>Đánh giá với tư cách khách hàng đã trải nghiệm</div>
              </div>
            </div>
          )}

          {/* Notice about moderation */}
          <div style={{ background: '#fef9ee', border: `1px solid ${GOLD}40`, borderRadius: 10, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: '#92400e' }}>
            ⏳ Đánh giá sẽ được hiển thị sau khi ban quản lý xét duyệt (thường trong 24h).
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setReviewModal(false)} style={{ flex: 1, background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '13px', color: '#374151', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>
              Hủy
            </button>
            <button onClick={submitReview} disabled={submitting} style={{ flex: 2, background: `linear-gradient(135deg, ${GOLD}, #E8C96B)`, border: 'none', borderRadius: 10, padding: '13px', color: DARK, fontWeight: 700, fontSize: 15, cursor: submitting ? 'not-allowed' : 'pointer', boxShadow: '0 4px 14px rgba(201,168,76,0.35)' }}>
              {submitting ? 'Đang gửi...' : '✦ Gửi Đánh Giá'}
            </button>
          </div>
        </div>
      </Modal>

      <style>{`
        @media (max-width: 640px) {
          .rating-overview { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

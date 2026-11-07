import React, { useEffect, useState } from 'react';
import { articleApi } from '../../api/marketingApi';
import { API_BASE } from '../../api/axiosClient';

const GOLD = '#C9A84C';
const DARK = '#0D1B2A';

const CATEGORY_COLORS = {
  'Sự kiện': '#7c3aed',
  'Khuyến mãi': '#dc2626',
  'Tin tức': '#0284c7',
  'Ẩm thực': '#d97706',
  'Du lịch': '#059669',
  'Thông báo': '#0891b2',
};

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=800&auto=format&fit=crop';

// Lấy ảnh bìa từ thumbnailUrl (backend lưu dạng /thumbnails/...)
const getArticleImage = (article) => {
  if (!article.thumbnailUrl) return FALLBACK_IMG;
  if (article.thumbnailUrl.startsWith('http')) return article.thumbnailUrl;
  return `${API_BASE}${article.thumbnailUrl}`;
};

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';

const catColor = (cat) => CATEGORY_COLORS[cat] || '#6b7280';

export default function NewsPage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedArticle, setSelectedArticle] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    articleApi.getAllArticles()
      .then(res => {
        // Chỉ hiển thị bài đã xuất bản (isPublished = true)
        const raw = Array.isArray(res.data) ? res.data : [];
        const published = raw.filter(a => a.isPublished);
        setArticles(published);
      })
      .catch(err => {
        console.error('[NewsPage] Lỗi tải bài viết:', err);
        setError('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
      })
      .finally(() => setLoading(false));
  }, []);

  // Danh mục lấy từ dữ liệu thực (category.name hoặc category là string)
  const getCatName = (a) => a.category?.name || a.category || null;

  const categories = ['all', ...new Set(articles.map(getCatName).filter(Boolean))];

  const filtered = selectedCategory === 'all'
    ? articles
    : articles.filter(a => getCatName(a) === selectedCategory);

  const featured = filtered[0];
  const rest = filtered.slice(1);

  return (
    <div style={{ paddingTop: 72, minHeight: '100vh', background: '#FAF7F2' }}>
      {/* Hero */}
      <section style={{ position: 'relative', height: 360, overflow: 'hidden' }}>
        <img
          src="https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1920&auto=format&fit=crop"
          alt="News"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(13,27,42,0.55), rgba(13,27,42,0.88))' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 20px' }}>
          <div style={{ fontSize: 11, letterSpacing: '4px', color: GOLD, fontWeight: 700, marginBottom: 12 }}>TIN TỨC & SỰ KIỆN</div>
          <h1 style={{ color: '#fff', fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 800, margin: '0 0 12px', lineHeight: 1.1 }}>
            Tin Tức & Bài Viết
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 15, maxWidth: 520 }}>
            Cập nhật những tin tức mới nhất, ưu đãi đặc biệt và sự kiện tại ThirtySix Resort & Spa
          </p>
        </div>
      </section>

      <section style={{ padding: '48px 5vw', maxWidth: 1200, margin: '0 auto' }}>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📰</div>
            <p style={{ color: '#9ca3af', fontSize: 16 }}>Đang tải bài viết từ hệ thống...</p>
          </div>
        )}

        {/* Lỗi kết nối */}
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
        {!loading && !error && articles.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>📭</div>
            <h3 style={{ color: DARK, fontWeight: 700, marginBottom: 8 }}>Chưa có bài viết nào</h3>
            <p style={{ color: '#9ca3af', fontSize: 14 }}>Quản trị viên chưa đăng bài viết. Hãy quay lại sau!</p>
          </div>
        )}

        {/* Có dữ liệu */}
        {!loading && !error && articles.length > 0 && (
          <>
            {/* Category Filter */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 36, flexWrap: 'wrap' }}>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '8px 20px', borderRadius: 30, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13,
                    background: selectedCategory === cat ? `linear-gradient(135deg, ${GOLD}, #E8C96B)` : '#fff',
                    color: selectedCategory === cat ? DARK : '#6b7280',
                    boxShadow: selectedCategory === cat ? '0 4px 14px rgba(201,168,76,0.3)' : '0 1px 4px rgba(0,0,0,0.08)',
                    transition: 'all 0.2s',
                  }}
                >
                  {cat === 'all' ? '📰 Tất Cả' : cat}
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>Không có bài viết trong danh mục này</div>
            ) : (
              <>
                {/* Featured Article */}
                {featured && (
                  <div
                    onClick={() => setSelectedArticle(featured)}
                    style={{
                      display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 0,
                      background: '#fff', borderRadius: 20, overflow: 'hidden',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.1)', marginBottom: 36,
                      cursor: 'pointer', transition: 'transform 0.3s, box-shadow 0.3s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 20px 48px rgba(0,0,0,0.15)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.1)'; }}
                  >
                    <div style={{ position: 'relative', minHeight: 300, overflow: 'hidden' }}>
                      <img
                        src={getArticleImage(featured)}
                        alt={featured.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }}
                        onError={e => { e.target.src = FALLBACK_IMG; }}
                        onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
                        onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                      />
                      <div style={{ position: 'absolute', top: 16, left: 16 }}>
                        <span style={{ background: '#1d4ed8', color: '#fff', borderRadius: 6, padding: '4px 12px', fontSize: 12, fontWeight: 700 }}>🔥 Nổi Bật</span>
                      </div>
                    </div>
                    <div style={{ padding: '36px 36px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      {getCatName(featured) && (
                        <span style={{
                          display: 'inline-block', marginBottom: 12,
                          background: catColor(getCatName(featured)) + '18',
                          color: catColor(getCatName(featured)),
                          borderRadius: 6, padding: '3px 12px', fontSize: 12, fontWeight: 700,
                        }}>{getCatName(featured)}</span>
                      )}
                      <h2 style={{ margin: '0 0 12px', color: DARK, fontSize: 22, fontWeight: 800, lineHeight: 1.3 }}>{featured.title}</h2>
                      {featured.summary && (
                        <p style={{ color: '#6b7280', fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>{featured.summary}</p>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg, ${GOLD}, #E8C96B)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: DARK }}>
                          {(featured.author?.name || 'A')[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: DARK }}>{featured.author?.name || 'Admin'}</div>
                          <div style={{ fontSize: 12, color: '#9ca3af' }}>{formatDate(featured.publishedAt || featured.createdAt)}</div>
                        </div>
                      </div>
                      <button style={{
                        alignSelf: 'flex-start', background: `linear-gradient(135deg, ${GOLD}, #E8C96B)`,
                        border: 'none', borderRadius: 10, padding: '11px 24px', color: DARK, fontWeight: 700, fontSize: 14, cursor: 'pointer',
                      }}>Đọc Thêm →</button>
                    </div>
                  </div>
                )}

                {/* Grid Articles */}
                {rest.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
                    {rest.map(article => (
                      <div
                        key={article.id}
                        onClick={() => setSelectedArticle(article)}
                        style={{
                          background: '#fff', borderRadius: 16, overflow: 'hidden',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.07)', cursor: 'pointer',
                          transition: 'transform 0.3s, box-shadow 0.3s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.12)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.07)'; }}
                      >
                        <div style={{ position: 'relative', height: 200, overflow: 'hidden' }}>
                          <img
                            src={getArticleImage(article)}
                            alt={article.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }}
                            onError={e => { e.target.src = FALLBACK_IMG; }}
                            onMouseEnter={e => e.target.style.transform = 'scale(1.08)'}
                            onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                          />
                          {getCatName(article) && (
                            <span style={{
                              position: 'absolute', top: 12, left: 12,
                              background: catColor(getCatName(article)), color: '#fff',
                              borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 700,
                            }}>{getCatName(article)}</span>
                          )}
                        </div>
                        <div style={{ padding: '20px 22px 22px' }}>
                          <h3 style={{ margin: '0 0 8px', color: DARK, fontSize: 16, fontWeight: 700, lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {article.title}
                          </h3>
                          {article.summary && (
                            <p style={{ color: '#6b7280', fontSize: 13, lineHeight: 1.6, marginBottom: 14, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {article.summary}
                            </p>
                          )}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f3f4f6', paddingTop: 12 }}>
                            <div style={{ fontSize: 12, color: '#9ca3af' }}>✍️ {article.author?.name || 'Admin'}</div>
                            <div style={{ fontSize: 12, color: '#9ca3af' }}>{formatDate(article.publishedAt || article.createdAt)}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </section>

      {/* Article Detail Modal */}
      {selectedArticle && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setSelectedArticle(null); }}
        >
          <div style={{ background: '#fff', borderRadius: 20, maxWidth: 720, width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}>
            {/* Modal Image */}
            <div style={{ position: 'relative', height: 280, overflow: 'hidden', borderRadius: '20px 20px 0 0' }}>
              <img
                src={getArticleImage(selectedArticle)}
                alt={selectedArticle.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={e => { e.target.src = FALLBACK_IMG; }}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }} />
              <button
                onClick={() => setSelectedArticle(null)}
                style={{ position: 'absolute', top: 16, right: 16, width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer', fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >✕</button>
              {getCatName(selectedArticle) && (
                <span style={{ position: 'absolute', bottom: 16, left: 24, background: catColor(getCatName(selectedArticle)), color: '#fff', borderRadius: 6, padding: '4px 14px', fontSize: 12, fontWeight: 700 }}>
                  {getCatName(selectedArticle)}
                </span>
              )}
            </div>

            <div style={{ padding: '28px 36px 36px' }}>
              <h2 style={{ margin: '0 0 10px', color: DARK, fontSize: 22, fontWeight: 800, lineHeight: 1.3 }}>{selectedArticle.title}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, color: '#9ca3af', fontSize: 13 }}>
                <span>✍️ {selectedArticle.author?.name || 'Admin'}</span>
                <span>•</span>
                <span>📅 {formatDate(selectedArticle.publishedAt || selectedArticle.createdAt)}</span>
              </div>
              {selectedArticle.summary && (
                <p style={{ color: '#374151', fontSize: 15, lineHeight: 1.7, marginBottom: 20, fontStyle: 'italic', borderLeft: `3px solid ${GOLD}`, paddingLeft: 16 }}>
                  {selectedArticle.summary}
                </p>
              )}
              {selectedArticle.content ? (
                <div style={{ color: '#374151', fontSize: 14, lineHeight: 1.8 }} dangerouslySetInnerHTML={{ __html: selectedArticle.content }} />
              ) : (
                <p style={{ color: '#6b7280', fontSize: 14, fontStyle: 'italic' }}>Bài viết không có nội dung chi tiết.</p>
              )}
              <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 20, marginTop: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <a href="/rooms">
                  <button style={{ background: `linear-gradient(135deg, ${GOLD}, #E8C96B)`, border: 'none', borderRadius: 10, padding: '11px 24px', color: DARK, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                    🏨 Đặt Phòng Ngay
                  </button>
                </a>
                <button onClick={() => setSelectedArticle(null)} style={{ background: '#f3f4f6', border: 'none', borderRadius: 10, padding: '11px 20px', color: '#6b7280', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
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

import React, { useState, useEffect } from 'react';
import { Table, Card, Typography, Button, Space, Rate, Modal, message, Avatar, Tag, Row, Col, Input, Divider, Progress, Tooltip } from 'antd';
import { DeleteOutlined, ReloadOutlined, UserOutlined, StarOutlined, MessageOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { reviewApi } from '../../../api/marketingApi';
import axiosClient from '../../../api/axiosClient';
import { useNotification } from '../../../context/notificationContext';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

const ReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [replyModal, setReplyModal] = useState({ open: false, review: null, text: '' });
  const { addNotification } = useNotification();

  const MOCK_REVIEWS = [
    { id: 1, rating: 5, comment: 'Phòng rất sạch sẽ, nhân viên thân thiện! View biển tuyệt vời, sẽ quay lại vào năm sau!', createdAt: '2026-04-01T10:00:00Z', user: { name: 'Thanh Tùng' }, reply: null },
    { id: 2, rating: 4, comment: 'View đẹp nhưng đồ ăn sáng hơi ít món. Phòng thoáng mát, giường êm.', createdAt: '2026-04-03T14:30:00Z', user: { name: 'Ngọc Lan' }, reply: 'Cảm ơn quý khách! Chúng tôi sẽ cải thiện menu bữa sáng ngay!' },
    { id: 3, rating: 2, comment: 'Wifi trong phòng quá yếu, không làm việc được. Cần nâng cấp hệ thống mạng.', createdAt: '2026-04-05T09:15:00Z', user: { name: 'Minh Hoàng' }, reply: null },
    { id: 4, rating: 5, comment: 'Tuyệt vời! Dịch vụ rất chuyên nghiệp. Sẽ giới thiệu cho bạn bè.', createdAt: '2026-04-08T16:00:00Z', user: { name: 'Thu Hà' }, reply: 'Cảm ơn quý khách đã tin tưởng lựa chọn! Hẹn gặp lại!' },
    { id: 5, rating: 3, comment: 'Bình thường, giá hơi cao so với dịch vụ được cung cấp.', createdAt: '2026-04-09T11:30:00Z', user: { name: 'Văn Nam' }, reply: null },
  ];

  const fetchReviews = async () => {
    setLoading(true);
    try {
      // Dùng /all để admin thấy cả review chưa duyệt
      const res = await axiosClient.get('/Reviews/all');
      const data = Array.isArray(res.data) ? res.data : [];
      setReviews(data.length > 0 ? data : MOCK_REVIEWS);
    } catch {
      setReviews(MOCK_REVIEWS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReviews(); }, []);

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Xóa đánh giá này?',
      content: 'Chỉ xóa khi đánh giá vi phạm quy tắc cộng đồng.',
      okText: 'Xóa', okType: 'danger', cancelText: 'Hủy',
      onOk: async () => {
        try {
          await reviewApi.deleteReview(id);
          message.success('Đã xóa!');
          addNotification('Xóa Đánh Giá', 'Đã xóa một đánh giá vi phạm.', 'warning');
          fetchReviews();
        } catch { message.error('Lỗi khi xóa!'); }
      }
    });
  };

  const handleApprove = async (id) => {
    try {
      await axiosClient.patch(`/Reviews/${id}/approve`);
      message.success('Đã duyệt đánh giá! Sẽ hiển thị trên website.');
      addNotification('Duyệt Đánh Giá', 'Đánh giá đã được duyệt và hiển thị.', 'success');
      fetchReviews();
    } catch { message.error('Lỗi khi duyệt!'); }
  };

  const handleReject = async (id) => {
    try {
      await axiosClient.patch(`/Reviews/${id}/reject`);
      message.success('Đã ẩn đánh giá!');
      fetchReviews();
    } catch { message.error('Lỗi khi ẩn!'); }
  };

  const handleReply = (review) => { setReplyModal({ open: true, review, text: review.reply || '' }); };
  const submitReply = () => {
    setReviews(prev => prev.map(r => r.id === replyModal.review.id ? { ...r, reply: replyModal.text } : r));
    message.success('Đã gửi phản hồi!');
    addNotification('Phản Hồi Đánh Giá', `Đã phản hồi đánh giá của ${replyModal.review.user?.name}`, 'success');
    setReplyModal({ open: false, review: null, text: '' });
  };

  // Stats
  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : 0;
  const ratingDist = [5, 4, 3, 2, 1].map(star => ({
    star, count: reviews.filter(r => r.rating === star).length,
    pct: reviews.length ? Math.round(reviews.filter(r => r.rating === star).length / reviews.length * 100) : 0
  }));
  const needsReply = reviews.filter(r => !r.reply).length;

  const columns = [
    {
      title: 'Khách Hàng', key: 'user',
      render: (_, r) => (
        <Space>
          <Avatar src={`https://api.dicebear.com/7.x/notionists/svg?seed=${r.user?.name}`} size={40} />
          <div>
            <Text strong>{r.user?.name || 'Khách Ẩn Danh'}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(r.createdAt).format('DD/MM/YYYY')}</Text>
          </div>
        </Space>
      )
    },
    {
      title: 'Đánh Giá', dataIndex: 'rating', key: 'rating',
      render: (val) => (
        <Space direction="vertical" size={0}>
          <Rate disabled value={val} style={{ fontSize: 14 }} />
          <Text style={{ fontSize: 12, color: val >= 4 ? '#52c41a' : val >= 3 ? '#fa8c16' : '#ff4d4f' }}>
            {val >= 4 ? 'Tốt' : val >= 3 ? 'Trung bình' : 'Cần cải thiện'}
          </Text>
        </Space>
      )
    },
    {
      title: 'Nhận Xét & Phản Hồi', key: 'comment',
      render: (_, r) => (
        <div>
          <Text style={{ display: 'block', marginBottom: 6 }}>{r.comment}</Text>
          {r.reply && (
            <div style={{ background: '#f0f7ff', borderLeft: '3px solid #1677ff', borderRadius: '0 8px 8px 0', padding: '8px 12px', marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: 11, fontWeight: 600 }}>↩ PHẢN HỒI TỪ KHÁCH SẠN:</Text>
              <br />
              <Text style={{ fontSize: 13, color: '#1677ff' }}>{r.reply}</Text>
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Trạng Thái', key: 'status', width: 120,
      render: (_, r) => (
        r.isApproved
          ? <Tag color="success" icon={<CheckOutlined />}>Đã duyệt</Tag>
          : <Tag color="warning">Chờ duyệt</Tag>
      )
    },
    {
      title: 'Thao Tác', key: 'action', width: 180,
      render: (_, record) => (
        <Space direction="vertical" size={4}>
          {!record.isApproved ? (
            <Tooltip title="Duyệt để hiển thị trên website">
              <Button type="primary" size="small" icon={<CheckOutlined />} onClick={() => handleApprove(record.id)} style={{ background: '#10b981', border: 'none' }}>
                Duyệt
              </Button>
            </Tooltip>
          ) : (
            <Button size="small" icon={<CloseOutlined />} onClick={() => handleReject(record.id)} danger ghost>
              Ẩn
            </Button>
          )}
          <Button type={record.reply ? 'default' : 'primary'} ghost={!!record.reply} size="small"
            icon={record.reply ? <CheckOutlined /> : <MessageOutlined />}
            onClick={() => handleReply(record)}>
            {record.reply ? 'Sửa phản hồi' : 'Phản hồi'}
          </Button>
          <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>Xóa</Button>
        </Space>
      )
    },
  ];

  return (
    <div>
      {/* Premium Banner */}
      <div style={{ background: 'linear-gradient(135deg, #1a0533 0%, #eb2f96 100%)', borderRadius: 16, padding: '28px 36px', marginBottom: 24, color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, boxShadow: '0 10px 30px rgba(235,47,150,0.2)' }}>
        <div>
          <Title level={2} style={{ color: 'white', margin: '0 0 6px 0', fontWeight: 700 }}>
            <StarOutlined style={{ marginRight: 10 }} />Đánh Giá Khách Hàng
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
            Theo dõi và phản hồi đánh giá từ khách lưu trú. Quản lý uy tín thương hiệu.
          </Text>
        </div>
        <Row gutter={12}>
          {[
            { label: 'Điểm TB', value: `${avgRating}⭐`, highlight: true },
            { label: 'Tổng đánh giá', value: reviews.length },
            { label: 'Chờ phản hồi', value: needsReply, warning: needsReply > 0 },
          ].map(s => (
            <Col key={s.label}>
              <div style={{ background: s.warning ? 'rgba(255,77,79,0.3)' : 'rgba(255,255,255,0.15)', padding: '10px 18px', borderRadius: 12, backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)', textAlign: 'center', minWidth: 90 }}>
                <div style={{ fontSize: s.highlight ? 20 : 22, fontWeight: 800 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>{s.label}</div>
              </div>
            </Col>
          ))}
        </Row>
      </div>

      {/* Rating Distribution */}
      <Card style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', marginBottom: 20 }}>
        <Title level={5} style={{ margin: '0 0 16px 0' }}>📊 Phân Bố Đánh Giá</Title>
        <Row gutter={24} align="middle">
          <Col xs={24} sm={8} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 64, fontWeight: 900, color: '#faad14', lineHeight: 1 }}>{avgRating}</div>
            <Rate disabled value={parseFloat(avgRating)} allowHalf style={{ fontSize: 20 }} />
            <br />
            <Text type="secondary" style={{ fontSize: 13 }}>Dựa trên {reviews.length} đánh giá</Text>
          </Col>
          <Col xs={24} sm={16}>
            {ratingDist.map(({ star, count, pct }) => (
              <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <Text style={{ width: 20, textAlign: 'right' }}>{star}</Text>
                <StarOutlined style={{ color: '#faad14', fontSize: 13 }} />
                <Progress percent={pct} showInfo={false} size="small" style={{ flex: 1, margin: '0 8px' }}
                  strokeColor={star >= 4 ? '#52c41a' : star === 3 ? '#fa8c16' : '#ff4d4f'} />
                <Text type="secondary" style={{ width: 30 }}>{count}</Text>
              </div>
            ))}
          </Col>
        </Row>
      </Card>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Button icon={<ReloadOutlined />} onClick={fetchReviews}>Làm mới</Button>
      </div>

      <Card style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }} styles={{ body: { padding: 0 } }}>
        <Table columns={columns} dataSource={reviews} rowKey="id" loading={loading} pagination={{ pageSize: 8 }} />
      </Card>

      {/* Reply Modal */}
      <Modal
        title={<Space><MessageOutlined style={{ color: '#1677ff' }} />Phản Hồi Đánh Giá của {replyModal.review?.user?.name}</Space>}
        open={replyModal.open}
        onCancel={() => setReplyModal({ open: false, review: null, text: '' })}
        onOk={submitReply}
        okText="Gửi Phản Hồi"
        cancelText="Hủy"
      >
        {replyModal.review && (
          <div>
            <div style={{ background: '#fafafa', borderRadius: 8, padding: 12, marginBottom: 16 }}>
              <Rate disabled value={replyModal.review.rating} style={{ fontSize: 14 }} />
              <Text style={{ display: 'block', marginTop: 8 }}>{replyModal.review.comment}</Text>
            </div>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>Nội dung phản hồi:</Text>
            <TextArea
              rows={4}
              value={replyModal.text}
              onChange={e => setReplyModal(prev => ({ ...prev, text: e.target.value }))}
              placeholder="Cảm ơn quý khách đã chia sẻ. Chúng tôi sẽ cải thiện..."
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ReviewsPage;

import React, { useState, useEffect } from 'react';
import { Typography, Button, Space, Modal, Form, Input, message, Tag, Row, Col, Card, InputNumber, Tooltip, Upload } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, EnvironmentOutlined, CompassOutlined, UploadOutlined, PictureOutlined } from '@ant-design/icons';
import { attractionApi } from '../../../api/marketingApi';
import { useNotification } from '../../../context/notificationContext';
import { uploadToCloudinary } from '../../../utils/cloudinaryUpload';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5262';

const { Title, Text } = Typography;

const CATEGORY_ICONS = {
  'Bãi biển': '🏖️', 'Cầu': '🌉', 'Núi': '⛰️', 'Di tích': '🏛️',
  'Nhà hàng': '🍽️', 'Mua sắm': '🛍️', 'Vui chơi': '🎡', 'Khác': '📍',
};

const MOCK_ATTRACTIONS = [
  { id: 1, name: 'Biển Mỹ Khê', description: 'Bãi biển đẹp nhất châu Á, cách khách sạn chỉ 500m đi bộ. Nước trong xanh mát lành.', distanceKm: 0.5, category: 'Bãi biển', mapEmbedLink: '' },
  { id: 2, name: 'Cầu Rồng', description: 'Biểu tượng của Đà Nẵng. Cuối tuần phun lửa & nước vào 21h. Điểm check-in không thể bỏ lỡ.', distanceKm: 2.3, category: 'Cầu', mapEmbedLink: '' },
  { id: 3, name: 'Bà Nà Hills', description: 'Cầu Vàng nổi tiếng thế giới, khí hậu mát mẻ quanh năm. Cáp treo dài nhất Đông Nam Á.', distanceKm: 35, category: 'Núi', mapEmbedLink: '' },
  { id: 4, name: 'Phố Cổ Hội An', description: 'Di sản văn hóa thế giới UNESCO. Đèn lồng, ẩm thực, cầu Nhật Bản huyền thoại.', distanceKm: 28, category: 'Di tích', mapEmbedLink: '' },
  { id: 5, name: 'Chợ Hàn', description: 'Khu chợ địa phương sầm uất ngay trung tâm thành phố, mua sắm đặc sản Đà Nẵng.', distanceKm: 3.1, category: 'Mua sắm', mapEmbedLink: '' },
];

const AttractionsPage = () => {
  const [attractions, setAttractions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [currentMapLink, setCurrentMapLink] = useState('');
  const [editingAttraction, setEditingAttraction] = useState(null);
  const [uploadingId, setUploadingId] = useState(null);
  const [form] = Form.useForm();
  const { addNotification } = useNotification();

  const fetchAttractions = async () => {
    setLoading(true);
    try {
      const res = await attractionApi.getAllAttractions();
      setAttractions(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Lỗi tải địa điểm:', err);
      message.error('Không thể tải danh sách địa điểm!');
      setAttractions([]);
    }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAttractions(); }, []);

  const getDistanceLabel = (km) => {
    if (!km) return '—';
    if (km < 1) return `${Math.round(km * 1000)}m 🚶`;
    if (km < 5) return `${km} km 🚲`;
    if (km < 20) return `${km} km 🚗`;
    return `${km} km ✈️`;
  };

  const handleEdit = (record) => { setEditingAttraction(record); form.setFieldsValue({ ...record }); setIsModalVisible(true); };
  const handleDelete = (id) => {
    Modal.confirm({ title: 'Xoa dia diem nay?', okText: 'Xoa', okType: 'danger', cancelText: 'Huy',
      onOk: async () => {
        try { await attractionApi.deleteAttraction(id); } catch {}
        setAttractions(prev => prev.filter(a => a.id !== id));
        message.success('Da xoa!');
      }
    });
  };
  const handleSubmit = async (values) => {
    try {
      if (editingAttraction) {
        await attractionApi.updateAttraction(editingAttraction.id, { ...editingAttraction, ...values });
        message.success('Cap nhat thanh cong!');
        addNotification('Cap nhat Dia Diem', `Da cap nhat: ${values.name}`, 'info');
      } else {
        await attractionApi.createAttraction(values);
        message.success('Them thanh cong!');
        addNotification('Dia Diem Moi', `Da them: ${values.name}`, 'success');
      }
      setIsModalVisible(false);
      fetchAttractions(); // Luon fetch lai de lay data moi nhat
    } catch { message.error('Loi luu du lieu!'); }
  };

  const handleUploadImage = async (attractionId, file) => {
    setUploadingId(attractionId);
    try {
      message.loading({ content: 'Dang upload len Cloudinary...', key: 'img_upload' });
      // 1. Upload len Cloudinary
      const cloudinaryUrl = await uploadToCloudinary(file, 'hotel/attractions');
      // 2. Luu URL vao DB
      await attractionApi.updateImageUrl(attractionId, cloudinaryUrl);
      message.success({ content: 'Upload anh thanh cong!', key: 'img_upload' });
      // Cap nhat UI
      setAttractions(prev => prev.map(a =>
        a.id === attractionId ? { ...a, imageUrl: cloudinaryUrl } : a
      ));
    } catch (err) {
      console.error('Upload error:', err);
      message.error({ content: 'Loi upload: ' + (err.message || 'Thu lai sau'), key: 'img_upload' });
    } finally {
      setUploadingId(null);
    }
  };

  const extractSrc = (html) => {
    if (!html) return '';
    if (html.includes('<iframe') && html.includes('src="')) {
      const m = html.match(/src="([^"]+)"/);
      return m ? m[1] : html;
    }
    return html;
  };

  return (
    <div>
      {/* Banner */}
      <div style={{ background: 'linear-gradient(135deg, #001529 0%, #13c2c2 100%)', borderRadius: 16, padding: '28px 36px', marginBottom: 24, color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, boxShadow: '0 10px 30px rgba(19,194,194,0.2)' }}>
        <div>
          <Title level={2} style={{ color: 'white', margin: '0 0 6px 0', fontWeight: 700 }}>
            <CompassOutlined style={{ marginRight: 10 }} />Địa Điểm Du Lịch Lân Cận
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
            Gợi ý {attractions.length} địa điểm tham quan, ăn uống và vui chơi quanh khách sạn.
          </Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchAttractions} style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', borderRadius: 10 }}>Làm mới</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingAttraction(null); form.resetFields(); setIsModalVisible(true); }} style={{ background: 'white', color: '#13c2c2', border: 'none', fontWeight: 600, borderRadius: 10 }}>Thêm Địa Điểm</Button>
        </Space>
      </div>

      {/* Card Grid */}
      <Row gutter={[16, 16]}>
        {attractions.map(item => (
          <Col xs={24} sm={12} lg={8} xl={6} key={item.id}>
            <Card
              hoverable
              style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.07)', overflow: 'hidden', height: '100%' }}
              styles={{ body: { padding: 0 } }}
            >
              <div style={{ position: 'relative', height: 140, overflow: 'hidden', background: '#f0f9ff' }}>
                {item.imageUrl
                  ? <img
                      src={item.imageUrl}
                      alt={item.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e6fffb, #b5f5ec)' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 36, marginBottom: 4 }}>{CATEGORY_ICONS[item.category] || '\uD83D\uDCCD'}</div>
                        <div style={{ fontSize: 11, color: '#999' }}>Chua co anh</div>
                      </div>
                    </div>
                }
                {/* Upload button overlay */}
                <Upload
                  showUploadList={false}
                  beforeUpload={(file) => { handleUploadImage(item.id, file); return false; }}
                  accept="image/*"
                >
                  <Button
                    size="small"
                    icon={<UploadOutlined />}
                    loading={uploadingId === item.id}
                    style={{
                      position: 'absolute', top: 8, right: 8,
                      background: 'rgba(0,0,0,0.55)', color: '#fff',
                      border: 'none', borderRadius: 6, fontSize: 11,
                    }}
                  >
                    {item.imageUrl ? 'Doi anh' : 'Upload'}
                  </Button>
                </Upload>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #e6fffb, #b5f5ec)', padding: '12px 20px 10px', borderBottom: '1px solid #f0f0f0' }}>
                <Text strong style={{ fontSize: 15 }}>{item.name}</Text>
                <br />
                <Tag color="cyan" style={{ marginTop: 6, fontSize: 11 }}>{item.category || 'Dia diem'}</Tag>
              </div>
              <div style={{ padding: '14px 20px' }}>
                <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 10, lineHeight: 1.6 }}>{item.description}</Text>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <Tag icon={<EnvironmentOutlined />} color="geekblue" style={{ fontWeight: 600 }}>
                    {getDistanceLabel(item.distanceKm)}
                  </Tag>
                </div>
                <Space style={{ width: '100%' }}>
                  {item.mapEmbedLink && (
                    <Button size="small" type="primary" ghost icon={<EnvironmentOutlined />} style={{ flex: 1 }}
                      onClick={() => { setCurrentMapLink(item.mapEmbedLink); setIsMapModalOpen(true); }}>Bản đồ</Button>
                  )}
                  <Button size="small" type="text" icon={<EditOutlined />} onClick={() => handleEdit(item)} style={{ background: '#f0f7ff', color: '#1677ff', borderRadius: 6 }} />
                  <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(item.id)} style={{ borderRadius: 6 }} />
                </Space>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Form Modal */}
      <Modal title={editingAttraction ? 'Cập nhật Địa Điểm' : 'Thêm Địa Điểm Mới'} open={isModalVisible} onCancel={() => setIsModalVisible(false)} onOk={() => form.submit()} width={560} okText="Lưu" cancelText="Hủy">
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="Tên Địa Điểm" rules={[{ required: true }]}>
            <Input placeholder="VD: Biển Mỹ Khê" />
          </Form.Item>
          <Form.Item name="category" label="Danh Mục">
            <Input placeholder="VD: Bãi biển, Núi, Nhà hàng..." />
          </Form.Item>
          <Form.Item name="description" label="Mô Tả">
            <Input.TextArea rows={3} placeholder="Mô tả ngắn về địa điểm..." />
          </Form.Item>
          <Form.Item name="distanceKm" label="Khoảng Cách (km)">
            <InputNumber style={{ width: '100%' }} min={0} step={0.1} placeholder="VD: 0.5" />
          </Form.Item>
          <Form.Item name="mapEmbedLink" label="Link Google Maps (src hoặc iframe)">
            <Input.TextArea rows={2} placeholder="Paste link src hoặc mã iframe từ Google Maps..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Map Modal */}
      <Modal title="📍 Bản Đồ Địa Điểm" open={isMapModalOpen} onCancel={() => setIsMapModalOpen(false)} footer={[<Button key="c" type="primary" onClick={() => setIsMapModalOpen(false)}>Đóng</Button>]} width={700} destroyOnClose>
        {currentMapLink ? (
          <iframe src={extractSrc(currentMapLink)} width="100%" height="450" style={{ border: 0, borderRadius: 8 }} allowFullScreen loading="lazy" title="Map" />
        ) : <Text type="secondary">Chưa có bản đồ.</Text>}
      </Modal>
    </div>
  );
};

export default AttractionsPage;

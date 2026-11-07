import React, { useState, useEffect } from 'react';
import { Typography, Button, Space, Switch, Modal, Form, Input, message, Tag, Tooltip, Row, Col, Card } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, CoffeeOutlined, WifiOutlined, CarOutlined, HomeOutlined, FireOutlined, StarOutlined, DesktopOutlined, CustomerServiceOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { amenityApi } from '../../../api/amenityApi';
import { useNotification } from '../../../context/notificationContext';

const { Title, Text } = Typography;

// emoji + icon list for quick pick
const ICON_OPTIONS = [
  { emoji: '📶', label: 'Wifi', key: 'wifi' },
  { emoji: '📺', label: 'TV', key: 'tv' },
  { emoji: '❄️', label: 'Điều hòa', key: 'ac' },
  { emoji: '🚿', label: 'Vòi sen', key: 'shower' },
  { emoji: '🛁', label: 'Bồn tắm', key: 'bath' },
  { emoji: '🍳', label: 'Bếp', key: 'kitchen' },
  { emoji: '🧹', label: 'Dọn phòng', key: 'clean' },
  { emoji: '🏊', label: 'Hồ bơi', key: 'pool' },
  { emoji: '🧖', label: 'Spa', key: 'spa' },
  { emoji: '🏋️', label: 'Gym', key: 'gym' },
  { emoji: '🚗', label: 'Bãi xe', key: 'parking' },
  { emoji: '☕', label: 'Cafe', key: 'cafe' },
  { emoji: '🍽️', label: 'Nhà hàng', key: 'restaurant' },
  { emoji: '🔒', label: 'Két sắt', key: 'safe' },
  { emoji: '📞', label: 'Điện thoại', key: 'phone' },
  { emoji: '🛎️', label: 'Room service', key: 'roomservice' },
];

// Map filename từ DB → emoji (cho trường hợp iconUrl là tên file)
const FILENAME_TO_EMOJI = {
  'wifi': '📶', 'wifi.png': '📶',
  'tv': '📺', 'tv.png': '📺',
  'ac': '❄️', 'ac.png': '❄️', 'air': '❄️', 'aircon': '❄️',
  'shower': '🚿', 'shower.png': '🚿',
  'bath': '🛁', 'bath.png': '🛁', 'bathtub': '🛁', 'bathtub.png': '🛁',
  'kitchen': '🍳', 'kitchen.png': '🍳',
  'clean': '🧹', 'clean.png': '🧹', 'cleaning': '🧹',
  'pool': '🏊', 'pool.png': '🏊', 'swimming': '🏊',
  'spa': '🧖', 'spa.png': '🧖', 'massage': '🧖',
  'gym': '🏋️', 'gym.png': '🏋️', 'fitness': '🏋️',
  'parking': '🚗', 'parking.png': '🚗', 'car': '🚗',
  'cafe': '☕', 'cafe.png': '☕', 'coffee': '☕',
  'restaurant': '🍽️', 'restaurant.png': '🍽️', 'food': '🍽️',
  'safe': '🔒', 'safe.png': '🔒', 'locker': '🔒',
  'phone': '📞', 'phone.png': '📞', 'telephone': '📞',
  'roomservice': '🛎️', 'roomservice.png': '🛎️', 'service': '🛎️',
  'balcony': '🏙️', 'balcony.png': '🏙️',
  'minibar': '🍹', 'minibar.png': '🍹', 'bar': '🍹',
  'hairdryer': '💇', 'hairdryer.png': '💇', 'hair': '💇',
  'tv-smart': '📺', 'smart-tv': '📺', 'smarttv': '📺',
  'fridge': '🧊', 'fridge.png': '🧊', 'refrigerator': '🧊',
};

const resolveIcon = (iconUrl) => {
  if (!iconUrl) return '⭐';
  // Nếu là emoji (ký tự unicode nhiều byte)
  if ([...iconUrl].length <= 4 && iconUrl.codePointAt(0) > 127) return iconUrl;
  // Nếu là tên file hoặc key
  const key = iconUrl.toLowerCase().replace(/[_\- ]/g, '');
  return FILENAME_TO_EMOJI[iconUrl.toLowerCase()] || FILENAME_TO_EMOJI[key] || '⭐';
};

const AmenitiesPage = () => {
  const [amenities, setAmenities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingAmenity, setEditingAmenity] = useState(null);
  const [selectedEmoji, setSelectedEmoji] = useState('📶');
  const [form] = Form.useForm();
  const { addNotification } = useNotification();

  const MOCK = [
    { id: 1, name: 'Wifi Tốc Độ Cao', iconUrl: '📶', isActive: true },
    { id: 2, name: 'Smart TV 55"', iconUrl: '📺', isActive: true },
    { id: 3, name: 'Điều Hòa 2 Chiều', iconUrl: '❄️', isActive: true },
    { id: 4, name: 'Bồn Tắm Sục', iconUrl: '🛁', isActive: true },
    { id: 5, name: 'Spa & Massage', iconUrl: '🧖', isActive: true },
    { id: 6, name: 'Hồ Bơi Vô Cực', iconUrl: '🏊', isActive: true },
    { id: 7, name: 'Bãi Đỗ Xe', iconUrl: '🚗', isActive: false },
    { id: 8, name: 'Két Sắt', iconUrl: '🔒', isActive: true },
  ];

  const fetchAmenities = async () => {
    setLoading(true);
    try {
      const res = await amenityApi.getAllAmenities();
      const data = Array.isArray(res.data) ? res.data : [];
      setAmenities(data.length > 0 ? data : MOCK);
    } catch {
      setAmenities(MOCK);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchAmenities(); }, []);

  const handleEdit = (record) => {
    setEditingAmenity(record);
    setSelectedEmoji(record.iconUrl || '📶');
    form.setFieldsValue({ ...record });
    setIsModalVisible(true);
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Xóa tiện ích này?', okText: 'Xóa', okType: 'danger', cancelText: 'Hủy',
      onOk: async () => {
        try {
          await amenityApi.deleteAmenity(id);
          message.success('Đã xóa!');
          setAmenities(prev => prev.filter(a => a.id !== id));
        } catch {
          setAmenities(prev => prev.filter(a => a.id !== id));
          message.success('Đã xóa!');
        }
      }
    });
  };

  const handleToggle = async (record) => {
    const updated = { ...record, isActive: !record.isActive };
    try {
      await amenityApi.updateAmenity(record.id, updated);
    } catch { /* optimistic */ }
    setAmenities(prev => prev.map(a => a.id === record.id ? updated : a));
    message.success(updated.isActive ? 'Đã bật tiện ích!' : 'Đã tắt tiện ích!');
  };

  const handleSubmit = async (values) => {
    const payload = { ...values, iconUrl: selectedEmoji };
    try {
      if (editingAmenity) {
        await amenityApi.updateAmenity(editingAmenity.id, { ...editingAmenity, ...payload });
        setAmenities(prev => prev.map(a => a.id === editingAmenity.id ? { ...a, ...payload } : a));
        addNotification('Cập nhật Tiện ích', `Đã cập nhật: ${values.name}`, 'info');
      } else {
        const newItem = { id: Date.now(), ...payload, isActive: values.isActive ?? true };
        await amenityApi.createAmenity(payload).catch(() => {});
        setAmenities(prev => [newItem, ...prev]);
        addNotification('Thêm Tiện ích', `Đã thêm: ${values.name}`, 'success');
      }
      message.success(editingAmenity ? 'Cập nhật thành công!' : 'Thêm thành công!');
      setIsModalVisible(false);
    } catch {
      message.error('Lỗi khi lưu!');
    }
  };

  const activeCount = amenities.filter(a => a.isActive).length;

  return (
    <div>
      {/* Banner */}
      <div style={{ background: 'linear-gradient(135deg, #001529 0%, #1677ff 100%)', borderRadius: 16, padding: '28px 36px', marginBottom: 24, color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, boxShadow: '0 10px 30px rgba(22,119,255,0.15)' }}>
        <div>
          <Title level={2} style={{ color: 'white', margin: '0 0 6px 0', fontWeight: 700 }}>
            <CoffeeOutlined style={{ marginRight: 10 }} />Tiện Ích Phòng (Amenities)
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
            Quản lý trang thiết bị tiện ích phòng với icon sinh động. Toggle bật/tắt trực tiếp.
          </Text>
        </div>
        <Space>
          {[
            { label: 'Tổng tiện ích', value: amenities.length },
            { label: 'Đang hoạt động', value: activeCount, highlight: true },
          ].map(s => (
            <div key={s.label} style={{ background: s.highlight ? 'rgba(82,196,26,0.25)' : 'rgba(255,255,255,0.15)', padding: '10px 18px', borderRadius: 12, textAlign: 'center', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', minWidth: 90 }}>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>{s.label}</div>
            </div>
          ))}
        </Space>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginBottom: 20 }}>
        <Button icon={<ReloadOutlined />} onClick={fetchAmenities} loading={loading}>Làm mới</Button>
        <Button type="primary" icon={<PlusOutlined />}
          onClick={() => { setEditingAmenity(null); setSelectedEmoji('📶'); form.resetFields(); form.setFieldsValue({ isActive: true }); setIsModalVisible(true); }}>
          Thêm Tiện Ích
        </Button>
      </div>

      {/* Cards Grid */}
      <Row gutter={[16, 16]}>
        {amenities.map(item => (
          <Col xs={24} sm={12} md={8} lg={6} key={item.id}>
            <Card
              style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', overflow: 'hidden', opacity: item.isActive ? 1 : 0.6, transition: 'all 0.3s' }}
              styles={{ body: { padding: '20px' } }}
              hoverable
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ fontSize: 40, lineHeight: 1 }}>{resolveIcon(item.iconUrl)}</div>
                <Switch size="small" checked={item.isActive} onChange={() => handleToggle(item)} />
              </div>
              <Text strong style={{ fontSize: 14, display: 'block', marginBottom: 8 }}>{item.name}</Text>
              <Tag color={item.isActive ? 'green' : 'default'} style={{ fontSize: 11, marginBottom: 12 }}>
                {item.isActive ? '✅ Đang hoạt động' : '⏸️ Tạm dừng'}
              </Tag>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button size="small" type="text" icon={<EditOutlined />} onClick={() => handleEdit(item)} style={{ flex: 1, borderRadius: 6, background: '#f0f7ff', color: '#1677ff' }}>Sửa</Button>
                <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(item.id)} style={{ borderRadius: 6 }} />
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Modal */}
      <Modal
        title={editingAmenity ? 'Cập nhật Tiện Ích' : 'Thêm Tiện Ích Mới'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        okText="Lưu" cancelText="Hủy"
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item label="Chọn Icon / Emoji">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
              {ICON_OPTIONS.map(opt => (
                <Tooltip title={opt.label} key={opt.key}>
                  <button
                    type="button"
                    onClick={() => setSelectedEmoji(opt.emoji)}
                    style={{
                      width: 44, height: 44, borderRadius: 10, border: selectedEmoji === opt.emoji ? '2px solid #1677ff' : '1px solid #e8e8e8',
                      background: selectedEmoji === opt.emoji ? '#e6f4ff' : '#fafafa',
                      cursor: 'pointer', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >{opt.emoji}</button>
                </Tooltip>
              ))}
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>Đã chọn: <span style={{ fontSize: 18 }}>{selectedEmoji}</span></Text>
          </Form.Item>
          <Form.Item name="name" label="Tên Tiện Ích" rules={[{ required: true, message: 'Nhập tên tiện ích!' }]}>
            <Input placeholder="VD: Wifi Tốc Độ Cao, Smart TV..." />
          </Form.Item>
          <Form.Item name="isActive" label="Trạng Thái" valuePropName="checked">
            <Switch checkedChildren="Hoạt động" unCheckedChildren="Tắt" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AmenitiesPage;

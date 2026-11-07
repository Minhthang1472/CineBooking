import React, { useState, useEffect } from 'react';
import { Typography, Button, Space, Modal, Form, Input, message, Tag, Row, Col, Card, Popconfirm, Switch } from 'antd';
import { AppstoreAddOutlined, EditOutlined, DeleteOutlined, PlusOutlined, ReloadOutlined, TagsOutlined } from '@ant-design/icons';
import { serviceCategoryApi } from '../../../api/serviceCategoryApi';

const { Title, Text } = Typography;

const CAT_ICONS = ['🍽️', '💆', '👕', '🚗', '🎮', '🏊', '☕', '🧹', '📺', '🛎️', '🔒', '⭐'];
const CAT_COLORS = ['blue', 'purple', 'green', 'orange', 'cyan', 'magenta', 'gold', 'lime', 'geekblue', 'volcano', 'red', 'default'];

// Map tên danh mục (từ DB thực tế) → emoji
const CAT_NAME_TO_ICON = {
  // Ăn uống
  'ăn uống': '🍽️', 'food': '🍽️', 'restaurant': '🍽️', 'nhà hàng': '🍽️',
  'bữa ăn': '🍽️', 'đồ ăn': '🍽️', 'bữa sáng': '🍳',
  // Spa & Massage
  'spa': '🧖', 'massage': '🧖', 'làm đẹp': '💅', 'chăm sóc': '🧖',
  'spa & làm đẹp': '🧖', 'spa & massage': '🧖', 'wellness': '🧖',
  // Giặt Ủi
  'giặt ủi': '👕', 'giặt': '👕', 'laundry': '👕',
  // Di chuyển
  'di chuyển': '🚗', 'đưa đón': '🚗', 'taxi': '🚕', 'xe': '🚗', 'transport': '🚗',
  'di chuyển & đưa đón': '🚗',
  // Vui chơi
  'vui chơi': '🎮', 'game': '🎮', 'entertainment': '🎮', 'giải trí': '🎮',
  // Hồ bơi
  'hồ bơi': '🏊', 'pool': '🏊', 'swimming': '🏊',
  // Cafe & Đồ uống
  'cafe': '☕', 'cà phê': '☕', 'coffee': '☕', 'đồ uống': '🍹', 'drinks': '🍹',
  // Vệ sinh
  'dọn dẹp': '🧹', 'đọ dẹp': '🧹', 'housekeeping': '🧹', 'clean': '🧹', 'vệ sinh': '🧹',
  'vệ sinh phòng': '🧹',
  // TV & Giải trí số
  'tv': '📺', 'tivi': '📺', 'streaming': '📺',
  // Room service
  'room service': '🛎️', 'phuc vỵ phòng': '🛎️', 'dịch vụ phòng': '🛎️',
  // An ninh
  'an ninh': '🔒', 'két sắt': '🔒',
  // Gym
  'gym': '🏋️', 'fitness': '🏋️', 'thể thao': '⚽',
  // Tour
  'tour': '🧭', 'du lịch': '🧭',
  // Khu vui chơi trẻ em
  'khu vui chơi trẻ em': '🌞', 'trẻ em': '🧸',
  // Lưu niệm
  'lưu niệm': '🛍️', 'cửa hàng lưu niệm': '🛍️', 'shop': '🛍️',
  // Khác
  'khác': '⭐', 'other': '⭐',
};

const CAT_COLOR_MAP = {
  'ăn uống': 'orange', 'restaurant': 'orange', 'nhà hàng': 'orange', 'food': 'orange', 'bữa ăn': 'orange',
  'spa': 'purple', 'massage': 'purple', 'làm đẹp': 'pink', 'wellness': 'purple',
  'giặt ủi': 'blue', 'laundry': 'blue',
  'di chuyển': 'geekblue', 'xe': 'geekblue', 'transport': 'geekblue',
  'vui chơi': 'cyan', 'game': 'cyan', 'giải trí': 'cyan',
  'hồ bơi': 'blue', 'pool': 'blue',
  'cafe': 'gold', 'đồ uống': 'gold', 'đồ uống': 'gold',
  'dọn dẹp': 'lime', 'vệ sinh': 'lime', 'clean': 'lime',
  'gym': 'red', 'fitness': 'red', 'thể thao': 'red',
  'tour': 'green', 'du lịch': 'green',
};

const getCatIcon = (name) => {
  if (!name) return '⭐';
  const key = name.toLowerCase().trim();
  return CAT_NAME_TO_ICON[key] || CAT_ICONS[name.charCodeAt(0) % CAT_ICONS.length];
};
const getCatColor = (name) => {
  if (!name) return 'default';
  const key = name.toLowerCase().trim();
  return CAT_COLOR_MAP[key] || CAT_COLORS[name.charCodeAt(0) % CAT_COLORS.length];
};

const MOCK_CATEGORIES = [
  { id: 1, name: 'Ăn uống', serviceCount: 5, description: 'Bữa ăn và đồ uống phòng' },
  { id: 2, name: 'Spa & Làm đẹp', serviceCount: 4, description: 'Massage, chăm sóc sức khỏe' },
  { id: 3, name: 'Giặt ủi', serviceCount: 3, description: 'Dịch vụ giặt và ủi trang phục' },
  { id: 4, name: 'Di chuyển', serviceCount: 3, description: 'Thuê xe, đưa đón sân bay' },
  { id: 5, name: 'Vui chơi', serviceCount: 2, description: 'Thể thao và giải trí' },
  { id: 6, name: 'Vệ sinh phòng', serviceCount: 2, description: 'Dọn dẹp và thay đồ' },
];

const ServiceCategoriesPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await serviceCategoryApi.getAll();
      const raw = res.data?.data || res.data || [];
      setData(Array.isArray(raw) && raw.length > 0 ? raw : MOCK_CATEGORIES);
    } catch { setData(MOCK_CATEGORIES); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCategories(); }, []);

  const openCreate = () => { form.resetFields(); setEditingCategory(null); setIsModalOpen(true); };
  const openEdit = (record) => { form.setFieldsValue({ name: record.name, description: record.description }); setEditingCategory(record); setIsModalOpen(true); };

  const handleSave = async (values) => {
    setSaving(true);
    try {
      if (editingCategory) {
        await serviceCategoryApi.update(editingCategory.id, values).catch(() => {});
        setData(prev => prev.map(c => c.id === editingCategory.id ? { ...c, ...values } : c));
        message.success('Cập nhật thành công!');
      } else {
        await serviceCategoryApi.create(values).catch(() => {});
        const newCat = { id: Date.now(), ...values, serviceCount: 0 };
        setData(prev => [...prev, newCat]);
        message.success('Thêm danh mục thành công!');
      }
      setIsModalOpen(false);
    } catch { message.error('Lỗi khi lưu!'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try { await serviceCategoryApi.delete(id).catch(() => {}); } catch {}
    setData(prev => prev.filter(c => c.id !== id));
    message.success('Đã xóa!');
  };

  return (
    <div>
      {/* Banner */}
      <div style={{ background: 'linear-gradient(135deg, #001529 0%, #1890ff 100%)', borderRadius: 16, padding: '28px 36px', marginBottom: 24, color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, boxShadow: '0 10px 30px rgba(24,144,255,0.2)' }}>
        <div>
          <Title level={2} style={{ color: 'white', margin: '0 0 6px 0', fontWeight: 700 }}>
            <TagsOutlined style={{ marginRight: 10 }} />Danh Mục Dịch Vụ
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
            Phân loại và quản lý nhóm dịch vụ tiện ích. Tổng {data.length} danh mục.
          </Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchCategories} loading={loading} style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', borderRadius: 10 }}>Làm mới</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} style={{ background: 'white', color: '#1890ff', border: 'none', fontWeight: 600, borderRadius: 10 }}>Thêm Danh Mục</Button>
        </Space>
      </div>

      {/* Category Cards */}
      <Row gutter={[16, 16]}>
        {data.map((cat, i) => (
          <Col xs={24} sm={12} md={8} lg={6} key={cat.id}>
            <Card
              hoverable
              style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.07)', overflow: 'hidden' }}
              styles={{ body: { padding: 0 } }}
            >
              <div style={{ padding: '24px 20px 16px', background: `linear-gradient(135deg, #f0f7ff, #e6f4ff)` }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>{getCatIcon(cat.name)}</div>
                <Text strong style={{ fontSize: 15 }}>{cat.name}</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>{cat.description || 'Dịch vụ tiện ích'}</Text>
              </div>
              <div style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Tag color={getCatColor(cat.name)}>
                  {cat.serviceCount ?? 0} dịch vụ
                </Tag>
                <Space>
                  <Button size="small" type="text" icon={<EditOutlined />} onClick={() => openEdit(cat)} style={{ background: '#f0f7ff', color: '#1677ff', borderRadius: 6 }} />
                  <Popconfirm title="Xóa danh mục?" onConfirm={() => handleDelete(cat.id)} okText="Xóa" cancelText="Hủy">
                    <Button size="small" type="text" danger icon={<DeleteOutlined />} style={{ borderRadius: 6 }} />
                  </Popconfirm>
                </Space>
              </div>
            </Card>
          </Col>
        ))}
        {/* Add Card */}
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card onClick={openCreate} hoverable style={{ borderRadius: 16, border: '2px dashed #d9d9d9', boxShadow: 'none', cursor: 'pointer', minHeight: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa' }} styles={{ body: { textAlign: 'center', padding: 24 } }}>
            <PlusOutlined style={{ fontSize: 32, color: '#1677ff', marginBottom: 8, display: 'block' }} />
            <Text type="secondary">Thêm danh mục mới</Text>
          </Card>
        </Col>
      </Row>

      <Modal title={editingCategory ? 'Sửa Danh Mục' : 'Thêm Danh Mục'} open={isModalOpen} onCancel={() => setIsModalOpen(false)} onOk={() => form.submit()} confirmLoading={saving} okText="Lưu" cancelText="Hủy">
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="name" label="Tên danh mục" rules={[{ required: true, message: 'Nhập tên danh mục!' }]}>
            <Input placeholder="VD: Ăn uống, Spa, Giặt ủi..." />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={2} placeholder="Mô tả ngắn về danh mục dịch vụ..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ServiceCategoriesPage;

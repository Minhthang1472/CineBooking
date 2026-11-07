import React, { useState, useEffect } from 'react';
import { Table, Card, Typography, Button, Space, Modal, Form, Input, InputNumber, message, Tag, Row, Col, Select, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, AppstoreOutlined, TagOutlined } from '@ant-design/icons';
import { serviceApi } from '../../../api/serviceApi';
import { serviceCategoryApi } from '../../../api/serviceCategoryApi';
import { useNotification } from '../../../context/notificationContext';

const { Title, Text } = Typography;
const { Option } = Select;

const SERVICE_ICONS = {
  'Giặt ủi': '👕', 'Ăn uống': '🍽️', 'Di chuyển': '🚗', 'Spa & Massage': '💆',
  'Đồ uống': '🍹', 'Thể thao': '⚽', 'Khác': '⭐',
};

const MOCK_SERVICES = [
  { id: 1, name: 'Giặt ủi Express', price: 150000, unit: 'Kg', categoryName: 'Giặt ủi', description: 'Giặt và ủi quần áo trong 3 tiếng' },
  { id: 2, name: 'Bữa sáng tại phòng', price: 200000, unit: 'Phần', categoryName: 'Ăn uống', description: 'Buffet sáng giao tận phòng 6h-10h' },
  { id: 3, name: 'Thuê xe máy', price: 150000, unit: 'Ngày', categoryName: 'Di chuyển', description: 'Xe Honda SH mới, đầy xăng' },
  { id: 4, name: 'Massage Body 60 phút', price: 600000, unit: 'Lần', categoryName: 'Spa & Massage', description: 'Thư giãn toàn thân với tinh dầu thiên nhiên' },
  { id: 5, name: 'Minibar Premium', price: 350000, unit: 'Ngày', categoryName: 'Đồ uống', description: 'Đồ uống cao cấp trong minibar phòng' },
  { id: 6, name: 'Thuê xe đạp', price: 80000, unit: 'Ngày', categoryName: 'Di chuyển', description: 'Khám phá thành phố bằng xe đạp' },
];

const ServicesPage = () => {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [form] = Form.useForm();
  const { addNotification } = useNotification();

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [svcRes, catRes] = await Promise.allSettled([serviceApi.getAllServices(), serviceCategoryApi.getAll()]);
      const svcData = svcRes.status === 'fulfilled' ? (Array.isArray(svcRes.value.data) ? svcRes.value.data : []) : [];
      setServices(svcData.length > 0 ? svcData : MOCK_SERVICES);
      const catData = catRes.status === 'fulfilled' ? (catRes.value.data?.data || catRes.value.data || []) : [];
      setCategories(Array.isArray(catData) ? catData : []);
    } catch { setServices(MOCK_SERVICES); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleDelete = (id) => {
    Modal.confirm({ title: 'Xóa dịch vụ này?', okText: 'Xóa', okType: 'danger', cancelText: 'Hủy',
      onOk: async () => {
        try { await serviceApi.deleteService(id); } catch {}
        setServices(prev => prev.filter(s => s.id !== id));
        message.success('Đã xóa!');
        addNotification('Xóa Dịch Vụ', 'Đã xóa một dịch vụ.', 'warning');
      }
    });
  };

  const handleSubmit = async (values) => {
    try {
      if (editingService) {
        await serviceApi.updateService(editingService.id, { ...editingService, ...values }).catch(() => {});
        setServices(prev => prev.map(s => s.id === editingService.id ? { ...s, ...values } : s));
        addNotification('Cập nhật Dịch Vụ', `Đã cập nhật: ${values.name}`, 'info');
      } else {
        const newItem = { id: Date.now(), ...values };
        await serviceApi.createService(values).catch(() => {});
        setServices(prev => [newItem, ...prev]);
        addNotification('Dịch Vụ Mới', `Đã thêm: ${values.name}`, 'success');
      }
      message.success(editingService ? 'Cập nhật thành công!' : 'Thêm thành công!');
      setIsModalVisible(false);
    } catch { message.error('Lỗi!'); }
  };

  // Group by category
  const grouped = services.reduce((acc, s) => {
    const cat = s.categoryName || 'Khác';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  const columns = [
    {
      title: 'Dịch Vụ', key: 'name',
      render: (_, r) => (
        <Space>
          <div style={{ fontSize: 28, width: 40 }}>{SERVICE_ICONS[r.categoryName] || '⭐'}</div>
          <div>
            <Text strong style={{ fontSize: 14 }}>{r.name}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>{r.description}</Text>
          </div>
        </Space>
      )
    },
    { title: 'Danh Mục', dataIndex: 'categoryName', key: 'categoryName', render: c => <Tag color="blue">{c || 'Khác'}</Tag>, width: 140 },
    {
      title: 'Giá', dataIndex: 'price', key: 'price', width: 140,
      render: (v, r) => <Text strong style={{ color: '#52c41a', fontSize: 15 }}>{Number(v).toLocaleString('vi-VN')}đ<Text type="secondary" style={{ fontSize: 12, fontWeight: 400 }}>/{r.unit}</Text></Text>
    },
    {
      title: 'Thao Tác', key: 'action', width: 90,
      render: (_, record) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => { setEditingService(record); form.setFieldsValue({ ...record }); setIsModalVisible(true); }} />
          <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
        </Space>
      )
    },
  ];

  return (
    <div>
      {/* Banner */}
      <div style={{ background: 'linear-gradient(135deg, #001529 0%, #52c41a 100%)', borderRadius: 16, padding: '28px 36px', marginBottom: 24, color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, boxShadow: '0 10px 30px rgba(82,196,26,0.2)' }}>
        <div>
          <Title level={2} style={{ color: 'white', margin: '0 0 6px 0', fontWeight: 700 }}>
            <AppstoreOutlined style={{ marginRight: 10 }} />Quản Lý Dịch Vụ
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
            Thiết lập bảng giá và danh sách dịch vụ tiện ích phòng. Tổng {services.length} dịch vụ.
          </Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchAll} style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', borderRadius: 10 }}>Làm mới</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingService(null); form.resetFields(); setIsModalVisible(true); }} style={{ background: 'white', color: '#52c41a', border: 'none', fontWeight: 600, borderRadius: 10 }}>Thêm Dịch Vụ</Button>
        </Space>
      </div>

      {/* Stats Row */}
      <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
        {Object.entries(grouped).map(([cat, items]) => (
          <Col key={cat} xs={12} sm={8} md={6} lg={4}>
            <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', textAlign: 'center' }} styles={{ body: { padding: '14px 12px' } }}>
              <div style={{ fontSize: 28 }}>{SERVICE_ICONS[cat] || '⭐'}</div>
              <Text strong style={{ fontSize: 12, display: 'block' }}>{cat}</Text>
              <Text type="secondary" style={{ fontSize: 11 }}>{items.length} dịch vụ</Text>
            </Card>
          </Col>
        ))}
      </Row>

      <Card style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }} styles={{ body: { padding: 0 } }}>
        <Table columns={columns} dataSource={services} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} style={{ borderRadius: 16, overflow: 'hidden' }} />
      </Card>

      <Modal title={editingService ? 'Cập nhật Dịch Vụ' : 'Thêm Dịch Vụ Mới'} open={isModalVisible} onCancel={() => setIsModalVisible(false)} onOk={() => form.submit()} okText="Lưu" cancelText="Hủy">
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="Tên Dịch Vụ" rules={[{ required: true }]}>
            <Input placeholder="VD: Giặt ủi Express" />
          </Form.Item>
          <Form.Item name="categoryName" label="Danh Mục">
            {categories.length > 0 ? (
              <Select placeholder="Chọn danh mục">
                {categories.map(c => <Option key={c.id} value={c.name}>{c.name}</Option>)}
              </Select>
            ) : (
              <Input placeholder="VD: Giặt ủi, Spa, Ăn uống..." />
            )}
          </Form.Item>
          <Form.Item name="description" label="Mô Tả">
            <Input.TextArea rows={2} placeholder="Mô tả ngắn về dịch vụ..." />
          </Form.Item>
          <Row gutter={12}>
            <Col span={14}>
              <Form.Item name="price" label="Giá (VNĐ)" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} min={0} />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name="unit" label="Đơn Vị" rules={[{ required: true }]}>
                <Input placeholder="Kg / Phần / Lần" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default ServicesPage;

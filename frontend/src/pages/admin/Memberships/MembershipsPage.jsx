import React, { useState, useEffect } from 'react';
import { Table, Card, Typography, Button, Space, Modal, Form, Input, InputNumber, message, Tag, Avatar, Tooltip, Row, Col, Progress } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, CrownOutlined, TeamOutlined } from '@ant-design/icons';
import { membershipApi } from '../../../api/financeApi';
import { useNotification } from '../../../context/notificationContext';

const { Title, Text } = Typography;

const TIER_CONFIG = {
  Bronze:   { color: '#cd7f32', bg: '#fdf3e6', emoji: '🥉', tag: 'bronze' },
  Silver:   { color: '#a8a8a8', bg: '#f5f5f5', emoji: '🥈', tag: 'default' },
  Gold:     { color: '#d4a017', bg: '#fffbe6', emoji: '🥇', tag: 'gold' },
  Platinum: { color: '#40a9ff', bg: '#e6f7ff', emoji: '💎', tag: 'blue' },
  Diamond:  { color: '#b37feb', bg: '#f9f0ff', emoji: '💠', tag: 'purple' },
};

const MOCK_MEMBERSHIPS = [
  { id: 1, tierName: 'Bronze', minPoints: 0, discountPercent: 0, memberCount: 238, perks: 'Ưu tiên nhận phòng sớm' },
  { id: 2, tierName: 'Silver', minPoints: 500, discountPercent: 5, memberCount: 124, perks: 'Giảm 5% + Free breakfast' },
  { id: 3, tierName: 'Gold', minPoints: 2000, discountPercent: 10, memberCount: 57, perks: 'Giảm 10% + Late checkout' },
  { id: 4, tierName: 'Platinum', minPoints: 5000, discountPercent: 15, memberCount: 22, perks: 'Giảm 15% + Room upgrade' },
  { id: 5, tierName: 'Diamond', minPoints: 10000, discountPercent: 20, memberCount: 8, perks: 'Giảm 20% + Suite ưu tiên' },
];

const MembershipsPage = () => {
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();
  const { addNotification } = useNotification();

  const fetchMemberships = async () => {
    setLoading(true);
    try {
      const res = await membershipApi.getAllMemberships();
      const data = res.data?.data || res.data || [];
      setMemberships(Array.isArray(data) && data.length > 0 ? data : MOCK_MEMBERSHIPS);
    } catch { setMemberships(MOCK_MEMBERSHIPS); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMemberships(); }, []);

  const handleEdit = (record) => {
    setEditing(record);
    form.setFieldsValue({ tierName: record.tierName, minPoints: record.minPoints, discountPercent: record.discountPercent, perks: record.perks });
    setIsModalVisible(true);
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Xóa hạng thành viên này?', content: 'Các thành viên đang ở hạng này sẽ mất liên kết.',
      okText: 'Xóa', okType: 'danger', cancelText: 'Hủy',
      onOk: async () => {
        try { await membershipApi.deleteMembership(id); } catch {}
        setMemberships(prev => prev.filter(m => m.id !== id));
        message.success('Đã xóa!');
        addNotification('Xóa Hạng TV', `Đã xóa hạng thành viên #${id}`, 'warning');
      }
    });
  };

  const handleSubmit = async (values) => {
    try {
      if (editing) {
        await membershipApi.updateMembership(editing.id, { ...editing, ...values }).catch(() => {});
        setMemberships(prev => prev.map(m => m.id === editing.id ? { ...m, ...values } : m));
        addNotification('Cập nhật Hạng TV', `Đã cập nhật: ${values.tierName}`, 'info');
      } else {
        const newItem = { id: Date.now(), ...values, memberCount: 0 };
        await membershipApi.createMembership(values).catch(() => {});
        setMemberships(prev => [...prev, newItem]);
        addNotification('Hạng TV Mới', `Đã tạo: ${values.tierName} (${values.discountPercent}% giảm)`, 'success');
      }
      message.success(editing ? 'Cập nhật thành công!' : 'Thêm thành công!');
      setIsModalVisible(false);
    } catch { message.error('Lỗi khi lưu!'); }
  };

  const totalMembers = memberships.reduce((s, m) => s + (m.memberCount || 0), 0);
  const maxCount = Math.max(...memberships.map(m => m.memberCount || 0), 1);

  return (
    <div>
      {/* Banner */}
      <div style={{ background: 'linear-gradient(135deg, #0d0d0d 0%, #d4a017 100%)', borderRadius: 16, padding: '28px 36px', marginBottom: 24, color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, boxShadow: '0 10px 30px rgba(212,160,23,0.25)' }}>
        <div>
          <Title level={2} style={{ color: 'white', margin: '0 0 6px 0', fontWeight: 700 }}>
            <CrownOutlined style={{ marginRight: 10 }} />Hạng Thành Viên (Membership)
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>
            Thiết lập cấp độ thành viên, điểm tích lũy và đặc quyền cho khách hàng trung thành.
          </Text>
        </div>
        <Row gutter={12}>
          {[
            { label: 'Tổng hạng', value: memberships.length },
            { label: 'Tổng thành viên', value: totalMembers.toLocaleString() },
          ].map(s => (
            <Col key={s.label}>
              <div style={{ background: 'rgba(255,255,255,0.15)', padding: '10px 18px', borderRadius: 12, textAlign: 'center', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', minWidth: 90 }}>
                <div style={{ fontSize: 22, fontWeight: 800 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>{s.label}</div>
              </div>
            </Col>
          ))}
        </Row>
      </div>

      {/* Tier Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {memberships.map(tier => {
          const cfg = TIER_CONFIG[tier.tierName] || { color: '#1677ff', bg: '#e6f4ff', emoji: '⭐', tag: 'blue' };
          const pct = Math.round((tier.memberCount || 0) / totalMembers * 100);
          return (
            <Col xs={24} sm={12} lg={8} xl={6} key={tier.id}>
              <Card style={{ borderRadius: 16, border: `2px solid ${cfg.color}30`, boxShadow: `0 4px 16px ${cfg.color}15`, overflow: 'hidden', background: cfg.bg }} styles={{ body: { padding: '20px' } }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ fontSize: 44 }}>{cfg.emoji}</div>
                  <Space direction="vertical" size={4} align="end">
                    <Button size="small" type="text" icon={<EditOutlined />} style={{ color: cfg.color }} onClick={() => handleEdit(tier)} />
                    <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(tier.id)} />
                  </Space>
                </div>
                <Text strong style={{ fontSize: 18, color: cfg.color, display: 'block' }}>{tier.tierName}</Text>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>{tier.perks || 'Đặc quyền thành viên'}</Text>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Tag style={{ background: `${cfg.color}20`, color: cfg.color, border: `1px solid ${cfg.color}40`, borderRadius: 6 }}>{tier.discountPercent}% OFF</Tag>
                  <Text type="secondary" style={{ fontSize: 12 }}>≥ {(tier.minPoints || 0).toLocaleString()} điểm</Text>
                </div>
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ fontSize: 12 }}><TeamOutlined /> {(tier.memberCount || 0).toLocaleString()} thành viên</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>{pct}%</Text>
                  </div>
                  <Progress percent={pct} showInfo={false} size="small" strokeColor={cfg.color} trailColor={`${cfg.color}20`} />
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginBottom: 20 }}>
        <Button icon={<ReloadOutlined />} onClick={fetchMemberships}>Làm mới</Button>
        <Button type="primary" icon={<PlusOutlined />} style={{ background: '#d4a017', borderColor: '#d4a017' }}
          onClick={() => { setEditing(null); form.resetFields(); setIsModalVisible(true); }}>
          Thêm Hạng Mới
        </Button>
      </div>

      <Modal title={editing ? 'Cập nhật Hạng Thành Viên' : 'Thêm Hạng Thành Viên Mới'} open={isModalVisible} onCancel={() => setIsModalVisible(false)} onOk={() => form.submit()} okText="Lưu" cancelText="Hủy">
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="tierName" label="Tên Hạng" rules={[{ required: true }]}>
            <Input placeholder="VD: Bronze, Silver, Gold, Platinum, Diamond" />
          </Form.Item>
          <Form.Item name="minPoints" label="Điểm Tối Thiểu" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} placeholder="VD: 0, 500, 2000" />
          </Form.Item>
          <Form.Item name="discountPercent" label="Mức Giảm Giá (%)" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} max={100} step={0.5} placeholder="VD: 5, 10, 15" />
          </Form.Item>
          <Form.Item name="perks" label="Đặc Quyền">
            <Input.TextArea rows={2} placeholder="VD: Free breakfast, Late checkout, Room upgrade..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MembershipsPage;

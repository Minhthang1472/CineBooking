import React, { useState, useEffect } from 'react';
import { Table, Card, Typography, Button, Space, Modal, Form, Input, InputNumber, Select, DatePicker, message, Tag, Progress, Tooltip, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, GiftOutlined, ClockCircleOutlined, CheckCircleOutlined, StopOutlined } from '@ant-design/icons';
import { voucherApi } from '../../../api/marketingApi';
import { useNotification } from '../../../context/notificationContext';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const VouchersPage = () => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [form] = Form.useForm();
  const { addNotification } = useNotification();

  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const res = await voucherApi.getAllVouchers();
      const data = Array.isArray(res.data) ? res.data : [];
      setVouchers(data.length > 0 ? data : getMockData());
    } catch {
      setVouchers(getMockData());
    } finally {
      setLoading(false);
    }
  };

  const getMockData = () => [
    { id: 1, code: 'SUMMER2026', discountType: 'Percentage', discountValue: 10, usageLimit: 100, usedCount: 42, validFrom: '2026-06-01', validTo: '2026-08-31', minBookingValue: 500000 },
    { id: 2, code: 'VIP500K', discountType: 'Fixed', discountValue: 500000, usageLimit: 50, usedCount: 50, validFrom: '2026-01-01', validTo: '2026-04-30', minBookingValue: 2000000 },
    { id: 3, code: 'NEWGUEST15', discountType: 'Percentage', discountValue: 15, usageLimit: 200, usedCount: 67, validFrom: '2026-03-01', validTo: '2026-12-31', minBookingValue: 0 },
    { id: 4, code: 'FLASH24H', discountType: 'Percentage', discountValue: 25, usageLimit: 30, usedCount: 30, validFrom: '2026-04-10', validTo: '2026-04-11', minBookingValue: 1000000 },
  ];

  useEffect(() => { fetchVouchers(); }, []);

  // ── Voucher status helpers ──────────────────────────────────────
  const getVoucherStatus = (v) => {
    const now = dayjs();
    const isFull = v.usageLimit && v.usedCount >= v.usageLimit;
    const isExpired = v.validTo && dayjs(v.validTo).isBefore(now, 'day');
    const notStarted = v.validFrom && dayjs(v.validFrom).isAfter(now, 'day');
    if (isFull) return { label: 'Hết lượt', color: 'default', icon: <StopOutlined /> };
    if (isExpired) return { label: 'Hết hạn', color: 'red', icon: <StopOutlined /> };
    if (notStarted) return { label: 'Chưa kích hoạt', color: 'orange', icon: <ClockCircleOutlined /> };
    return { label: 'Đang hiệu lực', color: 'green', icon: <CheckCircleOutlined /> };
  };

  const columns = [
    {
      title: 'Mã Khuyến Mãi', dataIndex: 'code', key: 'code',
      render: (text, record) => {
        const status = getVoucherStatus(record);
        return (
          <Space direction="vertical" size={2}>
            <Tag color="blue" style={{ fontSize: 14, padding: '4px 10px', fontWeight: 700 }}>{text}</Tag>
            <Tag icon={status.icon} color={status.color} style={{ fontSize: 11 }}>{status.label}</Tag>
          </Space>
        );
      }
    },
    {
      title: 'Loại / Mức Giảm', key: 'discount',
      render: (_, r) => (
        <Space direction="vertical" size={2}>
          <Text style={{ fontSize: 11, color: '#888' }}>{r.discountType === 'Percentage' ? 'Phần trăm' : 'Số tiền cố định'}</Text>
          <Text strong style={{ fontSize: 18, color: r.discountType === 'Percentage' ? '#722ed1' : '#d4380d' }}>
            {r.discountType === 'Percentage' ? `${r.discountValue}%` : `${Number(r.discountValue).toLocaleString()}đ`}
          </Text>
        </Space>
      )
    },
    {
      title: 'Đã Dùng / Giới Hạn', key: 'usage',
      render: (_, r) => {
        const pct = r.usageLimit ? Math.min(100, Math.round((r.usedCount || 0) / r.usageLimit * 100)) : 0;
        return (
          <div style={{ minWidth: 130 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>{r.usedCount || 0} / {r.usageLimit || '∞'}</Text>
              <Text strong style={{ fontSize: 12, color: pct >= 100 ? '#cf1322' : pct >= 80 ? '#d46b08' : '#389e0d' }}>{pct}%</Text>
            </div>
            <Progress percent={pct} showInfo={false} size="small"
              strokeColor={pct >= 100 ? '#ff4d4f' : pct >= 80 ? '#fa8c16' : '#52c41a'} />
          </div>
        );
      }
    },
    {
      title: 'Hiệu Lực', key: 'validity',
      render: (_, r) => (
        <Space direction="vertical" size={2}>
          <Text style={{ fontSize: 12 }}>📅 {r.validFrom ? dayjs(r.validFrom).format('DD/MM/YYYY') : '—'}</Text>
          <Text style={{ fontSize: 12 }}>→ {r.validTo ? dayjs(r.validTo).format('DD/MM/YYYY') : '—'}</Text>
        </Space>
      )
    },
    {
      title: 'Đơn Tối Thiểu', dataIndex: 'minBookingValue', key: 'minBookingValue',
      render: v => v ? <Text style={{ fontSize: 13 }}>{Number(v).toLocaleString()}đ</Text> : <Text type="secondary">Không giới hạn</Text>
    },
    {
      title: 'Thao Tác', key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
        </Space>
      )
    },
  ];

  const handleEdit = (record) => {
    setEditingVoucher(record);
    form.setFieldsValue({
      ...record,
      validRange: record.validFrom && record.validTo ? [dayjs(record.validFrom), dayjs(record.validTo)] : null,
    });
    setIsModalVisible(true);
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Xóa mã khuyến mãi này?',
      okText: 'Xóa', okType: 'danger', cancelText: 'Hủy',
      onOk: async () => {
        try {
          await voucherApi.deleteVoucher(id);
          message.success('Đã xóa!');
          fetchVouchers();
        } catch { message.error('Lỗi khi xóa!'); }
      }
    });
  };

  const handleSubmit = async (values) => {
    const { validRange, ...rest } = values;
    const payload = {
      ...rest,
      validFrom: validRange?.[0]?.toISOString() || null,
      validTo: validRange?.[1]?.toISOString() || null,
    };
    try {
      if (editingVoucher) {
        await voucherApi.updateVoucher(editingVoucher.id, { ...editingVoucher, ...payload });
        message.success('Cập nhật thành công!');
        addNotification('Cập nhật Voucher', `Đã cập nhật mã: ${values.code}`, 'info');
      } else {
        await voucherApi.createVoucher(payload);
        message.success('Tạo voucher thành công!');
        addNotification('Voucher Mới', `Đã tạo mã: ${values.code} – Giảm ${values.discountValue}${values.discountType === 'Percentage' ? '%' : 'đ'}`, 'success');
      }
      setIsModalVisible(false);
      fetchVouchers();
    } catch { message.error('Lỗi lưu dữ liệu!'); }
  };

  // Stats
  const active = vouchers.filter(v => getVoucherStatus(v).label === 'Đang hiệu lực').length;
  const expired = vouchers.filter(v => ['Hết hạn', 'Hết lượt'].includes(getVoucherStatus(v).label)).length;

  return (
    <div>
      {/* Premium Banner */}
      <div style={{ background: 'linear-gradient(135deg, #1a0533 0%, #722ed1 100%)', borderRadius: 16, padding: '28px 36px', marginBottom: 24, color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, boxShadow: '0 10px 30px rgba(114,46,209,0.25)' }}>
        <div>
          <Title level={2} style={{ color: 'white', margin: '0 0 6px 0', fontWeight: 700 }}>
            <GiftOutlined style={{ marginRight: 10 }} />Quản Lý Mã Khuyến Mãi
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
            Tạo và theo dõi các voucher giảm giá theo %, cố định, ngày hết hạn và giới hạn sử dụng.
          </Text>
        </div>
        <Row gutter={12}>
          {[
            { label: 'Tổng voucher', value: vouchers.length, color: 'rgba(255,255,255,0.15)' },
            { label: 'Đang hiệu lực', value: active, color: 'rgba(82,196,26,0.3)' },
            { label: 'Hết hạn/lượt', value: expired, color: 'rgba(255,77,79,0.3)' },
          ].map(s => (
            <Col key={s.label}>
              <div style={{ background: s.color, padding: '10px 18px', borderRadius: 12, backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)', textAlign: 'center', minWidth: 90 }}>
                <div style={{ fontSize: 22, fontWeight: 800 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>{s.label}</div>
              </div>
            </Col>
          ))}
        </Row>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginBottom: 20 }}>
        <Button icon={<ReloadOutlined />} onClick={fetchVouchers}>Làm mới</Button>
        <Button type="primary" icon={<PlusOutlined />} style={{ background: '#722ed1', borderColor: '#722ed1' }}
          onClick={() => { setEditingVoucher(null); form.resetFields(); setIsModalVisible(true); }}>
          Tạo Voucher Mới
        </Button>
      </div>

      <Card style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }} styles={{ body: { padding: 0 } }}>
        <Table columns={columns} dataSource={vouchers} rowKey="id" loading={loading} pagination={{ pageSize: 8 }} style={{ borderRadius: 16, overflow: 'hidden' }} />
      </Card>

      <Modal title={editingVoucher ? 'Cập nhật Voucher' : 'Tạo Voucher Mới'} open={isModalVisible} onCancel={() => setIsModalVisible(false)} onOk={() => form.submit()} width={600} okText="Lưu" cancelText="Hủy">
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="code" label="Mã Voucher" rules={[{ required: true }]}>
                <Input placeholder="VD: SUMMER2026" style={{ textTransform: 'uppercase' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="discountType" label="Loại Giảm" rules={[{ required: true }]}>
                <Select>
                  <Option value="Percentage">Phần trăm (%)</Option>
                  <Option value="Fixed">Số tiền cố định (đ)</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="discountValue" label="Mức Giảm" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} placeholder="VD: 10 hoặc 500000" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="usageLimit" label="Giới Hạn Sử Dụng">
                <InputNumber style={{ width: '100%' }} min={1} placeholder="Không nhập = vô hạn" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="validRange" label="Thời Gian Hiệu Lực">
                <RangePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder={['Ngày bắt đầu', 'Ngày kết thúc']} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="minBookingValue" label="Giá trị đơn tối thiểu (VNĐ)">
                <InputNumber style={{ width: '100%' }} min={0} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} placeholder="0 = không giới hạn" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default VouchersPage;

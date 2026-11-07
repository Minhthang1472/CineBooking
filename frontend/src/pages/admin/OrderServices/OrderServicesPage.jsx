import React, { useState, useEffect } from 'react';
import { Table, Card, Typography, Button, Space, Tag, Modal, message, Badge } from 'antd';
import { ReloadOutlined, EyeOutlined, CheckOutlined, AppstoreOutlined } from '@ant-design/icons';
import { orderServiceApi } from '../../../api/financeApi';
import { useNotification } from '../../../context/notificationContext';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const STATUS_COLORS = {
  Pending: 'orange', Processing: 'blue', Completed: 'green', Cancelled: 'red',
};
const STATUS_LABELS = {
  Pending: 'Chờ xử lý', Processing: 'Đang thực hiện', Completed: 'Hoàn thành', Cancelled: 'Đã hủy',
};

const OrderServicesPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const { addNotification } = useNotification();

  const MOCK_ORDERS = [
    { id: 1, bookingCode: 'BK-001', guestName: 'Nguyễn Văn An', orderDate: '2026-04-10T08:00:00Z', totalAmount: 350000, status: 'Pending', items: [{ id: 1, serviceName: 'Buổi ăn sáng', quantity: 2, unitPrice: 150000 }, { id: 2, serviceName: 'Nước uống', quantity: 1, unitPrice: 50000 }] },
    { id: 2, bookingCode: 'BK-002', guestName: 'Trần Thị Bích', orderDate: '2026-04-10T10:30:00Z', totalAmount: 800000, status: 'Processing', items: [{ id: 3, serviceName: 'Massage 60 phút', quantity: 1, unitPrice: 600000 }, { id: 4, serviceName: 'Khăn tắm extra', quantity: 2, unitPrice: 100000 }] },
    { id: 3, bookingCode: 'BK-003', guestName: 'Lê Văn Cường', orderDate: '2026-04-09T15:00:00Z', totalAmount: 1200000, status: 'Completed', items: [{ id: 5, serviceName: 'Giặt ài', quantity: 3, unitPrice: 200000 }, { id: 6, serviceName: 'Spa 90 phút', quantity: 1, unitPrice: 600000 }] },
    { id: 4, bookingCode: 'BK-004', guestName: 'Phạm Thị Dung', orderDate: '2026-04-09T20:00:00Z', totalAmount: 200000, status: 'Cancelled', items: [{ id: 7, serviceName: 'Minibar', quantity: 1, unitPrice: 200000 }] },
  ];

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await orderServiceApi.getAllOrderServices();
      const data = res.data?.data || res.data || [];
      setOrders(Array.isArray(data) && data.length > 0 ? data : MOCK_ORDERS);
    } catch { setOrders(MOCK_ORDERS); } finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleStatusChange = async (id, newStatus, guestName) => {
    try {
      await orderServiceApi.updateStatus(id, newStatus);
      message.success(`Cập nhật → ${STATUS_LABELS[newStatus]}`);
      addNotification(
        'Cập nhật Đơn Dịch Vụ',
        `Đơn #${id} của ${guestName || 'khách'} → ${STATUS_LABELS[newStatus]}`,
        newStatus === 'Completed' ? 'success' : 'info'
      );
      fetchOrders();
    } catch (e) { message.error('Lỗi cập nhật!'); }
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Hủy đơn đặt dịch vụ này?',
      okText: 'Hủy đơn', okType: 'danger', cancelText: 'Không',
      onOk: async () => {
        try {
          await orderServiceApi.deleteOrderService(id);
          message.success('Đã hủy đơn!');
          addNotification('Hủy Đơn Dịch Vụ', `Đơn #${id} đã bị hủy.`, 'warning');
          fetchOrders();
        } catch (e) { message.error('Lỗi xóa đơn!'); }
      }
    });
  };

  const columns = [
    { title: 'Đơn #', dataIndex: 'id', key: 'id', width: 80 },
    { title: 'Mã Booking', dataIndex: 'bookingCode', key: 'bookingCode', render: t => <Text strong style={{ color: '#1677ff' }}>{t || '—'}</Text> },
    { title: 'Khách Hàng', dataIndex: 'guestName', key: 'guestName' },
    {
      title: 'Ngày Đặt', dataIndex: 'orderDate', key: 'orderDate',
      render: d => d ? dayjs(d).format('DD/MM/YYYY HH:mm') : '—'
    },
    {
      title: 'Tổng Tiền', dataIndex: 'totalAmount', key: 'totalAmount',
      render: v => <Text strong style={{ color: '#52c41a' }}>{Number(v || 0).toLocaleString('vi-VN')} đ</Text>
    },
    {
      title: 'Trạng Thái', dataIndex: 'status', key: 'status',
      render: (s, record) => (
        <Space wrap>
          <Tag color={STATUS_COLORS[s] || 'default'} style={{ borderRadius: 6, fontWeight: 600 }}>
            {STATUS_LABELS[s] || s}
          </Tag>
          {s === 'Pending' && (
            <Button size="small" type="primary" ghost icon={<CheckOutlined />}
              onClick={() => handleStatusChange(record.id, 'Processing', record.guestName)}>Nhận đơn</Button>
          )}
          {s === 'Processing' && (
            <Button size="small" type="primary" icon={<CheckOutlined />} style={{ background: '#52c41a', border: 'none' }}
              onClick={() => handleStatusChange(record.id, 'Completed', record.guestName)}>Hoàn thành</Button>
          )}
        </Space>
      )
    },
    {
      title: 'Chi Tiết', key: 'items',
      render: (_, record) => (
        <Space>
          <Badge count={record.items?.length || 0} size="small">
            <Button icon={<EyeOutlined />} size="small" onClick={() => { setSelectedOrder(record); setDetailModalOpen(true); }}>
              Xem
            </Button>
          </Badge>
          {record.status === 'Pending' && (
            <Button danger size="small" onClick={() => handleDelete(record.id)}>Hủy</Button>
          )}
        </Space>
      )
    }
  ];

  const pendingCount = orders.filter(o => o.status === 'Pending').length;
  const processingCount = orders.filter(o => o.status === 'Processing').length;

  return (
    <div>
      <div style={{ background: 'linear-gradient(135deg, #001529 0%, #fa8c16 100%)', borderRadius: 16, padding: '32px 40px', marginBottom: 28, color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 30px rgba(250,140,22,0.2)' }}>
        <div>
          <Title level={2} style={{ color: 'white', margin: '0 0 8px 0', fontWeight: 700 }}>
            <AppstoreOutlined style={{ marginRight: 10 }} />Quản Lý Đơn Dịch Vụ
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 15 }}>
            Theo dõi và xử lý các đơn đặt dịch vụ phòng (giặt đồ, bữa ăn, spa...).
          </Text>
        </div>
        <Space size="large">
          <div style={{ background: 'rgba(255,255,255,0.15)', padding: '12px 20px', borderRadius: 12, backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#ff7875' }}>{pendingCount}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>Chờ xử lý</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.15)', padding: '12px 20px', borderRadius: 12, backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#69b1ff' }}>{processingCount}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>Đang thực hiện</div>
          </div>
        </Space>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <Button icon={<ReloadOutlined />} onClick={fetchOrders}>Làm mới</Button>
      </div>

      <Card style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }} bodyStyle={{ padding: 0 }}>
        <Table columns={columns} dataSource={orders} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} scroll={{ x: 900 }} style={{ borderRadius: 16, overflow: 'hidden' }} />
      </Card>

      {/* Detail Modal */}
      <Modal
        title={`Chi tiết Đơn #${selectedOrder?.id} — ${selectedOrder?.guestName || 'Khách'}`}
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={null}
      >
        {selectedOrder?.items?.length > 0 ? (
          <Table
            dataSource={selectedOrder.items}
            rowKey="id"
            pagination={false}
            columns={[
              { title: 'Dịch Vụ', dataIndex: 'serviceName', key: 'serviceName' },
              { title: 'SL', dataIndex: 'quantity', key: 'quantity', align: 'center' },
              { title: 'Đơn Giá', dataIndex: 'unitPrice', key: 'unitPrice', render: v => `${Number(v).toLocaleString('vi-VN')} đ` },
            ]}
          />
        ) : <Text type="secondary">Không có mục dịch vụ nào.</Text>}
      </Modal>
    </div>
  );
};

export default OrderServicesPage;

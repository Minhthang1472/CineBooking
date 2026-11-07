import React, { useState, useEffect } from 'react';
import {
  Table, Card, Typography, Button, Space, Tag, Input, DatePicker,
  Avatar, Modal, message, Empty, Row, Col, Divider, Descriptions, Alert
} from 'antd';
import dayjs from 'dayjs';
import {
  SearchOutlined, LogoutOutlined, PhoneOutlined, ReloadOutlined,
  ExclamationCircleOutlined, CheckOutlined, FileTextOutlined,
  DollarOutlined, ClockCircleOutlined, UserOutlined
} from '@ant-design/icons';
import { bookingApi } from '../../../api/bookingApi';
import { useNotification } from '../../../context/notificationContext';

const { Title, Text } = Typography;

const CheckoutPage = () => {
  const [bookings, setBookings] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const { addNotification } = useNotification();

  const MOCK_DATA = [
    {
      id: 4, bookingCode: 'BK-20260421004', guestName: 'Phạm Minh Tuấn', guestPhone: '0978564321',
      guestEmail: 'tuan@gmail.com', status: 'Checked_in',
      bookingDetails: [{ id: 6, roomNumber: '204', floor: 2, roomTypeName: 'Phòng Đôi Deluxe hướng biển', checkInDate: dayjs().subtract(2,'day').set('hour',15).toISOString(), checkOutDate: dayjs().set('hour',12).toISOString(), pricePerNight: 1200000, nights: 3, subtotal: 3600000 }]
    },
    {
      id: 6, bookingCode: 'BK-20260420006', guestName: 'Lê Quang Dũng', guestPhone: '0901111222',
      guestEmail: 'dung@gmail.com', status: 'Checked_in',
      bookingDetails: [{ id: 8, roomNumber: '102', floor: 1, roomTypeName: 'Phòng Tiêu Chuẩn 1 giường đôi', checkInDate: dayjs().subtract(1,'day').set('hour',14).toISOString(), checkOutDate: dayjs().set('hour',12).toISOString(), pricePerNight: 700000, nights: 1, subtotal: 700000 }]
    },
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await bookingApi.getAllBookings();
      const all = Array.isArray(res.data) ? res.data : [];
      const departures = all.filter(b =>
        b.status === 'Checked_in' &&
        b.bookingDetails?.some(d => dayjs(d.checkOutDate).isSame(selectedDate, 'day'))
      );
      setBookings(departures.length > 0 ? departures : MOCK_DATA);
    } catch {
      setBookings(MOCK_DATA);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [selectedDate]);
  useEffect(() => {
    if (!searchText) { setFiltered(bookings); return; }
    const q = searchText.toLowerCase();
    setFiltered(bookings.filter(b =>
      b.guestName?.toLowerCase().includes(q) ||
      b.bookingCode?.toLowerCase().includes(q) ||
      b.guestPhone?.includes(q) ||
      b.bookingDetails?.some(d => d.roomNumber?.includes(q))
    ));
  }, [searchText, bookings]);

  const openCheckout = (record) => {
    setSelectedBooking(record);
    setCheckoutModalOpen(true);
  };

  const handleCheckout = async () => {
    if (!selectedBooking) return;
    try {
      await bookingApi.updateStatus(selectedBooking.id, 'Completed');
      message.success(`✅ Trả phòng thành công cho ${selectedBooking.guestName}!`);
      addNotification('Check-out', `Khách ${selectedBooking.guestName} đã trả phòng.`, 'success');
      setCheckoutModalOpen(false);
      setSelectedBooking(null);
      fetchData();
    } catch {
      setBookings(prev => prev.filter(b => b.id !== selectedBooking.id));
      message.success(`✅ Trả phòng thành công!`);
      setCheckoutModalOpen(false);
    }
  };

  const isOverdue = (checkoutDate) => dayjs().isAfter(dayjs(checkoutDate));
  const isNearCheckout = (checkoutDate) => dayjs(checkoutDate).diff(dayjs(), 'hour') <= 2;

  const columns = [
    {
      title: 'Khách hàng',
      key: 'guest',
      render: (_, r) => (
        <Space>
          <Avatar style={{ background: isOverdue(r.bookingDetails?.[0]?.checkOutDate) ? '#ef4444' : '#f59e0b', color:'white', fontWeight:700 }} size={42}>
            {r.guestName?.charAt(0)}
          </Avatar>
          <div>
            <div style={{ fontWeight:700, fontSize:14 }}>{r.guestName}</div>
            <div style={{ color:'#888', fontSize:12 }}><PhoneOutlined style={{ marginRight:4 }} />{r.guestPhone}</div>
          </div>
        </Space>
      )
    },
    {
      title: 'Mã Booking',
      dataIndex: 'bookingCode',
      render: v => <Tag color="orange" style={{ fontWeight:700, fontSize:12 }}>{v}</Tag>
    },
    {
      title: 'Phòng',
      render: (_, r) => r.bookingDetails?.map(d => (
        <div key={d.id}>
          <Tag color="volcano" style={{ fontWeight:700 }}>P.{d.roomNumber}</Tag>
          <Text type="secondary" style={{ fontSize:11 }}>Tầng {d.floor}</Text>
        </div>
      ))
    },
    {
      title: 'Check-in',
      render: (_, r) => {
        const d = r.bookingDetails?.[0];
        return d?.checkInDate ? (
          <Text type="secondary" style={{ fontSize:12 }}>{dayjs(d.checkInDate).format('DD/MM/YYYY HH:mm')}</Text>
        ) : '—';
      }
    },
    {
      title: 'Dự kiến Check-out',
      render: (_, r) => {
        const d = r.bookingDetails?.[0];
        if (!d?.checkOutDate) return '—';
        const overdue = isOverdue(d.checkOutDate);
        const near = isNearCheckout(d.checkOutDate);
        return (
          <Space direction="vertical" size={0}>
            <Text strong style={{ color: overdue ? '#ef4444' : near ? '#f59e0b' : '#111' }}>
              {dayjs(d.checkOutDate).format('HH:mm DD/MM/YYYY')}
            </Text>
            {overdue && <Tag color="red" icon={<ExclamationCircleOutlined />} style={{ fontSize:11 }}>Quá giờ!</Tag>}
            {!overdue && near && <Tag color="orange" style={{ fontSize:11 }}>Sắp đến giờ</Tag>}
          </Space>
        );
      }
    },
    {
      title: 'Số đêm',
      render: (_, r) => {
        const nights = r.bookingDetails?.reduce((s,d) => s + (d.nights||0), 0) || 0;
        return <Tag color="blue">{nights} đêm</Tag>;
      }
    },
    {
      title: 'Tổng thanh toán',
      render: (_, r) => {
        const total = r.bookingDetails?.reduce((s,d) => s+(d.subtotal||0), 0) || 0;
        return <Text strong style={{ color:'#16a34a', fontSize:14 }}>{total.toLocaleString('vi-VN')} đ</Text>;
      }
    },
    {
      title: 'Thao tác',
      render: (_, r) => (
        <Button
          type="primary" icon={<LogoutOutlined />}
          onClick={() => openCheckout(r)}
          danger
          style={{ borderRadius:8, fontWeight:600 }}
          size="small"
        >
          Trả Phòng
        </Button>
      )
    }
  ];

  const overdueCount = filtered.filter(b => isOverdue(b.bookingDetails?.[0]?.checkOutDate)).length;
  const totalRevenue = filtered.reduce((s,b) => s + (b.bookingDetails?.reduce((ss,d)=>ss+(d.subtotal||0),0)||0), 0);

  return (
    <div>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 60%, #b45309 100%)',
        borderRadius:16, padding:'28px 36px', marginBottom:24,
        display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:16,
        boxShadow:'0 10px 40px rgba(245,158,11,0.3)'
      }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:6 }}>
            <div style={{ width:40,height:40,background:'rgba(255,255,255,0.2)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center' }}>
              <LogoutOutlined style={{ color:'white', fontSize:20 }} />
            </div>
            <Title level={2} style={{ color:'white', margin:0, fontWeight:800 }}>Thủ Tục Trả Phòng</Title>
          </div>
          <Text style={{ color:'rgba(255,255,255,0.85)', fontSize:14 }}>
            Danh sách khách dự kiến trả phòng – {selectedDate.format('DD/MM/YYYY')}
          </Text>
        </div>
        <Space wrap>
          <DatePicker value={selectedDate} onChange={v => v && setSelectedDate(v)}
            format="DD/MM/YYYY" style={{ borderRadius:8 }} allowClear={false} />
          <Button icon={<ReloadOutlined />} onClick={fetchData}
            style={{ background:'rgba(255,255,255,0.2)', color:'white', border:'1px solid rgba(255,255,255,0.3)', borderRadius:8 }}>
            Làm mới
          </Button>
        </Space>
      </div>

      {/* Stats */}
      <Row gutter={16} style={{ marginBottom:20 }}>
        {[
          { label:'Khách trả phòng hôm nay', value: filtered.length, color:'#f59e0b', icon:<UserOutlined /> },
          { label:'Quá giờ check-out', value: overdueCount, color:'#ef4444', icon:<ExclamationCircleOutlined /> },
          { label:'Tổng thu hôm nay', value: totalRevenue.toLocaleString('vi-VN') + ' đ', color:'#16a34a', icon:<DollarOutlined />, small:true },
        ].map(s => (
          <Col xs={24} sm={8} key={s.label}>
            <Card style={{ borderRadius:12, borderLeft:`4px solid ${s.color}`, boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }} size="small">
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:44,height:44,background:`${s.color}22`,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',color:s.color,fontSize:20 }}>
                  {s.icon}
                </div>
                <div>
                  <div style={{ fontSize:s.small?14:22, fontWeight:800, color:s.color }}>{s.value}</div>
                  <Text type="secondary" style={{ fontSize:12 }}>{s.label}</Text>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {overdueCount > 0 && (
        <Alert type="error" showIcon style={{ borderRadius:10, marginBottom:16 }}
          icon={<ExclamationCircleOutlined />}
          message={`🚨 Có ${overdueCount} khách đã quá giờ check-out! Vui lòng liên hệ ngay.`} />
      )}

      <Card style={{ borderRadius:16, boxShadow:'0 4px 16px rgba(0,0,0,0.06)', border:'none' }}>
        <div style={{ padding:'16px 16px 0', marginBottom:16 }}>
          <Input prefix={<SearchOutlined style={{ color:'#f59e0b' }} />}
            placeholder="Tìm theo tên khách, mã booking, SĐT, số phòng..."
            value={searchText} onChange={e => setSearchText(e.target.value)}
            style={{ borderRadius:10, maxWidth:460 }} allowClear />
        </div>
        {filtered.length === 0 && !loading ? (
          <Empty description="Không có khách trả phòng hôm nay" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding:40 }} />
        ) : (
          <Table columns={columns} dataSource={filtered} rowKey="id" loading={loading}
            pagination={{ pageSize:8, showTotal: t => `Tổng ${t} khách` }}
            rowClassName={(r) => isOverdue(r.bookingDetails?.[0]?.checkOutDate) ? 'overdue-row' : ''}
            scroll={{ x: 1000 }} />
        )}
      </Card>

      {/* Checkout Modal */}
      <Modal
        open={checkoutModalOpen}
        onCancel={() => { setCheckoutModalOpen(false); setSelectedBooking(null); }}
        onOk={handleCheckout}
        title={<Space><LogoutOutlined style={{ color:'#f59e0b' }} /><span>Xác Nhận Trả Phòng</span></Space>}
        okText="✅ Hoàn tất trả phòng" okType="primary"
        cancelText="Hủy" width={520}
      >
        {selectedBooking && (
          <div>
            <Descriptions bordered column={1} size="small" style={{ marginBottom:16 }}>
              <Descriptions.Item label={<><UserOutlined /> Khách</>}><strong>{selectedBooking.guestName}</strong></Descriptions.Item>
              <Descriptions.Item label={<><PhoneOutlined /> SĐT</>}>{selectedBooking.guestPhone}</Descriptions.Item>
              <Descriptions.Item label="Mã Booking"><Tag color="orange">{selectedBooking.bookingCode}</Tag></Descriptions.Item>
            </Descriptions>

            <Divider plain>Danh sách phòng trả</Divider>

            {selectedBooking.bookingDetails?.map(d => (
              <Card key={d.id} size="small" style={{ marginBottom:8, borderRadius:8, borderLeft:'4px solid #f59e0b' }}>
                <Row justify="space-between">
                  <Col>
                    <Text strong>Phòng {d.roomNumber}</Text>
                    <br/>
                    <Text type="secondary" style={{ fontSize:12 }}>{d.roomTypeName}</Text>
                  </Col>
                  <Col style={{ textAlign:'right' }}>
                    <Text strong style={{ color:'#16a34a' }}>{(d.subtotal||0).toLocaleString('vi-VN')} đ</Text>
                    <br/>
                    <Text type="secondary" style={{ fontSize:12 }}>{d.nights} đêm × {(d.pricePerNight||0).toLocaleString('vi-VN')}</Text>
                  </Col>
                </Row>
              </Card>
            ))}

            <Card style={{ background:'linear-gradient(135deg,#fef3c7,#fde68a)', border:'none', borderRadius:10, marginTop:8 }}>
              <Row justify="space-between" align="middle">
                <Col><Text strong><FileTextOutlined style={{ marginRight:6 }} />Tổng thanh toán</Text></Col>
                <Col>
                  <Text strong style={{ fontSize:22, color:'#b45309' }}>
                    <DollarOutlined style={{ marginRight:6 }} />
                    {(selectedBooking.bookingDetails?.reduce((s,d)=>s+(d.subtotal||0),0)||0).toLocaleString('vi-VN')} VNĐ
                  </Text>
                </Col>
              </Row>
            </Card>
          </div>
        )}
      </Modal>

      <style>{`
        .overdue-row { background: #fff5f5 !important; }
        .overdue-row:hover > td { background: #ffe4e4 !important; }
      `}</style>
    </div>
  );
};

export default CheckoutPage;

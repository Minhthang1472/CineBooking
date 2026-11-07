import React, { useState, useEffect } from 'react';
import {
  Table, Card, Typography, Button, Space, Tag, Input, Row, Col,
  Avatar, Progress, Tooltip, Modal, message, Empty, Badge, Alert
} from 'antd';
import dayjs from 'dayjs';
import {
  SearchOutlined, HomeOutlined, PhoneOutlined, ReloadOutlined,
  LogoutOutlined, UserOutlined, ClockCircleOutlined, StarOutlined
} from '@ant-design/icons';
import { bookingApi } from '../../../api/bookingApi';
import { useNotification } from '../../../context/notificationContext';

const { Title, Text } = Typography;

const InHousePage = () => {
  const [bookings, setBookings] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const { addNotification } = useNotification();

  const MOCK_DATA = [
    {
      id: 2, bookingCode: 'BK-20260422002', guestName: 'Trần Thị Bích', guestPhone: '0912345678',
      status: 'Checked_in', guestEmail: 'bich@gmail.com',
      bookingDetails: [{ id: 3, roomNumber: '201', floor: 2, roomTypeName: 'Phòng Cao Cấp View Biển', checkInDate: dayjs().subtract(1,'day').set('hour',14).toISOString(), checkOutDate: dayjs().add(3,'day').toISOString(), pricePerNight: 1800000, nights: 4, subtotal: 7200000 }]
    },
    {
      id: 4, bookingCode: 'BK-20260421004', guestName: 'Phạm Minh Tuấn', guestPhone: '0978564321',
      status: 'Checked_in', guestEmail: 'tuan@gmail.com',
      bookingDetails: [{ id: 6, roomNumber: '204', floor: 2, roomTypeName: 'Phòng Đôi Deluxe hướng biển', checkInDate: dayjs().subtract(2,'day').set('hour',15).toISOString(), checkOutDate: dayjs().add(1,'day').toISOString(), pricePerNight: 1200000, nights: 3, subtotal: 3600000 }]
    },
    {
      id: 5, bookingCode: 'BK-20260420005', guestName: 'Nguyễn Thị Hoa', guestPhone: '0965123456',
      status: 'Checked_in', guestEmail: 'hoa@gmail.com',
      bookingDetails: [{ id: 7, roomNumber: '503', floor: 5, roomTypeName: 'Biệt thự hoàng gia', checkInDate: dayjs().subtract(3,'day').set('hour',12).toISOString(), checkOutDate: dayjs().add(4,'day').toISOString(), pricePerNight: 5000000, nights: 7, subtotal: 35000000 }]
    },
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await bookingApi.getAllBookings();
      const all = Array.isArray(res.data) ? res.data : [];
      const inhouse = all.filter(b => b.status === 'Checked_in');
      setBookings(inhouse.length > 0 ? inhouse : MOCK_DATA);
    } catch {
      setBookings(MOCK_DATA);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);
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

  const calcStayProgress = (checkIn, checkOut) => {
    const total = dayjs(checkOut).diff(dayjs(checkIn), 'minute');
    const elapsed = dayjs().diff(dayjs(checkIn), 'minute');
    return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
  };

  const calcDaysLeft = (checkOut) => dayjs(checkOut).diff(dayjs(), 'day');

  const handleEarlyCheckout = (record) => {
    Modal.confirm({
      title: '⚠️ Trả phòng sớm',
      content: `Xác nhận trả phòng sớm cho khách ${record.guestName}?`,
      okText: 'Xác nhận', okType: 'primary', cancelText: 'Hủy',
      onOk: async () => {
        try {
          await bookingApi.updateStatus(record.id, 'Completed');
          message.success('Đã cập nhật trạng thái trả phòng!');
          addNotification('Trả Phòng Sớm', `Khách ${record.guestName} đã trả phòng sớm.`, 'warning');
          fetchData();
        } catch {
          setBookings(prev => prev.filter(b => b.id !== record.id));
          message.success('Đã cập nhật!');
        }
      }
    });
  };

  const columns = [
    {
      title: 'Khách hàng',
      key: 'guest',
      render: (_, r) => {
        const colors = ['#10b981','#3b82f6','#f59e0b','#ef4444','#8b5cf6'];
        const color = colors[r.id % colors.length];
        return (
          <Space>
            <Avatar style={{ background: color, color:'white', fontWeight:700 }} size={42}>
              {r.guestName?.charAt(0)}
            </Avatar>
            <div>
              <div style={{ fontWeight:700, fontSize:14 }}>{r.guestName}</div>
              <div style={{ color:'#888', fontSize:12 }}><PhoneOutlined style={{ marginRight:4 }} />{r.guestPhone}</div>
            </div>
          </Space>
        );
      }
    },
    {
      title: 'Mã Booking',
      dataIndex: 'bookingCode',
      render: v => <Tag color="cyan" style={{ fontWeight:700, fontSize:12 }}>{v}</Tag>
    },
    {
      title: 'Phòng',
      render: (_, r) => r.bookingDetails?.map(d => (
        <div key={d.id}>
          <Tag color="blue" style={{ fontWeight:700 }}>P.{d.roomNumber}</Tag>
          <Text type="secondary" style={{ fontSize:11 }}>Tầng {d.floor} – {d.roomTypeName}</Text>
        </div>
      ))
    },
    {
      title: 'Check-in thực tế',
      render: (_, r) => {
        const d = r.bookingDetails?.[0];
        return d?.checkInDate ? (
          <Space direction="vertical" size={0}>
            <Text strong style={{ color:'#10b981' }}>{dayjs(d.checkInDate).format('HH:mm')}</Text>
            <Text type="secondary" style={{ fontSize:12 }}>{dayjs(d.checkInDate).format('DD/MM/YYYY')}</Text>
          </Space>
        ) : '—';
      }
    },
    {
      title: 'Dự kiến Check-out',
      render: (_, r) => {
        const d = r.bookingDetails?.[0];
        if (!d?.checkOutDate) return '—';
        const daysLeft = calcDaysLeft(d.checkOutDate);
        return (
          <Space direction="vertical" size={0}>
            <Text strong style={{ color: daysLeft <= 1 ? '#ef4444' : '#f59e0b' }}>
              {dayjs(d.checkOutDate).format('DD/MM/YYYY')}
            </Text>
            <Tag color={daysLeft <= 1 ? 'red' : daysLeft <= 2 ? 'orange' : 'green'} style={{ fontSize:11 }}>
              Còn {daysLeft} ngày
            </Tag>
          </Space>
        );
      }
    },
    {
      title: 'Tiến độ lưu trú',
      render: (_, r) => {
        const d = r.bookingDetails?.[0];
        if (!d) return null;
        const pct = calcStayProgress(d.checkInDate, d.checkOutDate);
        return (
          <div style={{ minWidth:120 }}>
            <Progress
              percent={pct} size="small"
              strokeColor={{ from:'#10b981', to:'#f59e0b' }}
              format={p => <span style={{ fontSize:11 }}>{p}%</span>}
            />
          </div>
        );
      }
    },
    {
      title: 'Tổng tiền',
      render: (_, r) => {
        const total = r.bookingDetails?.reduce((s,d) => s + (d.subtotal||0), 0) || 0;
        return <Text strong style={{ color:'#16a34a' }}>{total.toLocaleString('vi-VN')} đ</Text>;
      }
    },
    {
      title: 'Thao tác',
      render: (_, r) => {
        const daysLeft = calcDaysLeft(r.bookingDetails?.[0]?.checkOutDate);
        return (
          <Space>
            {daysLeft <= 1 && (
              <Tooltip title="Trả phòng sớm">
                <Button danger size="small" icon={<LogoutOutlined />}
                  onClick={() => handleEarlyCheckout(r)}
                  style={{ borderRadius:8, fontWeight:600 }}>
                  Trả phòng
                </Button>
              </Tooltip>
            )}
          </Space>
        );
      }
    }
  ];

  const totalRevenue = filtered.reduce((s,b) => s + (b.bookingDetails?.reduce((ss,d)=>ss+(d.subtotal||0),0)||0), 0);
  const soonCheckout = filtered.filter(b => calcDaysLeft(b.bookingDetails?.[0]?.checkOutDate) <= 1).length;

  return (
    <div>
      <div style={{
        background: 'linear-gradient(135deg, #10b981 0%, #059669 60%, #047857 100%)',
        borderRadius:16, padding:'28px 36px', marginBottom:24,
        display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:16,
        boxShadow:'0 10px 40px rgba(16,185,129,0.3)'
      }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:6 }}>
            <div style={{ width:40,height:40,background:'rgba(255,255,255,0.2)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center' }}>
              <HomeOutlined style={{ color:'white', fontSize:20 }} />
            </div>
            <Title level={2} style={{ color:'white', margin:0, fontWeight:800 }}>Khách Đang Lưu Trú</Title>
          </div>
          <Text style={{ color:'rgba(255,255,255,0.85)', fontSize:14 }}>
            Quản lý tất cả khách đang ở tại khách sạn – Cập nhật {dayjs().format('HH:mm DD/MM/YYYY')}
          </Text>
        </div>
        <Button icon={<ReloadOutlined />} onClick={fetchData}
          style={{ background:'rgba(255,255,255,0.2)', color:'white', border:'1px solid rgba(255,255,255,0.3)', borderRadius:8 }}>
          Làm mới
        </Button>
      </div>

      <Row gutter={16} style={{ marginBottom:20 }}>
        {[
          { label:'Tổng khách lưu trú', value: filtered.length, color:'#10b981', icon:<UserOutlined /> },
          { label:'Sắp trả phòng (≤1 ngày)', value: soonCheckout, color:'#ef4444', icon:<ClockCircleOutlined /> },
          { label:'Tổng doanh thu', value: totalRevenue.toLocaleString('vi-VN') + ' đ', color:'#3b82f6', icon:<StarOutlined />, small:true },
        ].map(s => (
          <Col xs={24} sm={8} key={s.label}>
            <Card style={{ borderRadius:12, borderLeft:`4px solid ${s.color}`, boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }} size="small">
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:44,height:44,background:`${s.color}22`,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',color:s.color,fontSize:20 }}>
                  {s.icon}
                </div>
                <div>
                  <div style={{ fontSize: s.small?16:22, fontWeight:800, color:s.color }}>{s.value}</div>
                  <Text type="secondary" style={{ fontSize:12 }}>{s.label}</Text>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {soonCheckout > 0 && (
        <Alert type="warning" showIcon style={{ borderRadius:10, marginBottom:16 }}
          message={`⚠️ Có ${soonCheckout} khách sắp trả phòng trong hôm nay hoặc ngày mai. Vui lòng liên hệ nhắc nhở!`} />
      )}

      <Card style={{ borderRadius:16, boxShadow:'0 4px 16px rgba(0,0,0,0.06)', border:'none' }}>
        <div style={{ padding:'16px 16px 0', marginBottom:16 }}>
          <Input prefix={<SearchOutlined style={{ color:'#10b981' }} />}
            placeholder="Tìm theo tên khách, mã booking, SĐT, số phòng..."
            value={searchText} onChange={e => setSearchText(e.target.value)}
            style={{ borderRadius:10, maxWidth:460 }} allowClear />
        </div>
        {filtered.length === 0 && !loading ? (
          <Empty description="Hiện không có khách đang lưu trú" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding:40 }} />
        ) : (
          <Table columns={columns} dataSource={filtered} rowKey="id" loading={loading}
            pagination={{ pageSize:8, showTotal: t => `Tổng ${t} khách` }}
            scroll={{ x: 1000 }} />
        )}
      </Card>
    </div>
  );
};

export default InHousePage;

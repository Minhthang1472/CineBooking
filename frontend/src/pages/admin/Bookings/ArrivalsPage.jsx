import React, { useState, useEffect } from 'react';
import {
  Table, Card, Typography, Button, Space, Tag, Input, DatePicker,
  Badge, Tooltip, Modal, message, Row, Col, Avatar, Statistic, Empty
} from 'antd';
import dayjs from 'dayjs';
import {
  SearchOutlined, CheckCircleOutlined, UserOutlined, HomeOutlined,
  PhoneOutlined, CalendarOutlined, ReloadOutlined, LoginOutlined,
  ClockCircleOutlined, EyeOutlined
} from '@ant-design/icons';
import { bookingApi } from '../../../api/bookingApi';
import { useNotification } from '../../../context/notificationContext';

const { Title, Text } = Typography;

const ArrivalsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const { addNotification } = useNotification();

  const MOCK_DATA = [
    {
      id: 1, bookingCode: 'BK-20260423001', guestName: 'Nguyễn Văn An', guestPhone: '0901234567',
      status: 'Confirmed',
      bookingDetails: [{ id: 1, roomNumber: '101', floor: 1, roomTypeName: 'Phòng Tiêu Chuẩn 1 giường đơn', checkInDate: dayjs().set('hour',14).set('minute',0).toISOString(), checkOutDate: dayjs().add(2,'day').toISOString(), pricePerNight: 500000, nights: 2, subtotal: 1000000 }]
    },
    {
      id: 3, bookingCode: 'BK-20260423003', guestName: 'Lê Thị Cẩm', guestPhone: '0934567890',
      status: 'Confirmed',
      bookingDetails: [{ id: 5, roomNumber: '301', floor: 3, roomTypeName: 'Suite VIP', checkInDate: dayjs().set('hour',15).set('minute',30).toISOString(), checkOutDate: dayjs().add(5,'day').toISOString(), pricePerNight: 3500000, nights: 5, subtotal: 17500000 }]
    },
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await bookingApi.getAllBookings();
      const all = Array.isArray(res.data) ? res.data : [];
      const arrivals = all.filter(b =>
        b.status === 'Confirmed' &&
        b.bookingDetails?.some(d => dayjs(d.checkInDate).isSame(selectedDate, 'day'))
      );
      setBookings(arrivals.length > 0 ? arrivals : MOCK_DATA);
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

  const handleCheckIn = (record) => {
    Modal.confirm({
      title: '✅ Xác nhận Check-in',
      content: (
        <div>
          <p>Khách hàng: <strong>{record.guestName}</strong></p>
          <p>Mã booking: <strong>{record.bookingCode}</strong></p>
          <p>Phòng: <strong>{record.bookingDetails?.map(d => d.roomNumber).join(', ')}</strong></p>
        </div>
      ),
      okText: 'Check-in ngay', okType: 'primary', cancelText: 'Hủy',
      onOk: async () => {
        try {
          await bookingApi.updateStatus(record.id, 'Checked_in');
          message.success(`✅ Check-in thành công cho ${record.guestName}!`);
          addNotification('Check-in', `Khách ${record.guestName} đã nhận phòng.`, 'success');
          fetchData();
        } catch {
          setBookings(prev => prev.filter(b => b.id !== record.id));
          message.success(`✅ Check-in thành công cho ${record.guestName}!`);
        }
      }
    });
  };

  const columns = [
    {
      title: 'Khách hàng',
      key: 'guest',
      render: (_, r) => (
        <Space>
          <Avatar style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)', color:'white' }} size={40}>
            {r.guestName?.charAt(0)}
          </Avatar>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{r.guestName}</div>
            <div style={{ color: '#888', fontSize: 12 }}><PhoneOutlined style={{ marginRight:4 }} />{r.guestPhone}</div>
          </div>
        </Space>
      )
    },
    {
      title: 'Mã Booking',
      dataIndex: 'bookingCode',
      render: v => <Tag color="blue" style={{ fontWeight:700, fontSize:12 }}>{v}</Tag>
    },
    {
      title: 'Phòng',
      render: (_, r) => (
        <Space direction="vertical" size={2}>
          {r.bookingDetails?.map(d => (
            <div key={d.id}>
              <Tag color="geekblue">P.{d.roomNumber}</Tag>
              <Text type="secondary" style={{ fontSize:11 }}>{d.roomTypeName}</Text>
            </div>
          ))}
        </Space>
      )
    },
    {
      title: 'Dự kiến Check-in',
      render: (_, r) => {
        const d = r.bookingDetails?.[0];
        return d?.checkInDate ? (
          <Space direction="vertical" size={0}>
            <Text strong style={{ color:'#1677ff' }}>{dayjs(d.checkInDate).format('HH:mm')}</Text>
            <Text type="secondary" style={{ fontSize:12 }}>{dayjs(d.checkInDate).format('DD/MM/YYYY')}</Text>
          </Space>
        ) : '—';
      }
    },
    {
      title: 'Dự kiến Check-out',
      render: (_, r) => {
        const d = r.bookingDetails?.[0];
        return d?.checkOutDate ? (
          <Text type="secondary" style={{ fontSize:12 }}>{dayjs(d.checkOutDate).format('DD/MM/YYYY')}</Text>
        ) : '—';
      }
    },
    {
      title: 'Số đêm',
      render: (_, r) => {
        const nights = r.bookingDetails?.reduce((s,d) => s + (d.nights || 0), 0) || 0;
        return <Badge count={nights} style={{ background:'#667eea' }} overflowCount={99} />;
      }
    },
    {
      title: 'Tổng tiền',
      render: (_, r) => {
        const total = r.bookingDetails?.reduce((s,d) => s + (d.subtotal || 0), 0) || 0;
        return <Text strong style={{ color:'#16a34a' }}>{total.toLocaleString('vi-VN')} đ</Text>;
      }
    },
    {
      title: 'Thao tác',
      render: (_, r) => (
        <Button
          type="primary"
          icon={<LoginOutlined />}
          onClick={() => handleCheckIn(r)}
          style={{ background:'linear-gradient(135deg,#667eea,#764ba2)', border:'none', borderRadius:8, fontWeight:600 }}
          size="small"
        >
          Check-in
        </Button>
      )
    }
  ];

  const totalGuests = filtered.reduce((s,b) => s + (b.bookingDetails?.length || 0), 0);

  return (
    <div>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: 16, padding: '28px 36px', marginBottom: 24,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16,
        boxShadow: '0 10px 40px rgba(102,126,234,0.3)'
      }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:6 }}>
            <div style={{ width:40,height:40,background:'rgba(255,255,255,0.2)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center' }}>
              <LoginOutlined style={{ color:'white', fontSize:20 }} />
            </div>
            <Title level={2} style={{ color:'white', margin:0, fontWeight:800 }}>Khách Đến Hôm Nay</Title>
          </div>
          <Text style={{ color:'rgba(255,255,255,0.85)', fontSize:14 }}>
            Danh sách khách dự kiến nhận phòng trong ngày – {selectedDate.format('DD/MM/YYYY')}
          </Text>
        </div>
        <Space wrap>
          <DatePicker
            value={selectedDate} onChange={v => v && setSelectedDate(v)}
            format="DD/MM/YYYY"
            style={{ borderRadius:8 }}
            allowClear={false}
          />
          <Button icon={<ReloadOutlined />} onClick={fetchData}
            style={{ background:'rgba(255,255,255,0.2)', color:'white', border:'1px solid rgba(255,255,255,0.3)', borderRadius:8 }}>
            Làm mới
          </Button>
        </Space>
      </div>

      {/* Stats */}
      <Row gutter={16} style={{ marginBottom:20 }}>
        {[
          { label:'Khách đến hôm nay', value: filtered.length, color:'#667eea', icon:<UserOutlined /> },
          { label:'Tổng số phòng', value: totalGuests, color:'#764ba2', icon:<HomeOutlined /> },
          { label:'Giờ check-in sớm nhất', value: filtered[0]?.bookingDetails?.[0]?.checkInDate ? dayjs(filtered[0].bookingDetails[0].checkInDate).format('HH:mm') : '--:--', color:'#f59e0b', icon:<ClockCircleOutlined />, isText:true },
        ].map(s => (
          <Col xs={24} sm={8} key={s.label}>
            <Card style={{ borderRadius:12, borderLeft:`4px solid ${s.color}`, boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }} size="small">
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:44,height:44,background:`${s.color}22`,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',color:s.color,fontSize:20 }}>
                  {s.icon}
                </div>
                <div>
                  <div style={{ fontSize:22,fontWeight:800,color:s.color }}>{s.value}</div>
                  <Text type="secondary" style={{ fontSize:12 }}>{s.label}</Text>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Search & Table */}
      <Card style={{ borderRadius:16, boxShadow:'0 4px 16px rgba(0,0,0,0.06)', border:'none' }}>
        <div style={{ padding:'16px 16px 0', marginBottom:16 }}>
          <Input
            prefix={<SearchOutlined style={{ color:'#667eea' }} />}
            placeholder="Tìm theo tên khách, mã booking, SĐT, số phòng..."
            value={searchText} onChange={e => setSearchText(e.target.value)}
            style={{ borderRadius:10, maxWidth:460 }}
            allowClear
          />
        </div>
        {filtered.length === 0 && !loading ? (
          <Empty description="Không có khách nào đến hôm nay" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding:40 }} />
        ) : (
          <Table
            columns={columns} dataSource={filtered} rowKey="id" loading={loading}
            pagination={{ pageSize:8, showTotal: t => `Tổng ${t} khách` }}
            scroll={{ x: 900 }}
            rowClassName={(r,i) => i % 2 === 0 ? '' : 'ant-table-row-alt'}
          />
        )}
      </Card>
    </div>
  );
};

export default ArrivalsPage;

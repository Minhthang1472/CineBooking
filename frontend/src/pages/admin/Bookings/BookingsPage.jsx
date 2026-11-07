import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Table, Card, Typography, Button, Space, Tag, Modal, Form, Input,
  Select, message, Segmented, Calendar, Badge, DatePicker, InputNumber,
  Row, Col, Divider, Tooltip, Drawer, Descriptions, Empty, Alert, Spin, Avatar, Popover, Timeline
} from 'antd';
import dayjs from 'dayjs';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, EyeOutlined,
  PlusCircleOutlined, MinusCircleOutlined, CalendarOutlined, HomeOutlined,
  UserOutlined, PhoneOutlined, MailOutlined, DollarOutlined, ClockCircleOutlined,
  SearchOutlined, FilterOutlined, CheckCircleOutlined, InfoCircleOutlined,
  EnvironmentOutlined, TeamOutlined, IdcardOutlined, PrinterOutlined,
  SwapOutlined, FileTextOutlined, StarOutlined
} from '@ant-design/icons';
import { bookingApi } from '../../../api/bookingApi';
import { roomApi } from '../../../api/roomApi';
import { useNotification } from '../../../context/notificationContext';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const { Title, Text } = Typography;
const { Option } = Select;

// ─── Status helpers ────────────────────────────────────────────────
const STATUS_CONFIG = {
  Pending:    { color: 'gold',    label: 'Chờ xác nhận',  icon: <ClockCircleOutlined /> },
  Confirmed:  { color: 'blue',    label: 'Đã xác nhận',   icon: <CalendarOutlined /> },
  Checked_in: { color: 'orange',  label: 'Đang lưu trú',  icon: <HomeOutlined /> },
  Completed:  { color: 'green',   label: 'Hoàn thành',    icon: <CheckCircleOutlined /> },
  Cancelled:  { color: 'red',     label: 'Đã hủy',        icon: null },
};

const StatusTag = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || { color: 'default', label: status };
  return <Tag color={cfg.color} icon={cfg.icon}>{cfg.label}</Tag>;
};

const genBookingCode = () => `BK-${dayjs().format('YYYYMMDD')}${Math.floor(Math.random()*1000).toString().padStart(3,'0')}`;

// ─── Kiểm tra phòng có bị trùng booking không ─────────────────────
const isRoomBooked = (roomId, checkIn, checkOut, bookings, excludeBookingId = null) => {
  if (!checkIn || !checkOut || !roomId) return false;
  return bookings.some(b => {
    if (excludeBookingId && b.id === excludeBookingId) return false;
    if (b.status === 'Cancelled' || b.status === 'Completed') return false;
    return b.bookingDetails?.some(d => {
      if (d.roomId !== roomId) return false;
      const dIn = dayjs(d.checkInDate);
      const dOut = dayjs(d.checkOutDate);
      const reqIn = dayjs(checkIn);
      const reqOut = dayjs(checkOut);
      return reqIn.isBefore(dOut) && reqOut.isAfter(dIn);
    });
  });
};

const BookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('table');
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRoomType, setFilterRoomType] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState(null);

  // Modal state
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [form] = Form.useForm();
  const [detailRows, setDetailRows] = useState([{
    key: Date.now(), roomId: null, roomTypeId: null,
    checkInDate: null, checkOutDate: null, pricePerNight: 0, availableRooms: []
  }]);
  const [loadingAvail, setLoadingAvail] = useState({});

  // Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const { addNotification } = useNotification();

  // ── Fetch data ──────────────────────────────────────────────────
  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await bookingApi.getAllBookings();
      setBookings(Array.isArray(res.data) ? res.data : []);
    } catch {
      setBookings([
        { id: 1, bookingCode: 'BK-20260423001', guestName: 'Nguyễn Văn An', guestPhone: '0901234567', guestEmail: 'an@gmail.com', guestIdNumber: '001234567', nationality: 'Việt Nam', adultsCount: 2, childrenCount: 0, specialRequest: '', status: 'Confirmed', voucherCode: null,
          bookingDetails: [{ id: 1, roomId: 1, roomNumber: '101', floor: 1, roomTypeId: 1, roomTypeName: 'Phòng Đơn Tiêu Chuẩn', checkInDate: dayjs().add(1,'day').toISOString(), checkOutDate: dayjs().add(3,'day').toISOString(), pricePerNight: 500000, nights: 2, subtotal: 1000000 }] },
        { id: 2, bookingCode: 'BK-20260420002', guestName: 'Trần Thị Bích', guestPhone: '0912345678', guestEmail: 'bich@gmail.com', guestIdNumber: '005678901', nationality: 'Việt Nam', adultsCount: 2, childrenCount: 1, specialRequest: 'Cần phòng tầng cao', status: 'Checked_in', voucherCode: 'SUMMER10',
          bookingDetails: [{ id: 2, roomId: 3, roomNumber: '201', floor: 2, roomTypeId: 3, roomTypeName: 'Suite VIP', checkInDate: dayjs().subtract(1,'day').toISOString(), checkOutDate: dayjs().add(3,'day').toISOString(), pricePerNight: 3000000, nights: 4, subtotal: 12000000 }] },
      ]);
    } finally { setLoading(false); }
  };

  const fetchRooms = async () => {
    try {
      const [roomRes, typeRes] = await Promise.all([roomApi.getAllRooms(), roomApi.getRoomTypes()]);
      const roomData = Array.isArray(roomRes.data) ? roomRes.data : (roomRes.data?.data || []);
      const typeData = Array.isArray(typeRes.data) ? typeRes.data : (typeRes.data?.data || []);
      setRooms(roomData);
      setRoomTypes(typeData);
    } catch {
      setRooms([
        { id: 1, roomNumber: '101', floor: 1, status: 'Available', roomTypeId: 1, roomType: { id:1, name:'Phòng Đơn Tiêu Chuẩn', basePrice: 500000, capacityAdults:1, capacityChildren:0 } },
        { id: 2, roomNumber: '102', floor: 1, status: 'Available', roomTypeId: 1, roomType: { id:1, name:'Phòng Đơn Tiêu Chuẩn', basePrice: 500000, capacityAdults:1, capacityChildren:0 } },
        { id: 3, roomNumber: '201', floor: 2, status: 'Available', roomTypeId: 2, roomType: { id:2, name:'Phòng Đôi View Biển', basePrice: 1200000, capacityAdults:2, capacityChildren:1 } },
        { id: 4, roomNumber: '202', floor: 2, status: 'Available', roomTypeId: 2, roomType: { id:2, name:'Phòng Đôi View Biển', basePrice: 1200000, capacityAdults:2, capacityChildren:1 } },
        { id: 5, roomNumber: '301', floor: 3, status: 'Available', roomTypeId: 3, roomType: { id:3, name:'Suite VIP', basePrice: 3000000, capacityAdults:4, capacityChildren:2 } },
      ]);
      setRoomTypes([
        { id: 1, name: 'Phòng Đơn Tiêu Chuẩn', basePrice: 500000, capacityAdults:1, capacityChildren:0 },
        { id: 2, name: 'Phòng Đôi View Biển', basePrice: 1200000, capacityAdults:2, capacityChildren:1 },
        { id: 3, name: 'Suite VIP', basePrice: 3000000, capacityAdults:4, capacityChildren:2 },
      ]);
    }
  };

  useEffect(() => { fetchBookings(); fetchRooms(); }, []);

  // ── Lọc phòng trống theo ngày ───────────────────────────────────
  const getAvailableRooms = useCallback((checkIn, checkOut, excludeBookingId = null) => {
    if (!checkIn || !checkOut) return rooms.filter(r => r.status === 'Available');
    return rooms.filter(r => {
      if (r.status !== 'Available') return false;
      return !isRoomBooked(r.id, checkIn, checkOut, bookings, excludeBookingId);
    });
  }, [rooms, bookings]);

  // ── Khi ngày thay đổi → cập nhật danh sách phòng trống cho row đó
  const updateDetailRow = (key, field, value) => {
    setDetailRows(prev => prev.map(r => {
      if (r.key !== key) return r;
      const updated = { ...r, [field]: value };
      if (field === 'roomId') {
        const room = rooms.find(rm => rm.id === value);
        if (room) {
          updated.roomTypeId = room.roomTypeId || room.roomType?.id;
          updated.pricePerNight = room.roomType?.basePrice || 0;
        }
      }
      if (field === 'checkInDate' || field === 'checkOutDate') {
        const newIn = field === 'checkInDate' ? value : r.checkInDate;
        const newOut = field === 'checkOutDate' ? value : r.checkOutDate;
        const avail = getAvailableRooms(newIn, newOut, editingBooking?.id);
        updated.availableRooms = avail;
        // Nếu phòng đang chọn không còn trống → reset
        if (updated.roomId && !avail.find(rm => rm.id === updated.roomId)) {
          updated.roomId = null;
          updated.roomTypeId = null;
          updated.pricePerNight = 0;
        }
      }
      return updated;
    }));
  };

  const addDetailRow = () => setDetailRows(prev => [...prev, {
    key: Date.now(), roomId: null, roomTypeId: null,
    checkInDate: null, checkOutDate: null, pricePerNight: 0,
    availableRooms: getAvailableRooms(null, null)
  }]);
  const removeDetailRow = (key) => setDetailRows(prev => prev.filter(r => r.key !== key));

  const totalAmount = detailRows.reduce((sum, d) => {
    if (!d.checkInDate || !d.checkOutDate || !d.pricePerNight) return sum;
    const nights = dayjs(d.checkOutDate).diff(dayjs(d.checkInDate), 'day');
    return sum + (nights > 0 ? nights * Number(d.pricePerNight) : 0);
  }, 0);

  // ── Filtered bookings ───────────────────────────────────────────
  const filteredBookings = useMemo(() => {
    let result = bookings;
    if (filterStatus !== 'all') result = result.filter(b => b.status === filterStatus);
    if (filterRoomType !== 'all') result = result.filter(b => b.bookingDetails?.some(d => d.roomTypeName === filterRoomType || d.roomTypeId === filterRoomType));
    if (filterDateRange?.[0] && filterDateRange?.[1]) {
      result = result.filter(b => b.bookingDetails?.some(d => {
        const ci = dayjs(d.checkInDate);
        return ci.isAfter(filterDateRange[0].startOf('day')) && ci.isBefore(filterDateRange[1].endOf('day'));
      }));
    }
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      result = result.filter(b =>
        b.bookingCode?.toLowerCase().includes(q) ||
        b.guestName?.toLowerCase().includes(q) ||
        b.guestPhone?.includes(q) ||
        b.guestEmail?.toLowerCase().includes(q) ||
        b.guestIdNumber?.includes(q) ||
        b.bookingDetails?.some(d => d.roomNumber?.includes(q))
      );
    }
    return result;
  }, [bookings, searchText, filterStatus, filterRoomType, filterDateRange]);

  // ── CRUD ───────────────────────────────────────────────────────
  const handleViewDetail = (record) => { setSelectedBooking(record); setDrawerOpen(true); };

  const handleCreate = () => {
    setEditingBooking(null);
    form.resetFields();
    form.setFieldsValue({ bookingCode: genBookingCode(), status: 'Pending', adultsCount: 1, childrenCount: 0, nationality: 'Việt Nam' });
    const initRow = { key: Date.now(), roomId: null, roomTypeId: null, checkInDate: null, checkOutDate: null, pricePerNight: 0, availableRooms: rooms.filter(r => r.status === 'Available') };
    setDetailRows([initRow]);
    setIsModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingBooking(record);
    form.setFieldsValue({
      bookingCode: record.bookingCode, guestName: record.guestName,
      guestPhone: record.guestPhone, guestEmail: record.guestEmail,
      guestIdNumber: record.guestIdNumber, nationality: record.nationality || 'Việt Nam',
      adultsCount: record.adultsCount || 1, childrenCount: record.childrenCount || 0,
      specialRequest: record.specialRequest, status: record.status,
    });
    if (record.bookingDetails?.length > 0) {
      setDetailRows(record.bookingDetails.map(d => {
        const ci = d.checkInDate ? dayjs(d.checkInDate) : null;
        const co = d.checkOutDate ? dayjs(d.checkOutDate) : null;
        return {
          key: d.id || Date.now(),
          roomId: d.roomId, roomTypeId: d.roomTypeId,
          checkInDate: ci, checkOutDate: co,
          pricePerNight: d.pricePerNight || 0,
          availableRooms: getAvailableRooms(ci, co, record.id),
        };
      }));
    } else {
      setDetailRows([{ key: Date.now(), roomId: null, roomTypeId: null, checkInDate: null, checkOutDate: null, pricePerNight: 0, availableRooms: rooms.filter(r => r.status === 'Available') }]);
    }
    setIsModalVisible(true);
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Xác nhận xóa đặt phòng', okText: 'Xóa', okType: 'danger', cancelText: 'Hủy',
      content: 'Toàn bộ chi tiết phòng trong booking cũng sẽ bị xóa.',
      onOk: async () => {
        try {
          await bookingApi.deleteBooking(id);
          message.success('Đã xóa!');
          addNotification('Xóa Booking', 'Đã xóa một bản ghi đặt phòng.', 'warning');
          fetchBookings();
        } catch { message.error('Lỗi khi xóa!'); }
      }
    });
  };

  // Hàm đổi trạng thái nhanh
  const handleQuickStatus = async (id, newStatus) => {
    try {
      await bookingApi.updateStatus(id, newStatus);
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
      const cfg = STATUS_CONFIG[newStatus];
      message.success(`Đã chuyển sang: ${cfg?.label || newStatus}`);
      addNotification('Cập nhật trạng thái', `Booking đã chuyển sang “${cfg?.label}”`, 'info');
    } catch { message.error('Lỗi cập nhật trạng thái!'); }
  };

  // In phiếu đặt phòng
  const handlePrint = (record) => {
    const total = (record.bookingDetails || []).reduce((s, d) => s + (d.subtotal || 0), 0);
    const win = window.open('', '_blank', 'width=800,height=600');
    win.document.write(`
      <html><head><title>Phiếu đặt phòng – ${record.bookingCode}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 30px; color: #111; }
        .header { text-align:center; border-bottom: 2px solid #1677ff; padding-bottom:16px; margin-bottom:20px; }
        .hotel-name { font-size:24px; font-weight:800; color:#1677ff; }
        .code { font-size:16px; color:#555; margin-top:4px; }
        table { width:100%; border-collapse:collapse; margin-top:16px; }
        th { background:#1677ff; color:white; padding:10px; text-align:left; }
        td { padding:9px; border-bottom:1px solid #eee; }
        .total { font-size:18px; font-weight:800; color:#1e40af; text-align:right; margin-top:16px; }
        .section { margin-bottom:20px; }
        .label { color:#888; font-size:12px; }
        .value { font-weight:600; font-size:14px; }
        .footer { margin-top:30px; text-align:center; color:#999; font-size:12px; }
        @media print { body { padding: 10px; } }
      </style></head><body>
      <div class="header">
        <div class="hotel-name">🏨 ThirtySix Hotel & Resort</div>
        <div class="code">PHIếU ĐỊT PHÒNG – ${record.bookingCode}</div>
      </div>
      <div class="section">
        <table><tr>
          <td><span class="label">Khách hàng</span><br/><span class="value">${record.guestName || '—'}</span></td>
          <td><span class="label">Số điện thoại</span><br/><span class="value">${record.guestPhone || '—'}</span></td>
          <td><span class="label">Email</span><br/><span class="value">${record.guestEmail || '—'}</span></td>
        </tr><tr>
          <td><span class="label">CCCD/Hộ chiếu</span><br/><span class="value">${record.guestIdNumber || '—'}</span></td>
          <td><span class="label">Quốc tịch</span><br/><span class="value">${record.nationality || 'Việt Nam'}</span></td>
          <td><span class="label">Trạng thái</span><br/><span class="value">${STATUS_CONFIG[record.status]?.label || record.status}</span></td>
        </tr></table>
      </div>
      <table>
        <tr><th>Số Phòng</th><th>Hạng</th><th>Nhận phòng</th><th>Trả phòng</th><th>Số đêm</th><th>Giá/đêm</th><th>Thành tiền</th></tr>
        ${(record.bookingDetails || []).map(d => {
          const n = d.nights || (d.checkInDate && d.checkOutDate ? dayjs(d.checkOutDate).diff(dayjs(d.checkInDate),'day') : 0);
          const sub = d.subtotal || n * (d.pricePerNight || 0);
          return `<tr>
            <td>${d.roomNumber || '—'}</td>
            <td>${d.roomTypeName || '—'}</td>
            <td>${d.checkInDate ? dayjs(d.checkInDate).format('DD/MM/YYYY HH:mm') : '—'}</td>
            <td>${d.checkOutDate ? dayjs(d.checkOutDate).format('DD/MM/YYYY HH:mm') : '—'}</td>
            <td>${n}</td>
            <td>${(d.pricePerNight || 0).toLocaleString('vi-VN')} đ</td>
            <td>${sub.toLocaleString('vi-VN')} đ</td>
          </tr>`;
        }).join('')}
      </table>
      <div class="total">∑ Tổng cộng: ${total.toLocaleString('vi-VN')} VNĐ</div>
      ${record.specialRequest ? `<div style="margin-top:16px;padding:12px;background:#fffbe6;border-radius:6px;"><strong>Yêu cầu đặc biệt:</strong> ${record.specialRequest}</div>` : ''}
      <div class="footer">In lúc: ${dayjs().format('HH:mm DD/MM/YYYY')} – ThirtySix Hotel ERP System</div>
      </body></html>
    `);
    win.document.close();
    setTimeout(() => { win.print(); }, 300);
  };

  const handleSubmit = async (values) => {
    const validDetails = detailRows.filter(d => d.roomId && d.checkInDate && d.checkOutDate);
    if (validDetails.length === 0) { message.error('Vui lòng thêm ít nhất 1 phòng với ngày nhận/trả!'); return; }
    // Kiểm tra trùng phòng
    for (const d of validDetails) {
      if (isRoomBooked(d.roomId, d.checkInDate, d.checkOutDate, bookings, editingBooking?.id)) {
        const room = rooms.find(r => r.id === d.roomId);
        message.error(`Phòng ${room?.roomNumber || d.roomId} đã được đặt trong khoảng thời gian này!`);
        return;
      }
    }
    const bookingDetails = validDetails.map(d => ({
      roomId: d.roomId, roomTypeId: d.roomTypeId,
      checkInDate: dayjs(d.checkInDate).toISOString(),
      checkOutDate: dayjs(d.checkOutDate).toISOString(),
      pricePerNight: Number(d.pricePerNight) || 0,
    }));
    try {
      if (editingBooking) {
        await bookingApi.updateBooking(editingBooking.id, { ...editingBooking, ...values });
        await bookingApi.updateBookingDetails(editingBooking.id, bookingDetails);
        message.success('Cập nhật thành công!');
        addNotification('Cập nhật Booking', `Đã cập nhật đặt phòng: ${values.bookingCode}`, 'info');
      } else {
        await bookingApi.createBooking({ ...values, bookingDetails });
        message.success('Tạo đặt phòng thành công!');
        addNotification('Booking Mới', `Đã tạo: ${values.bookingCode} – ${values.guestName}`, 'success');
      }
      setIsModalVisible(false);
      fetchBookings();
    } catch { message.error('Lỗi lưu dữ liệu!'); }
  };

  // ── Export Excel ────────────────────────────────────────────────
  const handleExportExcel = () => {
    if (!bookings.length) { message.warning('Không có dữ liệu!'); return; }
    const rows = [];
    bookings.forEach(b => {
      const totalBk = (b.bookingDetails || []).reduce((s, d) => s + (d.subtotal || 0), 0);
      if (b.bookingDetails?.length > 0) {
        b.bookingDetails.forEach((d, i) => {
          rows.push({
            'Mã Đặt Phòng': i === 0 ? b.bookingCode : '',
            'Tên Khách': i === 0 ? b.guestName : '',
            'SĐT': i === 0 ? b.guestPhone : '',
            'CCCD/Hộ chiếu': i === 0 ? (b.guestIdNumber || '') : '',
            'Quốc tịch': i === 0 ? (b.nationality || '') : '',
            'Người lớn': i === 0 ? (b.adultsCount || '') : '',
            'Trẻ em': i === 0 ? (b.childrenCount || '') : '',
            'Trạng Thái': i === 0 ? (STATUS_CONFIG[b.status]?.label || b.status) : '',
            'Số Phòng': d.roomNumber, 'Hạng Phòng': d.roomTypeName,
            'Check-in': d.checkInDate ? dayjs(d.checkInDate).format('DD/MM/YYYY HH:mm') : '',
            'Check-out': d.checkOutDate ? dayjs(d.checkOutDate).format('DD/MM/YYYY HH:mm') : '',
            'Số Đêm': d.nights || '', 'Giá/Đêm (VNĐ)': d.pricePerNight, 'Thành Tiền (VNĐ)': d.subtotal || '',
            'Tổng Booking (VNĐ)': i === 0 ? totalBk : '',
          });
        });
      } else {
        rows.push({ 'Mã Đặt Phòng': b.bookingCode, 'Tên Khách': b.guestName });
      }
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [14,22,14,14,12,10,10,18,12,22,16,16,10,18,20,20].map(wch => ({ wch }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DatPhong');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `BaoCao_DatPhong_${dayjs().format('YYYY-MM-DD')}.xlsx`);
    message.success('Xuất Excel thành công!');
  };

  // ── Calendar cell ───────────────────────────────────────────────
  const dateCellRender = (value) => {
    const events = [];
    bookings.forEach(b => {
      (b.bookingDetails || []).forEach(d => {
        if (d.checkInDate && dayjs(d.checkInDate).isSame(value, 'day')) {
          events.push({ bookingCode: b.bookingCode, roomNumber: d.roomNumber, status: b.status });
        }
      });
    });
    return (
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {events.map((ev, i) => (
          <li key={i} style={{ marginBottom: 2 }}>
            <Badge
              status={ev.status === 'Confirmed' ? 'processing' : ev.status === 'Checked_in' ? 'warning' : 'success'}
              text={<span style={{ fontSize: 11 }}>{ev.bookingCode} – P.{ev.roomNumber}</span>}
            />
          </li>
        ))}
      </ul>
    );
  };
  const cellRender = (current, info) => info.type === 'date' ? dateCellRender(current) : info.originNode;

  // ── Table columns ──────────────────────────────────────────────
  const columns = [
    {
      title: 'Mã Đặt Phòng', dataIndex: 'bookingCode', key: 'bookingCode',
      render: (text, record) => (
        <Button type="link" style={{ padding: 0, fontWeight: 700 }} onClick={() => handleViewDetail(record)}>{text}</Button>
      )
    },
    {
      title: 'Khách Hàng', key: 'guest',
      render: (_, r) => (
        <Space>
          <Avatar style={{ background: 'linear-gradient(135deg,#1677ff,#0958d9)', color: 'white', fontWeight: 700 }} size={36}>{r.guestName?.charAt(0)}</Avatar>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{r.guestName}</div>
            <div style={{ color: '#888', fontSize: 11 }}><PhoneOutlined style={{ marginRight: 4 }} />{r.guestPhone}</div>
          </div>
        </Space>
      )
    },
    {
      title: 'Phòng Đặt', key: 'rooms',
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          {(record.bookingDetails || []).map(d => (
            <Tag key={d.id} color="blue">P.{d.roomNumber} – {d.roomTypeName}</Tag>
          ))}
        </Space>
      )
    },
    {
      title: 'Check-in', key: 'checkIn',
      render: (_, record) => {
        const first = record.bookingDetails?.[0];
        return first?.checkInDate ? (
          <Space direction="vertical" size={0}>
            <Text strong>{dayjs(first.checkInDate).format('HH:mm')}</Text>
            <Text type="secondary" style={{ fontSize: 11 }}>{dayjs(first.checkInDate).format('DD/MM/YYYY')}</Text>
          </Space>
        ) : '—';
      }
    },
    {
      title: 'Check-out', key: 'checkOut',
      render: (_, record) => {
        const first = record.bookingDetails?.[0];
        return first?.checkOutDate ? (
          <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(first.checkOutDate).format('DD/MM/YYYY HH:mm')}</Text>
        ) : '—';
      }
    },
    {
      title: 'Khách', key: 'guests',
      render: (_, r) => (
        <Space direction="vertical" size={0}>
          {r.adultsCount > 0 && <Text style={{ fontSize: 12 }}><UserOutlined /> {r.adultsCount} người lớn</Text>}
          {r.childrenCount > 0 && <Text style={{ fontSize: 12 }}><TeamOutlined /> {r.childrenCount} trẻ em</Text>}
        </Space>
      )
    },
    {
      title: 'Tổng Tiền', key: 'total',
      render: (_, record) => {
        const total = (record.bookingDetails || []).reduce((s, d) => s + (d.subtotal || 0), 0);
        return <Text strong style={{ color: '#16a34a' }}>{total.toLocaleString('vi-VN')} đ</Text>;
      }
    },
    { title: 'Trạng Thái', dataIndex: 'status', key: 'status', render: s => <StatusTag status={s} /> },
    {
      title: 'Thao Tác', key: 'action', fixed: 'right',
      render: (_, record) => {
        const nextStatuses = {
          Pending: [{ key:'Confirmed', label:'✔ Xác nhận' }, { key:'Cancelled', label:'✖ Hủy' }],
          Confirmed: [{ key:'Checked_in', label:'→ Nhận phòng' }, { key:'Cancelled', label:'✖ Hủy' }],
          Checked_in: [{ key:'Completed', label:'✔ Hoàn thành' }],
          Completed: [], Cancelled: [],
        };
        const transitions = nextStatuses[record.status] || [];
        return (
          <Space size={4}>
            <Tooltip title="Xem chi tiết"><Button type="text" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)} /></Tooltip>
            <Tooltip title="Chỉnh sửa"><Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} /></Tooltip>
            <Tooltip title="In phiếu"><Button type="text" icon={<PrinterOutlined />} onClick={() => handlePrint(record)} /></Tooltip>
            {transitions.length > 0 && (
              <Popover trigger="click" placement="bottomRight" content={
                <Space direction="vertical" size={4}>
                  <Text type="secondary" style={{ fontSize:11 }}>Chuyển trạng thái sang:</Text>
                  {transitions.map(t => (
                    <Button key={t.key} size="small" type="primary"
                      style={{ width:'100%', background: t.key==='Cancelled' ? '#ff4d4f' : t.key==='Completed' ? '#16a34a' : '#1677ff', border:'none' }}
                      onClick={() => handleQuickStatus(record.id, t.key)}>
                      {t.label}
                    </Button>
                  ))}
                </Space>
              }>
                <Tooltip title="Đổi trạng thái">
                  <Button type="text" icon={<SwapOutlined />} style={{ color:'#1677ff' }} />
                </Tooltip>
              </Popover>
            )}
            <Tooltip title="Xóa"><Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} /></Tooltip>
          </Space>
        );
      }
    }
  ];

  // ── Render ──────────────────────────────────────────────────────
  return (
    <div>
      {/* Banner */}
      <div style={{ background: 'linear-gradient(135deg, #001529 0%, #1677ff 100%)', borderRadius: 16, padding: '28px 36px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, boxShadow: '0 10px 30px rgba(22,119,255,0.15)' }}>
        <div>
          <Title level={2} style={{ color: 'white', margin: '0 0 6px 0', fontWeight: 700 }}>Quản Lý Đặt Phòng</Title>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
            Tạo, chỉnh sửa đặt phòng – Kiểm tra tự động phòng trống theo ngày check-in/check-out.
          </Text>
        </div>
        <Space wrap>
          <Segmented options={[{ label: '☰ Bảng', value: 'table' }, { label: '📅 Lịch', value: 'calendar' }]} value={viewMode} onChange={setViewMode} />
          <Button onClick={handleExportExcel} style={{ background: '#16a34a', color: 'white', border: 'none', fontWeight: 600 }}>Xuất Excel</Button>
          <Button icon={<ReloadOutlined />} onClick={fetchBookings} style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}>Làm mới</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate} style={{ background: 'white', color: '#1677ff', border: 'none', fontWeight: 700 }}>Tạo Đặt Phòng</Button>
        </Space>
      </div>

      {/* Stats */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        {[
          { label: 'Tổng Đơn', value: bookings.length, color: '#1677ff' },
          { label: 'Đang Lưu Trú', value: bookings.filter(b => b.status === 'Checked_in').length, color: '#fa8c16' },
          { label: 'Chờ Xác Nhận', value: bookings.filter(b => b.status === 'Pending').length, color: '#faad14' },
          { label: 'Đã Hoàn Thành', value: bookings.filter(b => b.status === 'Completed').length, color: '#52c41a' },
          { label: 'Đã Hủy', value: bookings.filter(b => b.status === 'Cancelled').length, color: '#ff4d4f' },
        ].map(s => (
          <Col xs={12} sm={8} md={24/5} key={s.label}>
            <Card size="small" style={{ borderRadius: 12, textAlign: 'center', borderTop: `3px solid ${s.color}` }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
              <Text type="secondary" style={{ fontSize: 11 }}>{s.label}</Text>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Filter Bar */}
      {viewMode === 'table' && (
        <Card style={{ borderRadius: 12, marginBottom: 16, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }} styles={{ body: { padding: '14px 20px' } }}>
          <Row gutter={[12,8]} align="middle" wrap>
            <Col flex="1" style={{ minWidth: 200 }}>
              <Input prefix={<SearchOutlined style={{ color: '#1677ff' }} />}
                placeholder="Tìm mã booking, tên, SĐT, CCCD, số phòng..."
                value={searchText} onChange={e => setSearchText(e.target.value)}
                style={{ borderRadius: 8 }} allowClear />
            </Col>
            <Col>
              <Select value={filterStatus} onChange={setFilterStatus} style={{ width: 170 }} placeholder="Trạng thái">
                <Option value="all">Tất cả trạng thái</Option>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                  <Option key={k} value={k}><Tag color={v.color} style={{ margin: 0 }}>{v.label}</Tag></Option>
                ))}
              </Select>
            </Col>
            <Col>
              <Select value={filterRoomType} onChange={setFilterRoomType} style={{ width: 180 }} placeholder="Hạng phòng">
                <Option value="all">Tất cả hạng</Option>
                {roomTypes.map(t => <Option key={t.id} value={t.name}>{t.name}</Option>)}
              </Select>
            </Col>
            <Col>
              <DatePicker.RangePicker
                value={filterDateRange} onChange={setFilterDateRange}
                format="DD/MM/YYYY" style={{ borderRadius: 8 }}
                placeholder={['Check-in từ', 'Check-in đến']}
                allowClear
              />
            </Col>
            <Col>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Hiển thị <strong>{filteredBookings.length}</strong> / {bookings.length} đơn
              </Text>
            </Col>
          </Row>
        </Card>
      )}

      {/* Main Table */}
      <Card style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }} styles={{ body: { padding: viewMode === 'calendar' ? 24 : 0 } }}>
        {viewMode === 'table' ? (
          <Table columns={columns} dataSource={filteredBookings} rowKey="id" loading={loading}
            pagination={{ pageSize: 8, showTotal: t => `Tổng ${t} đơn` }}
            scroll={{ x: 1300 }}
            locale={{ emptyText: <Empty description="Không tìm thấy đặt phòng nào" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: 40 }} /> }}
          />
        ) : (
          <Calendar cellRender={cellRender} />
        )}
      </Card>

      {/* ─── Modal Tạo / Chỉnh Sửa ──────────────────────────────── */}
      <Modal
        title={
          <Space>
            <CalendarOutlined style={{ color: '#1677ff' }} />
            <span style={{ fontWeight: 700 }}>{editingBooking ? 'Cập Nhật Đặt Phòng' : 'Tạo Đặt Phòng Mới'}</span>
          </Space>
        }
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        width={960}
        okText="💾 Lưu Đặt Phòng"
        cancelText="Hủy"
        styles={{ body: { maxHeight: '80vh', overflowY: 'auto', paddingRight: 4 } }}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>

          {/* ── A: Thông tin đặt phòng ── */}
          <Divider orientation="left" plain>
            <Text strong><InfoCircleOutlined style={{ marginRight: 6, color: '#1677ff' }} />Thông Tin Đặt Phòng</Text>
          </Divider>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="bookingCode" label="Mã Đặt Phòng" rules={[{ required: true }]}>
                <Input prefix={<CalendarOutlined />} placeholder="BK-20260423001" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="status" label="Trạng Thái">
                <Select>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                    <Option key={k} value={k}><Tag color={v.color}>{v.label}</Tag></Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {/* ── B: Thông tin khách ── */}
          <Divider orientation="left" plain>
            <Text strong><UserOutlined style={{ marginRight: 6, color: '#1677ff' }} />Thông Tin Khách Hàng</Text>
          </Divider>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="guestName" label="Họ Tên Khách" rules={[{ required: true, message: 'Nhập tên khách!' }]}>
                <Input prefix={<UserOutlined />} placeholder="Nguyễn Văn An" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="guestPhone" label="Số Điện Thoại">
                <Input prefix={<PhoneOutlined />} placeholder="0901234567" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="guestEmail" label="Email">
                <Input prefix={<MailOutlined />} placeholder="khach@email.com" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="guestIdNumber" label="CCCD / Hộ Chiếu">
                <Input prefix={<IdcardOutlined />} placeholder="Số CCCD hoặc hộ chiếu" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="nationality" label="Quốc Tịch">
                <Input prefix={<EnvironmentOutlined />} placeholder="Việt Nam" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="adultsCount" label="Người Lớn">
                <InputNumber style={{ width: '100%' }} min={1} max={20} prefix={<UserOutlined />} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="childrenCount" label="Trẻ Em">
                <InputNumber style={{ width: '100%' }} min={0} max={10} />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="specialRequest" label="Yêu Cầu Đặc Biệt">
                <Input.TextArea rows={2} placeholder="VD: Cần giường phụ, phòng không hút thuốc, view biển..." />
              </Form.Item>
            </Col>
          </Row>

          {/* ── C: Chi tiết phòng ── */}
          <Divider orientation="left" plain>
            <Text strong><HomeOutlined style={{ marginRight: 6, color: '#1677ff' }} />Danh Sách Phòng Đặt</Text>
          </Divider>

          <Alert type="info" showIcon style={{ marginBottom: 12, borderRadius: 8 }} icon={<InfoCircleOutlined />}
            message="Chọn ngày nhận/trả phòng trước – hệ thống sẽ tự động lọc và chỉ hiển thị các phòng TRỐNG trong khoảng thời gian đó." />

          {detailRows.map((row, idx) => {
            const nights = (row.checkInDate && row.checkOutDate)
              ? dayjs(row.checkOutDate).diff(dayjs(row.checkInDate), 'day') : 0;
            const subtotal = nights > 0 ? nights * (row.pricePerNight || 0) : 0;
            const availCount = row.availableRooms?.length ?? rooms.filter(r => r.status === 'Available').length;
            const selectedRoom = rooms.find(r => r.id === row.roomId);

            return (
              <Card key={row.key} size="small"
                style={{ marginBottom: 16, borderRadius: 12, background: '#f8faff', border: '1px solid #dbeafe' }}
                title={
                  <Space>
                    <div style={{ width: 26, height: 26, background: '#1677ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 12, fontWeight: 700 }}>{idx + 1}</div>
                    <Text strong style={{ color: '#1677ff' }}>Phòng {idx + 1}</Text>
                    {row.roomId && selectedRoom && (
                      <Tag color="blue">{selectedRoom.roomType?.name}</Tag>
                    )}
                  </Space>
                }
                extra={detailRows.length > 1 && (
                  <Button danger type="text" size="small" icon={<MinusCircleOutlined />} onClick={() => removeDetailRow(row.key)}>Xóa</Button>
                )}
              >
                <Row gutter={12}>
                  {/* Chọn ngày trước */}
                  <Col xs={24} sm={12} md={10}>
                    <Text type="secondary" style={{ fontSize: 12 }}>📅 Ngày Nhận Phòng *</Text>
                    <DatePicker
                      style={{ width: '100%', marginTop: 4 }}
                      showTime={{ format: 'HH:mm' }} format="DD/MM/YYYY HH:mm"
                      value={row.checkInDate ? dayjs(row.checkInDate) : null}
                      onChange={val => updateDetailRow(row.key, 'checkInDate', val)}
                      placeholder="Chọn giờ nhận phòng"
                      disabledDate={d => d && d.isBefore(dayjs(), 'day')}
                    />
                  </Col>
                  <Col xs={24} sm={12} md={10}>
                    <Text type="secondary" style={{ fontSize: 12 }}>📅 Ngày Trả Phòng *</Text>
                    <DatePicker
                      style={{ width: '100%', marginTop: 4 }}
                      showTime={{ format: 'HH:mm' }} format="DD/MM/YYYY HH:mm"
                      value={row.checkOutDate ? dayjs(row.checkOutDate) : null}
                      onChange={val => updateDetailRow(row.key, 'checkOutDate', val)}
                      placeholder="Chọn giờ trả phòng"
                      disabledDate={d => d && row.checkInDate && d.isBefore(dayjs(row.checkInDate), 'day')}
                    />
                  </Col>
                  {nights > 0 && (
                    <Col xs={24} md={4} style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 4 }}>
                      <div style={{ background: '#dbeafe', borderRadius: 8, padding: '6px 10px', textAlign: 'center', width: '100%' }}>
                        <div style={{ fontWeight: 800, fontSize: 18, color: '#1677ff' }}>{nights}</div>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>đêm</div>
                      </div>
                    </Col>
                  )}
                </Row>

                {/* Chọn phòng - chỉ hiện sau khi chọn ngày */}
                {row.checkInDate && row.checkOutDate ? (
                  <Row gutter={12} style={{ marginTop: 10 }}>
                    <Col xs={24} sm={12} md={8}>
                      <div style={{ marginBottom: 2 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Số Phòng *
                          <Tag color={availCount > 0 ? 'green' : 'red'} style={{ marginLeft: 6, fontSize: 10 }}>
                            {availCount} phòng trống
                          </Tag>
                        </Text>
                      </div>
                      <Select
                        style={{ width: '100%' }} placeholder={availCount > 0 ? "Chọn phòng trống..." : "Không có phòng trống"}
                        value={row.roomId} showSearch optionFilterProp="label"
                        onChange={val => updateDetailRow(row.key, 'roomId', val)}
                        disabled={availCount === 0}
                        notFoundContent={<Empty description="Không có phòng trống" image={Empty.PRESENTED_IMAGE_SIMPLE} />}
                      >
                        {(row.availableRooms || []).map(r => (
                          <Option key={r.id} value={r.id} label={`Phòng ${r.roomNumber}`}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Space>
                                <Tag color="blue" style={{ fontWeight: 700 }}>P.{r.roomNumber}</Tag>
                                <Text style={{ fontSize: 12 }}>Tầng {r.floor}</Text>
                              </Space>
                              <Space>
                                <Text type="secondary" style={{ fontSize: 11 }}>{r.roomType?.name}</Text>
                                <Tag color="green" style={{ fontSize: 10 }}>{(r.roomType?.basePrice || 0).toLocaleString('vi-VN')}đ/đêm</Tag>
                              </Space>
                            </div>
                          </Option>
                        ))}
                      </Select>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                      <Text type="secondary" style={{ fontSize: 12 }}>Hạng Phòng</Text>
                      <Select style={{ width: '100%', marginTop: 4 }} placeholder="Hạng phòng" value={row.roomTypeId} disabled>
                        {roomTypes.map(t => <Option key={t.id} value={t.id}>{t.name}</Option>)}
                      </Select>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                      <Text type="secondary" style={{ fontSize: 12 }}>Giá / Đêm (VNĐ)</Text>
                      <InputNumber
                        style={{ width: '100%', marginTop: 4 }}
                        value={row.pricePerNight}
                        formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={v => v.replace(/,*/g, '')}
                        onChange={val => updateDetailRow(row.key, 'pricePerNight', val)}
                      />
                    </Col>
                  </Row>
                ) : (
                  <div style={{ background: '#fef9c3', borderRadius: 8, padding: '10px 14px', marginTop: 10, color: '#854d0e', fontSize: 12 }}>
                    ⚠️ Chọn ngày nhận và trả phòng để xem danh sách phòng trống.
                  </div>
                )}

                {/* Tóm tắt */}
                {nights > 0 && row.roomId && row.pricePerNight > 0 && (
                  <div style={{ background: 'linear-gradient(135deg,#eff6ff,#dbeafe)', borderRadius: 8, padding: '10px 14px', marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Space>
                      <Text>{nights} đêm</Text>
                      <Text type="secondary">×</Text>
                      <Text><strong>{(row.pricePerNight || 0).toLocaleString('vi-VN')}</strong> đ</Text>
                    </Space>
                    <Text strong style={{ color: '#1e40af', fontSize: 16 }}>= {subtotal.toLocaleString('vi-VN')} đ</Text>
                  </div>
                )}

                {/* Cảnh báo phòng đã đặt */}
                {row.roomId && row.checkInDate && row.checkOutDate &&
                  isRoomBooked(row.roomId, row.checkInDate, row.checkOutDate, bookings, editingBooking?.id) && (
                  <Alert type="error" showIcon style={{ marginTop: 10, borderRadius: 8 }}
                    message="⚠️ Phòng này đã được đặt trong khoảng thời gian bạn chọn!" />
                )}
              </Card>
            );
          })}

          <Button type="dashed" icon={<PlusCircleOutlined />} onClick={addDetailRow} block
            style={{ borderColor: '#1677ff', color: '#1677ff', marginBottom: 16 }}>
            + Thêm Phòng Khác
          </Button>

          {/* Tổng cộng */}
          {totalAmount > 0 && (
            <Card size="small" style={{ borderRadius: 12, background: 'linear-gradient(135deg,#eff6ff,#dbeafe)', border: '1px solid #bfdbfe' }}>
              <Row justify="space-between" align="middle">
                <Col>
                  <Text type="secondary">Tổng {detailRows.filter(d => d.roomId).length} phòng – {detailRows.reduce((s,d) => { const n = (d.checkInDate && d.checkOutDate) ? dayjs(d.checkOutDate).diff(dayjs(d.checkInDate),'day') : 0; return s+n; }, 0)} đêm</Text>
                </Col>
                <Col>
                  <Text strong style={{ fontSize: 22, color: '#1e40af' }}>
                    <DollarOutlined style={{ marginRight: 6 }} />{totalAmount.toLocaleString('vi-VN')} VNĐ
                  </Text>
                </Col>
              </Row>
            </Card>
          )}
        </Form>
      </Modal>

      {/* ─── Drawer Chi Tiết ─────────────────────────────────────── */}
      <Drawer
        title={
          <Space>
            <CalendarOutlined style={{ color: '#1677ff' }} />
            <span>Chi Tiết – {selectedBooking?.bookingCode}</span>
            {selectedBooking && <StatusTag status={selectedBooking.status} />}
          </Space>
        }
        open={drawerOpen} onClose={() => setDrawerOpen(false)} width={580}
        extra={<Button type="primary" icon={<EditOutlined />} onClick={() => { setDrawerOpen(false); handleEdit(selectedBooking); }}>Chỉnh Sửa</Button>}
      >
        {selectedBooking && (
          <div>
            {/* Thông tin khách */}
            <Card size="small" style={{ borderRadius: 10, marginBottom: 16, borderLeft: '4px solid #1677ff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <Avatar style={{ background: 'linear-gradient(135deg,#1677ff,#0958d9)', color: 'white', fontWeight: 700 }} size={52}>{selectedBooking.guestName?.charAt(0)}</Avatar>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{selectedBooking.guestName}</div>
                  <div style={{ color: '#888', fontSize: 12 }}>{selectedBooking.guestEmail}</div>
                </div>
              </div>
              <Descriptions bordered column={2} size="small">
                <Descriptions.Item label={<><PhoneOutlined /> SĐT</>}>{selectedBooking.guestPhone || '—'}</Descriptions.Item>
                <Descriptions.Item label={<><IdcardOutlined /> CCCD</>}>{selectedBooking.guestIdNumber || '—'}</Descriptions.Item>
                <Descriptions.Item label={<><EnvironmentOutlined /> Quốc tịch</>}>{selectedBooking.nationality || '—'}</Descriptions.Item>
                <Descriptions.Item label={<><TeamOutlined /> Khách</>}>
                  {selectedBooking.adultsCount || 0} người lớn, {selectedBooking.childrenCount || 0} trẻ em
                </Descriptions.Item>
                <Descriptions.Item label="Voucher" span={2}>{selectedBooking.voucherCode || 'Không sử dụng'}</Descriptions.Item>
                {selectedBooking.specialRequest && (
                  <Descriptions.Item label="Yêu cầu đặc biệt" span={2}>{selectedBooking.specialRequest}</Descriptions.Item>
                )}
              </Descriptions>
            </Card>

            <Divider plain>Danh Sách Phòng</Divider>

            {(selectedBooking.bookingDetails || []).length === 0 ? (
              <Empty description="Chưa có chi tiết phòng" />
            ) : (
              (selectedBooking.bookingDetails || []).map((d, i) => {
                const nights = d.nights || (d.checkInDate && d.checkOutDate ? dayjs(d.checkOutDate).diff(dayjs(d.checkInDate), 'day') : 0);
                const subtotal = d.subtotal || (nights * (d.pricePerNight || 0));
                return (
                  <Card key={d.id || i} size="small" style={{ marginBottom: 12, borderRadius: 10, borderLeft: '4px solid #10b981' }}>
                    <Row justify="space-between" align="top">
                      <Col>
                        <Text strong style={{ fontSize: 16 }}>Phòng {d.roomNumber}</Text><br />
                        <Tag color="blue">{d.roomTypeName}</Tag>
                        {d.floor && <Tag color="default">Tầng {d.floor}</Tag>}
                      </Col>
                      <Col style={{ textAlign: 'right' }}>
                        <Text strong style={{ color: '#16a34a', fontSize: 16 }}>{(subtotal || 0).toLocaleString('vi-VN')} đ</Text><br />
                        <Text type="secondary" style={{ fontSize: 12 }}>{nights} đêm × {(d.pricePerNight || 0).toLocaleString('vi-VN')}</Text>
                      </Col>
                    </Row>
                    <Divider style={{ margin: '10px 0' }} />
                    <Row gutter={8}>
                      <Col span={12}><Text type="secondary" style={{ fontSize: 12 }}>📅 Nhận phòng:</Text><br /><Text>{d.checkInDate ? dayjs(d.checkInDate).format('DD/MM/YYYY HH:mm') : '—'}</Text></Col>
                      <Col span={12}><Text type="secondary" style={{ fontSize: 12 }}>📅 Trả phòng:</Text><br /><Text>{d.checkOutDate ? dayjs(d.checkOutDate).format('DD/MM/YYYY HH:mm') : '—'}</Text></Col>
                    </Row>
                  </Card>
                );
              })
            )}

            {(selectedBooking.bookingDetails || []).length > 0 && (
              <Card style={{ borderRadius: 12, background: 'linear-gradient(135deg,#eff6ff,#dbeafe)', border: 'none', marginTop: 8 }}>
                <Row justify="space-between">
                  <Col><Text strong>Tổng {(selectedBooking.bookingDetails || []).length} phòng</Text></Col>
                  <Col>
                    <Text strong style={{ fontSize: 22, color: '#1e40af' }}>
                      {(selectedBooking.bookingDetails || []).reduce((s, d) => s + (d.subtotal || 0), 0).toLocaleString('vi-VN')} VNĐ
                    </Text>
                  </Col>
                </Row>
              </Card>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default BookingsPage;

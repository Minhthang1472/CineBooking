import React, { useState, useEffect, useRef } from 'react';
import { Table, Card, Typography, Button, Space, Modal, Form, Input, InputNumber, Select, message, Tag, Tooltip, Divider, Row, Col, Descriptions, Alert, Spin } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, FileTextOutlined, CreditCardOutlined, PrinterOutlined, EyeOutlined, SearchOutlined } from '@ant-design/icons';
import { invoiceApi } from '../../../api/financeApi';
import axiosClient from '../../../api/axiosClient';
import { useNotification } from '../../../context/notificationContext';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

const STATUS_MAP = {
  Unpaid:   { color: 'red',     label: 'Chưa thanh toán' },
  Paid:     { color: 'green',   label: 'Đã thanh toán' },
  Partial:  { color: 'orange',  label: 'Thanh toán một phần' },
  Cancelled:{ color: 'default', label: 'Đã hủy' },
};

// ─── Invoice Print Template ─────────────────────────────────────
const InvoicePrintView = ({ invoice }) => {
  if (!invoice) return null;
  return (
    <div id="invoice-print-area" style={{ fontFamily: 'Arial, sans-serif', maxWidth: 680, margin: '0 auto', padding: 32, color: '#111' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#1677ff', letterSpacing: '-1px' }}>🏨 LuxStay Hotel</div>
          <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>123 Đường Biển, Đà Nẵng, Việt Nam</div>
          <div style={{ fontSize: 13, color: '#666' }}>Tel: 0236 3999 888 | Email: info@luxstay.vn</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#111' }}>HÓA ĐƠN</div>
          <div style={{ fontSize: 14, color: '#1677ff', fontWeight: 700 }}>#{invoice.id}</div>
          <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>Ngày: {dayjs().format('DD/MM/YYYY')}</div>
          <div style={{ marginTop: 8 }}>
            <span style={{ padding: '4px 12px', borderRadius: 6, fontSize: 13, fontWeight: 700,
              background: invoice.status === 'Paid' ? '#f6ffed' : invoice.status === 'Unpaid' ? '#fff2f0' : '#fff7e6',
              color: invoice.status === 'Paid' ? '#389e0d' : invoice.status === 'Unpaid' ? '#cf1322' : '#d46b08',
              border: `1px solid ${invoice.status === 'Paid' ? '#b7eb8f' : invoice.status === 'Unpaid' ? '#ffa39e' : '#ffd591'}`
            }}>
              {STATUS_MAP[invoice.status]?.label || invoice.status}
            </span>
          </div>
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '2px solid #f0f0f0', margin: '0 0 24px 0' }} />

      {/* Guest Info */}
      <div style={{ background: '#f8faff', borderRadius: 10, padding: '16px 20px', marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#1677ff', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Thông Tin Khách Hàng</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div><span style={{ color: '#888', fontSize: 13 }}>Họ Tên:</span> <span style={{ fontWeight: 600 }}>{invoice.guestName || '—'}</span></div>
          <div><span style={{ color: '#888', fontSize: 13 }}>Mã Booking:</span> <span style={{ fontWeight: 600, color: '#1677ff' }}>{invoice.bookingCode || '—'}</span></div>
        </div>
      </div>

      {/* Items Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
        <thead>
          <tr style={{ background: '#001529', color: 'white' }}>
            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13 }}>Khoản Mục</th>
            <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13 }}>Số Tiền</th>
          </tr>
        </thead>
        <tbody>
          {[
            { label: 'Tiền phòng', value: invoice.totalRoomAmount },
            { label: 'Dịch vụ phát sinh', value: invoice.totalServiceAmount },
            { label: 'Giảm giá / Voucher', value: invoice.discountAmount ? -invoice.discountAmount : null },
            { label: 'Thuế VAT (10%)', value: invoice.taxAmount },
          ].filter(r => r.value != null && r.value !== 0).map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #f0f0f0', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
              <td style={{ padding: '12px 16px', fontSize: 14 }}>{row.label}</td>
              <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: 14, color: row.value < 0 ? '#cf1322' : '#111' }}>
                {Number(row.value).toLocaleString('vi-VN')} đ
              </td>
            </tr>
          ))}
          <tr style={{ background: '#001529', color: 'white' }}>
            <td style={{ padding: '16px', fontWeight: 800, fontSize: 16 }}>TỔNG CỘNG</td>
            <td style={{ padding: '16px', textAlign: 'right', fontWeight: 900, fontSize: 18 }}>
              {Number(invoice.finalTotal || 0).toLocaleString('vi-VN')} đ
            </td>
          </tr>
        </tbody>
      </table>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 48 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ height: 60, borderBottom: '1px solid #111', width: 160 }} />
          <div style={{ fontSize: 12, color: '#888', marginTop: 6 }}>Chữ ký khách hàng</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ height: 60, borderBottom: '1px solid #111', width: 160 }} />
          <div style={{ fontSize: 12, color: '#888', marginTop: 6 }}>Chữ ký thu ngân</div>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: 32, fontSize: 12, color: '#bbb' }}>
        Cảm ơn quý khách đã lưu trú tại LuxStay Hotel. Hẹn gặp lại! ✨
      </div>
    </div>
  );
};

// ─── Main Component ─────────────────────────────────────────────
const InvoicesPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [printModalVisible, setPrintModalVisible] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [printingInvoice, setPrintingInvoice] = useState(null);
  const [bookingPreview, setBookingPreview] = useState(null); // preview khi nhập bookingId
  const [previewLoading, setPreviewLoading] = useState(false);
  const [form] = Form.useForm();
  const { addNotification } = useNotification();

  // Fetch booking info để preview khi nhập bookingId hoặc bookingCode
  const handlePreviewBooking = async () => {
    const q = form.getFieldValue('bookingSearch');
    if (!q || !String(q).trim()) { message.warning('Vui lòng nhập mã booking hoặc ID!'); return; }
    setPreviewLoading(true);
    try {
      const res = await axiosClient.get(`/Bookings/lookup?q=${encodeURIComponent(String(q).trim())}`);
      const bk = res.data;
      setBookingPreview(bk);
      // Điền bookingId thực vào form
      form.setFieldValue('bookingId', bk.id);
      // Auto-fill các trường tiền
      const details = bk.bookingDetails || [];
      const roomAmt = details.reduce((sum, d) => {
        const nights = Math.ceil((new Date(d.checkOutDate) - new Date(d.checkInDate)) / 86400000);
        return sum + (d.pricePerNight || 0) * nights;
      }, 0);
      const tax = Math.round(roomAmt * 0.1);
      form.setFieldsValue({
        totalRoomAmount: roomAmt,
        totalServiceAmount: 0,
        discountAmount: 0,
        taxAmount: tax,
        finalTotal: roomAmt + tax,
        status: 'Unpaid',
      });
    } catch (err) {
      const q2 = form.getFieldValue('bookingSearch');
      message.error(`Không tìm thấy booking: ${q2}!`);
      setBookingPreview(null);
    } finally { setPreviewLoading(false); }
  };

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await invoiceApi.getAllInvoices();
      const data = res.data?.data || res.data || [];
      setInvoices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      // Mock data
      setInvoices([
        { id: 1, bookingCode: 'BK-001', guestName: 'Nguyễn Văn An', totalRoomAmount: 3400000, totalServiceAmount: 500000, discountAmount: 200000, taxAmount: 370000, finalTotal: 4070000, status: 'Paid', paymentCount: 1 },
        { id: 2, bookingCode: 'BK-002', guestName: 'Trần Thị Bích', totalRoomAmount: 12000000, totalServiceAmount: 800000, discountAmount: 0, taxAmount: 1280000, finalTotal: 14080000, status: 'Unpaid', paymentCount: 0 },
        { id: 3, bookingCode: 'BK-003', guestName: 'Lê Văn Cường', totalRoomAmount: 2000000, totalServiceAmount: 200000, discountAmount: 100000, taxAmount: 210000, finalTotal: 2310000, status: 'Partial', paymentCount: 1 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInvoices(); }, []);

  const handlePrint = (invoice) => {
    setPrintingInvoice(invoice);
    setPrintModalVisible(true);
  };

  const doPrint = () => {
    const printArea = document.getElementById('invoice-print-area');
    if (!printArea) return;
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>Hóa Đơn #${printingInvoice?.id}</title>
      <style>body{margin:0;padding:16px;font-family:Arial,sans-serif;} @media print{body{margin:0;}}</style>
      </head><body>${printArea.innerHTML}</body></html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: 'Mã Booking', dataIndex: 'bookingCode', key: 'bookingCode', render: (t) => <Text strong style={{ color: '#1677ff' }}>{t || '—'}</Text> },
    { title: 'Khách Hàng', dataIndex: 'guestName', key: 'guestName' },
    { title: 'Tiền Phòng', dataIndex: 'totalRoomAmount', key: 'totalRoomAmount', render: (v) => v ? `${Number(v).toLocaleString('vi-VN')} đ` : '—' },
    { title: 'Dịch Vụ', dataIndex: 'totalServiceAmount', key: 'totalServiceAmount', render: (v) => v ? `${Number(v).toLocaleString('vi-VN')} đ` : '—' },
    { title: 'Tổng Cộng', dataIndex: 'finalTotal', key: 'finalTotal', render: (v) => <Text strong style={{ color: '#52c41a', fontSize: 15 }}>{v ? `${Number(v).toLocaleString('vi-VN')} đ` : '—'}</Text> },
    { title: 'Trạng Thái', dataIndex: 'status', key: 'status', render: (s) => { const m = STATUS_MAP[s] || { color: 'default', label: s }; return <Tag color={m.color} style={{ borderRadius: 6, fontWeight: 600 }}>{m.label}</Tag>; } },
    {
      title: 'Thao Tác', key: 'action',
      render: (_, record) => (
        <Space>
          <Tooltip title="Xem & In hóa đơn">
            <Button type="primary" ghost size="small" icon={<PrinterOutlined />} onClick={() => handlePrint(record)}>In</Button>
          </Tooltip>
          <Tooltip title="Cập nhật trạng thái">
            <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          </Tooltip>
          <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
        </Space>
      )
    }
  ];

  const handleEdit = (record) => {
    setEditingInvoice(record);
    form.setFieldsValue({ status: record.status });
    setIsModalVisible(true);
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Xóa hóa đơn này?',
      okText: 'Xóa', okType: 'danger', cancelText: 'Hủy',
      onOk: async () => {
        try {
          await invoiceApi.deleteInvoice(id);
          message.success('Đã xóa hóa đơn!');
          addNotification('Xóa Hóa Đơn', `Đã xóa hóa đơn #${id}`, 'warning');
          fetchInvoices();
        } catch { message.error('Lỗi khi xóa!'); }
      }
    });
  };

  const handleSubmit = async (values) => {
    try {
      if (editingInvoice) {
        await invoiceApi.updateInvoice(editingInvoice.id, { ...editingInvoice, ...values });
        message.success('Cập nhật thành công!');
        addNotification('Cập nhật Hóa Đơn', `Hóa đơn #${editingInvoice.id} → ${STATUS_MAP[values.status]?.label}`, 'info');
      } else {
        // Loại bỏ bookingSearch (trường tìm kiếm text), chỉ gửi bookingId (số)
        const { bookingSearch, ...payload } = values;
        if (!payload.bookingId) {
          message.error('Vui lòng bấm "Kiểm Tra" để xác nhận booking trước!');
          return;
        }
        await invoiceApi.createInvoice(payload);
        message.success('Tạo hóa đơn thành công!');
        addNotification('Hóa Đơn Mới', `Đã tạo hóa đơn cho booking #${payload.bookingId}`, 'success');
      }
      setIsModalVisible(false);
      setBookingPreview(null);
      fetchInvoices();
    } catch { message.error('Lỗi lưu dữ liệu!'); }
  };


  const handleExportExcel = () => {
    if (!invoices.length) { message.warning('Không có dữ liệu!'); return; }
    const dataToExport = invoices.map(i => ({
      'Mã Hóa Đơn': i.id,
      'Mã Booking': i.bookingCode || '—',
      'Tên Khách Hàng': i.guestName || '—',
      'Tiền Phòng (VNĐ)': i.totalRoomAmount || 0,
      'Tiền Dịch Vụ (VNĐ)': i.totalServiceAmount || 0,
      'Giảm Giá (VNĐ)': i.discountAmount || 0,
      'Thuế VAT (VNĐ)': i.taxAmount || 0,
      'Tổng Cộng (VNĐ)': i.finalTotal || 0,
      'Trạng Thái': STATUS_MAP[i.status]?.label || i.status,
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    ws['!cols'] = [10,15,22,18,18,15,12,20,20].map(wch => ({ wch }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'HoaDon');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `HoaDon_${dayjs().format('YYYY-MM-DD')}.xlsx`);
    message.success('Xuất Excel thành công!');
  };

  const totalRevenue = invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + (Number(i.finalTotal) || 0), 0);
  const unpaidCount = invoices.filter(i => i.status === 'Unpaid').length;

  return (
    <div>
      {/* Banner */}
      <div style={{ background: 'linear-gradient(135deg, #001529 0%, #52c41a 100%)', borderRadius: 16, padding: '28px 36px', marginBottom: 24, color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, boxShadow: '0 10px 30px rgba(82,196,26,0.2)' }}>
        <div>
          <Title level={2} style={{ color: 'white', margin: '0 0 6px 0', fontWeight: 700 }}>
            <FileTextOutlined style={{ marginRight: 10 }} />Quản Lý Hóa Đơn
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
            Theo dõi trạng thái thanh toán, xuất PDF và in hóa đơn chuyên nghiệp cho khách.
          </Text>
        </div>
        <Space size="large" style={{ flexWrap: 'wrap' }}>
          <div style={{ background: 'rgba(255,255,255,0.15)', padding: '10px 18px', borderRadius: 12, backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{Number(totalRevenue).toLocaleString('vi-VN')} đ</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>Tổng đã thu</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.15)', padding: '10px 18px', borderRadius: 12, backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#ff7875' }}>{unpaidCount}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>Chưa thanh toán</div>
          </div>
        </Space>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <Button onClick={handleExportExcel} style={{ background: '#16a34a', color: 'white', fontWeight: 600, border: 'none' }}>Xuất Excel</Button>
        <Button icon={<ReloadOutlined />} onClick={fetchInvoices}>Làm mới</Button>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingInvoice(null); form.resetFields(); setIsModalVisible(true); }}>Tạo Hóa Đơn</Button>
      </div>

      <Card style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }} styles={{ body: { padding: 0 } }}>
        <Table columns={columns} dataSource={invoices} rowKey="id" loading={loading} pagination={{ pageSize: 10, showTotal: t => `Tổng ${t} hóa đơn` }} scroll={{ x: 1100 }} style={{ borderRadius: 16, overflow: 'hidden' }} />
      </Card>

      {/* Modal Form */}
      <Modal
        title={editingInvoice ? 'Cập nhật Hóa Đơn' : 'Tạo Hóa Đơn Mới'}
        open={isModalVisible}
        onCancel={() => { setIsModalVisible(false); setBookingPreview(null); }}
        onOk={() => form.submit()}
        width={560}
      >
        <Spin spinning={previewLoading}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {!editingInvoice && (
            <>
              <Form.Item
                name="bookingSearch"
                label="Tìm Booking (Nhập mã booking hoặc số ID)"
                rules={[{ required: true, message: 'Nhập mã booking hoặc ID!' }]}
              >
                <Space.Compact style={{ width: '100%' }}>
                  <Input
                    style={{ width: 'calc(100% - 120px)' }}
                    placeholder="VD: BK1778655253398 hoặc 1018"
                    allowClear
                    onPressEnter={handlePreviewBooking}
                  />
                  <Button type="primary" icon={<SearchOutlined />} onClick={handlePreviewBooking} style={{ width: 120 }}>
                    Kiểm Tra
                  </Button>
                </Space.Compact>
              </Form.Item>
              {/* bookingId ẩn - được điền tự động sau khi lookup */}
              <Form.Item name="bookingId" hidden><Input /></Form.Item>
              {bookingPreview && (
                <Alert
                  type="success"
                  style={{ marginBottom: 16 }}
                  message={
                    <div>
                      <div><strong>Khách:</strong> {bookingPreview.guestName || '—'}
                        {bookingPreview.guestPhone ? ` · 📞 ${bookingPreview.guestPhone}` : ''}
                      </div>
                      <div><strong>Mã booking:</strong> <span style={{color:'#1677ff'}}>{bookingPreview.bookingCode}</span> · <strong>ID:</strong> #{bookingPreview.id} · <strong>Trạng thái:</strong> {bookingPreview.status}</div>
                      {bookingPreview.bookingDetails?.[0] && (
                        <div><strong>Phòng:</strong> {bookingPreview.bookingDetails[0].roomTypeName || '—'} · {bookingPreview.bookingDetails[0].checkInDate?.slice(0,10)} → {bookingPreview.bookingDetails[0].checkOutDate?.slice(0,10)}</div>
                      )}
                    </div>
                  }
                />
              )}
            </>
          )}
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="totalRoomAmount" label="Tiền Phòng (VNĐ)">
                <InputNumber style={{ width: '100%' }} min={0} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="totalServiceAmount" label="Tiền Dịch Vụ (VNĐ)">
                <InputNumber style={{ width: '100%' }} min={0} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="discountAmount" label="Giảm Giá (VNĐ)">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="taxAmount" label="Thuế VAT (VNĐ)">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="finalTotal" label="Tổng Cuối (VNĐ)" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="Trạng Thái" rules={[{ required: true }]}>
                <Select>
                  <Option value="Unpaid">Chưa thanh toán</Option>
                  <Option value="Partial">Thanh toán một phần</Option>
                  <Option value="Paid">Đã thanh toán</Option>
                  <Option value="Cancelled">Đã hủy</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
        </Spin>
      </Modal>

      {/* Modal Print Preview */}
      <Modal
        title={<Space><PrinterOutlined style={{ color: '#1677ff' }} />In Hóa Đơn #{printingInvoice?.id}</Space>}
        open={printModalVisible}
        onCancel={() => setPrintModalVisible(false)}
        width={720}
        footer={[
          <Button key="cancel" onClick={() => setPrintModalVisible(false)}>Đóng</Button>,
          <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={doPrint}
            style={{ background: '#001529' }}>
            In / Xuất PDF
          </Button>
        ]}
      >
        <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, overflow: 'hidden', padding: 16 }}>
          <InvoicePrintView invoice={printingInvoice} />
        </div>
      </Modal>
    </div>
  );
};

export default InvoicesPage;

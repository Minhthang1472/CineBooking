import React, { useState, useEffect } from 'react';
import { Typography, Table, Button, Select, Alert, Modal, Form, InputNumber, Input, message, Tabs, Popconfirm, Space, Tag, Card, Skeleton } from 'antd';
import { WarningOutlined, DeleteOutlined, FileTextOutlined, CheckSquareOutlined, ReloadOutlined, HomeOutlined } from '@ant-design/icons';
import { lossDamageApi } from '../../../api/lossDamageApi';
import { roomApi } from '../../../api/roomApi';
import { useNotification } from '../../../context/notificationContext';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

const LossCompensationPage = () => {
  const [rooms, setRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [checklist, setChecklist] = useState([]);
  const [checklistLoading, setChecklistLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reportingItem, setReportingItem] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [form] = Form.useForm();

  const [historyData, setHistoryData] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);

  const { addNotification } = useNotification();

  // 1. Tải danh sách phòng THẬT từ API
  const fetchRooms = async () => {
    try {
      const res = await roomApi.getAllRooms();
      const data = res.data?.data || res.data || [];
      const roomList = Array.isArray(data) ? data : [];
      setRooms(roomList);
      if (roomList.length > 0 && !selectedRoomId) {
        setSelectedRoomId(roomList[0].id);
      }
    } catch (error) {
      console.error('Lỗi tải danh sách phòng:', error);
      message.error('Không thể tải danh sách phòng từ máy chủ!');
    }
  };

  // 2. Tải danh sách vật tư THẬT theo phòng từ API
  const fetchChecklist = async (roomId) => {
    if (!roomId) return;
    setChecklistLoading(true);
    try {
      const res = await roomApi.getRoomInventory(roomId);
      // API trả về { data: [...] }
      const data = res.data?.data || res.data || [];
      setChecklist(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Lỗi tải vật tư phòng:', error);
      message.warning('Phòng này chưa có vật tư trong kho. Hãy đồng bộ từ kho trước!');
      setChecklist([]);
    } finally {
      setChecklistLoading(false);
    }
  };

  // 3. Tải lịch sử đền bù THẬT
  const fetchHistory = async () => {
    setTableLoading(true);
    try {
      const res = await lossDamageApi.getAllLossAndDamages();
      setHistoryData(res.data || []);
    } catch (error) {
      console.error('Lỗi tải dữ liệu:', error);
      message.error('Không thể tải lịch sử đền bù từ máy chủ!');
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    fetchHistory();
  }, []);

  // Khi chọn phòng mới → tải lại vật tư
  useEffect(() => {
    if (selectedRoomId) {
      fetchChecklist(selectedRoomId);
    }
  }, [selectedRoomId]);

  const handleOpenReportModal = (item) => {
    setReportingItem(item);
    form.resetFields();
    form.setFieldsValue({ quantity: 1, penaltyAmount: item.priceIfLost || 0 });
    setIsModalOpen(true);
  };

  const handleReportSubmit = async (values) => {
    setSubmitLoading(true);
    try {
      const payload = {
        roomInventoryId: reportingItem.id,
        // Lấy bookingDetailId nếu có, hoặc null
        bookingDetailId: null,
        quantity: values.quantity,
        penaltyAmount: values.penaltyAmount,
        description: values.description || `Nhân viên buồng phòng báo hỏng/mất: ${reportingItem.itemName}`,
      };

      await lossDamageApi.createLossAndDamage(payload);
      const currentRoom = rooms.find(r => r.id === selectedRoomId);
      const roomLabel = currentRoom ? `Phòng ${currentRoom.roomNumber}` : 'Phòng không xác định';

      message.success('Đã lưu biên bản đền bù thành công!');
      addNotification(
        '⚠️ Biên bản thất thoát mới',
        `Ghi nhận hỏng/mất: ${reportingItem.itemName} tại ${roomLabel}. Tiền phạt: ${values.penaltyAmount?.toLocaleString('vi-VN')} đ`,
        'warning'
      );

      setIsModalOpen(false);
      fetchHistory();
    } catch (error) {
      console.error('Lỗi khi lưu:', error);
      message.error('Lưu thất bại! Vui lòng kiểm tra lại BookingDetailId hoặc RoomInventoryId trong SQL.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteRecord = async (id) => {
    try {
      await lossDamageApi.deleteLossAndDamage(id);
      message.success('Đã hủy biên bản thành công!');
      addNotification('Hủy biên bản', 'Đã xóa một biên bản thất thoát khỏi hệ thống', 'info');
      fetchHistory();
    } catch (error) {
      message.error('Lỗi khi xóa biên bản!');
    }
  };

  const checklistColumns = [
    { title: 'Tên Vật Tư / Thiết Bị', dataIndex: 'itemName', key: 'itemName', render: (t) => <Text strong>{t}</Text> },
    { title: 'Số Lượng Chuẩn', dataIndex: 'quantity', key: 'quantity', align: 'center' },
    {
      title: 'Giá Đền Bù', dataIndex: 'priceIfLost', key: 'priceIfLost',
      render: (val) => val ? <Text type="danger">{val?.toLocaleString('vi-VN')} đ</Text> : <Text type="secondary">Chưa định giá</Text>
    },
    {
      title: 'Thao tác', key: 'action', align: 'right',
      render: (_, record) => (
        <Button danger icon={<WarningOutlined />} onClick={() => handleOpenReportModal(record)}>
          Báo hỏng / Mất
        </Button>
      ),
    },
  ];

  const historyColumns = [
    { title: 'Ngày ghi nhận', dataIndex: 'createdAt', key: 'createdAt', render: (date) => date ? dayjs(date).format('DD/MM/YYYY HH:mm') : 'N/A' },
    { title: 'Phòng', dataIndex: 'roomNumber', key: 'roomNumber', render: text => <Tag color="blue">{text || 'N/A'}</Tag> },
    { title: 'Vật tư', dataIndex: 'itemType', key: 'itemType', render: text => <Text strong>{text || 'N/A'}</Text> },
    { title: 'SL', dataIndex: 'quantity', key: 'quantity', align: 'center' },
    { title: 'Tiền phạt (VNĐ)', dataIndex: 'penaltyAmount', key: 'penaltyAmount', render: (val) => <Text type="danger" strong>{val?.toLocaleString('vi-VN')} đ</Text> },
    { title: 'Ghi chú', dataIndex: 'description', key: 'description', ellipsis: true },
    {
      title: 'Thao tác', key: 'action', align: 'center',
      render: (_, record) => (
        <Popconfirm title="Hủy biên bản này?" onConfirm={() => handleDeleteRecord(record.id)} okText="Có" cancelText="Không">
          <Button type="text" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      )
    }
  ];

  const selectedRoom = rooms.find(r => r.id === selectedRoomId);

  const tabItems = [
    {
      key: '1',
      label: <span><CheckSquareOutlined /> Kiểm tra phòng</span>,
      children: (
        <>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space>
              <HomeOutlined style={{ color: '#1677ff' }} />
              <Text strong>Chọn phòng kiểm tra:</Text>
              <Select
                value={selectedRoomId}
                onChange={(val) => setSelectedRoomId(val)}
                style={{ width: 180 }}
                loading={rooms.length === 0}
                placeholder="Chọn phòng..."
                showSearch
                optionFilterProp="children"
              >
                {rooms.map(r => (
                  <Option key={r.id} value={r.id}>Phòng {r.roomNumber} - {r.status}</Option>
                ))}
              </Select>
              {selectedRoom && <Tag color={selectedRoom.status === 'Available' ? 'green' : selectedRoom.status === 'Occupied' ? 'orange' : 'red'}>{selectedRoom.status}</Tag>}
            </Space>
          </div>
          <Alert
            message="Nhân viên buồng phòng kiểm tra thực tế và nhấn 'Báo hỏng' nếu phát hiện thất thoát."
            type="info"
            showIcon
            style={{ marginBottom: 16, borderRadius: 8 }}
          />
          {checklistLoading ? (
            <Skeleton active paragraph={{ rows: 4 }} />
          ) : checklist.length === 0 ? (
            <Alert
              message="Phòng này chưa có vật tư trong kho"
              description="Vui lòng vào trang Quản Lý Phòng và đồng bộ vật tư từ kho cho phòng này trước."
              type="warning"
              showIcon
              style={{ borderRadius: 8 }}
            />
          ) : (
            <Table dataSource={checklist} columns={checklistColumns} rowKey="id" pagination={false} bordered />
          )}
        </>
      )
    },
    {
      key: '2',
      label: <span><FileTextOutlined /> Lịch sử biên bản</span>,
      children: (
        <>
          <div style={{ marginBottom: 16, textAlign: 'right' }}>
            <Button icon={<ReloadOutlined />} onClick={fetchHistory} loading={tableLoading}>Làm mới dữ liệu</Button>
          </div>
          <Table dataSource={historyData} columns={historyColumns} rowKey="id" loading={tableLoading} bordered locale={{ emptyText: 'Chưa có biên bản thất thoát nào' }} />
        </>
      )
    }
  ];

  return (
    <div>
      {/* Banner Header */}
      <div style={{
        background: 'linear-gradient(135deg, #001529 0%, #ff4d4f 100%)',
        borderRadius: '16px', padding: '32px 40px', marginBottom: '28px', color: 'white',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        boxShadow: '0 10px 30px rgba(255,77,79,0.2)',
      }}>
        <div>
          <Title level={2} style={{ color: 'white', margin: '0 0 8px 0', fontWeight: 700 }}>
            Quản Lý Thất Thoát & Đền Bù
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '15px' }}>
            Ghi nhận thiệt hại tài sản và lập biên bản đền bù theo thông tin vật tư thực tế trong phòng.
          </Text>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.15)', padding: '12px 20px', borderRadius: '12px', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 800 }}>{historyData.length}</div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Biên bản đã lập</div>
        </div>
      </div>

      <Card style={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
        <Tabs defaultActiveKey="1" items={tabItems} />
      </Card>

      {/* Modal báo hỏng */}
      <Modal
        title={<span><WarningOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />Báo cáo hỏng/mất: <strong>{reportingItem?.itemName}</strong></span>}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleReportSubmit}>
          <Form.Item label="Số lượng hỏng/mất" name="quantity" rules={[{ required: true, message: 'Nhập số lượng!' }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Số tiền phạt / đền bù (VNĐ)" name="penaltyAmount" rules={[{ required: true, message: 'Nhập số tiền!' }]}>
            <InputNumber min={0} step={10000} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Ghi chú chi tiết" name="description">
            <Input.TextArea rows={3} placeholder="Ví dụ: Vỡ màn hình TV, mất sạc điện thoại..." />
          </Form.Item>
          <Button type="primary" htmlType="submit" danger block loading={submitLoading} style={{ height: 44, borderRadius: 10 }}>
            Xác nhận tạo biên bản
          </Button>
        </Form>
      </Modal>
    </div>
  );
};

export default LossCompensationPage;

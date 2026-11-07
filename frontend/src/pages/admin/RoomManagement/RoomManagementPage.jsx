import React, { useState, useEffect } from 'react';
import { Layout, Typography, Table, Button, Input, Select, Space, Tag, Modal, Form, InputNumber, message, Popconfirm, Descriptions, Row, Col, Divider, Alert, Steps, Tooltip } from 'antd';
import { PlusOutlined, FilterOutlined, ReloadOutlined, EditOutlined, DeleteOutlined, EyeOutlined, AppstoreAddOutlined, CopyOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { roomApi } from '../../../api/roomApi'; 
import { useNavigate } from 'react-router-dom';

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

const RoomManagementPage = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  // === KHU VỰC 1: KHAI BÁO STATE ===
  const [allRooms, setAllRooms] = useState([]);
  const [roomsData, setRoomsData] = useState([]);
  const [roomTypesList, setRoomTypesList] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filterMinFloor, setFilterMinFloor] = useState('');
  const [filterMaxFloor, setFilterMaxFloor] = useState('');
  const [filterRoomType, setFilterRoomType] = useState('all');
  const [filterRoomNumber, setFilterRoomNumber] = useState('');

  // States cho Modal Sửa
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  // States cho Bulk Create
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkForm] = Form.useForm();
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkPreview, setBulkPreview] = useState([]);
  
  // State cho Modal chi tiết
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [roomInventories, setRoomInventories] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);

  // === KHU VỰC 2: HÀM GỌI API ===
  const fetchData = async () => {
    setLoading(true);
    try {
      const [roomsRes, typesRes] = await Promise.all([
        roomApi.getAllRooms(),
        roomApi.getRoomTypes()
      ]);

      // Xử lý dữ liệu phòng
      let rooms = [];
      if (roomsRes.data?.data) {
        rooms = roomsRes.data.data;
      } else if (Array.isArray(roomsRes.data)) {
        rooms = roomsRes.data;
      } else if (roomsRes.data?.rooms) {
        rooms = roomsRes.data.rooms;
      }

      // Xử lý dữ liệu hạng phòng
      let types = [];
      if (typesRes.data?.data) {
        types = typesRes.data.data;
      } else if (Array.isArray(typesRes.data)) {
        types = typesRes.data;
      }

      setAllRooms(rooms); 
      setRoomsData(rooms);
      setRoomTypesList(types);

      if (rooms.length === 0) {
        message.warning('Không có dữ liệu phòng!');
      }

    } catch (error) {
      console.error("Lỗi lấy dữ liệu:", error);
      message.error('Lỗi khi tải dữ liệu phòng!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(); 
  }, []);

  // === KHU VỰC 3: HÀM XỬ LÝ LỌC DỮ LIỆU ===
  const handleFilter = () => {
    let result = [...allRooms];
    if (filterMinFloor) result = result.filter(r => r.floor >= parseInt(filterMinFloor));
    if (filterMaxFloor) result = result.filter(r => r.floor <= parseInt(filterMaxFloor));
    if (filterRoomType !== 'all') result = result.filter(r => r.roomType?.name === filterRoomType);
    if (filterRoomNumber) result = result.filter(r => r.roomNumber.toLowerCase().includes(filterRoomNumber.toLowerCase()));
    setRoomsData(result);
  };

  const clearFilter = () => {
    setFilterMinFloor('');
    setFilterMaxFloor('');
    setFilterRoomType('all');
    setFilterRoomNumber('');
    setRoomsData(allRooms);
  };

  // Hàm Mở Modal Sửa Phòng
  const openEditModal = (record) => {
    setEditingRoomId(record.id); 
    form.setFieldsValue({
      id: record.id,
      roomNumber: record.roomNumber,
      floor: record.floor,
      roomTypeId: record.roomTypeId,
      status: record.status
    }); 
    setIsModalVisible(true);
  };

  // Hàm Lưu Dữ Liệu Sửa
  const handleUpdate = async (values) => {
    setSubmitLoading(true);
    try {
      await roomApi.updateRoom(editingRoomId, values);
      message.success('Cập nhật phòng thành công!');
      setIsModalVisible(false);
      fetchData(); 
    } catch (error) {
      console.error(error);
      message.error('Lỗi khi cập nhật phòng!');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Hàm Xóa Phòng
  const handleDelete = async (id) => {
    try {
      await roomApi.deleteRoom(id);
      message.success('Đã xóa phòng!');
      fetchData(); 
    } catch (error) {
      console.error(error);
      message.error('Không thể xóa phòng này (Có thể đang dính dữ liệu Booking)!');
    }
  };

  // === BULK CREATE ===
  const genBulkPreview = (values) => {
    const { startRoom, endRoom, floor, roomTypeId, prefix } = values;
    if (!startRoom || !endRoom || !floor || !roomTypeId) return [];
    const rooms = [];
    const start = parseInt(startRoom);
    const end = parseInt(endRoom);
    if (isNaN(start) || isNaN(end) || start > end) return [];
    for (let i = start; i <= end; i++) {
      const num = prefix ? `${prefix}${i}` : `${i}`;
      rooms.push({ roomNumber: num, floor, roomTypeId });
    }
    return rooms;
  };

  const handleBulkPreview = () => {
    bulkForm.validateFields().then(values => {
      setBulkPreview(genBulkPreview(values));
    }).catch(() => {});
  };

  const handleBulkSubmit = async () => {
    try {
      const values = await bulkForm.validateFields();
      const preview = genBulkPreview(values);
      if (preview.length === 0) { message.error('Không có phòng nào để tạo!'); return; }
      setBulkLoading(true);
      const payload = preview.map(r => ({
        roomNumber: r.roomNumber,
        floor: r.floor,
        roomTypeId: r.roomTypeId,
        status: 'Available'
      }));
      await roomApi.bulkCreate(payload);
      message.success(`Đã tạo thành công ${payload.length} phòng!`);
      setBulkModalOpen(false);
      bulkForm.resetFields();
      setBulkPreview([]);
      fetchData();
    } catch (err) {
      if (err?.errorFields) return; // validation error
      message.error(err?.response?.data?.message || 'Lỗi khi tạo phòng hàng loạt!');
    } finally {
      setBulkLoading(false);
    }
  };

  // === KHU VỰC 3.5: HÀM XỬ LÝ MODAL CHI TIẾT ===
  const openDetailModal = async (room) => {
    setSelectedRoom(room);
    setIsDetailModalOpen(true);
    
    // Gọi API lấy danh sách vật tư
    setInventoryLoading(true);
    try {
      const response = await roomApi.getRoomInventory(room.id);
      
      // Xử lý dữ liệu response
      let data = [];
      if (response.data?.data) {
        data = Array.isArray(response.data.data) ? response.data.data : [response.data.data];
      } else if (Array.isArray(response.data)) {
        data = response.data;
      }
      
      setRoomInventories(data);
      
      // Nếu không có dữ liệu, hiện message
      if (data.length === 0) {
        message.info('Phòng này chưa có vật tư nào!');
      }
    } catch (error) {
      console.error("Lỗi lấy vật tư:", error);
      // Nếu 404 hoặc không có dữ liệu, set array rỗng
      if (error.response?.status === 404) {
        setRoomInventories([]);
        message.info('Phòng này chưa có vật tư!');
      } else {
        message.error('Lỗi khi tải danh sách vật tư!');
      }
    } finally {
      setInventoryLoading(false);
    }
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedRoom(null);
    setRoomInventories([]);
  };

  // === KHU VỰC 3.6: HÀM CLONE VÀ SYNC ===
  const handleCloneFromTemplate = async (targetRoomId) => {
    // Tìm phòng mẫu dựa vào RoomType
    const templateRoom = allRooms.find(r => 
      r.roomType?.id === selectedRoom.roomType?.id && 
      r.id !== selectedRoom.id
    );
    
    if (!templateRoom) {
      message.warning('Không tìm thấy phòng mẫu khác cho hạng phòng này! Hãy dùng "Đồng bộ từ kho" thay vào.');
      return;
    }

    Modal.confirm({
      title: 'Clone từ phòng mẫu',
      content: `Bạn muốn clone vật tư từ phòng ${templateRoom.roomNumber} sang phòng ${selectedRoom.roomNumber}?`,
      okText: 'Đồng ý',
      cancelText: 'Hủy',
      onOk: async () => {
        setInventoryLoading(true);
        try {
          const response = await roomApi.cloneInventory({
            sourceRoomId: templateRoom.id,
            targetRoomId: targetRoomId
          });
          
          message.success(response.data?.message || 'Clone thành công!');
          
          // Reload lại danh sách vật tư
          const newInventory = await roomApi.getRoomInventory(targetRoomId);
          let data = [];
          if (newInventory.data?.data) {
            data = Array.isArray(newInventory.data.data) ? newInventory.data.data : [newInventory.data.data];
          }
          setRoomInventories(data);
        } catch (error) {
          console.error('Lỗi clone:', error);
          message.error(error.response?.data?.message || 'Lỗi khi clone vật tư!');
        } finally {
          setInventoryLoading(false);
        }
      }
    });
  };

  const handleSyncFromWarehouse = async (roomId) => {
    Modal.confirm({
      title: 'Đồng bộ từ kho',
      content: `Bạn muốn đồng bộ tất cả vật tư từ kho cho phòng ${selectedRoom.roomNumber}?`,
      okText: 'Đồng ý',
      cancelText: 'Hủy',
      onOk: async () => {
        setInventoryLoading(true);
        try {
          const response = await roomApi.syncFromWarehouse({
            roomId: roomId
          });
          
          message.success(response.data?.message || 'Đồng bộ thành công!');
          
          // Reload lại danh sách vật tư
          const newInventory = await roomApi.getRoomInventory(roomId);
          let data = [];
          if (newInventory.data?.data) {
            data = Array.isArray(newInventory.data.data) ? newInventory.data.data : [newInventory.data.data];
          }
          setRoomInventories(data);
        } catch (error) {
          console.error('Lỗi sync:', error);
          message.error(error.response?.data?.message || 'Lỗi khi đồng bộ vật tư!');
        } finally {
          setInventoryLoading(false);
        }
      }
    });
  };

  // === KHU VỰC 4: CẤU HÌNH CỘT CHO BẢNG ===
  const columns = [
    { title: 'Số phòng', dataIndex: 'roomNumber', key: 'roomNumber' },
    { title: 'Tầng', dataIndex: 'floor', key: 'floor' },
    {
      title: 'Hạng phòng',
      key: 'roomType',
      render: (_, record) => {
        if (record.roomType) {
          return record.roomType.name || 'Không xác định';
        }
        return 'Chưa gán Hạng';
      },
    },
    {
      title: 'Giá phòng',
      key: 'pricePerNight',
      render: (_, record) => {
        if (record.roomType && record.roomType.basePrice) {
          return `${parseInt(record.roomType.basePrice).toLocaleString('vi-VN')} VNĐ`;
        }
        return 'Chưa có giá';
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = '';
        if (status === 'Available') color = 'green';
        else if (status === 'Cleaning') color = 'orange';
        else if (status === 'Occupied') color = 'red';
        else if (status === 'Maintenance') color = 'default';
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: 'Quản lý',
      key: 'manage',
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="primary" 
            ghost 
            icon={<EditOutlined />} 
            onClick={() => openEditModal(record)}
          >
            Sửa
          </Button>

          <Popconfirm
            title="Xóa phòng này?"
            description="Bạn có chắc chắn muốn xóa phòng này vĩnh viễn không?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa luôn"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<DeleteOutlined />}>Xóa</Button>
          </Popconfirm>
        </Space>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="primary" 
            icon={<EyeOutlined />}
            onClick={() => openDetailModal(record)}
          >
            Chi tiết
          </Button>
        </Space>
      ),
    },
  ];

  // === KHU VỰC 5: RENDER GIAO DIỆN ===
  return (
    <Layout>
      <Content style={{ padding: '24px', background: '#f7f9fa' }}>
        
        {/* Banner Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #001529 0%, #1677ff 100%)',
            borderRadius: '16px',
            padding: '32px 40px',
            marginBottom: '28px',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 10px 30px rgba(22,119,255,0.15)',
          }}
        >
          <div>
            <Title level={2} style={{ color: 'white', margin: '0 0 8px 0', fontWeight: 700 }}>
              Quản lý Phòng Khách Sạn
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '15px' }}>
              Kiểm soát trạng thái, đồng bộ kho vật tư và thiết lập thông tin phòng.
            </Text>
          </div>
          <Space>
            <Tooltip title="Tạo nhiều phòng cùng lúc theo dãy số">
              <Button
                icon={<AppstoreAddOutlined />}
                onClick={() => { setBulkModalOpen(true); setBulkPreview([]); bulkForm.resetFields(); }}
                style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 10, fontWeight: 600 }}
                size="large"
              >
                Tạo hàng loạt
              </Button>
            </Tooltip>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => navigate('/admin/rooms/create')}
              style={{ background: 'white', color: '#1677ff', border: 'none', borderRadius: '10px', fontWeight: 600 }}
              size="large"
            >
              Thêm phòng mới
            </Button>
          </Space>
        </div>

        <div style={{ background: '#f5f5f5', padding: '16px', marginBottom: '16px', borderRadius: '4px' }}>
          <Space wrap>
            <Text strong>Lọc dữ liệu:</Text>
            
            <Input 
              placeholder="Từ tầng..." 
              value={filterMinFloor} 
              onChange={(e) => setFilterMinFloor(e.target.value)} 
              style={{ width: 100 }} 
            />
            <Input 
              placeholder="Đến tầng..." 
              value={filterMaxFloor} 
              onChange={(e) => setFilterMaxFloor(e.target.value)} 
              style={{ width: 100 }} 
            />
            <Select 
              value={filterRoomType} 
              onChange={(value) => setFilterRoomType(value)} 
              style={{ width: 220 }}
            >
              <Option value="all">-- Tất cả hạng phòng --</Option>
              {roomTypesList.map(type => (
                <Option key={type.id} value={type.name}>{type.name}</Option>
              ))}
            </Select>

            <Input 
              placeholder="Nhập số phòng..." 
              value={filterRoomNumber} 
              onChange={(e) => setFilterRoomNumber(e.target.value)} 
              style={{ width: 150 }} 
            />
            <Button type="primary" icon={<FilterOutlined />} onClick={handleFilter}>
              Lọc kết quả
            </Button>
            <Button icon={<ReloadOutlined />} onClick={clearFilter}>
              Bỏ lọc
            </Button>
          </Space>
        </div>

        <div style={{ background: '#fff', borderRadius: '16px', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <Table 
            loading={loading} 
            columns={columns} 
            dataSource={roomsData} 
            rowKey="id" 
            pagination={{ pageSize: 15 }} 
          />
        </div>

        {/* MODAL CẬP NHẬT PHÒNG */}
        <Modal
          title="Cập nhật thông tin phòng"
          open={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          footer={null} 
          destroyOnHidden
        >
          <Form form={form} layout="vertical" onFinish={handleUpdate}>
            <Form.Item name="id" hidden><Input /></Form.Item> 

            <Form.Item label="Số phòng" name="roomNumber" rules={[{ required: true, message: 'Nhập số phòng!' }]}>
              <Input />
            </Form.Item>

            <Form.Item label="Tầng" name="floor" rules={[{ required: true, message: 'Nhập tầng!' }]}>
              <InputNumber style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item label="Hạng phòng" name="roomTypeId" rules={[{ required: true, message: 'Chọn hạng phòng!' }]}>
              <Select>
                {roomTypesList.map(type => (
                  <Option key={type.id} value={type.id}>{type.name}</Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item label="Trạng thái" name="status">
              <Select>
                <Option value="Available">Phòng trống (Available)</Option>
                <Option value="Occupied">Có khách (Occupied)</Option>
                <Option value="Cleaning">Đang dọn (Cleaning)</Option>
                <Option value="Maintenance">Bảo trì (Maintenance)</Option>
              </Select>
            </Form.Item>

            <Form.Item style={{ textAlign: 'right', marginTop: '24px' }}>
              <Space>
                <Button onClick={() => setIsModalVisible(false)}>Hủy</Button>
                <Button type="primary" htmlType="submit" loading={submitLoading}>Lưu thay đổi</Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* === MODAL CHI TIẾT PHÒNG === */}
        {selectedRoom && (
          <Modal
            title={`Chi tiết phòng: ${selectedRoom.roomNumber}`}
            open={isDetailModalOpen}
            onCancel={closeDetailModal}
            footer={[
              <Button key="close" type="primary" onClick={closeDetailModal}>
                Đóng
              </Button>
            ]}
            width={800}
          >
            <Descriptions bordered column={2} size="small" style={{ marginBottom: '20px' }}>
              <Descriptions.Item label="Số phòng" span={1}>
                {selectedRoom.roomNumber}
              </Descriptions.Item>
              <Descriptions.Item label="Tầng" span={1}>
                {selectedRoom.floor}
              </Descriptions.Item>

              <Descriptions.Item label="Hạng phòng" span={1}>
                {selectedRoom.roomType?.name || 'Chưa gán'}
              </Descriptions.Item>
              <Descriptions.Item label="Giá phòng" span={1}>
                {selectedRoom.roomType?.basePrice 
                  ? `${parseInt(selectedRoom.roomType.basePrice).toLocaleString('vi-VN')} VNĐ` 
                  : 'Chưa có'}
              </Descriptions.Item>

              <Descriptions.Item label="Sức chứa người lớn" span={1}>
                {selectedRoom.roomType?.capacityAdults || 0} người
              </Descriptions.Item>
              <Descriptions.Item label="Sức chứa trẻ em" span={1}>
                {selectedRoom.roomType?.capacityChildren || 0} trẻ
              </Descriptions.Item>

              <Descriptions.Item label="Trạng thái" span={2}>
                {selectedRoom.status === 'Available' && <Tag color="green">{selectedRoom.status}</Tag>}
                {selectedRoom.status === 'Occupied' && <Tag color="red">{selectedRoom.status}</Tag>}
                {selectedRoom.status === 'Cleaning' && <Tag color="orange">{selectedRoom.status}</Tag>}
                {selectedRoom.status === 'Maintenance' && <Tag color="default">{selectedRoom.status}</Tag>}
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
              <Button 
                type="dashed" 
                onClick={() => handleCloneFromTemplate(selectedRoom.id)}
                loading={inventoryLoading}
              >
                📋 Clone từ phòng mẫu
              </Button>
              <Button 
                type="dashed" 
                onClick={() => handleSyncFromWarehouse(selectedRoom.id)}
                loading={inventoryLoading}
              >
                🏪 Đồng bộ từ kho
              </Button>
            </div>

            <div>
              <Title level={5}>Danh sách vật tư trong phòng</Title>
              <Table
                columns={[
                  { title: 'Tên vật tư', dataIndex: 'itemName', key: 'itemName' },
                  { title: 'Số lượng', dataIndex: 'quantity', key: 'quantity' },
                  { 
                    title: 'Giá đền bù', 
                    dataIndex: 'priceIfLost', 
                    key: 'priceIfLost',
                    render: (price) => price ? `${parseInt(price).toLocaleString('vi-VN')} VNĐ` : 'Chưa có'
                  }
                ]}
                dataSource={roomInventories}
                rowKey="id"
                loading={inventoryLoading}
                pagination={false}
                size="small"
              />
            </div>
          </Modal>
        )}
        {/* MODAL TẠO PHÒNG HÀNG LOẠT */}
        <Modal
          title={
            <Space>
              <AppstoreAddOutlined style={{ color: '#1677ff', fontSize: 18 }} />
              <span style={{ fontWeight: 700, fontSize: 16 }}>Tạo Phòng Hàng Loạt</span>
            </Space>
          }
          open={bulkModalOpen}
          onCancel={() => setBulkModalOpen(false)}
          width={680}
          footer={[
            <Button key="cancel" onClick={() => setBulkModalOpen(false)}>Hủy</Button>,
            <Button key="preview" icon={<EyeOutlined />} onClick={handleBulkPreview} type="default">
              Xem trước ({bulkPreview.length} phòng)
            </Button>,
            <Button key="submit" type="primary" icon={<CheckCircleOutlined />}
              loading={bulkLoading} onClick={handleBulkSubmit}
              disabled={bulkPreview.length === 0}
            >
              Tạo {bulkPreview.length > 0 ? `${bulkPreview.length} phòng` : ''}
            </Button>
          ]}
        >
          <Alert
            type="info" showIcon style={{ marginBottom: 20, borderRadius: 8 }}
            message="Tạo nhanh nhiều phòng theo dãy số liên tiếp. Nhấn 'Xem trước' để kiểm tra trước khi tạo."
          />
          <Form form={bulkForm} layout="vertical">
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="prefix" label="Tiền tố số phòng" tooltip="Ví dụ: nhập '1' để ra '101', '102'...">
                  <Input placeholder="VD: 1, 2, A..." />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="startRoom" label="Bắt đầu từ số" rules={[{ required: true, message: 'Nhập số bắt đầu!' }]}>
                  <InputNumber style={{ width: '100%' }} min={1} placeholder="VD: 01" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="endRoom" label="Kết thúc tại số" rules={[{ required: true, message: 'Nhập số kết thúc!' }]}>
                  <InputNumber style={{ width: '100%' }} min={1} placeholder="VD: 10" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="floor" label="Tầng" rules={[{ required: true, message: 'Chọn tầng!' }]}>
                  <InputNumber style={{ width: '100%' }} min={1} placeholder="Số tầng" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="roomTypeId" label="Hạng phòng" rules={[{ required: true, message: 'Chọn hạng phòng!' }]}>
                  <Select placeholder="Chọn hạng phòng">
                    {roomTypesList.map(t => (
                      <Option key={t.id} value={t.id}>{t.name}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </Form>

          {bulkPreview.length > 0 && (
            <>
              <Divider plain style={{ margin: '12px 0' }}>Danh sách sẽ tạo ({bulkPreview.length} phòng)</Divider>
              <div style={{ maxHeight: 200, overflowY: 'auto', background: '#f8faff', borderRadius: 8, padding: 12, border: '1px solid #e6efff' }}>
                <Space wrap size={6}>
                  {bulkPreview.map((r, i) => (
                    <Tag key={i} color="blue" style={{ fontWeight: 600, margin: 2 }}>
                      P.{r.roomNumber} – Tầng {r.floor}
                    </Tag>
                  ))}
                </Space>
              </div>
            </>
          )}
        </Modal>
      </Content>
    </Layout>
  );
};

export default RoomManagementPage;
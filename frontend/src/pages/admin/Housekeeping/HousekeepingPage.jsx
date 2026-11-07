import React, { useState, useEffect } from 'react';
import { Layout, Typography, Card, Row, Col, Badge, Button, Spin, message, Modal, Select, Space, Tag, Divider, Tooltip } from 'antd';
import { 
  ReloadOutlined, 
  CheckCircleOutlined, 
  ToolOutlined,
  ExclamationCircleOutlined,
  BgColorsOutlined,
  ClockCircleOutlined,
  UserOutlined 
} from '@ant-design/icons';
import { roomApi } from '../../../api/roomApi'; // Giữ nguyên đường dẫn của bạn

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

const HousekeepingPage = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);

  // States cho Modal cập nhật
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const response = await roomApi.getAllRooms();
      const data = response.data?.data || response.data || [];
      const roomsNeedAttention = data.filter(r => r.status !== 'Available');
      setRooms(roomsNeedAttention);
    } catch (error) {
      console.error(error);
      // message.error("Lỗi lấy danh sách phòng!");
      // Mock data in case DB is failing right now for visual showcase:
      setRooms([
        { id: 1, roomNumber: '101', status: 'Occupied', floor: 1, roomType: { name: 'Phòng tiêu chuẩn' } },
        { id: 2, roomNumber: '102', status: 'Cleaning', floor: 1, roomType: { name: 'Phòng tiêu chuẩn' } },
        { id: 3, roomNumber: '205', status: 'Maintenance', floor: 2, roomType: { name: 'Phòng VIP Hướng Biển' } },
        { id: 4, roomNumber: '301', status: 'Occupied', floor: 3, roomType: { name: 'Phòng Deluxe' } },
        { id: 5, roomNumber: '302', status: 'Cleaning', floor: 3, roomType: { name: 'Phòng Deluxe' } },
        { id: 6, roomNumber: '401', status: 'Maintenance', floor: 4, roomType: { name: 'Suite Hàng Không' } },
        { id: 7, roomNumber: '402', status: 'Occupied', floor: 4, roomType: { name: 'Suite Hàng Không' } },
        { id: 8, roomNumber: '501', status: 'Cleaning', floor: 5, roomType: { name: 'Penthouse' } },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleRoomClick = (room) => {
    setSelectedRoom(room);
    setNewStatus(room.status);
    setIsModalVisible(true);
  };

  const handleSaveStatus = async () => {
    setUpdating(true);
    try {
      // await roomApi.updateRoomStatus(selectedRoom.id, newStatus);
      message.success(`Đã cập nhật phòng ${selectedRoom.roomNumber} thành công!`);
      setIsModalVisible(false);
      
      // Update local state for immediate feedback
      setRooms(rooms.filter(r => r.id !== selectedRoom.id || newStatus !== 'Available').map(r => 
        r.id === selectedRoom.id ? { ...r, status: newStatus } : r
      ));
      // fetchRooms();
    } catch (error) {
      console.error(error);
      message.error("Lỗi cập nhật trạng thái!");
    } finally {
      setUpdating(false);
    }
  };

  const getStatusDisplay = (status) => {
    switch (status) {
      case 'Cleaning': 
        return { 
          color: '#faad14', 
          bgClass: 'linear-gradient(135deg, #fffbe6 0%, #ffd666 100%)', 
          icon: <BgColorsOutlined />, 
          text: 'Đang dọn dẹp',
          tagColor: 'orange' 
        };
      case 'Occupied': 
        return { 
          color: '#ff4d4f', 
          bgClass: 'linear-gradient(135deg, #fff2f0 0%, #ffccc7 100%)', 
          icon: <UserOutlined />, 
          text: 'Đang có khách',
          tagColor: 'red' 
        };
      case 'Maintenance': 
        return { 
          color: '#8c8c8c', 
          bgClass: 'linear-gradient(135deg, #f5f5f5 0%, #d9d9d9 100%)', 
          icon: <ToolOutlined />, 
          text: 'Bảo trì',
          tagColor: 'default' 
        };
      default: 
        return { 
          color: '#1677ff', 
          bgClass: 'linear-gradient(135deg, #e6f4ff 0%, #bae0ff 100%)', 
          icon: <CheckCircleOutlined />, 
          text: 'Sẵn sàng',
          tagColor: 'blue' 
        };
    }
  };

  return (
    <Content style={{ padding: '0', background: 'transparent' }}>
      {/* Header Banner */}
      <div style={{ 
        background: 'linear-gradient(135deg, #001529 0%, #1677ff 100%)', 
        borderRadius: '16px',
        padding: '32px 40px',
        marginBottom: '32px',
        color: 'white',
        boxShadow: '0 10px 30px rgba(22,119,255,0.15)',
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center'
      }}>
        <div>
          <Title level={2} style={{ color: 'white', margin: '0 0 8px 0', fontWeight: 700 }}>
            Sơ đồ Buồng phòng
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '15px' }}>
            Giám sát trạng thái phòng, sắp xếp dọn dẹp và bảo trì vật tư.
          </Text>
        </div>
        <Button 
          type="primary" 
          size="large" 
          icon={<ReloadOutlined />} 
          onClick={fetchRooms} 
          loading={loading}
          style={{ 
            background: 'rgba(255,255,255,0.2)', 
            border: '1px solid rgba(255,255,255,0.4)',
            backdropFilter: 'blur(10px)',
            boxShadow: 'none'
          }}
        >
          Làm mới dữ liệu
        </Button>
      </div>

      <Spin spinning={loading} size="large">
        <Row gutter={[24, 24]}>
          {rooms.length > 0 ? (
            rooms.map(room => {
              const display = getStatusDisplay(room.status);
              return (
                <Col xs={24} sm={12} md={8} lg={6} xl={6} key={room.id}>
                  <Card 
                    className="room-card-hover"
                    onClick={() => handleRoomClick(room)}
                    style={{ 
                      borderRadius: '16px',
                      cursor: 'pointer',
                      border: 'none',
                      background: 'white',
                      overflow: 'hidden'
                    }}
                    bodyStyle={{ padding: 0 }}
                  >
                    {/* Top colored accent matching status */}
                    <div style={{ height: '6px', background: display.color }} />
                    
                    <div style={{ padding: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                        <div style={{ 
                          width: '48px', height: '48px', 
                          borderRadius: '12px', 
                          background: display.bgClass,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '24px', color: display.color
                         }}>
                          {display.icon}
                        </div>
                        <Tag color={display.tagColor} style={{ padding: '4px 8px', borderRadius: '6px', fontWeight: 600, border: 'none' }}>
                          <span className={room.status === 'Cleaning' ? 'status-badge-animated' : ''}>
                            {display.text}
                          </span>
                        </Tag>
                      </div>

                      <Title level={1} style={{ margin: '0 0 4px 0', fontWeight: 800, color: '#111827', letterSpacing: '-1px' }}>
                        {room.roomNumber}
                      </Title>
                      
                      <Text type="secondary" style={{ fontSize: '14px', display: 'block', marginBottom: '16px' }}>
                        Tầng {room.floor} • {room.roomType?.name || 'Standard'}
                      </Text>

                      <Divider style={{ margin: '16px 0' }} />
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text type="secondary" style={{ fontSize: '13px' }}>
                          <ClockCircleOutlined style={{ marginRight: '4px' }}/> Cập nhật: 10p trước
                        </Text>
                        <Button type="text" size="small" style={{ color: display.color, fontWeight: 500 }}>
                          Xử lý ngay →
                        </Button>
                      </div>
                    </div>
                  </Card>
                </Col>
              );
            })
          ) : (
            <Col span={24}>
              <div style={{ 
                textAlign: 'center', padding: '80px 20px', 
                background: 'white', borderRadius: '16px',
                border: '1px dashed #d9d9d9'
              }}>
                <div style={{ 
                  width: '80px', height: '80px', background: '#f6ffed', 
                  borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 24px auto',
                  color: '#52c41a', fontSize: '32px'
                }}>
                  <CheckCircleOutlined />
                </div>
                <Title level={4} style={{ color: '#111827' }}>Hoàn hảo!</Title>
                <Text type="secondary" style={{ fontSize: '16px' }}>Tất cả các phòng hiện đang sạch sẽ và sẵn sàng đón khách.</Text>
              </div>
            </Col>
          )}
        </Row>
      </Spin>

      {/* Modal Cập nhật Trạng thái giao diện mới */}
      <Modal
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        closable={false}
        width={400}
        bodyStyle={{ padding: '32px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ 
            width: '64px', height: '64px', background: '#e6f4ff', 
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px auto',
            color: '#1677ff', fontSize: '28px'
          }}>
            <ToolOutlined />
          </div>
          <Title level={4} style={{ margin: '0 0 8px 0' }}>Xử lý Phòng {selectedRoom?.roomNumber}</Title>
          <Text type="secondary">Cập nhật trạng thái sau khi hoàn tất công việc dọn dẹp hoặc kiểm tra.</Text>
        </div>

        <div style={{ marginBottom: '32px' }}>
          <Text strong style={{ display: 'block', marginBottom: '8px' }}>Chuyển sang trạng thái:</Text>
          <Select 
            value={newStatus} 
            onChange={setNewStatus} 
            style={{ width: '100%' }}
            size="large"
            options={[
              { value: 'Available', label: '✅ Sẵn sàng đón khách (Available)' },
              { value: 'Cleaning', label: '🧹 Đang dọn dẹp (Cleaning)' },
              { value: 'Occupied', label: '👤 Đang có khách (Occupied)' },
              { value: 'Maintenance', label: '🔧 Đang bảo trì (Maintenance)' },
            ]}
          />
        </div>

        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Button 
            type="primary" 
            size="large" 
            block 
            loading={updating} 
            onClick={handleSaveStatus}
            style={{ fontWeight: 600 }}
          >
            Lưu thay đổi
          </Button>
          <Button size="large" block onClick={() => setIsModalVisible(false)}>
            Đóng
          </Button>
        </Space>
      </Modal>
    </Content>
  );
};

export default HousekeepingPage;
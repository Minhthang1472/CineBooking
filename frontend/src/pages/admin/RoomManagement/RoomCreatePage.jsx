import React, { useState, useEffect } from 'react';
import { Form, Input, InputNumber, Select, Button, Card, message, Space } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { roomApi } from '../../../api/roomApi';

const { Option } = Select;

const RoomCreatePage = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  
  // State chứa danh sách hạng phòng
  const [roomTypes, setRoomTypes] = useState([]);

  // ==========================================
  // VỊ TRÍ 1 MỚI THÊM: HÀM TỰ ĐỘNG GỌI API
  // ==========================================
  useEffect(() => {
    const fetchRoomTypes = async () => {
      try {
        const response = await roomApi.getRoomTypes();
        const actualData = response.data?.data || response.data || [];
        setRoomTypes(actualData);
      } catch (error) {
        console.error("Lỗi lấy danh sách hạng phòng:", error);
        message.error("Không thể tải danh sách hạng phòng!");
      }
    };
    
    fetchRoomTypes(); // Chạy hàm ngay khi vừa vào trang
  }, []);
  // ==========================================

  // Xử lý khi ấn nút Lưu
  const onFinish = async (values) => {
    setLoading(true);
    try {
      // Gọi API gửi dữ liệu xuống C#
      await roomApi.createRoom(values);
      
      message.success('Đã thêm phòng mới thành công!');
      
      // Chờ nửa giây rồi đá user về lại trang danh sách
      setTimeout(() => {
        navigate('/admin/rooms');
      }, 500);
      
    } catch (error) {
      console.error(error);
      message.error('Thêm phòng thất bại. Vui lòng kiểm tra lại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      <Card 
        title={<h3>Thêm Phòng Mới</h3>} 
        extra={<Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/rooms')}>Quay lại</Button>}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          style={{ maxWidth: '600px', margin: '0 auto' }}
        >
          <Form.Item
            label="Số phòng"
            name="roomNumber"
            rules={[{ required: true, message: 'Vui lòng nhập số phòng!' }]}
          >
            <Input placeholder="VD: 101, VIP-01..." />
          </Form.Item>

          <Form.Item
            label="Tầng"
            name="floor"
            rules={[{ required: true, message: 'Vui lòng nhập số tầng!' }]}
          >
            <InputNumber min={1} max={50} style={{ width: '100%' }} placeholder="VD: 1" />
          </Form.Item>

          {/* ========================================== */}
          {/* VỊ TRÍ 2 MỚI THÊM: SELECT ĐỘNG BẰNG .MAP() */}
          {/* ========================================== */}
          <Form.Item
            label="Hạng phòng"
            name="roomTypeId" 
            rules={[{ required: true, message: 'Vui lòng chọn hạng phòng!' }]}
          >
            <Select placeholder="-- Chọn hạng phòng --">
              {roomTypes?.map((type) => (
                <Option key={type.id} value={type.id}>
                  {type.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          {/* ========================================== */}

          <Form.Item
            label="Trạng thái ban đầu"
            name="status"
            initialValue="Available"
          >
            <Select>
              <Option value="Available">Phòng trống (Available)</Option>
              <Option value="Maintenance">Đang bảo trì (Maintenance)</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
                Lưu Phòng
              </Button>
              <Button onClick={() => form.resetFields()}>
                Làm mới form
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default RoomCreatePage;
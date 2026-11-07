import React from 'react';
import { Modal, Descriptions, Tag, Button, Space, Row, Col } from 'antd';
import { CloseOutlined } from '@ant-design/icons';

const RoomDetailModal = ({ visible, room, onClose }) => {
  if (!room) return null;

  return (
    <Modal
      title={`Chi tiết phòng: ${room.roomNumber}`}
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" type="primary" onClick={onClose}>
          Đóng
        </Button>
      ]}
      width={800}
    >
      <Descriptions bordered column={2} size="small">
        <Descriptions.Item label="Số phòng" span={1}>
          {room.roomNumber}
        </Descriptions.Item>
        <Descriptions.Item label="Tầng" span={1}>
          {room.floor}
        </Descriptions.Item>

        <Descriptions.Item label="Hạng phòng" span={1}>
          {room.roomType?.name || 'Chưa gán'}
        </Descriptions.Item>
        <Descriptions.Item label="Giá phòng" span={1}>
          {room.roomType?.basePrice ? `${parseInt(room.roomType.basePrice).toLocaleString('vi-VN')} VNĐ` : 'Chưa có'}
        </Descriptions.Item>

        <Descriptions.Item label="Sức chứa người lớn" span={1}>
          {room.roomType?.capacityAdults || 0} người
        </Descriptions.Item>
        <Descriptions.Item label="Sức chứa trẻ em" span={1}>
          {room.roomType?.capacityChildren || 0} trẻ
        </Descriptions.Item>

        <Descriptions.Item label="Trạng thái" span={2}>
          {room.status === 'Available' && <Tag color="green">{room.status}</Tag>}
          {room.status === 'Occupied' && <Tag color="red">{room.status}</Tag>}
          {room.status === 'Cleaning' && <Tag color="orange">{room.status}</Tag>}
          {room.status === 'Maintenance' && <Tag color="default">{room.status}</Tag>}
        </Descriptions.Item>
      </Descriptions>

      <h3 style={{ marginTop: '20px' }}>Amenities:</h3>
      <p>Danh sách tiện nghi (nếu có)</p>
    </Modal>
  );
};

export default RoomDetailModal;
import React, { useState, useEffect } from 'react';
import { Layout, Typography, Table, Button, Space, Modal, message, Input, Card, Popconfirm, Upload, Divider } from 'antd';
import { PictureOutlined, DeleteOutlined, StarFilled, StarOutlined, PlusOutlined, UploadOutlined, CloudUploadOutlined } from '@ant-design/icons';
import { roomApi } from '../../../api/roomApi';
import { API_BASE } from '../../../api/axiosClient';
import { uploadToCloudinary } from '../../../utils/cloudinaryUpload';

const { Content } = Layout;
const { Title, Text } = Typography;

export default function RoomTypesPage() {
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [selectedRoomType, setSelectedRoomType] = useState(null);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [imageLoading, setImageLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  const fetchRoomTypes = async () => {
    setLoading(true);
    try {
      const res = await roomApi.getRoomTypes();
      let types = [];
      if (res.data?.data) types = res.data.data;
      else if (Array.isArray(res.data)) types = res.data;
      setRoomTypes(types);
    } catch (error) {
      console.error(error);
      message.error('Loi khi tai du lieu hang phong!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRoomTypes(); }, []);

  const openImageModal = (record) => {
    setSelectedRoomType(record);
    setIsImageModalVisible(true);
    setNewImageUrl('');
  };

  // Refresh du lieu sau khi them/xoa anh
  const refreshData = async () => {
    const res = await roomApi.getRoomTypes();
    const types = res.data?.data || res.data || [];
    setRoomTypes(types);
    const updated = types.find(t => t.id === selectedRoomType?.id);
    if (updated) setSelectedRoomType(updated);
  };

  // Upload file len Cloudinary roi them URL vao DB
  const handleUploadFile = async (file) => {
    setUploadingFile(true);
    try {
      message.loading({ content: 'Dang upload len Cloudinary...', key: 'room_upload' });
      const cloudUrl = await uploadToCloudinary(file, 'hotel/rooms');
      await roomApi.addRoomTypeImageUrl(selectedRoomType.id, cloudUrl);
      message.success({ content: 'Upload va them anh thanh cong!', key: 'room_upload' });
      await refreshData();
    } catch (err) {
      console.error(err);
      message.error({ content: 'Loi upload: ' + (err.message || 'Thu lai'), key: 'room_upload' });
    } finally {
      setUploadingFile(false);
    }
    return false; // Ngan Upload component tu upload
  };

  // Them URL thu cong (dan link)
  const handleAddImageUrl = async () => {
    if (!newImageUrl.trim()) {
      message.warning('Vui long nhap link anh!');
      return;
    }
    setImageLoading(true);
    try {
      await roomApi.addRoomTypeImageUrl(selectedRoomType.id, newImageUrl.trim());
      message.success('Them anh thanh cong!');
      setNewImageUrl('');
      await refreshData();
    } catch (error) {
      console.error(error);
      message.error(error.response?.data?.Message || 'Loi khi them anh!');
    } finally {
      setImageLoading(false);
    }
  };

  const handleDeleteImage = async (imageId) => {
    try {
      await roomApi.deleteRoomTypeImage(imageId);
      message.success('Da xoa anh!');
      await refreshData();
    } catch (error) {
      console.error(error);
      message.error('Loi khi xoa anh!');
    }
  };

  const handleSetPrimary = async (imageId) => {
    try {
      await roomApi.setPrimaryImage(selectedRoomType.id, imageId);
      message.success('Da dat lam anh dai dien!');
      await refreshData();
    } catch (error) {
      console.error(error);
      message.error('Loi khi cap nhat anh dai dien!');
    }
  };

  const getFullImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${API_BASE}${url}`;
  };

  const columns = [
    {
      title: 'Anh Dai Dien', key: 'thumbnail', width: 90,
      render: (_, r) => {
        const primary = r.roomImages?.find(i => i.isPrimary) || r.roomImages?.[0];
        return primary
          ? <img src={getFullImageUrl(primary.imageUrl)} alt="thumb"
              style={{ width: 70, height: 50, objectFit: 'cover', borderRadius: 6, boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }} />
          : <div style={{ width: 70, height: 50, background: '#f5f5f5', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #d9d9d9' }}>
              <PictureOutlined style={{ color: '#bbb', fontSize: 18 }} />
            </div>;
      }
    },
    { title: 'Ten Hang Phong', dataIndex: 'name', key: 'name', render: text => <strong>{text}</strong> },
    { title: 'Suc chua', key: 'capacity', render: (_, r) => `${r.capacityAdults} nguoi lon, ${r.capacityChildren} tre em` },
    { title: 'Gia co ban', dataIndex: 'basePrice', key: 'basePrice', render: val => `${parseInt(val).toLocaleString('vi-VN')} VND` },
    {
      title: 'So luong anh', key: 'imageCount',
      render: (_, r) => {
        const count = r.roomImages?.length || 0;
        return <span style={{ color: count > 0 ? '#52c41a' : '#999', fontWeight: 600 }}>{count} anh</span>;
      }
    },
    {
      title: 'Thao tac', key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="primary" icon={<PictureOutlined />} onClick={() => openImageModal(record)}>
            Quan ly Hinh Anh
          </Button>
          <Upload
            showUploadList={false}
            beforeUpload={async (file) => {
              // Quick upload thang tu danh sach ma khong mo modal
              setSelectedRoomType(record);
              setUploadingFile(true);
              try {
                message.loading({ content: 'Dang upload...', key: 'quick_upload' });
                const url = await uploadToCloudinary(file, 'hotel/rooms');
                await roomApi.addRoomTypeImageUrl(record.id, url);
                message.success({ content: 'Upload anh thanh cong!', key: 'quick_upload' });
                await fetchRoomTypes();
              } catch (err) {
                message.error({ content: 'Loi: ' + err.message, key: 'quick_upload' });
              } finally {
                setUploadingFile(false);
              }
              return false;
            }}
            accept="image/*"
          >
            <Button icon={<UploadOutlined />} loading={uploadingFile}>Upload nhanh</Button>
          </Upload>
        </Space>
      )
    }
  ];

  return (
    <Layout>
      <Content style={{ padding: '24px', background: '#f7f9fa', minHeight: '100vh' }}>
        {/* Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
          borderRadius: '16px', padding: '32px 40px', marginBottom: '28px',
          color: 'white', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
        }}>
          <div>
            <Title level={2} style={{ color: 'white', margin: '0 0 8px 0', fontWeight: 700 }}>
              Quan ly Hang Phong & Hinh Anh
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '15px' }}>
              Upload anh truc tiep tu may tinh len Cloudinary — hien thi ngay tren website.
            </Text>
          </div>
          <div style={{ textAlign: 'right', color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
            <CloudUploadOutlined style={{ fontSize: 40, opacity: 0.5 }} />
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
          <Table
            loading={loading}
            columns={columns}
            dataSource={roomTypes}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </div>

        {/* Modal Quan ly Anh */}
        <Modal
          title={
            <Space>
              <PictureOutlined />
              Hinh anh hang phong: <strong>{selectedRoomType?.name}</strong>
            </Space>
          }
          open={isImageModalVisible}
          onCancel={() => setIsImageModalVisible(false)}
          footer={null}
          width={860}
        >
          {/* === Khu vuc Upload === */}
          <div style={{ background: '#f8fafc', borderRadius: 12, padding: '20px 24px', marginBottom: 24, border: '1px solid #e2e8f0' }}>
            <Text strong style={{ display: 'block', marginBottom: 14, fontSize: 14 }}>
              Them anh moi
            </Text>

            {/* Option 1: Upload file tu may */}
            <div style={{ marginBottom: 14 }}>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>
                Cach 1: Chon file anh tu may tinh
              </Text>
              <Upload
                showUploadList={false}
                beforeUpload={handleUploadFile}
                accept="image/*"
                multiple={false}
              >
                <Button
                  type="primary"
                  icon={<UploadOutlined />}
                  loading={uploadingFile}
                  size="large"
                  style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', border: 'none', borderRadius: 8, height: 44 }}
                >
                  {uploadingFile ? 'Dang upload len Cloudinary...' : 'Chon anh tu may tinh'}
                </Button>
              </Upload>
            </div>

            <Divider plain style={{ margin: '12px 0' }}>hoac</Divider>

            {/* Option 2: Dan URL thu cong */}
            <div>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>
                Cach 2: Dan link anh tu Cloudinary hoac URL bat ky
              </Text>
              <Space.Compact style={{ width: '100%' }}>
                <Input
                  placeholder="https://res.cloudinary.com/doe2ifald/image/upload/..."
                  value={newImageUrl}
                  onChange={e => setNewImageUrl(e.target.value)}
                  onPressEnter={handleAddImageUrl}
                  size="large"
                />
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleAddImageUrl}
                  loading={imageLoading}
                  size="large"
                >
                  Them
                </Button>
              </Space.Compact>
            </div>
          </div>

          {/* === Luoi anh hien co === */}
          <Text strong style={{ display: 'block', marginBottom: 12 }}>
            Danh sach anh ({selectedRoomType?.roomImages?.length || 0} anh)
            {selectedRoomType?.roomImages?.length > 0 && (
              <Text type="secondary" style={{ fontSize: 12, fontWeight: 400, marginLeft: 8 }}>
                Click ngoi sao de dat lam anh dai dien
              </Text>
            )}
          </Text>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            {selectedRoomType?.roomImages?.map(img => (
              <Card
                key={img.id}
                hoverable
                style={{
                  borderRadius: 10, overflow: 'hidden',
                  border: img.isPrimary ? '2px solid #faad14' : '1px solid #e2e8f0',
                  boxShadow: img.isPrimary ? '0 4px 16px rgba(250,173,20,0.2)' : '0 2px 8px rgba(0,0,0,0.06)',
                }}
                cover={
                  <div style={{ position: 'relative' }}>
                    <img
                      alt="room"
                      src={getFullImageUrl(img.imageUrl)}
                      style={{ height: 140, width: '100%', objectFit: 'cover' }}
                    />
                    {img.isPrimary && (
                      <div style={{
                        position: 'absolute', top: 8, left: 8,
                        background: '#faad14', color: '#fff',
                        borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700,
                      }}>
                        Anh chinh
                      </div>
                    )}
                  </div>
                }
                bodyStyle={{ padding: '10px 12px' }}
                actions={[
                  <Button
                    key="star"
                    type="text"
                    icon={img.isPrimary ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
                    onClick={() => handleSetPrimary(img.id)}
                    title="Dat lam anh dai dien"
                  />,
                  <Popconfirm key="del" title="Xoa anh nay?" onConfirm={() => handleDeleteImage(img.id)}>
                    <Button type="text" danger icon={<DeleteOutlined />} title="Xoa anh" />
                  </Popconfirm>
                ]}
              >
                <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 11, color: '#999' }} title={img.imageUrl}>
                  {img.imageUrl?.split('/').pop()}
                </div>
              </Card>
            ))}

            {(!selectedRoomType?.roomImages || selectedRoomType.roomImages.length === 0) && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 0', color: '#bbb' }}>
                <PictureOutlined style={{ fontSize: 40, marginBottom: 8, display: 'block' }} />
                Chua co hinh anh nao. Hay upload anh moi!
              </div>
            )}
          </div>
        </Modal>
      </Content>
    </Layout>
  );
}

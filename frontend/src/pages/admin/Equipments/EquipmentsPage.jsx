import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Space, Switch, Modal, Form, Select, InputNumber, message, Image, Row, Col, Typography } from 'antd';
import { PlusOutlined, EditOutlined, SearchOutlined } from '@ant-design/icons';
import { equipmentApi } from '../../../api/equipmentApi'; 

const { Option } = Select;

const EquipmentsPage = () => {
  // 1. Hook message chuẩn Ant Design mới
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm();

  // 2. Các State quản lý dữ liệu
  const [equipments, setEquipments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Tất cả');

  // 3. State cho Modal Thêm/Sửa
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // 4. Hàm gọi API lấy dữ liệu (Đã fix lỗi 400 Bad Request)
  const fetchEquipments = async (currentPage = 1, currentSize = 10, search = '', category = 'Tất cả') => {
    setLoading(true);
    try {
      // TẠO PARAMS SẠCH
      const params = {
        page: Number(currentPage) || 1,
        pageSize: Number(currentSize) || 10
      };
      
      if (search && search.trim() !== '') {
        params.search = search.trim();
      }

      // Chỉ gửi category lên nếu khác "Tất cả"
      if (category && category !== 'Tất cả') {
        params.category = category;
      }

      const response = await equipmentApi.getEquipments(params);
      const resData = response.data || response; 
      
      setEquipments(resData.data);
      setTotal(resData.totalCount);
    } catch (error) {
      messageApi.error('Không thể tải danh sách vật tư!');
      console.error("Chi tiết lỗi API:", error.response?.data || error);
    } finally {
      setLoading(false);
    }
  };

  // Tải dữ liệu lần đầu
  useEffect(() => {
    fetchEquipments(page, pageSize, searchText, categoryFilter);
  }, []);

  // 5. Xử lý sự kiện bảng & lọc
  const handleTableChange = (pagination) => {
    setPage(pagination.current);
    setPageSize(pagination.pageSize);
    fetchEquipments(pagination.current, pagination.pageSize, searchText, categoryFilter);
  };

  const handleSearch = (value) => {
    setSearchText(value);
    setPage(1); 
    fetchEquipments(1, pageSize, value, categoryFilter);
  };

  const handleCategoryChange = (value) => {
    setCategoryFilter(value);
    setPage(1);
    fetchEquipments(1, pageSize, searchText, value);
  };

  // 6. Xử lý Modal
  const openAddModal = () => {
    setEditingId(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const openEditModal = (record) => {
    setEditingId(record.id);
    form.setFieldsValue({
      itemCode: record.itemCode,
      name: record.name,
      category: record.category,
      unit: record.unit,
      totalQuantity: record.totalQuantity,
      basePrice: record.basePrice,
      defaultPriceIfLost: record.defaultPriceIfLost,
      supplier: record.supplier,
      imageUrl: record.imageUrl
    });
    setIsModalVisible(true);
  };

  const handleModalSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingId) {
        await equipmentApi.updateEquipment(editingId, values);
        messageApi.success('Cập nhật vật tư thành công!');
      } else {
        await equipmentApi.createEquipment(values);
        messageApi.success('Thêm vật tư mới thành công!');
      }
      
      setIsModalVisible(false);
      fetchEquipments(page, pageSize, searchText, categoryFilter); 
    } catch (error) {
      const errorMsg = error.response?.data?.Message || 'Có lỗi xảy ra vui lòng thử lại!';
      messageApi.error(errorMsg);
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await equipmentApi.toggleStatus(id);
      messageApi.success('Cập nhật trạng thái thành công!');
      setEquipments(prev => prev.map(item => 
        item.id === id ? { ...item, isActive: !item.isActive } : item
      ));
    } catch (error) {
      messageApi.error('Lỗi khi cập nhật trạng thái');
    }
  };

  // 7. Cấu hình Column Table
  const columns = [
    { title: 'Mã VT', dataIndex: 'itemCode', key: 'itemCode', width: 100 },
    { 
      title: 'Hình ảnh', 
      dataIndex: 'imageUrl', 
      key: 'imageUrl',
      render: (img) => img ? (
        <Image width={50} height={50} src={img} style={{objectFit: 'cover', borderRadius: '4px'}} />
      ) : (
        <div style={{width: 50, height: 50, background: '#f0f0f0', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10}}>No Img</div>
      )
    },
    { title: 'Tên vật tư', dataIndex: 'name', key: 'name' },
    { title: 'Danh mục', dataIndex: 'category', key: 'category' },
    { title: 'Đơn vị', dataIndex: 'unit', key: 'unit' },
    { title: 'Tồn kho', dataIndex: 'inStockQuantity', key: 'inStockQuantity', align: 'center' },
    { 
      title: 'Giá tiền', 
      dataIndex: 'basePrice', 
      key: 'basePrice',
      render: (price) => `${price?.toLocaleString('vi-VN')} đ`
    },
    {
      title: 'Trạng thái',
      key: 'isActive',
      align: 'center',
      render: (_, record) => (
        <Switch 
          checked={record.isActive} 
          onChange={() => handleToggleStatus(record.id)} 
        />
      )
    },
    {
      title: 'Thao tác',
      key: 'actions',
      align: 'center',
      render: (_, record) => (
        <Button type="primary" ghost icon={<EditOutlined />} onClick={() => openEditModal(record)}>
          Sửa
        </Button>
      )
    }
  ];

  return (
    <div style={{ padding: 24, background: '#f7f9fa', borderRadius: 8 }}>
      {contextHolder}
      
      {/* Premium Banner Header */}
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
          <Typography.Title level={2} style={{ color: 'white', margin: '0 0 8px 0', fontWeight: 700 }}>
            Quản lý Kho Vật Tư
          </Typography.Title>
          <Typography.Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '15px' }}>
            Giám sát số lượng, điều chỉnh thông tin và quản lý danh mục vật tư trong khách sạn.
          </Typography.Text>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={openAddModal}
          size="large"
          style={{ background: 'white', color: '#1677ff', border: 'none', borderRadius: '10px', fontWeight: 600 }}
        >
          Thêm vật tư
        </Button>
      </div>

      <Row justify="space-between" style={{ marginBottom: 20 }} gutter={[16, 16]}>
        <Col xs={24} md={18}>
          <Space wrap>
            <Input.Search 
              placeholder="Tìm kiếm mã, tên vật tư..." 
              allowClear 
              onSearch={handleSearch} 
              style={{ width: 250 }} 
            />
            <Select defaultValue="Tất cả" style={{ width: 160 }} onChange={handleCategoryChange}>
              <Option value="Tất cả">Tất cả danh mục</Option>
              <Option value="Điện tử">Điện tử</Option>
              <Option value="Nội thất">Nội thất</Option>
              <Option value="Đồ vải">Đồ vải</Option>
              <Option value="Minibar">Minibar</Option>
            </Select>
          </Space>
        </Col>
      </Row>

      <div style={{ background: '#fff', borderRadius: '16px', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', overflow: 'hidden' }}>

      <Table 
        columns={columns} 
        dataSource={equipments} 
        rowKey="id" 
        loading={loading}
        pagination={{
          current: page,
          pageSize: pageSize,
          total: total,
          showSizeChanger: true,
          showTotal: (totalCount) => `Tổng cộng ${totalCount} vật tư`
        }}
        onChange={handleTableChange}
      />
      </div>

      <Modal
        title={editingId ? "Cập nhật vật tư" : "Thêm vật tư mới"}
        open={isModalVisible}
        onOk={handleModalSubmit}
        onCancel={() => setIsModalVisible(false)}
        width={800}
        okText="Lưu dữ liệu"
        cancelText="Hủy"
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="itemCode" label="Mã vật tư" rules={[{ required: true, message: 'Bắt buộc!' }]}>
                <Input disabled={!!editingId} />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item name="name" label="Tên vật tư" rules={[{ required: true, message: 'Bắt buộc!' }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="category" label="Danh mục" rules={[{ required: true }]}>
                <Select>
                  <Option value="Điện tử">Điện tử</Option>
                  <Option value="Nội thất">Nội thất</Option>
                  <Option value="Đồ vải">Đồ vải</Option>
                  <Option value="Minibar">Minibar</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="unit" label="Đơn vị tính" rules={[{ required: true }]}>
                <Input placeholder="Cái, Chiếc, Bộ..." />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="totalQuantity" label="Tổng số lượng" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="basePrice" label="Giá nhập (VNĐ)" rules={[{ required: true }]}>
                 <InputNumber 
                    min={0} 
                    style={{ width: '100%' }} 
                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} 
                    parser={value => value.replace(/\$\s?|(,*)/g, '')}
                 />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="defaultPriceIfLost" label="Giá đền bù (VNĐ)" rules={[{ required: true }]}>
                 <InputNumber 
                    min={0} 
                    style={{ width: '100%' }} 
                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value.replace(/\$\s?|(,*)/g, '')}
                 />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="supplier" label="Nhà cung cấp">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="imageUrl" label="Link hình ảnh (Cloudinary URL)">
                <Input placeholder="https://res.cloudinary.com/..." />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default EquipmentsPage;
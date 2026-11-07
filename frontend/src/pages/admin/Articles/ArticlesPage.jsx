import React, { useState, useEffect, useRef } from 'react';
import { Table, Card, Typography, Button, Space, Modal, Form, Input, message, Tag, Switch, Avatar, Tooltip, Upload } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, ReadOutlined, EyeOutlined, CheckCircleOutlined, ClockCircleOutlined, UploadOutlined, PictureOutlined } from '@ant-design/icons';
import { articleApi } from '../../../api/marketingApi';
import { useNotification } from '../../../context/notificationContext';
import { uploadToCloudinary } from '../../../utils/cloudinaryUpload';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5262';

const CustomQuillEditor = ({ value, onChange }) => {
  const containerRef = useRef(null);
  const quillRef = useRef(null);
  
  useEffect(() => {
    if (!containerRef.current || quillRef.current) return;
    
    // Khởi tạo quill bằng Vanilla JS để tránh lỗi React 19 findDOMNode
    quillRef.current = new Quill(containerRef.current, {
      theme: 'snow',
      placeholder: 'Hỗ trợ chèn ảnh, in đậm, đổi màu chữ...',
      modules: {
        toolbar: [
          [{ 'header': [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
          ['link', 'image'],
          ['clean']
        ]
      }
    });

    quillRef.current.on('text-change', () => {
      const html = quillRef.current.root.innerHTML;
      if (html === '<p><br></p>') onChange?.('');
      else onChange?.(html);
    });

    if (value) {
      quillRef.current.clipboard.dangerouslyPasteHTML(value);
    }
  }, []);

  useEffect(() => {
    if (quillRef.current && value) {
      const html = quillRef.current.root.innerHTML;
      if (value !== html && value !== '<p><br></p>') {
        const delta = quillRef.current.clipboard.convert({ html: value });
        quillRef.current.setContents(delta, 'silent');
      }
    }
  }, [value]);

  return <div ref={containerRef} style={{ height: '300px', marginBottom: '50px' }} />;
};

const { Title, Text } = Typography;

const ArticlesPage = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [uploadingId, setUploadingId] = useState(null);
  const [form] = Form.useForm();
  const { addNotification } = useNotification();
  const fileInputRef = useRef(null);
  const [uploadTargetId, setUploadTargetId] = useState(null);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const res = await articleApi.getAllArticles();
      setArticles(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Lỗi tải bài viết:', error);
      message.error('Không thể tải danh sách bài viết!');
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const handleTogglePublish = async (record) => {
    const updated = { ...record, isPublished: !record.isPublished };
    setArticles(prev => prev.map(a => a.id === record.id ? updated : a));
    try {
      await articleApi.updateArticle(record.id, updated);
      message.success(updated.isPublished ? 'Da xuat ban bai viet!' : 'Da chuyen ve ban nhap!');
    } catch {
      setArticles(prev => prev.map(a => a.id === record.id ? record : a));
      message.error('Khong the cap nhat trang thai!');
    }
  };

  const handleUploadThumbnail = async (articleId, file) => {
    setUploadingId(articleId);
    try {
      message.loading({ content: 'Dang upload len Cloudinary...', key: 'upload' });
      // 1. Upload len Cloudinary
      const cloudinaryUrl = await uploadToCloudinary(file, 'hotel/articles');
      // 2. Luu URL vao DB qua backend
      await articleApi.updateThumbnailUrl(articleId, cloudinaryUrl);
      message.success({ content: 'Upload anh bia thanh cong!', key: 'upload' });
      // Cap nhat UI
      setArticles(prev => prev.map(a =>
        a.id === articleId ? { ...a, thumbnailUrl: cloudinaryUrl } : a
      ));
    } catch (err) {
      console.error('Upload error:', err);
      message.error({ content: 'Loi upload: ' + (err.message || 'Thu lai sau'), key: 'upload' });
    } finally {
      setUploadingId(null);
    }
  };

  const columns = [
    {
      title: 'Anh Bia', key: 'thumbnail', width: 100,
      render: (_, r) => {
        const src = r.thumbnailUrl || null;
        return (
          <div style={{ textAlign: 'center' }}>
            {src
              ? <img src={src} alt="thumb" style={{ width: 70, height: 50, objectFit: 'cover', borderRadius: 6, display: 'block', margin: '0 auto 4px', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }} />
              : <div style={{ width: 70, height: 50, background: '#f5f5f5', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 4px', border: '1px dashed #d9d9d9' }}><PictureOutlined style={{ color: '#bbb', fontSize: 18 }} /></div>
            }
            <Upload
              showUploadList={false}
              beforeUpload={(file) => { handleUploadThumbnail(r.id, file); return false; }}
              accept="image/*"
            >
              <Button
                size="small"
                icon={<UploadOutlined />}
                loading={uploadingId === r.id}
                style={{ fontSize: 10, padding: '1px 6px', marginTop: 2 }}
              >
                {src ? 'Doi anh' : 'Upload'}
              </Button>
            </Upload>
          </div>
        );
      }
    },

    {
      title: 'Tac Gia', key: 'author',
      render: (_, r) => (
        <Space>
          <Avatar src={`https://api.dicebear.com/7.x/notionists/svg?seed=${r.author?.name || 'admin'}`} size={36} />
          <Text style={{ fontSize: 12, color: '#666' }}>{r.author?.name || 'Admin'}</Text>
        </Space>
      ),
      width: 120,
    },
    {
      title: 'Tieu De & Tom Tat', key: 'content',
      render: (_, r) => (
        <div>
          <Text strong style={{ fontSize: 14 }}>{r.title}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>{r.summary || '(Chua co tom tat)'}</Text>
        </div>
      )
    },
    {
      title: 'Ngay Viet', dataIndex: 'publishedAt', key: 'publishedAt',
      render: v => v ? new Date(v).toLocaleDateString('vi-VN') : '—',
      width: 110,
    },
    {
      title: 'Xuat Ban', key: 'isPublished',
      render: (_, record) => (
        <Tooltip title={record.isPublished ? 'Click de an' : 'Click de xuat ban'}>
          <Switch
            checked={record.isPublished}
            checkedChildren={<CheckCircleOutlined />}
            unCheckedChildren={<ClockCircleOutlined />}
            onChange={() => handleTogglePublish(record)}
          />
        </Tooltip>
      ),
      width: 100,
    },
    {
      title: 'Thao Tac', key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
        </Space>
      ),
      width: 80,
    },
  ];

  const handleEdit = (record) => {
    setEditingArticle(record);
    form.setFieldsValue({ ...record });
    setIsModalVisible(true);
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Xóa bài viết này?',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await articleApi.deleteArticle(id);
          message.success('Đã xóa bài viết!');
          fetchArticles();
        } catch (error) {
          message.error('Lỗi khi xóa!');
        }
      }
    });
  };

  const handleSubmit = async (values) => {
    try {
      if (editingArticle) {
        await articleApi.updateArticle(editingArticle.id, { ...editingArticle, ...values });
        message.success('Cập nhật thành công!');
        addNotification('Cập nhật Bài Viết', `Đã cập nhật bài: "${values.title}"`, 'info');
      } else {
        await articleApi.createArticle({ ...values, isPublished: false });
        message.success('Tạo bản nháp thành công!');
        addNotification('Bài Viết Mới', `Đã tạo bản nháp: "${values.title}"`, 'success');
      }
      setIsModalVisible(false);
      fetchArticles();
    } catch (err) {
      console.error('Lỗi lưu bài viết:', err);
      message.error('Lỗi khi lưu bài viết. Vui lòng thử lại!');
    }
  };

  return (
    <div>
      {/* Premium Banner Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #001529 0%, #722ed1 100%)',
          borderRadius: '16px',
          padding: '32px 40px',
          marginBottom: '28px',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: '0 10px 30px rgba(114,46,209,0.15)',
        }}
      >
        <div>
          <Title level={2} style={{ color: 'white', margin: '0 0 8px 0', fontWeight: 700 }}>
            <ReadOutlined style={{ marginRight: 10 }} />Hệ Thống Báo Chí & Tin Tức (CMS)
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>
            Soạn thảo, quản lý và xuất bản các bài viết truyền thông bằng Rich Text Editor. Toggle xuất bản ngay trên bảng.
          </Text>
          <Space style={{ marginTop: 12 }}>
            <Tag style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: 'none', borderRadius: 6 }}>✅ {articles.filter(a => a.isPublished).length} Xuất bản</Tag>
            <Tag style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: 'none', borderRadius: 6 }}>📝 {articles.filter(a => !a.isPublished).length} Bản nháp</Tag>
          </Space>
        </div>
        <Space style={{ flexWrap: 'wrap' }}>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={fetchArticles}
            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', backdropFilter: 'blur(8px)', borderRadius: '10px' }}
          >
            Làm mới
          </Button>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => { setEditingArticle(null); form.resetFields(); setIsModalVisible(true); }}
            style={{ background: 'white', color: '#722ed1', border: 'none', borderRadius: '10px', fontWeight: 600 }}
          >
            Viết Bài Mới
          </Button>
        </Space>
      </div>

      <Card style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <Table columns={columns} dataSource={articles} rowKey="id" loading={loading} pagination={{ pageSize: 8 }} />
      </Card>

      <Modal
        title={editingArticle ? "Cập nhật Bài Viết" : "Tạo mới Bài Viết"}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        width={800}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="title" label="Tiêu đề bài viết" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="summary" label="Tóm tắt ngắn">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="content" label="Nội dung chính">
            <CustomQuillEditor />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ArticlesPage;

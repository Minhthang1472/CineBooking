import React, { useState, useEffect, useCallback } from 'react';
import {
  Typography, Button, Space, message, Tag, Row, Col,
  Card, Badge, Empty, Tabs, Select, Modal, Spin
} from 'antd';
import {
  BellOutlined, CheckOutlined, DeleteOutlined, ReloadOutlined,
  CheckCircleOutlined, InfoCircleOutlined, WarningOutlined,
  CloseCircleOutlined, ClearOutlined, LoadingOutlined
} from '@ant-design/icons';
import { notificationApi } from '../../../api/notificationApi';
import { useAuthStore } from '../../../store/authStore';
import { useNotification } from '../../../context/notificationContext';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Title, Text } = Typography;
const { Option } = Select;

const TYPE_CONFIG = {
  success: { color: '#52c41a', bg: '#f6ffed', border: '#b7eb8f', icon: <CheckCircleOutlined />, label: 'Thành công' },
  info:    { color: '#1677ff', bg: '#e6f4ff', border: '#91caff', icon: <InfoCircleOutlined />,  label: 'Thông tin' },
  warning: { color: '#fa8c16', bg: '#fff7e6', border: '#ffd591', icon: <WarningOutlined />,     label: 'Cảnh báo' },
  error:   { color: '#ff4d4f', bg: '#fff2f0', border: '#ffa39e', icon: <CloseCircleOutlined />, label: 'Lỗi' },
  default: { color: '#8c8c8c', bg: '#fafafa', border: '#d9d9d9', icon: <BellOutlined />,       label: 'Thông báo' },
};

const NotificationsPage = () => {
  const { user } = useAuthStore();
  const { clearAllNotifications: clearContextNotifs, removeNotification: removeContextNotif } = useNotification();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deletingAll, setDeletingAll] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // ── Fetch từ API mỗi lần cần ───────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationApi.getAll();
      const list = res.data?.data || res.data || [];
      setData(Array.isArray(list) ? list : []);
    } catch {
      message.error('Không thể tải thông báo từ server!');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  // ── Đánh dấu đã đọc (1 cái) ────────────────────────────────────
  const handleMarkRead = async (id) => {
    try {
      await notificationApi.markAsRead(id);
      setData(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      message.success('Đã đánh dấu đã đọc!');
    } catch {
      message.error('Lỗi cập nhật!');
    }
  };

  // ── Đánh dấu tất cả đã đọc ─────────────────────────────────────
  const handleMarkAllRead = async () => {
    try {
      if (user?.id) {
        await notificationApi.markAllAsRead(user.id);
      }
      setData(prev => prev.map(n => ({ ...n, isRead: true })));
      message.success('Đã đánh dấu tất cả là đã đọc!');
    } catch {
      // fallback: cập nhật local
      setData(prev => prev.map(n => ({ ...n, isRead: true })));
      message.success('Đã đánh dấu!');
    }
  };

  // ── Xóa 1 thông báo (gọi API xóa thật) ───────────────────────
  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await notificationApi.delete(id);
      setData(prev => prev.filter(n => n.id !== id));
      removeContextNotif?.(id);
      message.success('Đã xóa thông báo!');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Lỗi khi xóa!';
      message.error(msg);
    } finally {
      setDeletingId(null);
    }
  };

  // ── Xóa TẤT CẢ (gọi API delete-all) ──────────────────────────
  const handleDeleteAll = () => {
    Modal.confirm({
      title: '🗑️ Xóa tất cả thông báo',
      content: (
        <div>
          <p>Bạn có chắc muốn xóa <strong>toàn bộ {data.length} thông báo</strong> khỏi hệ thống?</p>
          <p style={{ color: '#ff4d4f', fontSize: 13 }}>⚠️ Hành động này sẽ xóa vĩnh viễn khỏi cơ sở dữ liệu và không thể hoàn tác!</p>
        </div>
      ),
      okText: 'Xóa tất cả', okType: 'danger', cancelText: 'Hủy',
      onOk: async () => {
        setDeletingAll(true);
        try {
          await notificationApi.deleteAll();
          setData([]);
          clearContextNotifs();
          message.success('✅ Đã xóa toàn bộ thông báo khỏi hệ thống!');
        } catch (err) {
          const msg = err?.response?.data?.message || 'Lỗi khi xóa tất cả!';
          message.error(msg);
        } finally {
          setDeletingAll(false);
        }
      }
    });
  };

  const unreadCount = data.filter(n => !n.isRead).length;

  const filtered = data.filter(n => {
    if (activeTab === 'unread' && n.isRead) return false;
    if (activeTab === 'read' && !n.isRead) return false;
    if (typeFilter !== 'all' && n.type !== typeFilter) return false;
    return true;
  });

  const NotificationCard = ({ item }) => {
    const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.default;
    const isDeleting = deletingId === item.id;
    return (
      <div style={{
        display: 'flex', gap: 14, padding: '16px 20px',
        borderBottom: '1px solid #f5f5f5',
        background: item.isRead ? '#fff' : '#fffbe6',
        transition: 'background 0.3s',
        borderLeft: `4px solid ${cfg.color}`,
        opacity: isDeleting ? 0.5 : 1,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: cfg.bg, border: `1px solid ${cfg.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, color: cfg.color, flexShrink: 0
        }}>
          {cfg.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
            <Text strong style={{ fontSize: 14 }}>{item.title}</Text>
            <Text type="secondary" style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
              {dayjs(item.createdAt).fromNow()}
            </Text>
          </div>
          <Text style={{ fontSize: 13, color: '#555', display: 'block', marginTop: 3 }}>
            {item.content}
          </Text>
          <Space style={{ marginTop: 8 }}>
            <Tag color={item.type || 'default'} style={{ fontSize: 11 }}>{cfg.label}</Tag>
            {!item.isRead && <Tag color="gold" style={{ fontSize: 11 }}>● Mới</Tag>}
          </Space>
        </div>
        <Space direction="vertical" size={4} style={{ flexShrink: 0 }}>
          {!item.isRead && (
            <Button size="small" type="text" icon={<CheckOutlined />}
              style={{ color: '#52c41a' }}
              onClick={() => handleMarkRead(item.id)}
              title="Đánh dấu đã đọc"
            />
          )}
          <Button
            size="small" type="text" danger
            icon={isDeleting ? <LoadingOutlined /> : <DeleteOutlined />}
            onClick={() => !isDeleting && handleDelete(item.id)}
            disabled={isDeleting}
          />
        </Space>
      </div>
    );
  };

  return (
    <div>
      {/* Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #001529 0%, #fa8c16 100%)',
        borderRadius: 16, padding: '28px 36px', marginBottom: 24, color: 'white',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 16, boxShadow: '0 10px 30px rgba(250,140,22,0.2)'
      }}>
        <div>
          <Title level={2} style={{ color: 'white', margin: '0 0 6px 0', fontWeight: 700 }}>
            <BellOutlined style={{ marginRight: 10 }} />Trung Tâm Thông Báo
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
            Dữ liệu thông báo được lưu trực tiếp tại SQL Server – xóa là xóa vĩnh viễn.
          </Text>
        </div>
        <Row gutter={12}>
          {[
            { label: 'Tổng', value: data.length },
            { label: 'Chưa đọc', value: unreadCount, warn: unreadCount > 0 }
          ].map(s => (
            <Col key={s.label}>
              <div style={{
                background: s.warn ? 'rgba(255,77,79,0.3)' : 'rgba(255,255,255,0.15)',
                padding: '10px 18px', borderRadius: 12, textAlign: 'center',
                border: '1px solid rgba(255,255,255,0.2)',
                backdropFilter: 'blur(8px)', minWidth: 80
              }}>
                <div style={{ fontSize: 22, fontWeight: 800 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>{s.label}</div>
              </div>
            </Col>
          ))}
        </Row>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <Space wrap>
          <Tabs
            activeKey={activeTab} onChange={setActiveTab} size="small" style={{ marginBottom: 0 }}
            items={[
              { key: 'all', label: `Tất cả (${data.length})` },
              { key: 'unread', label: <Badge count={unreadCount} size="small">Chưa đọc&nbsp;&nbsp;</Badge> },
              { key: 'read', label: 'Đã đọc' }
            ]}
          />
          <Select value={typeFilter} onChange={setTypeFilter} style={{ width: 140 }} size="small">
            <Option value="all">Tất cả loại</Option>
            {Object.entries(TYPE_CONFIG)
              .filter(([k]) => k !== 'default')
              .map(([k, v]) => <Option key={k} value={k}>{v.label}</Option>)}
          </Select>
        </Space>
        <Space>
          {unreadCount > 0 && (
            <Button size="small" icon={<CheckOutlined />} onClick={handleMarkAllRead}>
              Đọc tất cả
            </Button>
          )}
          <Button
            size="small" icon={<ReloadOutlined />}
            onClick={fetchNotifications} loading={loading}
          >
            Làm mới
          </Button>
          {data.length > 0 && (
            <Button
              size="small" danger icon={<ClearOutlined />}
              onClick={handleDeleteAll} loading={deletingAll}
            >
              Xóa tất cả ({data.length})
            </Button>
          )}
        </Space>
      </div>

      {/* List */}
      <Spin spinning={loading || deletingAll} tip={deletingAll ? 'Đang xóa...' : 'Đang tải...'}>
        <Card
          style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', overflow: 'hidden' }}
          styles={{ body: { padding: 0 } }}
        >
          {filtered.length === 0 ? (
            <Empty
              description={loading ? 'Đang tải...' : 'Không có thông báo nào'}
              style={{ padding: 48 }}
            />
          ) : (
            filtered.map(item => <NotificationCard key={item.id} item={item} />)
          )}
        </Card>
      </Spin>
    </div>
  );
};

export default NotificationsPage;

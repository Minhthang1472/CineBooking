import React, { useState, useEffect } from 'react';
import { Table, Card, Typography, Button, Input, Tag, Space, Select, Row, Col, Empty } from 'antd';
import { ReloadOutlined, SearchOutlined, AuditOutlined } from '@ant-design/icons';
import { auditLogApi } from '../../../api/financeApi';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

const ACTION_CONFIG = {
  CREATE:        { color: 'green',    icon: '+',  label: 'Tao moi' },
  UPDATE:        { color: 'blue',     icon: 'E',  label: 'Cap nhat' },
  UPDATE_STATUS: { color: 'cyan',     icon: 'S',  label: 'Doi trang thai' },
  UPLOAD_IMAGE:  { color: 'geekblue', icon: 'I',  label: 'Upload anh' },
  BULK_CREATE:   { color: 'lime',     icon: 'B',  label: 'Tao hang loat' },
  DELETE:        { color: 'red',      icon: 'X',  label: 'Xoa' },
  LOGIN:         { color: 'purple',   icon: 'L',  label: 'Dang nhap' },
  LOGOUT:        { color: 'orange',   icon: 'O',  label: 'Dang xuat' },
};

const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await auditLogApi.getAllAuditLogs();
      const raw = res.data;
      let list = [];
      if (Array.isArray(raw)) list = raw;
      else if (raw?.Events && Array.isArray(raw.Events)) list = raw.Events;
      else if (raw?.events && Array.isArray(raw.events)) list = raw.events;
      else if (raw?.data && Array.isArray(raw.data)) list = raw.data;

      // Normalize fields tu API response
      const normalized = list.map(item => ({
        id: item.eventId || item.id,
        action: item.actionType || item.action,
        tableName: item.entityType || item.tableName,
        recordId: item.context?.recordId ?? item.recordId ?? 0,
        actor: item.actor || item.performedBy || 'He thong',
        oldValue: item.changes?.oldData
          ? (typeof item.changes.oldData === 'string' ? item.changes.oldData : JSON.stringify(item.changes.oldData))
          : (item.oldValue || null),
        newValue: item.changes?.newData
          ? (typeof item.changes.newData === 'string' ? item.changes.newData : JSON.stringify(item.changes.newData))
          : (item.newValue || null),
        createdAt: item.timestamp || item.createdAt,
      }));

      setLogs(normalized);
      setFiltered(normalized);
    } catch (err) {
      console.error('Loi tai audit logs:', err);
      setLogs([]);
      setFiltered([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchLogs(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    let result = logs;
    if (actionFilter !== 'ALL') {
      result = result.filter(l => l.action?.toUpperCase() === actionFilter);
    }
    if (q) {
      result = result.filter(l =>
        l.action?.toLowerCase().includes(q) ||
        l.tableName?.toLowerCase().includes(q) ||
        l.actor?.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [search, logs, actionFilter]);

  const statsByAction = Object.entries(
    logs.reduce((acc, l) => {
      const a = l.action?.toUpperCase() || 'OTHER';
      acc[a] = (acc[a] || 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]);

  const columns = [
    {
      title: 'Hanh Dong', dataIndex: 'action', key: 'action', width: 155,
      render: (a) => {
        const cfg = ACTION_CONFIG[a?.toUpperCase()] || { color: 'default', icon: '?', label: a };
        return (
          <Tag color={cfg.color} style={{ borderRadius: 6, fontWeight: 700, padding: '3px 10px', fontSize: 12 }}>
            {cfg.icon} {cfg.label || a}
          </Tag>
        );
      }
    },
    {
      title: 'Bang Du Lieu', dataIndex: 'tableName', key: 'tableName', width: 130,
      render: t => <Tag color="default" style={{ fontSize: 12, borderRadius: 4 }}>{t}</Tag>
    },
    {
      title: 'Record ID', dataIndex: 'recordId', key: 'recordId', width: 90,
      render: v => <Text type="secondary">#{v || 0}</Text>
    },
    {
      title: 'Gia Tri Cu Moi', key: 'values',
      render: (_, r) => {
        const oldStr = r.oldValue ? (typeof r.oldValue === 'string' ? r.oldValue : JSON.stringify(r.oldValue)) : null;
        const newStr = r.newValue ? (typeof r.newValue === 'string' ? r.newValue : JSON.stringify(r.newValue)) : null;
        return (
          <Space direction="vertical" size={2} style={{ maxWidth: 300 }}>
            {oldStr && <Text type="secondary" style={{ fontSize: 11 }}>Cu: <Text code style={{ fontSize: 11 }}>{oldStr.substring(0, 70)}{oldStr.length > 70 ? '...' : ''}</Text></Text>}
            {newStr && <Text style={{ fontSize: 11 }}>Moi: <Text code style={{ fontSize: 11, color: '#389e0d' }}>{newStr.substring(0, 70)}{newStr.length > 70 ? '...' : ''}</Text></Text>}
            {!oldStr && !newStr && <Text type="secondary" style={{ fontSize: 12 }}>-</Text>}
          </Space>
        );
      }
    },
    {
      title: 'Thuc Hien Boi', dataIndex: 'actor', key: 'actor',
      render: v => <Text strong style={{ fontSize: 13 }}>{v || 'He thong'}</Text>
    },
    {
      title: 'Thoi Gian', dataIndex: 'createdAt', key: 'createdAt', width: 145,
      render: d => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: 13 }}>{d ? dayjs(d).format('DD/MM/YYYY') : '-'}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>{d ? dayjs(d).format('HH:mm:ss') : ''}</Text>
        </Space>
      ),
      defaultSortOrder: 'descend',
    },
  ];

  return (
    <div>
      <div style={{ background: 'linear-gradient(135deg, #0d0d1a 0%, #722ed1 100%)', borderRadius: 16, padding: '28px 36px', marginBottom: 24, color: 'white', boxShadow: '0 10px 30px rgba(114,46,209,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <Title level={2} style={{ color: 'white', margin: '0 0 6px 0', fontWeight: 700 }}>
              <AuditOutlined style={{ marginRight: 10 }} />Nhat Ky He Thong (Audit Logs)
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
              Tong {logs.length} hanh dong - Ghi nhan tu dong moi thao tac tao / sua / xoa / dang nhap.
            </Text>
          </div>
          <Row gutter={10}>
            {statsByAction.slice(0, 5).map(([action, count]) => {
              const cfg = ACTION_CONFIG[action] || { label: action };
              return (
                <Col key={action}>
                  <div style={{ background: 'rgba(255,255,255,0.12)', padding: '8px 14px', borderRadius: 10, textAlign: 'center', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', minWidth: 60 }}>
                    <div style={{ fontSize: 20, fontWeight: 800 }}>{count}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>{cfg.label || action}</div>
                  </div>
                </Col>
              );
            })}
          </Row>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
        <Space wrap>
          <Input.Search
            placeholder="Tim theo bang, nguoi thuc hien..."
            prefix={<SearchOutlined />}
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: 320, borderRadius: 10 }}
            allowClear
          />
          <Select value={actionFilter} onChange={setActionFilter} style={{ width: 180 }}>
            <Option value="ALL">Tat ca hanh dong</Option>
            {Object.entries(ACTION_CONFIG).map(([k, v]) => (
              <Option key={k} value={k}>{v.icon} {v.label}</Option>
            ))}
          </Select>
        </Space>
        <Button icon={<ReloadOutlined />} onClick={fetchLogs} loading={loading}>Lam moi</Button>
      </div>

      <Card style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }} styles={{ body: { padding: 0 } }}>
        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 15, showTotal: t => `Tong ${t} ban ghi` }}
          scroll={{ x: 900 }}
          style={{ borderRadius: 16, overflow: 'hidden' }}
          rowClassName={(r) => {
            const a = r.action?.toUpperCase();
            if (a === 'DELETE') return 'audit-row-danger';
            return '';
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span>
                    Chua co ban ghi nhat ky nao.<br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      He thong se tu dong ghi lai moi hanh dong tao / sua / xoa / dang nhap.
                    </Text>
                  </span>
                }
              />
            )
          }}
        />
      </Card>
    </div>
  );
};

export default AuditLogsPage;

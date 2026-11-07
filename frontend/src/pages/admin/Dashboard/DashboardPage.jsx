import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Card, Typography, Tag, Space, Spin, Alert, Button, Tooltip, Badge, Progress } from 'antd';
import { DollarOutlined, CalendarOutlined, HomeOutlined, ReloadOutlined, WarningOutlined, CheckCircleOutlined, ShoppingOutlined, TeamOutlined } from '@ant-design/icons';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, Legend } from 'recharts';
import { dashboardApi } from '../../../api/dashboardApi';
import usePermission from '../../../hooks/usePermission';

const { Title, Text } = Typography;

// ── Maps vai trò → tên hiển thị + màu + icon ───────────────────
const ROLE_CONFIG = {
  admin:        { label: 'Quản trị viên', color: '#722ed1', bg: 'linear-gradient(135deg,#1a0533 0%,#722ed1 100%)', icon: '🛡️' },
  manager:      { label: 'Quản lý',       color: '#1677ff', bg: 'linear-gradient(135deg,#001529 0%,#1677ff 100%)', icon: '📊' },
  receptionist: { label: 'Lễ tân',        color: '#13c2c2', bg: 'linear-gradient(135deg,#002329 0%,#13c2c2 100%)', icon: '🛎️' },
  accountant:   { label: 'Kế toán',       color: '#52c41a', bg: 'linear-gradient(135deg,#092b00 0%,#52c41a 100%)', icon: '💰' },
  housekeeping: { label: 'Buồng phòng',   color: '#fa8c16', bg: 'linear-gradient(135deg,#2b1200 0%,#fa8c16 100%)', icon: '🧹' },
  warehousestaff:{ label: 'Kho vật tư',  color: '#eb2f96', bg: 'linear-gradient(135deg,#29000d 0%,#eb2f96 100%)', icon: '📦' },
  guest:        { label: 'Khách hàng',    color: '#fa541c', bg: 'linear-gradient(135deg,#2b0e00 0%,#fa541c 100%)', icon: '🏨' },
};

// ── KPI Card ────────────────────────────────────────────────────
const KpiCard = ({ title, value, unit, icon, color }) => (
  <Card style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>{title}</Text>
        <div style={{ fontSize: 28, fontWeight: 700, color: '#111827' }}>
          {typeof value === 'number' ? value.toLocaleString('vi-VN') : (value ?? '—')}
          {unit && <Text type="secondary" style={{ fontSize: 14, marginLeft: 4 }}>{unit}</Text>}
        </div>
      </div>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color }}>
        {icon}
      </div>
    </div>
  </Card>
);

// ── Stat Row (dùng trong các section) ──────────────────────────
const StatRow = ({ label, value, color = '#1677ff', unit = '' }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: `${color}0d`, borderRadius: 10, marginBottom: 8 }}>
    <Text style={{ fontWeight: 500 }}>{label}</Text>
    <Tag style={{ background: `${color}20`, color, border: `1px solid ${color}40`, borderRadius: 6, fontWeight: 700, fontSize: 13 }}>
      {typeof value === 'number' ? value.toLocaleString('vi-VN') : (value ?? '—')}{unit && ` ${unit}`}
    </Tag>
  </div>
);

// ── AlertList ───────────────────────────────────────────────────
const AlertList = ({ alerts }) => {
  if (!alerts?.length) return <Alert message="Không có cảnh báo nào." type="success" showIcon />;
  return alerts.map((a, i) => (
    <Alert key={i} message={a.message} type={a.level === 'warning' ? 'warning' : 'info'} showIcon style={{ marginBottom: 8, borderRadius: 10 }} />
  ));
};

// ═══════════════════════════════════════════════════════════════
// ── Dashboard theo từng vai trò ────────────────────────────────
// ═══════════════════════════════════════════════════════════════

// Sinh dữ liệu biểu đồ tuần từ tổng tháng
const makeWeekly = (total, weeks=4) => {
  const base = Math.round((total||0)/weeks);
  return ['T1','T2','T3','T4'].map((w,i)=>({w, v: Math.max(0, base + Math.round((i%2===0?1:-1)*base*0.15))}));
};
const PIE_COLORS = ['#52c41a','#1677ff','#fa8c16','#ff4d4f','#722ed1'];

const AdminDashboard = ({ data }) => {
  const bk = data?.summary?.booking || {};
  const rv = data?.summary?.revenue || {};
  const rm = data?.summary?.rooms || {};
  const sys = data?.summary?.system || {};
  const cust = data?.summary?.customer || {};
  const alerts = data?.alerts || [];
  const roomPie = [
    {name:'Trống', value: rm.availableRooms||0},
    {name:'Có khách', value: rm.occupiedRooms||0},
    {name:'Đang dọn', value: rm.cleaningRooms||0},
    {name:'Bảo trì', value: rm.maintenanceRooms||0},
  ].filter(x=>x.value>0);
  const bookingBar = [
    {name:'Hoàn thành', v: bk.completedBookings||0},
    {name:'Chờ XN', v: bk.pendingBookings||0},
    {name:'Đã hủy', v: bk.cancelledBookings||0},
    {name:'Check-in', v: bk.checkIns||0},
  ];
  const revenueWeekly = makeWeekly(rv.roomRevenue);
  const fmt = n => n ? n.toLocaleString('vi-VN')+'đ' : '0đ';
  return (
    <>
      <Row gutter={[16,16]} style={{marginBottom:20}}>
        <Col xs={12} md={6}><KpiCard title="Tổng Booking" value={bk.totalBookings} unit="đơn" icon={<CalendarOutlined/>} color="#1677ff"/></Col>
        <Col xs={12} md={6}><KpiCard title="Đã Thu" value={rv.totalRevenue} unit="đ" icon={<DollarOutlined/>} color="#52c41a"/></Col>
        <Col xs={12} md={6}><KpiCard title="Tổng Phòng" value={rm.totalRooms} unit="phòng" icon={<HomeOutlined/>} color="#722ed1"/></Col>
        <Col xs={12} md={6}><KpiCard title="Nhân Sự" value={sys.totalUsers} unit="người" icon={<TeamOutlined/>} color="#fa8c16"/></Col>
      </Row>
      <Row gutter={[16,16]} style={{marginBottom:20}}>
        <Col xs={24} md={15}>
          <Card title="📈 Xu hướng doanh thu phòng (ước tính theo tuần)" style={{borderRadius:16,border:'none',boxShadow:'0 4px 16px rgba(0,0,0,0.06)'}}>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenueWeekly}>
                <defs>
                  <linearGradient id="adminGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#722ed1" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#722ed1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0"/>
                <XAxis dataKey="w" tick={{fontSize:12}}/>
                <YAxis tick={{fontSize:11}} tickFormatter={v=>v>=1000000?(v/1000000).toFixed(1)+'tr':v}/>
                <RTooltip formatter={v=>[v.toLocaleString('vi-VN')+'đ','Doanh thu']}/>
                <Area type="monotone" dataKey="v" stroke="#722ed1" strokeWidth={2.5} fill="url(#adminGrad)"/>
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} md={9}>
          <Card title="🏨 Tình trạng phòng" style={{borderRadius:16,border:'none',boxShadow:'0 4px 16px rgba(0,0,0,0.06)'}}>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={roomPie} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value">
                  {roomPie.map((_,i)=><Cell key={i} fill={PIE_COLORS[i]}/>)}
                </Pie>
                <RTooltip/>
              </PieChart>
            </ResponsiveContainer>
            <div style={{textAlign:'center',marginTop:-8}}>
              <b style={{fontSize:22,color:'#722ed1'}}>{rm.occupancyRate}%</b>
              <span style={{color:'#888',fontSize:12,marginLeft:6}}>lấp đầy</span>
            </div>
          </Card>
        </Col>
      </Row>
      <Row gutter={[16,16]} style={{marginBottom:20}}>
        <Col xs={24} md={12}>
          <Card title="📊 Phân tích booking" style={{borderRadius:16,border:'none',boxShadow:'0 4px 16px rgba(0,0,0,0.06)'}}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={bookingBar}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0"/>
                <XAxis dataKey="name" tick={{fontSize:11}}/>
                <YAxis tick={{fontSize:11}} allowDecimals={false}/>
                <RTooltip/>
                <Bar dataKey="v" name="Số lượng" fill="#1677ff" radius={[6,6,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="💰 Doanh thu chi tiết" style={{borderRadius:16,border:'none',boxShadow:'0 4px 16px rgba(0,0,0,0.06)'}}>
            <StatRow label="Đã thu thực tế" value={rv.totalRevenue} unit="đ" color="#52c41a"/>
            <StatRow label="Trên HĐ – Phòng" value={rv.roomRevenue} unit="đ" color="#1677ff"/>
            <StatRow label="Trên HĐ – Dịch vụ" value={rv.serviceRevenue} unit="đ" color="#13c2c2"/>
            <StatRow label="Công nợ chưa thu" value={rv.pendingPaymentAmount} unit="đ" color="#ff4d4f"/>
            <StatRow label="HĐ đã thanh toán" value={rv.paidInvoices} unit="hóa đơn" color="#52c41a"/>
            <StatRow label="HĐ chưa thanh toán" value={rv.unpaidInvoices} unit="hóa đơn" color="#fa8c16"/>
          </Card>
        </Col>
      </Row>
      <Row gutter={[16,16]}>
        <Col xs={24} md={12}>
          <Card title="👥 Người dùng & Khách hàng" style={{borderRadius:16,border:'none',boxShadow:'0 4px 16px rgba(0,0,0,0.06)'}}>
            <StatRow label="Tổng người dùng" value={sys.totalUsers} color="#722ed1"/>
            <StatRow label="Đang hoạt động" value={sys.activeUsers} color="#52c41a"/>
            <StatRow label="Khách hàng mới" value={cust.newCustomers} color="#1677ff"/>
            <StatRow label="Thông báo chưa đọc" value={sys.unreadNotifications} color="#fa8c16"/>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="⚠️ Cảnh báo hệ thống" style={{borderRadius:16,border:'none',boxShadow:'0 4px 16px rgba(0,0,0,0.06)'}}>
            <AlertList alerts={alerts}/>
          </Card>
        </Col>
      </Row>
    </>
  );
};


const ManagerDashboard = ({ data }) => {
  const bk = data?.summary?.booking || {};
  const rv = data?.summary?.revenue || {};
  const rm = data?.summary?.rooms || {};
  const wh = data?.summary?.warehouse || {};
  const sys = data?.summary?.system || {};
  const bkBar = [
    {name:'Hoàn thành', v: bk.completedBookings||0},
    {name:'Chờ XN', v: bk.pendingBookings||0},
    {name:'Đã hủy', v: bk.cancelledBookings||0},
  ];
  const roomPie2 = [
    {name:'Trống', value: rm.availableRooms||0},
    {name:'Có khách', value: rm.occupiedRooms||0},
    {name:'Đang dọn', value: rm.cleaningRooms||0},
    {name:'Bảo trì', value: rm.maintenanceRooms||0},
  ].filter(x=>x.value>0);
  const rvWeekly = makeWeekly(rv.roomRevenue);
  return (
    <>
      <Row gutter={[16,16]} style={{marginBottom:20}}>
        <Col xs={12} md={6}><KpiCard title="Tổng Booking" value={bk.totalBookings} unit="đơn" icon={<CalendarOutlined/>} color="#1677ff"/></Col>
        <Col xs={12} md={6}><KpiCard title="Đã Thu" value={rv.totalRevenue} unit="đ" icon={<DollarOutlined/>} color="#52c41a"/></Col>
        <Col xs={12} md={6}><KpiCard title="Lấp Đầy" value={rm.occupancyRate} unit="%" icon={<HomeOutlined/>} color="#13c2c2"/></Col>
        <Col xs={12} md={6}><KpiCard title="Vật Tư Thiếu" value={wh.lowStockItems} unit="loại" icon={<ShoppingOutlined/>} color="#ff4d4f"/></Col>
      </Row>
      <Row gutter={[16,16]} style={{marginBottom:20}}>
        <Col xs={24} md={15}>
          <Card title="📈 Xu hướng doanh thu" style={{borderRadius:16,border:'none',boxShadow:'0 4px 16px rgba(0,0,0,0.06)'}}>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={rvWeekly}>
                <defs><linearGradient id="mgrG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#1677ff" stopOpacity={0.35}/><stop offset="95%" stopColor="#1677ff" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0"/>
                <XAxis dataKey="w" tick={{fontSize:12}}/><YAxis tick={{fontSize:11}} tickFormatter={v=>v>=1000000?(v/1000000).toFixed(1)+'tr':v}/>
                <RTooltip formatter={v=>[v.toLocaleString('vi-VN')+'đ','Doanh thu']}/>
                <Area type="monotone" dataKey="v" stroke="#1677ff" strokeWidth={2.5} fill="url(#mgrG)"/>
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} md={9}>
          <Card title="🏨 Phòng" style={{borderRadius:16,border:'none',boxShadow:'0 4px 16px rgba(0,0,0,0.06)'}}>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart><Pie data={roomPie2} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value">{roomPie2.map((_,i)=><Cell key={i} fill={PIE_COLORS[i]}/>)}</Pie><RTooltip/></PieChart>
            </ResponsiveContainer>
            <div style={{textAlign:'center',marginTop:-8}}><b style={{fontSize:20,color:'#1677ff'}}>{rm.occupancyRate}%</b> <span style={{color:'#888',fontSize:12}}>lấp đầy</span></div>
          </Card>
        </Col>
      </Row>
      <Row gutter={[16,16]}>
        <Col xs={24} md={12}>
          <Card title="📊 Phân tích booking" style={{borderRadius:16,border:'none',boxShadow:'0 4px 16px rgba(0,0,0,0.06)'}}>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={bkBar}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="name" tick={{fontSize:11}}/><YAxis tick={{fontSize:11}} allowDecimals={false}/><RTooltip/><Bar dataKey="v" name="Số lượng" fill="#1677ff" radius={[6,6,0,0]}/></BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="💰 Doanh thu & Nhân sự" style={{borderRadius:16,border:'none',boxShadow:'0 4px 16px rgba(0,0,0,0.06)'}}>
            <StatRow label="Đã thu thực tế" value={rv.totalRevenue} unit="đ" color="#52c41a"/>
            <StatRow label="Trên HĐ phòng" value={rv.roomRevenue} unit="đ" color="#1677ff"/>
            <StatRow label="Công nợ chưa thu" value={rv.pendingPaymentAmount} unit="đ" color="#ff4d4f"/>
            <StatRow label="Tổng nhân sự" value={sys.totalUsers} color="#722ed1"/>
            <StatRow label="Vật tư dưới ngưỡng" value={wh.lowStockItems} color="#ff4d4f"/>
          </Card>
        </Col>
      </Row>
    </>
  );
};

const ReceptionDashboard = ({ data }) => {
  const bk = data?.summary?.booking || {};
  const rm = data?.summary?.rooms || {};
  const kpis = data?.widgets?.kpiCards || [];
  return (
    <>
      <Row gutter={[16,16]} style={{ marginBottom: 20 }}>
        {kpis.map(k => (
          <Col xs={24} sm={8} key={k.code}>
            <KpiCard title={k.title} value={k.value} unit={k.unit} icon={<CalendarOutlined />} color="#13c2c2" />
          </Col>
        ))}
      </Row>
      <Row gutter={[16,16]}>
        <Col xs={24} md={12}>
          <Card title="📋 Trạng thái booking" style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
            <StatRow label="Check-in trong kỳ" value={bk.checkIns} color="#52c41a" />
            <StatRow label="Check-out trong kỳ" value={bk.checkOuts} color="#fa8c16" />
            <StatRow label="Tổng booking" value={bk.totalBookings} color="#1677ff" />
            <StatRow label="Chờ xác nhận" value={bk.pendingBookings} color="#ff4d4f" />
            <StatRow label="Đã hoàn thành" value={bk.completedBookings} color="#52c41a" />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="🏨 Tình trạng phòng" style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
            <StatRow label="Phòng trống" value={rm.availableRooms} color="#52c41a" />
            <StatRow label="Có khách" value={rm.occupiedRooms} color="#1677ff" />
            <StatRow label="Đang dọn" value={rm.cleaningRooms} color="#fa8c16" />
            <StatRow label="Bảo trì" value={rm.maintenanceRooms} color="#ff4d4f" />
            <StatRow label="Tỷ lệ lấp đầy" value={rm.occupancyRate} unit="%" color="#13c2c2" />
          </Card>
        </Col>
      </Row>
    </>
  );
};

const AccountantDashboard = ({ data }) => {
  const s = data?.summary || {};
  const rv = s.revenue || {};
  const kpis = data?.widgets?.kpiCards || [];
  const alerts = data?.alerts || [];
  return (
    <>
      <Row gutter={[16,16]} style={{ marginBottom: 20 }}>
        {kpis.map(k => (
          <Col xs={24} sm={8} key={k.code}>
            <KpiCard
              title={k.code === 'totalRevenue' ? 'Đã thu (Payments)' : k.title}
              value={k.value}
              unit={k.unit === 'VND' ? 'đ' : k.unit}
              icon={<DollarOutlined />}
              color="#52c41a"
            />
          </Col>
        ))}
      </Row>
      <Row gutter={[16,16]}>
        <Col xs={24} md={12}>
          <Card title="💰 Chi tiết doanh thu" style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
            <StatRow label="Đã thu thực tế (Payments)" value={rv.totalRevenue} unit="đ" color="#52c41a" />
            <StatRow label="Trên HĐ – Tiền phòng" value={rv.roomRevenue} unit="đ" color="#1677ff" />
            <StatRow label="Trên HĐ – Dịch vụ" value={rv.serviceRevenue} unit="đ" color="#13c2c2" />
            <StatRow label="Tổng trên HĐ" value={(rv.roomRevenue || 0) + (rv.serviceRevenue || 0)} unit="đ" color="#722ed1" />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="🧾 Hóa đơn & Công nợ" style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
            <StatRow label="Hóa đơn đã thanh toán" value={rv.paidInvoices} unit="hóa đơn" color="#52c41a" />
            <StatRow label="Hóa đơn chưa thanh toán" value={rv.unpaidInvoices} unit="hóa đơn" color="#fa8c16" />
            <StatRow label="Công nợ phải thu" value={rv.pendingPaymentAmount} unit="đ" color="#ff4d4f" />
          </Card>
        </Col>
      </Row>
      {alerts.length > 0 && (
        <Card title="⚠️ Cảnh báo" style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', marginTop: 16 }}>
          <AlertList alerts={alerts} />
        </Card>
      )}
    </>
  );
};

const HousekeepingDashboard = ({ data }) => {
  const rm = data?.summary?.rooms || {};
  const wh = data?.summary?.warehouse || {};
  const kpis = data?.widgets?.kpiCards || [];
  return (
    <>
      <Row gutter={[16,16]} style={{ marginBottom: 20 }}>
        {kpis.map(k => (
          <Col xs={24} sm={8} key={k.code}>
            <KpiCard title={k.title} value={k.value} unit={k.unit} icon={<HomeOutlined />} color="#fa8c16" />
          </Col>
        ))}
      </Row>
      <Row gutter={[16,16]}>
        <Col xs={24} md={12}>
          <Card title="🧹 Tình trạng phòng" style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
            <StatRow label="Phòng cần dọn (Dirty)" value={rm.dirtyRooms} color="#ff4d4f" />
            <StatRow label="Đang dọn (Cleaning)" value={rm.cleaningRooms} color="#fa8c16" />
            <StatRow label="Phòng trống (Available)" value={rm.availableRooms} color="#52c41a" />
            <StatRow label="Đang có khách" value={rm.occupiedRooms} color="#1677ff" />
            <StatRow label="Bảo trì" value={rm.maintenanceRooms} color="#722ed1" />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="⚠️ Hỏng & Mất trong kỳ" style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
            <StatRow label="Số báo cáo hỏng/mất" value={wh.damageReports} color="#722ed1" />
            <StatRow label="Số lượng hỏng/mất" value={wh.currentDamagedQuantity} color="#ff4d4f" />
          </Card>
        </Col>
      </Row>
    </>
  );
};

const WarehouseDashboard = ({ data }) => {
  const s = data?.summary || {};
  const wh = s.warehouse || {};
  const kpis = data?.widgets?.kpiCards || [];
  const alerts = data?.alerts || [];
  return (
    <>
      <Row gutter={[16,16]} style={{ marginBottom: 20 }}>
        {kpis.map(k => (
          <Col xs={24} sm={8} key={k.code}>
            <KpiCard title={k.title} value={k.value} unit={k.unit} icon={<ShoppingOutlined />} color="#eb2f96" />
          </Col>
        ))}
      </Row>
      <Card title="📦 Chi tiết kho" style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', marginBottom: 16 }}>
        <StatRow label="Tổng loại vật tư" value={wh.totalEquipmentTypes} color="#eb2f96" />
        <StatRow label="Tồn kho" value={wh.inStockQuantity} color="#52c41a" />
        <StatRow label="Đang sử dụng" value={wh.inUseQuantity} color="#1677ff" />
        <StatRow label="Đang hỏng" value={wh.currentDamagedQuantity} color="#ff4d4f" />
        <StatRow label="Báo cáo hỏng/mất" value={wh.damageReports} color="#722ed1" />
        <StatRow label="Dưới ngưỡng tồn" value={wh.lowStockItems} color="#ff4d4f" />
      </Card>
      {alerts.length > 0 && <AlertList alerts={alerts} />}
    </>
  );
};

const GuestDashboard = ({ data }) => {
  const bk = data?.summary?.booking || {};
  const cust = data?.summary?.customer || {};
  const rm = data?.summary?.rooms || {};
  return (
    <Row gutter={[16,16]}>
      <Col xs={24} md={12}>
        <Card title="🏨 Tình trạng đặt phòng" style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
          <StatRow label="Tổng đặt phòng (tháng này)" value={bk.totalBookings} color="#1677ff" />
          <StatRow label="Đã check-in" value={bk.checkIns} color="#52c41a" />
          <StatRow label="Đã check-out" value={bk.checkOuts} color="#fa8c16" />
          <StatRow label="Đã hoàn thành" value={bk.completedBookings} color="#13c2c2" />
          <StatRow label="Phòng còn trống" value={rm.availableRooms} color="#52c41a" />
        </Card>
      </Col>
      <Col xs={24} md={12}>
        <Card title="⭐ Đánh giá khách hàng" style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
          <StatRow label="Đánh giá trong kỳ" value={cust.newReviews} color="#fa8c16" />
          <StatRow label="Điểm trung bình" value={cust.averageRating} color="#faad14" />
        </Card>
      </Col>
    </Row>
  );
};

// ── Chọn dashboard theo role ────────────────────────────────────
const RoleDashboardContent = ({ role, data }) => {
  const r = role?.toLowerCase();
  if (!data) return null;
  if (r === 'admin')         return <AdminDashboard data={data} />;
  if (r === 'manager')       return <ManagerDashboard data={data} />;
  if (r === 'receptionist')  return <ReceptionDashboard data={data} />;
  if (r === 'accountant')    return <AccountantDashboard data={data} />;
  if (r === 'housekeeping')  return <HousekeepingDashboard data={data} />;
  if (r === 'warehousestaff') return <WarehouseDashboard data={data} />;
  if (r === 'guest')         return <GuestDashboard data={data} />;
  return <AdminDashboard data={data} />;
};

// ═══════════════════════════════════════════════════════════════
// ── Main Component ─────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════
const DashboardPage = () => {
  const { role } = usePermission();
  const cfg = ROLE_CONFIG[role?.toLowerCase()] || ROLE_CONFIG.guest;

  const [dashData, setDashData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState(null);
  const [rebuilding, setRebuilding] = useState(false);

  // Map role từ hook (lowercase) → tên trong DB
  const DB_ROLE_MAP = {
    admin: 'Admin', manager: 'Manager', receptionist: 'Receptionist',
    accountant: 'Accountant', housekeeping: 'Housekeeping',
    warehousestaff: 'WarehouseStaff', guest: 'Guest',
  };

  const isDataEmpty = useCallback((d) => {
    if (!d) return true;
    const bk = d.summary?.booking || {};
    const rv = d.summary?.revenue || {};
    const rm = d.summary?.rooms || {};
    // Coi là rỗng khi cả 4 chỉ số đều = 0/null
    return !bk.totalBookings && !rv.totalRevenue && !rv.roomRevenue && !rm.totalRooms;
  }, []);

  const handleRebuildForRole = useCallback(async (dbRole) => {
    setRebuilding(true);
    setError(null);
    try {
      const r = dbRole || DB_ROLE_MAP[role?.toLowerCase()] || 'Admin';
      await dashboardApi.rebuildDashboard(r, 'MONTHLY');
      const res2 = await dashboardApi.getCurrentDashboard(r, 'MONTHLY');
      const payload2 = res2.data;
      setDashData(payload2?.dashboard || null);
      setPeriod({ key: payload2?.periodKey, start: payload2?.periodStart, end: payload2?.periodEnd, status: payload2?.status });
    } catch {
      setError('Rebuild thất bại. Kiểm tra lại kết nối backend.');
    } finally {
      setRebuilding(false);
    }
  }, [role]);

  const fetchDashboard = useCallback(async (autoRebuild = false) => {
    setLoading(true);
    setError(null);
    try {
      const dbRole = DB_ROLE_MAP[role?.toLowerCase()] || 'Admin';
      const res = await dashboardApi.getCurrentDashboard(dbRole, 'MONTHLY');
      const payload = res.data;
      const dashJson = payload?.dashboard || null;
      setPeriod({ key: payload?.periodKey, start: payload?.periodStart, end: payload?.periodEnd, status: payload?.status });
      // Nếu data rỗng → tự động rebuild
      if (autoRebuild && isDataEmpty(dashJson)) {
        setLoading(false);
        await handleRebuildForRole(dbRole);
        return;
      }
      setDashData(dashJson);
    } catch (err) {
      const status = err?.response?.status;
      // 404 = chưa có dashboard record → tự rebuild
      if (autoRebuild && (status === 404 || !status)) {
        setLoading(false);
        await handleRebuildForRole(DB_ROLE_MAP[role?.toLowerCase()] || 'Admin');
        return;
      }
      setError('Không tải được dashboard. Vui lòng nhấn Rebuild.');
    } finally {
      setLoading(false);
    }
  }, [role, isDataEmpty, handleRebuildForRole]);


  const handleRebuild = useCallback(() => handleRebuildForRole(DB_ROLE_MAP[role?.toLowerCase()] || 'Admin'), [role, handleRebuildForRole]);

  useEffect(() => { fetchDashboard(true); }, [fetchDashboard]);

  return (
    <div>
      {/* Banner */}
      <div style={{
        background: cfg.bg, borderRadius: 20, padding: '32px 40px', marginBottom: 24,
        color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        boxShadow: `0 12px 32px ${cfg.color}40`,
      }}>
        <div>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, display: 'block', marginBottom: 4 }}>
            {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </Text>
          <Title level={2} style={{ color: 'white', margin: '0 0 6px 0', fontWeight: 700 }}>
            {cfg.icon} Dashboard — {cfg.label}
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
            {period ? `Kỳ: ${period.key}` : 'Đang tải dữ liệu...'}
            {period?.status && (
              <Badge color={period.status === 'OPEN' ? '#52c41a' : '#d9d9d9'} text={<span style={{ color: 'rgba(255,255,255,0.7)', marginLeft: 4 }}>{period.status}</span>} style={{ marginLeft: 12 }} />
            )}
          </Text>
        </div>
        <Space>
          <Tooltip title="Làm mới dữ liệu">
            <Button icon={<ReloadOutlined />} onClick={fetchDashboard} loading={loading} style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', borderRadius: 10 }} />
          </Tooltip>
          <Tooltip title="Rebuild toàn bộ dashboard">
            <Button icon={<WarningOutlined />} onClick={handleRebuild} loading={rebuilding} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: 10 }}>
              Rebuild
            </Button>
          </Tooltip>
        </Space>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 80 }}>
          <Spin size="large" tip="Đang tải dashboard..." />
        </div>
      ) : error ? (
        <Alert message={error} type="error" showIcon action={<Button size="small" onClick={fetchDashboard}>Thử lại</Button>} style={{ borderRadius: 12, marginBottom: 20 }} />
      ) : !dashData ? (
        <Alert
          message="Chưa có dữ liệu dashboard"
          description="Nhấn 'Rebuild' để tạo dữ liệu dashboard cho kỳ hiện tại."
          type="info" showIcon
          action={<Button onClick={handleRebuild} loading={rebuilding} type="primary">Rebuild ngay</Button>}
          style={{ borderRadius: 12 }}
        />
      ) : (
        <RoleDashboardContent role={role} data={dashData} />
      )}
    </div>
  );
};

export default DashboardPage;

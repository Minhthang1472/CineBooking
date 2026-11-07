import React, { useEffect } from 'react';
import { Form, Input, Select, Switch, Button, message } from 'antd';

const UserForm = ({ form, onFinish, loading, roles, isEditMode = false }) => {
  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      autoComplete="off"
    >
      {/* Họ và Tên */}
      <Form.Item
        label="Họ và Tên"
        name="fullName"
        rules={[
          { required: true, message: 'Vui lòng nhập họ và tên!' },
          { min: 2, message: 'Họ và tên phải ít nhất 2 ký tự!' },
        ]}
      >
        <Input placeholder="Nhập họ và tên" />
      </Form.Item>

      {/* Email */}
      <Form.Item
        label="Email"
        name="email"
        rules={[
          { required: true, message: 'Vui lòng nhập email!' },
          { type: 'email', message: 'Email không hợp lệ!' },
        ]}
      >
        <Input placeholder="Nhập email" type="email" disabled={isEditMode} />
      </Form.Item>

      {/* Số điện thoại */}
      <Form.Item
        label="Số điện thoại"
        name="phone"
        rules={[
          { 
            pattern: /^[0-9]{10,11}$/, 
            message: 'Số điện thoại phải 10-11 chữ số!' 
          },
        ]}
      >
        <Input placeholder="Nhập số điện thoại (10-11 số)" />
      </Form.Item>

      {/* Mật khẩu - chỉ hiển thị khi thêm mới */}
      {!isEditMode && (
        <Form.Item
          label="Mật khẩu"
          name="passwordHash"
          rules={[
            { required: true, message: 'Vui lòng nhập mật khẩu!' },
            { min: 6, message: 'Mật khẩu phải ít nhất 6 ký tự!' },
          ]}
        >
          <Input.Password placeholder="Nhập mật khẩu" />
        </Form.Item>
      )}

      {/* Vị trí (Role) */}
      <Form.Item
        label="Vị trí (Role)"
        name="roleId"
        rules={[{ required: true, message: 'Vui lòng chọn vị trí!' }]}
      >
        <Select placeholder="Chọn vị trí">
          {roles.map((role) => (
            <Select.Option key={role.id} value={role.id}>
              {role.name}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      {/* Trạng thái */}
      <Form.Item
        label="Trạng thái"
        name="status"
        valuePropName="checked"
      >
        <Switch checkedChildren="Hoạt động" unCheckedChildren="Vô hiệu" />
      </Form.Item>

      {/* Nút submit */}
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} block>
          {isEditMode ? 'Cập nhật' : 'Tạo mới'}
        </Button>
      </Form.Item>
    </Form>
  );
};

export default UserForm;

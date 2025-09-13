'use client';

import { useState, useContext } from 'react';
import { Form, Input, Button, notification } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { AuthContext } from '@/providers/AuthProvider';
import { apiAuth } from '@/utils/apiAuth';

type Props = React.HTMLAttributes<HTMLDivElement>;

type FieldType = {
  email?: string;
  password?: string;
};

export default function LoginForm(props: Props) {
  const [loading, setLoading] = useState(false);
  const [api, contextHolder] = notification.useNotification();
  const auth = useContext(AuthContext);

  const onFinish = async (values: FieldType) => {
    setLoading(true);
    try {
      const response = await apiAuth.post('/api/auth/login', values);
      // console.log('✅ Response dari login:', response); // DEBUG

      if (!response?.token) {
        api.error({
          message: 'Login Gagal',
          description: response?.message || 'Email atau password salah.',
        });
        return;
      }

      await auth?.login(response.token, response.expiresIn || 3600);
      await auth?.login(response.token, response.expiresIn || 60 * 60 * 24);

      api.success({
        message: 'Login Berhasil',
        description: 'Selamat datang di dashboard admin.',
      });
    } catch (error: any) {
      console.error('❌ Login error:', error);
      api.error({
        message: 'Terjadi Kesalahan',
        description: error?.message || 'Gagal login. Coba lagi nanti.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div {...props}>
      {contextHolder}
      <Form
        layout='vertical'
        onFinish={onFinish}
      >
        <Form.Item<FieldType>
          name='email'
          rules={[{ required: true, message: 'Masukkan email Anda!' }]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder='Email'
            size='large'
          />
        </Form.Item>
        <Form.Item<FieldType>
          name='password'
          rules={[{ required: true, message: 'Masukkan password Anda!' }]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder='Password'
            size='large'
          />
        </Form.Item>
        <Form.Item>
          <Button
            type='primary'
            htmlType='submit'
            loading={loading}
            block
            size='large'
          >
            Masuk
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}

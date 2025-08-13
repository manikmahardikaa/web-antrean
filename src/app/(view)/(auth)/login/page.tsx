'use client';

import { Col, Layout, Row, Image, Space } from 'antd';
import LoginHeader from './component/loginHeader';
import LoginForm from './component/loginForm';

const { Content } = Layout;

export default function LoginPage() {
  return (
    <Layout style={{ minHeight: '100dvh' }}>
      <Content
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '24px 16px',
        }}
      >
        <div style={{ width: '100%', maxWidth: 1200 }}>
          <Row
            justify='center'
            align='middle'
            gutter={[24, 40]} // [horizontal, vertical]
          >
            {/* Gambar (di atas saat mobile, di kiri saat desktop) */}
            <Col
              xs={24}
              sm={22}
              md={12}
              style={{ textAlign: 'center' }}
            >
              <Image
                src='/assets/images/logo.png'
                alt='Login Illustration'
                preview={false}
                // Biarkan gambar fleksibel: penuh lebar kolom, tapi batasi max
                style={{
                  width: '100%',
                  maxWidth: 350,
                  height: 'auto',
                  margin: '0 auto',
                  display: 'block',
                }}
              />
            </Col>

            {/* Form (penuh lebar di mobile, kolom kanan di desktop) */}
            <Col
              xs={24}
              sm={22}
              md={10}
            >
              <Space
                direction='vertical'
                size={16}
                style={{ width: '100%' }}
              >
                <LoginHeader className='mb-3' />
                <LoginForm />
              </Space>
            </Col>
          </Row>
        </div>
      </Content>
    </Layout>
  );
}

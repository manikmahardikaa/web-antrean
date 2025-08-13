'use client';

import Link from 'next/link';
import { Space, Typography, Breadcrumb } from 'antd';
import LayananContainer from './components/LayananContainer';

const { Title, Text } = Typography;

export default function ManajemenLayananPage() {
  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 1200, padding: '24px 16px' }}>
        <Breadcrumb items={[{ title: <Link href='/admin/dashboard'>Home</Link> }, { title: 'Manajemen Layanan' }]} />

        <Space
          direction='vertical'
          size={8}
          style={{ width: '100%', marginTop: 8 }}
        >
          <Title
            level={3}
            style={{ margin: 0 }}
          >
            Manajemen Layanan
          </Title>
          <Text type='secondary'>Kelola daftar layanan yang tersedia</Text>
        </Space>

        {/* Konten utama */}
        <div style={{ marginTop: 16 }}>
          <LayananContainer />
        </div>
      </div>
    </div>
  );
}

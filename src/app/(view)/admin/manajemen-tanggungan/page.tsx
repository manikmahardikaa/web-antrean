'use client';

import Link from 'next/link';
import { Space, Typography, Breadcrumb } from 'antd';
import TanggunganContainer from './components/TangggunganContainer';

const { Title, Text } = Typography;

export default function ManajemenTanggunganPage() {
  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 1200, padding: '24px 16px' }}>
        <Breadcrumb items={[{ title: <Link href='/admin/dashboard'>Home</Link> }, { title: 'Manajemen Tanggungan' }]} />

        <Space
          direction='vertical'
          size={8}
          style={{ width: '100%', marginTop: 8 }}
        >
          <Title
            level={3}
            style={{ margin: 0 }}
          >
            Manajemen Tanggungan
          </Title>
          <Text type='secondary'>Kelola daftar tanggungan/coverage pasien.</Text>
        </Space>

        {/* Konten utama */}
        <div style={{ marginTop: 16 }}>
          <TanggunganContainer />
        </div>
      </div>
    </div>
  );
}

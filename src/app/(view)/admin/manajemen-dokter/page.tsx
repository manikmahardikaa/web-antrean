'use client';

import Link from 'next/link';
import { Breadcrumb, Space, Typography } from 'antd';
import DokterGridContainer from './components/DoctorGridContainer';

const { Title, Text } = Typography;

export default function Page() {
  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 1200, padding: '24px 16px' }}>
        <Breadcrumb items={[{ title: <Link href='/admin/dashboard'>Home</Link> }, { title: 'Manajemen Dokter' }]} />

        <Space
          direction='vertical'
          size={8}
          style={{ width: '100%', marginTop: 8 }}
        >
          <Title
            level={3}
            style={{ margin: 0 }}
          >
            Manajemen Dokter
          </Title>
          <Text type='secondary'>Lihat daftar dokter sebagai kartu, tambah dokter lewat drawer, dan klik kartu untuk detail.</Text>
        </Space>

        <div style={{ marginTop: 16 }}>
          <DokterGridContainer />
        </div>
      </div>
    </div>
  );
}

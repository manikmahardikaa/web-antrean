'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Row, Col, Space, Typography, Input, Select, Button } from 'antd';
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { apiAuth } from '@/utils/apiAuth';
import { ApiEndpoints } from '@/constraints/api-endpoints';
import UserContainer from './components/UserContainer';

const { Title } = Typography;

type Option = { label: string; value: string };

export default function ManajemenPenggunaPage() {
  const [refreshToken, setRefreshToken] = useState(0);

  // Filters (di Page, disalurkan ke Container)
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'USER' | 'ADMIN'>('ALL');
  const [genderFilter, setGenderFilter] = useState<'ALL' | 'Pria' | 'Wanita'>('ALL'); // L/P (opsional)
  const [layananFilter, setLayananFilter] = useState<string | undefined>();
  const [tanggunganFilter, setTanggunganFilter] = useState<string | undefined>();

  // Options
  const [layananOpts, setLayananOpts] = useState<Option[]>([]);
  const [tanggunganOpts, setTanggunganOpts] = useState<Option[]>([]);

  const loadOptions = async () => {
    try {
      const [l, t] = await Promise.all([apiAuth.getDataPrivate(ApiEndpoints.GetLayanan), apiAuth.getDataPrivate(ApiEndpoints.GetTanggungan)]);

      setLayananOpts(Array.isArray(l) ? l.map((x: any) => ({ label: x.nama_layanan, value: x.id_layanan })) : []);
      setTanggunganOpts(Array.isArray(t) ? t.map((x: any) => ({ label: x.nama_tanggungan, value: x.id_tanggungan })) : []);
    } catch {
      // biarkan kosong jika error
    }
  };

  useEffect(() => {
    loadOptions();
  }, []);

  const filters = useMemo(
    () => ({
      query,
      roleFilter,
      genderFilter,
      layananFilter,
      tanggunganFilter,
    }),
    [query, roleFilter, genderFilter, layananFilter, tanggunganFilter]
  );

  return (
    <Space
      direction='vertical'
      size={16}
      style={{ width: '100%' }}
    >
      {/* Header + Toolbar/Filters */}
      <Row
        align='middle'
        justify='space-between'
        gutter={[16, 16]}
      >
        <Col flex='auto'>
          <Title
            level={3}
            style={{ margin: 0 }}
          >
            Manajemen Pengguna
          </Title>
        </Col>
        <Col>
          <Space wrap>
            <Input
              allowClear
              placeholder='Cari nama/email/no telp…'
              prefix={<SearchOutlined />}
              style={{ width: 300 }}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Select
              style={{ width: 160 }}
              value={roleFilter}
              onChange={setRoleFilter}
              options={[
                { label: 'Semua Role', value: 'ALL' },
                { label: 'User', value: 'USER' },
                { label: 'Admin', value: 'ADMIN' },
              ]}
            />
            <Select
              style={{ width: 140 }}
              value={genderFilter}
              onChange={setGenderFilter}
              options={[
                { label: 'Semua JK', value: 'ALL' },
                { label: 'Pria', value: 'Pria' },
                { label: 'Wanita', value: 'Wanita' },
              ]}
            />
            <Select
              allowClear
              placeholder='Filter Layanan'
              style={{ width: 220 }}
              options={layananOpts}
              value={layananFilter}
              onChange={setLayananFilter}
              showSearch
              filterOption={(i, o) => (o?.label as string).toLowerCase().includes(i.toLowerCase())}
            />
            <Select
              allowClear
              placeholder='Filter Tanggungan'
              style={{ width: 220 }}
              options={tanggunganOpts}
              value={tanggunganFilter}
              onChange={setTanggunganFilter}
              showSearch
              filterOption={(i, o) => (o?.label as string).toLowerCase().includes(i.toLowerCase())}
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={() => setRefreshToken((x) => x + 1)}
            >
              Refresh
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Tabel + aksi */}
      <UserContainer
        filters={filters}
        layananOpts={layananOpts}
        tanggunganOpts={tanggunganOpts}
        refreshToken={refreshToken}
      />
    </Space>
  );
}

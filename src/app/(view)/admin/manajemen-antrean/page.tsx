'use client';

import React, { useEffect, useState } from 'react';
import { Row, Col, Space, Input, Select, DatePicker, Button, Typography, message } from 'antd';
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';

import AntreanContainer from './components/AntreanContainer';
import type { Filters, Option } from './components/types';
import { apiAuth } from '@/utils/apiAuth';
import { ApiEndpoints } from '@/constraints/api-endpoints';

const { Text } = Typography;
const { RangePicker } = DatePicker;

export default function ManajemenAntreanPage() {
  const [loadingOpts, setLoadingOpts] = useState(false);
  const [dokterOpts, setDokterOpts] = useState<Option[]>([]);
  const [layananOpts, setLayananOpts] = useState<Option[]>([]);
  const [refreshToken, setRefreshToken] = useState(0);

  const [filters, setFilters] = useState<Filters>({
    query: '',
    statusFilter: 'ALL',
    dokterFilter: undefined,
    layananFilter: undefined,
    range: null,
  });

  // Load options (dokter aktif + layanan) via apiAuth
  useEffect(() => {
    const loadOpts = async () => {
      try {
        setLoadingOpts(true);
        const [doks, lays] = await Promise.all([apiAuth.getDataPrivate(`${ApiEndpoints.GetDokter}?onlyActive=true`), apiAuth.getDataPrivate(ApiEndpoints.GetLayanan)]);

        if (!Array.isArray(doks)) throw new Error(doks?.message || 'Gagal memuat dokter');
        if (!Array.isArray(lays)) throw new Error(lays?.message || 'Gagal memuat layanan');

        setDokterOpts(
          doks.map((d: any) => ({
            label: `${d.nama_dokter}${d.spesialisasi ? ' — ' + d.spesialisasi : ''}`,
            value: d.id_dokter,
          }))
        );
        setLayananOpts(lays.map((l: any) => ({ label: l.nama_layanan, value: l.id_layanan })));
      } catch (e: any) {
        message.error(e?.message || 'Tidak bisa memuat opsi filter');
      } finally {
        setLoadingOpts(false);
      }
    };
    loadOpts();
  }, []);

  return (
    <Space
      direction='vertical'
      size={16}
      style={{ width: '100%' }}
    >
      {/* Toolbar / Filters */}
      <Row
        align='middle'
        justify='space-between'
        gutter={[16, 16]}
      >
        <Col flex='auto'>
          <Space wrap>
            <Input
              allowClear
              placeholder='Cari pasien/dokter/layanan/alamat…'
              prefix={<SearchOutlined />}
              style={{ width: 300 }}
              value={filters.query}
              onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
            />
            <Select
              style={{ width: 170 }}
              value={filters.statusFilter}
              onChange={(v) => setFilters((f) => ({ ...f, statusFilter: v }))}
              options={[
                { label: 'Semua Status', value: 'ALL' },
                { label: 'Menunggu', value: 'MENUNGGU' },
                { label: 'Diproses', value: 'DIPROSES' },
                { label: 'Selesai', value: 'SELESAI' },
                { label: 'Dibatalkan', value: 'DIBATALKAN' },
              ]}
            />
            <Select
              allowClear
              placeholder='Filter Dokter'
              style={{ width: 240 }}
              options={dokterOpts}
              loading={loadingOpts}
              value={filters.dokterFilter}
              onChange={(v) => setFilters((f) => ({ ...f, dokterFilter: v }))}
              showSearch
              filterOption={(input, option) => (option?.label as string).toLowerCase().includes(input.toLowerCase())}
            />
            <Select
              allowClear
              placeholder='Filter Layanan'
              style={{ width: 200 }}
              options={layananOpts}
              loading={loadingOpts}
              value={filters.layananFilter}
              onChange={(v) => setFilters((f) => ({ ...f, layananFilter: v }))}
              showSearch
            />
            <RangePicker
              value={filters.range as [Dayjs, Dayjs] | null}
              onChange={(v) => setFilters((f) => ({ ...f, range: (v as any) ?? null }))}
              allowEmpty={[true, true]}
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={() => setRefreshToken((x) => x + 1)}
            >
              Refresh
            </Button>
          </Space>
        </Col>
        <Col>
          <Text type='secondary'>Manajemen Antrean</Text>
        </Col>
      </Row>

      {/* Tabel & aksi-aksi di dalam container */}
      <AntreanContainer
        filters={filters}
        dokterOpts={dokterOpts}
        layananOpts={layananOpts}
        refreshToken={refreshToken}
      />
    </Space>
  );
}

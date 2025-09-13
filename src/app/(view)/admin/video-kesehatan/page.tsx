'use client';

import React from 'react';
import { Card, Space, Button, Input, DatePicker, Typography, Flex } from 'antd';
import { PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import VideoContainer, { Filters } from './components/VideoContainer';
import VideoFormDrawer, { VideoFormValues } from './components/VideoFormDrawer';

const { RangePicker } = DatePicker;

export default function AdminVideoPage() {
  const [filters, setFilters] = React.useState<Filters>({ q: '', range: null });
  const [refreshToken, setRefreshToken] = React.useState(0);

  // Drawer state should be here to be triggered by the button
  const [open, setOpen] = React.useState(false);
  const [drawerLoading, setDrawerLoading] = React.useState(false);

  const resetFilter = () => {
    setFilters({ q: '', range: null });
    setRefreshToken((t) => t + 1);
  };

  const handleFilterChange = (changed: Partial<Filters>) => {
    setFilters((prev) => ({ ...prev, ...changed }));
  };

  const handleSubmit = async (values: VideoFormValues, file?: File | null) => {
    try {
      setDrawerLoading(true);
      const fd = new FormData();
      fd.append('judul', values.judul);
      fd.append('deskripsi', values.deskripsi);
      fd.append('tanggal_penerbitan', dayjs(values.tanggal_penerbitan).format('YYYY-MM-DD'));
      if (file) fd.append('file', file);

      const res = await fetch('/api/video-kesehatan', { method: 'POST', body: fd });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.message || 'Gagal menyimpan data');

      setOpen(false);
      setRefreshToken((t) => t + 1); // Refresh table
    } catch (e: any) {
      // message is shown in container
    } finally {
      setDrawerLoading(false);
    }
  };

  return (
    <Space direction='vertical' size={16} style={{ width: '100%' }}>
      <Card>
        <Flex wrap='wrap' gap={12} align='center' justify='space-between'>
          <Typography.Title level={4} style={{ margin: 0 }}>
            Manajemen Video Kesehatan
          </Typography.Title>
          <Space wrap>
            <Input
              allowClear
              placeholder='Cari judul/deskripsi…'
              prefix={<SearchOutlined />}
              value={filters.q}
              onChange={(e) => handleFilterChange({ q: e.target.value })}
              onPressEnter={() => setRefreshToken((t) => t + 1)}
              style={{ width: 260 }}
            />
            <RangePicker
              value={filters.range}
              onChange={(v) => handleFilterChange({ range: v as [Dayjs, Dayjs] | null })}
              style={{ width: 280 }}
              allowClear
            />
            <Button icon={<ReloadOutlined />} onClick={() => setRefreshToken((t) => t + 1)}>
              Refresh
            </Button>
            <Button onClick={resetFilter}>Reset</Button>
            <Button type='primary' icon={<PlusOutlined />} onClick={() => setOpen(true)}>
              Tambah Video
            </Button>
          </Space>
        </Flex>
      </Card>

      <VideoContainer filters={filters} refreshToken={refreshToken} />

      <VideoFormDrawer
        open={open}
        loading={drawerLoading}
        initial={null} // Create form is always empty
        onClose={() => setOpen(false)}
        onSubmit={handleSubmit}
      />
    </Space>
  );
}
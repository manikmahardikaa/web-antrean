'use client';

import React from 'react';
import { Card, Space, Button, Input, DatePicker, Typography, Flex } from 'antd';
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { Dayjs } from 'dayjs';
import BeritaContainer, { Filters } from './components/BeritaContainer';

const { RangePicker } = DatePicker;

export default function AdminBeritaPage() {
  const [filters, setFilters] = React.useState<Filters>({ q: '', range: null });
  const [refreshToken, setRefreshToken] = React.useState(0);

  const resetFilter = () => {
    setFilters({ q: '', range: null });
    setRefreshToken((t) => t + 1);
  };

  const handleFilterChange = (changed: Partial<Filters>) => {
    setFilters((prev) => ({ ...prev, ...changed }));
  };

  return (
    <Space
      direction='vertical'
      size={16}
      style={{ width: '100%' }}
    >
      <Card>
        <Flex
          wrap='wrap'
          gap={12}
          align='center'
          justify='space-between'
        >
          <Typography.Title
            level={4}
            style={{ margin: 0 }}
          >
            Manajemen Berita
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
            <Button
              icon={<ReloadOutlined />}
              onClick={() => setRefreshToken((t) => t + 1)}
            >
              Refresh
            </Button>
            <Button onClick={resetFilter}>Reset</Button>
          </Space>
        </Flex>
      </Card>

      <BeritaContainer
        filters={filters}
        refreshToken={refreshToken}
      />
    </Space>
  );
}

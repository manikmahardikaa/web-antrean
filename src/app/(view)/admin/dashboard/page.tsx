'use client';

import React, { useState } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Space, Typography, Button, DatePicker, Select, List, Progress, Divider, Skeleton, Empty } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { UserOutlined, TeamOutlined, CalendarOutlined, CloseCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import useDashboard from './useDashboard';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

type StatusAntrean = 'MENUNGGU' | 'DIPROSES' | 'SELESAI' | 'DIBATALKAN';

type AntreanRow = {
  key: string;
  pasien: string;
  dokter: string;
  layanan: string;
  tanggal: string; // ISO string
  status: StatusAntrean;
  alamat_user: string;
};

const statusColor: Record<StatusAntrean, string> = {
  MENUNGGU: 'geekblue',
  DIPROSES: 'gold',
  SELESAI: 'green',
  DIBATALKAN: 'red',
};

export default function Page() {
  // Global filter
  const [range, setRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [filterLayananId, setFilterLayananId] = useState<string | undefined>();

  // Build params untuk hook
  const start = range?.[0]?.format('YYYY-MM-DD');
  const end = range?.[1]?.format('YYYY-MM-DD');

  const { data, isLoading, refresh } = useDashboard(start && end ? [start, end] : null, filterLayananId);

  const summary = data?.summary ?? {
    totalUser: 0,
    totalDokter: 0,
    antreanHariIni: 0,
    dibatalkanHariIni: 0,
  };
  const dataAntrean: AntreanRow[] = data?.recentAntrean ?? [];
  const topLayanan = data?.topLayanan ?? [];
  const upcomingJadwal = data?.upcomingJadwal ?? [];
  const tren7Hari = data?.tren7Hari ?? [];

  const columns: ColumnsType<AntreanRow> = [
    {
      title: 'Pasien',
      dataIndex: 'pasien',
      key: 'pasien',
      ellipsis: true,
    },
    {
      title: 'Dokter',
      dataIndex: 'dokter',
      key: 'dokter',
      ellipsis: true,
      responsive: ['sm'],
    },
    {
      title: 'Layanan',
      dataIndex: 'layanan',
      key: 'layanan',
      filters: topLayanan.map((x) => ({ text: x.nama, value: x.nama })),
      onFilter: (val, rec) => rec.layanan === val,
    },
    {
      title: 'Tanggal',
      dataIndex: 'tanggal',
      key: 'tanggal',
      sorter: (a, b) => a.tanggal.localeCompare(b.tanggal),
      width: 170,
      responsive: ['md'],
      render: (iso: string) => (iso ? dayjs(iso).format('YYYY-MM-DD HH:mm') : '-'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      align: 'center',
      render: (s: StatusAntrean) => <Tag color={statusColor[s]}>{s}</Tag>,
    },
    {
      title: 'Alamat',
      dataIndex: 'alamat_user',
      key: 'alamat_user',
      ellipsis: true,
      responsive: ['lg'],
    },
  ];

  const maxTotal = Math.max(1, ...topLayanan.map((i) => i.total));

  return (
    <Space
      direction='vertical'
      size={16}
      style={{ width: '100%' }}
    >
      {/* Header bar */}
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
            Dashboard
          </Title>
          <Text type='secondary'>Ringkasan operasional hari ini</Text>
        </Col>
        <Col>
          <Space wrap>
            <RangePicker onChange={(v) => setRange(v as any)} />
            <Select
              placeholder='Filter layanan'
              allowClear
              style={{ width: 220 }}
              value={filterLayananId}
              onChange={(v) => setFilterLayananId(v)}
              // Ambil pilihan dari topLayanan (id + nama)
              options={topLayanan.map((x) => ({ label: x.nama, value: x.id_layanan }))}
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={() => refresh()}
            >
              Refresh
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Summary cards */}
      <Row gutter={[16, 16]}>
        <Col
          xs={24}
          sm={12}
          md={12}
          lg={6}
        >
          <Card>
            <Space align='start'>
              <UserOutlined style={{ fontSize: 22 }} />
              <Statistic
                title='Total Pengguna'
                value={summary.totalUser}
              />
            </Space>
          </Card>
        </Col>
        <Col
          xs={24}
          sm={12}
          md={12}
          lg={6}
        >
          <Card>
            <Space align='start'>
              <TeamOutlined style={{ fontSize: 22 }} />
              <Statistic
                title='Total Dokter'
                value={summary.totalDokter}
              />
            </Space>
          </Card>
        </Col>
        <Col
          xs={24}
          sm={12}
          md={12}
          lg={6}
        >
          <Card>
            <Space align='start'>
              <CalendarOutlined style={{ fontSize: 22 }} />
              <Statistic
                title='Antrean Hari Ini'
                value={summary.antreanHariIni}
              />
            </Space>
          </Card>
        </Col>
        <Col
          xs={24}
          sm={12}
          md={12}
          lg={6}
        >
          <Card>
            <Space align='start'>
              <CloseCircleOutlined style={{ fontSize: 22 }} />
              <Statistic
                title='Dibatalkan Hari Ini'
                value={summary.dibatalkanHariIni}
              />
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Middle: Tren (placeholder chart) + Jadwal Terdekat */}
      <Row gutter={[16, 16]}>
        <Col
          xs={24}
          lg={16}
        >
          <Card title='Tren Antrean (7 hari)'>
            {isLoading ? (
              <Skeleton
                active
                paragraph={{ rows: 6 }}
              />
            ) : tren7Hari.length === 0 ? (
              <div
                style={{
                  height: 260,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px dashed var(--ant-color-border)',
                  borderRadius: 8,
                }}
              >
                <Empty description='Grafik belum dihubungkan' />
              </div>
            ) : (
              <div
                style={{
                  height: 260,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px dashed var(--ant-color-border)',
                  borderRadius: 8,
                }}
              >
                <Text type='secondary'>Data siap: {tren7Hari.map((d) => d.tanggal).join(', ')} (render chart kemudian)</Text>
              </div>
            )}
          </Card>
        </Col>
        <Col
          xs={24}
          lg={8}
        >
          <Card title='Jadwal Terdekat'>
            {isLoading ? (
              <Skeleton active />
            ) : (
              <List
                itemLayout='horizontal'
                dataSource={upcomingJadwal}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      title={
                        <Space split={<Divider type='vertical' />}>
                          <Text strong>{item.waktu}</Text>
                          <Text>{item.layanan}</Text>
                        </Space>
                      }
                      description={<Text type='secondary'>{item.dokter}</Text>}
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* Bottom: Antrean Terbaru + Top Layanan */}
      <Row gutter={[16, 16]}>
        <Col
          xs={24}
          lg={16}
        >
          <Card
            title='Antrean Terbaru'
            bodyStyle={{ paddingTop: 0 }}
          >
            <Table<AntreanRow>
              size='middle'
              loading={isLoading}
              columns={columns}
              dataSource={dataAntrean}
              pagination={{ pageSize: 6 }}
              scroll={{ x: 960 }}
              rowKey='key'
            />
          </Card>
        </Col>
        <Col
          xs={24}
          lg={8}
        >
          <Card title='Top Layanan'>
            {isLoading && topLayanan.length === 0 ? (
              <Skeleton active />
            ) : topLayanan.length === 0 ? (
              <Empty description='Belum ada data' />
            ) : (
              topLayanan.map((item) => {
                const percent = Math.round((item.total / maxTotal) * 100);
                return (
                  <div
                    key={item.id_layanan}
                    style={{ marginBottom: 16 }}
                  >
                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                      <Text>{item.nama}</Text>
                      <Text type='secondary'>{item.total}</Text>
                    </Space>
                    <Progress
                      percent={percent}
                      showInfo={false}
                    />
                  </div>
                );
              })
            )}
          </Card>
        </Col>
      </Row>
    </Space>
  );
}

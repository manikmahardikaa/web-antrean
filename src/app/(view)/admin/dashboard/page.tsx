'use client';

import React, { useMemo, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Space, Typography, Button, DatePicker, Select, List, Progress, Divider, Skeleton, Empty } from 'antd';
import { UserOutlined, TeamOutlined, CalendarOutlined, CloseCircleOutlined, ReloadOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

type StatusAntrean = 'MENUNGGU' | 'DIPROSES' | 'SELESAI' | 'DIBATALKAN';

type AntreanRow = {
  key: string;
  pasien: string;
  dokter: string;
  layanan: string;
  tanggal: string; // ISO atau formatted string
  status: StatusAntrean;
  alamat_user: string;
};

const statusColor: Record<StatusAntrean, string> = {
  MENUNGGU: 'geekblue',
  DIPROSES: 'gold',
  SELESAI: 'green',
  DIBATALKAN: 'red',
};

export default function AdminPageDashboard() {
  // state demo – sambungkan ke data asli/endpoint kamu nanti
  const [loading, setLoading] = useState(false);
  const [range, setRange] = useState<[any, any] | null>(null);
  const [filterLayanan, setFilterLayanan] = useState<string | undefined>();

  // Mock data (ganti dari API kamu)
  const summary = useMemo(
    () => ({
      totalUser: 1280,
      totalDokter: 24,
      antreanHariIni: 86,
      dibatalkanHariIni: 7,
    }),
    []
  );

  const dataAntrean: AntreanRow[] = useMemo(
    () => [
      {
        key: '1',
        pasien: 'Made Arta',
        dokter: 'drg. Ayu Mahendrani',
        layanan: 'Scaling',
        tanggal: '2025-08-08 10:30',
        status: 'MENUNGGU',
        alamat_user: 'Jl. Gatot Subroto Timur No. 10',
      },
      {
        key: '2',
        pasien: 'I Gde Surya',
        dokter: 'drg. Rai Pramana',
        layanan: 'Tambal Gigi',
        tanggal: '2025-08-08 11:00',
        status: 'DIPROSES',
        alamat_user: 'Jl. Teuku Umar Barat No. 5',
      },
      {
        key: '3',
        pasien: 'Ni Putu Sinta',
        dokter: 'drg. Ayu Mahendrani',
        layanan: 'Konsultasi',
        tanggal: '2025-08-08 12:15',
        status: 'SELESAI',
        alamat_user: 'Jl. Mahendradatta No. 88',
      },
      {
        key: '4',
        pasien: 'Kadek Yoga',
        dokter: 'drg. Rai Pramana',
        layanan: 'Cabut Gigi',
        tanggal: '2025-08-08 09:45',
        status: 'DIBATALKAN',
        alamat_user: 'Jl. Diponegoro No. 2',
      },
    ],
    []
  );

  const topLayanan = useMemo(
    () => [
      { nama: 'Konsultasi', total: 320 },
      { nama: 'Scaling', total: 240 },
      { nama: 'Tambal Gigi', total: 190 },
      { nama: 'Cabut Gigi', total: 110 },
    ],
    []
  );

  const upcomingJadwal = useMemo(
    () => [
      { waktu: '10:30', dokter: 'drg. Ayu Mahendrani', layanan: 'Scaling' },
      { waktu: '11:00', dokter: 'drg. Rai Pramana', layanan: 'Tambal Gigi' },
      { waktu: '12:15', dokter: 'drg. Ayu Mahendrani', layanan: 'Konsultasi' },
      { waktu: '13:30', dokter: 'drg. Putri Astini', layanan: 'Perawatan Saraf' },
    ],
    []
  );

  const columns = [
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
      filters: [
        { text: 'Konsultasi', value: 'Konsultasi' },
        { text: 'Scaling', value: 'Scaling' },
        { text: 'Tambal Gigi', value: 'Tambal Gigi' },
        { text: 'Cabut Gigi', value: 'Cabut Gigi' },
      ],
      onFilter: (val: any, rec: AntreanRow) => rec.layanan === val,
    },
    {
      title: 'Tanggal',
      dataIndex: 'tanggal',
      key: 'tanggal',
      sorter: (a: AntreanRow, b: AntreanRow) => a.tanggal.localeCompare(b.tanggal),
      width: 150,
      responsive: ['md'],
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s: StatusAntrean) => <Tag color={statusColor[s]}>{s}</Tag>,
      width: 140,
      align: 'center' as const,
    },
    {
      title: 'Alamat',
      dataIndex: 'alamat_user',
      key: 'alamat_user',
      ellipsis: true,
      responsive: ['lg'],
    },
  ];

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 800); // simulasi
  };

  const maxTotal = Math.max(...topLayanan.map((i) => i.total));

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
              style={{ width: 180 }}
              value={filterLayanan}
              onChange={(v) => setFilterLayanan(v)}
              options={[
                { label: 'Konsultasi', value: 'Konsultasi' },
                { label: 'Scaling', value: 'Scaling' },
                { label: 'Tambal Gigi', value: 'Tambal Gigi' },
                { label: 'Cabut Gigi', value: 'Cabut Gigi' },
              ]}
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
            >
              Refresh
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Top summary cards */}
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

      {/* Middle: Left (placeholder chart) + Right (Upcoming) */}
      <Row gutter={[16, 16]}>
        <Col
          xs={24}
          lg={16}
        >
          <Card title='Tren Antrean (7 hari)'>
            {loading ? (
              <Skeleton
                active
                paragraph={{ rows: 6 }}
              />
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
                <Empty description='Grafik belum dihubungkan' />
              </div>
            )}
          </Card>
        </Col>
        <Col
          xs={24}
          lg={8}
        >
          <Card title='Jadwal Terdekat'>
            {loading ? (
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

      {/* Bottom: Left (Table recent) + Right (Top layanan) */}
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
              loading={loading}
              columns={columns as any}
              dataSource={filterLayanan ? dataAntrean.filter((d) => d.layanan === filterLayanan) : dataAntrean}
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
            {topLayanan.map((item) => {
              const percent = Math.round((item.total / maxTotal) * 100);
              return (
                <div
                  key={item.nama}
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
            })}
          </Card>
        </Col>
      </Row>
    </Space>
  );
}

'use client';

import { Table, Space, Button, Empty, Tag, Switch, Tooltip, Typography, Divider } from 'antd';
import { DeleteOutlined, CheckCircleOutlined, EditOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import 'dayjs/locale/id';

dayjs.extend(utc);
dayjs.locale('id');

export type Slot = {
  id_slot: string;
  id_jadwal: string;
  id_dokter: string;
  tanggal: string; // ISO UTC 00:00 dari server
  jam_mulai: string; // ISO anchor UTC (1970-01-01THH:mm:ssZ) dari server
  jam_selesai: string; // ISO anchor UTC (1970-01-01THH:mm:ssZ) dari server
  kapasitas: number;
  terisi: number;
  sisa?: number;
  is_active: boolean;
};

/** Format helper agar konsisten UTC */
function fmtDateUTC(v?: string) {
  return v ? dayjs.utc(v).format('DD MMM YYYY') : '-';
}
function fmtTimeUTC(v?: string) {
  return v ? dayjs.utc(v).format('HH:mm') : '-';
}

export default function SlotPraktikTable({
  aktif,
  nonaktif,
  loading,
  onToggle,
  onDelete,
  onEdit,
}: {
  aktif: Slot[];
  nonaktif: Slot[];
  loading: boolean;
  onToggle: (row: Slot, next: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (row: Slot) => void;
}) {
  const baseCols: any[] = [
    {
      title: 'Tanggal',
      dataIndex: 'tanggal',
      key: 'tanggal',
      width: 140,
      render: (v: string) => fmtDateUTC(v),
    },
    {
      title: 'Jam',
      key: 'jam',
      width: 200,
      render: (_: any, r: Slot) => `${fmtTimeUTC(r.jam_mulai)} - ${fmtTimeUTC(r.jam_selesai)}`,
    },
    {
      title: 'Kuota',
      key: 'kuota',
      width: 280,
      render: (_: any, r: Slot) => {
        const sisa = typeof r.sisa === 'number' ? r.sisa : Math.max(0, r.kapasitas - (r.terisi ?? 0));
        return (
          <Space wrap>
            <Tag>Kapasitas {r.kapasitas}</Tag>
            <Tag color='blue'>Terisi {r.terisi ?? 0}</Tag>
            <Tag color={sisa === 0 ? 'volcano' : 'green'}>Sisa {sisa}</Tag>
          </Space>
        );
      },
    },
  ];

  const colsAktif: any[] = [
    ...baseCols,
    {
      title: 'Status',
      key: 'status',
      width: 160,
      render: (_: any, row: Slot) => (
        <Space>
          <Tag color='green'>Aktif</Tag>
          <Tooltip title='Nonaktifkan'>
            <Switch
              checked
              onChange={(c) => onToggle(row, c)}
            />
          </Tooltip>
        </Space>
      ),
    },
    {
      title: 'Aksi',
      key: 'aksi',
      width: 220,
      render: (_: any, row: Slot) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => onEdit(row)}
          >
            Edit
          </Button>
          <span style={{ color: '#999' }}>—</span>
        </Space>
      ),
    },
  ];

  const colsNonaktif: any[] = [
    ...baseCols,
    {
      title: 'Status',
      key: 'status',
      width: 120,
      render: () => <Tag color='volcano'>Nonaktif</Tag>,
    },
    {
      title: 'Aksi',
      key: 'aksi',
      width: 240,
      render: (_: any, row: Slot) => (
        <Space>
          <Button
            type='primary'
            icon={<CheckCircleOutlined />}
            onClick={() => onToggle(row, true)}
          >
            Aktifkan
          </Button>
          <Button
            icon={<DeleteOutlined />}
            danger
            onClick={() => onDelete(row.id_slot)}
          >
            Hapus
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Space
      direction='vertical'
      size={12}
      style={{ width: '100%' }}
    >
      <Typography.Title
        level={5}
        style={{ margin: 0 }}
      >
        Aktif ({aktif.length})
      </Typography.Title>
      <Table<Slot>
        size='middle'
        rowKey='id_slot'
        loading={loading}
        columns={colsAktif}
        dataSource={aktif}
        pagination={{ pageSize: 10, showSizeChanger: true }}
        locale={{ emptyText: <Empty description='Belum ada slot aktif' /> }}
        scroll={{ x: 760 }}
      />
      <Divider style={{ margin: '12px 0' }} />
      <Typography.Title
        level={5}
        style={{ margin: 0 }}
      >
        Nonaktif ({nonaktif.length})
      </Typography.Title>
      <Table<Slot>
        size='middle'
        rowKey='id_slot'
        loading={loading}
        columns={colsNonaktif}
        dataSource={nonaktif}
        pagination={{ pageSize: 10, showSizeChanger: true }}
        locale={{ emptyText: <Empty description='Belum ada slot nonaktif' /> }}
        scroll={{ x: 760 }}
      />
    </Space>
  );
}

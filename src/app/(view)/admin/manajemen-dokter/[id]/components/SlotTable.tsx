'use client';

import { Table, Space, Button, Empty, Tag, Switch, Tooltip, Typography, Divider } from 'antd';
import { DeleteOutlined, CheckCircleOutlined, EditOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/id';

dayjs.locale('id');

export type Slot = {
  id_slot: string;
  id_jadwal: string;
  id_dokter: string;
  tanggal: string;
  jam_mulai: string;
  jam_selesai: string;
  kapasitas: number;
  terisi: number; // penting
  sisa?: number;
  is_active: boolean;
};

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
  onEdit: (row: Slot) => void; // NEW
}) {
  const baseCols: any[] = [
    { title: 'Tanggal', dataIndex: 'tanggal', key: 'tanggal', width: 140, render: (v: string) => dayjs(v).format('DD MMM YYYY') },
    { title: 'Jam', key: 'jam', width: 200, render: (_: any, r: Slot) => `${dayjs(r.jam_mulai).format('HH:mm')} - ${dayjs(r.jam_selesai).format('HH:mm')}` },
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
    { title: 'Status', key: 'status', width: 120, render: () => <Tag color='volcano'>Nonaktif</Tag> },
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

  // …render 2 table (aktif & nonaktif) sama seperti sebelumnya
  // (biarkan kode render-mu yang lama; fokus perubahan ada di columns di atas)
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

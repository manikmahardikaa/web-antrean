'use client';

import { Table, Space, Button, Popconfirm, Empty } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/id';

dayjs.locale('id');
export type Jadwal = { id_jadwal: string; id_dokter: string; tanggal: string; jam_mulai: string; jam_selesai: string };

export default function JadwalPraktikTable({ data, loading, onDelete, onEdit }: { data: Jadwal[]; loading: boolean; onDelete: (id: string) => void; onEdit: (row: Jadwal) => void }) {
  const cols = [
    { title: 'Tanggal', dataIndex: 'tanggal', key: 'tanggal', render: (v: string) => dayjs(v).format('DD MMM YYYY') },
    { title: 'Jam Mulai', dataIndex: 'jam_mulai', key: 'jam_mulai', render: (v: string) => dayjs(v).format('HH:mm') },
    { title: 'Jam Selesai', dataIndex: 'jam_selesai', key: 'jam_selesai', render: (v: string) => dayjs(v).format('HH:mm') },
    {
      title: 'Aksi',
      key: 'aksi',
      width: 220,
      render: (_: any, row: Jadwal) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => onEdit(row)}
          >
            Edit
          </Button>
          <Popconfirm
            title='Hapus jadwal?'
            okText='Hapus'
            okButtonProps={{ danger: true }}
            onConfirm={() => onDelete(row.id_jadwal)}
          >
            <Button
              icon={<DeleteOutlined />}
              danger
            >
              Hapus
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];
  return (
    <Table<Jadwal>
      rowKey='id_jadwal'
      loading={loading}
      columns={cols as any}
      dataSource={data}
      pagination={{ pageSize: 10, showSizeChanger: true }}
      locale={{ emptyText: <Empty description='Belum ada jadwal' /> }}
      size='middle'
      scroll={{ x: 720 }}
    />
  );
}

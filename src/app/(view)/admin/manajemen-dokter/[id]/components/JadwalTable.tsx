'use client';

import { Table, Space, Button, Popconfirm, Empty } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import 'dayjs/locale/id';

dayjs.extend(utc);
dayjs.locale('id');

export type Jadwal = {
  id_jadwal: string;
  id_dokter: string;
  tanggal: string; // ISO dari server (UTC 00:00)
  jam_mulai: string; // ISO anchor UTC (1970-01-01THH:mm:ssZ) atau time
  jam_selesai: string; // ISO anchor UTC (1970-01-01THH:mm:ssZ) atau time
};

function fmtDateUTC(v?: string) {
  return v ? dayjs.utc(v).format('DD MMM YYYY') : '-';
}
function fmtTimeUTC(v?: string) {
  return v ? dayjs.utc(v).format('HH:mm') : '-';
}

export default function JadwalPraktikTable({ data, loading, onDelete, onEdit }: { data: Jadwal[]; loading: boolean; onDelete: (id: string) => void; onEdit: (row: Jadwal) => void }) {
  const cols = [
    {
      title: 'Tanggal',
      dataIndex: 'tanggal',
      key: 'tanggal',
      render: (v: string) => fmtDateUTC(v),
    },
    {
      title: 'Jam Mulai',
      dataIndex: 'jam_mulai',
      key: 'jam_mulai',
      render: (v: string) => fmtTimeUTC(v),
    },
    {
      title: 'Jam Selesai',
      dataIndex: 'jam_selesai',
      key: 'jam_selesai',
      render: (v: string) => fmtTimeUTC(v),
    },
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

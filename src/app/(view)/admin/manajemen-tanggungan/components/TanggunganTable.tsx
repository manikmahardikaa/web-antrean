'use client';

import { Table, Space, Button, Popconfirm, Empty, Tag, Switch, Tooltip } from 'antd';
import { EditOutlined, DeleteOutlined, CheckCircleOutlined } from '@ant-design/icons';

export type Tanggungan = {
  id_tanggungan: string;
  nama_tanggungan: string;
  is_active?: boolean;
  alasan_nonaktif?: string | null;
  deletedAt?: string | null;
};

type Props = {
  data: Tanggungan[];
  loading: boolean;
  onEdit: (row: Tanggungan) => void;
  onDelete: (id: string) => void; // sekarang: HAPUS PERMANEN
  onToggleActive?: (row: Tanggungan, nextActive: boolean) => void;
  variant?: 'default' | 'inactive';
};

export default function TanggunganTable({ data, loading, onEdit, onDelete, onToggleActive, variant = 'default' }: Props) {
  const isInactiveView = variant === 'inactive';

  const columns: any[] = [
    { title: 'Nama Tanggungan', dataIndex: 'nama_tanggungan', key: 'nama_tanggungan', ellipsis: true },
    ...(isInactiveView
      ? [
          {
            title: 'Alasan Nonaktif',
            dataIndex: 'alasan_nonaktif',
            key: 'alasan_nonaktif',
            ellipsis: true,
            render: (v: string | null) => v || '-',
          },
        ]
      : []),
    {
      title: 'Status',
      key: 'status',
      width: isInactiveView ? 120 : 180,
      render: (_: unknown, row: Tanggungan) => (
        <Space>
          <Tag color={row.is_active ? 'green' : 'volcano'}>{row.is_active ? 'Aktif' : 'Nonaktif'}</Tag>
          {!isInactiveView && onToggleActive && (
            <Tooltip title={row.is_active ? 'Nonaktifkan' : 'Aktifkan'}>
              <Switch
                checked={!!row.is_active}
                onChange={(checked) => onToggleActive(row, checked)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: 'Aksi',
      key: 'aksi',
      width: isInactiveView ? 300 : 160,
      render: (_: unknown, row: Tanggungan) => (
        <Space wrap>
          {isInactiveView ? (
            <>
              <Button
                type='primary'
                icon={<CheckCircleOutlined />}
                onClick={() => onToggleActive?.(row, true)}
              >
                Aktifkan
              </Button>
              <Button
                icon={<EditOutlined />}
                onClick={() => onEdit(row)}
              >
                Edit
              </Button>
              <Popconfirm
                title='Hapus permanen tanggungan?'
                description='Data tidak dapat dipulihkan.'
                okText='Hapus Permanen'
                okButtonProps={{ danger: true }}
                cancelText='Batal'
                onConfirm={() => onDelete(row.id_tanggungan)}
              >
                <Button
                  icon={<DeleteOutlined />}
                  danger
                >
                  Hapus
                </Button>
              </Popconfirm>
            </>
          ) : (
            <Button
              icon={<EditOutlined />}
              onClick={() => onEdit(row)}
            >
              Edit
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Table<Tanggungan>
      size='middle'
      rowKey='id_tanggungan'
      loading={loading}
      columns={columns}
      dataSource={data}
      pagination={{ pageSize: 10, showSizeChanger: true }}
      locale={{ emptyText: <Empty description={isInactiveView ? 'Tidak ada tanggungan nonaktif' : 'Belum ada tanggungan'} /> }}
      scroll={{ x: 720 }}
    />
  );
}

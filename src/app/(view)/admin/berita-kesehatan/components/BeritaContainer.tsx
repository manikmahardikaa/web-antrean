'use client';

import React from 'react';
import { Card, Space, Button, Table, Tag, Image, Popconfirm, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { apiAuth } from '@/utils/apiAuth';
import { ApiEndpoints } from '@/constraints/api-endpoints';
import NewsFormDrawer, { NewsFormValues } from './NewsFormDrawer';

export type Berita = {
  id_berita: string;
  judul: string;
  deskripsi: string;
  tanggal_penerbitan: string; // ISO date from API
  foto_url: string | null;
  createdAt: string;
  updatedAt: string;
};

type ListResp = {
  data: Berita[];
  meta: { page: number; pageSize: number; total: number; pages: number };
};

export type Filters = {
  q: string;
  range: [Dayjs, Dayjs] | null;
};

type Props = {
  filters: Filters;
  refreshToken: number;
};

export default function BeritaContainer({ filters, refreshToken }: Props) {
  const [loading, setLoading] = React.useState(false);
  const [rows, setRows] = React.useState<Berita[]>([]);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [total, setTotal] = React.useState(0);

  const [open, setOpen] = React.useState(false);
  const [drawerLoading, setDrawerLoading] = React.useState(false);
  const [editing, setEditing] = React.useState<Berita | null>(null);

  const load = React.useCallback(async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (filters.q.trim()) params.set('q', filters.q.trim());
      if (filters.range?.[0]) params.set('from', filters.range[0]!.format('YYYY-MM-DD'));
      if (filters.range?.[1]) params.set('to', filters.range[1]!.format('YYYY-MM-DD'));
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));
      params.set('sort', 'recent');

      const url = `${ApiEndpoints.GetBerita}?${params.toString()}`;
      const json = await apiAuth.getDataPrivate<ListResp>(url);

      if (json && 'isExpiredJWT' in json) {
        return;
      }

      if (json) {
        setRows(json.data);
        setTotal(json.meta.total);
      }
    } catch (e: any) {
      message.error(e?.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, [filters, page, pageSize]);

  React.useEffect(() => {
    void load();
  }, [load, refreshToken]);

  const handleSubmit = async (values: NewsFormValues, file?: File | null) => {
    try {
      setDrawerLoading(true);

      const isEdit = !!editing?.id_berita;
      const url = isEdit ? ApiEndpoints.UpdateBerita(editing!.id_berita) : ApiEndpoints.CreateBerita;

      const fd = new FormData();
      fd.append('judul', values.judul);
      fd.append('deskripsi', values.deskripsi);
      fd.append('tanggal_penerbitan', dayjs(values.tanggal_penerbitan).format('YYYY-MM-DD'));
      if (file) fd.append('file', file);

      if (isEdit) {
        await apiAuth.putDataPrivateWithFile(url, fd);
      } else {
        await apiAuth.postDataPrivateWithFile(url, fd);
      }

      message.success(isEdit ? 'Berita diperbarui' : 'Berita ditambahkan');
      setOpen(false);
      setEditing(null);
      await load();
    } catch (e: any) {
      message.error(e?.message || 'Gagal menyimpan');
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setLoading(true);
      await apiAuth.deleteDataPrivate(ApiEndpoints.DeleteBerita(id));
      message.success('Berita dihapus');
      if (rows.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        await load();
      }
    } catch (e: any) {
      message.error(e?.message || 'Gagal menghapus data');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Tanggal',
      dataIndex: 'tanggal_penerbitan',
      key: 'tanggal',
      width: 150,
      render: (v: string) => dayjs(v).format('DD MMM YYYY'),
      sorter: (a: Berita, b: Berita) => dayjs(a.tanggal_penerbitan).valueOf() - dayjs(b.tanggal_penerbitan).valueOf(),
    },
    {
      title: 'Judul',
      dataIndex: 'judul',
      key: 'judul',
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: 'Deskripsi',
      dataIndex: 'deskripsi',
      key: 'deskripsi',
      ellipsis: true,
      render: (html: string) => <div dangerouslySetInnerHTML={{ __html: html }} />,
    },
    {
      title: 'Gambar',
      dataIndex: 'foto_url',
      key: 'foto',
      width: 120,
      render: (url: string | null) =>
        url ? (
          <Image
            width={80}
            src={url}
            alt='news'
          />
        ) : (
          <Tag color='default'>Tidak ada</Tag>
        ),
    },
    {
      title: 'Dibuat',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (v: string) => dayjs(v).format('DD MMM YYYY HH:mm'),
    },
    {
      title: 'Aksi',
      key: 'aksi',
      width: 200,
      render: (_: any, row: Berita) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => {
              setEditing(row);
              setOpen(true);
            }}
          >
            Edit
          </Button>
          <Popconfirm
            title='Hapus berita ini?'
            okText='Hapus'
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(row.id_berita)}
          >
            <Button
              danger
              icon={<DeleteOutlined />}
            >
              Hapus
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          type='primary'
          icon={<PlusOutlined />}
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          Tambah Berita
        </Button>
      </div>

      <Card style={{ marginTop: 8 }}>
        <Table<Berita>
          rowKey='id_berita'
          loading={loading}
          columns={columns as any}
          dataSource={rows}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
          scroll={{ x: 900 }}
        />
      </Card>

      <NewsFormDrawer
        open={open}
        loading={drawerLoading}
        initial={
          editing
            ? {
                judul: editing.judul,
                deskripsi: editing.deskripsi,
                tanggal_penerbitan: dayjs(editing.tanggal_penerbitan),
                foto_url: editing.foto_url || null,
              }
            : null
        }
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        onSubmit={(values, file) => handleSubmit(values, file)}
      />
    </>
  );
}

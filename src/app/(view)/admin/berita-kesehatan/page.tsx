'use client';

import React from 'react';
import { Card, Space, Button, Table, Tag, Image, Input, DatePicker, Popconfirm, message, Typography, Flex } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import NewsFormDrawer, { NewsFormValues } from './components/NewsFormDrawer';

type Berita = {
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

const { RangePicker } = DatePicker;

export default function AdminBeritaPage() {
  const [loading, setLoading] = React.useState(false);
  const [rows, setRows] = React.useState<Berita[]>([]);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [total, setTotal] = React.useState(0);

  const [q, setQ] = React.useState('');
  const [range, setRange] = React.useState<[Dayjs | null, Dayjs | null] | null>(null);

  // Drawer
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Berita | null>(null);

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (q.trim()) params.set('q', q.trim());
      if (range?.[0]) params.set('from', range[0]!.format('YYYY-MM-DD'));
      if (range?.[1]) params.set('to', range[1]!.format('YYYY-MM-DD'));
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));
      params.set('sort', 'recent');

      const res = await fetch(`/api/berita?${params.toString()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error((await res.json()).message || 'Gagal memuat berita');
      const json: ListResp = await res.json();
      setRows(json.data);
      setTotal(json.meta.total);
    } catch (e: any) {
      message.error(e?.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, [q, range, page, pageSize]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const resetFilter = () => {
    setQ('');
    setRange(null);
    setPage(1);
    setPageSize(10);
  };

  const onCreate = () => {
    setEditing(null);
    setOpen(true);
  };

  const onEdit = (row: Berita) => {
    setEditing(row);
    setOpen(true);
  };

  const onDelete = async (id: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/berita/${id}`, { method: 'DELETE' });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.message || 'Gagal menghapus');
      message.success('Berita dihapus');
      // jika page jadi kosong setelah delete, mundurkan halaman
      if (rows.length === 1 && page > 1) setPage((p) => p - 1);
      await load();
    } catch (e: any) {
      message.error(e?.message || 'Gagal menghapus data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: NewsFormValues, file?: File | null) => {
    try {
      setLoading(true);

      const isEdit = !!editing?.id_berita;
      const url = isEdit ? `/api/berita/${editing!.id_berita}` : '/api/berita';
      const method = isEdit ? 'PUT' : 'POST';

      if (file) {
        const fd = new FormData();
        fd.append('judul', values.judul);
        fd.append('deskripsi', values.deskripsi);
        fd.append('tanggal_penerbitan', dayjs(values.tanggal_penerbitan).format('YYYY-MM-DD'));
        fd.append('file', file);
        const res = await fetch(url, { method, body: fd });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(j?.message || 'Gagal menyimpan data');
      } else {
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            judul: values.judul,
            deskripsi: values.deskripsi,
            tanggal_penerbitan: dayjs(values.tanggal_penerbitan).format('YYYY-MM-DD'),
            // foto_url: undefined -> server tidak mengubah jika tidak dikirim
          }),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(j?.message || 'Gagal menyimpan data');
      }

      message.success(isEdit ? 'Berita diperbarui' : 'Berita ditambahkan');
      setOpen(false);
      setEditing(null);
      await load();
    } catch (e: any) {
      message.error(e?.message || 'Gagal menyimpan');
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
            onClick={() => onEdit(row)}
          >
            Edit
          </Button>
          <Popconfirm
            title='Hapus berita ini?'
            okText='Hapus'
            okButtonProps={{ danger: true }}
            onConfirm={() => onDelete(row.id_berita)}
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
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onPressEnter={() => {
                setPage(1);
                void load();
              }}
              style={{ width: 260 }}
            />
            <RangePicker
              value={range ?? null}
              onChange={(v) => setRange(v as any)}
              style={{ width: 280 }}
              allowClear
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                setPage(1);
                void load();
              }}
            >
              Refresh
            </Button>
            <Button onClick={resetFilter}>Reset</Button>
            <Button
              type='primary'
              icon={<PlusOutlined />}
              onClick={onCreate}
            >
              Tambah Berita
            </Button>
          </Space>
        </Flex>
      </Card>

      <Card>
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
        loading={loading}
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
        onSubmit={handleSubmit}
      />
    </Space>
  );
}

'use client';

import React from 'react';
import { Card, Space, Button, Input, DatePicker, Typography, Flex, Table, Tag, Image, Popconfirm, message } from 'antd';
import { PlusOutlined, ReloadOutlined, SearchOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import BeritaContainer, { Filters, Berita } from './components/BeritaContainer';
import NewsFormDrawer, { NewsFormValues } from './components/NewsFormDrawer';
import { apiAuth } from '@/utils/apiAuth';
import { ApiEndpoints } from '@/constraints/api-endpoints';

const { RangePicker } = DatePicker;

export default function AdminBeritaPage() {
  const [filters, setFilters] = React.useState<Filters>({ q: '', range: null });
  const [refreshToken, setRefreshToken] = React.useState(0);

  const [open, setOpen] = React.useState(false);
  const [drawerLoading, setDrawerLoading] = React.useState(false);
  const [editing, setEditing] = React.useState<Berita | null>(null);

  const [rows, setRows] = React.useState<Berita[]>([]);
  const [tableLoading, setTableLoading] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [total, setTotal] = React.useState(0);

  const resetFilter = () => {
    setFilters({ q: '', range: null });
    setRefreshToken((t) => t + 1);
  };

  const handleFilterChange = (changed: Partial<Filters>) => {
    setFilters((prev) => ({ ...prev, ...changed }));
  };

  const handleEditNews = (news: Berita) => {
    setEditing(news);
    setOpen(true);
  };

  const handleDataLoaded = React.useCallback((data: Berita[], totalCount: number, currentPage: number, currentPageSize: number) => {
    setRows(data);
    setTotal(totalCount);
    setPage(currentPage);
    setPageSize(currentPageSize);
  }, []);

  const handleLoadingChange = React.useCallback((loading: boolean) => {
    setTableLoading(loading);
  }, []);

  // Create / Update
  const handleSubmitNews = async (
    values: NewsFormValues, // { judul: string, deskripsi: HTML string, tanggal_penerbitan: Dayjs }
    file?: File | null,
    editingNews?: Berita | null
  ) => {
    try {
      setDrawerLoading(true);

      const isEdit = !!editingNews?.id_berita;
      const url = isEdit ? ApiEndpoints.UpdateBerita(editingNews!.id_berita) : ApiEndpoints.CreateBerita;

      const fd = new FormData();
      fd.append('judul', values.judul);
      fd.append('deskripsi', values.deskripsi); // WYSIWYG HTML
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

      // refresh data (tetap di halaman aktif)
      setRefreshToken((t) => t + 1);
    } catch (e: any) {
      message.error(e?.message || 'Gagal menyimpan');
    } finally {
      setDrawerLoading(false);
    }
  };

  // Delete
  const handleDeleteNews = async (id: string) => {
    try {
      setTableLoading(true);
      await apiAuth.deleteDataPrivate(ApiEndpoints.DeleteBerita(id));
      message.success('Berita dihapus');

      // jika item terakhir di halaman & bukan halaman pertama → mundur 1 halaman
      if (rows.length === 1 && page > 1) {
        setPage(page - 1);
      }

      setRefreshToken((t) => t + 1);
    } catch (e: any) {
      message.error(e?.message || 'Gagal menghapus data');
    } finally {
      setTableLoading(false);
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
            onClick={() => handleEditNews(row)}
          >
            Edit
          </Button>
          <Popconfirm
            title='Hapus berita ini?'
            okText='Hapus'
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDeleteNews(row.id_berita)}
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
          </Space>
        </Flex>
      </Card>

      {/* Loader & sinkronisasi tabel */}
      <BeritaContainer
        filters={filters}
        refreshToken={refreshToken}
        onEditNews={handleEditNews}
        onDataLoaded={handleDataLoaded}
        onLoadingChange={handleLoadingChange}
        onPageChange={(p, ps) => {
          setPage(p);
          setPageSize(ps);
        }}
        currentPage={page}
        currentPageSize={pageSize}
        // dikirim untuk konsistensi API; container fokus fetch
        onSubmitNews={handleSubmitNews}
        onDeleteNews={handleDeleteNews}
      />

      <Card>
        <Table<Berita>
          rowKey='id_berita'
          loading={tableLoading}
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
                deskripsi: editing.deskripsi, // HTML string untuk WYSIWYG
                tanggal_penerbitan: dayjs(editing.tanggal_penerbitan),
                foto_url: editing.foto_url || null,
              }
            : null
        }
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        onSubmit={(values, file) => handleSubmitNews(values, file, editing)}
      />
    </Space>
  );
}

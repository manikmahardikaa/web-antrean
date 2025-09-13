'use client';

import React from 'react';
import { Card, Table, Tag, Popconfirm, message, Button, Space, Tooltip } from 'antd';
import { EditOutlined, DeleteOutlined, LinkOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import VideoFormDrawer, { VideoFormValues } from './VideoFormDrawer';
import { apiAuth } from '@/utils/apiAuth';
import { ApiEndpoints } from '@/constraints/api-endpoints';

type Video = {
  id_video: string;
  judul: string;
  deskripsi: string;
  tanggal_penerbitan: string; // ISO date from API
  video_url: string | null;
  createdAt: string;
  updatedAt: string;
};

type ListResp = {
  data: Video[];
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

export default function VideoContainer({ filters, refreshToken }: Props) {
  const [loading, setLoading] = React.useState(false);
  const [rows, setRows] = React.useState<Video[]>([]);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [total, setTotal] = React.useState(0);

  // Drawer
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Video | null>(null);

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

      const url = `${ApiEndpoints.GetVideo}?${params.toString()}`;
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

  const onEdit = (row: Video) => {
    setEditing(row);
    setOpen(true);
  };

  const onDelete = async (id: string) => {
    try {
      setLoading(true);
      await apiAuth.deleteDataPrivate(ApiEndpoints.DeleteVideo(id));
      message.success('Video dihapus');
      if (rows.length === 1 && page > 1) setPage((p) => p - 1);
      else await load();
    } catch (e: any) {
      message.error(e?.message || 'Gagal menghapus data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: VideoFormValues, file?: File | null) => {
    try {
      setLoading(true);

      const isEdit = !!editing?.id_video;
      const url = isEdit ? ApiEndpoints.UpdateVideo(editing!.id_video) : ApiEndpoints.CreateVideo;

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

      message.success(isEdit ? 'Video diperbarui' : 'Video ditambahkan');
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
      sorter: (a: Video, b: Video) => dayjs(a.tanggal_penerbitan).valueOf() - dayjs(b.tanggal_penerbitan).valueOf(),
    },
    {
      title: 'Judul',
      dataIndex: 'judul',
      key: 'judul',
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: 'URL Video',
      dataIndex: 'video_url',
      key: 'video',
      width: 120,
      render: (url: string | null) =>
        url ? (
          <Tooltip title={url}>
            <a
              href={url}
              target='_blank'
              rel='noopener noreferrer'
            >
              <LinkOutlined /> Link
            </a>
          </Tooltip>
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
      render: (_: any, row: Video) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => onEdit(row)}
          >
            Edit
          </Button>
          <Popconfirm
            title='Hapus video ini?'
            okText='Hapus'
            okButtonProps={{ danger: true }}
            onConfirm={() => onDelete(row.id_video)}
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
      <Card>
        <Table<Video>
          rowKey='id_video'
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

      <VideoFormDrawer
        open={open}
        loading={loading}
        initial={
          editing
            ? {
                judul: editing.judul,
                deskripsi: editing.deskripsi,
                tanggal_penerbitan: dayjs(editing.tanggal_penerbitan),
                video_url: editing.video_url || null,
              }
            : null
        }
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        onSubmit={handleSubmit}
      />
    </>
  );
}

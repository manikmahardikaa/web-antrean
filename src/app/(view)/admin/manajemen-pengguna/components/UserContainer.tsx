'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Table, Space, Button, Tag, message, Empty, Popconfirm, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, InfoCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { apiAuth } from '@/utils/apiAuth';
import { ApiEndpoints } from '@/constraints/api-endpoints';
import UserFormDrawer from './UserFormDrawer';
import UserDetailDrawer from './UserDetailDrawer';
import { getGenderLabel, matchesGenderFilter } from './gender';
import 'dayjs/locale/id';

const { Text } = Typography;
dayjs.locale('id');

export type Role = 'USER' | 'ADMIN';

export type UserRow = {
  id_user: string;
  nama: string;
  email: string;
  tanggal_lahir: string; // ISO
  jenis_kelamin: string; // 'L' | 'P' atau string lain
  no_telepon: string;
  alamat?: string | null;
  role: Role;
  id_layanan?: string | null;
  id_tanggungan?: string | null;

  layanan?: { id_layanan: string; nama_layanan: string } | null;
  tanggungan?: { id_tanggungan: string; nama_tanggungan: string } | null;
};

type Option = { label: string; value: string };
type Filters = {
  query: string;
  roleFilter: 'ALL' | 'USER' | 'ADMIN';
  genderFilter: 'ALL' | 'Pria' | 'Wanita';
  layananFilter?: string;
  tanggunganFilter?: string;
};

export default function UserContainer({ filters, layananOpts, tanggunganOpts, refreshToken }: { filters: Filters; layananOpts: Option[]; tanggunganOpts: Option[]; refreshToken: number }) {
  const { query, roleFilter, genderFilter, layananFilter, tanggunganFilter } = filters;

  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<UserRow[]>([]);

  // Drawer/Form state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);

  // Detail
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRow, setDetailRow] = useState<UserRow | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const data = await apiAuth.getDataPrivate(ApiEndpoints.GetUsers);
      if (!Array.isArray(data)) throw new Error(data?.message || 'Gagal memuat pengguna');
      setList(data);
    } catch (e: any) {
      message.error(e?.message || 'Terjadi kesalahan saat memuat');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshToken]);

  // Filter client-side (boleh diganti server-side kalau endpoint mendukung)
  const data = useMemo(() => {
    const q = query.toLowerCase();
    return list
      .filter((r) => (roleFilter === 'ALL' ? true : r.role === roleFilter))
      .filter((r) => matchesGenderFilter(r.jenis_kelamin, genderFilter))
      .filter((r) => (!layananFilter ? true : r.id_layanan === layananFilter))
      .filter((r) => (!tanggunganFilter ? true : r.id_tanggungan === tanggunganFilter))
      .filter((r) => {
        if (!q) return true;
        return [r.nama, r.email, r.no_telepon, r.alamat, r.layanan?.nama_layanan, r.tanggungan?.nama_tanggungan].filter(Boolean).some((v) => String(v).toLowerCase().includes(q));
      });
  }, [list, query, roleFilter, genderFilter, layananFilter, tanggunganFilter]);

  const fmtDate = (iso?: string) => (iso ? dayjs(iso).format('DD MMM YYYY') : '-');

  const columns = [
    { title: 'Nama', dataIndex: 'nama', key: 'nama', ellipsis: true },
    { title: 'Email', dataIndex: 'email', key: 'email', ellipsis: true, responsive: ['md'] as const },
    { title: 'No. Telepon', dataIndex: 'no_telepon', key: 'no_telepon', width: 140, responsive: ['lg'] as const },
    {
      title: 'JK',
      dataIndex: 'jenis_kelamin',
      key: 'jenis_kelamin',
      width: 80,
      align: 'center' as const,
      render: (_: string, row: UserRow) => getGenderLabel(row.jenis_kelamin) || '-',
    },
    { title: 'Tgl Lahir', dataIndex: 'tanggal_lahir', key: 'tanggal_lahir', width: 140, render: fmtDate, responsive: ['md'] as const },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      width: 110,
      align: 'center' as const,
      render: (r: Role) => <Tag color={r === 'ADMIN' ? 'magenta' : 'blue'}>{r}</Tag>,
    },
    {
      title: 'Layanan',
      key: 'layanan',
      render: (_: unknown, row: UserRow) => row.layanan?.nama_layanan || '-',
      ellipsis: true,
      responsive: ['lg'] as const,
    },
    {
      title: 'Tanggungan',
      key: 'tanggungan',
      render: (_: unknown, row: UserRow) => row.tanggungan?.nama_tanggungan || '-',
      ellipsis: true,
      responsive: ['xl'] as const,
    },
    {
      title: 'Aksi',
      key: 'aksi',
      width: 280,
      render: (_: unknown, row: UserRow) => (
        <Space>
          <Button
            icon={<InfoCircleOutlined />}
            onClick={() => {
              setDetailRow(row);
              setDetailOpen(true);
            }}
          >
            Detail
          </Button>
          <Button
            icon={<EditOutlined />}
            onClick={() => {
              setEditing(row);
              setDrawerOpen(true);
            }}
          >
            Edit
          </Button>
          <Popconfirm
            title='Hapus pengguna ini?'
            okText='Hapus'
            okButtonProps={{ danger: true }}
            cancelText='Batal'
            onConfirm={async () => {
              try {
                setLoading(true);
                const res = await apiAuth.deleteDataPrivate(ApiEndpoints.DeleteUser(row.id_user));
                if (res?.ok === false) throw new Error(res?.message || 'Gagal menghapus');
                message.success('Pengguna dihapus');
                await load();
              } catch (e: any) {
                message.error(e?.message || 'Terjadi kesalahan');
              } finally {
                setLoading(false);
              }
            }}
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

  // Submit form tambah/edit
  const submit = async (values: {
    nama: string;
    email: string;
    password?: string;
    tanggal_lahir: string; // ISO
    jenis_kelamin: string;
    no_telepon: string;
    alamat?: string | null;
    role: Role;
    id_layanan?: string | null;
    id_tanggungan?: string | null;
  }) => {
    try {
      setLoading(true);
      const payload = { ...values };
      // pada edit: kalau password kosong, hapus agar tidak update
      if (!payload.password) delete (payload as any).password;

      const res = editing ? await apiAuth.putDataPrivate(ApiEndpoints.UpdateUser(editing.id_user), payload) : await apiAuth.postDataPrivate(ApiEndpoints.CreateUser, payload);

      if (res?.ok === false || (!res?.id_user && !editing)) throw new Error(res?.message || 'Gagal menyimpan');
      message.success(editing ? 'Pengguna diperbarui' : 'Pengguna ditambahkan');
      setDrawerOpen(false);
      setEditing(null);
      await load();
    } catch (e: any) {
      message.error(e?.message || 'Terjadi kesalahan saat menyimpan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <Button
          type='primary'
          icon={<PlusOutlined />}
          onClick={() => {
            setEditing(null);
            setDrawerOpen(true);
          }}
        >
          Tambah Pengguna
        </Button>
      </div>

      <Table<UserRow>
        size='middle'
        rowKey='id_user'
        loading={loading}
        columns={columns as any}
        dataSource={data}
        pagination={{ pageSize: 10, showSizeChanger: true }}
        scroll={{ x: 1100 }}
        locale={{
          emptyText: <Empty description={list.length ? 'Tidak ada data sesuai filter' : 'Belum ada pengguna'} />,
        }}
      />

      <UserFormDrawer
        open={drawerOpen}
        loading={loading}
        editing={editing}
        layananOpts={layananOpts}
        tanggunganOpts={tanggunganOpts}
        onClose={() => {
          setDrawerOpen(false);
          setEditing(null);
        }}
        onSubmit={submit}
      />

      <UserDetailDrawer
        open={detailOpen}
        row={detailRow}
        onClose={() => setDetailOpen(false)}
      />
    </>
  );
}

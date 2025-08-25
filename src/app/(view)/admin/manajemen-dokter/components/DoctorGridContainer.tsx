'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, Row, Col, Input, Space, Button, Tag, Typography, message, Popconfirm } from 'antd';
import { PlusOutlined, SearchOutlined, ReloadOutlined, CheckCircleOutlined, StopOutlined, DeleteOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import DokterFormDrawer from './DoctorFormDrawer';
import { apiAuth } from '@/utils/apiAuth';
import { ApiEndpoints } from '@/constraints/api-endpoints';

const { Meta } = Card;
const { Title } = Typography;
const { Search } = Input;

type Dokter = {
  id_dokter: string;
  nama_dokter: string;
  spesialisasi: string;
  is_active: boolean;
  alasan_nonaktif?: string | null;
};

export default function DokterGridContainer() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<Dokter[]>([]);
  const [query, setQuery] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Dokter | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const sp = new URLSearchParams();
      if (query) sp.set('q', query);
      sp.set('status', 'all');
      const data = await apiAuth.getDataPrivate(`${ApiEndpoints.GetDokter}?${sp.toString()}`);
      if (!Array.isArray(data)) throw new Error(data?.message || 'Gagal memuat dokter');
      setList(data);
    } catch (e: any) {
      message.error(e?.message || 'Terjadi kesalahan saat memuat');
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!query) return list;
    const q = query.toLowerCase();
    return list.filter((d) => d.nama_dokter.toLowerCase().includes(q) || d.spesialisasi.toLowerCase().includes(q));
  }, [list, query]);

  const aktif = useMemo(() => filtered.filter((d) => d.is_active), [filtered]);
  const nonaktif = useMemo(() => filtered.filter((d) => !d.is_active), [filtered]);

  const openCreate = () => {
    setEditing(null);
    setDrawerOpen(true);
  };
  const closeDrawer = () => {
    setEditing(null);
    setDrawerOpen(false);
  };

  // components/Dokter/DoctorGridContainer.tsx

  const submit = async (values: { nama_dokter: string; spesialisasi: string }, file?: File | null) => {
    try {
      setLoading(true);

      // siapkan FormData untuk JSON + (opsional) file
      const fd = new FormData();
      fd.append('nama_dokter', values.nama_dokter.trim());
      fd.append('spesialisasi', values.spesialisasi.trim());
      if (file) fd.append('file', file); // server sudah validasi 2MB & mime

      // create vs update
      let res;
      if (editing) {
        res = await apiAuth.putDataPrivateWithFile(ApiEndpoints.UpdateDokter(editing.id_dokter), fd);
      } else {
        res = await apiAuth.postDataPrivateWithFile(ApiEndpoints.CreateDokter, fd);
      }

      if (res?.ok === false) throw new Error(res?.message || 'Gagal menyimpan data dokter');

      message.success(editing ? 'Dokter diperbarui' : 'Dokter ditambahkan');
      await load();
      closeDrawer();
    } catch (e: any) {
      message.error(e?.message || 'Gagal menyimpan');
    } finally {
      setLoading(false);
    }
  };

  const deletePermanent = async (id_dokter: string) => {
    try {
      setLoading(true);
      const res = await apiAuth.deleteDataPrivate(ApiEndpoints.DeleteDokter(id_dokter));
      if (res?.message && res?.ok !== true) throw new Error(res.message);
      message.success('Dokter dihapus permanen');
      await load();
    } catch (e: any) {
      message.error(e?.message || 'Tidak bisa menghapus dokter');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Space
      direction='vertical'
      size={16}
      style={{ width: '100%' }}
    >
      <Row
        justify='space-between'
        gutter={[16, 16]}
      >
        <Col flex='auto'>
          <Space wrap>
            <Search
              allowClear
              placeholder='Cari nama/spesialisasi…'
              enterButton={<SearchOutlined />}
              onSearch={setQuery}
              onChange={(e) => setQuery(e.target.value)}
              style={{ width: 320, maxWidth: '100%' }}
              value={query}
            />
          </Space>
        </Col>
        <Col>
          <Button
            icon={<ReloadOutlined />}
            onClick={load}
            loading={loading}
          >
            Refresh
          </Button>
        </Col>
      </Row>

      {/* Card Tambah */}
      <Row gutter={[16, 16]}>
        <Col
          xs={24}
          sm={12}
          md={8}
          lg={6}
          xl={6}
        >
          <Card
            hoverable
            onClick={openCreate}
            style={{ height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed' }}
            bodyStyle={{ textAlign: 'center' }}
          >
            <Space
              direction='vertical'
              align='center'
            >
              <PlusOutlined style={{ fontSize: 28 }} />
              <div>Tambah Dokter</div>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Dokter Aktif */}
      <Title
        level={5}
        style={{ margin: '8px 0 0' }}
      >
        Dokter Aktif ({aktif.length})
      </Title>
      <Row gutter={[16, 16]}>
        {aktif.map((d) => (
          <Col
            key={d.id_dokter}
            xs={24}
            sm={12}
            md={8}
            lg={6}
            xl={6}
          >
            <Card
              hoverable
              onClick={() => router.push(`/admin/manajemen-dokter/${d.id_dokter}`)}
            >
              <Meta
                title={
                  <Space>
                    {d.nama_dokter}
                    <Tag
                      color='success'
                      icon={<CheckCircleOutlined />}
                    >
                      Aktif
                    </Tag>
                  </Space>
                }
                description={d.spesialisasi}
              />
            </Card>
          </Col>
        ))}
        {aktif.length === 0 && (
          <Col span={24}>
            <Tag>Belum ada dokter aktif</Tag>
          </Col>
        )}
      </Row>

      {/* Dokter Nonaktif */}
      <Title
        level={5}
        style={{ margin: '8px 0 0' }}
      >
        Dokter Nonaktif ({nonaktif.length})
      </Title>
      <Row gutter={[16, 16]}>
        {nonaktif.map((d) => (
          <Col
            key={d.id_dokter}
            xs={24}
            sm={12}
            md={8}
            lg={6}
            xl={6}
          >
            <Card
              hoverable
              onClick={() => router.push(`/admin/manajemen-dokter/${d.id_dokter}`)}
              actions={[
                <div
                  key='delete-action'
                  onClick={(e) => e.stopPropagation()} // Blok event klik agar tidak trigger navigasi
                  style={{ display: 'flex', justifyContent: 'center' }} // Agar tombol tetap di tengah
                >
                  <Popconfirm
                    title='Hapus dokter secara permanen?'
                    okText='Hapus'
                    okButtonProps={{ danger: true }}
                    cancelText='Batal'
                    onConfirm={(e) => {
                      e?.preventDefault?.();
                      void deletePermanent(d.id_dokter);
                    }}
                  >
                    <Button
                      danger
                      type='text'
                      icon={<DeleteOutlined />}
                      onClick={(e) => e.stopPropagation()} // Tambahan safety
                    >
                      Hapus
                    </Button>
                  </Popconfirm>
                </div>,
              ]}
            >
              <Meta
                title={
                  <Space>
                    {d.nama_dokter}
                    <Tag icon={<StopOutlined />}>Nonaktif</Tag>
                  </Space>
                }
                description={d.spesialisasi}
              />
            </Card>
          </Col>
        ))}
        {nonaktif.length === 0 && (
          <Col span={24}>
            <Tag>Belum ada dokter nonaktif</Tag>
          </Col>
        )}
      </Row>

      <DokterFormDrawer
        open={drawerOpen}
        loading={loading}
        editing={editing}
        onClose={closeDrawer}
        onSubmit={submit}
      />
    </Space>
  );
}

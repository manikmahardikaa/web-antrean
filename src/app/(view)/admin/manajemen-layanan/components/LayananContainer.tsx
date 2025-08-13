/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Space, Row, Col, message, Modal, Input, Typography, Divider } from 'antd';
import LayananSearchBar from './LayananSearchBar';
import LayananTable, { Layanan } from './LayananTable';
import LayananFormDrawer from './LayananFormDrawer';
import { apiAuth } from '@/utils/apiAuth';
import { ApiEndpoints } from '@/constraints/api-endpoints';

const { TextArea } = Input;
const { Title } = Typography;

// normalisasi supaya aman kalau backend kirim "1"/"0" atau boolean
const toBool = (v: any) => {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v === 1;
  if (typeof v === 'string') return ['1', 'true', 't', 'ya', 'aktif'].includes(v.toLowerCase());
  return !!v;
};
function normalizeLayanan(raw: any): Layanan {
  return {
    id_layanan: raw.id_layanan,
    nama_layanan: raw.nama_layanan,
    is_active: toBool(raw.is_active),
    alasan_nonaktif: raw.alasan_nonaktif ?? null,
    deletedAt: raw.deletedAt ?? null,
  };
}

export default function LayananContainer() {
  const [loading, setLoading] = useState(false);
  const [aktifList, setAktifList] = useState<Layanan[]>([]);
  const [nonaktifList, setNonaktifList] = useState<Layanan[]>([]);
  const [query, setQuery] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Layanan | null>(null);

  const buildUrl = (status: 'active' | 'inactive' | 'all') => {
    const sp = new URLSearchParams();
    if (query) sp.set('q', query);
    sp.set('status', status);
    return `${ApiEndpoints.GetLayanan}?${sp.toString()}`;
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [act, inact] = await Promise.all([apiAuth.getDataPrivate(buildUrl('active')).catch(() => null), apiAuth.getDataPrivate(buildUrl('inactive')).catch(() => null)]);

      if (Array.isArray(act) && Array.isArray(inact)) {
        setAktifList(act.map(normalizeLayanan));
        setNonaktifList(inact.map(normalizeLayanan));
        return;
      }

      // Fallback: server belum dukung status -> ambil all lalu pisahkan
      const all = await apiAuth.getDataPrivate(buildUrl('all'));
      if (!Array.isArray(all)) throw new Error(all?.message || 'Gagal memuat data');
      const items = all.map(normalizeLayanan);
      setAktifList(items.filter((x) => x.is_active && !x.deletedAt));
      setNonaktifList(items.filter((x) => !x.is_active || !!x.deletedAt));
    } catch (e: any) {
      message.error(e?.message || 'Terjadi kesalahan saat memuat');
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    load();
  }, [load]);

  // UI handlers
  const openCreate = () => {
    setEditing(null);
    setDrawerOpen(true);
  };
  const openEdit = (row: Layanan) => {
    setEditing(row);
    setDrawerOpen(true);
  };
  const closeDrawer = () => {
    setEditing(null);
    setDrawerOpen(false);
  };

  // Submit (POST / PUT)
  const submitLayanan = async (values: { nama_layanan: string }) => {
    try {
      setLoading(true);
      const payload = { nama_layanan: values.nama_layanan.trim() };
      const res = editing ? await apiAuth.putDataPrivate(ApiEndpoints.UpdateLayanan(editing.id_layanan), payload) : await apiAuth.postDataPrivate(ApiEndpoints.CreateLayanan, payload);

      if (res?.message && res?.ok !== true && !res?.id_layanan) {
        throw new Error(res.message);
      }
      message.success(editing ? 'Layanan diperbarui' : 'Layanan ditambahkan');
      await load();
      closeDrawer();
    } catch (e: any) {
      message.error(e?.message || 'Gagal menyimpan data');
    } finally {
      setLoading(false);
    }
  };

  const deleteLayanan = async (id_layanan: string) => {
    try {
      setLoading(true);
      const res = await apiAuth.deleteDataPrivate(ApiEndpoints.DeleteLayanan(id_layanan));
      if (res?.message && res?.ok !== true) throw new Error(res.message);
      message.success('Layanan dihapus permanen');
      await load();
    } catch (e: any) {
      message.error(e?.message || 'Tidak bisa menghapus permanen (mungkin masih dipakai)');
    } finally {
      setLoading(false);
    }
  };

  // Toggle aktif/nonaktif
  const toggleActive = (row: Layanan, nextActive: boolean) => {
    if (nextActive) {
      setLoading(true);
      apiAuth
        .putDataPrivate(ApiEndpoints.UpdateLayanan(row.id_layanan), { is_active: true })
        .then((res) => {
          if (res?.message && res?.id_layanan === undefined) throw new Error(res.message);
          message.success('Layanan diaktifkan');
          return load();
        })
        .catch((e: any) => message.error(e?.message || 'Gagal mengaktifkan layanan'))
        .finally(() => setLoading(false));
      return;
    }

    let reason = '';
    Modal.confirm({
      title: `Nonaktifkan "${row.nama_layanan}"?`,
      content: (
        <div>
          <p>Berikan alasan nonaktif (opsional):</p>
          <TextArea
            placeholder='Contoh: Tidak tersedia sementara'
            maxLength={200}
            autoSize={{ minRows: 2 }}
            onChange={(e) => {
              reason = e.target.value;
            }}
          />
        </div>
      ),
      okText: 'Nonaktifkan',
      okButtonProps: { danger: true },
      cancelText: 'Batal',
      async onOk() {
        try {
          setLoading(true);
          const res = await apiAuth.putDataPrivate(ApiEndpoints.UpdateLayanan(row.id_layanan), {
            is_active: false,
            alasan_nonaktif: reason?.trim() || 'Nonaktif manual',
          });
          if (res?.message && res?.id_layanan === undefined) throw new Error(res.message);
          message.success('Layanan dinonaktifkan');
          await load();
        } catch (e: any) {
          message.error(e?.message || 'Gagal menonaktifkan layanan');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // di LayananContainer

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
        <Col>
          <LayananSearchBar
            query={query}
            onQueryChange={setQuery}
            onAdd={openCreate}
            onRefresh={load}
            loading={loading}
          />
        </Col>
      </Row>

      <Title
        level={4}
        style={{ marginTop: 8 }}
      >
        Layanan Aktif ({aktifList.length})
      </Title>
      <LayananTable
        data={aktifList}
        loading={loading}
        onEdit={openEdit}
        onDelete={deleteLayanan}
        onToggleActive={toggleActive}
        variant='default'
      />

      <Divider />

      <Title
        level={4}
        style={{ marginTop: 0 }}
      >
        Layanan Nonaktif ({nonaktifList.length})
      </Title>
      <LayananTable
        data={nonaktifList}
        loading={loading}
        onEdit={openEdit}
        onDelete={deleteLayanan}
        onToggleActive={toggleActive}
        variant='inactive'
      />

      <LayananFormDrawer
        open={drawerOpen}
        loading={loading}
        editing={editing}
        onClose={closeDrawer}
        onSubmit={submitLayanan}
      />
    </Space>
  );
}

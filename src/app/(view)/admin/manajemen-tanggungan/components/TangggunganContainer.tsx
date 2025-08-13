'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Space, Row, Col, message, Modal, Input, Typography, Divider } from 'antd';
import TanggunganTable, { Tanggungan } from './TanggunganTable';
import TanggunganFormDrawer from './TanggunganFormDrawer';
import TanggunganSearchBar from './TanggunganSearchBar';
import { apiAuth } from '@/utils/apiAuth';
import { ApiEndpoints } from '@/constraints/api-endpoints';

const { TextArea } = Input;
const { Title } = Typography;

// normalisasi boolean aman (1/0, "true"/"false")
const toBool = (v: any) => {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v === 1;
  if (typeof v === 'string') return ['1', 'true', 't', 'ya', 'aktif'].includes(v.toLowerCase());
  return !!v;
};
function normalizeTanggungan(raw: any): Tanggungan {
  return {
    id_tanggungan: raw.id_tanggungan,
    nama_tanggungan: raw.nama_tanggungan,
    is_active: toBool(raw.is_active),
    alasan_nonaktif: raw.alasan_nonaktif ?? null,
    deletedAt: raw.deletedAt ?? null,
  };
}

export default function TanggunganContainer() {
  const [loading, setLoading] = useState(false);
  const [aktifList, setAktifList] = useState<Tanggungan[]>([]);
  const [nonaktifList, setNonaktifList] = useState<Tanggungan[]>([]);
  const [query, setQuery] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Tanggungan | null>(null);

  const buildUrl = (status: 'active' | 'inactive' | 'all') => {
    const sp = new URLSearchParams();
    if (query) sp.set('q', query);
    sp.set('status', status);
    return `${ApiEndpoints.GetTanggungan}?${sp.toString()}`;
  };

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [act, inact] = await Promise.all([apiAuth.getDataPrivate(buildUrl('active')).catch(() => null), apiAuth.getDataPrivate(buildUrl('inactive')).catch(() => null)]);

      if (Array.isArray(act) && Array.isArray(inact)) {
        setAktifList(act.map(normalizeTanggungan));
        setNonaktifList(inact.map(normalizeTanggungan));
      } else {
        // fallback: all lalu pisah
        const all = await apiAuth.getDataPrivate(buildUrl('all'));
        if (!Array.isArray(all)) throw new Error(all?.message || 'Gagal memuat data');
        const items = all.map(normalizeTanggungan);
        setAktifList(items.filter((x) => x.is_active && !x.deletedAt));
        setNonaktifList(items.filter((x) => !x.is_active || !!x.deletedAt));
      }
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
  const openEdit = (row: Tanggungan) => {
    setEditing(row);
    setDrawerOpen(true);
  };
  const closeDrawer = () => {
    setEditing(null);
    setDrawerOpen(false);
  };

  // Submit (POST / PUT)
  const submit = async (values: { nama_tanggungan: string }) => {
    try {
      setLoading(true);
      const payload = { nama_tanggungan: values.nama_tanggungan.trim() };

      const res = editing ? await apiAuth.putDataPrivate(ApiEndpoints.UpdateTanggungan(editing.id_tanggungan), payload) : await apiAuth.postDataPrivate(ApiEndpoints.CreateTanggungan, payload);

      if (res?.message && res?.ok !== true && !res?.id_tanggungan) {
        throw new Error(res.message);
      }

      message.success(editing ? 'Tanggungan diperbarui' : 'Tanggungan ditambahkan');
      await load();
      closeDrawer();
    } catch (e: any) {
      message.error(e?.message || 'Gagal menyimpan data');
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (id_tanggungan: string) => {
    try {
      setLoading(true);
      const res = await apiAuth.deleteDataPrivate(ApiEndpoints.DeleteTanggungan(id_tanggungan));
      if (res?.message && res?.ok !== true) throw new Error(res.message);
      message.success('Tanggungan dihapus permanen');
      await load();
    } catch (e: any) {
      message.error(e?.message || 'Tidak bisa menghapus permanen (mungkin masih digunakan)');
    } finally {
      setLoading(false);
    }
  };

  // Toggle aktif/nonaktif
  const toggleActive = (row: Tanggungan, nextActive: boolean) => {
    if (nextActive) {
      setLoading(true);
      apiAuth
        .putDataPrivate(ApiEndpoints.UpdateTanggungan(row.id_tanggungan), { is_active: true })
        .then((res) => {
          if (res?.message && res?.id_tanggungan === undefined) throw new Error(res.message);
          message.success('Tanggungan diaktifkan');
          return load();
        })
        .catch((e: any) => message.error(e?.message || 'Gagal mengaktifkan tanggungan'))
        .finally(() => setLoading(false));
      return;
    }

    let reason = '';
    Modal.confirm({
      title: `Nonaktifkan "${row.nama_tanggungan}"?`,
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
          const res = await apiAuth.putDataPrivate(ApiEndpoints.UpdateTanggungan(row.id_tanggungan), {
            is_active: false,
            alasan_nonaktif: reason?.trim() || 'Nonaktif manual',
          });
          if (res?.message && res?.id_tanggungan === undefined) throw new Error(res.message);
          message.success('Tanggungan dinonaktifkan');
          await load();
        } catch (e: any) {
          message.error(e?.message || 'Gagal menonaktifkan tanggungan');
        } finally {
          setLoading(false);
        }
      },
    });
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
        <Col>
          <TanggunganSearchBar
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
        Tanggungan Aktif ({aktifList.length})
      </Title>
      <TanggunganTable
        data={aktifList}
        loading={loading}
        onEdit={openEdit}
        onDelete={onDelete}
        onToggleActive={toggleActive}
        variant='default'
      />

      <Divider />

      <Title
        level={4}
        style={{ marginTop: 0 }}
      >
        Tanggungan Nonaktif ({nonaktifList.length})
      </Title>
      <TanggunganTable
        data={nonaktifList}
        loading={loading}
        onEdit={openEdit}
        onDelete={onDelete}
        onToggleActive={toggleActive}
        variant='inactive'
      />

      <TanggunganFormDrawer
        open={drawerOpen}
        loading={loading}
        editing={editing}
        onClose={closeDrawer}
        onSubmit={submit}
      />
    </Space>
  );
}

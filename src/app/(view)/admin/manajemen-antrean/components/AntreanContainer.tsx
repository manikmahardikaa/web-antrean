'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Row, Col, Space, Button, Table, Tag, Modal, message, Empty, Typography } from 'antd';
import { RetweetOutlined, EditOutlined, InfoCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { AntreanRow, Filters, Option, StatusAntrean } from './types';
import StatusModal from './StatusModal';
import ReassignDokterModal from './ReassignDokterModal';
import DetailAntreanDrawer from './DetailAntreanDrawer';
import { apiAuth } from '@/utils/apiAuth';
import { ApiEndpoints } from '@/constraints/api-endpoints';

const { Text } = Typography;

const statusColor: Record<StatusAntrean, string> = {
  MENUNGGU: 'geekblue',
  DIPROSES: 'gold',
  SELESAI: 'green',
  DIBATALKAN: 'red',
};

export default function AntreanContainer({ filters, dokterOpts, layananOpts, refreshToken }: { filters: Filters; dokterOpts: Option[]; layananOpts: Option[]; refreshToken: number }) {
  const { query, statusFilter, dokterFilter, layananFilter, range } = filters;

  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<AntreanRow[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState<AntreanRow | null>(null);

  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [reassignTarget, setReassignTarget] = useState<AntreanRow | null>(null);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRow, setDetailRow] = useState<AntreanRow | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const dataA = await apiAuth.getDataPrivate(ApiEndpoints.GetAntrean);
      if (!Array.isArray(dataA)) throw new Error(dataA?.message || 'Gagal memuat antrean');
      setList(dataA);
      setSelectedRowKeys([]);
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

  const data = useMemo(() => {
    const q = query.toLowerCase();
    return list
      .filter((r) => (statusFilter === 'ALL' ? true : r.status === statusFilter))
      .filter((r) => !dokterFilter || r.id_dokter === dokterFilter)
      .filter((r) => !layananFilter || r.id_layanan === layananFilter)
      .filter((r) => {
        if (!range) return true;
        const t = dayjs(r.tanggal_kunjungan);
        return t.isAfter(range[0].startOf('day').subtract(1, 'ms')) && t.isBefore(range[1].endOf('day').add(1, 'ms'));
      })
      .filter((r) => {
        if (!q) return true;
        const pasien = r.user?.nama || '';
        const dokter = r.dokter?.nama_dokter || r.dokter_nama_snapshot || '';
        const layanan = r.layanan?.nama_layanan || '';
        const tanggungan = (r as any).tanggungan?.nama_tanggungan || ''; // optional
        return [pasien, dokter, layanan, tanggungan, r.alamat_user].some((v) => (v || '').toLowerCase().includes(q));
      });
  }, [list, query, statusFilter, dokterFilter, layananFilter, range]);

  const fmtDateTime = (iso: string) => dayjs(iso).format('DD MMM YYYY HH:mm');

  const columns = [
    {
      title: 'Pasien',
      key: 'pasien',
      render: (_: unknown, row: AntreanRow) => (
        <Space
          direction='vertical'
          size={0}
        >
          <span>{row.user?.nama || '-'}</span>
          {row.user?.no_telepon ? (
            <Text
              type='secondary'
              style={{ fontSize: 12 }}
            >
              {row.user.no_telepon}
            </Text>
          ) : null}
        </Space>
      ),
      ellipsis: true,
    },
    {
      title: 'Dokter',
      key: 'dokter',
      render: (_: unknown, row: AntreanRow) => (
        <Space
          direction='vertical'
          size={0}
        >
          <span>{row.dokter?.nama_dokter || row.dokter_nama_snapshot || '-'}</span>
          {row.dokter?.spesialisasi ? (
            <Text
              type='secondary'
              style={{ fontSize: 12 }}
            >
              {row.dokter.spesialisasi}
            </Text>
          ) : null}
        </Space>
      ),
      ellipsis: true,
      responsive: ['sm'],
    },
    {
      title: 'Layanan',
      dataIndex: ['layanan', 'nama_layanan'],
      key: 'layanan',
      render: (_: any, row: AntreanRow) => row.layanan?.nama_layanan || '-',
      ellipsis: true,
      responsive: ['md'],
    },
    // ——— Kolom baru: Tanggungan ———
    {
      title: 'Tanggungan',
      dataIndex: ['tanggungan', 'nama_tanggungan'],
      key: 'tanggungan',
      render: (_: any, row: AntreanRow) => (row as any).tanggungan?.nama_tanggungan || '-',
      ellipsis: true,
      responsive: ['lg'],
    },
    {
      title: 'Tanggal',
      dataIndex: 'tanggal_kunjungan',
      key: 'tanggal_kunjungan',
      render: (v: string) => fmtDateTime(v),
      width: 180,
      sorter: (a: AntreanRow, b: AntreanRow) => dayjs(a.tanggal_kunjungan).valueOf() - dayjs(b.tanggal_kunjungan).valueOf(),
      defaultSortOrder: 'ascend' as const,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      align: 'center' as const,
      render: (s: StatusAntrean) => <Tag color={statusColor[s]}>{s}</Tag>,
    },
    {
      title: 'Alamat',
      dataIndex: 'alamat_user',
      key: 'alamat_user',
      ellipsis: true,
      responsive: ['lg'],
    },
    {
      title: 'Aksi',
      key: 'aksi',
      width: 280,
      render: (_: unknown, row: AntreanRow) => (
        <Space wrap>
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
              setStatusTarget(row);
              setStatusModalOpen(true);
            }}
          >
            Ubah Status
          </Button>
          <Button
            icon={<RetweetOutlined />}
            onClick={() => {
              setReassignTarget(row);
              setReassignModalOpen(true);
            }}
          >
            Reassign Dokter
          </Button>
        </Space>
      ),
    },
  ];

  const bulkUpdateStatus = async (status: StatusAntrean) => {
    if (!selectedRowKeys.length) return;
    try {
      setLoading(true);
      const res = await apiAuth.putDataPrivate(ApiEndpoints.BulkStatusAntrean, {
        ids: selectedRowKeys,
        status,
      });
      if (res?.ok === false) throw new Error(res?.message || 'Gagal memperbarui status');
      message.success(`Berhasil mengubah ${selectedRowKeys.length} antrean → ${status}`);
      await load();
    } catch (e: any) {
      message.error(e?.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const bulkCancel = async () => {
    if (!selectedRowKeys.length) return;
    Modal.confirm({
      title: 'Batalkan antrean terpilih?',
      content: 'Antrean akan ditandai DIBATALKAN.',
      okText: 'Batalkan',
      okButtonProps: { danger: true },
      async onOk() {
        await bulkUpdateStatus('DIBATALKAN');
      },
    });
  };

  const handleSubmitStatus = async (values: { status: StatusAntrean; alasan_batal?: string }) => {
    if (!statusTarget) return;
    try {
      setLoading(true);
      const res = await apiAuth.putDataPrivate(ApiEndpoints.UpdateStatusAntrean(statusTarget.id_antrean), values);
      if (res?.ok === false) throw new Error(res?.message || 'Gagal mengubah status');
      message.success('Status diperbarui');
      setStatusModalOpen(false);
      setStatusTarget(null);
      await load();
    } catch (e: any) {
      message.error(e?.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReassign = async (id_dokter: string) => {
    if (!reassignTarget) return;
    try {
      setLoading(true);
      const res = await apiAuth.putDataPrivate(ApiEndpoints.ReassignDokterAntrean(reassignTarget.id_antrean), { id_dokter });
      if (res?.ok === false) throw new Error(res?.message || 'Gagal reassign dokter');
      message.success('Dokter diganti');
      setReassignModalOpen(false);
      setReassignTarget(null);
      await load();
    } catch (e: any) {
      message.error(e?.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelFromDrawer = async () => {
    if (!detailRow) return;
    try {
      setLoading(true);
      const res = await apiAuth.putDataPrivate(ApiEndpoints.UpdateStatusAntrean(detailRow.id_antrean), {
        status: 'DIBATALKAN',
        alasan_batal: 'Dibatalkan via detail',
      });
      if (res?.ok === false) throw new Error(res?.message || 'Gagal membatalkan');
      message.success('Antrean dibatalkan');
      setDetailOpen(false);
      await load();
    } catch (e: any) {
      message.error(e?.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
  };

  const hasActiveFilter = !!query || statusFilter !== 'ALL' || !!dokterFilter || !!layananFilter || !!range;

  return (
    <Space
      direction='vertical'
      size={16}
      style={{ width: '100%' }}
    >
      <Row gutter={[8, 8]}>
        <Col>
          <Space wrap>
            <Button
              disabled={!selectedRowKeys.length}
              onClick={() => bulkUpdateStatus('DIPROSES')}
            >
              Tandai Diproses
            </Button>
            <Button
              disabled={!selectedRowKeys.length}
              onClick={() => bulkUpdateStatus('SELESAI')}
              type='primary'
              ghost
            >
              Tandai Selesai
            </Button>
            <Button
              disabled={!selectedRowKeys.length}
              danger
              onClick={bulkCancel}
            >
              Batalkan Terpilih
            </Button>
            <Text type='secondary'>{selectedRowKeys.length ? `${selectedRowKeys.length} dipilih` : 'Tidak ada yang dipilih'}</Text>
          </Space>
        </Col>
      </Row>

      <Table<AntreanRow>
        size='middle'
        rowKey='id_antrean'
        loading={loading}
        rowSelection={rowSelection}
        columns={columns as any}
        dataSource={data}
        pagination={{ pageSize: 10, showSizeChanger: true }}
        scroll={{ x: 1200 }}
        locale={{
          emptyText: <Empty description={hasActiveFilter ? 'Tidak ada data sesuai filter' : 'Belum ada antrean'} />,
        }}
      />

      <StatusModal
        open={statusModalOpen}
        loading={loading}
        target={statusTarget}
        onCancel={() => setStatusModalOpen(false)}
        onSubmit={handleSubmitStatus}
      />
      <ReassignDokterModal
        open={reassignModalOpen}
        loading={loading}
        target={reassignTarget}
        dokterOpts={dokterOpts}
        onCancel={() => setReassignModalOpen(false)}
        onSubmit={handleSubmitReassign}
      />
      <DetailAntreanDrawer
        open={detailOpen}
        row={detailRow}
        loading={loading}
        onClose={() => setDetailOpen(false)}
        onOpenStatus={(r) => {
          setStatusTarget(r);
          setStatusModalOpen(true);
        }}
        onOpenReassign={(r) => {
          setReassignTarget(r);
          setReassignModalOpen(true);
        }}
        onCancelConfirm={handleCancelFromDrawer}
      />
    </Space>
  );
}

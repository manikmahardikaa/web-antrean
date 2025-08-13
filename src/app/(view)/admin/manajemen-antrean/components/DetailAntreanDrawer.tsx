'use client';

import React from 'react';
import { Drawer, Descriptions, Divider, Space, Button, Popconfirm, Tag } from 'antd';
import { EditOutlined, RetweetOutlined } from '@ant-design/icons';
import type { AntreanRow, StatusAntrean } from './types';
import dayjs from 'dayjs';

const statusColor: Record<StatusAntrean, string> = {
  MENUNGGU: 'geekblue',
  DIPROSES: 'gold',
  SELESAI: 'green',
  DIBATALKAN: 'red',
};

export default function DetailAntreanDrawer({
  open,
  row,
  loading,
  onClose,
  onOpenStatus,
  onOpenReassign,
  onCancelConfirm,
}: {
  open: boolean;
  row: AntreanRow | null;
  loading: boolean;
  onClose: () => void;
  onOpenStatus: (row: AntreanRow) => void;
  onOpenReassign: (row: AntreanRow) => void;
  onCancelConfirm: () => void;
}) {
  return (
    <Drawer
      title='Detail Antrean'
      open={open}
      onClose={onClose}
      width={520}
      destroyOnClose
    >
      {row ? (
        <>
          <Descriptions
            column={1}
            size='small'
            bordered
          >
            <Descriptions.Item label='Pasien'>{row.user?.nama || '-'}</Descriptions.Item>
            <Descriptions.Item label='No. Telepon'>{row.user?.no_telepon || '-'}</Descriptions.Item>
            <Descriptions.Item label='Dokter'>{row.dokter?.nama_dokter || row.dokter_nama_snapshot || '-'}</Descriptions.Item>
            <Descriptions.Item label='Layanan'>{row.layanan?.nama_layanan || '-'}</Descriptions.Item>
            <Descriptions.Item label='Tanggal & Waktu'>{dayjs(row.tanggal_kunjungan).format('DD MMM YYYY HH:mm')}</Descriptions.Item>
            <Descriptions.Item label='Status'>
              <Tag color={statusColor[row.status]}>{row.status}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label='Alamat'>{row.alamat_user}</Descriptions.Item>
            <Descriptions.Item label='Alasan Batal'>{row.status === 'DIBATALKAN' ? row.alasan_batal || '-' : '-'}</Descriptions.Item>
          </Descriptions>
          <Divider />
          <Space wrap>
            <Button
              icon={<EditOutlined />}
              onClick={() => onOpenStatus(row)}
            >
              Ubah Status
            </Button>
            <Button
              icon={<RetweetOutlined />}
              onClick={() => onOpenReassign(row)}
            >
              Reassign Dokter
            </Button>
            <Popconfirm
              title='Batalkan antrean ini?'
              okText='Batalkan'
              okButtonProps={{ danger: true }}
              cancelText='Batal'
              onConfirm={onCancelConfirm}
            >
              <Button
                danger
                loading={loading}
              >
                Batalkan
              </Button>
            </Popconfirm>
          </Space>
        </>
      ) : null}
    </Drawer>
  );
}

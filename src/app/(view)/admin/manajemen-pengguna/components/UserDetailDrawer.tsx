'use client';

import { Drawer, Descriptions, Tag } from 'antd';
import dayjs from 'dayjs';
import type { UserRow } from './UserContainer';
import { getGenderLabel } from './gender';
import 'dayjs/locale/id';
dayjs.locale('id');

export default function UserDetailDrawer({ open, row, onClose }: { open: boolean; row: UserRow | null; onClose: () => void }) {
  const fmtDate = (iso?: string) => (iso ? dayjs(iso).format('DD MMM YYYY') : '-');
  return (
    <Drawer
      title='Detail Pengguna'
      open={open}
      onClose={onClose}
      width={520}
      destroyOnClose
    >
      {row ? (
        <Descriptions
          column={1}
          bordered
          size='small'
        >
          <Descriptions.Item label='Nama'>{row.nama}</Descriptions.Item>
          <Descriptions.Item label='Email'>{row.email}</Descriptions.Item>
          <Descriptions.Item label='No. Telepon'>{row.no_telepon}</Descriptions.Item>
          <Descriptions.Item label='Tanggal Lahir'>{fmtDate(row.tanggal_lahir)}</Descriptions.Item>
          <Descriptions.Item label='Jenis Kelamin'>{getGenderLabel(row.jenis_kelamin) || '-'}</Descriptions.Item>
          <Descriptions.Item label='Role'>
            <Tag color={row.role === 'ADMIN' ? 'magenta' : 'blue'}>{row.role}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label='Layanan'>{row.layanan?.nama_layanan || '-'}</Descriptions.Item>
          <Descriptions.Item label='Tanggungan'>{row.tanggungan?.nama_tanggungan || '-'}</Descriptions.Item>
          <Descriptions.Item label='Alamat'>{row.alamat || '-'}</Descriptions.Item>
        </Descriptions>
      ) : null}
    </Drawer>
  );
}

'use client';

import { Drawer, Form, Input, DatePicker, Select, Space, Button } from 'antd';
import dayjs from 'dayjs';
import type { UserRow, Role } from './UserContainer';
import { getGenderLabel } from './gender';
import 'dayjs/locale/id';

type Option = { label: string; value: string };
dayjs.locale('id');

const toYmd = (d?: dayjs.Dayjs | null) => (d ? d.format('YYYY-MM-DD') : undefined);

export default function UserFormDrawer({
  open,
  loading,
  editing,
  layananOpts,
  tanggunganOpts,
  onClose,
  onSubmit,
}: {
  open: boolean;
  loading: boolean;
  editing: UserRow | null;
  layananOpts: Option[];
  tanggunganOpts: Option[];
  onClose: () => void;
  onSubmit: (v: { nama: string; email: string; password?: string; tanggal_lahir: string; jenis_kelamin: string; no_telepon: string; alamat?: string | null; role: Role; id_layanan?: string | null; id_tanggungan?: string | null }) => void;
}) {
  const [form] = Form.useForm();

  return (
    <Drawer
      title={editing ? 'Edit Pengguna' : 'Tambah Pengguna'}
      width={560}
      open={open}
      onClose={() => {
        onClose();
        form.resetFields();
      }}
      destroyOnClose
      maskClosable={false}
      afterOpenChange={(v) => {
        if (v) {
          form.setFieldsValue({
            nama: editing?.nama ?? '',
            email: editing?.email ?? '',
            password: '', // tidak di-prefill
            tanggal_lahir: editing?.tanggal_lahir ? dayjs(editing.tanggal_lahir) : null,
            jenis_kelamin: getGenderLabel(editing?.jenis_kelamin) === 'Wanita' ? 'Wanita' : 'Pria',
            no_telepon: editing?.no_telepon ?? '',
            alamat: editing?.alamat ?? '',
            role: editing?.role ?? 'USER',
            id_layanan: editing?.id_layanan ?? undefined,
            id_tanggungan: editing?.id_tanggungan ?? undefined,
          });
        } else {
          form.resetFields();
        }
      }}
    >
      <Form
        form={form}
        layout='vertical'
        onFinish={(v) =>
          onSubmit({
            nama: v.nama.trim(),
            email: v.email.trim(),
            password: (v.password || '').trim() || undefined,
            tanggal_lahir: toYmd(v.tanggal_lahir)!,
            jenis_kelamin: v.jenis_kelamin,
            no_telepon: v.no_telepon.trim(),
            alamat: (v.alamat || '').trim() || null,
            role: v.role,
            id_layanan: v.id_layanan || null,
            id_tanggungan: v.id_tanggungan || null,
          })
        }
      >
        <Form.Item
          name='nama'
          label='Nama'
          rules={[{ required: true, message: 'Wajib diisi' }, { min: 3 }]}
        >
          <Input
            placeholder='Nama lengkap'
            maxLength={120}
          />
        </Form.Item>

        <Form.Item
          name='email'
          label='Email'
          rules={[{ required: true, type: 'email', message: 'Email tidak valid' }]}
        >
          <Input placeholder='email@domain.com' />
        </Form.Item>

        <Form.Item
          name='password'
          label='Password'
          rules={
            editing
              ? []
              : [
                  { required: true, message: 'Wajib diisi' },
                  { min: 6, message: 'Min 6 karakter' },
                ]
          }
          extra={editing ? 'Kosongkan jika tidak ingin mengubah password' : undefined}
        >
          <Input.Password placeholder={editing ? 'Kosongkan jika tidak diubah' : 'Password awal'} />
        </Form.Item>

        <Form.Item
          name='tanggal_lahir'
          label='Tanggal Lahir'
          rules={[{ required: true }]}
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name='jenis_kelamin'
          label='Jenis Kelamin'
          rules={[{ required: true }]}
        >
          <Select
            options={[
              { label: 'Pria', value: 'Pria' },
              { label: 'Wanita', value: 'Wanita' },
            ]}
          />
        </Form.Item>

        <Form.Item
          name='no_telepon'
          label='No. Telepon'
          rules={[{ required: true }]}
        >
          <Input
            placeholder='08xxxxxxxxxx'
            maxLength={20}
          />
        </Form.Item>

        <Form.Item
          name='alamat'
          label='Alamat'
        >
          <Input.TextArea
            rows={3}
            maxLength={300}
            placeholder='Alamat lengkap (opsional)'
          />
        </Form.Item>

        <Form.Item
          name='role'
          label='Role'
          rules={[{ required: true }]}
        >
          <Select
            options={[
              { label: 'User', value: 'USER' },
              { label: 'Admin', value: 'ADMIN' },
            ]}
          />
        </Form.Item>

        <Form.Item
          name='id_layanan'
          label='Layanan (opsional)'
        >
          <Select
            allowClear
            placeholder='Pilih layanan'
            options={layananOpts}
            showSearch
            filterOption={(i, o) => (o?.label as string).toLowerCase().includes(i.toLowerCase())}
          />
        </Form.Item>

        <Form.Item
          name='id_tanggungan'
          label='Tanggungan (opsional)'
        >
          <Select
            allowClear
            placeholder='Pilih tanggungan'
            options={tanggunganOpts}
            showSearch
            filterOption={(i, o) => (o?.label as string).toLowerCase().includes(i.toLowerCase())}
          />
        </Form.Item>

        <Space style={{ justifyContent: 'flex-end', width: '100%' }}>
          <Button onClick={onClose}>Batal</Button>
          <Button
            type='primary'
            htmlType='submit'
            loading={loading}
          >
            {editing ? 'Simpan Perubahan' : 'Tambah'}
          </Button>
        </Space>
      </Form>
    </Drawer>
  );
}

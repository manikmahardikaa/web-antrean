'use client';

import { Drawer, Form, Input, Button, Space } from 'antd';
import type { Tanggungan } from './TanggunganTable';

type Props = {
  open: boolean;
  loading: boolean;
  editing: Tanggungan | null;
  onClose: () => void;
  onSubmit: (v: { nama_tanggungan: string }) => Promise<void> | void;
};

export default function TanggunganFormDrawer({ open, loading, editing, onClose, onSubmit }: Props) {
  const [form] = Form.useForm<{ nama_tanggungan: string }>();

  return (
    <Drawer
      title={editing ? 'Edit Tanggungan' : 'Tambah Tanggungan'}
      width={420}
      open={open}
      onClose={() => {
        onClose();
        form.resetFields();
      }}
      destroyOnClose
      maskClosable={false}
      afterOpenChange={(visible) => {
        if (visible) {
          form.setFieldsValue({ nama_tanggungan: editing?.nama_tanggungan ?? '' });
        } else {
          form.resetFields();
        }
      }}
    >
      <Form
        form={form}
        layout='vertical'
        initialValues={{ nama_tanggungan: '' }}
        onFinish={onSubmit}
      >
        <Form.Item
          name='nama_tanggungan'
          label='Nama Tanggungan'
          rules={[
            { required: true, message: 'Nama tanggungan wajib diisi' },
            { min: 3, message: 'Minimal 3 karakter' },
          ]}
        >
          <Input
            placeholder='Contoh: BPJS Kelas 1 / Perusahaan / Mandiri'
            maxLength={80}
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

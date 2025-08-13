'use client';

import { Drawer, Form, Input, Button, Space } from 'antd';
import { useEffect } from 'react';
import type { Layanan } from './LayananTable';

type Props = {
  open: boolean;
  loading: boolean;
  editing: Layanan | null; // null = create
  onClose: () => void;
  onSubmit: (values: { nama_layanan: string }) => Promise<void> | void;
};

export default function LayananFormDrawer({ open, loading, editing, onClose, onSubmit }: Props) {
  const [form] = Form.useForm<{ nama_layanan: string }>();

  useEffect(() => {
    if (editing) form.setFieldsValue({ nama_layanan: editing.nama_layanan });
    else form.resetFields();
  }, [editing, form, open]);

  return (
    <Drawer
      title={editing ? 'Edit Layanan' : 'Tambah Layanan'}
      width={420}
      open={open}
      onClose={onClose}
      destroyOnClose
      maskClosable={false}
    >
      <Form
        form={form}
        layout='vertical'
        initialValues={{ nama_layanan: '' }}
        onFinish={onSubmit}
      >
        <Form.Item
          name='nama_layanan'
          label='Nama Layanan'
          rules={[
            { required: true, message: 'Nama layanan wajib diisi' },
            { min: 3, message: 'Minimal 3 karakter' },
          ]}
        >
          <Input
            placeholder='Contoh: Scaling'
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

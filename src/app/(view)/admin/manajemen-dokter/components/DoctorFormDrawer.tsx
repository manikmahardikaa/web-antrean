'use client';

import { Drawer, Form, Input, Button, Space, Typography } from 'antd';

const { Text } = Typography;

type Dokter = { id_dokter: string; nama_dokter: string; spesialisasi: string };

type Props = {
  open: boolean;
  loading: boolean;
  editing: Dokter | null;
  onClose: () => void;
  onSubmit: (v: { nama_dokter: string; spesialisasi: string }) => Promise<void> | void;
};

export default function DokterFormDrawer({ open, loading, editing, onClose, onSubmit }: Props) {
  const [form] = Form.useForm<{ nama_dokter: string; spesialisasi: string }>();

  return (
    <Drawer
      title={editing ? 'Edit Dokter' : 'Tambah Dokter'}
      width={520}
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
            nama_dokter: editing?.nama_dokter ?? '',
            spesialisasi: editing?.spesialisasi ?? '',
          });
        } else {
          form.resetFields();
        }
      }}
    >
      <Form
        form={form}
        layout='vertical'
        initialValues={{ nama_dokter: '', spesialisasi: '' }}
        onFinish={onSubmit}
      >
        <Form.Item
          name='nama_dokter'
          label='Nama Dokter'
          rules={[
            { required: true, message: 'Wajib' },
            { min: 3, message: 'Min 3 karakter' },
          ]}
        >
          <Input
            placeholder='Contoh: drg. Ayu Mahendrani'
            maxLength={120}
          />
        </Form.Item>

        <Form.Item
          name='spesialisasi'
          label='Spesialisasi'
          rules={[{ required: true, message: 'Wajib' }]}
        >
          <Input
            placeholder='Contoh: Kedokteran Gigi Umum / Ortodonti / dsb.'
            maxLength={120}
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

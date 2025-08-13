'use client';

import React from 'react';
import { Modal, Form, Select, Space, Typography } from 'antd';
import type { AntreanRow, Option } from './types';
import dayjs from 'dayjs';

const { Text } = Typography;

export default function ReassignDokterModal({
  open,
  loading,
  target,
  dokterOpts,
  onCancel,
  onSubmit,
}: {
  open: boolean;
  loading: boolean;
  target: AntreanRow | null;
  dokterOpts: Option[];
  onCancel: () => void;
  onSubmit: (id_dokter: string) => void;
}) {
  const [form] = Form.useForm<{ id_dokter: string }>();

  React.useEffect(() => {
    if (open) form.resetFields();
  }, [open]); // eslint-disable-line

  return (
    <Modal
      title='Ganti Dokter untuk Antrean'
      open={open}
      onCancel={onCancel}
      onOk={async () => {
        const { id_dokter } = await form.validateFields();
        onSubmit(id_dokter);
      }}
      okText='Simpan'
      confirmLoading={loading}
      destroyOnClose
    >
      {target ? (
        <Space
          direction='vertical'
          style={{ width: '100%' }}
          size='middle'
        >
          <Text>
            Antrean: <b>{target.user?.nama || target.id_user}</b> — {dayjs(target.tanggal_kunjungan).format('DD MMM YYYY HH:mm')}
          </Text>
          <Form
            form={form}
            layout='vertical'
          >
            <Form.Item
              name='id_dokter'
              label='Pilih Dokter Pengganti'
              rules={[{ required: true, message: 'Pilih dokter pengganti' }]}
            >
              <Select
                showSearch
                placeholder='Pilih dokter'
                options={dokterOpts}
                filterOption={(input, option) => (option?.label as string).toLowerCase().includes(input.toLowerCase())}
              />
            </Form.Item>
          </Form>
          <Text type='secondary'>Sistem akan memperbarui nama snapshot dokter pada antrean ini sesuai dokter pengganti.</Text>
        </Space>
      ) : null}
    </Modal>
  );
}

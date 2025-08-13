'use client';

import React from 'react';
import { Modal, Form, Select, Input, Space, Typography } from 'antd';
import type { AntreanRow, StatusAntrean } from './types';
import dayjs from 'dayjs';

const { Text } = Typography;
const { TextArea } = Input;

export default function StatusModal({
  open,
  loading,
  target,
  onCancel,
  onSubmit,
}: {
  open: boolean;
  loading: boolean;
  target: AntreanRow | null;
  onCancel: () => void;
  onSubmit: (v: { status: StatusAntrean; alasan_batal?: string }) => void;
}) {
  const [form] = Form.useForm<{ status: StatusAntrean; alasan_batal?: string }>();

  React.useEffect(() => {
    if (open && target) {
      form.setFieldsValue({ status: target.status, alasan_batal: target.alasan_batal || undefined });
    } else {
      form.resetFields();
    }
  }, [open, target]); // eslint-disable-line

  return (
    <Modal
      title='Ubah Status Antrean'
      open={open}
      onCancel={onCancel}
      onOk={async () => {
        const v = await form.validateFields();
        onSubmit(v);
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
              name='status'
              label='Status'
              rules={[{ required: true }]}
            >
              <Select
                options={[
                  { label: 'Menunggu', value: 'MENUNGGU' },
                  { label: 'Diproses', value: 'DIPROSES' },
                  { label: 'Selesai', value: 'SELESAI' },
                  { label: 'Dibatalkan', value: 'DIBATALKAN' },
                ]}
              />
            </Form.Item>
            <Form.Item
              noStyle
              shouldUpdate
            >
              {() =>
                form.getFieldValue('status') === 'DIBATALKAN' ? (
                  <Form.Item
                    name='alasan_batal'
                    label='Alasan Pembatalan'
                    rules={[{ required: true, message: 'Alasan wajib diisi saat membatalkan' }]}
                  >
                    <TextArea
                      rows={3}
                      placeholder='Contoh: pasien berhalangan / dokter nonaktif / dll'
                      maxLength={200}
                    />
                  </Form.Item>
                ) : null
              }
            </Form.Item>
          </Form>
        </Space>
      ) : null}
    </Modal>
  );
}

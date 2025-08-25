'use client';

import React from 'react';
import { Drawer, Form, Input, DatePicker, Upload, Space, Button, Image, message } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';

const { TextArea } = Input;
const { Dragger } = Upload;

export type NewsFormValues = {
  judul: string;
  deskripsi: string;
  tanggal_penerbitan: Dayjs;
};

export default function NewsFormDrawer({
  open,
  loading,
  initial,
  onClose,
  onSubmit,
}: {
  open: boolean;
  loading: boolean;
  initial: (NewsFormValues & { foto_url: string | null }) | null;
  onClose: () => void;
  onSubmit: (values: NewsFormValues, file?: File | null) => void;
}) {
  const [form] = Form.useForm<NewsFormValues>();
  const [file, setFile] = React.useState<File | null>(null);

  React.useEffect(() => {
    if (open) {
      if (initial) {
        form.setFieldsValue({
          judul: initial.judul,
          deskripsi: initial.deskripsi,
          tanggal_penerbitan: initial.tanggal_penerbitan ? dayjs(initial.tanggal_penerbitan) : undefined,
        });
      } else {
        form.resetFields();
      }
      setFile(null);
    }
  }, [open, initial, form]);

  const beforeUpload = (f: File) => {
    if (!f.type.startsWith('image/')) {
      message.error('Hanya file gambar yang diizinkan');
      return Upload.LIST_IGNORE;
    }
    if (f.size > 2 * 1024 * 1024) {
      message.error('Maksimal 2MB');
      return Upload.LIST_IGNORE;
    }
    setFile(f);
    return false; // jangan auto upload
  };

  const removeFile = () => setFile(null);

  const submit = async () => {
    const v = await form.validateFields();
    onSubmit(
      {
        judul: v.judul.trim(),
        deskripsi: v.deskripsi.trim(),
        tanggal_penerbitan: v.tanggal_penerbitan,
      },
      file
    );
  };

  return (
    <Drawer
      title={initial ? 'Edit Berita' : 'Tambah Berita'}
      width={600}
      open={open}
      onClose={() => {
        form.resetFields();
        setFile(null);
        onClose();
      }}
      destroyOnClose
      maskClosable={false}
    >
      <Form
        form={form}
        layout='vertical'
        onFinish={submit}
      >
        <Form.Item
          name='judul'
          label='Judul'
          rules={[{ required: true, message: 'Judul wajib' }]}
        >
          <Input
            placeholder='Judul berita'
            maxLength={160}
            showCount
          />
        </Form.Item>

        <Form.Item
          name='deskripsi'
          label='Deskripsi'
          rules={[{ required: true, message: 'Deskripsi wajib' }]}
        >
          <TextArea
            rows={6}
            placeholder='Konten berita...'
          />
        </Form.Item>

        <Form.Item
          name='tanggal_penerbitan'
          label='Tanggal Penerbitan'
          rules={[{ required: true, message: 'Tanggal penerbitan wajib' }]}
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        {/* Preview gambar lama (jika edit & tidak memilih file baru) */}
        {initial?.foto_url && !file && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>Gambar saat ini</div>
            <Image
              width={160}
              src={initial.foto_url}
              alt='current'
            />
          </div>
        )}

        <Form.Item label='Gambar (opsional)'>
          <Dragger
            multiple={false}
            beforeUpload={beforeUpload}
            onRemove={() => {
              removeFile();
              return true;
            }}
            maxCount={1}
            accept='image/*'
            fileList={file ? [{ uid: '-1', name: file.name, size: file.size, status: 'done' as const }] : []}
          >
            <p className='ant-upload-drag-icon'>
              <InboxOutlined />
            </p>
            <p className='ant-upload-text'>Klik atau seret file ke area ini</p>
            <p className='ant-upload-hint'>Hanya gambar, maksimal 2MB.</p>
          </Dragger>
        </Form.Item>

        <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            onClick={() => {
              form.resetFields();
              setFile(null);
              onClose();
            }}
          >
            Batal
          </Button>
          <Button
            type='primary'
            htmlType='submit'
            loading={loading}
          >
            {initial ? 'Simpan Perubahan' : 'Tambah Berita'}
          </Button>
        </Space>
      </Form>
    </Drawer>
  );
}

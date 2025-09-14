// src/app/(view)/admin/video-kesehatan/components/VideoFormDrawer.tsx
'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Drawer, Form, Input, DatePicker, Upload, Space, Button, message, Tag } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import 'react-quill/dist/quill.snow.css';

const { Dragger } = Upload;

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

export type VideoFormValues = {
  judul: string;
  deskripsi: string;
  tanggal_penerbitan: Dayjs;
};

export default function VideoFormDrawer({
  open,
  loading,
  initial,
  onClose,
  onSubmit,
}: {
  open: boolean;
  loading: boolean;
  initial: (VideoFormValues & { video_url: string | null }) | null;
  onClose: () => void;
  onSubmit: (values: VideoFormValues, file?: File | null) => void;
}) {
  const [form] = Form.useForm<VideoFormValues>();
  const [file, setFile] = React.useState<File | null>(null);
  const quillModules = React.useMemo(
    () => ({
      toolbar: [[{ header: [1, 2, 3, false] }], ['bold', 'italic', 'underline', 'strike'], [{ list: 'ordered' }, { list: 'bullet' }], [{ align: [] }], ['link', 'blockquote', 'code-block'], ['clean']],
    }),
    []
  );

  const stripHtml = (html?: string) =>
    (html || '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .trim();

  React.useEffect(() => {
    if (open) {
      if (initial) {
        form.setFieldsValue({
          judul: initial.judul,
          deskripsi: initial.deskripsi ?? '',
          tanggal_penerbitan: initial.tanggal_penerbitan ? dayjs(initial.tanggal_penerbitan) : undefined,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({ deskripsi: '' });
      }
      setFile(null);
    }
  }, [open, initial, form]);

  const beforeUpload = (f: File) => {
    if (!f.type.startsWith('video/')) {
      message.error('Hanya file video yang diizinkan');
      return Upload.LIST_IGNORE;
    }
    if (f.size > 50 * 1024 * 1024) {
      message.error('Maksimal 50MB');
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
        deskripsi: v.deskripsi,
        tanggal_penerbitan: v.tanggal_penerbitan,
      },
      file
    );
  };

  return (
    <Drawer
      title={initial ? 'Edit Video' : 'Tambah Video'}
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
            placeholder='Judul video'
            maxLength={160}
            showCount
          />
        </Form.Item>

        <Form.Item
          name='deskripsi'
          label='Deskripsi'
          getValueFromEvent={(content: string) => content}
          rules={[
            {
              validator: async (_, value: string) => {
                if (stripHtml(value).length === 0) {
                  return Promise.reject(new Error('Deskripsi wajib'));
                }
              },
            },
          ]}
        >
          <ReactQuill
            theme='snow'
            modules={quillModules}
            readOnly={loading}
          />
        </Form.Item>

        <Form.Item
          name='tanggal_penerbitan'
          label='Tanggal Penerbitan'
          rules={[{ required: true, message: 'Tanggal penerbitan wajib' }]}
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        {initial?.video_url && !file && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>Video saat ini</div>
            <Tag>{initial.video_url}</Tag>
          </div>
        )}

        <Form.Item label='Video (opsional)'>
          <Dragger
            multiple={false}
            beforeUpload={beforeUpload}
            onRemove={() => {
              removeFile();
              return true;
            }}
            maxCount={1}
            accept='video/*'
            fileList={file ? [{ uid: '-1', name: file.name, size: file.size, status: 'done' as const }] : []}
          >
            <p className='ant-upload-drag-icon'>
              <InboxOutlined />
            </p>
            <p className='ant-upload-text'>Klik atau seret file ke area ini</p>
            <p className='ant-upload-hint'>Hanya video, maksimal 50MB.</p>
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
            {initial ? 'Simpan Perubahan' : 'Tambah Video'}
          </Button>
        </Space>
      </Form>
    </Drawer>
  );
}

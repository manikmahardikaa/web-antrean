// src/app/(view)/admin/video-kesehatan/components/VideoFormDrawer.tsx
'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Drawer, Form, Input, DatePicker, Space, Button } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import 'react-quill/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

export type VideoFormValues = {
  judul: string;
  deskripsi: string;
  tanggal_penerbitan: Dayjs;
  video_url: string;
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
  onSubmit: (values: VideoFormValues) => void;
}) {
  const [form] = Form.useForm<VideoFormValues>();
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
          video_url: initial.video_url || '',
        });
      } else {
        form.resetFields();
        form.setFieldsValue({ deskripsi: '', video_url: '' });
      }
    }
  }, [open, initial, form]);

  const isYouTubeUrl = (val: string) => {
    if (!val) return false;
    const trimmed = val.trim();
    const patterns = [/^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]{11}/i, /^https?:\/\/(www\.)?youtu\.be\/[\w-]{11}/i, /^https?:\/\/(www\.)?youtube\.com\/embed\/[\w-]{11}/i];
    return patterns.some((re) => re.test(trimmed));
  };

  const submit = async () => {
    const v = await form.validateFields();
    onSubmit(
      {
        judul: v.judul.trim(),
        deskripsi: v.deskripsi,
        tanggal_penerbitan: v.tanggal_penerbitan,
        video_url: v.video_url.trim(),
      }
    );
  };

  return (
    <Drawer
      title={initial ? 'Edit Video' : 'Tambah Video'}
      width={600}
      open={open}
      onClose={() => {
        form.resetFields();
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

        <Form.Item
          name='video_url'
          label='URL Video YouTube'
          rules={[
            { required: true, message: 'URL YouTube wajib' },
            {
              validator: async (_, value: string) => {
                if (value && !isYouTubeUrl(value)) {
                  return Promise.reject(new Error('Masukkan URL YouTube yang valid'));
                }
              },
            },
          ]}
        >
          <Input
            placeholder='Contoh: https://youtu.be/xxxxxxxxxxx'
            disabled={loading}
          />
        </Form.Item>

        <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            onClick={() => {
              form.resetFields();
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

'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Drawer, Form, Input, DatePicker, Upload, Space, Button, Image, message } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import 'react-quill/dist/quill.snow.css'; // style editor

const { Dragger } = Upload;
const { TextArea } = Input;

// Lazy-load ReactQuill (hindari SSR issues)
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

export type NewsFormValues = {
  judul: string;
  deskripsi: string; // html string dari quill
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
  const [previewSrc, setPreviewSrc] = React.useState<string | null>(null);

  // Quill toolbar
  const quillModules = React.useMemo(
    () => ({
      toolbar: [[{ header: [1, 2, 3, false] }], ['bold', 'italic', 'underline', 'strike'], [{ list: 'ordered' }, { list: 'bullet' }], [{ align: [] }], ['link', 'blockquote', 'code-block'], ['clean']],
    }),
    []
  );

  React.useEffect(() => {
    if (!file) {
      if (previewSrc) URL.revokeObjectURL(previewSrc);
      setPreviewSrc(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewSrc(url);
    return () => URL.revokeObjectURL(url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  React.useEffect(() => {
    if (open) {
      if (initial) {
        form.setFieldsValue({
          judul: initial.judul,
          deskripsi: initial.deskripsi ?? '',
          tanggal_penerbitan: initial.tanggal_penerbitan ? (dayjs.isDayjs(initial.tanggal_penerbitan) ? initial.tanggal_penerbitan : dayjs(initial.tanggal_penerbitan)) : undefined,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({ deskripsi: '' }); // default string kosong
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
    return false;
  };

  const removeFile = () => setFile(null);

  const stripHtml = (html?: string) =>
    (html || '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .trim();

  const submit = async () => {
    const v = await form.validateFields();
    onSubmit(
      {
        judul: v.judul.trim(),
        deskripsi: v.deskripsi, // sudah berupa HTML string
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
          rules={[
            { required: true, message: 'Judul wajib' },
            { whitespace: true, message: 'Judul tidak boleh hanya spasi' },
          ]}
        >
          <Input
            placeholder='Judul berita'
            maxLength={160}
            showCount
            disabled={loading}
          />
        </Form.Item>

        {/* WYSIWYG */}
        <Form.Item
          name='deskripsi'
          label='Deskripsi'
          // Ambil value dari argumen pertama onChange ReactQuill (html string)
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
            // value & onChange dikontrol oleh Form via getValueFromEvent
          />
        </Form.Item>

        <Form.Item
          name='tanggal_penerbitan'
          label='Tanggal Penerbitan'
          rules={[{ required: true, message: 'Tanggal penerbitan wajib' }]}
        >
          <DatePicker
            style={{ width: '100%' }}
            format='DD MMM YYYY'
            disabled={loading}
          />
        </Form.Item>

        {/* Preview gambar lama (edit) */}
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

        {/* Preview file baru */}
        {previewSrc && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>Preview gambar baru</div>
            <Image
              width={160}
              src={previewSrc}
              alt='new'
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
            disabled={loading}
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
            disabled={loading}
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

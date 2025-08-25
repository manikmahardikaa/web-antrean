'use client';

import React from 'react';
import { Drawer, Form, Input, Space, Button, Upload, Image, Typography, Tooltip, message } from 'antd';
import type { UploadProps } from 'antd';
import { UploadOutlined, InfoCircleOutlined, DeleteOutlined } from '@ant-design/icons';

const { Text } = Typography;

type Dokter = {
  id_dokter: string;
  nama_dokter: string;
  spesialisasi: string;
  foto_profil_dokter?: string | null;
};

type Props = {
  open: boolean;
  loading: boolean;
  editing: Dokter | null;
  onClose: () => void;
  // onSubmit mengirim values + file (opsional)
  onSubmit: (v: { nama_dokter: string; spesialisasi: string }, file?: File | null) => Promise<void> | void;
};

const MAX_FILE_BYTES = 2 * 1024 * 1024; // 2MB

export default function DokterFormDrawer({ open, loading, editing, onClose, onSubmit }: Props) {
  const [form] = Form.useForm<{ nama_dokter: string; spesialisasi: string }>();

  // file yang dipilih + preview (URL lokal)
  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | undefined>(undefined);

  // sinkronisasi nilai form & preview saat buka/tutup / ganti editing
  React.useEffect(() => {
    if (open) {
      form.setFieldsValue({
        nama_dokter: editing?.nama_dokter ?? '',
        spesialisasi: editing?.spesialisasi ?? '',
      });
      setPreview(editing?.foto_profil_dokter || undefined);
    } else {
      form.resetFields();
      setFile(null);
      setPreview(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  // cleanup object URL agar tidak leak
  React.useEffect(() => {
    return () => {
      if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const beforeUpload: UploadProps['beforeUpload'] = (f) => {
    // VALIDASI *SEBELUM* upload: tipe & ukuran
    if (!f.type.startsWith('image/')) {
      message.error('Hanya file gambar yang diizinkan');
      return Upload.LIST_IGNORE;
    }
    if (f.size > MAX_FILE_BYTES) {
      message.error('Ukuran file maksimal 2MB');
      return Upload.LIST_IGNORE;
    }

    // buat preview lokal & simpan file untuk dikirim saat submit form
    const blobUrl = URL.createObjectURL(f as File);
    setPreview(blobUrl);
    setFile(f as File);

    // hentikan upload otomatis — biar dikirim bareng submit form
    return false;
  };

  const clearPhoto = () => {
    if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(editing?.foto_profil_dokter || undefined);
  };

  return (
    <Drawer
      title={editing ? 'Edit Dokter' : 'Tambah Dokter'}
      width={520}
      open={open}
      onClose={() => {
        onClose();
        form.resetFields();
        clearPhoto();
      }}
      destroyOnClose
      maskClosable={false}
    >
      <Space
        direction='vertical'
        size={16}
        style={{ width: '100%' }}
      >
        {/* Blok Upload Foto */}
        <div>
          <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Text strong>Foto Profil</Text>
            <Tooltip title='Foto akan diunggah saat Anda menekan Simpan/Tambah. Maks 2MB.'>
              <InfoCircleOutlined />
            </Tooltip>
          </div>

          <Space
            align='start'
            size={16}
          >
            {preview ? (
              <Image
                src={preview}
                alt='Foto profil dokter'
                width={120}
                height={120}
                style={{ objectFit: 'cover', borderRadius: 8 }}
              />
            ) : (
              <div
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 8,
                  border: '1px dashed #d9d9d9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#999',
                  fontSize: 12,
                }}
              >
                Tidak ada foto
              </div>
            )}

            <Space direction='vertical'>
              <Upload
                name='file'
                accept='image/*'
                maxCount={1}
                showUploadList={false}
                beforeUpload={beforeUpload}
              >
                <Button icon={<UploadOutlined />}>{preview ? 'Ganti Foto' : 'Pilih Foto'}</Button>
              </Upload>

              {preview && (
                <Button
                  icon={<DeleteOutlined />}
                  onClick={clearPhoto}
                >
                  Hapus Pilihan
                </Button>
              )}
            </Space>
          </Space>
        </div>

        {/* Form Data Dokter */}
        <Form
          form={form}
          layout='vertical'
          initialValues={{ nama_dokter: '', spesialisasi: '' }}
          onFinish={(values) => onSubmit(values, file)}
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
      </Space>
    </Drawer>
  );
}

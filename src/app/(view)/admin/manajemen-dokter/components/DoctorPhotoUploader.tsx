'use client';

import React, { useState } from 'react';
import { Upload, Button, message, Image, Space } from 'antd';
import type { UploadProps } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { ApiEndpoints } from '@/constraints/api-endpoints';

export default function DoctorPhotoUploader({ dokterId, url, onUploaded }: { dokterId: string; url?: string | null; onUploaded?: (url: string) => void }) {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | undefined>(url || undefined);

  const props: UploadProps = {
    name: 'file',
    accept: 'image/*',
    showUploadList: false,
    customRequest: async ({ file, onError, onSuccess }) => {
      try {
        setLoading(true);
        const fd = new FormData();
        fd.append('file', file as File);
        const res = await fetch(ApiEndpoints.UploadFotoDokter(dokterId), {
          method: 'POST',
          body: fd,
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j?.message || 'Upload gagal');
        }
        const { url } = await res.json();
        setPreview(url);
        onUploaded?.(url);
        onSuccess?.({}, new XMLHttpRequest());
        message.success('Foto profil diperbarui');
      } catch (e: any) {
        message.error(e?.message || 'Upload gagal');
        onError?.(e);
      } finally {
        setLoading(false);
      }
    },
  };

  return (
    <Space direction='vertical'>
      {preview ? (
        <Image
          src={preview}
          alt='Foto profil dokter'
          width={128}
          height={128}
          style={{ objectFit: 'cover', borderRadius: 8 }}
          preview
        />
      ) : null}
      <Upload {...props}>
        <Button
          icon={<UploadOutlined />}
          loading={loading}
        >
          {preview ? 'Ganti Foto' : 'Unggah Foto'}
        </Button>
      </Upload>
    </Space>
  );
}

'use client';

import React from 'react';
import { message } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { apiAuth } from '@/utils/apiAuth';
import { ApiEndpoints } from '@/constraints/api-endpoints';
import { NewsFormValues } from './NewsFormDrawer'; // Import NewsFormValues

export type Berita = {
  id_berita: string;
  judul: string;
  deskripsi: string;
  tanggal_penerbitan: string; // ISO date from API
  foto_url: string | null;
  createdAt: string;
  updatedAt: string;
};

type ListResp = {
  data: Berita[];
  meta: { page: number; pageSize: number; total: number; pages: number };
};

export type Filters = {
  q: string;
  range: [Dayjs, Dayjs] | null;
};

type Props = {
  filters: Filters;
  refreshToken: number;
  onEditNews: (news: Berita) => void;
  onDataLoaded: (data: Berita[], total: number, page: number, pageSize: number) => void; // Callback to pass data to parent
  onLoadingChange: (loading: boolean) => void; // Callback to pass loading state to parent
  onPageChange: (page: number, pageSize: number) => void; // Callback for pagination changes
  currentPage: number; // Current page from parent
  currentPageSize: number; // Current page size from parent
  onSubmitNews: (values: NewsFormValues, file?: File | null, editing?: Berita | null) => Promise<void>; // New prop for submit
  onDeleteNews: (id: string) => Promise<void>; // New prop for delete
};

export default function BeritaContainer({
  filters,
  refreshToken,
  onEditNews,
  onDataLoaded,
  onLoadingChange,
  onPageChange,
  currentPage,
  currentPageSize,
  onSubmitNews,
  onDeleteNews,
}: Props) {
  const [loading, setLoading] = React.useState(false);
  const [rows, setRows] = React.useState<Berita[]>([]);
  const [page, setPage] = React.useState(currentPage); // Use currentPage from props
  const [pageSize, setPageSize] = React.useState(currentPageSize); // Use currentPageSize from props
  const [total, setTotal] = React.useState(0);

  // Update internal page/pageSize when props change
  React.useEffect(() => {
    setPage(currentPage);
  }, [currentPage]);

  React.useEffect(() => {
    setPageSize(currentPageSize);
  }, [currentPageSize]);


  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      onLoadingChange(true); // Notify parent about loading state

      const params = new URLSearchParams();
      if (filters.q.trim()) params.set('q', filters.q.trim());
      if (filters.range?.[0]) params.set('from', filters.range[0]!.format('YYYY-MM-DD'));
      if (filters.range?.[1]) params.set('to', filters.range[1]!.format('YYYY-MM-DD'));
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));
      params.set('sort', 'recent');

      const url = `${ApiEndpoints.GetBerita}?${params.toString()}`;
      const json = await apiAuth.getDataPrivate<ListResp>(url);

      if (json && 'isExpiredJWT' in json) {
        return;
      }

      if (json) {
        setRows(json.data);
        setTotal(json.meta.total);
        onDataLoaded(json.data, json.meta.total, page, pageSize); // Pass data to parent
      }
    } catch (e: any) {
      message.error(e?.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
      onLoadingChange(false); // Notify parent about loading state
    }
  }, [filters, page, pageSize, onDataLoaded, onLoadingChange]);

  React.useEffect(() => {
    void load();
  }, [load, refreshToken]);

  const handleDelete = async (id: string) => {
    try {
      setLoading(true);
      await apiAuth.deleteDataPrivate(ApiEndpoints.DeleteBerita(id));
      message.success('Berita dihapus');
      if (rows.length === 1 && page > 1) onPageChange(page - 1, pageSize);
      else await load();
    } catch (e: any) {
      message.error(e?.message || 'Gagal menghapus data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: NewsFormValues, file?: File | null, editing?: Berita | null) => {
    try {
      setLoading(true);

      const isEdit = !!editing?.id_berita;
      const url = isEdit ? ApiEndpoints.UpdateBerita(editing!.id_berita) : ApiEndpoints.CreateBerita;

      const fd = new FormData();
      fd.append('judul', values.judul);
      fd.append('deskripsi', values.deskripsi);
      fd.append('tanggal_penerbitan', dayjs(values.tanggal_penerbitan).format('YYYY-MM-DD'));
      if (file) fd.append('file', file);

      if (isEdit) {
        await apiAuth.putDataPrivateWithFile(url, fd);
      } else {
        await apiAuth.postDataPrivateWithFile(url, fd);
      }

      message.success(isEdit ? 'Berita diperbarui' : 'Berita ditambahkan');
      await load();
    } catch (e: any) {
      message.error(e?.message || 'Gagal menyimpan');
    } finally {
      setLoading(false);
    }
  };

  return null;
}

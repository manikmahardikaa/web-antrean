'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
// jika alias @ belum ada, ganti ke relative path yang sesuai proyekmu
import { apiAuth } from '@/utils/apiAuth';
import { ApiEndpoints } from '@/constraints/api-endpoints';

export type DashboardResp = {
  summary: {
    totalUser: number;
    totalDokter: number;
    antreanHariIni: number;
    dibatalkanHariIni: number;
  };
  recentAntrean: {
    key: string;
    pasien: string;
    dokter: string;
    layanan: string;
    tanggal: string; // ISO
    status: 'MENUNGGU' | 'DIPROSES' | 'SELESAI' | 'DIBATALKAN';
    alamat_user: string;
  }[];
  topLayanan: { id_layanan: string; nama: string; total: number }[];
  upcomingJadwal: { waktu: string; dokter: string; layanan: string }[];
  tren7Hari: { tanggal: string; total: number; dibatalkan: number }[];
};

function buildUrl(start?: string, end?: string, layananId?: string) {
  const p = new URLSearchParams();
  if (start) p.set('start', start);
  if (end) p.set('end', end);
  if (layananId) p.set('layananId', layananId);
  const q = p.toString();
  return q ? `${ApiEndpoints.GetDashboard}?${q}` : ApiEndpoints.GetDashboard;
}

export default function useDashboard(range: [string, string] | null, layananId?: string) {
  const url = useMemo(() => buildUrl(range?.[0], range?.[1], layananId), [range, layananId]);

  const [data, setData] = useState<DashboardResp | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<unknown>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiAuth.getDataPrivate<DashboardResp>(url, () => {
        // token expired → ke login
        window.location.href = '/login';
      });
      if ((res as any)?.isExpiredJWT) return; // sudah diarahkan logout di atas
      setData(res as DashboardResp);
    } catch (e) {
      setError(e);
    } finally {
      setIsLoading(false);
    }
  }, [url]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    refresh: fetchData,
    error,
  };
}

import type { Dayjs } from 'dayjs';

export type StatusAntrean = 'MENUNGGU' | 'DIPROSES' | 'SELESAI' | 'DIBATALKAN';
export type Option = { label: string; value: string };

export type UserLite = { id_user: string; nama: string; no_telepon?: string | null };
export type DokterLite = { id_dokter: string; nama_dokter: string; spesialisasi?: string | null };
export type LayananLite = { id_layanan: string; nama_layanan: string };

export type AntreanRow = {
  id_antrean: string;
  id_user: string;
  id_dokter: string;
  id_layanan: string;
  tanggal_kunjungan: string; // ISO
  status: StatusAntrean;
  alamat_user: string;
  dokter_nama_snapshot?: string | null;
  alasan_batal?: string | null;

  user?: UserLite;
  dokter?: DokterLite;
  layanan?: LayananLite;
};

export type Filters = {
  query: string;
  statusFilter: StatusAntrean | 'ALL';
  dokterFilter?: string;
  layananFilter?: string;
  range: [Dayjs, Dayjs] | null;
};

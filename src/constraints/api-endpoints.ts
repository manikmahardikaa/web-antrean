export const ApiEndpoints = {
  // Auth
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',

  // Layanan
  GetLayanan: '/api/layanan',
  CreateLayanan: '/api/layanan',
  GetLayananById: (id: string) => `/api/layanan/${id}`,
  UpdateLayanan: (id: string) => `/api/layanan/${id}`,
  DeleteLayanan: (id: string) => `/api/layanan/${id}`,

  // Tanggungan
  GetTanggungan: '/api/tanggungan',
  CreateTanggungan: '/api/tanggungan',
  GetTanggunganById: (id: string) => `/api/tanggungan/${id}`,
  UpdateTanggungan: (id: string) => `/api/tanggungan/${id}`,
  DeleteTanggungan: (id: string) => `/api/tanggungan/${id}`,

  // Dokter
  GetDokter: '/api/dokter',
  CreateDokter: '/api/dokter',
  GetDokterById: (id: string) => `/api/dokter/${id}`,
  UpdateDokter: (id: string) => `/api/dokter/${id}`,
  DeleteDokter: (id: string) => `/api/dokter/${id}`,
  NonaktifDokter: (id: string) => `/api/dokter/${id}/nonaktif`,
  AktifkanDokter: (id: string) => `/api/dokter/${id}/aktifkan`,

  // Jadwal Praktik
  GetJadwalPraktik: '/api/jadwal-praktik',
  CreateJadwalPraktik: '/api/jadwal-praktik',
  UpdateJadwalPraktik: (id: string) => `/api/jadwal-praktik/${id}`,
  DeleteJadwalPraktik: (id: string) => `/api/jadwal-praktik/${id}`,

  // Slot Praktik
  GetSlotPraktik: '/api/slot-praktik',
  CreateSlotPraktik: '/api/slot-praktik',
  UpdateSlotPraktik: (id: string) => `/api/slot-praktik/${id}`,
  DeleteSlotPraktik: (id: string) => `/api/slot-praktik/${id}`,
  GetRiwayatDokter: (id: string) => `/api/dokter/${id}/riwayat`,

  // antrean
  GetAntrean: '/api/antrean',
  BulkStatusAntrean: '/api/antrean/bulk-status',
  UpdateStatusAntrean: (id: string) => `/api/antrean/${id}/status`,
  ReassignDokterAntrean: (id: string) => `/api/antrean/${id}/reassign-dokter`,
} as const;

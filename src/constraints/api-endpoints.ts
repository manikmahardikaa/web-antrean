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
  GetDokter: '/api/dokter', // pakai query ?onlyActive=true bila perlu
  CreateDokter: '/api/dokter',
  GetDokterById: (id: string) => `/api/dokter/${id}`,
  UpdateDokter: (id: string) => `/api/dokter/${id}`,
  DeleteDokter: (id: string) => `/api/dokter/${id}`,
  NonaktifDokter: (id: string) => `/api/dokter/${id}/nonaktif`,
  AktifkanDokter: (id: string) => `/api/dokter/${id}/aktifkan`,
  UploadFotoDokter: (id: string) => `/api/dokter/${id}/upload-foto`,

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

  // Antrean
  GetAntrean: '/api/antrean',
  BulkStatusAntrean: '/api/antrean/bulk-status',
  UpdateStatusAntrean: (id: string) => `/api/antrean/${id}/status`,
  ReassignDokterAntrean: (id: string) => `/api/antrean/${id}/reassign-dokter`,

  // Users (CRUD)
  GetUsers: '/api/users', // ADMIN; dukung query ?q=&role=&jk=&layanan=&tanggungan=
  CreateUser: '/api/users', // ADMIN
  GetUserById: (id: string) => `/api/users/${id}`,
  UpdateUser: (id: string) => `/api/users/${id}`,
  DeleteUser: (id: string) => `/api/users/${id}`,

  // Berita Kesehatan
  GetBerita: '/api/berita-kesehatan',
  CreateBerita: '/api/berita-kesehatan',
  GetBeritaById: (id: string) => `/api/berita-kesehatan/${id}`,
  UpdateBerita: (id: string) => `/api/berita-kesehatan/${id}`,
  DeleteBerita: (id: string) => `/api/berita-kesehatan/${id}`,

  // Video Kesehatan
  GetVideo: '/api/video-kesehatan',
  CreateVideo: '/api/video-kesehatan',
  GetVideoById: (id: string) => `/api/video-kesehatan/${id}`,
  UpdateVideo: (id: string) => `/api/video-kesehatan/${id}`,
  DeleteVideo: (id: string) => `/api/video-kesehatan/${id}`,

  GetDashboard: '/api/admin/dashboard',
} as const;

'use client';

import React from 'react';
import { message } from 'antd';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { apiAuth } from '@/utils/apiAuth';
import { ApiEndpoints } from '@/constraints/api-endpoints';
import type { Slot as SlotRow } from './SlotTable';

dayjs.extend(utc);

export type Dokter = {
  id_dokter: string;
  nama_dokter: string;
  spesialisasi: string;
  is_active: boolean;
  alasan_nonaktif?: string | null;
  deletedAt?: string | null;
  foto_profil_dokter?: string | null;
};

export type Jadwal = {
  id_jadwal: string;
  id_dokter: string;
  tanggal: string; // dari API
  jam_mulai: string;
  jam_selesai: string;
};

export type Riwayat = {
  id_antrean: string;
  id_user: string;
  nama_user: string;
  waktu: string;
  keterangan?: string | null;
};

/** ==== FIX INTI: pakukan tanggal ke UTC midnight ==== */
function toUTCDateOnly(input: any): Date {
  const d = dayjs(input);
  // Buat Date di UTC 00:00 agar tidak kena offset zona waktu
  return new Date(Date.UTC(d.year(), d.month(), d.date()));
}

function toHHmm(input: any): string {
  // Terima string/Date/dayjs → hasilkan 'HH:mm'
  const d = dayjs(input);
  return d.isValid() ? d.format('HH:mm') : String(input ?? '');
}

const toSlotRow = (x: any): SlotRow => {
  const terisi = typeof x?.terisi === 'number' ? x.terisi : 0;
  const kapasitas = typeof x?.kapasitas === 'number' ? x.kapasitas : 1;
  const sisa = typeof x?.sisa === 'number' ? x.sisa : Math.max(0, kapasitas - terisi);
  return {
    id_slot: x.id_slot,
    id_jadwal: x.id_jadwal,
    id_dokter: x.id_dokter,
    tanggal: x.tanggal,
    jam_mulai: x.jam_mulai,
    jam_selesai: x.jam_selesai,
    kapasitas,
    terisi,
    sisa,
    is_active: !!x.is_active,
  };
};

/** Izinkan form mengirim string/Date/dayjs */
export type PraktikSubmit =
  | {
      type: 'jadwal';
      mode: 'create' | 'edit';
      id?: string;
      data: {
        tanggal: string | Date; // ← fleksibel
        jam_mulai: string | Date; // ← fleksibel
        jam_selesai: string | Date; // ← fleksibel
      };
    }
  | {
      type: 'slot';
      mode: 'create' | 'edit';
      id?: string;
      data: { id_jadwal: string; kapasitas: number; is_active?: boolean };
    };

export function useDokterDetail(dokterId: string) {
  const [loading, setLoading] = React.useState(false);
  const [dokter, setDokter] = React.useState<Dokter | null>(null);
  const [jadwal, setJadwal] = React.useState<Jadwal[]>([]);
  const [slotAktif, setSlotAktif] = React.useState<SlotRow[]>([]);
  const [slotNonaktif, setSlotNonaktif] = React.useState<SlotRow[]>([]);
  const [riwayat, setRiwayat] = React.useState<Riwayat[]>([]);
  // di atas, bareng state lainnya

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      const [d, j, sAct, sInact, hist] = await Promise.all([
        apiAuth.getDataPrivate(ApiEndpoints.GetDokterById(dokterId)),
        apiAuth.getDataPrivate(`${ApiEndpoints.GetJadwalPraktik}?id_dokter=${dokterId}`),
        apiAuth.getDataPrivate(`${ApiEndpoints.GetSlotPraktik}?status=active&id_dokter=${dokterId}`),
        apiAuth.getDataPrivate(`${ApiEndpoints.GetSlotPraktik}?status=inactive&id_dokter=${dokterId}`),
        apiAuth.getDataPrivate(`${ApiEndpoints.GetRiwayatDokter?.(dokterId) ?? `/api/dokter/${dokterId}/riwayat`}?limit=50`),
      ]);
      if (!d?.id_dokter) throw new Error(d?.message || 'Dokter tidak ditemukan');
      setDokter(d);
      setJadwal(Array.isArray(j) ? j : []);
      setSlotAktif(Array.isArray(sAct) ? sAct.map(toSlotRow) : []);
      setSlotNonaktif(Array.isArray(sInact) ? sInact.map(toSlotRow) : []);
      setRiwayat(Array.isArray(hist) ? hist : []);
    } catch (e: any) {
      message.error(e?.message || 'Gagal memuat detail');
    } finally {
      setLoading(false);
    }
  }, [dokterId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const nonaktifkan = async (alasan?: string) => {
    try {
      setLoading(true);
      const res = await apiAuth.postDataPrivate(ApiEndpoints.NonaktifDokter(dokterId), {
        alasan_nonaktif: alasan?.trim() || 'Nonaktif manual',
      });
      if (!res || res?.ok === false) throw new Error(res?.message || 'Gagal menonaktifkan');
      message.success('Dokter dinonaktifkan');
      await load();
    } catch (e: any) {
      message.error(e?.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const aktifkan = async () => {
    try {
      setLoading(true);
      const res = await apiAuth.postDataPrivate(ApiEndpoints.AktifkanDokter(dokterId), {});
      if (!res || res?.ok === false) throw new Error(res?.message || 'Gagal mengaktifkan');
      message.success('Dokter diaktifkan kembali');
      await load();
    } catch (e: any) {
      message.error(e?.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async (values: { nama_dokter: string; spesialisasi: string }, file?: File | null) => {
    try {
      setLoading(true);

      if (file) {
        const fd = new FormData();
        fd.append('nama_dokter', values.nama_dokter.trim());
        fd.append('spesialisasi', values.spesialisasi.trim());
        fd.append('file', file);
        await apiAuth.putDataPrivateWithFile(ApiEndpoints.UpdateDokter(dokterId), fd);
      } else {
        await apiAuth.putDataPrivate(ApiEndpoints.UpdateDokter(dokterId), {
          nama_dokter: values.nama_dokter.trim(),
          spesialisasi: values.spesialisasi.trim(),
        });
      }

      message.success('Profil dokter diperbarui');
      await load();
    } catch (e: any) {
      message.error(e?.message || 'Gagal memperbarui profil');
    } finally {
      setLoading(false);
    }
  };

  const submitPraktik = async (p: PraktikSubmit) => {
    try {
      setLoading(true);
      if (p.type === 'jadwal') {
        // ====== NORMALISASI PAYLOAD JADWAL ======
        const payload = {
          tanggal: toUTCDateOnly(p.data.tanggal), // <— kunci: UTC 00:00
          jam_mulai: toHHmm(p.data.jam_mulai),
          jam_selesai: toHHmm(p.data.jam_selesai),
        };

        if (p.mode === 'edit' && p.id) {
          const res = await apiAuth.putDataPrivate(ApiEndpoints.UpdateJadwalPraktik(p.id), payload);
          if (res?.message && !res?.id_jadwal) throw new Error(res.message);
          message.success('Jadwal diperbarui');
        } else {
          const res = await apiAuth.postDataPrivate(ApiEndpoints.CreateJadwalPraktik, { ...payload, id_dokter: dokterId });
          if (!res || (!res.id_jadwal && !res.ok)) throw new Error(res?.message || 'Gagal menyimpan jadwal');
          message.success('Jadwal ditambahkan');
        }
      } else {
        if (p.mode === 'edit' && p.id) {
          const res = await apiAuth.putDataPrivate(ApiEndpoints.UpdateSlotPraktik(p.id), p.data);
          if (res?.message && !res?.id_slot) throw new Error(res.message);
          message.success('Slot diperbarui');
        } else {
          const res = await apiAuth.postDataPrivate(ApiEndpoints.CreateSlotPraktik, p.data);
          if (!res || (!res.id_slot && !res.ok)) throw new Error(res?.message || 'Gagal menyimpan slot');
          message.success('Slot ditambahkan');
        }
      }
      await load();
    } catch (e: any) {
      message.error(e?.message || 'Gagal menyimpan');
    } finally {
      setLoading(false);
    }
  };

  const toggleSlot = async (row: SlotRow, next: boolean) => {
    try {
      setLoading(true);
      const res = await apiAuth.putDataPrivate(ApiEndpoints.UpdateSlotPraktik(row.id_slot), { is_active: next });
      if (res?.message && res?.id_slot === undefined) throw new Error(res.message);
      message.success(next ? 'Slot diaktifkan' : 'Slot dinonaktifkan');
      await load();
    } catch (e: any) {
      message.error(e?.message || 'Gagal mengganti status slot');
    } finally {
      setLoading(false);
    }
  };

  const deleteSlot = async (id_slot: string) => {
    try {
      setLoading(true);
      const res = await apiAuth.deleteDataPrivate(ApiEndpoints.DeleteSlotPraktik(id_slot));
      if (res?.message && res?.ok !== true) throw new Error(res.message);
      message.success('Slot dihapus');
      await load();
    } catch (e: any) {
      message.error(e?.message || 'Tidak bisa menghapus slot');
    } finally {
      setLoading(false);
    }
  };

  const deleteJadwal = async (id_jadwal: string) => {
    try {
      setLoading(true);
      const res = await apiAuth.deleteDataPrivate(ApiEndpoints.DeleteJadwalPraktik(id_jadwal));
      if (res?.message && res?.ok !== true) throw new Error(res.message);
      message.success('Jadwal dihapus');
      await load();
    } catch (e: any) {
      message.error(e?.message || 'Tidak bisa menghapus jadwal');
    } finally {
      setLoading(false);
    }
  };

  const jadwalOptions = React.useMemo(() => {
    const taken = new Set<string>([...slotAktif, ...slotNonaktif].map((s) => s.id_jadwal).filter(Boolean) as string[]);
    return jadwal
      .filter((j) => !taken.has(j.id_jadwal))
      .map((j) => ({
        value: j.id_jadwal,
        label: `${dayjs(j.tanggal).format('DD MMM YYYY')} • ${dayjs(j.jam_mulai).format('HH:mm')}–${dayjs(j.jam_selesai).format('HH:mm')}`,
      }));
  }, [jadwal, slotAktif, slotNonaktif]);

  return {
    loading,
    dokter,
    jadwal,
    slotAktif,
    slotNonaktif,
    riwayat,
    load,
    nonaktifkan,
    aktifkan,
    saveProfile,
    submitPraktik,
    toggleSlot,
    deleteSlot,
    deleteJadwal,
    jadwalOptions,
  };
}

export default useDokterDetail;

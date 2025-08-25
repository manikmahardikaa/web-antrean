'use client';

import { Drawer, Tabs, Form, DatePicker, TimePicker, InputNumber, Space, Button, Select, Input } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

type JadwalOption = { label: string; value: string };

export type PraktikDrawerMode = 'create' | 'edit';
export type PraktikTab = 'jadwal' | 'slot';

export default function PraktikDrawer({
  open,
  loading,
  onClose,
  onSubmit,
  jadwalOptions,
  mode = 'create',
  activeTab = 'jadwal',
  initialJadwal,
  initialSlot,
  editIds, // { jadwalId?, slotId? }
  disableChangeJadwal = true,
  currentJadwalLabel,
}: {
  open: boolean;
  loading: boolean;
  onClose: () => void;
  onSubmit: (p: { type: 'jadwal' | 'slot'; mode: PraktikDrawerMode; id?: string; data: any }) => void;
  jadwalOptions: JadwalOption[];
  mode?: PraktikDrawerMode;
  activeTab?: PraktikTab;
  initialJadwal?: { tanggal: string; jam_mulai: string; jam_selesai: string };
  initialSlot?: { id_jadwal: string; kapasitas: number };
  editIds?: { jadwalId?: string; slotId?: string };
  disableChangeJadwal?: boolean;
  currentJadwalLabel?: string;
}) {
  const [tab, setTab] = useState<PraktikTab>(activeTab);
  const [formJ] = Form.useForm<{ tanggal: any; jam_mulai: any; jam_selesai: any }>();
  const [formS] = Form.useForm<{ id_jadwal: string; kapasitas: number }>();

  /** Helpers untuk prefill agar tidak geser timezone */
  const toLocalDateFromUTCDateOnly = (iso?: string) => {
    if (!iso) return null;
    const d = dayjs.utc(iso); // tanggal UTC 00:00 dari server
    return dayjs().year(d.year()).month(d.month()).date(d.date()).startOf('day'); // dayjs lokal, hari sama
  };
  const toLocalClockFromISO = (iso?: string) => {
    if (!iso) return null;
    const hhmm = dayjs.utc(iso).format('HH:mm'); // ambil jam-menit di UTC
    const [h, m] = hhmm.split(':').map((n) => parseInt(n, 10));
    return dayjs().hour(h).minute(m).second(0).millisecond(0); // representasi lokal, jam sama
  };

  // sync open/mode/initials
  useEffect(() => {
    if (open) {
      setTab(activeTab);

      // Prefill JADWAL (aman timezone)
      if (mode === 'edit' && initialJadwal) {
        formJ.setFieldsValue({
          tanggal: toLocalDateFromUTCDateOnly(initialJadwal.tanggal),
          jam_mulai: toLocalClockFromISO(initialJadwal.jam_mulai),
          jam_selesai: toLocalClockFromISO(initialJadwal.jam_selesai),
        });
      } else {
        formJ.resetFields();
      }

      // Prefill SLOT
      if (initialSlot) {
        formS.setFieldsValue({
          id_jadwal: initialSlot.id_jadwal,
          kapasitas: typeof initialSlot.kapasitas === 'number' ? initialSlot.kapasitas : 1,
        });
      } else {
        formS.resetFields();
      }
    } else {
      formJ.resetFields();
      formS.resetFields();
      setTab('jadwal');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, activeTab, initialJadwal, initialSlot]);

  const submitJadwal = async () => {
    const v = await formJ.validateFields();
    const payload = {
      // kirim Date mentah → container akan set ke UTC 00:00
      tanggal: dayjs(v.tanggal).toDate(),
      // kirim jam "HH:mm" → container akan normalisasi ke anchor UTC
      jam_mulai: dayjs(v.jam_mulai).format('HH:mm'),
      jam_selesai: dayjs(v.jam_selesai).format('HH:mm'),
    };
    formJ.resetFields();
    onSubmit({ type: 'jadwal', mode, id: editIds?.jadwalId, data: payload });
  };

  const submitSlot = async () => {
    const v = await formS.validateFields();
    const id_jadwal = v.id_jadwal || initialSlot?.id_jadwal; // guard saat dikunci
    const payload = {
      id_jadwal,
      kapasitas: Number(v.kapasitas ?? 1),
    };
    formS.resetFields();
    onSubmit({ type: 'slot', mode, id: editIds?.slotId, data: payload });
  };

  // ==== Kunci Select id_jadwal saat EDIT ====
  const isEditLocked = mode === 'edit' && disableChangeJadwal;
  const currentId = Form.useWatch('id_jadwal', formS) as string | undefined;

  // Cari label manis untuk ditampilkan saat edit & jadwal dikunci
  const displayLabel = useMemo(() => {
    const id = currentId || initialSlot?.id_jadwal;

    const fromOptions = id ? jadwalOptions.find((o) => o.value === id)?.label : undefined;
    if (fromOptions) return fromOptions;

    if (currentJadwalLabel && currentJadwalLabel.trim()) return currentJadwalLabel;

    if (initialJadwal?.tanggal && initialJadwal?.jam_mulai && initialJadwal?.jam_selesai) {
      return `${dayjs(initialJadwal.tanggal).format('DD MMM YYYY')} • ${dayjs(initialJadwal.jam_mulai).format('HH:mm')}–${dayjs(initialJadwal.jam_selesai).format('HH:mm')}`;
    }

    return id || '-';
  }, [currentId, initialSlot?.id_jadwal, jadwalOptions, currentJadwalLabel, initialJadwal]);

  return (
    <Drawer
      title={mode === 'edit' ? 'Ubah Jadwal / Slot' : 'Tambah Jadwal / Slot'}
      width={560}
      open={open}
      onClose={() => {
        formJ.resetFields();
        formS.resetFields();
        setTab('jadwal');
        onClose();
      }}
      destroyOnClose
      maskClosable={false}
    >
      <Tabs
        activeKey={tab}
        onChange={(k) => setTab(k as PraktikTab)}
        items={[
          {
            key: 'jadwal',
            label: 'Jadwal Praktik',
            children: (
              <Form
                form={formJ}
                layout='vertical'
                onFinish={submitJadwal}
              >
                <Form.Item
                  name='tanggal'
                  label='Tanggal'
                  rules={[{ required: true, message: 'Pilih tanggal' }]}
                >
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item
                  name='jam_mulai'
                  label='Jam Mulai'
                  rules={[{ required: true, message: 'Pilih jam mulai' }]}
                >
                  <TimePicker
                    style={{ width: '100%' }}
                    format='HH:mm'
                  />
                </Form.Item>
                <Form.Item
                  name='jam_selesai'
                  label='Jam Selesai'
                  rules={[{ required: true, message: 'Pilih jam selesai' }]}
                >
                  <TimePicker
                    style={{ width: '100%' }}
                    format='HH:mm'
                  />
                </Form.Item>
                <Space style={{ justifyContent: 'flex-end', width: '100%' }}>
                  <Button onClick={onClose}>Batal</Button>
                  <Button
                    type='primary'
                    htmlType='submit'
                    loading={loading}
                  >
                    {mode === 'edit' ? 'Simpan Perubahan' : 'Tambah Jadwal'}
                  </Button>
                </Space>
              </Form>
            ),
          },
          {
            key: 'slot',
            label: 'Slot Praktik',
            children: (
              <Form
                form={formS}
                layout='vertical'
                onFinish={submitSlot}
              >
                {isEditLocked ? (
                  <>
                    {/* Hidden agar ikut submit */}
                    <Form.Item
                      name='id_jadwal'
                      style={{ display: 'none' }}
                    >
                      <Input />
                    </Form.Item>
                    {/* Label cantik, terkunci */}
                    <Form.Item label='Jadwal'>
                      <Select
                        value={currentId || initialSlot?.id_jadwal || ''}
                        options={[
                          {
                            value: currentId || initialSlot?.id_jadwal || '',
                            label: displayLabel,
                          },
                        ]}
                        disabled
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                  </>
                ) : (
                  <Form.Item
                    name='id_jadwal'
                    label='Pilih Jadwal'
                    rules={[{ required: true, message: 'Pilih jadwal' }]}
                  >
                    <Select
                      showSearch
                      placeholder='Pilih jadwal'
                      options={jadwalOptions}
                      filterOption={(input, option) => (option?.label as string).toLowerCase().includes(input.toLowerCase())}
                    />
                  </Form.Item>
                )}

                <Form.Item
                  name='kapasitas'
                  label='Kapasitas'
                  rules={[{ required: true, message: 'Isi kapasitas' }]}
                >
                  <InputNumber
                    min={1}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
                <Space style={{ justifyContent: 'flex-end', width: '100%' }}>
                  <Button onClick={onClose}>Batal</Button>
                  <Button
                    type='primary'
                    htmlType='submit'
                    loading={loading}
                  >
                    {mode === 'edit' ? 'Simpan Perubahan' : 'Tambah Slot'}
                  </Button>
                </Space>
              </Form>
            ),
          },
        ]}
      />
    </Drawer>
  );
}

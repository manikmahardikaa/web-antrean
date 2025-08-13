'use client';

import { Drawer, Tabs, Form, DatePicker, TimePicker, InputNumber, Space, Button, Select } from 'antd';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';

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
}) {
  const [tab, setTab] = useState<PraktikTab>(activeTab);
  const [formJ] = Form.useForm<{ tanggal: any; jam_mulai: any; jam_selesai: any }>();
  const [formS] = Form.useForm<{ id_jadwal: string; kapasitas: number }>();

  // sync open/mode/initials
  useEffect(() => {
    if (open) {
      setTab(activeTab);
      // prefill edit
      if (mode === 'edit' && initialJadwal) {
        formJ.setFieldsValue({
          tanggal: dayjs(initialJadwal.tanggal),
          jam_mulai: dayjs(initialJadwal.jam_mulai),
          jam_selesai: dayjs(initialJadwal.jam_selesai),
        });
      } else {
        formJ.resetFields();
      }
      if (mode === 'edit' && initialSlot) {
        formS.setFieldsValue({
          id_jadwal: initialSlot.id_jadwal,
          kapasitas: initialSlot.kapasitas,
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
      tanggal: dayjs(v.tanggal).startOf('day').toISOString(),
      jam_mulai: dayjs(v.jam_mulai).toISOString(),
      jam_selesai: dayjs(v.jam_selesai).toISOString(),
    };
    formJ.resetFields(); // hindari expose nilai
    onSubmit({ type: 'jadwal', mode, id: editIds?.jadwalId, data: payload });
  };

  const submitSlot = async () => {
    const v = await formS.validateFields();
    const payload = { id_jadwal: v.id_jadwal, kapasitas: Number(v.kapasitas ?? 1) };
    formS.resetFields();
    onSubmit({ type: 'slot', mode, id: editIds?.slotId, data: payload });
  };

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
                    disabled={mode === 'edit' && disableChangeJadwal}
                  />
                </Form.Item>
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

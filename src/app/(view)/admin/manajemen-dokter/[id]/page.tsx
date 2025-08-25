'use client';

import React from 'react';
import { Card, Space, Typography, Tag, Button, Row, Col, Tabs, Table, message, Modal, Form, Input, Avatar, Image } from 'antd';
import { CheckCircleOutlined, StopOutlined, EditOutlined, PlusOutlined, SwapOutlined, UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

import { useDokterDetail } from './components/DokterDetailContainer';
import JadwalPraktikTable from './components/JadwalTable';
import SlotPraktikTable from './components/SlotTable';
import PraktikDrawer, { PraktikDrawerMode, PraktikTab } from './components/PraktikDrawer';
import DokterFormDrawer from '../components/DoctorFormDrawer';

dayjs.extend(utc);

const { Title, Text } = Typography;
const { TextArea } = Input;

type Riwayat = {
  id_antrean: string;
  id_user: string;
  nama_user: string;
  waktu: string;
  keterangan?: string | null;
};

// Helper aman timezone (ISO UTC → tampil konsisten)
const fmtDate = (iso?: string) => (iso ? dayjs.utc(iso).format('DD MMM YYYY') : '');
const fmtTime = (iso?: string) => (iso ? dayjs.utc(iso).format('HH:mm') : '');

export default function DetailDokterPage({ params }: { params: { id: string } }) {
  const dokterId = params.id;
  const { loading, dokter, jadwal, slotAktif, slotNonaktif, riwayat, nonaktifkan, aktifkan, saveProfile, submitPraktik, toggleSlot, deleteSlot, deleteJadwal, jadwalOptions } = useDokterDetail(dokterId);

  const headerTag = dokter?.is_active ? (
    <Tag
      color='success'
      icon={<CheckCircleOutlined />}
    >
      Aktif
    </Tag>
  ) : (
    <Tag icon={<StopOutlined />}>Nonaktif</Tag>
  );

  // Edit Profil
  const [editOpen, setEditOpen] = React.useState(false);
  const [savingProfile, setSavingProfile] = React.useState(false);

  // Nonaktif modal
  const [modalOpen, setModalOpen] = React.useState(false);
  const [modalForm] = Form.useForm<{ alasan_nonaktif?: string }>();

  // Praktik drawer — create/edit unified
  const [praktikOpen, setPraktikOpen] = React.useState(false);
  const [praktikMode, setPraktikMode] = React.useState<PraktikDrawerMode>('create');
  const [praktikTab, setPraktikTab] = React.useState<PraktikTab>('jadwal');
  const [initialJadwal, setInitialJadwal] = React.useState<{ tanggal: string; jam_mulai: string; jam_selesai: string } | undefined>();
  const [initialSlot, setInitialSlot] = React.useState<{ id_jadwal: string; kapasitas: number } | undefined>();
  const [editIds, setEditIds] = React.useState<{ jadwalId?: string; slotId?: string }>({});
  const [currentJadwalLabel, setCurrentJadwalLabel] = React.useState<string | undefined>(undefined);

  const openCreatePraktik = () => {
    setPraktikMode('create');
    setPraktikTab('jadwal');
    setInitialJadwal(undefined);
    setInitialSlot(undefined);
    setEditIds({});
    setCurrentJadwalLabel(undefined);
    setPraktikOpen(true);
  };

  const openEditJadwal = (row: { id_jadwal: string; tanggal: string; jam_mulai: string; jam_selesai: string }) => {
    setPraktikMode('edit');
    setPraktikTab('jadwal');
    setInitialJadwal({ tanggal: row.tanggal, jam_mulai: row.jam_mulai, jam_selesai: row.jam_selesai });
    setInitialSlot(undefined);
    setEditIds({ jadwalId: row.id_jadwal });
    setCurrentJadwalLabel(undefined);
    setPraktikOpen(true);
  };

  const openEditSlot = (row: { id_slot: string; id_jadwal?: string; kapasitas: number; tanggal?: string; jam_mulai?: string; jam_selesai?: string }) => {
    setPraktikMode('edit');
    setPraktikTab('slot');
    setInitialJadwal(undefined);
    setInitialSlot({ id_jadwal: row.id_jadwal || '', kapasitas: row.kapasitas });
    setEditIds({ slotId: row.id_slot });

    // Label aman timezone
    setCurrentJadwalLabel(`${fmtDate(row.tanggal)} • ${fmtTime(row.jam_mulai)}–${fmtTime(row.jam_selesai)}`);

    setPraktikOpen(true);
  };

  const handleSubmitPraktik = async (p: { type: 'jadwal' | 'slot'; mode: PraktikDrawerMode; id?: string; data: any }) => {
    await submitPraktik(p);
    setPraktikOpen(false);
    setCurrentJadwalLabel(undefined);
  };

  const submitNonaktif = async () => {
    try {
      const { alasan_nonaktif } = await modalForm.validateFields();
      await nonaktifkan(alasan_nonaktif);
      setModalOpen(false);
    } catch (e: any) {
      if (e?.errorFields) return;
      message.error(e?.message || 'Terjadi kesalahan');
    }
  };

  return (
    <Space
      direction='vertical'
      size={16}
      style={{ width: '100%' }}
    >
      <Card>
        <Row
          justify='space-between'
          gutter={[16, 16]}
          align='middle'
        >
          <Col>
            {dokter?.foto_profil_dokter ? (
              <Image
                src={dokter.foto_profil_dokter}
                alt='Foto profil dokter'
                width={96}
                height={96}
                style={{ objectFit: 'cover', borderRadius: 8 }}
              />
            ) : (
              <Avatar
                shape='square'
                size={96}
                icon={<UserOutlined />}
                style={{ background: '#f0f0f0', color: '#555' }}
              />
            )}
          </Col>
          <Col flex='auto'>
            <Space
              direction='vertical'
              size={0}
            >
              <Title
                level={4}
                style={{ margin: 0 }}
              >
                {dokter?.nama_dokter}
              </Title>
              <Text type='secondary'>{dokter?.spesialisasi}</Text>
              <div style={{ marginTop: 8 }}>
                {headerTag} {dokter?.alasan_nonaktif && !dokter.is_active ? <Text type='secondary'>• {dokter.alasan_nonaktif}</Text> : null}
              </div>
            </Space>
          </Col>
          <Col>
            <Space wrap>
              <Button
                icon={<EditOutlined />}
                onClick={() => setEditOpen(true)}
              >
                Edit Profil
              </Button>
              {dokter?.is_active ? (
                <Button
                  danger
                  icon={<SwapOutlined />}
                  onClick={() => setModalOpen(true)}
                >
                  Nonaktifkan
                </Button>
              ) : (
                <Button
                  type='primary'
                  ghost
                  icon={<CheckCircleOutlined />}
                  onClick={() => void aktifkan()}
                >
                  Aktifkan
                </Button>
              )}
              <Button
                type='primary'
                icon={<PlusOutlined />}
                onClick={openCreatePraktik}
              >
                Tambah Jadwal/Slot
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Tabs
        items={[
          {
            key: 'jadwal',
            label: 'Jadwal Praktik',
            children: (
              <JadwalPraktikTable
                data={jadwal}
                loading={loading}
                onDelete={(id) => void deleteJadwal(id)}
                onEdit={openEditJadwal}
              />
            ),
          },
          {
            key: 'slot',
            label: 'Slot Praktik',
            children: (
              <SlotPraktikTable
                aktif={slotAktif}
                nonaktif={slotNonaktif}
                loading={loading}
                onToggle={(row, next) => void toggleSlot(row, next)}
                onDelete={(id) => void deleteSlot(id)}
                onEdit={openEditSlot}
              />
            ),
          },
          {
            key: 'riwayat',
            label: 'Riwayat Pasien',
            children: (
              <Table<Riwayat>
                rowKey='id_antrean'
                size='middle'
                loading={loading}
                columns={
                  [
                    { title: 'Waktu', dataIndex: 'waktu', key: 'waktu', render: (v: string) => dayjs.utc(v).format('DD MMM YYYY HH:mm') },
                    { title: 'Pasien', dataIndex: 'nama_user', key: 'nama_user' },
                    { title: 'Keterangan', dataIndex: 'keterangan', key: 'keterangan' },
                  ] as any
                }
                dataSource={riwayat}
                pagination={{ pageSize: 10, showSizeChanger: true }}
                scroll={{ x: 720 }}
              />
            ),
          },
        ]}
      />

      {/* Drawer Edit Profil */}
      <DokterFormDrawer
        open={editOpen}
        loading={loading || savingProfile}
        editing={
          dokter
            ? {
                id_dokter: dokter.id_dokter,
                nama_dokter: dokter.nama_dokter,
                spesialisasi: dokter.spesialisasi,
                foto_profil_dokter: dokter.foto_profil_dokter ?? null,
              }
            : null
        }
        onClose={() => setEditOpen(false)}
        onSubmit={async (v, file) => {
          setSavingProfile(true);
          try {
            await saveProfile(v, file);
            setEditOpen(false);
          } finally {
            setSavingProfile(false);
          }
        }}
      />

      {/* Drawer Praktik terpadu */}
      <PraktikDrawer
        open={praktikOpen}
        loading={loading}
        onClose={() => {
          setPraktikOpen(false);
          setCurrentJadwalLabel(undefined);
        }}
        onSubmit={handleSubmitPraktik}
        jadwalOptions={jadwalOptions}
        mode={praktikMode}
        activeTab={praktikTab}
        initialJadwal={initialJadwal}
        initialSlot={initialSlot}
        editIds={editIds}
        disableChangeJadwal
        currentJadwalLabel={currentJadwalLabel}
      />

      {/* Modal Nonaktif Dokter */}
      <Modal
        title='Nonaktifkan Dokter'
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => void submitNonaktif()}
        okText='Konfirmasi'
        confirmLoading={loading}
        destroyOnClose
      >
        <Form
          form={modalForm}
          layout='vertical'
        >
          <Form.Item
            name='alasan_nonaktif'
            label='Alasan (opsional)'
          >
            <TextArea
              rows={3}
              maxLength={200}
              placeholder='Cuti, mutasi, dll'
            />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}

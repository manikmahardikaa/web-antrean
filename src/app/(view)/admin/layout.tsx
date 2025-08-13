'use client';

import React, { useState, useContext, useEffect, ReactNode } from 'react';
import Link from 'next/link';
import { Layout, Menu, Drawer, Button, Dropdown, Avatar, Modal, Flex, Image, ConfigProvider, Skeleton, notification, MenuProps } from 'antd';
import { HomeOutlined, UserOutlined, ScheduleOutlined, CalendarOutlined, BankOutlined, EnvironmentOutlined, SettingOutlined, MenuOutlined, LogoutOutlined } from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import { AuthContext } from '@/providers/AuthProvider';

const { Sider, Content, Footer } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

function getItem(label: React.ReactNode, key: string, icon?: React.ReactNode, children?: MenuItem[]): MenuItem {
  return { key, icon, children, label } as MenuItem;
}

const items: MenuItem[] = [
  getItem(<Link href='/admin/dashboard'>Home</Link>, 'home', <HomeOutlined />),
  getItem(<Link href='/admin/manajemen-layanan'>Manajemen Layanan</Link>, 'manajemen-layanan', <ScheduleOutlined />),
  getItem(<Link href='/admin/manajemen-tanggungan'>Manajemen Tanggungan</Link>, 'manajemen-tanggungan', <ScheduleOutlined />),
  getItem(<Link href='/admin/manajemen-dokter'>Manajemen Dokter</Link>, 'manajemen-dokter', <ScheduleOutlined />),
  getItem(<Link href='/admin/manajemen-antrean'>Manajemen Antrean</Link>, 'manajemen-antrean', <CalendarOutlined />),
  getItem(<Link href='/admin/berita-kesehatan'> Berita Kesehatan</Link>, 'berita-kesehatan', <BankOutlined />),
  getItem(<Link href='/admin/video-kesehatan'>Video Kesehatan</Link>, 'video-kesehatan', <EnvironmentOutlined />),
  getItem(<Link href='/admin/manajemen-pengguna'>Manajemen Pengguna</Link>, 'pengguna', <SettingOutlined />),
];

const menuMap: Record<string, string> = {
  '/admin/dashboard': 'home',
  '/admin/manajemen-layanan': 'manajemen-layanan',
  '/admin/manajemen-tanggungan': 'manajemen-tanggungan',
  '/admin/manajemen-dokter': 'manajemen-dokter',
  '/admin/manajemen-antrean': 'manajemen-antrean',
  '/admin/berita-kesehatan': 'berita-kesehatan',
  '/admin/video-kesehatan': 'video-kesehatan',
  '/admin/manajemen-pengguna': 'pengguna',
};

interface AdminDashboardLayoutProps {
  children: ReactNode;
}

const AdminDashboardLayout: React.FC<AdminDashboardLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const { userProfile, isLoggedIn, isLoading, logout } = useContext(AuthContext)!;
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isLoading && (!isLoggedIn || userProfile?.role !== 'ADMIN')) {
      router.push('/login');
    }
  }, [isLoading, isLoggedIn, userProfile, router]);

  useEffect(() => {
    if (!isMobile) setDrawerVisible(false);
  }, [isMobile]);

  function getSelectedKeys(pathname: string): string[] {
    const found = Object.entries(menuMap).find(([k]) => pathname.startsWith(k));
    return found ? [found[1]] : [];
  }

  const selectedKeys = getSelectedKeys(pathname);
  const primaryColor = '#1677ff';
  const loading = isLoading;

  return (
    <ConfigProvider
      theme={{
        components: {
          Layout: {
            siderBg: 'white',
            triggerBg: primaryColor,
            triggerColor: 'white',
            footerBg: 'white',
          },
          Menu: {
            colorBgContainer: 'white',
            colorText: primaryColor,
          },
        },
        token: { colorPrimary: primaryColor },
      }}
    >
      <Layout style={{ minHeight: '100vh' }}>
        {/* DESKTOP SIDER */}
        {!isMobile && (
          <Sider
            collapsible
            collapsed={collapsed}
            onCollapse={setCollapsed}
            style={{
              position: 'fixed',
              height: '100vh',
              overflowY: 'auto',
              left: 0,
              zIndex: 1000,
              boxShadow: '8px 0 10px -5px rgba(0,0,0,0.07)',
            }}
            width={200}
          >
            <div style={{ padding: '16px', textAlign: 'center' }}>
              <Image
                src='/assets/images/logo.png'
                alt='Logo'
                width={80}
                preview={false}
              />
            </div>

            {loading ? (
              <div style={{ padding: 12 }}>
                {Array.from({ length: 9 }).map((_, i) => (
                  <Skeleton.Button
                    key={i}
                    active
                    block
                    style={{ height: 40, marginBottom: 12 }}
                  />
                ))}
              </div>
            ) : (
              <Menu
                mode='inline'
                selectedKeys={selectedKeys}
                items={items}
              />
            )}
          </Sider>
        )}

        {/* MOBILE DRAWER */}
        {isMobile && (
          <Drawer
            title='Menu'
            placement='left'
            closable
            onClose={() => setDrawerVisible(false)}
            open={drawerVisible}
            bodyStyle={{ padding: 0 }}
          >
            {loading ? (
              <div style={{ padding: 12 }}>
                {Array.from({ length: 9 }).map((_, i) => (
                  <Skeleton.Button
                    key={i}
                    active
                    block
                    style={{ height: 44, marginBottom: 12 }}
                  />
                ))}
              </div>
            ) : (
              <Menu
                mode='inline'
                selectedKeys={selectedKeys}
                items={items}
              />
            )}
          </Drawer>
        )}

        <Layout
          style={{
            marginLeft: !isMobile ? (collapsed ? 80 : 200) : 0,
            marginTop: 50,
            transition: 'margin-left 0.2s',
          }}
        >
          {/* TOP BAR */}
          <Flex
            align='center'
            justify='space-between'
            style={{
              paddingBlock: '1rem',
              paddingInline: '1rem',
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 998,
              backgroundColor: '#FFFFFF',
              boxShadow: '0px 2px 4px rgba(0,0,0,0.07)',
            }}
          >
            {isMobile && (
              <Button
                type='text'
                icon={<MenuOutlined />}
                onClick={() => setDrawerVisible(true)}
              />
            )}

            <Flex
              justify='end'
              align='center'
              gap={20}
              style={{ flex: 1 }}
            >
              {loading ? (
                <Flex
                  gap={12}
                  align='center'
                >
                  <Skeleton.Avatar
                    active
                    size='large'
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <Skeleton.Input
                      active
                      style={{ width: 140 }}
                    />
                    <Skeleton.Input
                      active
                      style={{ width: 80 }}
                    />
                  </div>
                </Flex>
              ) : (
                <Dropdown
                  menu={{
                    items: [
                      {
                        key: 'logout',
                        label: 'Keluar',
                        icon: <LogoutOutlined />,
                        onClick: () => setLogoutModalVisible(true),
                      },
                    ],
                  }}
                  trigger={['click']}
                >
                  <a
                    onClick={(e) => e.preventDefault()}
                    style={{ display: 'flex', alignItems: 'center' }}
                  >
                    <Flex
                      gap={10}
                      style={{ display: 'flex', alignItems: 'center', marginRight: 10 }}
                    >
                      <Avatar icon={<UserOutlined />} />
                      <div style={{ color: 'black', textAlign: 'right' }}>
                        <div>{userProfile?.nama || 'Admin'}</div>
                        <div style={{ fontSize: 'smaller', marginTop: 5 }}>ADMIN</div>
                      </div>
                    </Flex>
                  </a>
                </Dropdown>
              )}
            </Flex>
          </Flex>

          {/* CONTENT */}
          <Content style={{ margin: '40px 16px', padding: 24, minHeight: '100vh' }}>
            {loading ? (
              <Skeleton
                active
                title
                paragraph={{ rows: 8 }}
              />
            ) : (
              children
            )}
          </Content>

          <Footer style={{ textAlign: 'center', boxShadow: '0px -5px 10px rgba(0,0,0,0.07)' }}>Si Hadir ©{new Date().getFullYear()}</Footer>
        </Layout>
      </Layout>

      {/* LOGOUT MODAL */}
      <Modal
        title='Keluar dari akun?'
        open={logoutModalVisible}
        onOk={() => {
          logout?.();
          notification.success({
            message: 'Logout Berhasil',
            description: 'Anda telah keluar dari akun.',
          });
          router.push('/login');
          setLogoutModalVisible(false);
        }}
        onCancel={() => setLogoutModalVisible(false)}
        okText='Logout'
        cancelText='Batal'
        okType='danger'
        centered
      >
        <p>Anda yakin ingin keluar dari akun?</p>
      </Modal>
    </ConfigProvider>
  );
};

export default AdminDashboardLayout;

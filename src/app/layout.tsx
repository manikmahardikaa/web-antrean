import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import React from 'react';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import AuthProvider from '@/providers/AuthProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Antrean App',
  description: 'Aplikasi Antrean dengan Next.js dan Ant Design',
};

const RootLayout = ({ children }: React.PropsWithChildren) => (
  <html lang='en'>
    <body>
      <AuthProvider>
        <AntdRegistry>{children}</AntdRegistry>
      </AuthProvider>
    </body>
  </html>
);

export default RootLayout;

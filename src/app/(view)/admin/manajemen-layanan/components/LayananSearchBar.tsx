'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Input, Button, Space } from 'antd';
import { PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';

const { Search } = Input;

type Props = {
  query: string;
  onQueryChange: (v: string) => void;
  onAdd: () => void;
  onRefresh: () => void;
  loading?: boolean;
};

export default function LayananSearchBar({ query, onQueryChange, onAdd, onRefresh, loading }: Props) {
  const [localQuery, setLocalQuery] = useState(query);
  useEffect(() => setLocalQuery(query), [query]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (localQuery !== query) onQueryChange(localQuery);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localQuery]);

  // Memoize biar tidak re-create element tiap render
  const enterBtn = useMemo(() => <SearchOutlined />, []);

  return (
    <Space wrap>
      <Search
        allowClear
        placeholder='Cari layanan...'
        enterButton={enterBtn}
        autoFocus
        value={localQuery}
        onChange={(e) => setLocalQuery(e.target.value)}
        onSearch={(v) => onQueryChange(v)} // klik ikon / Enter -> langsung kirim
        style={{ width: 260 }}
        // PENTING: jangan di-disable saat loading
        suffix={loading ? <ReloadOutlined spin /> : null}
      />
      <Button
        type='primary'
        icon={<PlusOutlined />}
        onClick={onAdd}
        disabled={loading}
      >
        Tambah Layanan
      </Button>
      <Button
        icon={<ReloadOutlined />}
        onClick={onRefresh}
        loading={loading}
      >
        Refresh
      </Button>
    </Space>
  );
}

'use client';

import { Row, Col, Space, Input, Button } from 'antd';
import { PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';

const { Search } = Input;

type Props = {
  query: string;
  onQueryChange: (v: string) => void;
  onAdd: () => void;
  onRefresh: () => void;
  loading?: boolean;
};

export default function TanggunganSearchBar({ query, onQueryChange, onAdd, onRefresh, loading }: Props) {
  return (
    <Row
      align='middle'
      justify='space-between'
      gutter={[16, 16]}
    >
      <Col flex='auto'>
        <Search
          allowClear
          placeholder='Cari tanggungan...'
          enterButton={<SearchOutlined />}
          onSearch={onQueryChange}
          onChange={(e) => onQueryChange(e.target.value)}
          style={{ width: 320, maxWidth: '100%' }}
          value={query}
        />
      </Col>
      <Col>
        <Space wrap>
          <Button
            type='primary'
            icon={<PlusOutlined />}
            onClick={onAdd}
          >
            Tambah Tanggungan
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={onRefresh}
            loading={!!loading}
          >
            Refresh
          </Button>
        </Space>
      </Col>
    </Row>
  );
}

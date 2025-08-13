'use client';

import { Col, Row, Typography, Card } from 'antd';

const { Title, Text } = Typography;

const manajemenPengguna = () => {
  return (
    <div className='layout-content'>
      <Row gutter={[24, 0]}>
        <Col
          xs={22}
          className='mb-24'
        >
          <Card
            bordered={false}
            className='criclebox h-full w-full'
          >
            <Title>Blank Page </Title>
            <Text style={{ fontSize: '12pt' }}>Add content here</Text>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default manajemenPengguna;

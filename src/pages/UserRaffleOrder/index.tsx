import { PageContainer, ProColumns, ProTable } from '@ant-design/pro-components';
// import { userRaffleOrder } from '@/services/ant-design-pro/api';
import { Alert, Button } from 'antd';
import React, { useState } from 'react';
import { query_user_raffle_order } from '@/services/api';

const UserRaffleOrder: React.FC = () => {
  const [requestError, setRequestError] = useState<string>();
  const [tableKey, setTableKey] = useState(0);

  const request = async (params: API.PageParams) => {
    setRequestError(undefined);
    try {
      return await query_user_raffle_order(params);
    } catch (error) {
      const message = error instanceof Error ? error.message : '查询抽奖订单失败';
      setRequestError(message);
      throw error;
    }
  };

  const columns: ProColumns<API.UserRaffleOrderItem>[] = [
    {
      title: '用户ID',
      dataIndex: 'userId',
      valueType: 'textarea',
    },
    {
      title: '活动ID',
      dataIndex: 'activityId',
      valueType: 'textarea',
    },
    {
      title: '活动名称',
      dataIndex: 'activityName',
      valueType: 'textarea',
    },
    {
      title: '抽奖策略',
      dataIndex: 'strategyId',
      valueType: 'textarea',
    },
    {
      title: '订单ID',
      dataIndex: 'orderId',
      valueType: 'textarea',
    },
    {
      title: '下单时间',
      dataIndex: 'orderTime',
      valueType: 'dateTime',
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      valueType: 'dateTime',
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      valueType: 'dateTime',
    },
    {
      title: '订单状态',
      dataIndex: 'orderState',
      valueEnum: {
        create: { text: '创建', status: 'Processing' },
        used: { text: '已使用', status: 'Success' },
        cancel: { text: '已作废', status: 'Error' },
      },
    },
  ];

  return (
    <PageContainer>
      {requestError ? (
        <Alert
          type="error"
          showIcon
          message="抽奖订单加载失败"
          description={requestError}
          action={
            <Button
              size="small"
              onClick={() => {
                setRequestError(undefined);
                setTableKey((key) => key + 1);
              }}
            >
              重试
            </Button>
          }
          style={{ marginBottom: 16 }}
        />
      ) : (
        <ProTable<API.UserRaffleOrderItem, API.PageParams>
          key={tableKey}
          request={request}
          columns={columns}
          rowKey="orderId"
          search={false}
          pagination={false}
        ></ProTable>
      )}
    </PageContainer>
  );
};

export default UserRaffleOrder;

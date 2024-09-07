import {PageContainer, ProColumns, ProTable} from "@ant-design/pro-components";
import { userRaffleOrder } from '@/services/ant-design-pro/api';
import React from "react";

const UserRaffleOrder: React.FC = () => {


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
      valueType: 'textarea',
    },
    {
      title: '下单时间',
      dataIndex: 'orderTime',
      valueType: 'textarea',
    },
    {
      title: '订单状态',
      dataIndex: 'orderState',
      valueType: 'textarea',
    },
  ];

  return (
    <PageContainer>
      <ProTable<API.UserRaffleOrderItem, API.PageParams> request={userRaffleOrder} columns={columns}>

      </ProTable>

    </PageContainer>
  );
}

export default UserRaffleOrder;

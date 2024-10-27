import {
  ActionType,
  FooterToolbar,
  PageContainer,
  ProColumns,
  ProTable,
} from '@ant-design/pro-components';

import React, { useRef, useState } from 'react';
import { query_raffle_activity_stage_list, update_stage_activity_2_active } from '@/services/api';
import { FormattedMessage } from '@@/exports';
import { Button, message } from 'antd';

const RaffleStageOrder: React.FC = () => {
  const [selectedRowsState, setSelectedRows] = useState<API.RaffleActivityStageItem[]>([]);
  const actionRef = useRef<ActionType>();

  const updateStageActivity2ActiveHandle = async (selectedRows: API.RaffleActivityStageItem[]) => {
    const hide = message.loading('正在审批');
    if (!selectedRows) return true;
    try {
      for (const row of selectedRows) {
        await update_stage_activity_2_active(Number(row.id));
      }
      hide();
      message.success('successfully and will refresh soon');
      return true;
    } catch (error) {
      hide();
      message.error('failed, please try again');
      return false;
    }
  };

  const columns: ProColumns<API.RaffleActivityStageItem>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      valueType: 'textarea',
    },
    {
      title: '渠道',
      dataIndex: 'channel',
      valueType: 'textarea',
    },
    {
      title: '来源',
      dataIndex: 'source',
      valueType: 'textarea',
    },
    {
      title: '活动ID',
      dataIndex: 'activityId',
      valueType: 'textarea',
    },
    {
      title: '状态',
      dataIndex: 'state',
      valueType: 'textarea',
    },
  ];

  return (
    <PageContainer>
      <ProTable<API.RaffleActivityStageItem, API.PageParams>
        request={query_raffle_activity_stage_list}
        columns={columns}
        rowSelection={{
          onChange: (_, selectedRows) => {
            setSelectedRows(selectedRows);
          },
        }}
      ></ProTable>
      {selectedRowsState?.length > 0 && (
        <FooterToolbar
          extra={
            <div>
              <FormattedMessage id="pages.searchTable.chosen" defaultMessage="Chosen" />{' '}
              <a style={{ fontWeight: 600 }}>{selectedRowsState.length}</a>{' '}
              <FormattedMessage id="pages.searchTable.item" defaultMessage="项" />
            </div>
          }
        >
          <Button
            type="primary"
            onClick={async () => {
              await updateStageActivity2ActiveHandle(selectedRowsState);
              setSelectedRows([]);
              actionRef.current?.reloadAndRest?.();
            }}
          >
            <FormattedMessage id="pages.searchTable.batchStage" defaultMessage="Batch stage" />
          </Button>
        </FooterToolbar>
      )}
    </PageContainer>
  );
};

export default RaffleStageOrder;

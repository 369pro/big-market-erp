import { query_raffle_activity_stage_list, update_stage_activity_2_active } from '@/services/api';
import { FormattedMessage } from '@@/exports';
import {
  ActionType,
  FooterToolbar,
  PageContainer,
  ProColumns,
  ProTable,
} from '@ant-design/pro-components';
import { Link } from '@umijs/max';
import { Alert, Button, message, Tooltip } from 'antd';
import React, { useRef, useState } from 'react';

const DEFAULT_PAGE_SIZE = 25;

const activityStateEnum = {
  create: { text: '创建', status: 'Default' },
  open: { text: '开启', status: 'Success' },
  close: { text: '关闭', status: 'Error' },
};

const stageStateEnum = {
  create: { text: '待上架', status: 'Default' },
  active: { text: '已上架', status: 'Success' },
  expire: { text: '已过期', status: 'Error' },
};

const searchableFields: Array<keyof API.RaffleActivityStageItem> = [
  'id',
  'channel',
  'source',
  'activityId',
  'activityName',
  'activityDesc',
  'strategyId',
  'activityState',
  'state',
];

const normalizeSearchValue = (value: unknown) =>
  String(value ?? '')
    .trim()
    .toLowerCase();

const filterRows = (
  rows: API.RaffleActivityStageItem[],
  params: API.PageParams & Record<string, unknown>,
) => {
  return rows.filter((row) =>
    searchableFields.every((field) => {
      const query = normalizeSearchValue(params[field]);
      return !query || normalizeSearchValue(row[field]).includes(query);
    }),
  );
};

const RaffleStageOrder: React.FC = () => {
  const [selectedRowsState, setSelectedRows] = useState<API.RaffleActivityStageItem[]>([]);
  const [requestError, setRequestError] = useState<string>();
  const [tableKey, setTableKey] = useState(0);
  const actionRef = useRef<ActionType>();

  const request = async (params: API.PageParams) => {
    setRequestError(undefined);
    setSelectedRows([]);
    try {
      const response = await query_raffle_activity_stage_list(params);
      const queryParams = params as API.PageParams & Record<string, unknown>;
      const filteredRows = filterRows(response.data, queryParams);
      const pageSize = Number(params.pageSize) || DEFAULT_PAGE_SIZE;
      const current = Number(params.current) || 1;
      const start = (current - 1) * pageSize;

      return {
        ...response,
        data: filteredRows.slice(start, start + pageSize),
        total: filteredRows.length,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '查询活动上架列表失败';
      setRequestError(errorMessage);
      throw error;
    }
  };

  const updateStageActivity2ActiveHandle = async (selectedRows: API.RaffleActivityStageItem[]) => {
    const rows = selectedRows.filter((row) => row.state !== 'active');
    if (rows.length === 0) {
      message.info('没有可上架的活动');
      return false;
    }

    const hide = message.loading('正在审批');
    try {
      for (const row of rows) {
        if (row.id === undefined || row.id === null) {
          throw new Error('活动上架记录缺少 ID');
        }
        await update_stage_activity_2_active(Number(row.id));
      }
      hide();
      message.success('上架成功，列表即将刷新');
      return true;
    } catch (error) {
      hide();
      message.error(error instanceof Error ? error.message : '上架失败，请重试');
      return false;
    }
  };

  const columns: ProColumns<API.RaffleActivityStageItem>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      valueType: 'text',
    },
    {
      title: '渠道',
      dataIndex: 'channel',
      valueType: 'text',
    },
    {
      title: '来源',
      dataIndex: 'source',
      valueType: 'text',
    },
    {
      title: '活动 ID',
      dataIndex: 'activityId',
      valueType: 'text',
      render: (_, record) => {
        if (record.activityId === undefined || record.activityId === null) return '-';
        const path = `/user_raffle_order_list?activityId=${encodeURIComponent(
          String(record.activityId),
        )}`;
        return <Link to={path}>{record.activityId}</Link>;
      },
    },
    {
      title: '活动名称',
      dataIndex: 'activityName',
      valueType: 'text',
      render: (_, record) => {
        const name = record.activityName || '-';
        return record.activityDesc ? <Tooltip title={record.activityDesc}>{name}</Tooltip> : name;
      },
    },
    {
      title: '策略 ID',
      dataIndex: 'strategyId',
      valueType: 'text',
    },
    {
      title: '活动状态',
      dataIndex: 'activityState',
      valueEnum: activityStateEnum,
    },
    {
      title: '开始时间',
      dataIndex: 'beginDateTime',
      valueType: 'dateTime',
      hideInSearch: true,
    },
    {
      title: '结束时间',
      dataIndex: 'endDateTime',
      valueType: 'dateTime',
      hideInSearch: true,
    },
    {
      title: '上架状态',
      dataIndex: 'state',
      valueEnum: stageStateEnum,
    },
    {
      title: '活动说明',
      dataIndex: 'activityDesc',
      hideInTable: true,
      valueType: 'text',
    },
  ];

  return (
    <PageContainer>
      {requestError ? (
        <Alert
          type="error"
          showIcon
          message="活动上架列表加载失败"
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
        <ProTable<API.RaffleActivityStageItem, API.PageParams>
          key={tableKey}
          actionRef={actionRef}
          request={request}
          columns={columns}
          rowKey="id"
          pagination={{ defaultPageSize: DEFAULT_PAGE_SIZE, showSizeChanger: true }}
          rowSelection={{
            getCheckboxProps: (record) => ({ disabled: record.state === 'active' }),
            onChange: (_, selectedRows) => {
              setSelectedRows(selectedRows);
            },
          }}
        />
      )}
      {selectedRowsState.length > 0 && !requestError && (
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
              const success = await updateStageActivity2ActiveHandle(selectedRowsState);
              if (success) {
                setSelectedRows([]);
                actionRef.current?.reloadAndRest?.();
              }
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

import {
  query_raffle_activity_stage_list,
  update_stage_activity_state,
  type StageActivityState,
} from '@/services/api';
import { ActionType, PageContainer, ProColumns, ProTable } from '@ant-design/pro-components';
import { Link } from '@umijs/max';
import { Alert, Button, Form, Input, Modal, Space, Tag, Tooltip, message } from 'antd';
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
  inactive: { text: '已下架', status: 'Default' },
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

const displayValue = (value: unknown, fallback = '-') => {
  const text = String(value ?? '').trim();
  return text || fallback;
};

const rowKey = (row: API.RaffleActivityStageItem) =>
  [row.activityId, row.channel, row.source].map((value) => String(value ?? '')).join('::');

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

const getUpDisabledReason = (row: API.RaffleActivityStageItem) => {
  if (String(row.activityState ?? '').toLowerCase() !== 'open') return '活动未开启，无法上架';
  if (String(row.state ?? '').toLowerCase() === 'expire') return '活动已过期，无法上架';

  const now = Date.now();
  const begin =
    row.beginDateTime === undefined || row.beginDateTime === null || row.beginDateTime === ''
      ? NaN
      : new Date(row.beginDateTime).getTime();
  if (Number.isFinite(begin) && now < begin) return '活动尚未开始，无法上架';

  const end =
    row.endDateTime === undefined || row.endDateTime === null || row.endDateTime === ''
      ? NaN
      : new Date(row.endDateTime).getTime();
  if (Number.isFinite(end) && now > end) return '活动已过期，无法上架';

  return undefined;
};

const isActive = (row: API.RaffleActivityStageItem) =>
  String(row.state ?? '').toLowerCase() === 'active';

const isStageTargetComplete = (row: API.RaffleActivityStageItem) =>
  Boolean(String(row.channel ?? '').trim() && String(row.source ?? '').trim());

const RaffleStageOrder: React.FC = () => {
  const [requestError, setRequestError] = useState<string>();
  const [tableKey, setTableKey] = useState(0);
  const [pendingRow, setPendingRow] = useState<API.RaffleActivityStageItem>();
  const [stageFormOpen, setStageFormOpen] = useState(false);
  const [stageSubmitting, setStageSubmitting] = useState(false);
  const [mutatingRowKey, setMutatingRowKey] = useState<string>();
  const [stageForm] = Form.useForm<{ channel: string; source: string }>();
  const actionRef = useRef<ActionType>();

  const request = async (params: API.PageParams) => {
    setRequestError(undefined);
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

  const updateRowState = async (
    row: API.RaffleActivityStageItem,
    state: StageActivityState,
    channel = String(row.channel ?? '').trim(),
    source = String(row.source ?? '').trim(),
  ) => {
    if (row.activityId === undefined || row.activityId === null) {
      throw new Error('活动缺少活动 ID');
    }
    if (!channel || !source) {
      throw new Error('上架必须填写渠道和来源');
    }

    const currentRowKey = rowKey(row);
    setMutatingRowKey(currentRowKey);
    try {
      await update_stage_activity_state({
        activityId: row.activityId,
        channel,
        source,
        state,
      });
      message.success(state === 'active' ? '活动上架成功' : '活动下架成功');
      actionRef.current?.reload();
    } catch (error) {
      message.error(
        error instanceof Error
          ? error.message
          : state === 'active'
          ? '活动上架失败'
          : '活动下架失败',
      );
      throw error;
    } finally {
      setMutatingRowKey(undefined);
    }
  };

  const confirmRowState = (
    row: API.RaffleActivityStageItem,
    state: StageActivityState,
    channel = String(row.channel ?? '').trim(),
    source = String(row.source ?? '').trim(),
  ) => {
    const actionLabel = state === 'active' ? '上架' : '下架';
    Modal.confirm({
      title: `确认${actionLabel}`,
      content: (
        <Space direction="vertical" size={4}>
          <span>
            活动：{displayValue(row.activityName, `活动 ${displayValue(row.activityId)}`)}
          </span>
          <span>渠道：{displayValue(channel)}</span>
          <span>来源：{displayValue(source)}</span>
        </Space>
      ),
      okText: `确认${actionLabel}`,
      cancelText: '取消',
      onOk: () => updateRowState(row, state, channel, source),
    });
  };

  const openStageForm = (row: API.RaffleActivityStageItem) => {
    setPendingRow(row);
    stageForm.setFieldsValue({
      channel: String(row.channel ?? '').trim(),
      source: String(row.source ?? '').trim(),
    });
    setStageFormOpen(true);
  };

  const submitStageForm = async () => {
    if (!pendingRow) return;
    try {
      const values = await stageForm.validateFields();
      setStageSubmitting(true);
      await updateRowState(pendingRow, 'active', values.channel.trim(), values.source.trim());
      setStageFormOpen(false);
      setPendingRow(undefined);
      stageForm.resetFields();
    } catch {
      // Form validation errors are rendered by antd; API errors already have a message toast.
    } finally {
      setStageSubmitting(false);
    }
  };

  const handleUp = (row: API.RaffleActivityStageItem) => {
    const reason = getUpDisabledReason(row);
    if (reason) {
      message.warning(reason);
      return;
    }
    if (!isStageTargetComplete(row)) {
      openStageForm(row);
      return;
    }
    confirmRowState(row, 'active');
  };

  const handleDown = (row: API.RaffleActivityStageItem) => {
    if (!isActive(row)) return;
    confirmRowState(row, 'inactive');
  };

  const columns: ProColumns<API.RaffleActivityStageItem>[] = [
    {
      title: '上架记录 ID',
      dataIndex: 'id',
      valueType: 'text',
      render: (value) => displayValue(value),
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
        const name = displayValue(record.activityName);
        return record.activityDesc ? <Tooltip title={record.activityDesc}>{name}</Tooltip> : name;
      },
    },
    {
      title: '渠道',
      dataIndex: 'channel',
      valueType: 'text',
      render: (value) => displayValue(value, '未设置'),
    },
    {
      title: '来源',
      dataIndex: 'source',
      valueType: 'text',
      render: (value) => displayValue(value, '未设置'),
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
      render: (value) => {
        const normalized = String(value ?? '').toLowerCase();
        if (normalized === 'active') return <Tag color="success">已上架</Tag>;
        if (normalized === 'expire') return <Tag color="error">已过期</Tag>;
        if (normalized === 'inactive') return <Tag>已下架</Tag>;
        if (normalized === 'create') return <Tag>待上架</Tag>;
        return <Tag>未上架</Tag>;
      },
    },
    {
      title: '活动说明',
      dataIndex: 'activityDesc',
      hideInTable: true,
      valueType: 'text',
    },
    {
      title: '操作',
      valueType: 'option',
      render: (_, record) => {
        if (record.activityId === undefined || record.activityId === null) return [];
        const active = isActive(record);
        const upReason = active ? '活动已上架' : getUpDisabledReason(record);
        const currentKey = rowKey(record);
        const mutating = mutatingRowKey === currentKey;
        return [
          <Button
            key="stage-up"
            type="link"
            size="small"
            disabled={active || Boolean(upReason) || mutating}
            title={upReason}
            onClick={() => handleUp(record)}
          >
            上架
          </Button>,
          <Button
            key="stage-down"
            type="link"
            danger
            size="small"
            disabled={!active || mutating}
            onClick={() => handleDown(record)}
          >
            下架
          </Button>,
          <Link
            key="view-activity"
            to={`/raffle_activities?activityId=${encodeURIComponent(String(record.activityId))}`}
          >
            查看活动
          </Link>,
        ];
      },
    },
  ];

  return (
    <PageContainer title="活动上下架">
      {requestError ? (
        <Alert
          type="error"
          showIcon
          message="活动上下架列表加载失败"
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
          rowKey={rowKey}
          pagination={{ defaultPageSize: DEFAULT_PAGE_SIZE, showSizeChanger: true }}
        />
      )}
      <Modal
        open={stageFormOpen}
        title="确认上架活动"
        okText="确认上架"
        cancelText="取消"
        confirmLoading={stageSubmitting}
        onOk={() => void submitStageForm()}
        onCancel={() => {
          if (stageSubmitting) return;
          setStageFormOpen(false);
          setPendingRow(undefined);
          stageForm.resetFields();
        }}
        destroyOnClose
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <div>
            活动：
            {displayValue(pendingRow?.activityName, `活动 ${displayValue(pendingRow?.activityId)}`)}
          </div>
          <Form form={stageForm} layout="vertical">
            <Form.Item
              label="渠道"
              name="channel"
              rules={[{ required: true, whitespace: true, message: '请输入渠道' }]}
            >
              <Input maxLength={8} placeholder="请输入上架渠道" />
            </Form.Item>
            <Form.Item
              label="来源"
              name="source"
              rules={[{ required: true, whitespace: true, message: '请输入来源' }]}
            >
              <Input maxLength={8} placeholder="请输入上架来源" />
            </Form.Item>
          </Form>
        </Space>
      </Modal>
    </PageContainer>
  );
};

export default RaffleStageOrder;

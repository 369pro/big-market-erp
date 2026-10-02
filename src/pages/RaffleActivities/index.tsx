import {
  query_activity_detail,
  query_raffle_activity_stage_list,
  type ActivityDetail,
  type ActivityId,
  type ActivityPrize,
  type ActivityStage,
} from '@/services/activity';
import {
  AppstoreOutlined,
  ExportOutlined,
  FileSearchOutlined,
  ReloadOutlined,
  ShopOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  List,
  Row,
  Skeleton,
  Space,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const previewHost = 'http://localhost:3003/#/market';

const stateMeta: Record<
  string,
  { label: string; status: 'default' | 'processing' | 'success' | 'error' | 'warning' }
> = {
  create: { label: '待上架', status: 'default' },
  active: { label: '已上架', status: 'success' },
  expire: { label: '已过期', status: 'error' },
  open: { label: '开启', status: 'success' },
  close: { label: '关闭', status: 'error' },
};

const stageKey = (stage: ActivityStage, index = 0) =>
  String(stage.id ?? `${stage.activityId ?? 'unknown'}-${index}`);

const valueText = (value: unknown, fallback = '-') => {
  if (value === undefined || value === null || value === '') return fallback;
  return String(value);
};

const formatDateTime = (value: string | number | undefined) => {
  if (value === undefined || value === null || value === '') return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('zh-CN', { hour12: false });
};

const formatPeriod = (beginDateTime?: string | number, endDateTime?: string | number) =>
  `${formatDateTime(beginDateTime)} 至 ${formatDateTime(endDateTime)}`;

const tagForState = (value?: string) => {
  const meta = value ? stateMeta[value.toLowerCase()] : undefined;
  return (
    <Tag
      color={
        meta?.status === 'success' ? 'success' : meta?.status === 'error' ? 'error' : undefined
      }
    >
      {meta?.label || valueText(value)}
    </Tag>
  );
};

const isCurrentPreviewActivity = (stage?: ActivityStage) => {
  if (!stage || stage.state !== 'active' || stage.channel !== 'c01' || stage.source !== 's01') {
    return false;
  }
  if (stage.activityState && stage.activityState !== 'open') return false;
  const now = Date.now();
  const begin = stage.beginDateTime ? new Date(stage.beginDateTime).getTime() : NaN;
  const end = stage.endDateTime ? new Date(stage.endDateTime).getTime() : NaN;
  return (!Number.isFinite(begin) || now >= begin) && (!Number.isFinite(end) || now <= end);
};

const numberValue = (value: string | number | undefined) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return undefined;
};

const formatProbability = (value: string | number | undefined) => {
  const number = numberValue(value);
  if (number === undefined) return '-';
  const percent = number * 100;
  return `${percent.toFixed(4).replace(/0+$/, '').replace(/\.$/, '')}%`;
};

const isBalancePrize = (prize: ActivityPrize) =>
  prize.awardKey?.toLowerCase() === 'openai_balance' || prize.balanceAmount !== undefined;

const formatBalance = (prize: ActivityPrize) => {
  const rawAmount =
    typeof prize.balanceAmount === 'number'
      ? prize.balanceAmount.toLocaleString('en-US', {
          useGrouping: false,
          maximumFractionDigits: 8,
        })
      : String(prize.balanceAmount ?? '').trim();
  if (!/^-?\d+(\.\d{1,8})?$/.test(rawAmount)) return '余额金额未提供';
  const [integer, fraction = ''] = rawAmount.split('.');
  return `¥${integer}.${fraction.padEnd(2, '0')} CNY`;
};

const formatStock = (prize: ActivityPrize) => {
  const total = valueText(prize.awardCount, '未提供');
  const surplus = valueText(prize.awardCountSurplus, '未提供');
  return `${surplus} / ${total}`;
};

const formatUnlockRule = (prize: ActivityPrize) => {
  const count = valueText(prize.awardRuleLockCount, '');
  if (count) return `当天累计参与达到 ${count} 次后解锁`;
  return prize.stockRule || prize.ruleModels || '未提供';
};

const ActivityStatus: React.FC<{ value?: string }> = ({ value }) => {
  const meta = value ? stateMeta[value.toLowerCase()] : undefined;
  return <Badge status={meta?.status || 'default'} text={meta?.label || valueText(value)} />;
};

const PrizeCard: React.FC<{ prize: ActivityPrize }> = ({ prize }) => (
  <Card size="small" style={{ height: '100%' }}>
    <Space direction="vertical" size={8} style={{ width: '100%' }}>
      <Space align="start" wrap>
        <Tag color="blue">奖品 {valueText(prize.awardId)}</Tag>
        <Typography.Text strong>{valueText(prize.awardTitle, '未命名奖品')}</Typography.Text>
      </Space>
      {prize.awardSubtitle && (
        <Typography.Text type="secondary">{prize.awardSubtitle}</Typography.Text>
      )}
      {isBalancePrize(prize) && (
        <Typography.Text strong style={{ color: '#1677ff', fontSize: 18 }}>
          余额：{formatBalance(prize)}
        </Typography.Text>
      )}
      <Descriptions size="small" column={1} colon>
        <Descriptions.Item label="基础概率">{formatProbability(prize.awardRate)}</Descriptions.Item>
        <Descriptions.Item label="库存（剩余 / 总量）">{formatStock(prize)}</Descriptions.Item>
        <Descriptions.Item label="库存来源">{valueText(prize.stockSource)}</Descriptions.Item>
        <Descriptions.Item label="解锁规则">{formatUnlockRule(prize)}</Descriptions.Item>
      </Descriptions>
    </Space>
  </Card>
);

const RaffleActivities: React.FC = () => {
  const [activities, setActivities] = useState<ActivityStage[]>([]);
  const [selectedKey, setSelectedKey] = useState<string>();
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string>();
  const [detail, setDetail] = useState<ActivityDetail>();
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string>();
  const [detailRefreshVersion, setDetailRefreshVersion] = useState(0);
  const detailRequestId = useRef(0);
  const initialActivityId = useMemo(() => {
    if (typeof window === 'undefined') return undefined;
    return new URLSearchParams(window.location.search).get('activityId') || undefined;
  }, []);

  const selectedActivity = useMemo(
    () => activities.find((activity, index) => stageKey(activity, index) === selectedKey),
    [activities, selectedKey],
  );

  const loadActivities = useCallback(async () => {
    setListLoading(true);
    setListError(undefined);
    try {
      const rows = await query_raffle_activity_stage_list();
      setActivities(rows);
      setDetailRefreshVersion((version) => version + 1);
      setSelectedKey((currentKey) => {
        const currentIndex = rows.findIndex(
          (activity, index) => stageKey(activity, index) === currentKey,
        );
        if (currentIndex >= 0) return currentKey;
        const requestedIndex = initialActivityId
          ? rows.findIndex((activity) => String(activity.activityId) === initialActivityId)
          : -1;
        return requestedIndex >= 0
          ? stageKey(rows[requestedIndex], requestedIndex)
          : rows.length > 0
          ? stageKey(rows[0], 0)
          : undefined;
      });
    } catch (error) {
      setListError(error instanceof Error ? error.message : '查询活动列表失败');
      setActivities([]);
      setSelectedKey(undefined);
    } finally {
      setListLoading(false);
    }
  }, [initialActivityId]);

  useEffect(() => {
    void loadActivities();
  }, [loadActivities]);

  useEffect(() => {
    const activityId = selectedActivity?.activityId;
    const requestId = detailRequestId.current + 1;
    detailRequestId.current = requestId;
    setDetail(undefined);
    setDetailError(undefined);
    if (activityId === undefined || activityId === null) {
      setDetailLoading(false);
      return;
    }

    setDetailLoading(true);
    void query_activity_detail(activityId)
      .then((nextDetail) => {
        if (detailRequestId.current === requestId) setDetail(nextDetail);
      })
      .catch((error: unknown) => {
        if (detailRequestId.current === requestId) {
          setDetailError(error instanceof Error ? error.message : '查询活动详情失败');
        }
      })
      .finally(() => {
        if (detailRequestId.current === requestId) setDetailLoading(false);
      });
  }, [selectedActivity?.activityId, detailRefreshVersion]);

  const selectActivity = (activity: ActivityStage, index: number) => {
    const nextKey = stageKey(activity, index);
    if (nextKey !== selectedKey) {
      detailRequestId.current += 1;
      setDetail(undefined);
      setDetailError(undefined);
    }
    setSelectedKey(nextKey);
  };

  const retryDetail = () => {
    if (selectedActivity?.activityId === undefined || selectedActivity.activityId === null) return;
    const activityId = selectedActivity.activityId as ActivityId;
    const requestId = detailRequestId.current + 1;
    detailRequestId.current = requestId;
    setDetailLoading(true);
    setDetailError(undefined);
    setDetail(undefined);
    void query_activity_detail(activityId)
      .then((nextDetail) => {
        if (detailRequestId.current === requestId) setDetail(nextDetail);
      })
      .catch((error: unknown) => {
        if (detailRequestId.current === requestId) {
          setDetailError(error instanceof Error ? error.message : '查询活动详情失败');
        }
      })
      .finally(() => {
        if (detailRequestId.current === requestId) setDetailLoading(false);
      });
  };

  const ordersHref = selectedActivity?.activityId
    ? `/user_raffle_order_list?activityId=${encodeURIComponent(
        String(selectedActivity.activityId),
      )}`
    : undefined;
  const stageHref = selectedActivity?.activityId
    ? `/raffle_stage_list?activityId=${encodeURIComponent(String(selectedActivity.activityId))}`
    : '/raffle_stage_list';
  const canPreview = isCurrentPreviewActivity(selectedActivity);

  return (
    <PageContainer
      title="活动展示"
      extra={
        <Button
          icon={<ReloadOutlined />}
          onClick={() => void loadActivities()}
          loading={listLoading}
        >
          刷新活动
        </Button>
      }
    >
      {listError && (
        <Alert
          type="error"
          showIcon
          message="活动列表加载失败"
          description={listError}
          action={
            <Button size="small" onClick={() => void loadActivities()}>
              重试
            </Button>
          }
          style={{ marginBottom: 16 }}
        />
      )}

      {listLoading ? (
        <Card>
          <Skeleton active paragraph={{ rows: 4 }} />
        </Card>
      ) : activities.length === 0 && !listError ? (
        <Card>
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无活动数据" />
        </Card>
      ) : (
        activities.length > 0 && (
          <List
            header={
              <Space>
                <AppstoreOutlined />
                <Typography.Text strong>活动列表</Typography.Text>
                <Typography.Text type="secondary">共 {activities.length} 个活动</Typography.Text>
              </Space>
            }
            grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4 }}
            dataSource={activities}
            renderItem={(activity, index) => {
              const key = stageKey(activity, index);
              const selected = key === selectedKey;
              return (
                <List.Item>
                  <Card
                    size="small"
                    hoverable
                    role="button"
                    tabIndex={0}
                    aria-pressed={selected}
                    onClick={() => selectActivity(activity, index)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ')
                        selectActivity(activity, index);
                    }}
                    style={{
                      width: '100%',
                      minHeight: 178,
                      borderColor: selected ? '#1677ff' : undefined,
                      boxShadow: selected ? '0 0 0 1px #1677ff' : undefined,
                    }}
                    title={
                      <Space>
                        <ShopOutlined />
                        <Typography.Text ellipsis={{ tooltip: activity.activityName }}>
                          {valueText(
                            activity.activityName,
                            `活动 ${valueText(activity.activityId)}`,
                          )}
                        </Typography.Text>
                      </Space>
                    }
                  >
                    <Space direction="vertical" size={8} style={{ width: '100%' }}>
                      <Space wrap>
                        {tagForState(activity.state)}
                        {tagForState(activity.activityState)}
                      </Space>
                      <Typography.Text type="secondary">
                        {valueText(activity.channel)} / {valueText(activity.source)}
                      </Typography.Text>
                      <Typography.Text
                        type="secondary"
                        ellipsis={{ tooltip: activity.activityDesc }}
                      >
                        {valueText(activity.activityDesc, '暂无活动说明')}
                      </Typography.Text>
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        {formatPeriod(activity.beginDateTime, activity.endDateTime)}
                      </Typography.Text>
                    </Space>
                  </Card>
                </List.Item>
              );
            }}
          />
        )
      )}

      {selectedActivity && (
        <Card
          title={
            <Space>
              <span>活动概览</span>
              <ActivityStatus value={selectedActivity.state} />
            </Space>
          }
          style={{ marginTop: 16 }}
          extra={
            <Space wrap>
              {ordersHref && (
                <Button type="link" icon={<FileSearchOutlined />} href={ordersHref}>
                  查看该活动订单
                </Button>
              )}
              <Button type="link" icon={<ShopOutlined />} href={stageHref}>
                前往活动上架
              </Button>
              <Tooltip
                title={
                  canPreview ? '打开当前 c01 / s01 线上活动' : '仅当前 c01 / s01 线上活动可预览'
                }
              >
                <Button
                  type="link"
                  icon={<ExportOutlined />}
                  href={canPreview ? previewHost : undefined}
                  target={canPreview ? '_blank' : undefined}
                  rel={canPreview ? 'noreferrer' : undefined}
                  disabled={!canPreview}
                >
                  用户端预览
                </Button>
              </Tooltip>
            </Space>
          }
        >
          <Descriptions size="small" column={{ xs: 1, sm: 2, md: 3 }}>
            <Descriptions.Item label="活动 ID">
              {valueText(selectedActivity.activityId)}
            </Descriptions.Item>
            <Descriptions.Item label="策略 ID">
              {valueText(selectedActivity.strategyId)}
            </Descriptions.Item>
            <Descriptions.Item label="渠道 / 来源">
              {valueText(selectedActivity.channel)} / {valueText(selectedActivity.source)}
            </Descriptions.Item>
            <Descriptions.Item label="活动状态">
              <ActivityStatus value={selectedActivity.activityState} />
            </Descriptions.Item>
            <Descriptions.Item label="上架状态">
              {tagForState(selectedActivity.state)}
            </Descriptions.Item>
            <Descriptions.Item label="有效期">
              {formatPeriod(selectedActivity.beginDateTime, selectedActivity.endDateTime)}
            </Descriptions.Item>
            <Descriptions.Item label="活动说明" span={3}>
              {valueText(selectedActivity.activityDesc, '暂无活动说明')}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      {selectedActivity && (
        <Card
          title="真实奖品配置"
          style={{ marginTop: 16 }}
          extra={
            <Typography.Text type="secondary">
              规则 / 概率为配置基础值，解锁等规则可能影响实际可抽范围
            </Typography.Text>
          }
        >
          {detailLoading ? (
            <Row gutter={[16, 16]}>
              {[0, 1, 2].map((item) => (
                <Col xs={24} sm={12} lg={8} key={item}>
                  <Card size="small">
                    <Skeleton active paragraph={{ rows: 4 }} />
                  </Card>
                </Col>
              ))}
            </Row>
          ) : detailError ? (
            <Alert
              type="error"
              showIcon
              message="活动详情加载失败"
              description={detailError}
              action={
                <Button size="small" onClick={retryDetail}>
                  重试
                </Button>
              }
            />
          ) : !detail || detail.awards.length === 0 ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无奖品配置" />
          ) : (
            <Row gutter={[16, 16]}>
              {[...detail.awards]
                .sort(
                  (left, right) => (numberValue(left.sort) ?? 0) - (numberValue(right.sort) ?? 0),
                )
                .map((prize, index) => (
                  <Col xs={24} sm={12} lg={8} key={`${valueText(prize.awardId)}-${index}`}>
                    <PrizeCard prize={prize} />
                  </Col>
                ))}
            </Row>
          )}
        </Card>
      )}
    </PageContainer>
  );
};

export default RaffleActivities;

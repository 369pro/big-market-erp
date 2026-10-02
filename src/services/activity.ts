import { request } from '@umijs/max';

const apiHostUrl = 'http://127.0.0.1:8098';
const successCode = '0000';

export type ActivityId = number | string;

export type ActivityStage = {
  id?: ActivityId;
  channel?: string;
  source?: string;
  activityId?: ActivityId;
  state?: string;
  activityName?: string;
  activityDesc?: string;
  strategyId?: ActivityId;
  activityState?: string;
  beginDateTime?: string | number;
  endDateTime?: string | number;
};

export type ActivityPrize = {
  awardId?: ActivityId;
  awardTitle?: string;
  awardSubtitle?: string;
  awardKey?: string;
  awardConfig?: string;
  balanceAmount?: string | number;
  awardRate?: string | number;
  awardCount?: string | number;
  awardCountSurplus?: string | number;
  stockSource?: string;
  stockRule?: string;
  ruleModels?: string;
  awardRuleLockCount?: string | number;
  sort?: string | number;
};

export type ActivityDetail = {
  activityId?: ActivityId;
  activityName?: string;
  activityDesc?: string;
  strategyId?: ActivityId;
  activityState?: string;
  beginDateTime?: string | number;
  endDateTime?: string | number;
  awards: ActivityPrize[];
};

type BackendResponse = {
  code?: unknown;
  info?: unknown;
  data?: unknown;
};

type RecordValue = Record<string, unknown>;

const isRecord = (value: unknown): value is RecordValue =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const getRecord = (value: unknown): RecordValue => (isRecord(value) ? value : {});

const firstValue = (record: RecordValue, keys: string[]): unknown => {
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return undefined;
};

const asText = (value: unknown): string | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return undefined;
  }
};

const asScalar = (value: unknown): string | number | undefined => {
  if (typeof value === 'number' || typeof value === 'string') return value;
  return undefined;
};

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const parseBalanceAmount = (awardKey: string | undefined, awardConfig: string | undefined) => {
  if (!awardKey || awardKey.toLowerCase() !== 'openai_balance' || !awardConfig) return undefined;

  const asNumber = (value: unknown) => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) {
      return value;
    }
    return undefined;
  };

  const direct = asNumber(awardConfig);
  if (direct !== undefined) return direct;

  try {
    const parsed = JSON.parse(awardConfig) as unknown;
    if (!isRecord(parsed)) return undefined;
    return asNumber(firstValue(parsed, ['balanceAmount', 'amount', 'balance', 'value', 'cny']));
  } catch {
    return undefined;
  }
};

const normalizeStage = (value: unknown): ActivityStage => {
  const record = getRecord(value);
  return {
    id: asScalar(firstValue(record, ['id'])),
    channel: asText(firstValue(record, ['channel'])),
    source: asText(firstValue(record, ['source'])),
    activityId: asScalar(firstValue(record, ['activityId', 'activity_id'])),
    state: asText(firstValue(record, ['state'])),
    activityName: asText(firstValue(record, ['activityName', 'activity_name'])),
    activityDesc: asText(firstValue(record, ['activityDesc', 'activity_desc'])),
    strategyId: asScalar(firstValue(record, ['strategyId', 'strategy_id'])),
    activityState: asText(firstValue(record, ['activityState', 'activity_state'])),
    beginDateTime: asScalar(firstValue(record, ['beginDateTime', 'begin_date_time'])),
    endDateTime: asScalar(firstValue(record, ['endDateTime', 'end_date_time'])),
  };
};

const normalizePrize = (value: unknown): ActivityPrize => {
  const record = getRecord(value);
  const stock = getRecord(firstValue(record, ['stock', 'inventory']));
  const rule = getRecord(firstValue(record, ['rule', 'unlockRule']));
  const awardKey = asText(firstValue(record, ['awardKey', 'award_key', 'prizeKey']));
  const awardConfig = asText(firstValue(record, ['awardConfig', 'award_config', 'prizeConfig']));
  const balanceAmount = asScalar(firstValue(record, ['balanceAmount', 'balance_amount']));
  const directBalanceAmount =
    balanceAmount ??
    (awardKey?.toLowerCase() === 'openai_balance'
      ? asScalar(firstValue(record, ['awardAmount', 'amount']))
      : undefined);

  return {
    awardId: asScalar(firstValue(record, ['awardId', 'award_id', 'prizeId'])),
    awardTitle: asText(firstValue(record, ['awardTitle', 'award_title', 'prizeTitle'])),
    awardSubtitle: asText(firstValue(record, ['awardSubtitle', 'award_subtitle', 'prizeSubtitle'])),
    awardKey,
    awardConfig,
    balanceAmount: directBalanceAmount ?? parseBalanceAmount(awardKey, awardConfig),
    awardRate: asScalar(firstValue(record, ['awardRate', 'award_rate', 'probability', 'rate'])),
    awardCount: asScalar(
      firstValue(record, [
        'awardCount',
        'award_count',
        'stockCount',
        'stock_count',
        'totalStock',
        'inventoryTotal',
      ]) ?? firstValue(stock, ['total', 'count', 'stockCount', 'totalStock']),
    ),
    awardCountSurplus: asScalar(
      firstValue(record, [
        'awardCountSurplus',
        'award_count_surplus',
        'stockCountSurplus',
        'stock_count_surplus',
        'remainingStock',
        'stockRemain',
        'inventorySurplus',
      ]) ?? firstValue(stock, ['surplus', 'remaining', 'remainingStock', 'stockCountSurplus']),
    ),
    stockSource: asText(
      firstValue(record, [
        'stockSource',
        'stocksource',
        'stock_source',
        'awardCountSurplusSource',
        'award_count_surplus_source',
      ]) ?? firstValue(stock, ['source', 'stockSource', 'rule']),
    ),
    stockRule: asText(
      firstValue(record, ['stockRule', 'stock_rule', 'inventoryRule']) ??
        firstValue(stock, ['description', 'stockRule', 'rule']),
    ),
    ruleModels: asText(firstValue(record, ['ruleModels', 'rule_models', 'ruleModel'])),
    awardRuleLockCount: asScalar(
      firstValue(record, [
        'awardRuleLockCount',
        'award_rule_lock_count',
        'ruleLockCount',
        'rule_lock_count',
        'ruleUnlockCount',
        'rule_unlock_count',
        'unlockCount',
        'lockCount',
      ]) ?? firstValue(rule, ['count', 'lockCount', 'unlockCount']),
    ),
    sort: asScalar(firstValue(record, ['sort', 'displayOrder', 'order'])),
  };
};

const throwBusinessError = (response: BackendResponse, fallback: string): never => {
  const info = asText(response.info);
  const error = new Error(info || fallback);
  error.name = 'BizError';
  throw error;
};

const assertSuccess = (response: BackendResponse, fallback: string) => {
  if (String(response.code ?? '') !== successCode) throwBusinessError(response, fallback);
};

export async function query_raffle_activity_stage_list(): Promise<ActivityStage[]> {
  const response = await request<BackendResponse>(
    `${apiHostUrl}/api/v1/raffle/erp/query_raffle_activity_stage_list`,
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    },
  );
  assertSuccess(response, '查询活动列表失败');
  if (!Array.isArray(response.data)) throwBusinessError(response, '活动列表响应数据格式错误');
  return response.data.map(normalizeStage);
}

export async function query_activity_detail(activityId: ActivityId): Promise<ActivityDetail> {
  if (activityId === undefined || activityId === null || String(activityId).trim() === '') {
    throw new Error('活动缺少有效的活动 ID');
  }

  const response = await request<BackendResponse>(
    `${apiHostUrl}/api/v1/raffle/erp/query_activity_detail`,
    {
      method: 'GET',
      params: { activityId },
      headers: { 'Content-Type': 'application/json' },
    },
  );
  assertSuccess(response, '查询活动详情失败');

  const data = response.data;
  const record = getRecord(data);
  const rawAwards = Array.isArray(data)
    ? data
    : (['awards', 'strategyAwards', 'strategyAwardList', 'prizes', 'awardList', 'list']
        .map((key) => record[key])
        .find(Array.isArray) as unknown[] | undefined) || [];

  return {
    activityId: asScalar(firstValue(record, ['activityId', 'activity_id'])),
    activityName: asText(firstValue(record, ['activityName', 'activity_name'])),
    activityDesc: asText(firstValue(record, ['activityDesc', 'activity_desc'])),
    strategyId: asScalar(firstValue(record, ['strategyId', 'strategy_id'])),
    activityState: asText(firstValue(record, ['activityState', 'activity_state', 'state'])),
    beginDateTime: asScalar(firstValue(record, ['beginDateTime', 'begin_date_time'])),
    endDateTime: asScalar(firstValue(record, ['endDateTime', 'end_date_time'])),
    awards: asArray(rawAwards).map(normalizePrize),
  };
}

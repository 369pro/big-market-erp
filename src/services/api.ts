// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

const apiHostUrl = 'http://127.0.0.1:8098';
const SUCCESS_CODE = '0000';

type BackendResponse<T> = {
  code?: string;
  info?: string;
  data?: T | null;
};

export type ProTableResponse<T> = {
  data: T[];
  success: boolean;
  total: number;
};

export type UserRaffleOrderQuery = API.PageParams & {
  userId?: string;
  activityId?: number | string;
  activityName?: string;
  orderId?: string;
  orderState?: string;
  strategyId?: number | string;
};

type UserRaffleOrderPage = {
  list?: API.UserRaffleOrderItem[] | null;
  total?: number;
  pageNo?: number;
  pageSize?: number;
};

const throwBusinessError = (response: BackendResponse<unknown>, fallback: string): never => {
  const error = new Error(response.info || fallback);
  error.name = 'BizError';
  throw error;
};

export async function query_user_raffle_order(
  _params?: UserRaffleOrderQuery,
): Promise<ProTableResponse<API.UserRaffleOrderItem>> {
  const response = await request<BackendResponse<API.UserRaffleOrderItem[]>>(
    `${apiHostUrl}/api/v1/raffle/erp/query_user_raffle_order`,
    {
      method: 'GET',
      params: _params,
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );

  if (response.code !== SUCCESS_CODE) {
    throwBusinessError(response, '查询抽奖订单失败');
  }

  if (!Array.isArray(response.data)) {
    throwBusinessError(response, '抽奖订单响应数据格式错误');
  }

  return {
    data: response.data,
    success: true,
    total: response.data.length,
  };
}

export async function query_user_raffle_order_page(
  params: UserRaffleOrderQuery = {},
): Promise<ProTableResponse<API.UserRaffleOrderItem>> {
  const { current, pageSize, ...filters } = params;
  const response = await request<BackendResponse<UserRaffleOrderPage>>(
    `${apiHostUrl}/api/v1/raffle/erp/query_user_raffle_order_page`,
    {
      method: 'GET',
      params: {
        ...filters,
        pageNo: current,
        pageSize,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );

  if (response.code !== SUCCESS_CODE) {
    throwBusinessError(response, '查询抽奖订单失败');
  }

  if (!response.data || !Array.isArray(response.data.list)) {
    throwBusinessError(response, '抽奖订单分页响应数据格式错误');
  }

  return {
    data: response.data.list,
    success: true,
    total: response.data.total ?? response.data.list.length,
  };
}

export async function query_raffle_activity_stage_list(
  _params?: API.PageParams,
): Promise<ProTableResponse<API.RaffleActivityStageItem>> {
  const response = await request<BackendResponse<API.RaffleActivityStageItem[]>>(
    `${apiHostUrl}/api/v1/raffle/erp/query_raffle_activity_stage_list`,
    {
      method: 'GET',
      params: _params,
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );

  if (response.code !== SUCCESS_CODE) {
    throwBusinessError(response, '查询活动上架列表失败');
  }

  if (!Array.isArray(response.data)) {
    throwBusinessError(response, '活动上架列表响应数据格式错误');
  }

  return {
    data: response.data,
    success: true,
    total: response.data.length,
  };
}

export async function update_stage_activity_2_active(id?: number): Promise<boolean> {
  const response = await request<BackendResponse<boolean>>(
    `${apiHostUrl}/api/v1/raffle/erp/update_stage_activity_2_active`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        method: 'post',
        id,
      },
    },
  );

  if (response.code !== SUCCESS_CODE || response.data !== true) {
    throwBusinessError(response, '活动上架失败');
  }

  return true;
}

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

const throwBusinessError = (response: BackendResponse<unknown>, fallback: string): never => {
  const error = new Error(response.info || fallback);
  error.name = 'BizError';
  throw error;
};

export async function query_user_raffle_order(
  _params?: API.PageParams,
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

export async function query_raffle_activity_stage_list() {
  return request<API.RaffleActivityStageItem>(
    `${apiHostUrl}/api/v1/raffle/erp/query_raffle_activity_stage_list`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );
}

export async function update_stage_activity_2_active(id?: number) {
  return request<API.RaffleActivityStageItem>(
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
}

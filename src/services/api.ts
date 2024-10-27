// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

const apiHostUrl = 'http://127.0.0.1:8098';

export async function query_user_raffle_order() {
  return request<API.UserRaffleOrderItem>(
    `${apiHostUrl}/api/v1/raffle/erp/query_user_raffle_order`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );
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

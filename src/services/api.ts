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

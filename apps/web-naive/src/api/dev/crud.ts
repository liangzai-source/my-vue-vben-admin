import type { BaseData, ListResponse } from '#/types/common';

import { requestClient } from '#/api/request';

export namespace DevCrudApi {
  export interface DevCrud extends BaseData {
    name: string;
  }
}

export async function devCrudListApi(param: any) {
  return requestClient.post<ListResponse<DevCrudApi.DevCrud>>(
    '/crud/list',
    param,
  );
}

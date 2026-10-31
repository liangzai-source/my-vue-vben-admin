import type { Schema } from '#/crud/types';
import type { BaseData, ListResponse } from '#/types/common';

import { requestClient } from '#/api/request';

export namespace DevCrudApi {
  export interface DevCrud extends BaseData {
    name: string;
  }

  export interface FilePreview {
    name: string;
    path: string;
    content: string;
    lang: string;
  }

  export interface TableItem {
    name: string;
    comment: string;
    label: string;
    value: string;
  }
}

export async function devCrudListApi(param: any) {
  return requestClient.post<ListResponse<DevCrudApi.DevCrud>>(
    '/crud/list',
    param,
  );
}

export async function devCrudPreviewApi(data: Schema) {
  return requestClient.post<DevCrudApi.FilePreview[]>('/crud/preview', data);
}

export async function devCrudTablesApi() {
  return requestClient.post<DevCrudApi.TableItem[]>('/crud/tables');
}

export async function devCrudTableSchemaApi(tableName: string) {
  return requestClient.post<Schema>('/crud/table-schema', { tableName });
}

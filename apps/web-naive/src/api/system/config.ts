import type {
  BaseData,
  CreateResponse,
  DeleteResponse,
  ListResponse,
  UpdateResponse,
} from '#/types/common';

import { requestClient } from '#/api/request';

export namespace SystemConfigApi {
  export interface SystemConfig extends BaseData {
    categoryId: number;
    name: string;
    key: string;
    value: string;
    componentType: string;
    options: string;
    extra: string;
    sort: number;
    isSystem: number;
  }

  export interface SettingCategory {
    id: number;
    name: string;
    code: string;
    sort: number;
    items: SystemConfig[];
  }
}

/**
 * 获取配置项列表 (分页)
 */
export async function systemConfigListApi(param: any) {
  return requestClient.post<ListResponse<SystemConfigApi.SystemConfig>>(
    '/system-config/list',
    param,
  );
}

/**
 * 创建配置项
 */
export async function systemConfigCreateApi(
  data: Partial<SystemConfigApi.SystemConfig>,
) {
  return requestClient.post<CreateResponse>('/system-config/create', data);
}

/**
 * 修改配置项
 */
export async function systemConfigUpdateApi(
  id: number,
  data: Partial<SystemConfigApi.SystemConfig>,
) {
  return requestClient.post<UpdateResponse>(
    `/system-config/update/${id}`,
    data,
  );
}

/**
 * 删除配置项
 */
export async function systemConfigDeleteApi(id: number) {
  return requestClient.post<DeleteResponse>(`/system-config/delete/${id}`);
}

/**
 * 获取系统配置面板所需的分类及配置项集合 (供 Tab 渲染)
 */
export async function systemConfigSettingsApi() {
  return requestClient.post<SystemConfigApi.SettingCategory[]>(
    '/system-config/settings',
  );
}

/**
 * 批量保存系统配置
 */
export async function systemConfigBatchSaveApi(configs: Record<string, any>) {
  return requestClient.post('/system-config/batch-save', { configs });
}

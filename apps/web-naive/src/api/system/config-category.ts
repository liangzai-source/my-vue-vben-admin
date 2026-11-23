import type {
  BaseData,
  CreateResponse,
  DeleteResponse,
  ListResponse,
  UpdateResponse,
  UpdateStatusResponse,
} from '#/types/common';

import { requestClient } from '#/api/request';

export namespace SystemConfigCategoryApi {
  export interface SystemConfigCategory extends BaseData {
    name: string;
    code: string;
    sort: number;
    status: number;
    isSystem: number;
    remark: string;
  }
}

/**
 * 获取配置分类列表 (分页)
 */
export async function systemConfigCategoryListApi(param: any) {
  return requestClient.post<
    ListResponse<SystemConfigCategoryApi.SystemConfigCategory>
  >('/system-config-category/list', param);
}

/**
 * 获取所有配置分类 (不分页，供下拉使用)
 */
export async function systemConfigCategoryAllApi() {
  return requestClient.post<SystemConfigCategoryApi.SystemConfigCategory[]>(
    '/system-config-category/all',
  );
}

/**
 * 创建配置分类
 */
export async function systemConfigCategoryCreateApi(
  data: Partial<SystemConfigCategoryApi.SystemConfigCategory>,
) {
  return requestClient.post<CreateResponse>(
    '/system-config-category/create',
    data,
  );
}

/**
 * 修改配置分类
 */
export async function systemConfigCategoryUpdateApi(
  id: number,
  data: Partial<SystemConfigCategoryApi.SystemConfigCategory>,
) {
  return requestClient.post<UpdateResponse>(
    `/system-config-category/update/${id}`,
    data,
  );
}

/**
 * 更新配置分类状态
 */
export async function systemConfigCategoryUpdateStatusApi(
  id: number,
  status: number,
) {
  return requestClient.post<UpdateStatusResponse>(
    `/system-config-category/update-status/${id}`,
    {
      status,
    },
  );
}

/**
 * 删除配置分类
 */
export async function systemConfigCategoryDeleteApi(id: number) {
  return requestClient.post<DeleteResponse>(
    `/system-config-category/delete/${id}`,
  );
}

import type {
  BaseData,
  CreateResponse,
  DeleteResponse,
  ListResponse,
  MessageResponse,
  UpdateResponse,
  UpdateStatusResponse,
} from '#/types/common';

import { requestClient } from '#/api/request';

export namespace SystemRoleApi {
  export interface SystemRole extends BaseData {
    name: string;
    status: number;
    remark: string;
  }

  export interface SystemRolePermissions {
    role_id: number;
    menu_ids: number[];
  }
}

/**
 * 角色列表
 * @param param
 */
export async function systemRoleListApi(param: any) {
  return requestClient.post<ListResponse<SystemRoleApi.SystemRole>>(
    '/system-role/list',
    param,
  );
}

/**
 * 创建角色
 * @param data
 */
export async function systemRoleCreateApi(data: SystemRoleApi.SystemRole) {
  return requestClient.post<CreateResponse>(`/system-role/create`, data);
}

/**
 * 修改角色
 * @param id
 * @param data
 */
export async function systemRoleUpdateApi(
  id: number,
  data: SystemRoleApi.SystemRole,
) {
  return requestClient.post<UpdateResponse>(`/system-role/update/${id}`, data);
}

/**
 * 角色状态修改
 * @param id
 * @param status
 */
export async function systemRoleUpdateStatusApi(id: number, status: number) {
  return requestClient.post<UpdateStatusResponse>(
    `/system-role/update-status/${id}`,
    {
      status,
    },
  );
}

/**
 * 删除角色
 * @param id
 */
export async function systemRoleDeleteApi(id: number) {
  return requestClient.post<DeleteResponse>(`/system-role/delete/${id}`, {});
}

/**
 * 设置角色权限
 * @param data
 */
export async function systemRolePermissionsApi(
  data: SystemRoleApi.SystemRolePermissions,
) {
  return requestClient.post<MessageResponse>(`/system-role/permissions`, data);
}

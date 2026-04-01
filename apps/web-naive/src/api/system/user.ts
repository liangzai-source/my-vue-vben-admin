import type {
  BaseData,
  CreateResponse,
  DeleteResponse,
  ListResponse,
  UpdateResponse,
  UpdateStatusResponse,
} from '#/types/common';

import { requestClient } from '#/api/request';

export namespace SystemUserApi {
  export interface SystemUser extends BaseData {
    account: string;
    nickname: string;
    status: number;
    creatorId: number;
    isAdministrator: number;
  }

  export interface SystemUserSave extends SystemUser {
    password: string;
  }

  export interface PasswordChange {
    oldPassword: string;
    newPassword: string;
  }
}

/**
 * 用户列表
 */
export async function systemUserListApi(param: any) {
  return requestClient.post<ListResponse<SystemUserApi.SystemUser>>(
    '/system-user/list',
    param,
  );
}

/**
 * 创建用户
 * @param data
 */
export async function systemUserCreateApi(data: SystemUserApi.SystemUser) {
  return requestClient.post<CreateResponse>('/system-user/create', data);
}

/**
 * 修改用户
 * @param id
 * @param data
 */
export async function systemUserUpdateApi(
  id: number,
  data: SystemUserApi.SystemUser,
) {
  return requestClient.post<UpdateResponse>(`/system-user/update/${id}`, data);
}
/**
 * 修改用户状态
 * @param id
 * @param status
 */
export async function systemUserUpdateStatusApi(id: number, status: number) {
  return requestClient.post<UpdateStatusResponse>(
    `/system-user/update-status/${id}`,
    {
      status,
    },
  );
}

/**
 * 删除用户
 * @param id
 */
export async function systemUserDeleteApi(id: number) {
  return requestClient.post<DeleteResponse>(`/system-user/delete/${id}`);
}
/**
 * 修改密码
 * @param data
 */
export async function systemUserChangePasswordApi(
  data: SystemUserApi.PasswordChange,
) {
  return requestClient.post<UpdateResponse>(
    `/system-user/change-password`,
    data,
  );
}

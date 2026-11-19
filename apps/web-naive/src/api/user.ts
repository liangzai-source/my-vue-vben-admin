import type {
  BaseData,
  CreateResponse,
  DeleteResponse,
  ListResponse,
  UpdateResponse,
} from '#/types/common';

import { requestClient } from '#/api/request';

export namespace UserApi {
  export interface User extends BaseData {
    nickname: string;
    avatar: string;
    account: string;
    password: string;
    mobile: string;
    status: boolean;
    lastLoginTime: Date;
    lastLoginIp: string;
    miniOpenid: string;
    offOpenid: string;
    wechatUnionid: string;
  }

  export interface UserSaveReq {
    nickname?: string;
    avatar?: string;
    account?: string;
    password?: string;
    mobile?: string;
    status?: boolean;
    lastLoginTime?: Date;
    lastLoginIp?: string;
    miniOpenid?: string;
    offOpenid?: string;
    wechatUnionid?: string;
  }
}

/**
 * 获取用户列表
 */
export async function userListApi(param: any) {
  return requestClient.post<ListResponse<UserApi.User>>('/user/list', param);
}

/**
 * 新增用户
 */
export async function userCreateApi(data: UserApi.UserSaveReq) {
  return requestClient.post<CreateResponse>('/user/create', data);
}

/**
 * 更新用户
 */
export async function userUpdateApi(
  id: number | string,
  data: UserApi.UserSaveReq,
) {
  return requestClient.post<UpdateResponse>(`/user/update/${id}`, data);
}

/**
 * 修改用户状态
 */
export async function userUpdateStatusApi(id: number | string, status: any) {
  return requestClient.post<UpdateResponse>(`/user/update-status/${id}`, {
    status,
  });
}

/**
 * 删除用户
 */
export async function userDeleteApi(id: number | string) {
  return requestClient.post<DeleteResponse>(`/user/delete/${id}`);
}

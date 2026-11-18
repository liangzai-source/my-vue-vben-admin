import type {
  BaseData,
  CreateResponse,
  DeleteResponse,
  ListResponse,
  RelationOptionsParams,
  RelationOptionsResult,
  UpdateResponse,
} from '#/types/common';

import { requestClient } from '#/api/request';

export namespace RegionApi {
  export interface Region extends BaseData {
    name: string;
    level: number;
    parentId: number;
    short: string;
    cityCode: string;
    zipCode: string;
    gcj02Lng: string;
    gcj02Lat: string;
    db09Lng: string;
    db09Lat: string;
    remark1: string;
    remark2: string;
    sort: number;
    hasChildren?: boolean;
    children?: Region[];
  }

  export interface RegionSaveReq {
    name?: string;
    level?: number;
    parentId?: number;
    short?: string;
    cityCode?: string;
    zipCode?: string;
    gcj02Lng?: string;
    gcj02Lat?: string;
    db09Lng?: string;
    db09Lat?: string;
    remark1?: string;
    remark2?: string;
    sort?: number;
  }
}

/**
 * 获取地区数据列表
 */
export async function regionListApi(param: any) {
  return requestClient.post<ListResponse<RegionApi.Region>>(
    '/region/list',
    param,
  );
}

/**
 * 新增地区数据
 */
export async function regionCreateApi(data: RegionApi.RegionSaveReq) {
  return requestClient.post<CreateResponse>('/region/create', data);
}

/**
 * 更新地区数据
 */
export async function regionUpdateApi(
  id: number | string,
  data: RegionApi.RegionSaveReq,
) {
  return requestClient.post<UpdateResponse>(`/region/update/${id}`, data);
}

/**
 * 修改地区数据状态
 */
export async function regionUpdateStatusApi(id: number | string, status: any) {
  return requestClient.post<UpdateResponse>(`/region/update-status/${id}`, {
    status,
  });
}

/**
 * 删除地区数据
 */
export async function regionDeleteApi(id: number | string) {
  return requestClient.post<DeleteResponse>(`/region/delete/${id}`);
}

/**
 * 获取父级地区编码关联下拉选项
 */
export async function regionParentIdOptionsApi(
  params: RelationOptionsParams = {},
) {
  return requestClient.post<RelationOptionsResult>(
    '/region/parent-id-options',
    params,
  );
}

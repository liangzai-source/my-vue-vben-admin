import type { Schema } from '#/crud/types';
import type { BaseData, DeleteResponse, ListResponse } from '#/types/common';

import { requestClient } from '#/api/request';

export namespace DevCrudApi {
  export interface DevCrud extends BaseData {
    tableName: string;
    moduleName: string;
    businessName: string;
    className: string;
    schema: string;
    generatedFiles: string;
    status: number; // 0-未生成 1-已生成直写
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

  export interface DevCrudDetail {
    record: DevCrud;
    schema: Schema;
  }

  export interface GenerateResult {
    id: number;
    moduleName: string;
    files: string[];
    menuCount?: number;
  }

  export interface DeleteCodeResult {
    id: number;
    moduleName: string;
    menuPreserved: boolean;
  }
}

/**
 * 分页查询代码生成持久化记录
 */
export async function devCrudListApi(param: any) {
  return requestClient.post<ListResponse<DevCrudApi.DevCrud>>(
    '/crud/list',
    param,
  );
}

/**
 * 代码内存预览 (不写入磁盘)
 */
export async function devCrudPreviewApi(data: Schema) {
  return requestClient.post<DevCrudApi.FilePreview[]>('/crud/preview', data);
}

/**
 * 代码生成并直接写入本地磁盘
 */
export async function devCrudGenerateApi(data: Schema) {
  return requestClient.post<DevCrudApi.GenerateResult>('/crud/generate', data);
}

/**
 * 重新生成并覆盖写入磁盘
 */
export async function devCrudReGenerateApi(id: number) {
  return requestClient.post<DevCrudApi.GenerateResult>(
    `/crud/regenerate/${id}`,
  );
}

/**
 * 仅删除已生成的本地物理代码（保留数据库记录与菜单）
 */
export async function devCrudDeleteCodeApi(id: number) {
  return requestClient.post<DevCrudApi.DeleteCodeResult>(
    `/crud/delete-code/${id}`,
  );
}

/**
 * 仅删除数据库生成记录（不清理物理文件及菜单）
 */
export async function devCrudDeleteApi(id: number) {
  return requestClient.post<DeleteResponse>(`/crud/delete/${id}`);
}

/**
 * 获取单个记录及反序列化的完整Schema
 */
export async function devCrudDetailApi(id: number) {
  return requestClient.post<DevCrudApi.DevCrudDetail>(`/crud/detail/${id}`);
}

/**
 * 获取数据库所有数据表列表
 */
export async function devCrudTablesApi() {
  return requestClient.post<DevCrudApi.TableItem[]>('/crud/tables');
}

/**
 * 逆向解析数据表结构为完整Schema
 */
export async function devCrudTableSchemaApi(tableName: string) {
  return requestClient.post<Schema>('/crud/table-schema', { tableName });
}

export interface RelationOptionsParams {
  tableName: string;
  valueField?: string;
  labelField?: string;
  keyword?: string;
  currentValue?: any;
}

export interface RelationOptionsResult {
  total: number;
  isLarge: boolean;
  options: Array<{ label: any; value: any }>;
}

/**
 * 获取表关联动态选项 (自适应 <=1000全量 与 >1000远程搜索)
 */
export async function devCrudRelationOptionsApi(params: RelationOptionsParams) {
  return requestClient.post<RelationOptionsResult>(
    '/crud/relation-options',
    params,
  );
}

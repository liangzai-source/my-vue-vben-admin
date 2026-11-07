import type { DeleteResponse } from '#/types/common';

import { requestClient } from '#/api/request';

export interface UploadItem {
  id: number;
  name: string;
  originName: string;
  preview: string; // 业务字段存储的逻辑路径，例如 "preview/1"
  url: string; // 可直接访问/展示的完整地址
  size: number;
  mime: string;
  ext: string;
  type: number;
  storage: string;
  createdAt: string;
}

export interface FileListParams {
  page?: number;
  pageSize?: number;
  type?: number;
  keyword?: string;
}

export interface FileListResult {
  items: UploadItem[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * 将数据库中存储的相对路径或 preview/:id 转换为可展示的访问路径
 */
export function getFileUrl(path?: string): string {
  if (!path) return '';
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('data:')
  ) {
    return path;
  }
  const clean = path.startsWith('/') ? path.slice(1) : path;
  return `/${clean}`;
}

/**
 * 单文件上传接口 (统一走文件系统落库 y_system_upload)
 */
export async function uploadFileApi(
  file: File,
  type: number = 1,
): Promise<UploadItem> {
  return requestClient.upload<UploadItem>('/system-upload/upload', {
    file,
    type,
  });
}

/**
 * 媒体库文件列表查询 (用于在已有文件系统中选择)
 */
export async function getFileListApi(
  params: FileListParams,
): Promise<FileListResult> {
  return requestClient.post<FileListResult>('/system-upload/list', params);
}

/**
 * 删除指定文件记录
 */
export async function deleteFileApi(id: number): Promise<DeleteResponse> {
  return requestClient.post<DeleteResponse>(`/system-upload/delete/${id}`);
}

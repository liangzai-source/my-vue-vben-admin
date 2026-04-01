// 数据基础字段
export interface BaseData {
  id: number;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
}
// 下拉框options
export type SelectOptions = {
  label: string;
  value: string;
};
// 列表数据
export type ListResponse<T> = {
  items: T[];
  total: number;
};
// 添加返回数据
export type CreateResponse = {
  id: number;
};
// 修改返回数据
export type UpdateResponse = Record<string, never>;
// 修改状态返回数据
export type UpdateStatusResponse = Record<string, never>;
// 删除返回数据
export type DeleteResponse = Record<string, never>;

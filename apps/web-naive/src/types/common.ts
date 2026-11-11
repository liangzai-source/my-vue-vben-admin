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
// 信息返回数据
export type MessageResponse = Record<string, never>;
// 表关联下拉选项请求参数
export interface RelationOptionsParams {
  keyword?: string;
  currentValue?: any;
}
// 表关联下拉选项返回结果
export interface RelationOptionsResult {
  total: number;
  isLarge: boolean;
  options: Array<{ label: any; value: any }>;
}
// 表关联下拉选项接口函数类型
export type RelationOptionsApi = (
  params: RelationOptionsParams,
) => Promise<RelationOptionsResult>;

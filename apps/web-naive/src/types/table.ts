// 通用 Action Click 参数类型
export type OnActionClickParams<T = any> = {
  [key: string]: any; // 扩展字段（比如 event、column 等）
  code: string; // 操作码：delete/update/status 等
  row: T; // 行数据
};

// 操作映射类型：key=操作码，value=处理函数
export type ActionHandlerMap<T = any> = {
  [code: string]: (
    row: T,
    params?: OnActionClickParams<T>,
  ) => Promise<void> | void;
};

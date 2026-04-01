import type { ActionHandlerMap, OnActionClickParams } from '#/types/table';

/**
 * 通用表格操作点击 Hooks
 * 抽离重复的 switch 逻辑，只需传入操作码-处理函数映射
 * @template T - 行数据类型
 * @param actionHandlerMap - 操作码与处理函数的映射（比如 { delete: onDelete, update: onEdit }）
 * @param defaultHandler - 可选：未匹配到操作码时的默认处理函数
 * @returns 通用的 onActionClick 函数
 */
export function useTableAction<T = any>(
  actionHandlerMap: ActionHandlerMap<T>,
  defaultHandler?: (params: OnActionClickParams<T>) => Promise<void> | void,
) {
  /**
   * 通用操作点击处理函数（所有页面通用）
   * @param params - 操作参数（code=操作码，row=行数据）
   */
  const onActionClick = async (params: OnActionClickParams<T>) => {
    const { code, row } = params;
    // 匹配操作码对应的处理函数
    const handler = actionHandlerMap[code];

    if (handler) {
      // 执行匹配到的处理函数
      await handler(row, params);
    } else if (defaultHandler) {
      // 执行默认处理函数
      await defaultHandler(params);
    } else {
      // 未匹配到且无默认处理，控制台提示
      console.warn(`未找到操作码 "${code}" 对应的处理函数`);
    }
  };

  return { onActionClick };
}

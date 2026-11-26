// 通用类型定义（适配大多数项目）
import { $t } from '@vben/locales';

import { message } from '#/adapter/naive';
import { asyncConfirm, getByPath, getRowDisplayName } from '#/utils/tools';

type Recordable<T = any> = Record<string, T>;
/**
 * 状态变更配置项类型
 * 改为传入字段名（支持点分隔路径），而非函数
 */
type StatusOptions = {
  confirmTitle?: string; // 弹窗标题
  rowIdField?: string; // 行ID字段名（支持深层路径，如 'id' / 'data.id'）
  rowNameField?: string; // 行名称字段名（支持深层路径，如 'name' / 'menu.name'）
  statusTextMap?: Record<string, string>; // 自定义状态文案
};

type StatusChangeFn<T> = (
  newStatus: any,
  row: T,
  showConfirm?: boolean,
  showMessage?: boolean,
  rowNameField?: string,
) => Promise<boolean>;

/**
 * 通用状态变更Hooks
 * 核心：传入字段名（支持深层路径）即可，无需写获取函数
 * @template T - 行数据类型
 * @param updateStatusApi - 必传：状态更新接口
 * @param optionsOrAfterSuccess - 可选：配置项或更新成功后的回调
 * @param options - 可选：自定义配置项（当第2个参数为回调时使用）
 * @returns 状态变更核心函数
 */
/* oxlint-disable typescript/no-unnecessary-type-parameters */
export function useStatusChange<T = Recordable>(
  updateStatusApi: (id: number, newStatus: any) => Promise<any>,
  options?: StatusOptions,
): { statusChangeFunc: StatusChangeFn<T> };
export function useStatusChange<T = Recordable>(
  updateStatusApi: (id: number, newStatus: any) => Promise<any>,
  afterSuccess?: () => Promise<void> | void,
  options?: StatusOptions,
): { statusChangeFunc: StatusChangeFn<T> };
export function useStatusChange<T = Recordable>(
  // 必传：状态更新接口（id=行ID，newStatus=目标状态）
  updateStatusApi: (id: number, newStatus: any) => Promise<any>,
  // 可选：成功后的回调或配置项
  optionsOrAfterSuccess?: (() => Promise<void> | void) | StatusOptions,
  // 可选：自定义配置项（改为字段名配置）
  options?: StatusOptions,
): {
  statusChangeFunc: StatusChangeFn<T>;
} {
  const afterSuccess =
    typeof optionsOrAfterSuccess === 'function'
      ? optionsOrAfterSuccess
      : undefined;
  const resolvedOptions =
    typeof optionsOrAfterSuccess === 'function'
      ? options
      : (optionsOrAfterSuccess ?? options);

  // 默认配置（字段名默认值：id/name）
  const defaultConfig = {
    statusTextMap: {
      0: $t('common.disableStatus'), // 禁用
      1: $t('common.enableStatus'), // 启用
      2: $t('common.disableStatus'), // 禁用
      false: $t('common.disableStatus'), // 禁用
      true: $t('common.enableStatus'), // 启用
    },
    rowNameField: 'name', // 默认取name字段
    rowIdField: 'id', // 默认取id字段
    confirmTitle: $t('common.tip'), // 默认弹窗标题：提示
    ...resolvedOptions,
  };

  /**
   * 状态变更核心函数
   * @param newStatus - 目标状态（1/2/其他）
   * @param row - 当前行数据
   * @param showConfirm - 是否显示确认弹窗
   * @param showMessage - 是否显示成功提示
   * @param rowNameField - 可选：单次调用覆盖名称字段路径
   * @returns 操作是否成功
   */
  const statusChangeFunc: StatusChangeFn<T> = async (
    newStatus: any,
    row: T,
    showConfirm: boolean = true,
    showMessage: boolean = true,
    rowNameField?: string,
  ): Promise<boolean> => {
    // 通过 getByPath / getRowDisplayName 获取行ID和名称（支持深层路径及兜底）
    const rowId =
      (row as any)?.id ??
      getByPath(row as Recordable, defaultConfig.rowIdField, '-');
    const rowName = getRowDisplayName(
      row as Recordable,
      rowNameField ?? defaultConfig.rowNameField,
      defaultConfig.rowIdField,
    );
    let statusText = defaultConfig.statusTextMap[String(newStatus)] || '';
    if (!statusText) {
      statusText =
        newStatus === 1 ||
        newStatus === true ||
        newStatus === '1' ||
        newStatus === 'true'
          ? $t('common.enableStatus')
          : $t('common.disableStatus');
    }
    if (showConfirm) {
      // 确认弹窗（用户取消则返回false）
      const isConfirm = await asyncConfirm({
        title: defaultConfig.confirmTitle,
        content: $t('common.statusConfirm', [rowName, statusText]),
      });
      if (!isConfirm) return false;
    }

    // 调用状态更新接口（将布尔值规整为数值 1/0）
    let sendStatus = newStatus;
    if (typeof newStatus === 'boolean') {
      sendStatus = newStatus ? 1 : 0;
    }
    await updateStatusApi(rowId, sendStatus);

    // 可选执行刷新/回调
    if (afterSuccess) {
      await afterSuccess();
    }

    if (showMessage) {
      message.success($t('common.successMessage', [$t('common.updateStatus')]));
    }

    return true;
  };

  return { statusChangeFunc };
}

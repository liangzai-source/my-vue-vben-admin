// 通用类型定义（适配大多数项目）
import { $t } from '@vben/locales';

import { message } from '#/adapter/naive';
import { asyncConfirm, getByPath } from '#/utils/tools';

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

/**
 * 通用状态变更Hooks
 * 核心：传入字段名（支持深层路径）即可，无需写获取函数
 * @template T - 行数据类型
 * @param updateStatusApi - 必传：状态更新接口
 * @param afterSuccess - 可选：更新成功后的回调（仅菜单管理需要）
 * @param options - 可选：配置项（字段名/状态文案/弹窗标题）
 * @returns 状态变更核心函数
 */
export function useStatusChange<T = Recordable>(
  // 必传：状态更新接口（id=行ID，newStatus=目标状态）
  updateStatusApi: (id: number, newStatus: any) => Promise<any>,
  // 可选：成功后的回调（不传则不执行）
  afterSuccess?: () => Promise<void> | void,
  // 可选：自定义配置项（改为字段名配置）
  options?: StatusOptions,
) {
  // 默认配置（字段名默认值：id/name）
  const defaultConfig = {
    statusTextMap: {
      1: $t('common.enableStatus'), // 启用
      2: $t('common.disableStatus'), // 禁用
    },
    rowNameField: 'name', // 默认取name字段
    rowIdField: 'id', // 默认取id字段
    confirmTitle: $t('common.tip'), // 默认弹窗标题：提示
    ...options,
  };

  /**
   * 状态变更核心函数
   * @param newStatus - 目标状态（1/2/其他）
   * @param row - 当前行数据
   * @param showConfirm
   * @param showMessage
   * @returns 操作是否成功
   */
  const statusChangeFunc = async (
    newStatus: any,
    row: T,
    showConfirm: boolean = true,
    showMessage: boolean = true,
  ): Promise<boolean> => {
    // 通过 getByPath 获取行ID和名称（支持深层路径）
    const rowId = getByPath(row as Recordable, defaultConfig.rowIdField, '-');
    const rowName = getByPath(
      row as Recordable,
      defaultConfig.rowNameField,
      '-',
    );
    const statusText = defaultConfig.statusTextMap[newStatus.toString()] || '';
    if (showConfirm) {
      // 确认弹窗（用户取消则返回false）
      const isConfirm = await asyncConfirm({
        title: defaultConfig.confirmTitle,
        content: $t('common.statusConfirm', [rowName, statusText]),
      });
      if (!isConfirm) return false;
    }

    //  调用状态更新接口
    await updateStatusApi(rowId, newStatus);

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

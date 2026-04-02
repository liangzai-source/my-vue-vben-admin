import type { FormValidationError } from 'naive-ui';
import type { SelectMixedOption } from 'naive-ui/es/select/src/interface';

import type { Recordable } from '@vben/types';

import { $t } from '@vben/locales';
import { useAccessStore, useUserStore } from '@vben/stores';

import { dialog, message } from '#/adapter/naive';
import { router } from '#/router';
import { generateAccess } from '#/router/access';
import { accessRoutes } from '#/router/routes';
import { useAuthStore } from '#/store';
import { processTableActions } from '#/utils/access';

/**
 * 获取表格默认操作按钮
 */
export function getTableDefaultOperation(): [
  Recordable<Recordable<any>>,
  string[],
] {
  const presets: Recordable<Recordable<any>> = {
    delete: {
      type: 'error',
      btnText: $t('common.delete'),
      icon: 'material-symbols:delete-outline',
    },
    update: {
      btnText: $t('common.update'),
      icon: 'iconoir:edit',
    },
  };
  const options = ['update', 'delete'];
  return [presets, options];
}

/**
 * 处理表单错误
 * @param error
 */
export function handleFormError(error: Array<FormValidationError>) {
  if (
    Array.isArray(error) &&
    error.every((item) => 'field' in item && 'message' in item)
  ) {
    error.forEach((err: FormValidationError) => {
      err.forEach((item) => {
        if (item?.message) {
          message.error(item.message);
        }
      });
    });
  }
}

/**
 * 根据点分隔路径获取对象深层属性值
 * @param obj 目标对象
 * @param path 点分隔的属性路径，如 'data.title' / 'name'
 * @param defaultValue 取值失败时的默认值
 */
export function getByPath(
  obj: Record<string, any>,
  path: string,
  defaultValue: any = '-',
) {
  // 空对象/空路径直接返回默认值
  if (!obj || !path) return defaultValue;

  // 按 . 分割路径，生成属性数组
  const keys = path.split('.');
  let result = obj;

  for (const key of keys) {
    // 中途出现 null/undefined，终止遍历
    if (result === null || result === undefined) break;
    result = result[key];
  }

  return $t(safeToString(result, defaultValue));
}

/**
 * 安全将任意值转换为字符串，处理特殊类型
 * @param value 任意值
 * @param defaultValue 转换失败时的默认字符串
 */
function safeToString(value: any, defaultValue: string): string {
  // 处理 null/undefined，返回默认值
  if (value === null || value === undefined) {
    return defaultValue;
  }
  // 处理 Symbol 类型（无法直接转字符串）
  if (typeof value === 'symbol') {
    return defaultValue;
  }
  // 处理数字 NaN/Infinity 特殊数值
  if (typeof value === 'number' && !Number.isFinite(value)) {
    return defaultValue;
  }
  // 其他类型安全转为字符串
  return String(value);
}

/**
 * 刷新左侧菜单
 */
export async function refreshMenu(): Promise<void> {
  const accessStore = useAccessStore();
  const userStore = useUserStore();
  const authStore = useAuthStore();
  const userInfo = userStore.userInfo || (await authStore.fetchUserInfo());
  const userRoles = userInfo.roles ?? [];

  // 生成菜单和路由
  const { accessibleMenus, accessibleRoutes } = await generateAccess({
    roles: userRoles,
    router,
    // 则会在菜单中显示，但是访问会被重定向到403
    routes: accessRoutes,
  });
  accessStore.setAccessMenus(accessibleMenus);
  accessStore.setAccessRoutes(accessibleRoutes);
}

/**
 * 通用空值判断工具函数（TypeScript 类型守卫版）
 * @param value - 任意类型的待校验值
 * @returns boolean
 */
export function isEmpty(
  value: unknown,
): value is
  | ''
  | []
  | Map<never, never>
  | null
  | Record<string, never>
  | Set<never>
  | undefined {
  // 1. 处理 null 和 undefined
  if (value === null || value === undefined) {
    return true;
  }

  // 2. 处理数字类型：仅 NaN 判定为空，0/有效数字为非空
  if (typeof value === 'number') {
    return Number.isNaN(value);
  }

  // 3. 布尔值：固定非空
  if (typeof value === 'boolean') {
    return false;
  }

  // 4. 字符串：去除首尾空白后长度为0 判定为空
  if (typeof value === 'string') {
    return value.trim().length === 0;
  }

  // 5. 数组：空数组判定为空
  if (Array.isArray(value)) {
    return value.length === 0;
  }

  // 6. ES6 集合：空 Map / 空 Set 判定为空
  if (value instanceof Map || value instanceof Set) {
    return value.size === 0;
  }

  // 7. 普通对象：无自身可枚举属性判定为空
  if (typeof value === 'object') {
    // 过滤类实例，仅判断原生纯对象 {}
    if (value.constructor !== Object) {
      return false;
    }
    return Object.keys(value).length === 0;
  }

  // 8. 函数/其他类型：非空
  return false;
}

// 确认框参数
type ConfirmOptions = {
  cancelText?: string;
  confirmText?: string;
  content?: string;
  draggable?: boolean;
  title?: string;
};

/**
 * 异步确认弹窗函数
 * @param options 弹窗配置（可选），不传则使用默认配置
 * @returns Promise<boolean> 确认返回true，取消返回false
 */
export function asyncConfirm(options?: ConfirmOptions): Promise<boolean> {
  // 默认配置
  const defaultOptions: Required<ConfirmOptions> = {
    title: $t('common.tip'),
    content: $t('common.commonConfirm'),
    confirmText: $t('common.confirm'),
    cancelText: $t('common.cancel'),
    draggable: false,
  };

  // 合并配置：用户配置 > 默认配置，使用展开运算符浅合并
  const dialogOptions = { ...defaultOptions, ...options };

  // 返回Promise，适配弹窗组件的回调逻辑
  return new Promise((resolve, reject) => {
    dialog.info({
      title: dialogOptions.title,
      content: dialogOptions.content,
      positiveText: dialogOptions.confirmText,
      negativeText: dialogOptions.cancelText,
      draggable: dialogOptions.draggable,
      onPositiveClick: () => {
        resolve(true);
      },
      onNegativeClick: () => {
        reject(new Error($t('common.cancel')));
      },
      onClose: () => {
        reject(new Error($t('common.cancel')));
      },
    });
  });
}

/**
 * 获取默认的操作按钮
 * @param updateAuthCode
 * @param deleteAuthCode
 */
export function useDefaultOperation(
  updateAuthCode: string = '',
  deleteAuthCode: string = '',
) {
  type Operation = {
    code: string;
    perCode?: string;
  };
  const updateOperation: Operation = { code: 'update' };
  if (!isEmpty(updateAuthCode)) {
    updateOperation.perCode = updateAuthCode;
  }
  const deleteOperation: Operation = { code: 'delete' };
  if (!isEmpty(deleteAuthCode)) {
    deleteOperation.perCode = deleteAuthCode;
  }
  return processTableActions([updateOperation, deleteOperation]);
}

/**
 * 获取表单提交消息
 * @param val
 */
export function showFormMessage(val: any): void {
  const messageText =
    isEmpty(val) || val === 0 ? $t('common.create') : $t('common.update');
  message.success(messageText + $t('common.success'));
}

/**
 * 获取完整的 HTTP 请求方法列表
 * @returns 标准化的 ApiMethod 数组（包含常用 RESTful 请求方法）
 */
export function getApiMethodList(): SelectMixedOption[] {
  return [
    { label: 'GET', value: 'GET' },
    { label: 'POST', value: 'POST' },
    { label: 'PUT', value: 'PUT' },
    { label: 'DELETE', value: 'DELETE' },
    { label: 'PATCH', value: 'PATCH' },
    { label: 'HEAD', value: 'HEAD' },
    { label: 'OPTIONS', value: 'OPTIONS' },
  ];
}

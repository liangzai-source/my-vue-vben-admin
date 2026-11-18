import type { Recordable } from '@vben/types';

import { useAccess } from '@vben/access';

import { getTableDefaultOperation } from '#/utils/tools'; // 初始化权限校验方法

// 初始化权限校验方法
const { hasAccessByCodes } = useAccess();

// 自动获取默认的字符串数组（全局仅执行一次，提升性能）
const [, DEFAULT_KEYS] = getTableDefaultOperation();

/**
 * 定义入参类型：支持纯字符串 / 带perCode的配置对象
 */
export type ActionItem =
  | string
  | {
      [key: string]: any;
      code: string;
      perCode?: string | string[];
    };

/**
 * 统一权限校验工具
 * @param codes 权限码/权限码数组
 */
export function checkPermission(codes: string | string[]): boolean {
  const permCodes = Array.isArray(codes) ? codes : [codes];
  return hasAccessByCodes(permCodes);
}

/**
 * 核心处理函数：自动匹配默认键，处理权限+格式转换
 * 无需外部传入defaultKeys，内部自动获取
 * @param rawActions 原始按钮配置数组
 * @returns 处理后的混合格式数组（无perCode，权限过滤完成）
 */
export function processTableActions(
  rawActions: ActionItem[],
): (Recordable<any> | string)[] {
  // 初始化结果数组
  const result: (Recordable<any> | string)[] = [];

  // 使用 forEach 替代 reduce，满足 ESLint 规则
  rawActions.forEach((item) => {
    // 原始项是字符串，直接推入结果
    if (typeof item === 'string') {
      result.push(item);
      return;
    }

    // 解构分离权限字段和剩余属性
    const { perCode, ...cleanItem } = item;
    const { code } = item;

    // 容错处理：无code的非法对象，跳过
    if (!code) {
      return;
    }

    // 对象无perCode，直接保留清理后的对象
    if (!perCode) {
      result.push(cleanItem);
      return;
    }

    // 权限校验不通过，直接跳过
    if (!checkPermission(perCode)) {
      return;
    }

    // 校验通过，仅在没有任何额外配置项时转为默认字符串
    if (DEFAULT_KEYS.includes(code) && Object.keys(cleanItem).length === 1) {
      // 在默认列表：转为字符串
      result.push(code);
    } else {
      // 保留完整配置对象（支持自定义 btnText / confirmTitle / show 等）
      result.push(cleanItem);
    }
  });

  // 返回最终处理结果
  return result;
}

/**
 * 根据权限过滤后的按钮配置列表动态计算操作列宽度
 * @param actions 经过 processTableActions 过滤后的按钮列表
 * @param options 可选配置（如安全边距、间距等）
 */
export function getActionColumnWidth(
  actions: (Recordable<any> | string)[],
  options?: {
    minWidth?: number;
    cellPadding?: number;
    gap?: number;
  },
): number {
  if (!actions || actions.length === 0) {
    return 0;
  }

  const cellPadding = options?.cellPadding ?? 24;
  const gap = options?.gap ?? 8;
  const [presets] = getTableDefaultOperation();

  let totalBtnWidth = 0;

  actions.forEach((act) => {
    let btnText = '';
    let hasIcon = false;

    if (typeof act === 'string') {
      const preset = presets[act];
      btnText = preset?.btnText || act;
      hasIcon = Boolean(preset?.icon);
    } else if (act && typeof act === 'object') {
      const preset = presets[act.code];
      btnText = act.btnText || preset?.btnText || act.code || '';
      hasIcon = Boolean(act.icon || preset?.icon);
    }

    let textWidth = 0;
    for (const char of btnText) {
      textWidth += (char.codePointAt(0) ?? 0) > 255 ? 14 : 8;
    }

    let singleWidth = textWidth + 24;
    if (hasIcon) {
      singleWidth += 22;
    }
    totalBtnWidth += Math.max(singleWidth, 48);
  });

  const totalGap = (actions.length - 1) * gap;
  const calculated = totalBtnWidth + totalGap + cellPadding;
  const minWidth = options?.minWidth ?? 80;

  return Math.max(calculated, minWidth);
}

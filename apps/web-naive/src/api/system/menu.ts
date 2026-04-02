import type {Recordable} from '@vben/types';

import type {
  BaseData,
  CreateResponse,
  DeleteResponse,
  UpdateResponse,
  UpdateStatusResponse,
} from '#/types/common';

import {requestClient} from '#/api/request';

export namespace SystemMenuApi {
  /** 徽标颜色集合 */
  export const BadgeVariants = [
    'default',
    'destructive',
    'primary',
    'success',
    'warning',
  ] as const;
  /** 徽标类型集合 */
  export const BadgeTypes = ['dot', 'normal'] as const;

  export interface SystemMenuSelect {
    label: string;
    value: string;
    children?: SystemMenuSelect[];
  }

  export interface SystemMenuMeta {
    /** 激活时显示的图标 */
    activeIcon?: string;
    /** 作为路由时，需要激活的菜单的Path */
    activePath?: string;
    /** 固定在标签栏 */
    affixTab?: boolean;
    /** 在标签栏固定的顺序 */
    affixTabOrder?: number;
    /** 徽标内容(当徽标类型为normal时有效) */
    badge?: string;
    /** 徽标类型 */
    badgeType?: (typeof BadgeTypes)[number];
    /** 徽标颜色 */
    badgeVariants?: (typeof BadgeVariants)[number];
    /** 在菜单中隐藏下级 */
    hideChildrenInMenu?: boolean;
    /** 在面包屑中隐藏 */
    hideInBreadcrumb?: boolean;
    /** 在菜单中隐藏 */
    hideInMenu?: boolean;
    /** 在标签栏中隐藏 */
    hideInTab?: boolean;
    /** 菜单图标 */
    icon?: string;
    /** 内嵌Iframe的URL */
    iframeSrc?: string;
    /** 是否缓存页面 */
    keepAlive?: boolean;
    /** 外链页面的URL */
    link?: string;
    /** 同一个路由最大打开的标签数 */
    maxNumOfOpenTab?: number;
    /** 无需基础布局 */
    noBasicLayout?: boolean;
    /** 是否在新窗口打开 */
    openInNewWindow?: boolean;
    /** 菜单排序 */
    order?: number;
    /** 额外的路由参数 */
    query?: Recordable<any>;
    /** 菜单标题 */
    title?: string;
  }

  export interface SystemMenu extends BaseData {
    /** 后端权限标识 */
    authCode: string;
    /** 子级 */
    children?: SystemMenu[];
    /** 组件 */
    component?: string;
    /** 菜单元数据 */
    meta: SystemMenuMeta;
    /** 菜单名称 */
    name: string;
    /** 路由路径 */
    path: string;
    /** 父级ID */
    pid: number;
    /** 重定向 */
    redirect?: string;
    /** 菜单类型 */
    type: number;
    /** 菜单状态 */
    status: number;
    /** 菜单排序 */
    sort: number;
    /** 接口路径 */
    api_path: string;
    /** 接口请求方法 */
    api_method: string;

    [key: string]: any;
  }
}

/**
 * 所有菜单
 */
export async function allMenuApi() {
  return requestClient.post<Array<SystemMenuApi.SystemMenu>>(
    '/system-menu/list',
  );
}

/**
 * 创建菜单
 * @param data
 */
export async function createMenuApi(
  data: Omit<SystemMenuApi.SystemMenu, 'children' | 'id'>,
) {
  return requestClient.post<CreateResponse>('/system-menu/create', data);
}

/**
 * 修改菜单
 * @param id
 * @param data
 */
export async function updateMenuApi(
  id: number,
  data: Omit<SystemMenuApi.SystemMenu, 'children' | 'id'>,
) {
  return requestClient.post<UpdateResponse>(`/system-menu/update/${id}`, data);
}

/**
 * 修改菜单状态
 * @param id
 * @param status
 */
export async function updateMenuStatusApi(id: number, status: number) {
  return requestClient.post<UpdateStatusResponse>(
    `/system-menu/update-status/${id}`,
    {
      status,
    },
  );
}

/**
 * 删除菜单
 * @param id
 */
export async function deleteMenuApi(id: number) {
  return requestClient.post<DeleteResponse>(`/system-menu/delete/${id}`);
}

/**
 * 检查菜单名称是否已存在
 * @param name
 * @param id
 */
export async function isMenuNameExists(name: string, id?: number | string) {
  return requestClient.post('/system-menu/name-exists', {
    name,
    id,
  });
}

/**
 * 所有菜单
 */
export async function allPermissionApi() {
  return requestClient.post<Array<SystemMenuApi.SystemMenu>>(
    '/system-menu/list',
  );
}

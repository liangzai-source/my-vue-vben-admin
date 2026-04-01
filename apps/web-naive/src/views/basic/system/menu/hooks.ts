import type { OnActionClickFn, VxeTableGridOptions } from '#/adapter/vxe-table';
import type { SelectOptions } from '#/types/common';

import { $t } from '@vben/locales';

import { SystemMenuApi } from '#/api/system/menu';
import { processTableActions } from '#/utils/access';

export function getMenuTypeOptions() {
  return [
    {
      type: 'primary',
      label: $t('system.menu.typeCatalog'),
      value: 5,
    },
    { type: 'default', label: $t('system.menu.typeMenu'), value: 1 },
    { type: 'error', label: $t('system.menu.typeButton'), value: 2 },
    {
      type: 'success',
      label: $t('system.menu.typeEmbedded'),
      value: 3,
    },
    { type: 'warning', label: $t('system.menu.typeLink'), value: 4 },
  ];
}

export function getBadgeOptions(): SelectOptions[] {
  return [
    { label: $t('system.menu.badgeType.dot'), value: 'dot' },
    { label: $t('system.menu.badgeType.normal'), value: 'normal' },
  ];
}

export function getBadgeTypeOptions(): SelectOptions[] {
  const types = ['default', 'destructive', 'primary', 'success', 'warning'];
  return types.map((item) => {
    return {
      label: item,
      value: item,
    };
  });
}

export function useMenuColumns<T = SystemMenuApi.SystemMenu>(
  onActionClick: OnActionClickFn<T>,
  onStatusChange?: (newStatus: any, row: T) => PromiseLike<void>,
): VxeTableGridOptions<SystemMenuApi.SystemMenu>['columns'] {
  return [
    {
      align: 'left',
      field: 'meta.title',
      fixed: 'left',
      slots: { default: 'title' },
      title: $t('system.menu.menuTitle'),
      treeNode: true,
      width: 250,
    },
    {
      align: 'center',
      cellRender: { name: 'CellTag', options: getMenuTypeOptions() },
      field: 'type',
      title: $t('system.menu.type'),
      width: 100,
    },
    {
      align: 'center',
      field: 'path',
      title: $t('system.menu.path'),
      width: 200,
    },

    {
      align: 'center',
      field: 'component',
      formatter: ({ row }) => {
        switch (row.type) {
          case 0:
          case 1:
          case 2: {
            return row.component || '无';
          }
          case 3: {
            return row.meta?.iframeSrc || '无';
          }
          case 4: {
            return row.meta?.link || '无';
          }
        }
        return '';
      },
      minWidth: 200,
      title: $t('system.menu.component'),
    },
    {
      cellRender: {
        name: 'CellSwitch',
        attrs: { beforeChange: onStatusChange },
      },
      field: 'status',
      title: $t('system.menu.status'),
      width: 100,
    },

    {
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'meta.title',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: processTableActions([
          {
            code: 'append',
            btnText: $t('system.menu.addChild'),
            icon: 'material-symbols:add-rounded',
            perCode: 'sys:menu:create',
          },
          {
            code: 'update',
            perCode: 'sys:menu:update',
          },
          {
            code: 'delete',
            perCode: 'sys:menu:delete',
          },
        ]),
      },
      field: 'operation',
      fixed: 'right',
      headerAlign: 'center',
      showOverflow: false,
      title: $t('common.operation'),
      width: 260,
    },
  ];
}

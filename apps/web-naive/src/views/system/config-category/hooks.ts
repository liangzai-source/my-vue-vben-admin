import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';

import type { OnActionClickFn } from '#/adapter/vxe-table';
import type { SystemConfigCategoryApi } from '#/api/system/config-category';

import { h } from 'vue';

import { $t } from '@vben/locales';

import { NTag } from 'naive-ui';

import { processTableActions } from '#/utils/access';

export function useSystemConfigCategoryColumns<
  T = SystemConfigCategoryApi.SystemConfigCategory,
>(
  onActionClick: OnActionClickFn<T>,
): VxeTableGridOptions<SystemConfigCategoryApi.SystemConfigCategory>['columns'] {
  return [
    {
      title: 'ID',
      field: 'id',
      width: 80,
    },
    {
      title: $t('system.configCategory.name'),
      field: 'name',
      minWidth: 150,
    },
    {
      title: $t('system.configCategory.code'),
      field: 'code',
      minWidth: 140,
    },
    {
      title: $t('system.configCategory.sort'),
      field: 'sort',
      width: 100,
    },
    {
      title: $t('system.configCategory.isSystem'),
      field: 'isSystem',
      width: 120,
      slots: {
        default: ({ row }) => {
          return h(
            NTag,
            {
              type: row.isSystem === 1 ? 'warning' : 'default',
              size: 'small',
              round: true,
            },
            {
              default: () =>
                row.isSystem === 1
                  ? $t('system.configCategory.isSystem')
                  : '自定义',
            },
          );
        },
      },
    },
    {
      title: $t('system.configCategory.remark'),
      field: 'remark',
      minWidth: 200,
    },
    {
      title: $t('common.createTime'),
      field: 'createdAt',
      width: 180,
    },
    {
      align: 'center',
      fixed: 'right',
      width: 150,
      title: $t('common.operation'),
      cellRender: {
        attrs: {
          nameField: 'name',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: processTableActions([
          {
            code: 'update',
            perCode: 'system:config-category:update',
          },
          {
            code: 'delete',
            perCode: 'system:config-category:delete',
            disabled: (row: any) => row.isSystem === 1,
          },
        ]),
      },
    },
  ];
}

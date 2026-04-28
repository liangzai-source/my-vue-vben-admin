import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';

import type { OnActionClickFn } from '#/adapter/vxe-table';
import type { SystemUserApi } from '#/api/system/user';

import { $t } from '@vben/locales';

import { useDefaultOperation } from '#/utils/tools';

export function useSystemUserColumns<T = SystemUserApi.SystemUser>(
  onActionClick: OnActionClickFn<T>,
  onStatusChange?: (newStatus: number, row: T) => PromiseLike<void>,
): VxeTableGridOptions<SystemUserApi.SystemUser>['columns'] {
  return [
    {
      align: 'center',
      field: 'id',
      title: $t('common.id'),
      fixed: 'left',
      width: 100,
    },
    {
      align: 'center',
      field: 'account',
      title: $t('system.user.account'),
    },
    {
      align: 'center',
      field: 'nickname',
      title: $t('system.user.nickname'),
    },
    {
      cellRender: {
        name: 'CellSwitch',
        attrs: { beforeChange: onStatusChange },
      },
      field: 'status',
      title: $t('common.status'),
      width: 100,
    },

    {
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'nickname',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: useDefaultOperation('sys:user:update', 'sys:user:delete'),
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

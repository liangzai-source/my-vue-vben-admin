import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';

import type { OnActionClickFn } from '#/adapter/vxe-table';
import type { SystemRoleApi } from '#/api/system/role';

import { $t } from '@vben/locales';

import { processTableActions } from '#/utils/access';

export function useSystemRoleColumns<T = SystemRoleApi.SystemRole>(
  onActionClick: OnActionClickFn<T>,
  onStatusChange?: (newStatus: number, row: T) => PromiseLike<void>,
): VxeTableGridOptions<SystemRoleApi.SystemRole>['columns'] {
  return [
    {
      title: $t('system.role.name'),
      field: 'name',
      width: 200,
    },
    {
      cellRender: {
        name: 'CellSwitch',
        attrs: { beforeChange: onStatusChange },
      },
      field: 'status',
      title: $t('common.status'),
      width: 200,
    },
    {
      title: $t('system.role.remark'),
      field: 'remark',
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
            code: 'permission',
            btnText: $t('system.role.setPermission'),
            icon: 'material-symbols:manage-accounts-outline',
            perCode: 'sys:role:permission',
          },
          {
            code: 'update',
            perCode: 'sys:role:update',
          },
          {
            code: 'delete',
            perCode: 'sys:role:delete',
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

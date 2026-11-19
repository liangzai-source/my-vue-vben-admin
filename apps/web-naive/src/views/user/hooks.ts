import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';

import type { OnActionClickFn } from '#/adapter/vxe-table';
import type { UserApi } from '#/api/user';

import { $t } from '@vben/locales';

import {
  checkPermission,
  getActionColumnWidth,
  processTableActions,
} from '#/utils/access';

export function useUserColumns<T = UserApi.User>(
  onActionClick: OnActionClickFn<T>,
  onCellUpdate?: (
    val: any,
    row: any,
    field: string,
  ) => boolean | Promise<boolean | undefined> | undefined,
  onStatusChange?: (
    newVal: any,
    row: any,
    field: string,
    showConfirm?: boolean,
  ) => boolean | Promise<boolean | undefined> | undefined,
): VxeTableGridOptions<UserApi.User>['columns'] {
  const actionOptions = processTableActions([
    {
      code: 'update',
      perCode: 'user:update',
    },
    {
      code: 'delete',
      perCode: 'user:delete',
    },
  ]);
  const actionColumnWidth = getActionColumnWidth(actionOptions);
  return [
    {
      title: '#',
      type: 'seq',
      width: 60,
    },
    {
      field: 'nickname',
      title: $t('user.nickname'),
      minWidth: 160,
    },
    {
      field: 'avatar',
      title: $t('user.avatar'),
      cellRender: {
        name: 'CellImage',
      },
      width: 100,
    },
    {
      field: 'account',
      title: $t('user.account'),
      minWidth: 160,
    },
    {
      field: 'mobile',
      title: $t('user.mobile'),
      minWidth: 160,
    },
    {
      field: 'status',
      title: $t('common.status'),
      cellRender: {
        attrs: {
          beforeChange: (newVal: any, row: any) =>
            onStatusChange
              ? onStatusChange(newVal, row, 'status', true)
              : onCellUpdate?.(newVal, row, 'status'),
        },
        name: 'CellSwitch',
      },
      visible: checkPermission('user:status'),
      width: 100,
    },
    {
      field: 'lastLoginTime',
      title: $t('user.lastLoginTime'),
      cellRender: {
        name: 'CellDateTime',
      },
      minWidth: 180,
    },
    {
      field: 'lastLoginIp',
      title: $t('user.lastLoginIp'),
      minWidth: 160,
    },
    {
      align: 'center',
      cellRender: {
        attrs: {
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: actionOptions,
      },
      field: 'operation',
      fixed: 'right',
      headerAlign: 'center',
      showOverflow: false,
      title: $t('common.operation'),
      visible: actionOptions.length > 0,
      width: actionColumnWidth,
    },
  ];
}

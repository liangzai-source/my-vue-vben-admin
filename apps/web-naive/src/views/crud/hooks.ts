import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';

import type { OnActionClickFn } from '#/adapter/vxe-table';
import type { DevCrudApi } from '#/api/dev/crud';

import { $t } from '@vben/locales';

import { checkPermission, processTableActions } from '#/utils/access';

export function useDevCrudColumns<T = DevCrudApi.DevCrud>(
  onActionClick: OnActionClickFn<T>,
): VxeTableGridOptions<DevCrudApi.DevCrud>['columns'] {
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
      cellRender: {
        attrs: {
          nameField: 'name',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: processTableActions([
          {
            code: 'update',
            perCode: 'dev:crud:update',
          },
          {
            code: 'delete',
            perCode: 'dev:crud:delete',
          },
        ]),
      },
      visible: checkPermission(['dev:crud:update', 'dev:crud:delete']),
      field: 'operation',
      fixed: 'right',
      headerAlign: 'center',
      showOverflow: false,
      title: $t('common.operation'),
      width: 260,
    },
  ];
}

import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';

import type { OnActionClickFn } from '#/adapter/vxe-table';
import type { RegionApi } from '#/api/region';

import { $t } from '@vben/locales';

import { getActionColumnWidth, processTableActions } from '#/utils/access';

export function useRegionColumns<T = RegionApi.Region>(
  onActionClick: OnActionClickFn<T>,
  onCellUpdate?: (
    val: any,
    row: any,
    field: string,
  ) => boolean | Promise<boolean | undefined> | undefined,
  _onStatusChange?: (
    newVal: any,
    row: any,
    field: string,
    showConfirm?: boolean,
  ) => boolean | Promise<boolean | undefined> | undefined,
): VxeTableGridOptions<RegionApi.Region>['columns'] {
  const actionOptions = processTableActions([
    {
      code: 'createChild',
      btnText: $t('common.createChild'),
      perCode: 'region:create',
    },
    {
      code: 'update',
      perCode: 'region:update',
    },
    {
      code: 'delete',
      perCode: 'region:delete',
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
      field: 'name',
      treeNode: true,
      title: $t('region.name'),
      minWidth: 160,
    },
    {
      field: 'level',
      title: $t('region.level'),
      cellRender: {
        name: 'CellTag',
        options: [
          {
            label: '国家',
            value: 0,
          },
          {
            label: '省份',
            value: 1,
          },
          {
            label: '地级市',
            value: 2,
          },
          {
            label: '县区',
            value: 3,
          },
        ],
      },
      minWidth: 120,
    },
    {
      field: 'parentIdLabel',
      title: $t('region.parentId'),
      minWidth: 100,
    },
    {
      field: 'short',
      title: $t('region.short'),
      minWidth: 160,
    },
    {
      field: 'cityCode',
      title: $t('region.cityCode'),
      minWidth: 160,
    },
    {
      field: 'zipCode',
      title: $t('region.zipCode'),
      minWidth: 120,
    },
    {
      field: 'sort',
      title: $t('region.sort'),
      cellRender: {
        attrs: {
          beforeChange: onCellUpdate,
        },
        name: 'CellInputNumber',
      },
      minWidth: 100,
      sortable: true,
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

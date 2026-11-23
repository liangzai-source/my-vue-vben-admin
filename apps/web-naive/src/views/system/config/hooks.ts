import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';

import type { OnActionClickFn } from '#/adapter/vxe-table';
import type { SystemConfigApi } from '#/api/system/config';

import { h } from 'vue';

import { $t } from '@vben/locales';

import { NTag } from 'naive-ui';

import { getActionColumnWidth, processTableActions } from '#/utils/access';

export const COMPONENT_TYPE_MAP: Record<string, { label: string; type: any }> =
  {
    input: { label: '单行文本', type: 'info' },
    textarea: { label: '多行文本', type: 'default' },
    number: { label: '数字输入', type: 'primary' },
    switch: { label: '开关', type: 'success' },
    select: { label: '下拉选择', type: 'warning' },
    radio: { label: '单选按钮', type: 'warning' },
    upload_image: { label: '单图上传', type: 'error' },
    upload_file: { label: '文件附件', type: 'error' },
    date: { label: '日期选择', type: 'info' },
    editor: { label: '富文本', type: 'primary' },
  };

export function useSystemConfigColumns<T = SystemConfigApi.SystemConfig>(
  onActionClick: OnActionClickFn<T>,
  onStatusChange?: (newStatus: number, row: T) => PromiseLike<void>,
): VxeTableGridOptions<SystemConfigApi.SystemConfig>['columns'] {
  const actionOptions = processTableActions([
    {
      code: 'update',
      perCode: 'system:config:update',
    },
    {
      code: 'delete',
      perCode: 'system:config:delete',
      disabled: (row: any) => row.isSystem === 1,
    },
  ]);
  const actionColumnWidth = getActionColumnWidth(actionOptions);

  return [
    {
      title: 'ID',
      field: 'id',
      width: 70,
    },
    {
      title: $t('system.config.name'),
      field: 'name',
      minWidth: 150,
    },
    {
      title: $t('system.config.key'),
      field: 'key',
      minWidth: 160,
    },
    {
      title: $t('system.config.componentType'),
      field: 'componentType',
      width: 120,
      slots: {
        default: ({ row }) => {
          const comp = COMPONENT_TYPE_MAP[row.componentType] || {
            label: row.componentType,
            type: 'default',
          };
          return h(
            NTag,
            { type: comp.type, size: 'small', round: true },
            { default: () => comp.label },
          );
        },
      },
    },
    {
      title: $t('system.config.value'),
      field: 'value',
      minWidth: 180,
      showOverflow: 'tooltip',
    },
    {
      title: $t('system.config.sort'),
      field: 'sort',
      width: 90,
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
      title: $t('system.config.isSystem'),
      field: 'isSystem',
      width: 110,
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
                row.isSystem === 1 ? $t('system.config.isSystem') : '自定义',
            },
          );
        },
      },
    },
    {
      title: $t('common.createdAt'),
      field: 'createdAt',
      width: 170,
    },
    {
      align: 'center',
      fixed: 'right',
      width: actionColumnWidth,
      title: $t('common.operation'),
      cellRender: {
        attrs: {
          nameField: 'name',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: actionOptions,
      },
    },
  ];
}

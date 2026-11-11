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
      width: 80,
    },
    {
      align: 'center',
      field: 'tableName',
      title: '数据表名',
      width: 160,
    },
    {
      align: 'center',
      field: 'moduleName',
      title: '模块标识',
      width: 140,
    },
    {
      align: 'center',
      field: 'businessName',
      title: '业务名称',
      minWidth: 140,
    },
    {
      align: 'center',
      field: 'className',
      title: '模型类名',
      width: 140,
    },
    {
      align: 'center',
      field: 'status',
      title: '状态',
      width: 120,
      cellRender: {
        name: 'CellTag',
        options: [
          { value: 1, label: '已落盘', type: 'success' },
          { value: 0, label: '未生成', type: 'warning' },
        ],
      },
    },
    {
      align: 'center',
      field: 'createdAt',
      title: '生成时间',
      width: 180,
    },
    {
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'businessName',
          nameTitle: '代码及生成记录',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: processTableActions([
          {
            code: 'preview',
            btnText: '查看代码',
            perCode: 'dev:crud:list',
          },
          {
            code: 'update',
            btnText: '编辑配置',
            perCode: 'dev:crud:update',
          },
          {
            code: 'regenerate',
            btnText: '重新生成',
            perCode: 'dev:crud:create',
          },
          {
            code: 'deleteCode',
            btnText: '删除代码',
            type: 'warning',
            confirm: true,
            confirmTitle: '删除生成代码',
            confirmContent: (row: DevCrudApi.DevCrud) =>
              `确定删除【${row.businessName || row.moduleName}】本地物理代码吗？（生成记录与已生成的菜单不会被删除，可修改配置后重新生成）`,
            show: (row: DevCrudApi.DevCrud) => row.status === 1,
            perCode: 'dev:crud:delete',
          },
          {
            code: 'delete',
            btnText: '删除记录',
            confirmTitle: '删除生成记录',
            confirmContent: (row: DevCrudApi.DevCrud) =>
              row.status === 1
                ? `确定仅删除【${row.businessName || row.moduleName}】的配置记录吗？已生成的本地代码与菜单不会自动删除。`
                : `确定删除【${row.businessName || row.moduleName}】的配置记录吗？（已生成的菜单不会被删除）`,
            perCode: 'dev:crud:delete',
          },
        ]),
      },
      visible: checkPermission([
        'dev:crud:list',
        'dev:crud:create',
        'dev:crud:update',
        'dev:crud:delete',
      ]),
      field: 'operation',
      fixed: 'right',
      headerAlign: 'center',
      showOverflow: false,
      title: $t('common.operation'),
      width: 350,
    },
  ];
}

import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';

import type { ListResponse } from '#/types/common';

export function useDefaultGridOptions<T>(
  columns: VxeTableGridOptions<T>['columns'],
  queryFunc: (params: any) => Promise<ListResponse<T>>,
  toolbarConfig: VxeTableGridOptions<T>['toolbarConfig'] = undefined,
): VxeTableGridOptions<T> {
  if (!toolbarConfig) {
    toolbarConfig = {
      custom: true,
      refresh: true,
      resizable: true,
      search: true,
      zoom: true,
    };
  }
  return {
    columns,
    height: 'auto',
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await queryFunc({
            page: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    toolbarConfig,
  };
}

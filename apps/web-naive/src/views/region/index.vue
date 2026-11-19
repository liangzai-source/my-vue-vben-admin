<script setup lang="ts">
import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';

import type { VbenFormProps } from '#/adapter/form';
import type { RegionApi } from '#/api/region';

import { Page, useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';

import cloneDeep from 'lodash.clonedeep';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  regionDeleteApi,
  regionListApi,
  regionParentIdOptionsApi,
  regionUpdateApi,
  regionUpdateStatusApi,
} from '#/api/region';
import IconButton from '#/components/common/IconButton.vue';
import { useStatusChange } from '#/hooks/statusConfirm';
import { useTableAction } from '#/hooks/tableAction';
import { asyncConfirm } from '#/utils/tools';

import { useRegionColumns } from './hooks';
import Form from './modules/form.vue';

const { onActionClick } = useTableAction<RegionApi.Region>({
  update: onUpdate,
  delete: onDelete,
  createChild: onCreateChild,
});
const { statusChangeFunc } = useStatusChange<RegionApi.Region>(
  (id: number, newStatus: any) => regionUpdateStatusApi(id, newStatus),
);

async function onStatusChange(
  newVal: any,
  row: RegionApi.Region,
  field: string = 'status',
  showConfirm: boolean = true,
) {
  if (field === 'status') {
    return await statusChangeFunc(newVal, row, showConfirm);
  }
  if (showConfirm) {
    const rowName =
      (row as any).name ||
      (row as any).nickname ||
      (row as any).title ||
      (row as any).account ||
      (row as any).username ||
      row.id;
    const isConfirm = await asyncConfirm({
      title: $t('common.tip'),
      content: $t('common.statusConfirm', [
        rowName,
        newVal === 1 || newVal === true
          ? $t('common.enableStatus')
          : $t('common.disableStatus'),
      ]),
    });
    if (!isConfirm) return false;
  }
  return await onCellUpdate(newVal, row, field);
}

async function onCellUpdate(val: any, row: any, field: string) {
  try {
    await regionUpdateApi(row.id, {
      ...row,
      [field]: val,
    });
    gridApi.query();
    return true;
  } catch (error) {
    console.error('更新字段失败:', error);
    return false;
  }
}
function normalizeTreeRows(res: any) {
  if (Array.isArray(res)) return res;
  if (res && Array.isArray(res.items)) return res.items;
  return [];
}
const getGridOptions: VxeTableGridOptions<RegionApi.Region> = {
  columns: useRegionColumns(onActionClick, onCellUpdate, onStatusChange),
  height: 'auto',
  pagerConfig: {
    enabled: true,
    autoHidden: true,
  },
  proxyConfig: {
    ajax: {
      query: async ({ page }: any, formValues: any) => {
        const params: Record<string, any> = { ...formValues };
        const hasOtherSearch = Object.keys(params).some(
          (k) =>
            k !== 'parentId' &&
            params[k] !== '' &&
            params[k] !== null &&
            params[k] !== undefined,
        );
        if (
          !hasOtherSearch &&
          (params.parentId === null || params.parentId === undefined)
        ) {
          // 纯树形浏览模式：查顶级节点，全量不分页
          params.parentId = 0;
          params.pageSize = -1;
          const res = await regionListApi(params);
          const items = normalizeTreeRows(res);
          return {
            items,
            total: items.length,
          };
        }
        // 条件搜索模式：启用标准分页，避免单次 DOM 挂载过载
        params.page = page?.currentPage || 1;
        params.pageSize = page?.pageSize || 20;
        const res = await regionListApi(params);
        return res;
      },
    },
  },
  rowConfig: {
    keyField: 'id',
  },
  toolbarConfig: {
    custom: true,
    refresh: true,
    resizable: true,
    search: true,
    zoom: true,
  },
  treeConfig: {
    lazy: true,
    rowField: 'id',
    parentField: 'parentId',
    hasChild: 'hasChildren',
    loadMethod({ row }) {
      return regionListApi({
        parentId: row.id,
        pageSize: -1,
      }).then(normalizeTreeRows);
    },
  },
};
const formOptions: VbenFormProps = {
  collapsed: false,
  submitOnChange: false,
  schema: [
    {
      fieldName: 'name',
      label: '名称',
      component: 'Input',
      componentProps: {
        clearable: true,
      },
    },
    {
      fieldName: 'level',
      label: '等级',
      component: 'Select',
      componentProps: {
        clearable: true,
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
    },
    {
      fieldName: 'parentId',
      label: '父级地区编码',
      component: 'RelationSelect',
      componentProps: {
        api: regionParentIdOptionsApi,
        clearable: true,
      },
    },
  ],
};

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions,
  gridOptions: getGridOptions,
});
const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

function onUpdate(row: RegionApi.Region) {
  formModalApi.setData(cloneDeep(row)).open();
}

function onDelete(row: RegionApi.Region) {
  regionDeleteApi(row.id).then(() => {
    gridApi.query();
  });
}

function onRefresh() {
  gridApi.query();
}

function onCreate() {
  formModalApi.setData({}).open();
}

function onCreateChild(row: RegionApi.Region) {
  formModalApi.setData({ parentId: row.id }).open();
}
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="onRefresh" />
    <Grid :table-title="$t('region.list')">
      <template #toolbar-tools>
        <IconButton
          icon="ic:outline-plus"
          @click="onCreate"
          v-access:code="'region:create'"
        >
          {{ $t('common.create', [$t('region.entityTitle')]) }}
        </IconButton>
      </template>
    </Grid>
  </Page>
</template>

<style scoped></style>

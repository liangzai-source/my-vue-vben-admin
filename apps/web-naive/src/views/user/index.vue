<script setup lang="ts">
import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';

import type { VbenFormProps } from '#/adapter/form';
import type { UserApi } from '#/api/user';

import { Page, useVbenDrawer } from '@vben/common-ui';
import { $t } from '@vben/locales';

import cloneDeep from 'lodash.clonedeep';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  userDeleteApi,
  userListApi,
  userUpdateApi,
  userUpdateStatusApi,
} from '#/api/user';
import IconButton from '#/components/common/IconButton.vue';
import { useDefaultGridOptions } from '#/hooks/defaultGirdOptions';
import { useStatusChange } from '#/hooks/statusConfirm';
import { useTableAction } from '#/hooks/tableAction';
import { asyncConfirm } from '#/utils/tools';

import { useUserColumns } from './hooks';
import Form from './modules/form.vue';

const { onActionClick } = useTableAction<UserApi.User>({
  update: onUpdate,
  delete: onDelete,
});
const { statusChangeFunc } = useStatusChange<UserApi.User>(
  (id: number, newStatus: any) => userUpdateStatusApi(id, newStatus),
  { rowNameField: 'nickname' },
);

async function onStatusChange(
  newVal: any,
  row: UserApi.User,
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
    await userUpdateApi(row.id, {
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
const getGridOptions: VxeTableGridOptions<UserApi.User> = useDefaultGridOptions(
  useUserColumns(onActionClick, onCellUpdate, onStatusChange),
  userListApi,
);
const formOptions: VbenFormProps = {
  collapsed: false,
  submitOnChange: false,
  schema: [
    {
      fieldName: 'status',
      label: '状态',
      component: 'Select',
      componentProps: {
        clearable: true,
        filterable: true,
        options: [
          {
            label: '启用',
            value: 1,
          },
          {
            label: '禁用',
            value: 0,
          },
        ],
      },
    },
    {
      fieldName: 'createdAt',
      label: '创建时间',
      component: 'DatePicker',
      componentProps: {
        clearable: true,
        type: 'datetimerange',
      },
    },
  ],
};

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions,
  gridOptions: getGridOptions,
});
const [FormDrawer, formDrawerApi] = useVbenDrawer({
  connectedComponent: Form,
  destroyOnClose: true,
});

function onUpdate(row: UserApi.User) {
  formDrawerApi.setData(cloneDeep(row)).open();
}

function onDelete(row: UserApi.User) {
  userDeleteApi(row.id).then(() => {
    gridApi.query();
  });
}

function onRefresh() {
  gridApi.query();
}

function onCreate() {
  formDrawerApi.setData({}).open();
}
</script>

<template>
  <Page auto-content-height>
    <FormDrawer @success="onRefresh" />
    <Grid :table-title="$t('user.list')">
      <template #toolbar-tools>
        <IconButton
          icon="ic:outline-plus"
          @click="onCreate"
          v-access:code="'user:create'"
        >
          {{ $t('common.create', [$t('user.entityTitle')]) }}
        </IconButton>
      </template>
    </Grid>
  </Page>
</template>

<style scoped></style>

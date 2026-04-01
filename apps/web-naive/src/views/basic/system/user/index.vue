<script setup lang="ts">
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { SystemUserApi } from '#/api/system/user';

import { Page, useVbenDrawer } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  systemUserDeleteApi,
  systemUserListApi,
  systemUserUpdateStatusApi,
} from '#/api/system/user';
import IconButton from '#/components/common/IconButton.vue';
import { useDefaultGridOptions } from '#/hooks/defaultGirdOptions';
import { useStatusChange } from '#/hooks/statusConfirm';
import { useTableAction } from '#/hooks/tableAction';

import { useSystemUserColumns } from './hooks';
import Form from './modules/form.vue';

const { statusChangeFunc } = useStatusChange<SystemUserApi.SystemUser>(
  systemUserUpdateStatusApi,
);

const [FormDrawer, formDrawerApi] = useVbenDrawer({
  connectedComponent: Form,
  destroyOnClose: true,
});

const { onActionClick } = useTableAction<SystemUserApi.SystemUser>({
  update: onUpdate,
  delete: onDelete,
});

const statusChangeFun = async (
  newStatus: number,
  row: SystemUserApi.SystemUser,
) => {
  await statusChangeFunc(newStatus, row);
};

const getGridOptions: VxeTableGridOptions<SystemUserApi.SystemUser> =
  useDefaultGridOptions(
    useSystemUserColumns(onActionClick, statusChangeFun),
    systemUserListApi,
  );

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: getGridOptions,
});

function onDelete(row: SystemUserApi.SystemUser) {
  systemUserDeleteApi(row.id).then(() => {
    gridApi.query();
  });
}

function onUpdate(row: SystemUserApi.SystemUser) {
  formDrawerApi.setData(row).open();
}

function onCreate() {
  formDrawerApi.setData({}).open();
}

function onRefresh() {
  gridApi.query();
}
</script>

<template>
  <Page auto-content-height>
    <FormDrawer @success="onRefresh" />
    <Grid :table-title="$t('system.user.list')">
      <template #toolbar-tools>
        <IconButton
          icon="ic:outline-plus"
          @click="onCreate"
          v-access:code="'sys:user:create'"
        >
          {{ $t('ui.actionTitle.create', [$t('system.user.name')]) }}
        </IconButton>
      </template>
    </Grid>
  </Page>
</template>

<style scoped></style>

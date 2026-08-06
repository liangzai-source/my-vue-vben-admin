<script setup lang="ts">
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { SystemUserApi } from '#/api/system/user';

import { Page, useVbenDrawer, useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { message } from '#/adapter/naive';
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
import Permission from './modules/permission.vue';

const { statusChangeFunc } = useStatusChange<SystemUserApi.SystemUser>(
  systemUserUpdateStatusApi,
);

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

const [PermissionDrawer, permissionDrawerApi] = useVbenDrawer({
  connectedComponent: Permission,
  destroyOnClose: true,
});

const { onActionClick } = useTableAction<SystemUserApi.SystemUser>({
  update: onUpdate,
  delete: onDelete,
  permission: onPermission,
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
  formModalApi.setData(row).open();
}

function onCreate() {
  formModalApi.setData({}).open();
}

function onPermission(row: SystemUserApi.SystemUser) {
  if (row.isAdministrator === 1) {
    message.error($t('system.user.superNotOperation'));
  } else {
    permissionDrawerApi.setData(row).open();
  }
}

function onRefresh() {
  gridApi.query();
}
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="onRefresh" />
    <PermissionDrawer />
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

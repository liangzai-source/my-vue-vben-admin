<script lang="ts" setup>
import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';

import type { SystemRoleApi } from '#/api/system/role';

import { Page, useVbenDrawer } from '@vben/common-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  systemRoleDeleteApi,
  systemRoleListApi,
  systemRoleUpdateStatusApi,
} from '#/api/system/role';
import IconButton from '#/components/common/IconButton.vue';
import { useDefaultGridOptions } from '#/hooks/defaultGirdOptions';
import { useStatusChange } from '#/hooks/statusConfirm';
import { useTableAction } from '#/hooks/tableAction';
import { useSystemRoleColumns } from '#/views/system/role/hooks';
import Form from '#/views/system/role/modules/form.vue';
import Permission from '#/views/system/role/modules/permission.vue';

const { statusChangeFunc } = useStatusChange<SystemRoleApi.SystemRole>(
  systemRoleUpdateStatusApi,
);

const [FormDrawer, formDrawerApi] = useVbenDrawer({
  connectedComponent: Form,
  destroyOnClose: true,
});

const [PermissionDrawer, permissionDrawerApi] = useVbenDrawer({
  connectedComponent: Permission,
  destroyOnClose: true,
});

const statusChangeFun = async (
  newStatus: number,
  row: SystemRoleApi.SystemRole,
) => {
  await statusChangeFunc(newStatus, row);
};

const { onActionClick } = useTableAction<SystemRoleApi.SystemRole>({
  update: onUpdate,
  delete: onDelete,
  permission: onPermission,
});

const getGridOptions: VxeTableGridOptions<SystemRoleApi.SystemRole> =
  useDefaultGridOptions(
    useSystemRoleColumns(onActionClick, statusChangeFun),
    systemRoleListApi,
  );

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: getGridOptions,
});

function onDelete(row: SystemRoleApi.SystemRole) {
  systemRoleDeleteApi(row.id).then(() => {
    gridApi.query();
  });
}

function onUpdate(row: SystemRoleApi.SystemRole) {
  formDrawerApi.setData(row).open();
}

function onCreate() {
  formDrawerApi.setData({}).open();
}

function onPermission(row: SystemRoleApi.SystemRole) {
  permissionDrawerApi.setData(row).open();
}

function onRefresh() {
  gridApi.query();
}
</script>

<template>
  <Page auto-content-height>
    <FormDrawer @success="onRefresh" />
    <PermissionDrawer />
    <Grid :table-title="$t('system.role.list')">
      <template #toolbar-tools>
        <IconButton
          v-access:code="'sys:role:create'"
          icon="ic:outline-plus"
          @click="onCreate"
        >
          {{ $t('ui.actionTitle.create', [$t('system.role.createName')]) }}
        </IconButton>
      </template>
    </Grid>
  </Page>
</template>

<style scoped></style>

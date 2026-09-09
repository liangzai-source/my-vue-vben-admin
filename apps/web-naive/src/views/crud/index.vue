<script setup lang="ts">
import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';

import type { DevCrudApi } from '#/api/dev/crud';

import { Page, useVbenDrawer } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { devCrudListApi } from '#/api/dev/crud';
import IconButton from '#/components/common/IconButton.vue';
import { useDefaultGridOptions } from '#/hooks/defaultGirdOptions';
import { useTableAction } from '#/hooks/tableAction';
import { useDevCrudColumns } from '#/views/crud/hooks';
import Form from '#/views/crud/modules/form.vue';

const { onActionClick } = useTableAction<DevCrudApi.DevCrud>({
  update: onUpdate,
  delete: onDelete,
});

const getGridOptions: VxeTableGridOptions<DevCrudApi.DevCrud> =
  useDefaultGridOptions(useDevCrudColumns(onActionClick), devCrudListApi);

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: getGridOptions,
});

const [FormDrawer, formDrawerApi] = useVbenDrawer({
  connectedComponent: Form,
  destroyOnClose: true,
});

function onUpdate(row: DevCrudApi.DevCrud) {
  message.info(`修改${row.id}`);
}

function onDelete(row: DevCrudApi.DevCrud) {
  message.info(`删除${row.id}`);
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
    <Grid :table-title="$t('system.user.list')">
      <template #toolbar-tools>
        <IconButton
          icon="ic:outline-plus"
          @click="onCreate"
          v-access:code="'dev:crud:create'"
        >
          {{ $t('ui.actionTitle.create') }}
        </IconButton>
      </template>
    </Grid>
  </Page>
</template>

<style scoped></style>

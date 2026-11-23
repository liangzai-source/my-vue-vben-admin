<script lang="ts" setup>
import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';

import type { SystemConfigCategoryApi } from '#/api/system/config-category';

import { Page, useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';

import cloneDeep from 'lodash.clonedeep';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  systemConfigCategoryDeleteApi,
  systemConfigCategoryListApi,
  systemConfigCategoryUpdateStatusApi,
} from '#/api/system/config-category';
import IconButton from '#/components/common/IconButton.vue';
import { useDefaultGridOptions } from '#/hooks/defaultGirdOptions';
import { useStatusChange } from '#/hooks/statusConfirm';
import { useTableAction } from '#/hooks/tableAction';
import { checkPermission } from '#/utils/access';
import { useSystemConfigCategoryColumns } from '#/views/system/config-category/hooks';
import Form from '#/views/system/config-category/modules/form.vue';

const { statusChangeFunc } =
  useStatusChange<SystemConfigCategoryApi.SystemConfigCategory>(
    systemConfigCategoryUpdateStatusApi,
  );

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

const statusChangeFun = async (
  newStatus: number,
  row: SystemConfigCategoryApi.SystemConfigCategory,
) => {
  await statusChangeFunc(newStatus, row);
};

const { onActionClick } =
  useTableAction<SystemConfigCategoryApi.SystemConfigCategory>({
    update: onUpdate,
    delete: onDelete,
  });

const getGridOptions: VxeTableGridOptions<SystemConfigCategoryApi.SystemConfigCategory> =
  useDefaultGridOptions(
    useSystemConfigCategoryColumns(onActionClick, statusChangeFun),
    systemConfigCategoryListApi,
  );

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: getGridOptions,
});

function onUpdate(row: SystemConfigCategoryApi.SystemConfigCategory) {
  formModalApi.setData(cloneDeep(row)).open();
}

async function onDelete(row: SystemConfigCategoryApi.SystemConfigCategory) {
  await systemConfigCategoryDeleteApi(row.id);
  gridApi.reload();
}

function handleAdd() {
  formModalApi.setData({}).open();
}
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-tools>
        <IconButton
          v-if="checkPermission('system:config-category:create')"
          icon="ant-design:plus-outlined"
          type="primary"
          @click="handleAdd"
        >
          {{ $t('common.create', [$t('system.configCategory.menuTitle')]) }}
        </IconButton>
      </template>
    </Grid>
    <FormModal @success="gridApi.reload()" />
  </Page>
</template>

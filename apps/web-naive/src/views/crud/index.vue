<script setup lang="ts">
import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';

import type { DevCrudApi } from '#/api/dev/crud';

import { Page, useVbenDrawer, useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  devCrudDeleteApi,
  devCrudDetailApi,
  devCrudListApi,
  devCrudPreviewApi,
  devCrudReGenerateApi,
} from '#/api/dev/crud';
import IconButton from '#/components/common/IconButton.vue';
import { useDefaultGridOptions } from '#/hooks/defaultGirdOptions';
import { useTableAction } from '#/hooks/tableAction';
import { useDevCrudColumns } from '#/views/crud/hooks';
import Form from '#/views/crud/modules/form.vue';
import PreviewModalComponent from '#/views/crud/modules/preview-modal.vue';

const { onActionClick } = useTableAction<DevCrudApi.DevCrud>({
  preview: onPreview,
  update: onUpdate,
  regenerate: onRegenerate,
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

const [PreviewModal, previewModalApi] = useVbenModal({
  connectedComponent: PreviewModalComponent,
  destroyOnClose: true,
});

// 查看生成代码
async function onPreview(row: DevCrudApi.DevCrud) {
  try {
    const schemaObj =
      typeof row.schema === 'string' ? JSON.parse(row.schema) : row.schema;
    const previews = await devCrudPreviewApi(schemaObj);
    previewModalApi.setData(previews).open();
  } catch (error: any) {
    message.error(error?.message || '解析生成代码失败');
  }
}

// 编辑已有生成配置
async function onUpdate(row: DevCrudApi.DevCrud) {
  try {
    const detail = await devCrudDetailApi(row.id);
    formDrawerApi.setData(detail.schema).open();
  } catch (error: any) {
    message.error(error?.message || '读取配置详情失败');
  }
}

// 重新生成
async function onRegenerate(row: DevCrudApi.DevCrud) {
  try {
    await devCrudReGenerateApi(row.id);
    message.success(
      `模块 [${row.moduleName}] 代码重新生成成功，已覆盖本地文件！`,
    );
    onRefresh();
  } catch (error: any) {
    message.error(error?.message || '重新生成失败');
  }
}

// 删除已生成代码
async function onDelete(row: DevCrudApi.DevCrud) {
  try {
    await devCrudDeleteApi(row.id);
    message.success(`模块 [${row.moduleName}] 本地物理代码与记录已安全清除！`);
    onRefresh();
  } catch (error: any) {
    message.error(error?.message || '删除生成代码失败');
  }
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
    <PreviewModal />
    <Grid :table-title="$t('dev.crud.title')">
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

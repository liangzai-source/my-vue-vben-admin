<script setup lang="ts">
import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';

import type { DevCrudApi } from '#/api/dev/crud';

import { Page, useVbenDrawer, useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  devCrudDeleteApi,
  devCrudDeleteCodeApi,
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
  deleteCode: onDeleteCode,
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
    const res = await devCrudReGenerateApi(row.id);
    const menuTip =
      res?.menuCount && res.menuCount > 0
        ? ` 并自动新增了 ${res.menuCount} 条菜单/权限节点！`
        : '';
    message.success(
      `模块 [${row.moduleName}] 代码重新生成成功，已覆盖本地文件！${menuTip}`,
    );
    onRefresh();
  } catch (error: any) {
    message.error(error?.message || '重新生成失败');
  }
}

// 仅删除已生成的物理代码文件（保留生成记录与菜单）
async function onDeleteCode(row: DevCrudApi.DevCrud) {
  try {
    await devCrudDeleteCodeApi(row.id);
    message.warning(
      `模块 [${row.moduleName}] 物理代码文件已删除（生成记录未删除，且已生成的菜单未删除）。`,
    );
    onRefresh();
  } catch (error: any) {
    message.error(error?.message || '删除生成代码失败');
  }
}

// 仅删除数据库生成记录（不删除菜单）
async function onDelete(row: DevCrudApi.DevCrud) {
  try {
    await devCrudDeleteApi(row.id);
    message.success(
      `模块 [${row.moduleName}] 生成记录已删除（已生成的菜单未删除）。`,
    );
    onRefresh();
  } catch (error: any) {
    message.error(error?.message || '删除生成记录失败');
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

<script setup lang="ts">
import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';

import type { DevCrudApi } from '#/api/dev/crud';

import { onMounted, ref } from 'vue';

import { Page, useVbenDrawer, useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { NButton, NCard, NInput, NTag } from 'naive-ui';

import { message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  devCrudDeleteApi,
  devCrudDeleteCodeApi,
  devCrudDetailApi,
  devCrudGetPathsApi,
  devCrudListApi,
  devCrudPreviewApi,
  devCrudReGenerateApi,
  devCrudSavePathsApi,
} from '#/api/dev/crud';
import IconButton from '#/components/common/IconButton.vue';
import { useDefaultGridOptions } from '#/hooks/defaultGirdOptions';
import { useTableAction } from '#/hooks/tableAction';
import { useDevCrudColumns } from '#/views/crud/hooks';
import DirPickerModal from '#/views/crud/modules/dir-picker-modal.vue';
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
    const schema = {
      ...detail.schema,
      id: row.id,
    };
    formDrawerApi.setData(schema).open();
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

const backendPath = ref('');
const frontendPath = ref('');
const pathsConfigured = ref(false);
const savingPaths = ref(false);
const dirPickerVisible = ref(false);
const dirPickerTarget = ref<'backend' | 'frontend'>('backend');

async function loadProjectPaths() {
  try {
    const info = await devCrudGetPathsApi();
    backendPath.value = info.backendPath;
    frontendPath.value = info.frontendPath;
    pathsConfigured.value = info.configured;
  } catch (error: any) {
    message.error(error?.message || '读取生成路径配置失败');
  }
}

function openDirPicker(target: 'backend' | 'frontend') {
  dirPickerTarget.value = target;
  dirPickerVisible.value = true;
}

function handleDirSelected(selectedPath: string) {
  if (dirPickerTarget.value === 'backend') {
    backendPath.value = selectedPath;
  } else {
    frontendPath.value = selectedPath;
  }
}

async function onSavePaths() {
  savingPaths.value = true;
  try {
    const info = await devCrudSavePathsApi({
      backendPath: backendPath.value,
      frontendPath: frontendPath.value,
    });
    backendPath.value = info.backendPath;
    frontendPath.value = info.frontendPath;
    pathsConfigured.value = info.configured;
    message.success('生成路径配置已保存到本地配置文件');
  } catch (error: any) {
    message.error(error?.message || '保存路径配置失败');
  } finally {
    savingPaths.value = false;
  }
}

onMounted(() => {
  loadProjectPaths();
});
</script>

<template>
  <Page auto-content-height>
    <FormDrawer @success="onRefresh" />
    <PreviewModal />
    <DirPickerModal
      v-model:show="dirPickerVisible"
      :initial-path="dirPickerTarget === 'backend' ? backendPath : frontendPath"
      :title="
        dirPickerTarget === 'backend'
          ? '选择后端项目根目录（含 go.mod）'
          : '选择前端项目根目录（含 package.json）'
      "
      @select="handleDirSelected"
    />
    <div class="flex h-full flex-col gap-3">
      <NCard size="small" class="shrink-0">
        <div class="flex flex-wrap items-center gap-3">
          <div class="flex min-w-[300px] flex-1 items-center gap-2">
            <span class="shrink-0 text-sm font-medium">后端路径</span>
            <NInput
              v-model:value="backendPath"
              size="small"
              placeholder="Go 项目根目录（含 go.mod）"
            />
            <NButton size="small" @click="openDirPicker('backend')">
              选择文件夹
            </NButton>
          </div>
          <div class="flex min-w-[300px] flex-1 items-center gap-2">
            <span class="shrink-0 text-sm font-medium">前端路径</span>
            <NInput
              v-model:value="frontendPath"
              size="small"
              placeholder="前端项目根目录（含 package.json）"
            />
            <NButton size="small" @click="openDirPicker('frontend')">
              选择文件夹
            </NButton>
          </div>
          <div class="flex shrink-0 items-center gap-2">
            <NButton
              type="primary"
              size="small"
              :loading="savingPaths"
              @click="onSavePaths"
            >
              保存配置
            </NButton>
            <NTag
              size="small"
              :type="pathsConfigured ? 'success' : 'default'"
              :bordered="false"
            >
              {{ pathsConfigured ? '已存本地配置' : '默认自动探测' }}
            </NTag>
          </div>
        </div>
      </NCard>

      <div class="min-h-0 flex-1">
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
      </div>
    </div>
  </Page>
</template>

<style scoped></style>

<script setup lang="ts">
import type { Schema } from '#/crud/types';

import { ref, watch } from 'vue';

import { useVbenDrawer, useVbenModal } from '@vben/common-ui';

import { NButton, NPopconfirm, NTabPane, NTabs } from 'naive-ui';

import { message } from '#/adapter/naive';
import {
  devCrudGenerateApi,
  devCrudPreviewApi,
  devCrudSaveApi,
} from '#/api/dev/crud';
import { createDefaultSchema } from '#/crud/default';
import { smartInferSchema } from '#/crud/smartInference';
import { isEmpty } from '#/utils/tools';

import BasicForm from './components/basic.vue';
import FieldForm from './components/field.vue';
import PageForm from './components/page.vue';
import RouteForm from './components/route.vue';
import PreviewModalComponent from './preview-modal.vue';

const emit = defineEmits<{
  (e: 'success'): void;
}>();

const formData = ref<Schema>(createDefaultSchema());
const previewLoading = ref(false);
const saveLoading = ref(false);
const generateLoading = ref(false);

const [PreviewModal, previewModalApi] = useVbenModal({
  connectedComponent: PreviewModalComponent,
  destroyOnClose: true,
});

const [Drawer, drawerApi] = useVbenDrawer<Schema>({
  confirmText: '预览生成代码',
  onConfirm: handlePreview,
  onOpenChange: (isOpen) => {
    const data = drawerApi.getData();
    if (isOpen && !isEmpty(data)) {
      formData.value = data;
    } else if (isOpen) {
      formData.value = createDefaultSchema();
    }
  },
});

function onTableLoaded(loadedSchema: Schema) {
  formData.value = smartInferSchema(loadedSchema);
}

function formatMenuTitle(val?: string): string {
  if (!val) return '';
  return val.endsWith('管理') ? val : `${val}管理`;
}

// 智能联动：当修改“功能名称(中文)”时，若菜单名称未被单独定制则自动同步（默认补齐“管理”）
watch(
  () => formData.value.basicConfig?.comment,
  (newComment, oldComment) => {
    if (!formData.value?.routeConfig) return;
    const currentMenuName = formData.value.routeConfig.menuName;
    const oldExpected = formatMenuTitle(oldComment);
    if (
      !currentMenuName ||
      currentMenuName === oldComment ||
      currentMenuName === oldExpected
    ) {
      formData.value.routeConfig.menuName = formatMenuTitle(newComment);
    }
  },
);

// 智能联动：当在多功能共享表模式下修改“标识值 (singleCodeVal)”时，自动同步模块名与路由路径（仅在新建未持久化时联动，编辑已有配置时不静默覆盖）
watch(
  () => formData.value.pageConfig?.singleCodeVal,
  (newVal) => {
    if (
      !formData.value.id &&
      formData.value.pageConfig?.pageMode === 'single' &&
      formData.value.pageConfig?.tableMode === 'shared' &&
      newVal?.trim()
    ) {
      const codeSlug = newVal.trim();
      const currentModule = formData.value.basicConfig?.moduleName;
      const currentTable = formData.value.basicConfig?.tableName;
      // 若当前模块名为空，或模块名依然与表名相同（未单独定制过），自动同步为标识值
      if (
        !currentModule ||
        currentModule === currentTable ||
        (currentTable && currentModule === currentTable.replace(/^y_/, ''))
      ) {
        formData.value.basicConfig.moduleName = codeSlug;
        if (formData.value.routeConfig) {
          formData.value.routeConfig.apiPath = `/${codeSlug}`;
          formData.value.routeConfig.pagePath = `/${codeSlug}`;
        }
      }
    }
  },
);

// 智能联动：在多功能共享表模式下修改模块名时，自动同步 API 与页面路由路径
watch(
  () => formData.value.basicConfig?.moduleName,
  (newMod, oldMod) => {
    if (
      formData.value.pageConfig?.pageMode === 'single' &&
      formData.value.pageConfig?.tableMode === 'shared' &&
      newMod?.trim()
    ) {
      const slug = newMod.trim();
      if (
        !formData.value.routeConfig?.apiPath ||
        formData.value.routeConfig.apiPath === `/${oldMod}`
      ) {
        formData.value.routeConfig.apiPath = `/${slug}`;
      }
      if (
        !formData.value.routeConfig?.pagePath ||
        formData.value.routeConfig.pagePath === `/${oldMod}`
      ) {
        formData.value.routeConfig.pagePath = `/${slug}`;
      }
    }
  },
);

function validateBeforeAction(schema: Schema): boolean {
  if (!schema.basicConfig.moduleName.trim()) {
    message.warning('请输入模块名称 (moduleName)');
    return false;
  }

  const pkField = (schema.basicConfig.pkField || 'id').trim().toLowerCase();

  // 继承CRUD基类校验
  if (schema.basicConfig.inheritBase && pkField !== 'id') {
    message.error(
      '开启【继承通用CRUD基类】时，主键名称必须为 id，请修改主键名称或关闭继承通用CRUD基类',
    );
    return false;
  }

  // 单页模式校验
  if (
    schema.pageConfig.pageMode === 'single' &&
    schema.pageConfig.tableMode === 'shared'
  ) {
    if (!schema.pageConfig.singleCodeCol?.trim()) {
      message.error('共享表模式下必须选择标识字段 (singleCodeCol)');
      return false;
    }
    if (!schema.pageConfig.singleCodeVal?.trim()) {
      message.error('共享表模式下必须填写标识值 (singleCodeVal)');
      return false;
    }
  }

  return true;
}

// 预览代码
async function handlePreview() {
  if (!validateBeforeAction(formData.value)) {
    return;
  }
  previewLoading.value = true;
  drawerApi.setState({ confirmLoading: true });
  try {
    const previews = await devCrudPreviewApi(formData.value);
    previewModalApi
      .setData({
        previews,
        schema: formData.value,
      })
      .open();
  } catch (error: any) {
    message.error(error?.message || '代码生成预览失败');
  } finally {
    previewLoading.value = false;
    drawerApi.setState({ confirmLoading: false });
  }
}

// 仅保存配置到数据库
async function handleSaveConfig() {
  if (!validateBeforeAction(formData.value)) {
    return;
  }

  saveLoading.value = true;
  drawerApi.lock();
  try {
    const res = await devCrudSaveApi(formData.value);
    if (res?.id) {
      formData.value.id = res.id;
    }
    message.success(
      `模块 [${formData.value.basicConfig.moduleName}] 配置已保存到数据库！`,
    );
    emit('success');
  } catch (error: any) {
    message.error(error?.message || '保存配置失败');
  } finally {
    saveLoading.value = false;
    drawerApi.unlock();
  }
}

// 直接生成并写入本地磁盘
async function handleGenerateWrite() {
  if (!validateBeforeAction(formData.value)) {
    return;
  }

  generateLoading.value = true;
  drawerApi.lock();
  try {
    const res = await devCrudGenerateApi(formData.value);
    if (res?.id) {
      formData.value.id = res.id;
    }
    const menuTip =
      res?.menuCount && res.menuCount > 0
        ? ` 并自动生成 ${res.menuCount} 条菜单/权限！`
        : '';
    message.success(
      `模块 [${formData.value.basicConfig.moduleName}] 代码已直接写入本地项目！${menuTip}`,
    );
    emit('success');
    drawerApi.close();
  } catch (error: any) {
    message.error(error?.message || '代码生成直写失败');
  } finally {
    generateLoading.value = false;
    drawerApi.unlock();
  }
}

function handlePreviewSuccess() {
  emit('success');
  drawerApi.close();
}
</script>

<template>
  <Drawer
    class="w-[90vw] max-w-[1500px]"
    footer-class="gap-2"
    title="代码生成配置"
  >
    <template #center-footer>
      <NButton
        type="info"
        secondary
        :loading="saveLoading"
        :disabled="previewLoading || generateLoading"
        @click="handleSaveConfig"
      >
        保存配置
      </NButton>
    </template>

    <template #append-footer>
      <NPopconfirm @positive-click="handleGenerateWrite">
        <template #trigger>
          <NButton
            type="error"
            secondary
            :loading="generateLoading"
            :disabled="previewLoading || saveLoading"
          >
            直接写入磁盘
          </NButton>
        </template>
        确定跳过预览，直接将生成的全部代码写入本地物理项目吗？
      </NPopconfirm>
    </template>

    <PreviewModal @success="handlePreviewSuccess" />

    <NTabs type="line" animated>
      <NTabPane name="基本信息" display-directive="show:lazy">
        <BasicForm
          v-model="formData.basicConfig"
          @table-loaded="onTableLoaded"
        />
      </NTabPane>
      <NTabPane name="字段信息" display-directive="show:lazy">
        <FieldForm
          v-model="formData.fieldsConfig"
          :table-name="formData.basicConfig.tableName"
        />
      </NTabPane>
      <NTabPane name="路由信息" display-directive="show:lazy">
        <RouteForm v-model="formData.routeConfig" />
      </NTabPane>
      <NTabPane name="页面设置" display-directive="show:lazy">
        <PageForm
          v-model="formData.pageConfig"
          :fields="formData.fieldsConfig"
        />
      </NTabPane>
    </NTabs>
  </Drawer>
</template>

<style scoped></style>

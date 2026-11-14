<script setup lang="ts">
import type { Schema } from '#/crud/types';

import { ref } from 'vue';

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
    await devCrudSaveApi(formData.value);
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

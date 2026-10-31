<script setup lang="ts">
import type { Schema } from '#/crud/types';

import { ref } from 'vue';

import { useVbenDrawer, useVbenModal } from '@vben/common-ui';

import { NTabPane, NTabs } from 'naive-ui';

import { message } from '#/adapter/naive';
import { devCrudPreviewApi } from '#/api/dev/crud';
import { createDefaultSchema } from '#/crud/default';
import { isEmpty } from '#/utils/tools';

import BasicForm from './components/basic.vue';
import FieldForm from './components/field.vue';
import PageForm from './components/page.vue';
import RouteForm from './components/route.vue';
import PreviewModalComponent from './preview-modal.vue';

const formData = ref<Schema>(createDefaultSchema());

const [PreviewModal, previewModalApi] = useVbenModal({
  connectedComponent: PreviewModalComponent,
  destroyOnClose: true,
});

const [Drawer, drawerApi] = useVbenDrawer<Schema>({
  confirmText: '生成并预览代码',
  onConfirm: formConfirm,
  onOpenChange: (isOpen) => {
    const data = drawerApi.getData();
    if (isOpen && !isEmpty(data)) {
      formData.value = data;
    }
  },
});

function onTableLoaded(loadedSchema: Schema) {
  formData.value = loadedSchema;
}

async function formConfirm() {
  if (!formData.value.basicConfig.moduleName.trim()) {
    message.warning('请输入模块名称 (moduleName)');
    return;
  }

  drawerApi.lock();
  try {
    const previews = await devCrudPreviewApi(formData.value);
    previewModalApi.setData(previews).open();
  } catch (error: any) {
    message.error(error?.message || '代码生成预览失败');
  } finally {
    drawerApi.unlock();
  }
}
</script>

<template>
  <Drawer class="w-[90vw] max-w-[1500px]" title="代码生成配置">
    <PreviewModal />
    <NTabs type="line" animated>
      <NTabPane name="基本信息" display-directive="show:lazy">
        <BasicForm
          v-model="formData.basicConfig"
          @table-loaded="onTableLoaded"
        />
      </NTabPane>
      <NTabPane name="字段信息" display-directive="show:lazy">
        <FieldForm v-model="formData.fieldsConfig" />
      </NTabPane>
      <NTabPane name="路由信息" display-directive="show:lazy">
        <RouteForm v-model="formData.routeConfig" />
      </NTabPane>
      <NTabPane name="页面设置" display-directive="show:lazy">
        <PageForm v-model="formData.pageConfig" />
      </NTabPane>
    </NTabs>
  </Drawer>
</template>

<style scoped></style>

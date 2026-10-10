<script setup lang="ts">
import type { Schema } from '#/crud/types';

import { ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { NTabPane, NTabs } from 'naive-ui';

import { message } from '#/adapter/naive';
import { createDefaultSchema } from '#/crud/default';
import { isEmpty } from '#/utils/tools';

import BasicForm from './components/basic.vue';
import FieldForm from './components/filed.vue';
import PageForm from './components/page.vue';
import RouteForm from './components/route.vue';
const formData = ref<Schema>(createDefaultSchema());
const [Drawer, drawerApi] = useVbenDrawer<Schema>({
  onConfirm: formConfirm,
  onOpenChange: (isOpen) => {
    const data = drawerApi.getData();
    if (isOpen && data?.basicConfig?.modelName === '标题1') {
      data.basicConfig.modelName = '不是标题1';
    }
    if (!isEmpty(data)) {
      formData.value = data;
    }
  },
});

function formConfirm() {
  message.success('添加');
}
</script>

<template>
  <Drawer class="w-[90vw] max-w-[1500px]" title="代码生成">
    <NTabs>
      <NTabPane name="基本信息" display-directive="show:lazy">
        <BasicForm v-model="formData.basicConfig" />
      </NTabPane>
      <NTabPane name="字段信息" display-directive="show:lazy">
        <FieldForm />
      </NTabPane>
      <NTabPane name="路由信息" display-directive="show:lazy">
        <RouteForm />
      </NTabPane>
      <NTabPane name="页面设置" display-directive="show:lazy">
        <PageForm />
      </NTabPane>
    </NTabs>
  </Drawer>
</template>

<style scoped></style>

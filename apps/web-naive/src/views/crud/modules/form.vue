<script setup lang="ts">
import type { DevCrudApi } from '#/api/dev/crud';

import { ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { message } from '#/adapter/naive';
const formData = ref<DevCrudApi.DevCrud>();
const [Drawer, drawerApi] = useVbenDrawer<DevCrudApi.DevCrud>({
  onConfirm: formConfirm,
  onOpenChange: (isOpen) => {
    const data = drawerApi.getData();
    if (isOpen && data?.name === '标题1') {
      data.name = '不是标题1';
    }
    formData.value = data;
  },
});

function formConfirm() {
  message.success('添加');
}
</script>

<template>
  <Drawer>
    <h1>抽屉</h1>
  </Drawer>
</template>

<style scoped></style>

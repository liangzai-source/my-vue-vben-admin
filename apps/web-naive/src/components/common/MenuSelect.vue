<script setup lang="ts">
import { onMounted, ref } from 'vue';

import { $t } from '@vben/locales';

import { NTreeSelect } from 'naive-ui';

import { allMenuApi, SystemMenuApi } from '#/api/system/menu';

const loading = ref(false);
const selectList = ref<SystemMenuApi.SystemMenuSelect[]>([]);
const modelValue = defineModel<number | string>('value', {
  default: '',
});

/**
 * 处理选项
 * @param data
 */
function handleSelectMenu(
  data: SystemMenuApi.SystemMenu[],
): SystemMenuApi.SystemMenuSelect[] {
  return data.map(
    (item: SystemMenuApi.SystemMenu): SystemMenuApi.SystemMenuSelect => {
      const title = item?.meta?.title || item.name;
      const resultItem: SystemMenuApi.SystemMenuSelect = {
        label: $t(title),
        value: item.id,
      };
      if (item?.children) {
        resultItem.children = handleSelectMenu(item.children);
      }
      return resultItem;
    },
  );
}

/**
 * 获取数据
 */
async function fetchData() {
  loading.value = true;
  const data = await allMenuApi();
  selectList.value = handleSelectMenu(data);
  loading.value = false;
}

/**
 * 设置值
 * @param value
 */
function valueChange(value: number | string): void {
  modelValue.value = value;
}

onMounted(async () => {
  await fetchData();
});
</script>

<template>
  <NTreeSelect
    :options="selectList"
    children-field="children"
    key-field="value"
    :loading="loading"
    :default-expand-all="true"
    :filterable="true"
    :value="modelValue"
    clearable
    :on-update:value="valueChange"
  />
</template>

<style scoped></style>

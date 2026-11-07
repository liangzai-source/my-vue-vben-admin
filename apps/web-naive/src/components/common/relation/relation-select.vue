<script setup lang="ts">
import type { SelectOption } from 'naive-ui';

import { onMounted, ref, watch } from 'vue';

import { useDebounceFn } from '@vueuse/core';
import { NSelect, NSpin } from 'naive-ui';

import { devCrudRelationOptionsApi } from '#/api/dev/crud';

interface Props {
  clearable?: boolean;
  disabled?: boolean;
  labelField?: string;
  placeholder?: string;
  targetTable: string;
  value?: any;
  valueField?: string;
}

const props = withDefaults(defineProps<Props>(), {
  clearable: true,
  disabled: false,
  labelField: 'name',
  placeholder: '请选择',
  value: undefined,
  valueField: 'id',
});

const emit = defineEmits<{
  (e: 'change' | 'update:value', val: any): void;
}>();

const loading = ref(false);
const options = ref<SelectOption[]>([]);
const isLargeData = ref(false);
const totalCount = ref(0);
const lastKeyword = ref('');

async function loadOptions(keyword = '') {
  if (!props.targetTable) return;
  loading.value = true;
  lastKeyword.value = keyword;
  try {
    const res = await devCrudRelationOptionsApi({
      tableName: props.targetTable,
      valueField: props.valueField,
      labelField: props.labelField,
      keyword,
      currentValue: props.value,
    });
    totalCount.value = res.total;
    isLargeData.value = res.isLarge;

    // 格式化为 Naive UI SelectOption
    const formatted = (res.options || []).map((item) => ({
      label: String(item.label ?? item.value),
      value: item.value,
    }));

    options.value = formatted;
  } catch (error) {
    console.error('加载关联数据失败:', error);
  } finally {
    loading.value = false;
  }
}

const debouncedSearch = useDebounceFn((query: string) => {
  loadOptions(query);
}, 300);

function handleSearch(query: string) {
  if (isLargeData.value) {
    debouncedSearch(query);
  }
}

function handleUpdateValue(val: any) {
  emit('update:value', val);
  emit('change', val);
}

watch(
  () => props.targetTable,
  (newTable) => {
    if (newTable) {
      loadOptions();
    }
  },
);

watch(
  () => props.value,
  (newVal) => {
    if (
      newVal !== undefined &&
      newVal !== null &&
      !options.value.some((o) => o.value === newVal)
    ) {
      loadOptions();
    }
  },
);

onMounted(() => {
  loadOptions();
});
</script>

<template>
  <NSelect
    :value="value"
    :options="options"
    :loading="loading"
    :disabled="disabled"
    :clearable="clearable"
    :placeholder="placeholder"
    :filterable="true"
    :remote="isLargeData"
    class="w-full"
    @search="handleSearch"
    @update:value="handleUpdateValue"
  >
    <template #empty>
      <div
        class="flex flex-col items-center justify-center py-3 text-xs text-muted-foreground"
      >
        <template v-if="loading">
          <NSpin size="small" />
        </template>
        <template v-else-if="isLargeData && !lastKeyword">
          <span>🔍 数据量较多（共 {{ totalCount }} 项），请输入关键词检索</span>
        </template>
        <template v-else>
          <span>暂无匹配数据</span>
        </template>
      </div>
    </template>
  </NSelect>
</template>

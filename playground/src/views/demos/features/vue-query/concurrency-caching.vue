<script lang="ts" setup>
import type { Recordable } from '@vben/types';

import { useQuery, useQueryClient } from '@tanstack/vue-query';

import { useVbenForm } from '#/adapter/form';
import { getMenuList } from '#/api';

const queryKey = ['demo', 'api', 'options'];
const count = 4;

const queryClient = useQueryClient();

const { dataUpdatedAt } = useQuery({
  // ✅ 移除了 experimental_prefetchInRender（v5 已删除，useQuery 默认就会在 setup 时发起请求）
  queryFn: getMenuList,
  queryKey,
  refetchOnMount: 'always',
  staleTime: 1000 * 60 * 5,
});

// ✅ 用 ensureQueryData 替代原来的 promise.value
// 多个 ApiSelect 同时调用时，会复用同一个请求 Promise（并发去重）
async function fetchOptions() {
  return queryClient.ensureQueryData({
    queryKey,
    queryFn: getMenuList,
  });
}

const schema = [];

for (let i = 0; i < count; i++) {
  schema.push({
    component: 'ApiSelect',
    componentProps: {
      api: fetchOptions,
      class: 'w-full',
      filterOption: (input: string, option: Recordable<any>) => {
        return option.label.toLowerCase().includes(input.toLowerCase());
      },
      labelField: 'name',
      showSearch: true,
      valueField: 'id',
    },
    fieldName: `field${i}`,
    label: `Select ${i}`,
  });
}

const [Form] = useVbenForm({
  schema,
  showDefaultActions: false,
});
</script>

<template>
  <div>
    <div class="mb-2 flex gap-2">
      <div>以下{{ count }}个组件共用一个数据源。</div>
      <div>缓存更新时间：{{ new Date(dataUpdatedAt).toLocaleString() }}</div>
    </div>
    <Form />
  </div>
</template>

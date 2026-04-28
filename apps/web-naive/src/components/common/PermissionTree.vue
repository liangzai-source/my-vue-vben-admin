<script lang="ts" setup>
import type { TreeOption } from 'naive-ui/lib';

import { ref, watch } from 'vue';

import { NSwitch, NTree } from 'naive-ui';

type propsType = {
  control?: boolean;
  defaultCheckedKeys: number[] | string[];
  line?: boolean;
  treeOptions: TreeOption[];
};
const props = withDefaults(defineProps<propsType>(), {
  control: true,
  line: false,
});
const emits = defineEmits<{
  (e: 'change', value: number[]): void;
  (e: 'loading', value: boolean): void;
}>();
const expandAll = ref<boolean>(true);
// 绑定给 Tree 的 checkedKeys（支持异步更新）
const checkedKeys = ref<(number | string)[]>([]);

// 父组件传的选中值变化时同步
watch(
  () => props.defaultCheckedKeys,
  (val) => {
    checkedKeys.value = val;
  },
  { immediate: true },
);
function updateCheckedKeys(keys: number[]) {
  emits('change', keys);
}
</script>

<template>
  <div>
    <NSwitch v-model:value="expandAll">
      <template #checked> 全部收起</template>
      <template #unchecked> 全部展开</template>
    </NSwitch>
  </div>
  <NTree
    v-model:checked-keys="checkedKeys"
    :data="treeOptions"
    :default-expand-all="expandAll"
    :selectable="false"
    :show-line="line"
    block-line
    cascade
    checkable
    @update:checked-keys="updateCheckedKeys"
  />
</template>

<style scoped></style>

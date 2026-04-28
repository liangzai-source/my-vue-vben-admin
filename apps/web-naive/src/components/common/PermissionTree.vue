<script lang="ts" setup>
import type { TreeOption } from 'naive-ui/lib';

import { h, onMounted, ref } from 'vue';

import { $t } from '@vben/locales';

import { VbenIcon } from '@vben-core/shadcn-ui';

import { NSwitch, NTree } from 'naive-ui';

import { allPermissionApi, SystemMenuApi } from '#/api/system/menu';

type propsType = {
  control?: boolean;
  line?: boolean;
};
type TreeOptions = TreeOption[];
withDefaults(defineProps<propsType>(), {
  control: true,
  line: false,
});
const emits = defineEmits<{
  (e: 'change', value: number[]): void;
  (e: 'loading', value: boolean): void;
}>();
const expandAll = ref<boolean>(false);
const treeData = ref<TreeOptions>([]);
const defaultCheckedKeys = defineModel<number[]>({ default: [] });

onMounted(() => {
  fetchPermissions();
});

function updateCheckedKeys(keys: number[]) {
  emits('change', keys);
}

async function fetchPermissions() {
  emits('loading', true);
  const res = await allPermissionApi();
  emits('loading', false);
  treeData.value = convertMenuToTree(res);
}

function convertMenuToTree(menuList: SystemMenuApi.SystemMenu[]): TreeOptions {
  return menuList.map((menu) => {
    const routeMeta = menu.meta;

    // 构建当前节点的TreeOptions
    const treeNode: TreeOption = {
      key: menu.id,
      label: $t(routeMeta.title || ''),
      prefix: () => h(VbenIcon, { icon: routeMeta.icon }),
    };

    // 递归处理子菜单（如果有children且是数组）
    if (Array.isArray(menu.children) && menu.children.length > 0) {
      treeNode.children = convertMenuToTree(menu.children);
    }

    return treeNode;
  });
}
</script>

<template>
  <div>
    <NSwitch v-model:value="expandAll">
      <template #checked> 全部收起 </template>
      <template #unchecked> 全部展开 </template>
    </NSwitch>
  </div>
  <NTree
    :data="treeData"
    :default-checked-keys="defaultCheckedKeys"
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

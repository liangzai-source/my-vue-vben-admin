<script lang="ts" setup>
import type { TreeOption } from 'naive-ui/lib';

import type { SystemUserApi } from '#/api/system/user';

import { h, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { VbenIcon } from '@vben-core/shadcn-ui';

import { message } from '#/adapter/naive';
import { allPermissionApi, SystemMenuApi } from '#/api/system/menu';
import {
  systemUserPermissionsApi,
  systemUserPermissionsIdListApi,
} from '#/api/system/user';
import PermissionTree from '#/components/common/PermissionTree.vue';
import { isEmpty } from '#/utils/tools';

const loading = ref(false);
const formData = ref<SystemUserApi.SystemUserPermissions>({
  user_id: 0,
  menu_ids: [],
});
const treeOptions = ref<TreeOption[]>([]);
const hasPermissions = ref<number[] | string[]>([]);
const [Drawer, drawerApi] = useVbenDrawer<SystemUserApi.SystemUser>({
  onConfirm: formConfirm,
  onOpenChange: async (isOpen) => {
    const data = drawerApi.getData();
    if (isOpen && !isEmpty(data)) {
      formData.value.user_id = data.id;
    }
    if (isOpen) {
      loading.value = true;
      const [menuList, checkedIds] = await Promise.all([
        allPermissionApi(),
        systemUserPermissionsIdListApi(data?.id || 0),
      ]);
      loading.value = false;
      treeOptions.value = convertMenuToTree(menuList);
      hasPermissions.value = checkedIds;
    }
  },
});

function convertMenuToTree(menuList: SystemMenuApi.SystemMenu[]): TreeOption[] {
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

function formConfirm() {
  loading.value = true;
  systemUserPermissionsApi(formData.value)
    .then(() => {
      message.success(
        $t('common.successMessage', [$t('system.user.setPermission')]),
      );
      drawerApi.close();
    })
    .finally(() => {
      loading.value = false;
    });
}

function handleLoading(e: boolean) {
  loading.value = e;
}

function handleChange(e: number[]) {
  formData.value.menu_ids = e;
}
</script>

<template>
  <Drawer
    :loading="loading"
    :title="$t('system.user.setPermission')"
    class="w-full max-w-[800px]"
  >
    <PermissionTree
      :default-checked-keys="hasPermissions"
      :tree-options="treeOptions"
      @change="handleChange"
      @loading="handleLoading"
    />
  </Drawer>
</template>

<style scoped></style>

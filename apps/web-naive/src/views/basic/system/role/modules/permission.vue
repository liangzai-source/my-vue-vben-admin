<script setup lang="ts">
import type { SystemRoleApi } from '#/api/system/role';

import { ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { $t } from '@vben/locales';

import PermissionTree from '#/components/common/PermissionTree.vue';
import { isEmpty } from '#/utils/tools';

const loading = ref(false);
const formData = ref<SystemRoleApi.SystemRolePermissions>({
  role_id: 0,
  menu_ids: [],
});
const [Drawer, drawerApi] = useVbenDrawer({
  onConfirm: formConfirm,
  onOpenChange: (isOpen) => {
    const data = drawerApi.getData<SystemRoleApi.SystemRole>();
    if (isOpen && !isEmpty(data.id)) {
      formData.value.role_id = data.id;
    }
  },
});

function formConfirm() {
  loading.value = true;
  setTimeout(() => {
    loading.value = false;
    drawerApi.close();
    console.warn(formData.value);
  }, 1000);
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
    :title="$t('system.role.setPermission')"
    :loading="loading"
    class="w-full max-w-[800px]"
  >
    <PermissionTree @loading="handleLoading" @change="handleChange" />
  </Drawer>
</template>

<style scoped></style>

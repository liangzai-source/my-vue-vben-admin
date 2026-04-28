<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { message } from '#/adapter/naive';
import {
  type SystemRoleApi,
  systemRolePermissionsApi,
} from '#/api/system/role';
import PermissionTree from '#/components/common/PermissionTree.vue';
import { isEmpty } from '#/utils/tools';

const loading = ref(false);
const formData = ref<SystemRoleApi.SystemRolePermissions>({
  role_id: 0,
  menu_ids: [],
});
const hasPermissions = ref<number[]>();
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
  systemRolePermissionsApi(formData.value)
    .then(() => {
      message.success(
        $t('common.successMessage', [$t('system.role.setPermission')]),
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
    :title="$t('system.role.setPermission')"
    class="w-full max-w-[800px]"
  >
    <PermissionTree
      v-model="hasPermissions"
      @change="handleChange"
      @loading="handleLoading"
    />
  </Drawer>
</template>

<style scoped></style>

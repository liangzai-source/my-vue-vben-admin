<script setup lang="ts">
import type { FormInst, FormRules, FormValidationError } from 'naive-ui';

import type { SystemRoleApi } from '#/api/system/role';

import { computed, ref, useTemplateRef } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { NForm, NFormItem, NInput } from 'naive-ui';

import { systemRoleCreateApi, systemRoleUpdateApi } from '#/api/system/role';
import StatusRadios from '#/components/common/StatusRadios.vue';
import { handleFormError, isEmpty, showFormMessage } from '#/utils/tools';

const emits = defineEmits<{
  (e: 'success'): void;
}>();
const defaultFormData: SystemRoleApi.SystemRole = {
  id: 0,
  remark: '',
  status: 1,
  name: '',
};
const loading = ref<boolean>(false);
const formRef = useTemplateRef<FormInst>('form');
const formData = ref<SystemRoleApi.SystemRole>(defaultFormData);
const rules: FormRules = {
  name: [
    {
      required: true,
      message: $t('common.required', [$t('system.role.name')]),
    },
  ],
};
const [Drawer, drawerApi] = useVbenDrawer({
  onConfirm: formConfirm,
  onOpenChange: (isOpen) => {
    const data = drawerApi.getData<SystemRoleApi.SystemRole>();
    if (isOpen && !isEmpty(data)) {
      formData.value = data;
    }
  },
});

function formConfirm() {
  formRef.value
    ?.validate()
    .then(async () => {
      loading.value = true;
      await (formData.value?.id
        ? systemRoleUpdateApi(formData.value.id, formData.value)
        : systemRoleCreateApi(formData.value));
      await drawerApi.close();
      emits('success');
      loading.value = false;
      showFormMessage(formData.value?.id);
    })
    .catch((error: Array<FormValidationError>) => {
      loading.value = false;
      handleFormError(error);
    });
}

const getDrawerTitle = computed(() =>
  formData.value?.id
    ? $t('common.update', [$t('system.role.createName')])
    : $t('common.create', [$t('system.role.createName')]),
);
</script>

<template>
  <Drawer
    :title="getDrawerTitle"
    :loading="loading"
    class="w-full max-w-[800px]"
  >
    <NForm
      label-placement="left"
      label-width="100px"
      ref="form"
      :model="formData"
      :rules="rules"
    >
      <NFormItem :label="$t('system.role.name')" path="name">
        <NInput autocomplete="off" clearable v-model:value="formData.name" />
      </NFormItem>
      <NFormItem :label="$t('common.status')">
        <StatusRadios v-model:status="formData.status" />
      </NFormItem>
      <NFormItem :label="$t('system.role.remark')" path="remark">
        <NInput
          autocomplete="off"
          type="textarea"
          clearable
          v-model:value="formData.remark"
        />
      </NFormItem>
    </NForm>
  </Drawer>
</template>

<style scoped></style>

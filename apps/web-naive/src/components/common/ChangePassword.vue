<script setup lang="ts">
import type { FormInst, FormValidationError } from 'naive-ui';

import type { SystemUserApi } from '#/api/system/user';

import { ref, useTemplateRef } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { NForm, NFormItem, NInput } from 'naive-ui';

import { systemUserChangePasswordApi } from '#/api/system/user';
import { handleFormError } from '#/utils/tools';

const emit = defineEmits<{
  (e: 'success'): void;
}>();
const loading = ref<boolean>(false);
const formRef = useTemplateRef<FormInst>('form');
const formData = ref<SystemUserApi.PasswordChange>({
  oldPassword: '',
  newPassword: '',
});
const rules = {
  oldPassword: [
    {
      required: true,
      message: $t('ui.formRules.required', [$t('page.auth.oldPassword')]),
      trigger: 'blur',
    },
  ],
  newPassword: [
    {
      required: true,
      message: $t('ui.formRules.required', [$t('page.auth.newPassword')]),
      trigger: 'blur',
    },
  ],
};

async function formConfirm() {
  formRef.value
    ?.validate()
    .then(async () => {
      loading.value = true;
      await systemUserChangePasswordApi(formData.value);
      await modalApi.close();
      emit('success');
    })
    .catch((error: Array<FormValidationError>) => {
      handleFormError(error);
    })
    .finally(() => {
      loading.value = false;
    });
}

const [Modal, modalApi] = useVbenModal({
  onConfirm: formConfirm,
});
</script>
<template>
  <Modal :title="$t('page.auth.changePassword')" :loading="loading">
    <NForm ref="form" :model="formData" :rules="rules" label-width="120px">
      <NFormItem :label="$t('page.auth.oldPassword')" path="oldPassword">
        <NInput
          type="password"
          v-model:value="formData.oldPassword"
          :placeholder="$t('common.placeholder', [$t('page.auth.oldPassword')])"
        />
      </NFormItem>
      <NFormItem :label="$t('page.auth.newPassword')" path="newPassword">
        <NInput
          type="password"
          v-model:value="formData.newPassword"
          :placeholder="$t('common.placeholder', [$t('page.auth.newPassword')])"
        />
      </NFormItem>
    </NForm>
  </Modal>
</template>

<style scoped></style>

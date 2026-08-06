<script setup lang="ts">
import type { FormInst, FormRules, FormValidationError } from 'naive-ui';

import type { SystemUserApi } from '#/api/system/user';

import { computed, ref, useTemplateRef } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { NForm, NFormItem, NInput } from 'naive-ui';

import { systemUserCreateApi, systemUserUpdateApi } from '#/api/system/user';
import StatusRadios from '#/components/common/StatusRadios.vue';
import { handleFormError, isEmpty, showFormMessage } from '#/utils/tools';

const emit = defineEmits<{
  (e: 'success'): void;
}>();
const formRef = useTemplateRef<FormInst>('form');
const defaultFormData: SystemUserApi.SystemUserSave = {
  creator_id: 0,
  id: 0,
  isAdministrator: 0,
  account: '',
  password: '',
  nickname: '',
  status: 1,
};
const [Modal, modalApi] = useVbenModal({
  onConfirm: formConfirm,
  onOpenChange: (isOpen) => {
    const data = modalApi.getData<SystemUserApi.SystemUserSave>();
    if (isOpen && !isEmpty(data)) {
      if (isEmpty(data.status)) {
        data.status = 1;
      }
      formData.value = data;
    }
  },
});
const formData = ref<SystemUserApi.SystemUserSave>(defaultFormData);
const loading = ref<boolean>(false);
const baseRules = {
  account: [
    {
      trigger: 'blur',
      required: true,
      message: $t('ui.formRules.required', [$t('system.user.account')]),
    },
  ],
};
const formRules = computed<FormRules>(() => {
  return {
    ...baseRules,
    password: [
      {
        trigger: 'blur',
        required: isEmpty(formData.value?.id) || formData.value?.id === 0,
        message: $t('ui.formRules.required', [$t('system.user.password')]),
      },
    ],
  };
});
const getModalTitle = computed(() =>
  formData.value?.id
    ? $t('common.update', [$t('system.user.name')])
    : $t('common.create', [$t('system.user.name')]),
);

function formConfirm() {
  formRef.value
    ?.validate()
    .then(async () => {
      loading.value = true;
      await (formData.value?.id
        ? systemUserUpdateApi(formData.value.id, formData.value)
        : systemUserCreateApi(formData.value));
      await modalApi.close();
      emit('success');
      loading.value = false;
      showFormMessage(formData.value?.id);
    })
    .catch((error: Array<FormValidationError>) => {
      loading.value = false;
      handleFormError(error);
    });
}
</script>

<template>
  <Modal :title="getModalTitle" :loading="loading" class="w-full max-w-[800px]">
    <NForm
      label-placement="left"
      label-width="100px"
      ref="form"
      :model="formData"
      :rules="formRules"
    >
      <NFormItem :label="$t('system.user.account')" path="account">
        <NInput autocomplete="off" clearable v-model:value="formData.account" />
      </NFormItem>
      <NFormItem :label="$t('system.user.password')" path="password">
        <NInput
          type="password"
          autocomplete="off"
          clearable
          v-model:value="formData.password"
        />
      </NFormItem>
      <NFormItem :label="$t('system.user.nickname')">
        <NInput v-model:value="formData.nickname" />
      </NFormItem>
      <NFormItem :label="$t('common.status')">
        <StatusRadios v-model:status="formData.status" />
      </NFormItem>
    </NForm>
  </Modal>
</template>

<style scoped></style>

<script setup lang="ts">
import type { FormInst, FormRules, FormValidationError } from 'naive-ui';

import type { SystemConfigCategoryApi } from '#/api/system/config-category';

import { ref, useTemplateRef } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';

import {
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NRadio,
  NRadioGroup,
  NSpace,
} from 'naive-ui';

import {
  systemConfigCategoryCreateApi,
  systemConfigCategoryUpdateApi,
} from '#/api/system/config-category';
import { handleFormError, isEmpty, showFormMessage } from '#/utils/tools';

const emits = defineEmits<{
  (e: 'success'): void;
}>();

const defaultFormData: Partial<SystemConfigCategoryApi.SystemConfigCategory> = {
  id: 0,
  name: '',
  code: '',
  sort: 0,
  isSystem: 0,
  remark: '',
};

const loading = ref<boolean>(false);
const formRef = useTemplateRef<FormInst>('form');
const formData = ref<Partial<SystemConfigCategoryApi.SystemConfigCategory>>({
  ...defaultFormData,
});

const rules: FormRules = {
  name: [
    {
      required: true,
      message: $t('common.required', [$t('system.configCategory.name')]),
      trigger: ['blur', 'input'],
    },
  ],
  code: [
    {
      required: true,
      message: $t('common.required', [$t('system.configCategory.code')]),
      trigger: ['blur', 'input'],
    },
  ],
};

const [Modal, modalApi] = useVbenModal({
  onConfirm: formConfirm,
  onOpenChange: (isOpen) => {
    const data =
      modalApi.getData() as SystemConfigCategoryApi.SystemConfigCategory;
    if (isOpen) {
      formData.value = isEmpty(data) ? { ...defaultFormData } : { ...data };
    }
  },
});

function formConfirm() {
  formRef.value
    ?.validate()
    .then(async () => {
      loading.value = true;
      try {
        await (formData.value?.id
          ? systemConfigCategoryUpdateApi(formData.value.id, formData.value)
          : systemConfigCategoryCreateApi(formData.value));
        await modalApi.close();
        emits('success');
        showFormMessage(formData.value?.id);
      } catch (error: any) {
        handleFormError(error);
      } finally {
        loading.value = false;
      }
    })
    .catch((error: Array<FormValidationError>) => {
      console.warn('Form validation failed:', error);
    });
}
</script>

<template>
  <Modal
    :title="
      formData.id
        ? `${$t('common.edit')} ${$t('system.configCategory.title')}`
        : `${$t('common.create')} ${$t('system.configCategory.title')}`
    "
    class="w-[540px]"
  >
    <NForm
      ref="form"
      :model="formData"
      :rules="rules"
      label-placement="left"
      label-width="100px"
      require-mark-placement="left"
    >
      <NFormItem :label="$t('system.configCategory.name')" path="name">
        <NInput
          v-model:value="formData.name"
          placeholder="如：基础设置、上传配置"
        />
      </NFormItem>

      <NFormItem :label="$t('system.configCategory.code')" path="code">
        <NInput
          v-model:value="formData.code"
          :disabled="formData.isSystem === 1"
          placeholder="如：basic, upload, sms (唯一英文标识)"
        />
      </NFormItem>

      <NFormItem :label="$t('system.configCategory.sort')" path="sort">
        <NInputNumber v-model:value="formData.sort" :min="0" class="w-full" />
      </NFormItem>

      <NFormItem :label="$t('system.configCategory.isSystem')" path="isSystem">
        <NRadioGroup
          v-model:value="formData.isSystem"
          :disabled="formData.id ? formData.isSystem === 1 : false"
        >
          <NSpace>
            <NRadio :value="0">否 (用户自定义，可删除)</NRadio>
            <NRadio :value="1">是 (系统内置，禁止删除)</NRadio>
          </NSpace>
        </NRadioGroup>
      </NFormItem>

      <NFormItem :label="$t('system.configCategory.remark')" path="remark">
        <NInput
          v-model:value="formData.remark"
          type="textarea"
          :rows="3"
          placeholder="请输入分类说明备注"
        />
      </NFormItem>
    </NForm>
  </Modal>
</template>

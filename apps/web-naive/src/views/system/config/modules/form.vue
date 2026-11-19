<script setup lang="ts">
import type { FormInst, FormRules, FormValidationError } from 'naive-ui';

import type { SystemConfigApi } from '#/api/system/config';

import { onMounted, ref, useTemplateRef } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';

import {
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NRadio,
  NRadioGroup,
  NSelect,
  NSpace,
} from 'naive-ui';

import {
  systemConfigCreateApi,
  systemConfigUpdateApi,
} from '#/api/system/config';
import { systemConfigCategoryAllApi } from '#/api/system/config-category';
import { handleFormError, isEmpty, showFormMessage } from '#/utils/tools';

const emits = defineEmits<{
  (e: 'success'): void;
}>();

const componentTypeOptions = [
  { label: '单行文本 (input)', value: 'input' },
  { label: '多行文本 (textarea)', value: 'textarea' },
  { label: '数字输入 (number)', value: 'number' },
  { label: '开关 (switch)', value: 'switch' },
  { label: '单选按钮 (radio)', value: 'radio' },
  { label: '下拉选择 (select)', value: 'select' },
  { label: '单图上传 (upload_image)', value: 'upload_image' },
  { label: '文件附件 (upload_file)', value: 'upload_file' },
  { label: '日期时间 (date)', value: 'date' },
  { label: '富文本编辑器 (editor)', value: 'editor' },
];

const categoryOptions = ref<{ label: string; value: number }[]>([]);

const defaultFormData: Partial<SystemConfigApi.SystemConfig> = {
  id: 0,
  categoryId: undefined,
  name: '',
  key: '',
  value: '',
  componentType: 'input',
  options: '',
  extra: '',
  sort: 0,
  isSystem: 0,
};

const loading = ref<boolean>(false);
const formRef = useTemplateRef<FormInst>('form');
const formData = ref<Partial<SystemConfigApi.SystemConfig>>({
  ...defaultFormData,
});

const rules: FormRules = {
  categoryId: [
    {
      required: true,
      type: 'number',
      message: $t('common.required', [$t('system.config.category')]),
      trigger: ['blur', 'change'],
    },
  ],
  name: [
    {
      required: true,
      message: $t('common.required', [$t('system.config.name')]),
      trigger: ['blur', 'input'],
    },
  ],
  key: [
    {
      required: true,
      message: $t('common.required', [$t('system.config.key')]),
      trigger: ['blur', 'input'],
    },
  ],
  componentType: [
    {
      required: true,
      message: $t('common.required', [$t('system.config.componentType')]),
      trigger: ['blur', 'change'],
    },
  ],
};

async function loadCategories() {
  try {
    const list = await systemConfigCategoryAllApi();
    categoryOptions.value = list.map((c) => ({
      label: c.name,
      value: c.id,
    }));
  } catch (error) {
    console.error('Failed to load categories', error);
  }
}

onMounted(() => {
  loadCategories();
});

const [Modal, modalApi] = useVbenModal({
  onConfirm: formConfirm,
  onOpenChange: async (isOpen) => {
    if (isOpen) {
      await loadCategories();
      const data = modalApi.getData() as SystemConfigApi.SystemConfig;
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
          ? systemConfigUpdateApi(formData.value.id, formData.value)
          : systemConfigCreateApi(formData.value));
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
        ? `${$t('common.edit')} ${$t('system.config.title')}`
        : `${$t('common.create')} ${$t('system.config.title')}`
    "
    class="w-[620px]"
  >
    <NForm
      ref="form"
      :model="formData"
      :rules="rules"
      label-placement="left"
      label-width="120px"
      require-mark-placement="left"
    >
      <NFormItem :label="$t('system.config.category')" path="categoryId">
        <NSelect
          v-model:value="formData.categoryId"
          :options="categoryOptions"
          placeholder="请选择配置所属分类"
        />
      </NFormItem>

      <NFormItem :label="$t('system.config.name')" path="name">
        <NInput
          v-model:value="formData.name"
          placeholder="如：网站名称、站点Logo"
        />
      </NFormItem>

      <NFormItem :label="$t('system.config.key')" path="key">
        <NInput
          v-model:value="formData.key"
          :disabled="formData.isSystem === 1"
          placeholder="如：site_name (英文字母/下划线唯一)"
        />
      </NFormItem>

      <NFormItem
        :label="$t('system.config.componentType')"
        path="componentType"
      >
        <NSelect
          v-model:value="formData.componentType"
          :options="componentTypeOptions"
        />
      </NFormItem>

      <!-- 下拉/单选专用候选项配置 -->
      <NFormItem
        v-if="
          formData.componentType === 'select' ||
          formData.componentType === 'radio'
        "
        :label="$t('system.config.options')"
        path="options"
      >
        <NInput
          v-model:value="formData.options"
          type="textarea"
          :rows="3"
          placeholder="JSON格式，例如：[{&quot;label&quot;:&quot;选项一&quot;,&quot;value&quot;:&quot;1&quot;},{&quot;label&quot;:&quot;选项二&quot;,&quot;value&quot;:&quot;2&quot;}]"
        />
      </NFormItem>

      <!-- 额外属性扩展配置 -->
      <NFormItem :label="$t('system.config.extra')" path="extra">
        <NInput
          v-model:value="formData.extra"
          type="textarea"
          :rows="2"
          placeholder="JSON格式，例如：{&quot;placeholder&quot;:&quot;请输入...&quot;,&quot;tip&quot;:&quot;辅助说明&quot;,&quot;unit&quot;:&quot;MB&quot;}"
        />
      </NFormItem>

      <NFormItem :label="$t('system.config.value')" path="value">
        <NInput
          v-model:value="formData.value"
          type="textarea"
          :rows="2"
          placeholder="配置默认初始值"
        />
      </NFormItem>

      <NFormItem :label="$t('system.config.sort')" path="sort">
        <NInputNumber v-model:value="formData.sort" :min="0" class="w-full" />
      </NFormItem>

      <NFormItem :label="$t('system.config.isSystem')" path="isSystem">
        <NRadioGroup
          v-model:value="formData.isSystem"
          :disabled="formData.id ? formData.isSystem === 1 : false"
        >
          <NSpace>
            <NRadio :value="0">否 (用户自定义，可删除)</NRadio>
            <NRadio :value="1">是 (系统内置，不可删除且Key只读)</NRadio>
          </NSpace>
        </NRadioGroup>
      </NFormItem>
    </NForm>
  </Modal>
</template>

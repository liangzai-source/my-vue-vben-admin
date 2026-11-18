<script setup lang="ts">
import type { FormInst, FormRules, FormValidationError } from 'naive-ui';

import type { RegionApi } from '#/api/region';

import { computed, ref, useTemplateRef } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';

import {
  NForm,
  NFormItemGi,
  NGrid,
  NInput,
  NInputNumber,
  NRadio,
  NRadioGroup,
  NSpace,
} from 'naive-ui';

import {
  regionCreateApi,
  regionParentIdOptionsApi,
  regionUpdateApi,
} from '#/api/region';
import { RelationSelect } from '#/components/common/relation';
import { handleFormError, isEmpty, showFormMessage } from '#/utils/tools';

const emits = defineEmits<{
  (e: 'success'): void;
}>();

const defaultFormData: RegionApi.RegionSaveReq & { id?: number } = {
  name: undefined,
  level: undefined,
  parentId: undefined,
  short: undefined,
  cityCode: undefined,
  zipCode: undefined,
  gcj02Lng: undefined,
  gcj02Lat: undefined,
  db09Lng: undefined,
  db09Lat: undefined,
  remark1: undefined,
  remark2: undefined,
  sort: undefined,
};

const formRef = useTemplateRef<FormInst>('form');
const formData = ref<RegionApi.RegionSaveReq & { id?: number }>({
  ...defaultFormData,
});
const loading = ref<boolean>(false);
const levelOptions = [
  {
    label: '国家',
    value: 0,
  },
  {
    label: '省份',
    value: 1,
  },
  {
    label: '地级市',
    value: 2,
  },
  {
    label: '县区',
    value: 3,
  },
];

const rules: FormRules = {
  name: [
    {
      required: true,
      message: $t('ui.formRules.required', [$t('region.name')]),
    },
  ],
  level: [
    {
      required: true,
      type: 'number',
      message: $t('ui.formRules.selectRequired', [$t('region.level')]),
    },
  ],
  parentId: [
    {
      required: true,
      type: 'number',
      message: $t('ui.formRules.selectRequired', [$t('region.parentId')]),
    },
  ],
  short: [
    {
      required: true,
      message: $t('ui.formRules.required', [$t('region.short')]),
    },
  ],
};

const getDialogTitle = computed(() =>
  formData.value?.id
    ? $t('common.update', [$t('region.menuTitle')])
    : $t('common.create', [$t('region.menuTitle')]),
);
const [Modal, modalApi] = useVbenModal<RegionApi.Region>({
  onConfirm: formConfirm,
  onOpenChange: (isOpen) => {
    const data = modalApi.getData();
    formData.value =
      isOpen && !isEmpty(data) ? { ...data } : { ...defaultFormData };
  },
});

function formConfirm() {
  formRef.value
    ?.validate()
    .then(async () => {
      loading.value = true;
      try {
        await (formData.value?.id
          ? regionUpdateApi(formData.value.id, formData.value)
          : regionCreateApi(formData.value));
        await modalApi.close();
        emits('success');
        showFormMessage(formData.value?.id);
      } finally {
        loading.value = false;
      }
    })
    .catch((error: Array<FormValidationError>) => {
      handleFormError(error);
    });
}
</script>

<template>
  <Modal class="w-[1100px] max-w-[90vw]" :title="getDialogTitle">
    <NForm
      ref="form"
      :model="formData"
      :rules="rules"
      label-placement="left"
      label-width="100"
    >
      <NGrid :cols="24" :x-gap="24">
        <NFormItemGi :span="24" :label="$t('region.name')" path="name">
          <NInput
            v-model:value="formData.name"
            :placeholder="$t('common.placeholder', [$t('region.name')])"
          />
        </NFormItemGi>
        <NFormItemGi :span="24" :label="$t('region.level')" path="level">
          <NRadioGroup v-model:value="formData.level">
            <NSpace>
              <NRadio
                v-for="item in levelOptions"
                :key="item.value"
                :value="item.value"
              >
                {{ item.label }}
              </NRadio>
            </NSpace>
          </NRadioGroup>
        </NFormItemGi>
        <NFormItemGi :span="24" :label="$t('region.parentId')" path="parentId">
          <RelationSelect
            v-model:value="formData.parentId"
            :api="regionParentIdOptionsApi"
            :placeholder="$t('common.placeholder', [$t('region.parentId')])"
          />
        </NFormItemGi>
        <NFormItemGi :span="24" :label="$t('region.short')" path="short">
          <NInput
            v-model:value="formData.short"
            :placeholder="$t('common.placeholder', [$t('region.short')])"
          />
        </NFormItemGi>
        <NFormItemGi :span="24" :label="$t('region.cityCode')" path="cityCode">
          <NInput
            v-model:value="formData.cityCode"
            :placeholder="$t('common.placeholder', [$t('region.cityCode')])"
          />
        </NFormItemGi>
        <NFormItemGi :span="24" :label="$t('region.zipCode')" path="zipCode">
          <NInput
            v-model:value="formData.zipCode"
            :placeholder="$t('common.placeholder', [$t('region.zipCode')])"
          />
        </NFormItemGi>
        <NFormItemGi :span="24" :label="$t('region.gcj02Lng')" path="gcj02Lng">
          <NInput
            v-model:value="formData.gcj02Lng"
            :placeholder="$t('common.placeholder', [$t('region.gcj02Lng')])"
          />
        </NFormItemGi>
        <NFormItemGi :span="24" :label="$t('region.gcj02Lat')" path="gcj02Lat">
          <NInput
            v-model:value="formData.gcj02Lat"
            :placeholder="$t('common.placeholder', [$t('region.gcj02Lat')])"
          />
        </NFormItemGi>
        <NFormItemGi :span="24" :label="$t('region.db09Lng')" path="db09Lng">
          <NInput
            v-model:value="formData.db09Lng"
            :placeholder="$t('common.placeholder', [$t('region.db09Lng')])"
          />
        </NFormItemGi>
        <NFormItemGi :span="24" :label="$t('region.db09Lat')" path="db09Lat">
          <NInput
            v-model:value="formData.db09Lat"
            :placeholder="$t('common.placeholder', [$t('region.db09Lat')])"
          />
        </NFormItemGi>
        <NFormItemGi :span="24" :label="$t('region.remark1')" path="remark1">
          <NInput
            v-model:value="formData.remark1"
            type="textarea"
            :rows="3"
            :placeholder="$t('common.placeholder', [$t('region.remark1')])"
          />
        </NFormItemGi>
        <NFormItemGi :span="24" :label="$t('region.remark2')" path="remark2">
          <NInput
            v-model:value="formData.remark2"
            type="textarea"
            :rows="3"
            :placeholder="$t('common.placeholder', [$t('region.remark2')])"
          />
        </NFormItemGi>
        <NFormItemGi :span="24" :label="$t('region.sort')" path="sort">
          <NInputNumber
            v-model:value="formData.sort"
            class="w-full"
            :placeholder="$t('common.placeholder', [$t('region.sort')])"
          />
        </NFormItemGi>
      </NGrid>
    </NForm>
  </Modal>
</template>

<style scoped></style>

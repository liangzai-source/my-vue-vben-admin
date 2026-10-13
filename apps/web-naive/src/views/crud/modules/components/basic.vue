<script setup lang="ts">
import type { Basic } from '#/crud/types';
import type { SelectOptions } from '#/types/common';

import { $t } from '@vben/locales';

import { NCard, NForm, NFormItemGi, NGrid, NInput, NSelect } from 'naive-ui';

import { useModelProxy } from '#/utils/tools';
const modelValue = defineModel<Basic>({ required: true });
const formData = useModelProxy<Basic>(modelValue);

const hasTableOptions: SelectOptions[] = [
  { label: 'y-admin', value: 'y-admin' },
];
</script>

<template>
  <NCard>
    <NForm :model="formData" label-placement="left" label-width="auto">
      <NGrid :cols="24" :x-gap="24">
        <NFormItemGi :span="24" :label="$t('crud.label.basic.moduleName')">
          <NInput v-model:value="formData.moduleName" />
        </NFormItemGi>
        <NFormItemGi :span="12" :label="$t('crud.label.basic.tableName')">
          <NInput v-model:value="formData.tableName" />
        </NFormItemGi>
        <NFormItemGi :span="12" :label="$t('crud.label.basic.hasTable')">
          <NSelect
            v-model:value="formData.tableName"
            filterable
            clearable
            :placeholder="$t('crud.label.basic.hasTable')"
            :options="hasTableOptions"
          />
        </NFormItemGi>
        <NFormItemGi :span="24" :label="$t('crud.label.basic.pkField')">
          <NInput v-model:value="formData.pkField" />
        </NFormItemGi>
      </NGrid>
    </NForm>
  </NCard>
</template>

<style scoped></style>

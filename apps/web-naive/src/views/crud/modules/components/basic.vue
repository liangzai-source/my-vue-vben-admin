<script setup lang="ts">
import type { Basic } from '#/crud/types';

import { $t } from '@vben/locales';

import { NCard, NForm, NFormItem, NInput } from 'naive-ui';
const formData = defineModel<Basic>({ required: true });
</script>

<template>
  <NCard>
    <NForm>
      <NFormItem :label="$t('crud.label.moduleName')">
        <NInput v-model:value="formData.moduleName" />
      </NFormItem>
    </NForm>
  </NCard>
</template>

<style scoped></style>

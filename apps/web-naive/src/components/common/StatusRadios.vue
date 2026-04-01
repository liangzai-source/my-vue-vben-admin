<script setup lang="ts">
import { $t } from '@vben/locales';

import { NRadioButton, NRadioGroup } from 'naive-ui';

const modelValue = defineModel('status', { default: 1 });
const statusList = [
  { value: 1, label: $t('common.enableStatus') },
  { value: 2, label: $t('common.disableStatus') },
];
</script>

<template>
  <NRadioGroup v-model:value="modelValue">
    <template v-for="v in statusList" :key="v.value">
      <NRadioButton :value="v.value">{{ v.label }}</NRadioButton>
    </template>
  </NRadioGroup>
</template>

<style scoped></style>

<script setup lang="ts">
import type { Component, CSSProperties } from 'vue';

import { VbenIcon } from '@vben-core/shadcn-ui';

import { NButton } from 'naive-ui';

type btnType =
  | 'default'
  | 'error'
  | 'info'
  | 'primary'
  | 'success'
  | 'tertiary'
  | 'warning';

type btnSize = 'large' | 'medium' | 'small' | 'tiny';

defineProps<{
  icon?: Component | Function | string;
  iconStyle?: CSSProperties;
  size?: btnSize;
  type?: btnType;
}>();
</script>

<template>
  <NButton :type="type || 'primary'" :size="size || 'medium'" class="ml-2">
    <template #icon>
      <div class="transition duration-300" :style="iconStyle || {}">
        <VbenIcon :icon="icon" />
      </div>
    </template>
    <slot></slot>
  </NButton>
</template>

<style scoped lang="scss"></style>

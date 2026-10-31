<script setup lang="ts">
import type { Page } from '#/crud/types';
import type { SelectOptions } from '#/types/common';

import {
  NCard,
  NForm,
  NFormItemGi,
  NGrid,
  NRadio,
  NRadioGroup,
  NSelect,
  NSpace,
} from 'naive-ui';

import { useModelProxy } from '#/utils/tools';

const modelValue = defineModel<Page>({ required: true });
const formData = useModelProxy<Page>(modelValue);

const sizeOptions: SelectOptions[] = [
  { label: '小 (Small)', value: 'small' },
  { label: '中 (Medium)', value: 'medium' },
  { label: '大 (Large)', value: 'large' },
];
</script>

<template>
  <NCard>
    <NForm :model="formData" label-placement="left" label-width="120">
      <NGrid :cols="24" :x-gap="24">
        <NFormItemGi :span="24" label="表格组件">
          <NRadioGroup v-model:value="formData.tableType">
            <NSpace>
              <NRadio value="vxe-table">VXE-Table (高性能虚拟表格)</NRadio>
              <NRadio value="naive">Naive UI DataTable (原生轻量表格)</NRadio>
            </NSpace>
          </NRadioGroup>
        </NFormItemGi>

        <NFormItemGi :span="24" label="表单类型">
          <NRadioGroup v-model:value="formData.formType">
            <NSpace>
              <NRadio value="naive">
Naive UI 原生表单 (&lt;n-form&gt; 模板驱动)
</NRadio>
              <NRadio value="vben">Vben 表单 (useVbenForm Schema驱动)</NRadio>
            </NSpace>
          </NRadioGroup>
        </NFormItemGi>

        <NFormItemGi :span="12" label="交互形态">
          <NRadioGroup v-model:value="formData.dialogType">
            <NSpace>
              <NRadio value="drawer">抽屉 (Drawer)</NRadio>
              <NRadio value="modal">弹窗 (Modal)</NRadio>
            </NSpace>
          </NRadioGroup>
        </NFormItemGi>

        <NFormItemGi :span="12" label="弹窗尺寸">
          <NSelect
            v-model:value="formData.dialogSize"
            :options="sizeOptions"
            placeholder="请选择弹窗尺寸"
          />
        </NFormItemGi>
      </NGrid>
    </NForm>
  </NCard>
</template>

<style scoped></style>

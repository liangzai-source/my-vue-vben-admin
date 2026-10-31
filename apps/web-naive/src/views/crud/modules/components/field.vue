<script setup lang="ts">
import type { SelectOption } from 'naive-ui';

import type { Field } from '#/crud/types';

import {
  NButton,
  NCard,
  NCheckbox,
  NEmpty,
  NInput,
  NInputNumber,
  NPopconfirm,
  NSelect,
  NTable,
} from 'naive-ui';

import { createDefaultField } from '#/crud/default';

const fields = defineModel<Field[]>({ default: () => [] });

const typeOptions: SelectOption[] = [
  { label: 'string (字符串)', value: 'string' },
  { label: 'int64 (整数)', value: 'int64' },
  { label: 'int (整数)', value: 'int' },
  { label: 'float64 (浮点数)', value: 'float64' },
  { label: 'bool (布尔值)', value: 'bool' },
  { label: 'time.Time (时间)', value: 'time.Time' },
];

const componentOptions: SelectOption[] = [
  { label: 'NInput (单行输入)', value: 'NInput' },
  { label: 'NInputNumber (数字输入)', value: 'NInputNumber' },
  { label: 'NSelect (下拉选择)', value: 'NSelect' },
  { label: 'NSwitch (开关)', value: 'NSwitch' },
  { label: 'NDatePicker (日期选择)', value: 'NDatePicker' },
  { label: 'NRadioGroup (单选框)', value: 'NRadioGroup' },
];

function onAddField() {
  const newField = createDefaultField();
  fields.value.push(newField);
}

function onRemoveField(index: number) {
  fields.value.splice(index, 1);
}

function onTypeChange(field: Field, val: string) {
  field.goType = val;
  switch (val) {
    case 'string': {
      field.tsType = 'string';
      field.gormType = 'varchar(255)';
      field.formComp = 'NInput';
      break;
    }
    case 'int':
    case 'int64': {
      field.tsType = 'number';
      field.gormType = val === 'int64' ? 'bigint' : 'int';
      field.formComp = 'NInputNumber';
      break;
    }
    case 'float64': {
      field.tsType = 'number';
      field.gormType = 'decimal(10,2)';
      field.formComp = 'NInputNumber';
      break;
    }
    case 'bool': {
      field.tsType = 'boolean';
      field.gormType = 'tinyint(1)';
      field.formComp = 'NSwitch';
      break;
    }
    case 'time.Time': {
      field.tsType = 'Date';
      field.gormType = 'datetime';
      field.formComp = 'NDatePicker';
      break;
    }
  }
}
</script>

<template>
  <NCard>
    <template #header>
      <div class="flex items-center justify-between">
        <span class="font-medium">字段属性配置</span>
        <NButton type="primary" size="small" @click="onAddField">
          + 添加字段
        </NButton>
      </div>
    </template>

    <div v-if="fields.length === 0" class="py-8">
      <NEmpty description="暂无字段，点击右上角添加字段">
        <template #extra>
          <NButton size="small" type="primary" @click="onAddField">
            添加第一个字段
          </NButton>
        </template>
      </NEmpty>
    </div>

    <NTable v-else :bordered="true" :single-line="false" size="small">
      <thead>
        <tr>
          <th style="width: 140px">字段名 (Go / TS)</th>
          <th style="width: 130px">中文标签</th>
          <th style="width: 160px">数据类型</th>
          <th style="width: 170px">表单组件</th>
          <th style="width: 80px; text-align: center">表格显示</th>
          <th style="width: 80px; text-align: center">表单编辑</th>
          <th style="width: 80px; text-align: center">允许为空</th>
          <th style="width: 100px; text-align: center">列宽 (px)</th>
          <th>注释</th>
          <th style="width: 70px; text-align: center">操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in fields" :key="index">
          <td>
            <NInput
              v-model:value="item.name"
              size="small"
              placeholder="PascalCase"
              @update:value="
                (val) => {
                  if (!item.tsName) {
                    item.tsName = val.charAt(0).toLowerCase() + val.slice(1);
                  }
                  if (!item.jsonTag) {
                    item.jsonTag = item.tsName;
                  }
                }
              "
            />
          </td>
          <td>
            <NInput
              v-model:value="item.label"
              size="small"
              placeholder="中文说明"
            />
          </td>
          <td>
            <NSelect
              :value="item.goType"
              :options="typeOptions"
              size="small"
              @update:value="(val) => onTypeChange(item, val)"
            />
          </td>
          <td>
            <NSelect
              v-model:value="item.formComp"
              :options="componentOptions"
              size="small"
            />
          </td>
          <td style="text-align: center">
            <NCheckbox v-model:checked="item.listable" />
          </td>
          <td style="text-align: center">
            <NCheckbox v-model:checked="item.editable" />
          </td>
          <td style="text-align: center">
            <NCheckbox v-model:checked="item.nullable" />
          </td>
          <td>
            <NInputNumber
              v-model:value="item.width"
              size="small"
              :min="60"
              :step="10"
            />
          </td>
          <td>
            <NInput
              v-model:value="item.comment"
              size="small"
              placeholder="数据库注释"
            />
          </td>
          <td style="text-align: center">
            <NPopconfirm @positive-click="onRemoveField(index)">
              <template #trigger>
                <NButton size="tiny" type="error" text>删除</NButton>
              </template>
              确认删除该字段？
            </NPopconfirm>
          </td>
        </tr>
      </tbody>
    </NTable>
  </NCard>
</template>

<style scoped></style>

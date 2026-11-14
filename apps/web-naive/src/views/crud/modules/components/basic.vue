<script setup lang="ts">
import type { SelectOption } from 'naive-ui';

import type { Basic, Schema } from '#/crud/types';

import { onMounted, ref } from 'vue';

import { $t } from '@vben/locales';

import { VbenIcon } from '@vben-core/shadcn-ui';

import {
  NButton,
  NCard,
  NForm,
  NFormItemGi,
  NGrid,
  NInput,
  NSelect,
  NSwitch,
  NTooltip,
} from 'naive-ui';

import { message } from '#/adapter/naive';
import { devCrudTablesApi, devCrudTableSchemaApi } from '#/api/dev/crud';
import { useModelProxy } from '#/utils/tools';

const emit = defineEmits<{
  (e: 'tableLoaded', schema: Schema): void;
}>();

const modelValue = defineModel<Basic>({ required: true });
const formData = useModelProxy<Basic>(modelValue);

const hasTableOptions = ref<SelectOption[]>([]);
const loadingTables = ref(false);

async function fetchTables() {
  loadingTables.value = true;
  try {
    const list = await devCrudTablesApi();
    hasTableOptions.value = list.map((item) => ({
      label: item.label,
      value: item.value,
    }));
  } catch (error: any) {
    message.error(error?.message || '获取数据库表列表失败');
  } finally {
    loadingTables.value = false;
  }
}

async function onSelectTable(tableName: null | string) {
  if (!tableName) return;
  loadingTables.value = true;
  try {
    const fullSchema = await devCrudTableSchemaApi(tableName);
    emit('tableLoaded', fullSchema);
    message.success(
      `已解析数据表 [${tableName}]，共加载 ${fullSchema.fieldsConfig.length} 个字段`,
    );
  } catch (error: any) {
    message.error(error?.message || '解析数据表结构失败');
  } finally {
    loadingTables.value = false;
  }
}

onMounted(() => {
  fetchTables();
});
</script>

<template>
  <NCard>
    <NForm :model="formData" label-placement="left" label-width="auto">
      <NGrid :cols="24" :x-gap="24">
        <NFormItemGi :span="12" :label="$t('crud.label.basic.hasTable')">
          <div class="flex items-center gap-2 w-full">
            <NSelect
              :value="formData.tableName || null"
              filterable
              clearable
              :loading="loadingTables"
              :placeholder="$t('crud.label.basic.hasTable')"
              :options="hasTableOptions"
              class="flex-1"
              @update:value="onSelectTable"
            />
            <NTooltip v-if="formData.tableName" trigger="hover">
              <template #trigger>
                <NButton
                  size="small"
                  quaternary
                  :loading="loadingTables"
                  @click="onSelectTable(formData.tableName)"
                >
                  <template #icon>
                    <VbenIcon icon="carbon:renew" />
                  </template>
                </NButton>
              </template>
              从数据库重新解析该表
            </NTooltip>
          </div>
        </NFormItemGi>
        <NFormItemGi :span="12" :label="$t('crud.label.basic.tableName')">
          <NInput
            v-model:value="formData.tableName"
            placeholder="数据库表名（如 y_region）"
          />
        </NFormItemGi>
        <NFormItemGi :span="12" :label="$t('crud.label.basic.moduleName')">
          <NInput
            v-model:value="formData.moduleName"
            placeholder="模块名称（如 region，后端自动剔除配置的表前缀）"
          />
        </NFormItemGi>
        <NFormItemGi :span="12" label="功能名称 (中文)">
          <NInput v-model:value="formData.comment" placeholder="如 区域管理" />
        </NFormItemGi>
        <NFormItemGi :span="12" label="功能名称 (英文)">
          <NInput
            v-model:value="formData.commentEn"
            placeholder="如 Region Management"
          />
        </NFormItemGi>
        <NFormItemGi :span="12" :label="$t('crud.label.basic.pkField')">
          <NInput
            v-model:value="formData.pkField"
            placeholder="主键名称，默认 id"
          />
        </NFormItemGi>
        <NFormItemGi :span="12" label="继承CRUD基类">
          <div class="flex flex-col gap-2 items-start">
            <NSwitch v-model:value="formData.inheritBase" />
            <span class="text-blue-400 text-xs leading-tight">
              开启后继承通用泛型基类（BaseCrud），代码极简；关闭后展开标准独立代码，方便二开。
            </span>
          </div>
        </NFormItemGi>
        <NFormItemGi :span="12" label="软删除">
          <NSwitch v-model:value="formData.softDelete" />
        </NFormItemGi>
      </NGrid>
    </NForm>
  </NCard>
</template>

<style scoped></style>

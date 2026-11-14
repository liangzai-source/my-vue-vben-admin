<script setup lang="ts">
import type { Field } from '#/crud/types';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { VbenIcon } from '@vben-core/shadcn-ui';

import {
  NAlert,
  NButton,
  NCard,
  NEmpty,
  NPopconfirm,
  NSwitch,
  NTag,
  NTooltip,
} from 'naive-ui';

import { message } from '#/adapter/naive';
import { devCrudTableSchemaApi } from '#/api/dev/crud';
import { createDefaultField } from '#/crud/default';
import { inferSelfLabelField, smartInferSchema } from '#/crud/smartInference';

import FieldModalComponent from './field-modal.vue';

const props = defineProps<{
  tableName?: string;
}>();

const hasExistingTable = computed(() =>
  Boolean(props.tableName && props.tableName.trim()),
);

const fields = defineModel<Field[]>({ default: () => [] });
const syncing = ref(false);

const [FieldModal, fieldModalApi] = useVbenModal({
  connectedComponent: FieldModalComponent,
  destroyOnClose: true,
});

// 从数据库同步最新物理字段
async function onSyncDatabaseFields() {
  if (!props.tableName) return;
  syncing.value = true;
  try {
    const rawSchema = await devCrudTableSchemaApi(props.tableName);
    const inferred = smartInferSchema(rawSchema);
    const freshFields = inferred.fieldsConfig || [];

    // 建立现有字段映射，以物理列名/字段名为 key (小写)
    const existingMap = new Map<string, Field>();
    for (const f of fields.value) {
      const key = (f.columnName || f.name || f.tsName || '').toLowerCase();
      if (key) {
        existingMap.set(key, f);
      }
    }

    let addedCount = 0;
    const mergedFields: Field[] = [];

    for (const fresh of freshFields) {
      const key = (
        fresh.columnName ||
        fresh.name ||
        fresh.tsName ||
        ''
      ).toLowerCase();
      const old = existingMap.get(key);
      if (old) {
        // 已有字段：保留用户已有的所有配置（组件、显示/隐藏、表关联等），仅同步物理属性变化
        old.goType = fresh.goType;
        old.gormType = fresh.gormType;
        old.nullable = fresh.nullable;
        old.required = fresh.required;
        if (!old.comment && fresh.comment) old.comment = fresh.comment;
        if (!old.label && fresh.label) old.label = fresh.label;
        mergedFields.push(old);
      } else {
        // 新增物理字段：智能推导后追加
        mergedFields.push(fresh);
        addedCount++;
      }
    }

    fields.value = mergedFields;

    if (addedCount > 0) {
      message.success(
        `成功从数据库同步字段！新增 ${addedCount} 个物理字段，已保留原字段配置`,
      );
    } else {
      message.success(
        `已同步数据库字段，所有字段均为最新状态（共 ${mergedFields.length} 个字段）`,
      );
    }
  } catch (error: any) {
    message.error(error?.message || '同步数据库字段失败');
  } finally {
    syncing.value = false;
  }
}

// 拖拽排序状态
const draggingIndex = ref<null | number>(null);
const dragOverIndex = ref<null | number>(null);

function onAddField() {
  if (hasExistingTable.value) {
    return;
  }
  const newField = createDefaultField();
  fields.value.push(newField);
  // 新建后自动打开编辑弹窗
  onEditField(newField, fields.value.length - 1);
}

function onRemoveField(index: number) {
  if (hasExistingTable.value) {
    return;
  }
  fields.value.splice(index, 1);
}

function onEditField(field: Field, index: number) {
  fieldModalApi
    .setData({
      field,
      index,
      tableName: props.tableName,
      labelField: inferSelfLabelField(fields.value),
    })
    .open();
}

function onSaveField(updatedField: Field, index: number) {
  if (index >= 0 && index < fields.value.length) {
    fields.value[index] = updatedField;
  }
}

// ===== 原生 HTML5 拖拽排序处理 =====
function onDragStart(index: number, event: DragEvent) {
  draggingIndex.value = index;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(index));
  }
}

function onDragOver(index: number, event: DragEvent) {
  event.preventDefault();
  dragOverIndex.value = index;
}

function onDragLeave(index: number) {
  if (dragOverIndex.value === index) {
    dragOverIndex.value = null;
  }
}

function onDrop(dropIndex: number, event: DragEvent) {
  event.preventDefault();
  if (draggingIndex.value === null || draggingIndex.value === dropIndex) {
    draggingIndex.value = null;
    dragOverIndex.value = null;
    return;
  }

  const itemToMove = fields.value.splice(draggingIndex.value, 1)[0];
  if (itemToMove) {
    fields.value.splice(dropIndex, 0, itemToMove);
  }

  draggingIndex.value = null;
  dragOverIndex.value = null;
}

function onDragEnd() {
  draggingIndex.value = null;
  dragOverIndex.value = null;
}
</script>

<template>
  <NCard>
    <FieldModal @save="onSaveField" />

    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="font-medium text-base">字段属性配置</span>
          <NTag
            v-if="fields.length > 0"
            size="small"
            :bordered="false"
            type="primary"
          >
            共 {{ fields.length }} 个字段
          </NTag>
          <span class="text-xs text-muted-foreground ml-2">
            （可拖拽方块调整字段顺序，点击编辑弹窗配置详细信息）
          </span>
        </div>
        <div class="flex items-center gap-2">
          <NButton
            v-if="hasExistingTable"
            type="primary"
            secondary
            size="small"
            :loading="syncing"
            @click="onSyncDatabaseFields"
          >
            <template #icon>
              <VbenIcon icon="carbon:renew" />
            </template>
            同步数据库字段
          </NButton>
          <NButton v-else type="primary" size="small" @click="onAddField">
            <template #icon>
              <VbenIcon icon="carbon:add" />
            </template>
            添加字段
          </NButton>
        </div>
      </div>
    </template>

    <!-- 已有数据表时的安全提示 -->
    <div v-if="hasExistingTable" class="mb-4">
      <NAlert type="info" :bordered="false">
        <template #icon>
          <VbenIcon icon="carbon:information-filled" class="text-primary" />
        </template>
        当前模块绑定已有数据表
        <span class="font-mono font-semibold text-primary">[{{ tableName }}]</span>。
        数据库为物理字段唯一事实来源（若数据库表结构发生变动，可直接点击右上角
        <span
          class="font-semibold text-primary underline cursor-pointer"
          @click="onSyncDatabaseFields"
          >【同步数据库字段】</span>
        一键刷新），您仍可在此<span class="font-medium text-foreground">拖拽调整顺序</span>，或点击卡片配置<span class="font-medium text-foreground">表格显示/隐藏、表单录入组件、校验规则及表关联</span>。
      </NAlert>
    </div>

    <div v-if="fields.length === 0" class="py-12">
      <NEmpty description="暂无字段，点击右上角添加字段或从已有数据表解析">
        <template #extra>
          <NButton type="primary" size="small" @click="onAddField">
            <template #icon>
              <VbenIcon icon="carbon:add" />
            </template>
            添加第一个字段
          </NButton>
        </template>
      </NEmpty>
    </div>

    <!-- 字段方块/卡片流展示 -->
    <div
      v-else
      class="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 select-none"
    >
      <div
        v-for="(item, index) in fields"
        :key="item.name || index"
        class="group relative flex flex-col justify-between rounded-lg border bg-card p-3 shadow-xs transition-all duration-200 cursor-grab active:cursor-grabbing hover:border-primary hover:shadow-md"
        :class="{
          'opacity-40 border-dashed border-primary scale-95':
            draggingIndex === index,
          'border-primary bg-primary/5 ring-2 ring-primary/30':
            dragOverIndex === index && draggingIndex !== index,
          'border-border': draggingIndex !== index && dragOverIndex !== index,
        }"
        draggable="true"
        @dragstart="onDragStart(index, $event)"
        @dragover="onDragOver(index, $event)"
        @dragleave="onDragLeave(index)"
        @drop="onDrop(index, $event)"
        @dragend="onDragEnd"
      >
        <!-- 卡片内容区域 -->
        <div class="flex flex-col gap-1.5">
          <!-- 第 1 行：字段名 + 类型 Tag + 拖拽手柄 & 操作按钮 -->
          <div class="flex items-start justify-between gap-1">
            <div class="flex items-center gap-1.5 overflow-hidden">
              <span
                class="cursor-grab text-muted-foreground hover:text-foreground text-sm"
                title="拖动排序"
              >
                ⋮⋮
              </span>
              <span
                class="font-semibold text-sm truncate text-foreground"
                :title="item.name || '未命名字段'"
              >
                {{ item.name || '未命名' }}
              </span>
              <NTag size="tiny" :bordered="false" type="info">
                {{ item.goType || 'string' }}
              </NTag>
            </div>

            <!-- 右上角操作区 -->
            <div class="flex items-center gap-1 shrink-0">
              <NTooltip trigger="hover">
                <template #trigger>
                  <NButton
                    size="tiny"
                    quaternary
                    type="primary"
                    @click.stop="onEditField(item, index)"
                  >
                    <template #icon>
                      <VbenIcon icon="andrsrxn:edit" />
                    </template>
                  </NButton>
                </template>
                打开弹窗配置全部属性
              </NTooltip>

              <NPopconfirm
                v-if="!hasExistingTable"
                @positive-click.stop="onRemoveField(index)"
              >
                <template #trigger>
                  <NButton size="tiny" quaternary type="error" @click.stop>
                    <template #icon>
                      <VbenIcon icon="ep:delete" />
                    </template>
                  </NButton>
                </template>
                确认删除该字段？
              </NPopconfirm>
            </div>
          </div>

          <!-- 第 2 行：类型详情 -->
          <div class="text-xs text-muted-foreground truncate">
            TS:
            <span class="text-foreground/80 font-mono">{{
              item.tsType || 'string'
            }}</span>
            <span class="mx-1 text-muted-foreground/50">|</span>
            GORM:
            <span class="text-foreground/80 font-mono">{{
              item.gormType || '-'
            }}</span>
          </div>

          <!-- 第 3 行：字段 Label / 注释说明 -->
          <div
            class="text-xs text-muted-foreground truncate"
            :title="item.label || item.comment || '-'"
          >
            标签:
            <span class="text-foreground/90 font-medium">
              {{ item.label || item.name || '-' }}
            </span>
            <span v-if="item.labelEn" class="text-muted-foreground/80 ml-1">
              ({{ item.labelEn }})
            </span>
          </div>

          <!-- 第 4 行：快捷开关（表格显示 / 表单显示） -->
          <div
            class="mt-1 flex items-center justify-between gap-2 text-xs text-muted-foreground"
            @click.stop
            @mousedown.stop
          >
            <div class="flex items-center gap-1.5">
              <span>表格显示</span>
              <NSwitch v-model:value="item.listable" size="small" />
            </div>
            <div class="flex items-center gap-1.5">
              <span>表单显示</span>
              <NSwitch v-model:value="item.editable" size="small" />
            </div>
          </div>
        </div>

        <!-- 底部：状态小胶囊徽章 -->
        <div
          class="mt-2.5 pt-2 border-t border-border/50 flex flex-wrap items-center gap-1"
        >
          <NTag
            v-if="item.relation?.enable"
            size="tiny"
            :bordered="false"
            type="primary"
          >
            关联: {{ item.relation.targetTable || '表' }}
          </NTag>
          <NTag
            v-if="item.optionData && item.optionData.length > 0"
            size="tiny"
            :bordered="false"
            type="warning"
          >
            选项({{ item.optionData.length }})
          </NTag>
          <NTag
            v-if="item.listable"
            size="tiny"
            :bordered="false"
            type="success"
            :title="`表格组件: ${item.listComp || 'NText'}`"
          >
            表格: {{ item.listComp || 'NText' }}
          </NTag>
          <NTag
            v-if="item.editable"
            size="tiny"
            :bordered="false"
            type="info"
            :title="`表单组件: ${item.formComp || 'NInput'}`"
          >
            表单: {{ item.formComp || 'NInput' }}
          </NTag>
          <NTag
            v-if="item.searchData && item.searchData.length > 0"
            size="tiny"
            :bordered="false"
            type="warning"
          >
            搜索
          </NTag>
          <NTag v-if="item.sortable" size="tiny" :bordered="false">
            可排序
          </NTag>
          <NTag v-if="item.isFile" size="tiny" :bordered="false" type="error">
            文件
          </NTag>
          <NTag
            v-if="!item.nullable || item.required"
            size="tiny"
            :bordered="false"
          >
            必填
          </NTag>
          <NTag
            v-if="item.rules && item.rules.length > 0"
            size="tiny"
            :bordered="false"
            type="info"
          >
            校验({{ item.rules.length }})
          </NTag>
        </div>
      </div>
    </div>
  </NCard>
</template>

<style scoped></style>

<script setup lang="ts">
import type { Field } from '#/crud/types';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { NButton, NCard, NEmpty, NPopconfirm, NTag, NTooltip } from 'naive-ui';

import { createDefaultField } from '#/crud/default';
import { inferSelfLabelField } from '#/crud/smartInference';

import FieldModalComponent from './field-modal.vue';

const props = defineProps<{
  tableName?: string;
}>();

const fields = defineModel<Field[]>({ default: () => [] });

const [FieldModal, fieldModalApi] = useVbenModal({
  connectedComponent: FieldModalComponent,
  destroyOnClose: true,
});

// 拖拽排序状态
const draggingIndex = ref<null | number>(null);
const dragOverIndex = ref<null | number>(null);

function onAddField() {
  const newField = createDefaultField();
  fields.value.push(newField);
  // 新建后自动打开编辑弹窗
  onEditField(newField, fields.value.length - 1);
}

function onRemoveField(index: number) {
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
        <NButton type="primary" size="small" @click="onAddField">
          + 添加字段
        </NButton>
      </div>
    </template>

    <div v-if="fields.length === 0" class="py-12">
      <NEmpty description="暂无字段，点击右上角添加字段或从已有数据表解析">
        <template #extra>
          <NButton type="primary" size="small" @click="onAddField">
            + 添加第一个字段
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
                    编辑
                  </NButton>
                </template>
                打开弹窗配置全部属性
              </NTooltip>

              <NPopconfirm @positive-click.stop="onRemoveField(index)">
                <template #trigger>
                  <NButton size="tiny" quaternary type="error" @click.stop>
                    ✕
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
          <NTag v-if="!item.nullable" size="tiny" :bordered="false">
            必填
          </NTag>
        </div>
      </div>
    </div>
  </NCard>
</template>

<style scoped></style>

<script setup lang="ts">
import type { SelectOption } from 'naive-ui';

import type { Field, Page } from '#/crud/types';
import type { SelectOptions } from '#/types/common';

import { computed, watch } from 'vue';

import {
  NAlert,
  NCard,
  NForm,
  NFormItemGi,
  NGrid,
  NInput,
  NRadio,
  NRadioGroup,
  NSelect,
  NSpace,
  NSwitch,
} from 'naive-ui';

import { useModelProxy } from '#/utils/tools';

const props = defineProps<{
  fields?: Field[];
}>();

const modelValue = defineModel<Page>({ required: true });
const formData = useModelProxy<Page>(modelValue);

// 确保始终为 vxe-table 与 naive 表单
formData.tableType = 'vxe-table';
formData.formType = 'naive';

const sizeOptions: SelectOptions[] = [
  { label: '小 (Small)', value: 'small' },
  { label: '中 (Medium)', value: 'medium' },
  { label: '大 (Large)', value: 'large' },
  { label: '自定义 (Custom)', value: 'custom' },
];

watch(
  () => formData.dialogSize,
  (val) => {
    if (val === 'custom' && !formData.dialogWidth) {
      formData.dialogWidth =
        formData.dialogType === 'modal' ? '800px' : '650px';
    }
  },
);

const fieldOptions = computed<SelectOption[]>(() => {
  return (props.fields || []).map((f) => ({
    label: `${f.columnName || f.name} (${f.label || f.comment || f.name})`,
    value: f.columnName || f.name,
  }));
});

// 当开启树形表格时，智能推荐字段
watch(
  () => formData.isTree,
  (val) => {
    if (val && props.fields && props.fields.length > 0) {
      if (!formData.treeParentField) {
        const foundParent = props.fields.find((f) => {
          const col = (f.columnName || f.name).toLowerCase();
          return (
            col === 'parent_id' ||
            col === 'pid' ||
            col === 'parentid' ||
            col === 'p_id'
          );
        });
        formData.treeParentField = foundParent
          ? foundParent.columnName || foundParent.name
          : 'parent_id';
      }
      if (!formData.treeNodeColumn) {
        const foundTitle = props.fields.find(
          (f) =>
            f.listable &&
            (f.name.toLowerCase() === 'name' ||
              f.name.toLowerCase() === 'title' ||
              f.goType === 'string'),
        );
        formData.treeNodeColumn = foundTitle
          ? foundTitle.name
          : props.fields[0]?.name || '';
      }
      if (formData.treeLazy === undefined) {
        formData.treeLazy = true;
      }
      if (!formData.hasChildField) {
        formData.hasChildField = 'hasChildren';
      }
    }
  },
);
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- 基础交互形态配置 -->
    <NCard title="页面交互配置">
      <NForm :model="formData" label-placement="left" label-width="120">
        <NGrid :cols="24" :x-gap="24">
          <!-- 第 1 行：交互形态 (独占一行) -->
          <NFormItemGi :span="24" label="交互形态">
            <NRadioGroup v-model:value="formData.dialogType">
              <NSpace>
                <NRadio value="drawer">抽屉 (Drawer)</NRadio>
                <NRadio value="modal">弹窗 (Modal)</NRadio>
              </NSpace>
            </NRadioGroup>
          </NFormItemGi>

          <!-- 第 2 行：弹窗/抽屉尺寸预设 (独占一行) -->
          <NFormItemGi
            :span="24"
            :label="formData.dialogType === 'modal' ? '弹窗尺寸' : '抽屉尺寸'"
          >
            <NSelect
              v-model:value="formData.dialogSize"
              :options="sizeOptions"
              placeholder="请选择预设尺寸"
            />
          </NFormItemGi>

          <!-- 自定义尺寸配置 -->
          <template v-if="formData.dialogSize === 'custom'">
            <!-- 抽屉自定义宽度 -->
            <NFormItemGi
              v-if="formData.dialogType === 'drawer'"
              :span="24"
              label="自定义宽度"
            >
              <NInput
                v-model:value="formData.dialogWidth"
                placeholder="如 650px、50% 或 800px，未填写默认 650px"
              />
            </NFormItemGi>

            <!-- 弹窗自定义宽度与高度 -->
            <template v-else>
              <NFormItemGi :span="12" label="自定义宽度">
                <NInput
                  v-model:value="formData.dialogWidth"
                  placeholder="如 800px 或 60vw，未填写默认 800px"
                />
              </NFormItemGi>
              <NFormItemGi :span="12" label="自定义高度">
                <NInput
                  v-model:value="formData.dialogHeight"
                  placeholder="如 600px、75vh 或留空为自适应"
                />
              </NFormItemGi>
            </template>
          </template>
        </NGrid>
      </NForm>
    </NCard>

    <!-- 树形表格配置 (针对自关联、上下级等层级数据) -->
    <NCard title="树形表格配置 (层级与自关联)">
      <NAlert type="info" class="mb-4">
        针对类似省市区行政区划（如
        y_region）、组织架构、分类目录等自身与自身关联的表。
        支持全量树（前端构建）与异步远程懒加载树（按需加载下级节点）。统一采用
        VXE-Table 高性能虚拟渲染。
      </NAlert>

      <NForm :model="formData" label-placement="left" label-width="140">
        <NGrid :cols="24" :x-gap="24">
          <NFormItemGi :span="24" label="开启树形表格">
            <div class="flex items-center gap-3">
              <NSwitch v-model:value="formData.isTree" />
              <span class="text-xs text-muted-foreground">
                开启后，表格将作为层级树展示，并提供展开/折叠功能
              </span>
            </div>
          </NFormItemGi>

          <template v-if="formData.isTree">
            <NFormItemGi :span="24" label="远程懒加载子节点">
              <div class="flex items-center gap-3">
                <NSwitch v-model:value="formData.treeLazy" />
                <span class="text-xs text-muted-foreground">
                  开启（推荐数据量大）：首屏只查顶级根节点（如 parent_id =
                  0），点击展开小箭头异步请求子级数据；
                  关闭：首屏一次性查全量数据，由前端表格本地组装多层级树。
                </span>
              </div>
            </NFormItemGi>

            <NFormItemGi :span="12" label="父级关联字段">
              <NSelect
                v-model:value="formData.treeParentField"
                :options="fieldOptions"
                filterable
                tag
                placeholder="默认匹配 parent_id 或 pid"
              />
            </NFormItemGi>

            <NFormItemGi :span="12" label="树折叠展示列">
              <NSelect
                v-model:value="formData.treeNodeColumn"
                :options="fieldOptions"
                filterable
                tag
                placeholder="选择哪一列展示展开小箭头，如 name / title"
              />
            </NFormItemGi>

            <NFormItemGi :span="24" label="子级标记字段 (VO)">
              <NInput
                v-model:value="formData.hasChildField"
                placeholder="后端返回该行是否有下级的布尔字段，默认 hasChildren"
              />
            </NFormItemGi>
          </template>
        </NGrid>
      </NForm>
    </NCard>
  </div>
</template>

<style scoped></style>

<script setup lang="ts">
import type { SelectOption } from 'naive-ui';

import type { Field, Page } from '#/crud/types';
import type { SelectOptions } from '#/types/common';

import { computed, watch } from 'vue';

import {
  NAlert,
  NCard,
  NCheckbox,
  NCheckboxGroup,
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

// 确保页面模式与存储模式默认值
if (!formData.pageMode) {
  formData.pageMode = 'crud';
}
if (!formData.tableMode) {
  formData.tableMode = 'standalone';
}

// 确保始终为 vxe-table 与 naive 表单
formData.tableType = 'vxe-table';
formData.formType = 'naive';
if (!formData.operation) {
  formData.operation = ['create', 'update', 'delete'];
}

// 当单页模式切换时，自动调整操作按钮
watch(
  () => formData.pageMode,
  (mode) => {
    if (mode === 'single') {
      formData.operation = ['view', 'update'];
    } else if (
      formData.operation.length === 2 &&
      formData.operation.includes('view') &&
      formData.operation.includes('update')
    ) {
      formData.operation = ['create', 'update', 'delete'];
    }
  },
  { immediate: true },
);

// 当切到共享表模式时，智能推导标识字段
watch(
  () => formData.tableMode,
  (tMode) => {
    if (tMode === 'shared' && !formData.singleCodeCol && props.fields) {
      const found = props.fields.find((f) => {
        const col = (f.columnName || f.name).toLowerCase();
        return (
          col === 'code' || col === 'slug' || col === 'key' || col === 'type'
        );
      });
      if (found) {
        formData.singleCodeCol = found.columnName || found.name;
      }
    }
  },
);

const hasForm = computed(
  () =>
    formData.operation?.includes('create') ||
    formData.operation?.includes('update'),
);

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
          <!-- 页面类型模式 -->
          <NFormItemGi :span="24" label="页面类型">
            <div class="flex flex-col gap-1.5">
              <NRadioGroup v-model:value="formData.pageMode">
                <NSpace>
                  <NRadio value="crud">
                    标准增删改查 (表格列表 + 弹窗/抽屉表单)
                  </NRadio>
                  <NRadio value="single">
                    单页表单维护 (单页直接维护，仅查看与编辑两条权限)
                  </NRadio>
                </NSpace>
              </NRadioGroup>
              <span class="text-xs text-muted-foreground">
                适用于特殊单页（如特殊文章、系统设置、关于我们、隐私协议等），直接渲染卡片表单，无需列表与弹窗
              </span>
            </div>
          </NFormItemGi>

          <!-- 单页模式专属配置 -->
          <template v-if="formData.pageMode === 'single'">
            <NFormItemGi :span="24" label="数据存储模式">
              <div class="flex flex-col gap-1.5">
                <NRadioGroup v-model:value="formData.tableMode">
                  <NSpace>
                    <NRadio value="standalone">
                      独占单表模式 (全表仅存1条记录，自动自愈与Upsert)
                    </NRadio>
                    <NRadio value="shared">
                      多功能共享表模式 (多个单页共用一张表，按标识区分)
                    </NRadio>
                  </NSpace>
                </NRadioGroup>
                <span class="text-xs text-muted-foreground">
                  独占单表：全表按主键升序维护首条记录，空表自动自愈创建，零报错；共享表：多单页共用同张表（如
                  sys_single_page），根据 Code 字段隔离。
                </span>
              </div>
            </NFormItemGi>

            <!-- 共享表模式下的配置项 -->
            <template v-if="formData.tableMode === 'shared'">
              <NFormItemGi :span="12" label="标识字段 (列名)">
                <NSelect
                  v-model:value="formData.singleCodeCol"
                  :options="fieldOptions"
                  filterable
                  tag
                  placeholder="选择区分不同单页的字段（如 code / slug / type）"
                />
              </NFormItemGi>
              <NFormItemGi :span="12" label="标识值 (Code)">
                <div class="flex flex-col gap-1 w-full">
                  <NInput
                    v-model:value="formData.singleCodeVal"
                    placeholder="如 about_us、privacy_policy 或 agreement"
                  />
                  <span class="text-xs text-muted-foreground">
                    每个单页功能请填写唯一的标识值，后端将通过通用单页服务按此
                    Code 自动存取。
                  </span>
                </div>
              </NFormItemGi>
            </template>

            <NFormItemGi :span="24" label="功能权限">
              <div class="flex items-center gap-2">
                <span
                  class="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
                >
                  查看权限 (View)
                </span>
                <span
                  class="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
                >
                  编辑保存权限 (Update)
                </span>
                <span class="ml-2 text-xs text-muted-foreground">
                  （单页模式固定仅生成两条权限，已自动精简）
                </span>
              </div>
            </NFormItemGi>
          </template>

          <!-- 标准 CRUD 模式专属配置 -->
          <template v-else>
            <!-- 功能操作配置 -->
            <NFormItemGi :span="24" label="功能操作">
              <div class="flex flex-col gap-1.5">
                <NCheckboxGroup v-model:value="formData.operation">
                  <NSpace>
                    <NCheckbox value="create">新增 (Create)</NCheckbox>
                    <NCheckbox value="update">编辑 (Update)</NCheckbox>
                    <NCheckbox value="delete">删除 (Delete)</NCheckbox>
                  </NSpace>
                </NCheckboxGroup>
                <span class="text-xs text-muted-foreground">
                  未勾选的操作将不会生成对应的按钮、路由、接口及数据库菜单权限；若未勾选新增与编辑，将跳过生成
                  Form 表单组件
                </span>
              </div>
            </NFormItemGi>

            <!-- 交互形态 (仅在开启新增或编辑时生效) -->
            <template v-if="hasForm">
              <NFormItemGi :span="24" label="交互形态">
                <NRadioGroup v-model:value="formData.dialogType">
                  <NSpace>
                    <NRadio value="drawer">抽屉 (Drawer)</NRadio>
                    <NRadio value="modal">弹窗 (Modal)</NRadio>
                  </NSpace>
                </NRadioGroup>
              </NFormItemGi>

              <!-- 弹窗/抽屉尺寸预设 -->
              <NFormItemGi
                :span="24"
                :label="
                  formData.dialogType === 'modal' ? '弹窗尺寸' : '抽屉尺寸'
                "
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
            </template>
            <template v-else>
              <NFormItemGi :span="24" label="交互形态">
                <span class="text-xs text-muted-foreground self-center">
                  （当前未勾选新增与编辑，页面为纯查询浏览模式，无需表单弹窗/抽屉）
                </span>
              </NFormItemGi>
            </template>
          </template>
        </NGrid>
      </NForm>
    </NCard>

    <!-- 树形表格配置 (针对自关联、上下级等层级数据，仅在标准 CRUD 模式展示) -->
    <NCard
      v-if="formData.pageMode !== 'single'"
      title="树形表格配置 (层级与自关联)"
    >
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

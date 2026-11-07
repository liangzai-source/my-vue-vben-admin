<script setup lang="ts">
import type { SelectOption } from 'naive-ui';

import type { Field, SearchOption } from '#/crud/types';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import cloneDeep from 'lodash.clonedeep';
import {
  NAlert,
  NForm,
  NFormItemGi,
  NGrid,
  NInput,
  NInputNumber,
  NSelect,
  NSwitch,
  NTabPane,
  NTabs,
} from 'naive-ui';

import { devCrudTablesApi, devCrudTableSchemaApi } from '#/api/dev/crud';
import { createDefaultField } from '#/crud/default';

const emit = defineEmits<{
  (e: 'save', field: Field, index: number): void;
}>();

const currentField = ref<Field>(createDefaultField());
const editingIndex = ref<number>(-1);
const activeTab = ref<string>('basic');

// Go 数据类型选项
const goTypeOptions: SelectOption[] = [
  { label: 'string (字符串)', value: 'string' },
  { label: 'int64 (大整数)', value: 'int64' },
  { label: 'int (标准整数)', value: 'int' },
  { label: 'float64 (浮点数)', value: 'float64' },
  { label: 'bool (布尔值)', value: 'bool' },
  { label: 'time.Time (时间日期)', value: 'time.Time' },
];

// 表单组件选项
const formCompOptions: SelectOption[] = [
  { label: 'NInput (单行文本输入)', value: 'NInput' },
  { label: 'NInputNumber (数字输入)', value: 'NInputNumber' },
  { label: 'NSelect (下拉选择)', value: 'NSelect' },
  { label: 'RelationSelect (自适应表关联下拉)', value: 'RelationSelect' },
  { label: 'NSwitch (开关)', value: 'NSwitch' },
  { label: 'NDatePicker (日期时间选择)', value: 'NDatePicker' },
  { label: 'NRadioGroup (单选框组)', value: 'NRadioGroup' },
  { label: 'NUpload (文件/图片上传)', value: 'NUpload' },
];

const dbTables = ref<SelectOption[]>([]);
const targetColumns = ref<SelectOption[]>([]);
const loadingTables = ref(false);
const loadingColumns = ref(false);

async function loadDbTables() {
  if (dbTables.value.length > 0) return;
  loadingTables.value = true;
  try {
    const res = await devCrudTablesApi();
    dbTables.value = (res || []).map((t) => ({
      label: `${t.name} (${t.comment || t.name})`,
      value: t.name,
    }));
  } catch (error) {
    console.error('加载数据表失败:', error);
  } finally {
    loadingTables.value = false;
  }
}

async function loadTargetColumns(tableName: string) {
  if (!tableName) {
    targetColumns.value = [];
    return;
  }
  loadingColumns.value = true;
  try {
    const schema = await devCrudTableSchemaApi(tableName);
    targetColumns.value = (schema?.fieldsConfig || []).map((f) => ({
      label: `${f.columnName || f.name} (${f.label || f.comment || f.name})`,
      value: f.columnName || f.name,
    }));
  } catch (error) {
    console.error('加载目标表字段失败:', error);
  } finally {
    loadingColumns.value = false;
  }
}

function handleTargetTableChange(val: string) {
  if (currentField.value.relation) {
    currentField.value.relation.targetTable = val;
    currentField.value.relation.valueField = 'id';
    currentField.value.relation.labelField = 'name';
  } else {
    currentField.value.relation = {
      enable: true,
      targetTable: val,
      valueField: 'id',
      labelField: 'name',
    };
  }
  loadTargetColumns(val);
}

function handleRelationEnableChange(val: boolean) {
  if (currentField.value.relation) {
    currentField.value.relation.enable = val;
  } else {
    currentField.value.relation = {
      enable: val,
      targetTable: '',
      valueField: 'id',
      labelField: 'name',
    };
  }
  if (val) {
    currentField.value.formComp = 'RelationSelect';
    loadDbTables();
    if (currentField.value.relation.targetTable) {
      loadTargetColumns(currentField.value.relation.targetTable);
    }
  }
}

// 表格组件选项
const listCompOptions: SelectOption[] = [
  { label: 'NText (常规文本)', value: 'NText' },
  { label: 'CellSwitch (状态开关切换)', value: 'CellSwitch' },
  { label: 'NTag (徽标/标签)', value: 'NTag' },
  { label: 'NImage (图片预览)', value: 'NImage' },
];

// 数据库索引选项
const indexOptions: SelectOption[] = [
  { label: '无索引', value: '' },
  { label: 'NORMAL (普通索引)', value: 'NORMAL' },
  { label: 'UNIQUE (唯一索引)', value: 'UNIQUE' },
];

// 搜索符号选项
const symbolOptions: SelectOption[] = [
  { label: '= (精确匹配)', value: '=' },
  { label: 'LIKE (模糊匹配)', value: 'LIKE' },
  { label: '!= (不等于)', value: '!=' },
  { label: '> (大于)', value: '>' },
  { label: '>= (大于等于)', value: '>=' },
  { label: '< (小于)', value: '<' },
  { label: '<= (小于等于)', value: '<=' },
  { label: 'BETWEEN (范围区间)', value: 'BETWEEN' },
  { label: 'IN (多选包含)', value: 'IN' },
];

// 搜索录入组件
const searchCompOptions: SelectOption[] = [
  { label: 'NInput (单行文本)', value: 'NInput' },
  { label: 'NInputNumber (数字)', value: 'NInputNumber' },
  { label: 'NSelect (下拉选择)', value: 'NSelect' },
  { label: 'NDatePicker (日期时间)', value: 'NDatePicker' },
  { label: 'NDatePickerRange (日期范围)', value: 'NDatePickerRange' },
];

// 是否开启搜索
const hasSearch = computed<boolean>({
  get: () => {
    return (
      Array.isArray(currentField.value.searchData) &&
      currentField.value.searchData.length > 0
    );
  },
  set: (val: boolean) => {
    if (val) {
      if (
        !Array.isArray(currentField.value.searchData) ||
        currentField.value.searchData.length === 0
      ) {
        currentField.value.searchData = [createDefaultSearchOption()];
      }
    } else {
      currentField.value.searchData = [];
    }
  },
});

// 首个搜索选项快捷绑定
const firstSearchOption = computed<SearchOption>(() => {
  if (
    !Array.isArray(currentField.value.searchData) ||
    currentField.value.searchData.length === 0
  ) {
    return createDefaultSearchOption();
  }
  return currentField.value.searchData[0] ?? createDefaultSearchOption();
});

function createDefaultSearchOption(): SearchOption {
  return {
    type: '2', // 表单用户输入
    symbol: '=',
    component:
      currentField.value.goType === 'string' ? 'NInput' : 'NInputNumber',
    label: currentField.value.label || currentField.value.name,
    name: currentField.value.tsName || currentField.value.name,
    value: '',
    optionType: 0,
    optionData: [],
    compOptions: '',
    compLabelField: '',
    compValueField: '',
  };
}

// 类型变化时的联动推导
function onGoTypeChange(val: string) {
  currentField.value.goType = val;
  switch (val) {
    case 'string': {
      currentField.value.tsType = 'string';
      currentField.value.gormType = 'varchar(255)';
      currentField.value.formComp = 'NInput';
      break;
    }
    case 'int':
    case 'int64': {
      currentField.value.tsType = 'number';
      currentField.value.gormType = val === 'int64' ? 'bigint' : 'int';
      currentField.value.formComp = 'NInputNumber';
      break;
    }
    case 'float64': {
      currentField.value.tsType = 'number';
      currentField.value.gormType = 'decimal(10,2)';
      currentField.value.formComp = 'NInputNumber';
      break;
    }
    case 'bool': {
      currentField.value.tsType = 'boolean';
      currentField.value.gormType = 'tinyint(1)';
      currentField.value.formComp = 'NSwitch';
      currentField.value.listComp = 'CellSwitch';
      break;
    }
    case 'time.Time': {
      currentField.value.tsType = 'Date';
      currentField.value.gormType = 'datetime';
      currentField.value.formComp = 'NDatePicker';
      break;
    }
  }
}

// 字段名输入联动驼峰
function onNameChange(val: string) {
  currentField.value.name = val;
  if (!currentField.value.tsName && val) {
    currentField.value.tsName = val.charAt(0).toLowerCase() + val.slice(1);
  }
  if (!currentField.value.jsonTag && currentField.value.tsName) {
    currentField.value.jsonTag = currentField.value.tsName;
  }
}

const [Modal, modalApi] = useVbenModal<{ field: Field; index: number }>({
  onConfirm: () => {
    emit('save', cloneDeep(currentField.value), editingIndex.value);
    modalApi.close();
  },
  onOpenChange: (isOpen) => {
    if (isOpen) {
      activeTab.value = 'basic';
      const payload = modalApi.getData();
      if (payload && payload.field) {
        currentField.value = cloneDeep(payload.field);
        editingIndex.value = payload.index;
        if (currentField.value.relation?.enable) {
          loadDbTables();
          if (currentField.value.relation.targetTable) {
            loadTargetColumns(currentField.value.relation.targetTable);
          }
        }
      }
    }
  },
});
</script>

<template>
  <Modal title="字段详细属性配置" class="w-[880px] max-w-[92vw]">
    <div class="px-2 py-1">
      <NTabs v-model:value="activeTab" type="line" animated>
        <!-- Tab 1: 基础信息 -->
        <NTabPane name="basic" tab="1. 基础信息">
          <NForm label-placement="left" label-width="120" class="pt-2">
            <NGrid :cols="24" :x-gap="16">
              <NFormItemGi :span="12" label="Go 字段名 (Name)">
                <NInput
                  :value="currentField.name"
                  placeholder="如 UserName (PascalCase)"
                  @update:value="onNameChange"
                />
              </NFormItemGi>

              <NFormItemGi :span="12" label="TS 字段名 (tsName)">
                <NInput
                  v-model:value="currentField.tsName"
                  placeholder="如 userName (camelCase)"
                />
              </NFormItemGi>

              <NFormItemGi :span="12" label="中文标签 (Label)">
                <NInput
                  v-model:value="currentField.label"
                  placeholder="如 用户名称"
                />
              </NFormItemGi>

              <NFormItemGi :span="12" label="英文标签 (LabelEn)">
                <NInput
                  v-model:value="currentField.labelEn"
                  placeholder="如 User Name"
                />
              </NFormItemGi>

              <NFormItemGi :span="12" label="数据库物理列名">
                <NInput
                  v-model:value="currentField.columnName"
                  placeholder="如 user_name"
                />
              </NFormItemGi>

              <NFormItemGi :span="12" label="JSON Tag">
                <NInput
                  v-model:value="currentField.jsonTag"
                  placeholder="如 userName"
                />
              </NFormItemGi>

              <NFormItemGi :span="12" label="Go 数据类型">
                <NSelect
                  :value="currentField.goType"
                  :options="goTypeOptions"
                  @update:value="onGoTypeChange"
                />
              </NFormItemGi>

              <NFormItemGi :span="12" label="TS 数据类型">
                <NInput
                  v-model:value="currentField.tsType"
                  placeholder="如 string / number"
                />
              </NFormItemGi>

              <NFormItemGi :span="12" label="GORM 列类型">
                <NInput
                  v-model:value="currentField.gormType"
                  placeholder="如 varchar(255)"
                />
              </NFormItemGi>

              <NFormItemGi :span="12" label="数据库索引">
                <NSelect
                  v-model:value="currentField.indexable"
                  :options="indexOptions"
                />
              </NFormItemGi>

              <NFormItemGi :span="12" label="允许为空 (Nullable)">
                <NSwitch v-model:value="currentField.nullable" />
              </NFormItemGi>

              <NFormItemGi :span="24" label="字段注释说明">
                <NInput
                  v-model:value="currentField.comment"
                  type="textarea"
                  :rows="2"
                  placeholder="数据库字段注释"
                />
              </NFormItemGi>
            </NGrid>
          </NForm>
        </NTabPane>

        <!-- Tab 2: 列表组件 (表格配置) -->
        <NTabPane name="table" tab="2. 列表组件">
          <NForm label-placement="left" label-width="120" class="pt-2">
            <NGrid :cols="24" :x-gap="16">
              <NFormItemGi :span="12" label="在表格中显示">
                <NSwitch v-model:value="currentField.listable" />
              </NFormItemGi>

              <NFormItemGi :span="12" label="允许表头排序">
                <NSwitch v-model:value="currentField.sortable" />
              </NFormItemGi>

              <NFormItemGi :span="12" label="表格显示组件">
                <NSelect
                  v-model:value="currentField.listComp"
                  :options="listCompOptions"
                />
              </NFormItemGi>

              <NFormItemGi :span="12" label="表格列宽 (px)">
                <NInputNumber
                  v-model:value="currentField.width"
                  :min="60"
                  :step="10"
                  class="w-full"
                  placeholder="列宽，默认 150"
                />
              </NFormItemGi>
            </NGrid>
          </NForm>
        </NTabPane>

        <!-- Tab 3: 搜索组件 (SearchData) -->
        <NTabPane name="search" tab="3. 搜索组件">
          <NForm label-placement="left" label-width="120" class="pt-2">
            <NGrid :cols="24" :x-gap="16">
              <NFormItemGi :span="24" label="开启字段搜索">
                <div class="flex items-center gap-3">
                  <NSwitch v-model:value="hasSearch" />
                  <span class="text-xs text-muted-foreground">
                    开启后，该字段将作为列表顶部搜索栏的查询项（自动注入
                    searchData 规则）
                  </span>
                </div>
              </NFormItemGi>

              <template v-if="hasSearch">
                <NFormItemGi :span="12" label="搜索参数名">
                  <NInput
                    v-model:value="firstSearchOption.name"
                    placeholder="API 查询参数名，如 name"
                  />
                </NFormItemGi>

                <NFormItemGi :span="12" label="搜索标签名称">
                  <NInput
                    v-model:value="firstSearchOption.label"
                    placeholder="搜索栏展示标签，如 用户名"
                  />
                </NFormItemGi>

                <NFormItemGi :span="12" label="搜索匹配操作符">
                  <NSelect
                    v-model:value="firstSearchOption.symbol"
                    :options="symbolOptions"
                  />
                </NFormItemGi>

                <NFormItemGi :span="12" label="搜索录入组件">
                  <NSelect
                    v-model:value="firstSearchOption.component"
                    :options="searchCompOptions"
                  />
                </NFormItemGi>
              </template>
            </NGrid>
          </NForm>
        </NTabPane>

        <!-- Tab 4: 表单组件 (新增/编辑) -->
        <NTabPane name="form" tab="4. 表单组件">
          <NForm label-placement="left" label-width="120" class="pt-2">
            <NGrid :cols="24" :x-gap="16">
              <NFormItemGi :span="12" label="在表单中编辑">
                <NSwitch v-model:value="currentField.editable" />
              </NFormItemGi>

              <NFormItemGi :span="12" label="表单录入组件">
                <NSelect
                  v-model:value="currentField.formComp"
                  :options="formCompOptions"
                />
              </NFormItemGi>

              <NFormItemGi :span="24" label="表单默认值">
                <NInput
                  v-model:value="currentField.default"
                  placeholder="未填写时为 null / 空"
                />
              </NFormItemGi>
            </NGrid>
          </NForm>
        </NTabPane>

        <!-- Tab 5: 模型配置 (文件与扩展) -->
        <NTabPane name="model" tab="5. 模型配置">
          <div class="py-2">
            <NAlert type="info" title="模型特性扩展" class="mb-4">
              用于配置 GORM Model 层的字段衍生特性，如文件/图片字段域名补全等。
            </NAlert>

            <NForm label-placement="left" label-width="160">
              <NGrid :cols="24" :x-gap="16">
                <NFormItemGi :span="24" label="是否为文件/图片字段">
                  <div class="flex items-center gap-3">
                    <NSwitch v-model:value="currentField.isFile" />
                    <span class="text-xs text-muted-foreground">
                      开启后，当模型返回数据时将自动拼接文件服务基础访问域名
                    </span>
                  </div>
                </NFormItemGi>
              </NGrid>
            </NForm>
          </div>
        </NTabPane>

        <!-- Tab 6: 表关联配置 (自适应外键下拉) -->
        <NTabPane name="relation" tab="6. 表关联配置">
          <div class="py-2">
            <NAlert type="info" title="自适应外键关联" class="mb-4">
              用于 xxx_id 外键关联目标表。自适应策略：目标表数据量 ≤ 1000
              条时全量载入并支持本地快速过滤；> 1000
              条时智能开启防抖远程搜索，且支持单值精准回显。
            </NAlert>

            <NForm label-placement="left" label-width="140">
              <NGrid :cols="24" :x-gap="16">
                <NFormItemGi :span="24" label="开启表关联">
                  <div class="flex items-center gap-3">
                    <NSwitch
                      :value="currentField.relation?.enable ?? false"
                      @update:value="handleRelationEnableChange"
                    />
                    <span class="text-xs text-muted-foreground">
                      开启后，表单将自动采用自适应 RelationSelect 组件，Model
                      与表格展示将自动联动对应名称。
                    </span>
                  </div>
                </NFormItemGi>

                <template v-if="currentField.relation?.enable">
                  <NFormItemGi :span="24" label="关联目标数据表">
                    <NSelect
                      v-model:value="currentField.relation.targetTable"
                      :options="dbTables"
                      :loading="loadingTables"
                      filterable
                      placeholder="请选择目标数据表，如 y_user"
                      @update:value="handleTargetTableChange"
                    />
                  </NFormItemGi>

                  <NFormItemGi :span="12" label="存储值字段 (Value)">
                    <NSelect
                      v-model:value="currentField.relation.valueField"
                      :options="targetColumns"
                      :loading="loadingColumns"
                      filterable
                      tag
                      placeholder="默认 id"
                    />
                  </NFormItemGi>

                  <NFormItemGi :span="12" label="展示文本字段 (Label)">
                    <NSelect
                      v-model:value="currentField.relation.labelField"
                      :options="targetColumns"
                      :loading="loadingColumns"
                      filterable
                      tag
                      placeholder="默认 name / title"
                    />
                  </NFormItemGi>
                </template>
              </NGrid>
            </NForm>
          </div>
        </NTabPane>
      </NTabs>
    </div>
  </Modal>
</template>

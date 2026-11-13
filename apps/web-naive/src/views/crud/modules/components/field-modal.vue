<script setup lang="ts">
import type { SelectOption } from 'naive-ui';

import type { Field, SearchOption } from '#/crud/types';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import cloneDeep from 'lodash.clonedeep';
import {
  NAlert,
  NButton,
  NForm,
  NFormItemGi,
  NGrid,
  NInput,
  NInputNumber,
  NSelect,
  NSpace,
  NSwitch,
  NTabPane,
  NTabs,
} from 'naive-ui';

import { devCrudTablesApi, devCrudTableSchemaApi } from '#/api/dev/crud';
import { createDefaultField } from '#/crud/default';
import {
  isEnumSemanticName,
  isSelfParentFieldName,
  parseCommentOptions,
  smartInferField,
} from '#/crud/smartInference';

const emit = defineEmits<{
  (e: 'save', field: Field, index: number): void;
}>();

const currentField = ref<Field>(createDefaultField());
const editingIndex = ref<number>(-1);
const activeTab = ref<string>('basic');
const currentTableName = ref<string>('');
const currentLabelField = ref<string>('name');

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
  { label: 'NInputTextArea (多行文本域)', value: 'NInputTextArea' },
  { label: 'NSelect (下拉选择 - 单选)', value: 'NSelect' },
  { label: 'NSelectMultiple (下拉选择 - 多选)', value: 'NSelectMultiple' },
  { label: 'RelationSelect (自适应表关联下拉)', value: 'RelationSelect' },
  { label: 'NSwitch (开关)', value: 'NSwitch' },
  { label: 'NDatePicker (日期时间选择)', value: 'NDatePicker' },
  { label: 'NDate (仅日期选择)', value: 'NDate' },
  { label: 'NRadioGroup (单选框组)', value: 'NRadioGroup' },
  { label: 'FileUpload (附件/图片选择器)', value: 'FileUpload' },
  { label: 'VbenTiptap (富文本编辑器)', value: 'VbenTiptap' },
  { label: 'NHidden (隐藏表单项)', value: 'NHidden' },
];

// 常用正则校验选项 (前后端 tag 一致)
const validationRuleOptions: SelectOption[] = [
  { label: 'mobile - 手机号 (中国大陆11位)', value: 'mobile' },
  { label: 'email - 邮箱地址', value: 'email' },
  { label: 'tel - 固定电话 / 座机', value: 'tel' },
  { label: 'phone - 手机号或固定电话', value: 'phone' },
  { label: 'idcard - 居民身份证号 (15/18位)', value: 'idcard' },
  { label: 'url - 网址链接 (http/https)', value: 'url' },
  { label: 'ipv4 - IPv4 地址', value: 'ipv4' },
  { label: 'zip_code - 6位邮政编码', value: 'zip_code' },
  { label: 'credit_code - 统一社会信用代码 (18位)', value: 'credit_code' },
  {
    label: 'username - 账号 (字母开头4-20位字母数字下划线)',
    value: 'username',
  },
  { label: 'strong_pwd - 强密码 (8-32位含字母和数字)', value: 'strong_pwd' },
  { label: 'chinese - 纯中文字符', value: 'chinese' },
  { label: 'alphanum - 纯字母和数字', value: 'alphanum' },
  { label: 'numeric - 纯数字 (可含小数/负号)', value: 'numeric' },
  { label: 'integer - 整数', value: 'integer' },
  { label: 'positive_int - 正整数', value: 'positive_int' },
  { label: 'decimal - 金额/小数 (最多两位小数)', value: 'decimal' },
  { label: 'plate_no - 中国车牌号 (含新能源)', value: 'plate_no' },
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
    if (hasSearch.value && currentField.value.searchData?.[0]) {
      currentField.value.searchData[0].component = 'RelationSelect';
      currentField.value.searchData[0].symbol = '=';
    }
    loadDbTables();
    if (currentField.value.relation.targetTable) {
      loadTargetColumns(currentField.value.relation.targetTable);
    }
  } else if (
    hasSearch.value &&
    currentField.value.searchData?.[0]?.component === 'RelationSelect'
  ) {
    currentField.value.searchData[0].component = 'NSelect';
  }
}

// 表格组件选项
const listCompOptions: SelectOption[] = [
  { label: 'NText (常规文本)', value: 'NText' },
  { label: 'CellInput (可修改文本框)', value: 'CellInput' },
  { label: 'CellInputNumber (可修改数字框)', value: 'CellInputNumber' },
  { label: 'CellLink (链接展示)', value: 'CellLink' },
  { label: 'CellDateTime (日期时间 - 本地时区)', value: 'CellDateTime' },
  { label: 'CellDate (仅日期 - 本地时区)', value: 'CellDate' },
  { label: 'CellAttachment (附件/多媒体预览)', value: 'CellAttachment' },
  { label: 'CellImage (图片预览)', value: 'CellImage' },
  { label: 'CellSwitch (状态开关切换)', value: 'CellSwitch' },
  { label: 'NTag (徽标/标签)', value: 'NTag' },
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
  { label: 'RelationSelect (自适应表关联下拉)', value: 'RelationSelect' },
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
  const f = currentField.value;
  let component = f.goType === 'string' ? 'NInput' : 'NInputNumber';
  let symbol = f.goType === 'string' ? 'LIKE' : '=';
  let optionType = 0;
  let optionData: Field['optionData'] = [];

  if (f.relation?.enable || f.formComp === 'RelationSelect') {
    component = 'RelationSelect';
    symbol = '=';
  } else if (
    f.formComp === 'NSelect' ||
    f.formComp === 'NSelectMultiple' ||
    f.formComp === 'NRadioGroup' ||
    f.formComp === 'NSwitch' ||
    f.listComp === 'CellSwitch' ||
    f.listComp === 'CellTag' ||
    f.listComp === 'NTag'
  ) {
    component = 'NSelect';
    symbol = '=';
    if (Array.isArray(f.optionData) && f.optionData.length > 0) {
      optionType = 1;
      optionData = cloneDeep(f.optionData);
    }
  } else if (
    f.formComp === 'NDatePicker' ||
    f.formComp === 'NDate' ||
    f.goType === 'time.Time'
  ) {
    component = 'NDatePickerRange';
    symbol = 'BETWEEN';
  }

  return {
    type: '2', // 表单用户输入
    symbol,
    component,
    label: f.label || f.name,
    name: f.tsName || f.name,
    value: '',
    optionType,
    optionData,
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
      currentField.value.listComp = 'CellDateTime';
      break;
    }
  }
}

// 字段智能推导规则（根据字段语义自动匹配最合理的表格/表单组件与属性）
function applySmartInference() {
  currentField.value = smartInferField(currentField.value, {
    tableName: currentTableName.value,
    labelField: currentLabelField.value,
  });
}

// 字段名输入联动驼峰与智能推导
function onNameChange(val: string) {
  currentField.value.name = val;
  if (!currentField.value.tsName && val) {
    currentField.value.tsName = val.charAt(0).toLowerCase() + val.slice(1);
  }
  if (!currentField.value.jsonTag && currentField.value.tsName) {
    currentField.value.jsonTag = currentField.value.tsName;
  }
  // 若仍处于默认初始组件，则自动智能推导
  if (
    currentField.value.formComp === 'NInput' &&
    currentField.value.listComp === 'NText'
  ) {
    applySmartInference();
  }
}

// 字段注释输入与枚举选项智能解析 (如 '1-启用 2-禁用')
function onCommentChange(val: string) {
  currentField.value.comment = val;
  if (!val) return;
  const options = parseCommentOptions(val);
  if (
    options.length >= 2 &&
    (!currentField.value.optionData ||
      currentField.value.optionData.length === 0)
  ) {
    currentField.value.optionType = 1;
    currentField.value.optionData = options;
    if (currentField.value.formComp === 'NInput') {
      currentField.value.formComp =
        options.length <= 4 ? 'NRadioGroup' : 'NSelect';
    }
    if (currentField.value.listComp === 'NText') {
      currentField.value.listComp = 'NTag';
    }
  }
}

// 表单录入组件联动
function onFormCompChange(val: string) {
  currentField.value.formComp = val;
  if (val === 'FileUpload') {
    currentField.value.isFile = true;
    currentField.value.listComp = 'CellAttachment';
  } else if (val === 'NSwitch') {
    currentField.value.listComp = 'CellSwitch';
  }
}

// 附件/文件标识联动
function onIsFileChange(val: boolean) {
  currentField.value.isFile = val;
  if (val) {
    currentField.value.formComp = 'FileUpload';
    currentField.value.listComp = 'CellAttachment';
  }
}

const isDbNotNull = computed(() => !currentField.value.nullable);

function onNullableChange(val: boolean) {
  currentField.value.nullable = val;
  if (!val) {
    currentField.value.required = true;
  }
}

// 是否需要配置固定选项 (表单：单选框组、普通下拉或表格 Tag，且未开启表关联)
const needOptions = computed(() => {
  return (
    (currentField.value.formComp === 'NRadioGroup' ||
      currentField.value.formComp === 'NSelect' ||
      currentField.value.formComp === 'NSelectMultiple' ||
      currentField.value.listComp === 'NTag') &&
    !currentField.value.relation?.enable
  );
});

// 搜索组件是否需要配置固定选项 (搜索组件选为 NSelect 且未开启表关联)
const needSearchOptions = computed(() => {
  return (
    hasSearch.value &&
    firstSearchOption.value.component === 'NSelect' &&
    !currentField.value.relation?.enable
  );
});

function ensureSearchOption(): SearchOption | undefined {
  if (
    !Array.isArray(currentField.value.searchData) ||
    currentField.value.searchData.length === 0
  ) {
    currentField.value.searchData = [createDefaultSearchOption()];
  }
  const item = currentField.value.searchData[0];
  if (item && !Array.isArray(item.optionData)) {
    item.optionData = [];
  }
  return item;
}

function ensureOptionTarget(target: 'field' | 'search') {
  if (target === 'search') {
    return ensureSearchOption();
  }
  if (!Array.isArray(currentField.value.optionData)) {
    currentField.value.optionData = [];
  }
  return currentField.value;
}

function addOption(target: 'field' | 'search' = 'field') {
  const holder = ensureOptionTarget(target);
  if (!holder) return;
  const isString = currentField.value.goType === 'string';
  const nextVal = isString
    ? String(holder.optionData.length + 1)
    : holder.optionData.length + 1;
  holder.optionType = 1;
  holder.optionData.push({
    label: '',
    value: nextVal,
  });
}

function removeOption(index: number, target: 'field' | 'search' = 'field') {
  const holder = ensureOptionTarget(target);
  if (holder && Array.isArray(holder.optionData)) {
    holder.optionData.splice(index, 1);
  }
}

function parseOptionValueByGoType(val: string, goType: string) {
  if (goType === 'int' || goType === 'int64') {
    const num = Number(val);
    return Number.isNaN(num) ? val : num;
  }
  if (goType === 'bool') {
    return val === 'true' || val === '1';
  }
  return val;
}

function onOptionValueChange(
  index: number,
  val: string,
  target: 'field' | 'search' = 'field',
) {
  const holder = ensureOptionTarget(target);
  const optionItem = holder?.optionData?.[index];
  if (!optionItem) return;
  optionItem.value = parseOptionValueByGoType(val, currentField.value.goType);
}

function applyPresetOptions(
  type: 'gender' | 'status' | 'yesno',
  target: 'field' | 'search' = 'field',
) {
  const holder = ensureOptionTarget(target);
  if (!holder) return;
  const isString = currentField.value.goType === 'string';
  holder.optionType = 1;
  if (type === 'status') {
    holder.optionData = [
      { label: '启用', value: isString ? '1' : 1 },
      { label: '禁用', value: isString ? '0' : 0 },
    ];
  } else if (type === 'gender') {
    holder.optionData = [
      { label: '男', value: isString ? '1' : 1 },
      { label: '女', value: isString ? '2' : 2 },
    ];
  } else if (type === 'yesno') {
    holder.optionData = [
      { label: '是', value: isString ? '1' : 1 },
      { label: '否', value: isString ? '0' : 0 },
    ];
  }
}

function syncFieldOptionsToSearch() {
  const searchHolder = ensureSearchOption();
  if (!searchHolder) return;
  searchHolder.optionType = 1;
  searchHolder.optionData = cloneDeep(currentField.value.optionData || []);
}

function onSearchCompChange(val: string) {
  const searchHolder = ensureSearchOption();
  if (!searchHolder) return;
  searchHolder.component = val;
  if (val === 'RelationSelect') {
    searchHolder.symbol = '=';
    if (!currentField.value.relation?.enable) {
      loadDbTables();
    }
  } else if (val === 'NSelect') {
    searchHolder.symbol = '=';
    if (
      (!searchHolder.optionData || searchHolder.optionData.length === 0) &&
      Array.isArray(currentField.value.optionData) &&
      currentField.value.optionData.length > 0
    ) {
      syncFieldOptionsToSearch();
    }
  } else if (val === 'NDatePickerRange') {
    searchHolder.symbol = 'BETWEEN';
  }
}

const [Modal, modalApi] = useVbenModal<{
  field: Field;
  index: number;
  labelField?: string;
  tableName?: string;
}>({
  onConfirm: () => {
    const saved = cloneDeep(currentField.value);
    if (!saved.nullable) {
      saved.required = true;
    }
    emit('save', saved, editingIndex.value);
    modalApi.close();
  },
  onOpenChange: (isOpen) => {
    if (isOpen) {
      activeTab.value = 'basic';
      const payload = modalApi.getData();
      currentTableName.value = payload?.tableName || '';
      currentLabelField.value = payload?.labelField || 'name';
      if (payload && payload.field) {
        currentField.value = cloneDeep(payload.field);
        if (!Array.isArray(currentField.value.optionData)) {
          currentField.value.optionData = [];
        }
        currentField.value.isFile = Boolean(currentField.value.isFile);
        editingIndex.value = payload.index;
        const colName =
          currentField.value.columnName ||
          currentField.value.name ||
          currentField.value.tsName;
        // 若为未定制状态，或历史残留的 y_parent 自关联错配 / tinyint(1) 多值枚举误判为开关，自动纠正推导
        const optCount = Math.max(
          currentField.value.optionData.length,
          parseCommentOptions(currentField.value.comment || '').length,
        );
        if (
          (currentField.value.listComp === 'NText' &&
            (currentField.value.formComp === 'NInput' ||
              currentField.value.formComp === 'NInputNumber')) ||
          (isSelfParentFieldName(colName) &&
            currentTableName.value &&
            currentField.value.relation?.targetTable === 'y_parent') ||
          ((optCount > 2 || isEnumSemanticName(colName)) &&
            (currentField.value.listComp === 'CellSwitch' ||
              currentField.value.formComp === 'NSwitch'))
        ) {
          currentField.value = smartInferField(currentField.value, {
            tableName: currentTableName.value,
            labelField: currentLabelField.value,
          });
        }
        if (currentField.value.switchConfirm === undefined) {
          currentField.value.switchConfirm = true;
        }
        if (!currentField.value.nullable) {
          currentField.value.required = true;
        } else if (currentField.value.required === undefined) {
          currentField.value.required = false;
        }
        if (!Array.isArray(currentField.value.rules)) {
          currentField.value.rules = [];
        }
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
        <!-- 基础信息 -->
        <NTabPane name="basic" tab="基础信息">
          <NForm label-placement="left" label-width="120" class="pt-2">
            <NGrid :cols="24" :x-gap="16">
              <NFormItemGi :span="12" label="Go 字段名 (Name)">
                <div class="flex items-center gap-2">
                  <NInput
                    :value="currentField.name"
                    class="flex-1"
                    placeholder="如 UserName (PascalCase)"
                    @update:value="onNameChange"
                  />
                  <NButton
                    size="tiny"
                    type="primary"
                    secondary
                    title="根据字段语义自动推导组件与属性"
                    @click="applySmartInference"
                  >
                    智能推导
                  </NButton>
                </div>
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
                <NTooltip v-if="currentTableName" trigger="hover">
                  <template #trigger>
                    <NInput
                      v-model:value="currentField.columnName"
                      disabled
                      placeholder="如 user_name"
                    />
                  </template>
                  当前基于已有数据表解析，物理列名受数据库约束，不可随意修改
                </NTooltip>
                <NInput
                  v-else
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
                <NSwitch
                  :value="currentField.nullable"
                  @update:value="onNullableChange"
                />
              </NFormItemGi>

              <NFormItemGi :span="12" label="是否为附件 (isFile)">
                <div class="flex items-center gap-2">
                  <NSwitch
                    :value="Boolean(currentField.isFile)"
                    @update:value="onIsFileChange"
                  />
                  <span class="text-xs text-muted-foreground">
                    联动上传组件与表格预览
                  </span>
                </div>
              </NFormItemGi>

              <NFormItemGi :span="24" label="字段注释说明">
                <NInput
                  :value="currentField.comment"
                  placeholder="数据库字段注释 (若包含如 '1-启用 2-禁用' 将自动解析并填充选项)"
                  :rows="2"
                  type="textarea"
                  @update:value="onCommentChange"
                />
              </NFormItemGi>
            </NGrid>
          </NForm>
        </NTabPane>

        <!-- 列表组件 (表格配置) -->
        <NTabPane name="table" tab="列表组件">
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

              <NFormItemGi
                v-if="currentField.listComp === 'CellSwitch'"
                :span="12"
                label="切换二次确认"
              >
                <div class="flex items-center gap-2">
                  <NSwitch
                    :value="currentField.switchConfirm !== false"
                    @update:value="(val) => (currentField.switchConfirm = val)"
                  />
                  <span class="text-xs text-muted-foreground">
                    点击开关防误触确认弹窗 (基于 useStatusChange，默认开启)
                  </span>
                </div>
              </NFormItemGi>
            </NGrid>
          </NForm>
        </NTabPane>

        <!-- 搜索组件 (SearchData) -->
        <NTabPane name="search" tab="搜索组件">
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
                    :value="firstSearchOption.component"
                    :options="searchCompOptions"
                    @update:value="onSearchCompChange"
                  />
                </NFormItemGi>

                <!-- 搜索使用表关联时的状态提示 -->
                <NFormItemGi
                  v-if="firstSearchOption.component === 'RelationSelect'"
                  :span="24"
                >
                  <NAlert
                    v-if="currentField.relation?.enable"
                    type="info"
                    title="已绑定自适应表关联下拉 (RelationSelect)"
                  >
                    <div class="flex items-center justify-between gap-2">
                      <span>
                        目标表：<b>{{
                          currentField.relation.targetTable || '未选择'
                        }}</b>
                        ，存储字段：{{
                          currentField.relation.valueField || 'id'
                        }}，展示字段：{{
                          currentField.relation.labelField || 'name'
                        }}
                      </span>
                      <NButton
                        size="tiny"
                        type="primary"
                        secondary
                        @click="activeTab = 'relation'"
                      >
                        调整表关联配置
                      </NButton>
                    </div>
                  </NAlert>
                  <NAlert v-else type="warning" title="尚未开启表关联配置">
                    <div class="flex items-center justify-between gap-2">
                      <span>
                        当前搜索组件选为
                        RelationSelect，请先在「表关联配置」中开启并指定目标数据表。
                      </span>
                      <NButton
                        size="tiny"
                        type="warning"
                        secondary
                        @click="activeTab = 'relation'"
                      >
                        前往开启表关联
                      </NButton>
                    </div>
                  </NAlert>
                </NFormItemGi>

                <!-- 未开启表关联时，搜索下拉选项数据配置 -->
                <NFormItemGi v-if="needSearchOptions" :span="24">
                  <div class="flex flex-col gap-2 w-full pt-1">
                    <div
                      class="flex items-center justify-between border-b pb-2"
                    >
                      <div class="flex items-center gap-2">
                        <span class="text-sm font-medium">
                          搜索选项数据配置 (Options)
                        </span>
                        <span class="text-xs text-muted-foreground">
                          未开启表关联时，为搜索下拉提供可选项
                        </span>
                      </div>
                      <NSpace size="small">
                        <NButton
                          v-if="
                            currentField.optionData &&
                            currentField.optionData.length > 0
                          "
                          size="tiny"
                          quaternary
                          type="success"
                          @click="syncFieldOptionsToSearch"
                        >
                          同步表单选项
                        </NButton>
                        <NButton
                          size="tiny"
                          quaternary
                          type="primary"
                          @click="applyPresetOptions('status', 'search')"
                        >
                          预设: 状态(1/0)
                        </NButton>
                        <NButton
                          size="tiny"
                          quaternary
                          type="primary"
                          @click="applyPresetOptions('gender', 'search')"
                        >
                          预设: 性别(1/2)
                        </NButton>
                        <NButton
                          size="tiny"
                          quaternary
                          type="primary"
                          @click="applyPresetOptions('yesno', 'search')"
                        >
                          预设: 是/否(1/0)
                        </NButton>
                        <NButton
                          size="tiny"
                          dashed
                          type="primary"
                          @click="addOption('search')"
                        >
                          + 添加选项
                        </NButton>
                      </NSpace>
                    </div>

                    <div
                      v-if="
                        !firstSearchOption.optionData ||
                        firstSearchOption.optionData.length === 0
                      "
                      class="py-4 text-center text-xs text-muted-foreground"
                    >
                      暂未配置搜索选项数据，可点击右上角快速添加、应用预设或同步表单选项
                    </div>

                    <div v-else class="flex flex-col gap-2 mt-1">
                      <div
                        v-for="(opt, optIdx) in firstSearchOption.optionData"
                        :key="optIdx"
                        class="flex items-center gap-2 rounded border border-border/70 p-2 bg-muted/20"
                      >
                        <span
                          class="text-xs font-mono text-muted-foreground w-6 text-center"
                        >
                          #{{ optIdx + 1 }}
                        </span>
                        <div class="flex-1 flex items-center gap-2">
                          <NInput
                            v-model:value="opt.label"
                            size="small"
                            placeholder="选项标签 (Label)，如 启用"
                          />
                          <NInput
                            :value="String(opt.value ?? '')"
                            size="small"
                            placeholder="存储值 (Value)，如 1"
                            @update:value="
                              (val) =>
                                onOptionValueChange(optIdx, val, 'search')
                            "
                          />
                        </div>
                        <NButton
                          size="tiny"
                          quaternary
                          type="error"
                          @click="removeOption(optIdx, 'search')"
                        >
                          ✕
                        </NButton>
                      </div>
                    </div>
                  </div>
                </NFormItemGi>
              </template>
            </NGrid>
          </NForm>
        </NTabPane>

        <!-- 表单组件 (新增/编辑) -->
        <NTabPane name="form" tab="表单组件">
          <NForm label-placement="left" label-width="120" class="pt-2">
            <NGrid :cols="24" :x-gap="16">
              <NFormItemGi :span="12" label="在表单中编辑">
                <NSwitch v-model:value="currentField.editable" />
              </NFormItemGi>

              <NFormItemGi :span="12" label="表单录入组件">
                <NSelect
                  :value="currentField.formComp"
                  :options="formCompOptions"
                  @update:value="onFormCompChange"
                />
              </NFormItemGi>

              <NFormItemGi :span="12" label="表单默认值">
                <NInput
                  v-model:value="currentField.default"
                  placeholder="未填写时为 null / 空"
                />
              </NFormItemGi>

              <NFormItemGi :span="12" label="是否必填">
                <div class="flex items-center gap-2">
                  <NSwitch
                    :value="isDbNotNull ? true : Boolean(currentField.required)"
                    :disabled="isDbNotNull"
                    @update:value="(val) => (currentField.required = val)"
                  />
                  <span class="text-xs text-muted-foreground">
                    {{
                      isDbNotNull
                        ? '数据库非空列，不可关闭必填'
                        : '控制表单与接口是否必填'
                    }}
                  </span>
                </div>
              </NFormItemGi>

              <NFormItemGi :span="24" label="常用正则校验">
                <NSelect
                  v-model:value="currentField.rules"
                  :options="validationRuleOptions"
                  multiple
                  clearable
                  filterable
                  placeholder="可多选常用正则规则（非必填字段仅在填写值时触发正则校验）"
                />
              </NFormItemGi>

              <!-- 固定选项配置 (单选框组、普通下拉选择等) -->
              <NFormItemGi v-if="needOptions" :span="24">
                <div class="flex flex-col gap-2 w-full pt-1">
                  <div class="flex items-center justify-between border-b pb-2">
                    <div class="flex items-center gap-2">
                      <span class="text-sm font-medium">
                        选项数据配置 (Options)
                      </span>
                      <span class="text-xs text-muted-foreground">
                        配置单选或下拉的选项条目
                      </span>
                    </div>
                    <NSpace size="small">
                      <NButton
                        size="tiny"
                        quaternary
                        type="primary"
                        @click="applyPresetOptions('status')"
                      >
                        预设: 状态(1/0)
                      </NButton>
                      <NButton
                        size="tiny"
                        quaternary
                        type="primary"
                        @click="applyPresetOptions('gender')"
                      >
                        预设: 性别(1/2)
                      </NButton>
                      <NButton
                        size="tiny"
                        quaternary
                        type="primary"
                        @click="applyPresetOptions('yesno')"
                      >
                        预设: 是/否(1/0)
                      </NButton>
                      <NButton
                        size="tiny"
                        dashed
                        type="primary"
                        @click="addOption('field')"
                      >
                        + 添加选项
                      </NButton>
                    </NSpace>
                  </div>

                  <div
                    v-if="
                      !currentField.optionData ||
                      currentField.optionData.length === 0
                    "
                    class="py-4 text-center text-xs text-muted-foreground"
                  >
                    暂未配置选项数据，点击右上角快速添加或选择常用预设
                  </div>

                  <div v-else class="flex flex-col gap-2 mt-1">
                    <div
                      v-for="(opt, optIdx) in currentField.optionData"
                      :key="optIdx"
                      class="flex items-center gap-2 rounded border border-border/70 p-2 bg-muted/20"
                    >
                      <span
                        class="text-xs font-mono text-muted-foreground w-6 text-center"
                      >
                        #{{ optIdx + 1 }}
                      </span>
                      <div class="flex-1 flex items-center gap-2">
                        <NInput
                          v-model:value="opt.label"
                          size="small"
                          placeholder="选项标签 (Label)，如 启用"
                        />
                        <NInput
                          :value="String(opt.value ?? '')"
                          size="small"
                          placeholder="存储值 (Value)，如 1"
                          @update:value="
                            (val) => onOptionValueChange(optIdx, val)
                          "
                        />
                      </div>
                      <NButton
                        size="tiny"
                        quaternary
                        type="error"
                        @click="removeOption(optIdx)"
                      >
                        ✕
                      </NButton>
                    </div>
                  </div>
                </div>
              </NFormItemGi>
            </NGrid>
          </NForm>
        </NTabPane>

        <!-- 表关联配置 (自适应外键下拉) -->
        <NTabPane name="relation" tab="表关联配置">
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
                      开启后，表单与搜索栏将自动采用自适应 RelationSelect
                      组件，Model 与表格展示将自动联动对应名称。
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

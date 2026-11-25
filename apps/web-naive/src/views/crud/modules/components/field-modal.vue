<script setup lang="ts">
import type { SelectOption } from 'naive-ui';

import type { Field, FieldShowCondition, SearchOption } from '#/crud/types';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { VbenIcon } from '@vben-core/shadcn-ui';

import cloneDeep from 'lodash.clonedeep';
import {
  NAlert,
  NButton,
  NForm,
  NFormItemGi,
  NGrid,
  NInput,
  NInputNumber,
  NRadioButton,
  NRadioGroup,
  NSelect,
  NSpace,
  NSwitch,
  NTabPane,
  NTabs,
  NTag,
  NTooltip,
} from 'naive-ui';

import { message } from '#/adapter/naive';
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
  { label: 'uint8 (微整数/开关状态)', value: 'uint8' },
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
  { label: 'FileUpload (附件/图片/文件上传)', value: 'FileUpload' },
  { label: 'VbenTiptap (富文本编辑器)', value: 'VbenTiptap' },
  { label: 'NHidden (隐藏表单项)', value: 'NHidden' },
];

// 上传资源类型选项
const uploadTypeOptions: SelectOption[] = [
  { label: '图片 (image/*)', value: 1 },
  { label: '视频 (video/*)', value: 2 },
  { label: '音频 (audio/*)', value: 3 },
  { label: '通用文件/附件 (*/*)', value: 4 },
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
    case 'uint8':
    case 'bool': {
      currentField.value.goType = 'uint8';
      currentField.value.tsType = 'number';
      currentField.value.gormType = 'tinyint';
      currentField.value.formComp = 'NSwitch';
      currentField.value.listComp = 'CellSwitch';
      ensureSwitchFieldOptions();
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

function ensureUploadConfig() {
  if (!currentField.value.upload) {
    currentField.value.upload = {
      multiple: false,
      minCount: 0,
      maxCount: 1,
      type: 1,
      accept: 'image/*',
    };
  }
  return currentField.value.upload;
}

function onUploadMultipleChange(val: boolean) {
  const upload = ensureUploadConfig();
  upload.multiple = val;
  if (val) {
    if (upload.maxCount <= 1) {
      upload.maxCount = 5;
    }
    currentField.value.tsType = 'string[]';
    currentField.value.goType = '[]string';
    currentField.value.gormType = 'json';
  } else {
    upload.maxCount = 1;
    upload.minCount = 0;
    currentField.value.tsType = 'string';
    currentField.value.goType = 'string';
    currentField.value.gormType = 'varchar(255)';
  }
}

function onUploadTypeChange(val: number) {
  const upload = ensureUploadConfig();
  upload.type = val;
  if (val === 1) {
    upload.accept = 'image/*';
  } else if (val === 2) {
    upload.accept = 'video/*';
  } else if (val === 3) {
    upload.accept = 'audio/*';
  } else {
    upload.accept = '';
  }
}

// 表单录入组件联动
function onFormCompChange(val: string) {
  currentField.value.formComp = val;
  if (val === 'FileUpload') {
    currentField.value.isFile = true;
    currentField.value.listComp = 'CellAttachment';
    ensureUploadConfig();
  } else if (val === 'NSwitch') {
    currentField.value.listComp = 'CellSwitch';
    ensureSwitchFieldOptions();
  }
}

// 是否为开关类型字段 (表格组件选为 CellSwitch 或 表单组件选为 NSwitch)
const isSwitchField = computed(() => {
  return (
    currentField.value.listComp === 'CellSwitch' ||
    currentField.value.formComp === 'NSwitch'
  );
});

// 开关固定选项：值固定为 1 和 2，只允许修改 label
function ensureSwitchFieldOptions() {
  const currentOpts = currentField.value.optionData || [];
  const label1 =
    currentOpts.find((o) => o.value === 1 || o.value === '1')?.label ||
    currentOpts[0]?.label ||
    '开启';
  const label2 =
    currentOpts.find(
      (o) =>
        o.value === 2 || o.value === '2' || o.value === 0 || o.value === '0',
    )?.label ||
    currentOpts[1]?.label ||
    '关闭';
  currentField.value.optionType = 1;
  currentField.value.optionData = [
    { label: label1, value: 1 },
    { label: label2, value: 2 },
  ];
  currentField.value.goType = 'uint8';
  currentField.value.tsType = 'number';
  if (
    !currentField.value.gormType ||
    currentField.value.gormType === 'tinyint(1)' ||
    currentField.value.gormType === 'tinyint'
  ) {
    currentField.value.gormType = 'tinyint';
  }
  if (
    !currentField.value.formComp ||
    currentField.value.formComp === 'NInput'
  ) {
    currentField.value.formComp = 'NSwitch';
  }
  const searchHolder = ensureSearchOption();
  if (searchHolder) {
    searchHolder.optionType = 1;
    searchHolder.component = 'NSelect';
    searchHolder.optionData = cloneDeep(currentField.value.optionData);
  }
}

function onListCompChange(val: string) {
  currentField.value.listComp = val;
  if (val === 'CellSwitch') {
    ensureSwitchFieldOptions();
  }
}

function onSwitchLabelChange(index: number, val: string) {
  const searchHolder = ensureSearchOption();
  if (
    searchHolder &&
    Array.isArray(searchHolder.optionData) &&
    searchHolder.optionData[index]
  ) {
    searchHolder.optionData[index].label = val;
  }
}

// 附件/文件标识联动
function onIsFileChange(val: boolean) {
  currentField.value.isFile = val;
  if (val) {
    currentField.value.formComp = 'FileUpload';
    currentField.value.listComp = 'CellAttachment';
    ensureUploadConfig();
  }
}

const isDbNotNull = computed(() => !currentField.value.nullable);

function onNullableChange(val: boolean) {
  currentField.value.nullable = val;
  if (!val) {
    currentField.value.required = true;
  }
}

// 是否需要配置固定选项 (表单：单选框组、普通下拉或表格 Tag/开关，且未开启表关联)
const needOptions = computed(() => {
  return (
    (currentField.value.formComp === 'NRadioGroup' ||
      currentField.value.formComp === 'NSelect' ||
      currentField.value.formComp === 'NSelectMultiple' ||
      currentField.value.formComp === 'NSwitch' ||
      currentField.value.listComp === 'CellSwitch' ||
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

// 搜索选项是否单独自定义（默认 false，继承字段通用选项）
const customSearchOptions = ref(false);

// 供搜索区域展示与操作的选项数据源
const activeSearchOptions = computed(() => {
  if (customSearchOptions.value) {
    return firstSearchOption.value.optionData || [];
  }
  return currentField.value.optionData || [];
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

// 同步通用选项到搜索配置（当未开启独立自定义时）
function syncSharedOptions() {
  if (!customSearchOptions.value) {
    const searchHolder = ensureSearchOption();
    if (searchHolder) {
      searchHolder.optionType = currentField.value.optionType || 1;
      searchHolder.optionData = cloneDeep(currentField.value.optionData || []);
    }
  }
}

function onCustomSearchOptionsChange(val: boolean) {
  customSearchOptions.value = val;
  const searchHolder = ensureSearchOption();
  if (!searchHolder) return;
  if (val) {
    if (!searchHolder.optionData || searchHolder.optionData.length === 0) {
      searchHolder.optionData = cloneDeep(currentField.value.optionData || []);
    }
    searchHolder.optionType = currentField.value.optionType || 1;
  } else {
    searchHolder.optionData = cloneDeep(currentField.value.optionData || []);
    searchHolder.optionType = currentField.value.optionType || 1;
  }
}

function resetSearchOptionsFromField() {
  const searchHolder = ensureSearchOption();
  if (!searchHolder) return;
  searchHolder.optionData = cloneDeep(currentField.value.optionData || []);
  searchHolder.optionType = currentField.value.optionType || 1;
  message.success('已从字段通用选项重置搜索选项');
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
  if (isSwitchField.value) return;
  const actualTarget =
    target === 'search' && !customSearchOptions.value ? 'field' : target;
  const holder = ensureOptionTarget(actualTarget);
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
  if (actualTarget === 'field') {
    syncSharedOptions();
  }
}

function removeOption(index: number, target: 'field' | 'search' = 'field') {
  if (isSwitchField.value) return;
  const actualTarget =
    target === 'search' && !customSearchOptions.value ? 'field' : target;
  const holder = ensureOptionTarget(actualTarget);
  if (holder && Array.isArray(holder.optionData)) {
    holder.optionData.splice(index, 1);
  }
  if (actualTarget === 'field') {
    syncSharedOptions();
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
  if (isSwitchField.value) return;
  const actualTarget =
    target === 'search' && !customSearchOptions.value ? 'field' : target;
  const holder = ensureOptionTarget(actualTarget);
  const optionItem = holder?.optionData?.[index];
  if (!optionItem) return;
  optionItem.value = parseOptionValueByGoType(val, currentField.value.goType);
  if (actualTarget === 'field') {
    syncSharedOptions();
  }
}

function applyPresetOptions(
  type: 'gender' | 'status' | 'yesno',
  target: 'field' | 'search' = 'field',
) {
  const actualTarget =
    target === 'search' && !customSearchOptions.value ? 'field' : target;
  const holder = ensureOptionTarget(actualTarget);
  if (!holder) return;
  const isString = currentField.value.goType === 'string';
  holder.optionType = 1;
  if (type === 'status') {
    holder.optionData = [
      { label: '启用', value: isString ? '1' : 1 },
      { label: '禁用', value: isString ? '2' : 2 },
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
  if (actualTarget === 'field') {
    syncSharedOptions();
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

const allFields = ref<Field[]>([]);

const condOpOptions: SelectOption[] = [
  { label: '等于 (==)', value: 'eq' },
  { label: '不等于 (!=)', value: 'ne' },
  { label: '包含于 (in)', value: 'in' },
  { label: '不包含于 (notIn)', value: 'notIn' },
];

const availableDepFields = computed(() => {
  const selfKey = (
    currentField.value.tsName ||
    currentField.value.name ||
    ''
  ).toLowerCase();
  return allFields.value
    .filter((f) => {
      const k = (f.tsName || f.name || '').toLowerCase();
      return Boolean(k && k !== selfKey && f.editable);
    })
    .map((f) => ({
      label: `${f.label || f.name} (${f.tsName || f.name})`,
      value: f.tsName || f.name,
    }));
});

function getDepField(fieldName: string): Field | undefined {
  const lower = (fieldName || '').toLowerCase();
  return allFields.value.find(
    (f) => (f.tsName || f.name || '').toLowerCase() === lower,
  );
}

function getDepFieldOptions(fieldName: string) {
  const f = getDepField(fieldName);
  if (Array.isArray(f?.optionData) && f.optionData.length > 0) {
    return f.optionData.map((opt) => ({
      label: opt.label,
      value: opt.value,
    }));
  }
  return [];
}

function ensureShowWhen() {
  if (!currentField.value.showWhen) {
    currentField.value.showWhen = {
      enable: false,
      logic: 'and',
      conditions: [],
      clearOnHide: true,
    };
  }
  if (!Array.isArray(currentField.value.showWhen.conditions)) {
    currentField.value.showWhen.conditions = [];
  }
}

function onToggleShowWhen(val: boolean) {
  ensureShowWhen();
  if (currentField.value.showWhen) {
    currentField.value.showWhen.enable = val;
    if (val && currentField.value.showWhen.conditions.length === 0) {
      addCondition();
    }
  }
}

function addCondition() {
  ensureShowWhen();
  const defaultField = availableDepFields.value[0]?.value || '';
  const depOpts = getDepFieldOptions(defaultField);
  currentField.value.showWhen?.conditions.push({
    field: defaultField,
    op: 'eq',
    value: depOpts.length > 0 ? depOpts[0]?.value : undefined,
  });
}

function removeCondition(index: number) {
  if (currentField.value.showWhen?.conditions) {
    currentField.value.showWhen.conditions.splice(index, 1);
    if (currentField.value.showWhen.conditions.length === 0) {
      currentField.value.showWhen.enable = false;
    }
  }
}

function onCondFieldChange(cond: FieldShowCondition) {
  const depOpts = getDepFieldOptions(cond.field);
  if (depOpts.length > 0) {
    if (cond.op === 'in' || cond.op === 'notIn') {
      cond.value = depOpts[0] ? [depOpts[0].value] : [];
    } else {
      cond.value = depOpts[0]?.value;
    }
  } else {
    cond.value = undefined;
  }
}

function onCondOpChange(cond: FieldShowCondition) {
  if (cond.op === 'in' || cond.op === 'notIn') {
    if (!Array.isArray(cond.value)) {
      cond.value =
        cond.value !== undefined && cond.value !== null && cond.value !== ''
          ? [cond.value]
          : [];
    }
  } else if (Array.isArray(cond.value)) {
    cond.value = cond.value[0];
  }
}

function formatCondInputValue(val: any): string {
  if (val === undefined || val === null) return '';
  return String(val);
}

function onCondInputValueChange(cond: FieldShowCondition, val: string) {
  if (cond.op === 'in' || cond.op === 'notIn') {
    cond.value = val
      ? val
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
          .map((s) => (/^-?\d+$/.test(s) ? Number(s) : s))
      : [];
  } else if (/^-?\d+$/.test(val.trim())) {
    cond.value = Number(val.trim());
  } else {
    cond.value = val;
  }
}

const [Modal, modalApi] = useVbenModal<{
  allFields?: Field[];
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
    // 表单动态显示条件规范化：未开启或无有效条件时移除
    if (saved.showWhen) {
      if (
        !saved.showWhen.enable ||
        !saved.showWhen.conditions ||
        saved.showWhen.conditions.length === 0
      ) {
        delete (saved as any).showWhen;
      } else {
        saved.showWhen.conditions = saved.showWhen.conditions.filter((c) =>
          Boolean(c.field),
        );
        if (saved.showWhen.conditions.length === 0) {
          delete (saved as any).showWhen;
        }
      }
    }
    // 未开启独立自定义时，确保搜索项选项与字段通用选项保持完全同步
    if (!customSearchOptions.value && saved.searchData?.[0]) {
      saved.searchData[0].optionData = cloneDeep(saved.optionData || []);
      saved.searchData[0].optionType = saved.optionType || 1;
    }
    // 若通用选项为空但搜索项有选项，补全给通用选项
    if (
      (!saved.optionData || saved.optionData.length === 0) &&
      saved.searchData?.[0]?.optionData?.length
    ) {
      saved.optionData = cloneDeep(saved.searchData[0].optionData);
      saved.optionType = saved.searchData[0].optionType || 1;
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
      allFields.value = payload?.allFields || [];
      if (payload && payload.field) {
        currentField.value = cloneDeep(payload.field);
        if (!Array.isArray(currentField.value.optionData)) {
          currentField.value.optionData = [];
        }
        currentField.value.isFile = Boolean(currentField.value.isFile);
        editingIndex.value = payload.index;
        if (currentField.value.showWhen) {
          if (!Array.isArray(currentField.value.showWhen.conditions)) {
            currentField.value.showWhen.conditions = [];
          }
          if (currentField.value.showWhen.clearOnHide === undefined) {
            currentField.value.showWhen.clearOnHide = true;
          }
          if (!currentField.value.showWhen.logic) {
            currentField.value.showWhen.logic = 'and';
          }
        }

        // 搜索选项与字段通用选项初始化对齐
        const searchHolder = currentField.value.searchData?.[0];
        const hasFieldOpts =
          Array.isArray(currentField.value.optionData) &&
          currentField.value.optionData.length > 0;
        const hasSearchOpts =
          Array.isArray(searchHolder?.optionData) &&
          searchHolder.optionData.length > 0;

        if (!hasFieldOpts && hasSearchOpts && searchHolder) {
          // 仅搜索有选项（如历史单边配置），自动提升为通用选项
          currentField.value.optionData = cloneDeep(searchHolder.optionData);
          currentField.value.optionType = searchHolder.optionType || 1;
          customSearchOptions.value = false;
        } else if (hasFieldOpts && hasSearchOpts && searchHolder) {
          const isDiff =
            JSON.stringify(currentField.value.optionData) !==
            JSON.stringify(searchHolder.optionData);
          customSearchOptions.value = isDiff;
        } else {
          customSearchOptions.value = false;
          if (hasFieldOpts && searchHolder) {
            searchHolder.optionData = cloneDeep(currentField.value.optionData);
            searchHolder.optionType = currentField.value.optionType || 1;
          }
        }
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
        if (
          currentField.value.listComp === 'CellSwitch' ||
          currentField.value.formComp === 'NSwitch'
        ) {
          ensureSwitchFieldOptions();
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
        if (!currentField.value.upload) {
          currentField.value.upload = {
            multiple: false,
            minCount: 0,
            maxCount: 1,
            type: 1,
            accept: 'image/*',
          };
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
                  @update:value="onListCompChange"
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
                        <NTag
                          :type="customSearchOptions ? 'warning' : 'info'"
                          size="small"
                        >
                          {{
                            customSearchOptions
                              ? '搜索独立自定义模式'
                              : '默认继承字段通用选项'
                          }}
                        </NTag>
                      </div>
                      <div class="flex items-center gap-3">
                        <div class="flex items-center gap-1.5">
                          <span class="text-xs text-muted-foreground">
                            搜索单独配置
                          </span>
                          <NSwitch
                            :value="customSearchOptions"
                            size="small"
                            @update:value="onCustomSearchOptionsChange"
                          />
                        </div>
                        <template v-if="isSwitchField">
                          <NTag type="info" size="small">
                            开关固定选项：值固定为 1 和 2，仅可自定义文字
                          </NTag>
                        </template>
                        <NSpace v-else size="small">
                          <NButton
                            v-if="customSearchOptions"
                            size="tiny"
                            quaternary
                            type="warning"
                            @click="resetSearchOptionsFromField"
                          >
                            从通用选项重置
                          </NButton>
                          <NButton
                            size="tiny"
                            quaternary
                            type="primary"
                            @click="
                              applyPresetOptions(
                                'status',
                                customSearchOptions ? 'search' : 'field',
                              )
                            "
                          >
                            预设: 状态(1/2)
                          </NButton>
                          <NButton
                            size="tiny"
                            quaternary
                            type="primary"
                            @click="
                              applyPresetOptions(
                                'gender',
                                customSearchOptions ? 'search' : 'field',
                              )
                            "
                          >
                            预设: 性别(1/2)
                          </NButton>
                          <NButton
                            size="tiny"
                            quaternary
                            type="primary"
                            @click="
                              applyPresetOptions(
                                'yesno',
                                customSearchOptions ? 'search' : 'field',
                              )
                            "
                          >
                            预设: 是/否(1/0)
                          </NButton>
                          <NButton
                            size="tiny"
                            dashed
                            type="primary"
                            @click="
                              addOption(
                                customSearchOptions ? 'search' : 'field',
                              )
                            "
                          >
                            + 添加选项
                          </NButton>
                        </NSpace>
                      </div>
                    </div>

                    <!-- 模式说明提示 -->
                    <div
                      v-if="!customSearchOptions"
                      class="text-xs text-muted-foreground flex items-center gap-1.5 py-1 bg-muted/30 px-2 rounded"
                    >
                      <VbenIcon
                        icon="carbon:information"
                        class="text-primary text-sm flex-shrink-0"
                      />
                      <span>
                        当前为<b>默认继承模式</b>：在此处配置将<b>自动同步至表单录入组件与列表 Tag</b>，无需二次配置；若该字段搜索需要专属过滤选项，可开启右上角【搜索单独配置】。
                      </span>
                    </div>
                    <div
                      v-else
                      class="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5 py-1 bg-amber-500/10 px-2 rounded"
                    >
                      <VbenIcon
                        icon="carbon:warning"
                        class="text-amber-500 text-sm flex-shrink-0"
                      />
                      <span>
                        当前已开启<b>搜索独立自定义模式</b>：在此配置的选项仅用于搜索下拉，不会覆盖表单录入与列表
                        Tag 配置。
                      </span>
                    </div>

                    <div
                      v-if="
                        !activeSearchOptions || activeSearchOptions.length === 0
                      "
                      class="py-4 text-center text-xs text-muted-foreground"
                    >
                      {{
                        customSearchOptions
                          ? '暂未配置独立搜索选项，可点击右上角快速添加或选择常用预设'
                          : '暂无选项数据，可点击右上角添加或选择预设（将同时作为表单与搜索选项）'
                      }}
                    </div>

                    <div v-else class="flex flex-col gap-2 mt-1">
                      <div
                        v-for="(opt, optIdx) in activeSearchOptions"
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
                            @update:value="
                              () => {
                                if (!customSearchOptions) syncSharedOptions();
                              }
                            "
                          />
                          <NInput
                            :value="String(opt.value ?? '')"
                            :disabled="isSwitchField"
                            size="small"
                            placeholder="存储值 (Value)，如 1"
                            @update:value="
                              (val) =>
                                onOptionValueChange(
                                  optIdx,
                                  val,
                                  customSearchOptions ? 'search' : 'field',
                                )
                            "
                          />
                        </div>
                        <NButton
                          v-if="!isSwitchField"
                          size="tiny"
                          quaternary
                          type="error"
                          @click="
                            removeOption(
                              optIdx,
                              customSearchOptions ? 'search' : 'field',
                            )
                          "
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

              <!-- 表单动态显示条件 (v-if) -->
              <NFormItemGi :span="24" label="表单显示条件">
                <div
                  class="flex flex-col gap-3 w-full border border-border/70 rounded-lg p-3 bg-muted/20"
                >
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <NSwitch
                        :value="currentField.showWhen?.enable ?? false"
                        @update:value="onToggleShowWhen"
                      />
                      <span class="text-sm font-medium">
                        启用动态显示条件 (v-if)
                      </span>
                      <span class="text-xs text-muted-foreground">
                        默认一直显示；开启后可配置根据其他表单字段值联动显隐
                      </span>
                    </div>
                    <div
                      v-if="currentField.showWhen?.enable"
                      class="flex items-center gap-2"
                    >
                      <NSwitch
                        v-model:value="currentField.showWhen.clearOnHide"
                      />
                      <span class="text-xs text-muted-foreground">
                        隐藏时清空字段值
                      </span>
                    </div>
                  </div>

                  <!-- 条件明细列表 -->
                  <template v-if="currentField.showWhen?.enable">
                    <div
                      v-if="availableDepFields.length === 0"
                      class="text-xs text-amber-500 py-1"
                    >
                      暂无其他可用表单字段供联动
                    </div>
                    <template v-else>
                      <div
                        v-if="currentField.showWhen.conditions.length > 1"
                        class="flex items-center gap-2 pt-1 pb-1"
                      >
                        <span class="text-xs text-muted-foreground">
                          多条件组合逻辑：
                        </span>
                        <NRadioGroup
                          v-model:value="currentField.showWhen.logic"
                          size="small"
                        >
                          <NRadioButton value="and">
                            且 (AND - 全部满足)
                          </NRadioButton>
                          <NRadioButton value="or">
                            或 (OR - 任一满足)
                          </NRadioButton>
                        </NRadioGroup>
                      </div>

                      <div class="flex flex-col gap-2">
                        <div
                          v-for="(cond, cIdx) in currentField.showWhen
                            .conditions"
                          :key="cIdx"
                          class="flex items-center gap-2 bg-background p-2 rounded border border-border/60"
                        >
                          <span
                            class="text-xs font-mono text-muted-foreground shrink-0 w-6 text-center"
                          >
                            #{{ cIdx + 1 }}
                          </span>
                          <!-- 依赖字段选择 (固定宽度外层容器，避免内部 NSelect 默认 100% 撑爆整行) -->
                          <div class="w-44 shrink-0" style="width: 176px">
                            <NSelect
                              v-model:value="cond.field"
                              :options="availableDepFields"
                              size="small"
                              filterable
                              placeholder="选择依赖字段"
                              @update:value="() => onCondFieldChange(cond)"
                            />
                          </div>
                          <!-- 比较关系 (固定宽度外层容器) -->
                          <div class="w-36 shrink-0" style="width: 144px">
                            <NSelect
                              v-model:value="cond.op"
                              :options="condOpOptions"
                              size="small"
                              @update:value="() => onCondOpChange(cond)"
                            />
                          </div>
                          <!-- 期望匹配值控件: 占满剩余全部空间 -->
                          <div class="flex-1 min-w-0">
                            <!-- 若依赖字段配置了选项，直接渲染下拉项选择（单选/多选） -->
                            <NSelect
                              v-if="getDepFieldOptions(cond.field).length > 0"
                              v-model:value="cond.value"
                              :options="getDepFieldOptions(cond.field)"
                              :multiple="
                                cond.op === 'in' || cond.op === 'notIn'
                              "
                              size="small"
                              clearable
                              filterable
                              placeholder="选择匹配选项"
                            />
                            <!-- 否则作为普通输入框 -->
                            <NInput
                              v-else
                              :value="formatCondInputValue(cond.value)"
                              size="small"
                              placeholder="输入匹配值（多值逗号隔开）"
                              @update:value="
                                (val) => onCondInputValueChange(cond, val)
                              "
                            />
                          </div>
                          <!-- 删除单条条件 -->
                          <NButton
                            quaternary
                            circle
                            type="error"
                            size="small"
                            class="shrink-0"
                            title="删除条件"
                            @click="removeCondition(cIdx)"
                          >
                            <template #icon>
                              <VbenIcon
                                icon="lucide:trash-2"
                                class="size-3.5"
                              />
                            </template>
                          </NButton>
                        </div>
                      </div>

                      <div class="pt-1">
                        <NButton
                          dashed
                          block
                          size="small"
                          type="primary"
                          @click="addCondition"
                        >
                          + 添加显示条件
                        </NButton>
                      </div>
                    </template>
                  </template>
                </div>
              </NFormItemGi>

              <!-- 上传组件专属配置 (FileUpload / isFile) -->
              <NFormItemGi
                v-if="
                  currentField.formComp === 'FileUpload' || currentField.isFile
                "
                :span="24"
              >
                <div
                  class="flex flex-col gap-3 w-full rounded border border-border/70 p-3 bg-muted/20"
                >
                  <div class="flex items-center justify-between border-b pb-2">
                    <span class="text-sm font-medium">
                      上传组件配置 (FileUpload)
                    </span>
                    <span class="text-xs text-muted-foreground">
                      配置上传模式、文件类型及数量限制
                    </span>
                  </div>

                  <NGrid :cols="24" :x-gap="12">
                    <NFormItemGi :span="12" label="上传模式">
                      <div class="flex items-center gap-2">
                        <NSwitch
                          :value="currentField.upload?.multiple ?? false"
                          @update:value="onUploadMultipleChange"
                        />
                        <span class="text-xs font-semibold">
                          {{
                            currentField.upload?.multiple
                              ? '多图 / 多文件'
                              : '单图 / 单文件'
                          }}
                        </span>
                      </div>
                    </NFormItemGi>

                    <NFormItemGi :span="12" label="资源类型">
                      <NSelect
                        :value="currentField.upload?.type ?? 1"
                        :options="uploadTypeOptions"
                        @update:value="onUploadTypeChange"
                      />
                    </NFormItemGi>

                    <template v-if="currentField.upload?.multiple">
                      <NFormItemGi :span="12" label="最少上传数量 (minCount)">
                        <NInputNumber
                          :value="currentField.upload?.minCount ?? 0"
                          :min="0"
                          :max="currentField.upload?.maxCount ?? 5"
                          class="w-full"
                          placeholder="最少选择数量，0 表示不限"
                          @update:value="
                            (val) => {
                              const u = ensureUploadConfig();
                              u.minCount = Number(val || 0);
                            }
                          "
                        />
                      </NFormItemGi>

                      <NFormItemGi :span="12" label="最多上传数量 (maxCount)">
                        <NInputNumber
                          :value="currentField.upload?.maxCount ?? 5"
                          :min="2"
                          :max="99"
                          class="w-full"
                          placeholder="最多选择数量，如 5"
                          @update:value="
                            (val) => {
                              const u = ensureUploadConfig();
                              u.maxCount = Number(val || 5);
                            }
                          "
                        />
                      </NFormItemGi>
                    </template>
                  </NGrid>
                </div>
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
                    <template v-if="isSwitchField">
                      <NTag type="info" size="small">
                        开关固定选项：值固定为 1 和 2，仅可自定义文字
                      </NTag>
                    </template>
                    <NSpace v-else size="small">
                      <NButton
                        size="tiny"
                        quaternary
                        type="primary"
                        @click="applyPresetOptions('status')"
                      >
                        预设: 状态(1/2)
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
                          @update:value="
                            (val) => {
                              if (isSwitchField) {
                                onSwitchLabelChange(optIdx, val);
                              } else {
                                syncSharedOptions();
                              }
                            }
                          "
                        />
                        <NInput
                          :value="String(opt.value ?? '')"
                          :disabled="isSwitchField"
                          size="small"
                          placeholder="存储值 (Value)，如 1"
                          @update:value="
                            (val) => onOptionValueChange(optIdx, val)
                          "
                        />
                      </div>
                      <NButton
                        v-if="!isSwitchField"
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

<script setup lang="ts">
import type { FormInst, FormRules, FormValidationError } from 'naive-ui';

import type { SystemConfigApi } from '#/api/system/config';

import { computed, onMounted, reactive, ref, useTemplateRef } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';

import {
  NButton,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NRadio,
  NRadioGroup,
  NSelect,
  NSpace,
  NSwitch,
} from 'naive-ui';

import {
  systemConfigCreateApi,
  systemConfigListApi,
  systemConfigUpdateApi,
} from '#/api/system/config';
import { systemConfigCategoryAllApi } from '#/api/system/config-category';
import StatusRadios from '#/components/common/StatusRadios.vue';
import { handleFormError, isEmpty, showFormMessage } from '#/utils/tools';

interface OptionItem {
  label: string;
  value: string;
}

const emits = defineEmits<{
  (e: 'success'): void;
}>();

const componentTypeOptions = [
  { label: '单行文本 (input)', value: 'input' },
  { label: '多行文本 (textarea)', value: 'textarea' },
  { label: '数字输入 (number)', value: 'number' },
  { label: '开关 (switch)', value: 'switch' },
  { label: '单选按钮 (radio)', value: 'radio' },
  { label: '下拉选择 (select)', value: 'select' },
  { label: '单图上传 (upload_image)', value: 'upload_image' },
  { label: '文件附件 (upload_file)', value: 'upload_file' },
  { label: '日期时间 (date)', value: 'date' },
  { label: '富文本编辑器 (editor)', value: 'editor' },
];

const categoryOptions = ref<{ label: string; value: number }[]>([]);
const allConfigs = ref<SystemConfigApi.SystemConfig[]>([]);

const defaultFormData: Partial<SystemConfigApi.SystemConfig> = {
  id: 0,
  categoryId: undefined,
  name: '',
  key: '',
  value: '',
  componentType: 'input',
  options: '',
  extra: '',
  sort: 0,
  status: 1,
  isSystem: 0,
};

const loading = ref<boolean>(false);
const formRef = useTemplateRef<FormInst>('form');
const formData = ref<Partial<SystemConfigApi.SystemConfig>>({
  ...defaultFormData,
});

// 候选字典 (options) 可视化状态
const optionsList = ref<OptionItem[]>([]);
const optionsMode = ref<'json' | 'visual'>('visual');

// 扩展属性 (extra) 可视化状态
const extraModel = reactive({
  placeholder: '',
  tip: '',
  unit: '',
  rows: 3,
  maxCount: 5,
  enableShowCondition: false,
  showKey: '',
  showOp: 'eq',
  showValue: '',
});
const extraMode = ref<'json' | 'visual'>('visual');

const rules: FormRules = {
  categoryId: [
    {
      required: true,
      type: 'number',
      message: $t('common.validate.required', [$t('system.config.category')]),
      trigger: ['blur', 'change'],
    },
  ],
  name: [
    {
      required: true,
      message: $t('common.validate.required', [$t('system.config.name')]),
      trigger: ['blur', 'input'],
    },
  ],
  key: [
    {
      required: true,
      message: $t('common.validate.required', [$t('system.config.key')]),
      trigger: ['blur', 'input'],
    },
  ],
  componentType: [
    {
      required: true,
      message: $t('common.validate.required', [
        $t('system.config.componentType'),
      ]),
      trigger: ['blur', 'change'],
    },
  ],
};

// 过滤出供依赖选择的其他配置项列表 (排除自身)
const dependencyConfigOptions = computed(() => {
  return allConfigs.value
    .filter((c) => !formData.value?.id || c.id !== formData.value.id)
    .map((c) => ({
      label: `${c.name} (${c.key})`,
      value: c.key,
    }));
});

// 当前选中的依赖配置项
const selectedDependencyConfig = computed(() => {
  if (!extraModel.showKey) return null;
  return allConfigs.value.find((c) => c.key === extraModel.showKey) || null;
});

// 当选中的依赖项自身有候选项 options 或是 switch 时，自动提供下拉选项供快捷勾选
const dependencyValueOptions = computed(() => {
  if (!selectedDependencyConfig.value) return [];
  const comp = selectedDependencyConfig.value;
  if (comp.componentType === 'switch') {
    return [
      { label: '开启 (1)', value: '1' },
      { label: '关闭 (0)', value: '0' },
    ];
  }
  if (comp.options) {
    try {
      const parsed = JSON.parse(comp.options);
      if (Array.isArray(parsed)) {
        return parsed.map((item: any) => ({
          label: `${item.label} (${item.value})`,
          value: String(item.value),
        }));
      }
    } catch {}
  }
  return [];
});

async function loadCategories() {
  try {
    const list = await systemConfigCategoryAllApi();
    categoryOptions.value = list.map((c) => ({
      label: c.name,
      value: c.id,
    }));
  } catch (error) {
    console.error('Failed to load categories', error);
  }
}

async function loadAllConfigs() {
  try {
    const res = await systemConfigListApi({ pageSize: 1000 });
    allConfigs.value = res.items || [];
  } catch (error) {
    console.error('Failed to load all configs', error);
  }
}

// 候选字典操作
function addOption() {
  optionsList.value.push({ label: '', value: '' });
}

function removeOption(index: number) {
  optionsList.value.splice(index, 1);
}

function toggleOptionsMode() {
  if (optionsMode.value === 'visual') {
    const valid = optionsList.value.filter((o) => o.label || o.value);
    formData.value.options =
      valid.length > 0 ? JSON.stringify(valid, null, 2) : '';
    optionsMode.value = 'json';
  } else {
    try {
      if (formData.value.options) {
        const parsed = JSON.parse(formData.value.options);
        if (Array.isArray(parsed)) {
          optionsList.value = parsed.map((p) => ({
            label: String(p.label ?? ''),
            value: String(p.value ?? ''),
          }));
        }
      } else {
        optionsList.value = [];
      }
    } catch {
      optionsList.value = [];
    }
    optionsMode.value = 'visual';
  }
}

// 扩展属性同步
function syncJsonToExtraModel() {
  if (!formData.value.extra) {
    extraModel.placeholder = '';
    extraModel.tip = '';
    extraModel.unit = '';
    extraModel.rows = 3;
    extraModel.maxCount = 5;
    extraModel.enableShowCondition = false;
    extraModel.showKey = '';
    extraModel.showOp = 'eq';
    extraModel.showValue = '';
    return;
  }
  try {
    const parsed = JSON.parse(formData.value.extra);
    extraModel.placeholder = parsed.placeholder || '';
    extraModel.tip = parsed.tip || '';
    extraModel.unit = parsed.unit || '';
    extraModel.rows = parsed.rows || 3;
    extraModel.maxCount = parsed.maxCount || 5;
    if (parsed.show && typeof parsed.show === 'object') {
      extraModel.enableShowCondition = true;
      extraModel.showKey = parsed.show.key || '';
      extraModel.showOp = parsed.show.op || 'eq';
      extraModel.showValue =
        parsed.show.value === undefined ? '' : String(parsed.show.value);
    } else {
      extraModel.enableShowCondition = false;
      extraModel.showKey = '';
      extraModel.showOp = 'eq';
      extraModel.showValue = '';
    }
  } catch {
    extraModel.enableShowCondition = false;
  }
}

function syncExtraModelToJson() {
  const extraObj: Record<string, any> = {};
  if (extraModel.placeholder?.trim()) {
    extraObj.placeholder = extraModel.placeholder.trim();
  }
  if (extraModel.tip?.trim()) {
    extraObj.tip = extraModel.tip.trim();
  }
  if (extraModel.unit?.trim()) {
    extraObj.unit = extraModel.unit.trim();
  }
  if (formData.value.componentType === 'textarea' && extraModel.rows) {
    extraObj.rows = extraModel.rows;
  }
  if (formData.value.componentType === 'upload_file' && extraModel.maxCount) {
    extraObj.maxCount = extraModel.maxCount;
  }
  if (extraModel.enableShowCondition && extraModel.showKey) {
    extraObj.show = {
      key: extraModel.showKey,
      op: extraModel.showOp || 'eq',
      value: extraModel.showValue,
    };
  }
  formData.value.extra =
    Object.keys(extraObj).length > 0 ? JSON.stringify(extraObj) : '';
}

function toggleExtraMode() {
  if (extraMode.value === 'visual') {
    syncExtraModelToJson();
    extraMode.value = 'json';
  } else {
    syncJsonToExtraModel();
    extraMode.value = 'visual';
  }
}

onMounted(() => {
  loadCategories();
});

const [Modal, modalApi] = useVbenModal({
  onConfirm: formConfirm,
  onOpenChange: async (isOpen) => {
    if (isOpen) {
      await Promise.all([loadCategories(), loadAllConfigs()]);
      const data = modalApi.getData() as SystemConfigApi.SystemConfig;
      formData.value = isEmpty(data) ? { ...defaultFormData } : { ...data };

      // 初始化候选字典
      optionsMode.value = 'visual';
      if (formData.value.options) {
        try {
          const parsed = JSON.parse(formData.value.options);
          Array.isArray(parsed)
            ? (optionsList.value = parsed.map((p) => ({
                label: String(p.label ?? ''),
                value: String(p.value ?? ''),
              })))
            : (optionsList.value = []);
        } catch {
          optionsList.value = [];
          optionsMode.value = 'json';
        }
      } else {
        optionsList.value = [
          { label: '', value: '' },
          { label: '', value: '' },
        ];
      }

      // 初始化扩展属性
      extraMode.value = 'visual';
      syncJsonToExtraModel();
    }
  },
});

function formConfirm() {
  formRef.value
    ?.validate()
    .then(async () => {
      // 准备 options
      if (
        (formData.value.componentType === 'select' ||
          formData.value.componentType === 'radio') &&
        optionsMode.value === 'visual'
      ) {
        const valid = optionsList.value.filter(
          (o) => o.label.trim() || o.value.trim(),
        );
        formData.value.options = valid.length > 0 ? JSON.stringify(valid) : '';
      }

      // 准备 extra
      if (extraMode.value === 'visual') {
        syncExtraModelToJson();
      }

      loading.value = true;
      try {
        await (formData.value?.id
          ? systemConfigUpdateApi(formData.value.id, formData.value)
          : systemConfigCreateApi(formData.value));
        await modalApi.close();
        emits('success');
        showFormMessage(formData.value?.id);
      } catch (error: any) {
        handleFormError(error);
      } finally {
        loading.value = false;
      }
    })
    .catch((error: Array<FormValidationError>) => {
      console.warn('Form validation failed:', error);
    });
}
</script>

<template>
  <Modal
    :title="
      formData.id
        ? `${$t('common.edit')} ${$t('system.config.title')}`
        : `${$t('common.create')} ${$t('system.config.title')}`
    "
    class="w-[760px]"
  >
    <NForm
      ref="form"
      :model="formData"
      :rules="rules"
      label-placement="left"
      label-width="120px"
      require-mark-placement="left"
    >
      <NFormItem :label="$t('system.config.category')" path="categoryId">
        <NSelect
          v-model:value="formData.categoryId"
          :options="categoryOptions"
          placeholder="请选择配置所属分类"
        />
      </NFormItem>

      <NFormItem :label="$t('system.config.name')" path="name">
        <NInput
          v-model:value="formData.name"
          placeholder="如：网站名称、站点Logo"
        />
      </NFormItem>

      <NFormItem :label="$t('system.config.key')" path="key">
        <NInput
          v-model:value="formData.key"
          :disabled="formData.isSystem === 1"
          placeholder="如：site_name (英文字母/下划线唯一)"
        />
      </NFormItem>

      <NFormItem
        :label="$t('system.config.componentType')"
        path="componentType"
      >
        <NSelect
          v-model:value="formData.componentType"
          :options="componentTypeOptions"
        />
      </NFormItem>

      <!-- 下拉/单选专用候选项配置 -->
      <NFormItem
        v-if="
          formData.componentType === 'select' ||
          formData.componentType === 'radio'
        "
        :label="$t('system.config.options')"
        path="options"
      >
        <div class="w-full flex flex-col gap-2">
          <div class="flex items-center justify-between text-xs text-gray-500">
            <span>配置选项列表 (Label 显示文本 / Value 选项值)</span>
            <NButton text type="primary" size="tiny" @click="toggleOptionsMode">
              {{
                optionsMode === 'visual'
                  ? '切换为 JSON 模式'
                  : '切换为可视化表格'
              }}
            </NButton>
          </div>

          <!-- 可视化模式 -->
          <template v-if="optionsMode === 'visual'">
            <div
              class="border rounded-md p-3 bg-gray-50/60 dark:bg-gray-800/40 flex flex-col gap-2"
            >
              <div
                v-for="(item, idx) in optionsList"
                :key="idx"
                class="flex items-center gap-2"
              >
                <NInput
                  v-model:value="item.label"
                  placeholder="选项文本 (如：阿里云OSS)"
                  size="small"
                  class="flex-1"
                />
                <NInput
                  v-model:value="item.value"
                  placeholder="选项值 (如：aliyun)"
                  size="small"
                  class="flex-1"
                />
                <NButton
                  text
                  type="error"
                  size="small"
                  :disabled="optionsList.length <= 1"
                  @click="removeOption(idx)"
                >
                  删除
                </NButton>
              </div>

              <NButton
                dashed
                type="primary"
                size="small"
                block
                class="mt-1"
                @click="addOption"
              >
                + 添加选项
              </NButton>
            </div>
          </template>

          <!-- JSON 模式 -->
          <template v-else>
            <NInput
              v-model:value="formData.options"
              type="textarea"
              :rows="4"
              placeholder="JSON格式，例如：[{&quot;label&quot;:&quot;选项一&quot;,&quot;value&quot;:&quot;1&quot;},{&quot;label&quot;:&quot;选项二&quot;,&quot;value&quot;:&quot;2&quot;}]"
            />
          </template>
        </div>
      </NFormItem>

      <!-- 额外属性扩展配置 -->
      <NFormItem :label="$t('system.config.extra')" path="extra">
        <div class="w-full flex flex-col gap-2">
          <div class="flex items-center justify-between text-xs text-gray-500">
            <span>配置附加提示、单位或联动显示条件</span>
            <NButton text type="primary" size="tiny" @click="toggleExtraMode">
              {{
                extraMode === 'visual' ? '切换为 JSON 模式' : '切换为可视化配置'
              }}
            </NButton>
          </div>

          <!-- 可视化模式 -->
          <template v-if="extraMode === 'visual'">
            <div
              class="border rounded-md p-3 bg-gray-50/60 dark:bg-gray-800/40 flex flex-col gap-3"
            >
              <!-- 占位与说明 -->
              <div class="grid grid-cols-2 gap-3">
                <div class="flex flex-col gap-1">
                  <span class="text-xs text-gray-500">
                    占位提示 (placeholder)
                  </span>
                  <NInput
                    v-model:value="extraModel.placeholder"
                    size="small"
                    placeholder="如：请输入网站名称"
                  />
                </div>
                <div class="flex flex-col gap-1">
                  <span class="text-xs text-gray-500">辅助说明 (tip)</span>
                  <NInput
                    v-model:value="extraModel.tip"
                    size="small"
                    placeholder="如：关闭后前台将提示维护中"
                  />
                </div>
              </div>

              <!-- 类型特定配置 -->
              <div
                v-if="
                  formData.componentType === 'number' ||
                  formData.componentType === 'input'
                "
                class="flex flex-col gap-1"
              >
                <span class="text-xs text-gray-500">单位后缀 (unit)</span>
                <NInput
                  v-model:value="extraModel.unit"
                  size="small"
                  placeholder="如：MB、秒、条、次"
                />
              </div>

              <div
                v-if="formData.componentType === 'textarea'"
                class="flex flex-col gap-1"
              >
                <span class="text-xs text-gray-500">行数 (rows)</span>
                <NInputNumber
                  v-model:value="extraModel.rows"
                  size="small"
                  :min="1"
                  :max="20"
                />
              </div>

              <div
                v-if="formData.componentType === 'upload_file'"
                class="flex flex-col gap-1"
              >
                <span class="text-xs text-gray-500">最大文件数 (maxCount)</span>
                <NInputNumber
                  v-model:value="extraModel.maxCount"
                  size="small"
                  :min="1"
                  :max="50"
                />
              </div>

              <!-- 联动显示条件 -->
              <div class="border-t pt-2.5 mt-1 flex flex-col gap-2">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span
                      class="text-xs font-medium text-gray-700 dark:text-gray-200"
                    >
                      条件显示 (联动显隐)
                    </span>
                    <NSwitch
                      v-model:value="extraModel.enableShowCondition"
                      size="small"
                    />
                  </div>
                  <span class="text-[11px] text-gray-400">
                    仅当满足指定条件时才在配置页面显示此项
                  </span>
                </div>

                <div
                  v-if="extraModel.enableShowCondition"
                  class="p-2.5 rounded bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 flex flex-col gap-2.5 mt-1"
                >
                  <div class="grid grid-cols-2 gap-2">
                    <div class="flex flex-col gap-1">
                      <span class="text-xs text-gray-500">依赖配置项</span>
                      <NSelect
                        v-model:value="extraModel.showKey"
                        :options="dependencyConfigOptions"
                        size="small"
                        filterable
                        clearable
                        placeholder="选择依赖项 (如: 存储驱动)"
                      />
                    </div>
                    <div class="flex flex-col gap-1">
                      <span class="text-xs text-gray-500">匹配规则</span>
                      <NSelect
                        v-model:value="extraModel.showOp"
                        :options="[
                          { label: '等于 (=)', value: 'eq' },
                          { label: '不等于 (!=)', value: 'neq' },
                        ]"
                        size="small"
                      />
                    </div>
                  </div>

                  <div class="flex flex-col gap-1">
                    <span class="text-xs text-gray-500">
                      满足触发的值
                      <template v-if="dependencyValueOptions.length > 0">
                        (已检测到依赖项候选项，可直接点选)
                      </template>
                    </span>

                    <!-- 如果依赖项自身有候选项字典或者是 switch，提供下拉选择 -->
                    <NSelect
                      v-if="dependencyValueOptions.length > 0"
                      v-model:value="extraModel.showValue"
                      :options="dependencyValueOptions"
                      size="small"
                      placeholder="请选择触发显示的对应值"
                      clearable
                      filterable
                      tag
                    />
                    <!-- 否则提供常规输入框 -->
                    <NInput
                      v-else
                      v-model:value="extraModel.showValue"
                      size="small"
                      placeholder="请输入匹配值，如: aliyun"
                      clearable
                    />
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- JSON 模式 -->
          <template v-else>
            <NInput
              v-model:value="formData.extra"
              type="textarea"
              :rows="4"
              placeholder="JSON格式，例如：{&quot;placeholder&quot;:&quot;请输入...&quot;,&quot;tip&quot;:&quot;辅助说明&quot;,&quot;unit&quot;:&quot;MB&quot;,&quot;show&quot;:{&quot;key&quot;:&quot;upload_storage_driver&quot;,&quot;value&quot;:&quot;aliyun&quot;}}"
            />
          </template>
        </div>
      </NFormItem>

      <NFormItem :label="$t('system.config.value')" path="value">
        <NInput
          v-model:value="formData.value"
          type="textarea"
          :rows="2"
          placeholder="配置默认初始值"
        />
      </NFormItem>

      <NFormItem :label="$t('system.config.sort')" path="sort">
        <NInputNumber v-model:value="formData.sort" :min="0" class="w-full" />
      </NFormItem>

      <NFormItem :label="$t('common.status')" path="status">
        <StatusRadios v-model:status="formData.status" />
      </NFormItem>

      <NFormItem :label="$t('system.config.isSystem')" path="isSystem">
        <NRadioGroup
          v-model:value="formData.isSystem"
          :disabled="formData.id ? formData.isSystem === 1 : false"
        >
          <NSpace>
            <NRadio :value="0">否 (用户自定义，可删除)</NRadio>
            <NRadio :value="1">是 (系统内置，不可删除且Key只读)</NRadio>
          </NSpace>
        </NRadioGroup>
      </NFormItem>
    </NForm>
  </Modal>
</template>

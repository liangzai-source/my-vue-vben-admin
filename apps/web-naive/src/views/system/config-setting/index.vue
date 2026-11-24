<script setup lang="ts">
import type { SystemConfigApi } from '#/api/system/config';

import { onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { $t } from '@vben/locales';
import { VbenTiptap } from '@vben/plugins/tiptap';

import {
  NButton,
  NCard,
  NDatePicker,
  NForm,
  NFormItemGi,
  NGrid,
  NInput,
  NInputNumber,
  NRadio,
  NRadioGroup,
  NSelect,
  NSpace,
  NSpin,
  NSwitch,
  NTabPane,
  NTabs,
  useMessage,
} from 'naive-ui';

import {
  systemConfigBatchSaveApi,
  systemConfigSettingsApi,
} from '#/api/system/config';
import FileUpload from '#/components/common/upload/file-upload.vue';
import { checkPermission } from '#/utils/access';

const message = useMessage();
const loading = ref<boolean>(false);
const saving = ref<boolean>(false);

const categories = ref<SystemConfigApi.SettingCategory[]>([]);
const activeTab = ref<string>('');

// 表单值收集字典 (key => string)
const formValues = reactive<Record<string, any>>({});

// 安全解析 JSON
function parseJson(str: string, defaultVal: any = null) {
  if (!str) return defaultVal;
  try {
    return JSON.parse(str);
  } catch {
    return defaultVal;
  }
}

// 检查配置项是否满足显示条件
function isItemVisible(item: SystemConfigApi.SystemConfig): boolean {
  const extra = parseJson(item.extra);
  if (!extra || !extra.show) return true;

  const { key, op = 'eq', value } = extra.show;
  if (!key) return true;

  const currentVal = formValues[key];
  const currStr =
    currentVal === null || currentVal === undefined ? '' : String(currentVal);
  const targetStr = value === null || value === undefined ? '' : String(value);

  if (op === 'eq' || op === '=') {
    return currStr === targetStr;
  }
  if (op === 'neq' || op === '!=') {
    return currStr !== targetStr;
  }
  if (op === 'in') {
    if (Array.isArray(value)) {
      return value.map(String).includes(currStr);
    }
    return currStr === targetStr;
  }
  return true;
}

// 检查某个分类下是否有可见的配置项
function hasVisibleItems(cat: SystemConfigApi.SettingCategory): boolean {
  if (!cat.items || cat.items.length === 0) return false;
  return cat.items.some((item) => isItemVisible(item));
}

// 加载配置
async function loadSettings() {
  loading.value = true;
  try {
    const data = await systemConfigSettingsApi();
    categories.value = data || [];
    if (categories.value.length > 0 && !activeTab.value) {
      activeTab.value = String(categories.value[0]?.id || '');
    }

    // 初始化所有配置项的值
    for (const cat of categories.value) {
      for (const item of cat.items) {
        if (item.componentType === 'number') {
          formValues[item.key] = item.value === '' ? null : Number(item.value);
        } else {
          formValues[item.key] = item.value ?? '';
        }
      }
    }
  } catch (error: any) {
    message.error(error?.message || '加载系统配置失败');
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadSettings();
});

// 保存配置
async function handleSave() {
  saving.value = true;
  try {
    // 构造 payload
    const payload: Record<string, string> = {};
    for (const k of Object.keys(formValues)) {
      const val = formValues[k];
      payload[k] = val === null || val === undefined ? '' : String(val);
    }

    await systemConfigBatchSaveApi(payload);
    message.success($t('system.configSetting.saveSuccess') || '配置保存成功');
    // 重新加载保证数据同步
    await loadSettings();
  } catch (error: any) {
    message.error(error?.message || '配置保存失败');
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <Page auto-content-height>
    <NSpin :show="loading">
      <NCard :bordered="false" class="h-full rounded-lg shadow-sm">
        <NTabs
          v-if="categories.length > 0"
          v-model:value="activeTab"
          type="line"
          animated
        >
          <NTabPane
            v-for="cat in categories"
            :key="cat.id"
            :name="String(cat.id)"
            :tab="cat.name"
          >
            <div class="py-4 max-w-4xl">
              <div
                v-if="!hasVisibleItems(cat)"
                class="py-12 text-center text-gray-400"
              >
                当前分类暂无可配置项。
              </div>

              <NForm
                v-else
                label-placement="left"
                label-width="160px"
                require-mark-placement="left"
              >
                <NGrid :cols="24" :x-gap="16" :y-gap="12">
                  <template v-for="item in cat.items" :key="item.id">
                    <NFormItemGi
                      v-if="isItemVisible(item)"
                      :span="
                        item.componentType === 'editor' ||
                        item.componentType === 'textarea'
                          ? 24
                          : 24
                      "
                      :label="item.name"
                    >
                      <div class="w-full flex flex-col gap-1">
                        <!-- 单行文本 -->
                        <template v-if="item.componentType === 'input'">
                          <NInput
                            v-model:value="formValues[item.key]"
                            :placeholder="
                              parseJson(item.extra)?.placeholder ||
                              `请输入${item.name}`
                            "
                            clearable
                          >
                            <template
                              v-if="parseJson(item.extra)?.unit"
                              #suffix
                            >
                              {{ parseJson(item.extra).unit }}
                            </template>
                          </NInput>
                        </template>

                        <!-- 多行文本 -->
                        <template v-else-if="item.componentType === 'textarea'">
                          <NInput
                            v-model:value="formValues[item.key]"
                            type="textarea"
                            :rows="parseJson(item.extra)?.rows || 3"
                            :placeholder="
                              parseJson(item.extra)?.placeholder ||
                              `请输入${item.name}`
                            "
                          />
                        </template>

                        <!-- 数字输入 -->
                        <template v-else-if="item.componentType === 'number'">
                          <NInputNumber
                            v-model:value="formValues[item.key]"
                            :placeholder="
                              parseJson(item.extra)?.placeholder || '请输入数字'
                            "
                            class="w-full"
                          >
                            <template
                              v-if="parseJson(item.extra)?.unit"
                              #suffix
                            >
                              {{ parseJson(item.extra).unit }}
                            </template>
                          </NInputNumber>
                        </template>

                        <!-- 开关 -->
                        <template v-else-if="item.componentType === 'switch'">
                          <div class="flex items-center gap-3 self-start">
                            <NSwitch
                              v-model:value="formValues[item.key]"
                              checked-value="1"
                              unchecked-value="0"
                            >
                              <template #checked>开启</template>
                              <template #unchecked>关闭</template>
                            </NSwitch>
                            <span
                              v-if="parseJson(item.extra)?.tip"
                              class="text-xs text-gray-400"
                            >
                              {{ parseJson(item.extra).tip }}
                            </span>
                          </div>
                        </template>

                        <!-- 单选框 -->
                        <template v-else-if="item.componentType === 'radio'">
                          <NRadioGroup
                            v-model:value="formValues[item.key]"
                            class="self-start"
                          >
                            <NSpace>
                              <NRadio
                                v-for="(opt, optIdx) in parseJson(
                                  item.options,
                                  [],
                                )"
                                :key="optIdx"
                                :value="String(opt.value)"
                              >
                                {{ opt.label }}
                              </NRadio>
                            </NSpace>
                          </NRadioGroup>
                        </template>

                        <!-- 下拉选择 -->
                        <template v-else-if="item.componentType === 'select'">
                          <NSelect
                            v-model:value="formValues[item.key]"
                            :options="parseJson(item.options, [])"
                            :placeholder="
                              parseJson(item.extra)?.placeholder || '请选择'
                            "
                            clearable
                          />
                        </template>

                        <!-- 单图片上传 -->
                        <template
                          v-else-if="item.componentType === 'upload_image'"
                        >
                          <FileUpload
                            v-model="formValues[item.key]"
                            :type="1"
                            :max-count="1"
                          />
                        </template>

                        <!-- 多文件/附件上传 -->
                        <template
                          v-else-if="item.componentType === 'upload_file'"
                        >
                          <FileUpload
                            v-model="formValues[item.key]"
                            :type="4"
                            :max-count="parseJson(item.extra)?.maxCount || 5"
                          />
                        </template>

                        <!-- 日期时间 -->
                        <template v-else-if="item.componentType === 'date'">
                          <NDatePicker
                            v-model:formatted-value="formValues[item.key]"
                            value-format="yyyy-MM-dd HH:mm:ss"
                            type="datetime"
                            clearable
                            class="w-full"
                          />
                        </template>

                        <!-- 富文本编辑器 -->
                        <template v-else-if="item.componentType === 'editor'">
                          <div
                            class="border rounded-md overflow-hidden min-h-[300px]"
                          >
                            <VbenTiptap v-model="formValues[item.key]" />
                          </div>
                        </template>

                        <!-- 默认降级 -->
                        <template v-else>
                          <NInput
                            v-model:value="formValues[item.key]"
                            clearable
                          />
                        </template>

                        <!-- 辅助说明 tip (非 switch 组件在下方显示) -->
                        <div
                          v-if="
                            item.componentType !== 'switch' &&
                            parseJson(item.extra)?.tip
                          "
                          class="text-xs text-gray-400 mt-1"
                        >
                          {{ parseJson(item.extra).tip }}
                        </div>
                      </div>
                    </NFormItemGi>
                  </template>
                </NGrid>

                <!-- 保存按钮 -->
                <div class="mt-6 pt-4 border-t flex items-center gap-3">
                  <NButton
                    v-if="checkPermission('system:config-setting:save')"
                    type="primary"
                    :loading="saving"
                    @click="handleSave"
                  >
                    {{ $t('system.configSetting.save') || '保存配置' }}
                  </NButton>
                  <span class="text-xs text-gray-400">
                    保存后立即生效并同步刷新后台内存缓存
                  </span>
                </div>
              </NForm>
            </div>
          </NTabPane>
        </NTabs>
      </NCard>
    </NSpin>
  </Page>
</template>

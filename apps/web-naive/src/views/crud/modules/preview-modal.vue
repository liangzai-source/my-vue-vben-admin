<script setup lang="ts">
import type { DevCrudApi } from '#/api/dev/crud';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { useClipboard } from '@vueuse/core';
import {
  NButton,
  NCode,
  NEmpty,
  NScrollbar,
  NSpace,
  NTabPane,
  NTabs,
  NTag,
} from 'naive-ui';

import { message } from '#/adapter/naive';

const previews = ref<DevCrudApi.FilePreview[]>([]);
const activeTab = ref<string>('');

const activeFile = computed(() => {
  return (
    previews.value.find((p) => p.name === activeTab.value) || previews.value[0]
  );
});

const { copy, isSupported } = useClipboard();

const [Modal, modalApi] = useVbenModal<DevCrudApi.FilePreview[]>({
  onOpenChange: (isOpen) => {
    if (isOpen) {
      const data = modalApi.getData();
      if (Array.isArray(data) && data.length > 0) {
        previews.value = data;
        activeTab.value = data[0]?.name ?? '';
      }
    }
  },
});

async function onCopyCode() {
  if (!activeFile.value?.content) return;
  if (!isSupported) {
    message.warning('您的浏览器不支持直接复制');
    return;
  }
  await copy(activeFile.value.content);
  message.success(`已复制 [${activeFile.value.name}] 代码`);
}

async function onCopyPath() {
  if (!activeFile.value?.path) return;
  if (!isSupported) {
    message.warning('您的浏览器不支持直接复制');
    return;
  }
  await copy(activeFile.value.path);
  message.success('已复制目标文件相对路径');
}
</script>

<template>
  <Modal
    class="w-[90vw] max-w-[1300px]"
    title="代码生成预览"
    :show-confirm-button="false"
    cancel-text="关闭"
  >
    <div v-if="previews.length === 0" class="py-12">
      <NEmpty description="暂无预览代码" />
    </div>

    <div v-else class="flex flex-col gap-3">
      <!-- 顶部文件切换 Tabs -->
      <NTabs
        v-model:value="activeTab"
        type="card"
        size="small"
        class="border-b pb-2"
      >
        <NTabPane
          v-for="item in previews"
          :key="item.name"
          :name="item.name"
          :tab="item.name"
        />
      </NTabs>

      <!-- 选中文件路径与操作栏 -->
      <div
        v-if="activeFile"
        class="flex flex-wrap items-center justify-between rounded bg-muted/40 p-2.5 text-sm"
      >
        <div class="flex items-center gap-2">
          <span class="text-muted-foreground font-medium">目标路径:</span>
          <NTag type="info" size="small" class="font-mono">
            {{ activeFile.path }}
          </NTag>
        </div>

        <NSpace size="small">
          <NButton size="tiny" secondary @click="onCopyPath">
            复制路径
          </NButton>
          <NButton size="tiny" type="primary" @click="onCopyCode">
            复制代码
          </NButton>
        </NSpace>
      </div>

      <!-- 代码高亮查看区域 -->
      <div
        v-if="activeFile"
        class="overflow-hidden rounded border border-neutral-700 bg-[#1e1e1e]"
      >
        <NScrollbar class="h-[520px] p-4 text-xs font-mono">
          <NCode
            :code="activeFile.content"
            :language="activeFile.lang"
            show-line-numbers
          />
        </NScrollbar>
      </div>
    </div>
  </Modal>
</template>

<style scoped></style>

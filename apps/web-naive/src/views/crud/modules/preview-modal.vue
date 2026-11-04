<script setup lang="ts">
import type { GlobalThemeOverrides } from 'naive-ui';

import type { DevCrudApi } from '#/api/dev/crud';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { useClipboard } from '@vueuse/core';
import hljs from 'highlight.js/lib/core';
import css from 'highlight.js/lib/languages/css';
import go from 'highlight.js/lib/languages/go';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import sql from 'highlight.js/lib/languages/sql';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';
import {
  darkTheme,
  NButton,
  NCode,
  NConfigProvider,
  NEmpty,
  NScrollbar,
  NSpace,
  NTab,
  NTabs,
  NTag,
} from 'naive-ui';

import { message } from '#/adapter/naive';

import 'highlight.js/styles/atom-one-dark.css';

// 注册所需语言语法高亮支持
hljs.registerLanguage('go', go);
hljs.registerLanguage('golang', go);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('ts', typescript);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('js', javascript);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('vue', xml);
hljs.registerLanguage('json', json);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('css', css);

const darkCodeThemeOverrides: GlobalThemeOverrides = {
  Code: {
    textColor: '#abb2bf',
    lineNumberTextColor: '#5c6370',
  },
};

const previews = ref<DevCrudApi.FilePreview[]>([]);
const activeTab = ref<string>('');

const activeFile = computed(() => {
  return (
    previews.value.find((p) => p.path === activeTab.value) || previews.value[0]
  );
});

const { copy, isSupported } = useClipboard();

const [Modal, modalApi] = useVbenModal<DevCrudApi.FilePreview[]>({
  onOpenChange: (isOpen) => {
    if (isOpen) {
      const data = modalApi.getData();
      if (Array.isArray(data) && data.length > 0) {
        previews.value = data;
        activeTab.value = data[0]?.path ?? '';
      }
    }
  },
});

function getFileName(filePath: string): string {
  if (!filePath) return '';
  const parts = filePath.split('/');
  return parts[parts.length - 1] || filePath;
}

function getFileLanguage(file: DevCrudApi.FilePreview): string {
  if (!file) return 'typescript';
  if (file.lang === 'vue') return 'vue';
  if (file.lang === 'go') return 'go';
  if (file.lang === 'typescript') return 'typescript';
  return file.lang || 'typescript';
}

async function onCopyCode() {
  if (!activeFile.value?.content) return;
  if (!isSupported) {
    message.warning('您的浏览器不支持直接复制');
    return;
  }
  await copy(activeFile.value.content);
  message.success(`已复制 [${getFileName(activeFile.value.path)}] 代码`);
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
      <!-- 顶部文件切换 Tabs：显示具体文件名 + 模块说明 -->
      <NTabs
        v-model:value="activeTab"
        type="card"
        size="small"
        class="border-b pb-1"
      >
        <NTab v-for="item in previews" :key="item.path" :name="item.path">
          <div class="flex items-center gap-1.5 py-0.5">
            <span class="font-medium text-foreground">
              {{ getFileName(item.path) }}
            </span>
            <span class="text-xs text-muted-foreground">
              ({{ item.name }})
            </span>
          </div>
        </NTab>
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
          <NTag type="success" size="small" class="font-mono">
            {{ activeFile.name }}
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

      <!-- 代码高亮查看区域（配置暗黑主题 Provider 与高对比度样式） -->
      <div
        v-if="activeFile"
        class="overflow-hidden rounded border border-neutral-700 bg-[#282c34]"
      >
        <NConfigProvider
          :theme="darkTheme"
          :theme-overrides="darkCodeThemeOverrides"
        >
          <NScrollbar class="h-[540px] p-4 text-xs font-mono">
            <NCode
              :key="activeFile.path"
              :hljs="hljs"
              :code="activeFile.content"
              :language="getFileLanguage(activeFile)"
              show-line-numbers
            />
          </NScrollbar>
        </NConfigProvider>
      </div>
    </div>
  </Modal>
</template>

<style scoped>
:deep(.n-code) {
  --n-text-color: #abb2bf !important;
  --n-line-number-text-color: #5c6370 !important;

  color: #abb2bf;
}

:deep(.n-code pre) {
  background-color: transparent !important;
}

:deep(.n-code .n-code__line-numbers) {
  color: #5c6370 !important;
}

:deep(.n-code code) {
  font-family: 'Fira Code', Menlo, Monaco, Consolas, 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
}
</style>

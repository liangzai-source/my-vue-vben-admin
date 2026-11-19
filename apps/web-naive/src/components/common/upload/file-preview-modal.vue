<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import { VbenIcon } from '@vben-core/shadcn-ui';

import { NButton, NModal } from 'naive-ui';

import { getFileUrl } from '#/api/system/upload';
import {
  downloadFile,
  formatFileSize,
  getFileVisual,
  openExternalUrl,
} from '#/utils/fileHelper';

export interface FilePreviewTarget {
  ext?: string;
  name?: string;
  size?: number;
  storage?: string;
  type?: number;
  url: string;
}

const props = withDefaults(
  defineProps<{
    file?: FilePreviewTarget | null;
    show?: boolean;
  }>(),
  {
    file: null,
    show: false,
  },
);

const emit = defineEmits<{
  (e: 'update:show', val: boolean): void;
}>();

const visible = ref(props.show);
const currentItem = ref<FilePreviewTarget | null>(props.file);

watch(
  () => props.show,
  (val) => {
    visible.value = val;
  },
);

watch(
  () => props.file,
  (val) => {
    currentItem.value = val;
  },
);

watch(visible, (val) => {
  emit('update:show', val);
  if (!val) {
    currentItem.value = null;
  }
});

const resolvedUrl = computed(() => {
  return currentItem.value ? getFileUrl(currentItem.value.url) : '';
});

const resolvedName = computed(() => {
  if (!currentItem.value) return '附件预览';
  return (
    currentItem.value.name ||
    currentItem.value.url.split('/').pop() ||
    '附件预览'
  );
});

const cleanExt = computed(() => {
  if (!currentItem.value) return '';
  if (currentItem.value.ext) {
    return currentItem.value.ext.toLowerCase().replace('.', '');
  }
  const match = currentItem.value.url.match(/\.([a-zA-Z0-9]+)$/);
  return match ? match[1]?.toLowerCase() || '' : '';
});

const isVideo = computed(() => {
  if (!currentItem.value) return false;
  return (
    currentItem.value.type === 2 ||
    ['mp4', 'ogv', 'webm'].includes(cleanExt.value)
  );
});

const isAudio = computed(() => {
  if (!currentItem.value) return false;
  return (
    currentItem.value.type === 3 ||
    ['aac', 'flac', 'mp3', 'ogg', 'wav'].includes(cleanExt.value)
  );
});

const isPdf = computed(() => {
  return (
    cleanExt.value === 'pdf' ||
    (currentItem.value
      ? currentItem.value.url.toLowerCase().endsWith('.pdf')
      : false)
  );
});

const modalClass = computed(() => {
  if (isVideo.value) return 'w-[760px] max-w-[94vw]';
  if (isPdf.value) return 'w-[880px] max-w-[95vw]';
  if (isAudio.value) return 'w-[460px] max-w-[92vw]';
  return 'w-[480px] max-w-[92vw]';
});

function open(
  target: FilePreviewTarget | string,
  name?: string,
  type?: number,
) {
  if (typeof target === 'string') {
    const extMatch = target.match(/\.([a-zA-Z0-9]+)$/);
    const ext = extMatch ? `.${extMatch[1]?.toLowerCase()}` : '';
    currentItem.value = {
      ext,
      name: name || target.split('/').pop() || '附件预览',
      type: type || 4,
      url: target,
    };
  } else {
    currentItem.value = target;
  }
  visible.value = true;
}

function close() {
  visible.value = false;
}

defineExpose({
  close,
  open,
});
</script>

<template>
  <NModal
    v-model:show="visible"
    preset="card"
    :title="resolvedName"
    :class="modalClass"
    :segmented="{ content: true }"
    @after-leave="currentItem = null"
  >
    <div v-if="currentItem && resolvedUrl" class="w-full">
      <!-- 1. 视频预览播放 -->
      <div
        v-if="isVideo"
        class="flex min-h-[300px] items-center justify-center overflow-hidden rounded bg-black"
      >
        <video
          :src="resolvedUrl"
          controls
          autoplay
          playsinline
          class="max-h-[70vh] w-full object-contain"
        ></video>
      </div>

      <!-- 2. 音频试听播放 -->
      <div
        v-else-if="isAudio"
        class="mx-auto flex w-full max-w-md flex-col items-center gap-4 py-6"
      >
        <div
          class="flex size-16 items-center justify-center rounded-full bg-violet-500/10 text-violet-500"
        >
          <VbenIcon icon="lucide:music" class="size-8" />
        </div>
        <span
          class="max-w-[360px] truncate text-center text-sm font-medium text-foreground"
        >
          {{ resolvedName }}
        </span>
        <audio :src="resolvedUrl" controls autoplay class="w-full"></audio>
      </div>

      <!-- 3. PDF 原生嵌入阅读 -->
      <div
        v-else-if="isPdf"
        class="h-[68vh] w-full overflow-hidden rounded bg-muted/20"
      >
        <iframe :src="resolvedUrl" class="size-full border-0"></iframe>
      </div>

      <!-- 4. 其它常规文档/文件卡片与操作 -->
      <div v-else class="flex flex-col items-center gap-4 py-8">
        <div
          class="flex size-20 items-center justify-center rounded-2xl"
          :class="
            getFileVisual(currentItem.ext || '', currentItem.type || 4).bg
          "
        >
          <VbenIcon
            :icon="
              getFileVisual(currentItem.ext || '', currentItem.type || 4).icon
            "
            class="size-10"
            :class="
              getFileVisual(currentItem.ext || '', currentItem.type || 4).color
            "
          />
        </div>
        <div class="flex flex-col items-center gap-1 text-center">
          <span
            class="max-w-[420px] truncate text-base font-semibold text-foreground"
          >
            {{ resolvedName }}
          </span>
          <span class="text-xs text-muted-foreground">
            {{
              currentItem.size && currentItem.size > 0
                ? `体积：${formatFileSize(currentItem.size)}`
                : '文件附件'
            }}{{ currentItem.storage ? ` | 存储：${currentItem.storage}` : '' }}
          </span>
        </div>
        <div class="mt-2 flex items-center gap-3">
          <NButton
            type="primary"
            @click="downloadFile(resolvedUrl, resolvedName)"
          >
            <template #icon>
              <VbenIcon icon="lucide:download" />
            </template>
            下载此文件
          </NButton>
          <NButton secondary @click="openExternalUrl(resolvedUrl)">
            在新标签页打开
          </NButton>
        </div>
      </div>
    </div>
  </NModal>
</template>

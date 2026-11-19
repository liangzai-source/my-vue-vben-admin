<script setup lang="ts">
import type { UploadCustomRequestOptions } from 'naive-ui';

import type { UploadItem } from '#/api/system/upload';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { VbenIcon } from '@vben-core/shadcn-ui';

import {
  NButton,
  NImage,
  NModal,
  NSpace,
  NTooltip,
  NUpload,
  useMessage,
} from 'naive-ui';

import { getFileUrl, uploadFileApi } from '#/api/system/upload';
import { getFileVisual } from '#/utils/fileHelper';
import { captureVideoPoster } from '#/utils/videoPoster';

import MediaModalComponent from './media-modal.vue';

interface Props {
  accept?: string;
  disabled?: boolean;
  maxCount?: number;
  minCount?: number;
  modelValue?: string | string[];
  type?: number; // 1: 图片, 2: 视频, 3: 音频, 4: 文件
}

const props = withDefaults(defineProps<Props>(), {
  accept: '',
  disabled: false,
  maxCount: 1,
  minCount: 0,
  modelValue: '',
  type: 1,
});

const emit = defineEmits<{
  (e: 'change' | 'update:modelValue', val: string | string[]): void;
}>();

const defaultAcceptMap: Record<number, string> = {
  1: 'image/*',
  2: 'video/*',
  3: 'audio/*',
  4: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv',
};

const computedAccept = computed(() => {
  if (props.accept && props.accept.trim()) {
    return props.accept;
  }
  return defaultAcceptMap[props.type] || 'image/*';
});

const message = useMessage();
const uploading = ref(false);

// 本地维护已选/上传文件的元信息，方便横向卡片展示名称、格式与体积
const fileMetaMap = ref<
  Record<string, { ext?: string; originName?: string; size?: number }>
>({});

// 视频预览弹窗
const showVideoModal = ref(false);
const previewVideoUrl = ref('');

function handlePlayVideo(url: string) {
  previewVideoUrl.value = getFileUrl(url);
  showVideoModal.value = true;
}

// 音频试听弹窗
const showAudioModal = ref(false);
const previewAudioUrl = ref('');
const previewAudioTitle = ref('');

function handlePlayAudio(url: string, title?: string) {
  previewAudioUrl.value = getFileUrl(url);
  previewAudioTitle.value = title || '音频试听';
  showAudioModal.value = true;
}

// 文档预览弹窗
const showDocModal = ref(false);
const previewDocUrl = ref('');
const previewDocItem = ref<{
  ext: string;
  isPdf: boolean;
  name: string;
  size?: number;
}>({ ext: '', isPdf: false, name: '' });

function handlePreviewDoc(
  url: string,
  meta: { ext?: string; originName?: string; size?: number },
) {
  previewDocUrl.value = getFileUrl(url);
  const ext = (meta.ext || '').toLowerCase();
  const isPdf = ext === '.pdf' || url.toLowerCase().endsWith('.pdf');
  previewDocItem.value = {
    name: meta.originName || '文档文件',
    ext,
    size: meta.size,
    isPdf,
  };
  showDocModal.value = true;
}

// 通用文件下载
function handleDownloadFile(path: string, fileName?: string) {
  const link = document.createElement('a');
  link.href = getFileUrl(path);
  link.download = fileName || path.split('/').pop() || 'download';
  link.target = '_blank';
  document.body.append(link);
  link.click();
  link.remove();
}

function openExternalUrl(url: string) {
  window.open(url, '_blank');
}

// 提取/推导文件元信息
function getFileMeta(path: string): {
  ext: string;
  originName: string;
  size?: number;
} {
  const cached = fileMetaMap.value[path];
  if (cached) {
    return {
      ext: cached.ext || '',
      originName: cached.originName || path.split('/').pop() || path,
      size: cached.size,
    };
  }
  const fileName = path.split('/').pop() || path;
  const extMatch = path.match(/\.([a-zA-Z0-9]+)$/);
  const ext = extMatch ? `.${extMatch[1]?.toLowerCase()}` : '';
  let originName = fileName;
  if (!ext) {
    originName =
      props.type === 3 ? `音频附件 (${fileName})` : `文档附件 (${fileName})`;
  }
  return {
    ext: ext || (props.type === 3 ? '.mp3' : '.file'),
    originName,
    size: 0,
  };
}

// 格式化文件体积
function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / k ** i).toFixed(1)} ${sizes[i]}`;
}

// 归一化为数组便于统一渲染
const fileList = computed<string[]>(() => {
  if (!props.modelValue) return [];
  if (Array.isArray(props.modelValue)) {
    return props.modelValue.filter(Boolean);
  }
  return [props.modelValue];
});

// 注册媒体库选择弹窗
const [MediaModal, mediaModalApi] = useVbenModal({
  connectedComponent: MediaModalComponent,
  destroyOnClose: true,
});

// 打开媒体库弹窗
function openMediaModal() {
  if (props.disabled) return;
  mediaModalApi
    .setData({
      currentValue: props.modelValue,
      maxCount: props.maxCount,
      type: props.type,
    })
    .open();
}

// 媒体库选中回调
function handleMediaSelected(items: UploadItem[]) {
  for (const item of items) {
    fileMetaMap.value[item.preview] = {
      ext: item.ext,
      originName: item.originName || item.name,
      size: item.size,
    };
  }
  if (props.maxCount > 1) {
    const newPaths = items.map((i) => i.preview);
    emit('update:modelValue', newPaths);
    emit('change', newPaths);
  } else if (items.length > 0) {
    const first = items[0];
    if (first) {
      emit('update:modelValue', first.preview);
      emit('change', first.preview);
    }
  }
}

// 手动上传
async function handleCustomUpload(options: UploadCustomRequestOptions) {
  const rawFile = options.file.file;
  if (!rawFile) return;
  if (props.maxCount > 1 && fileList.value.length >= props.maxCount) {
    message.warning(`最多只能上传 ${props.maxCount} 个文件`);
    return;
  }
  uploading.value = true;
  try {
    let coverFile: File | null = null;
    if (props.type === 2 || rawFile.type.startsWith('video/')) {
      coverFile = await captureVideoPoster(rawFile);
    }
    const res = await uploadFileApi(rawFile, props.type, coverFile);
    message.success('上传成功');

    const fileSize = res.size > 0 ? res.size : rawFile.size;
    fileMetaMap.value[res.preview] = {
      ext: res.ext,
      originName: res.originName || res.name || rawFile.name,
      size: fileSize,
    };

    if (props.maxCount > 1) {
      const merged = [...fileList.value, res.preview];
      emit('update:modelValue', merged);
      emit('change', merged);
    } else {
      emit('update:modelValue', res.preview);
      emit('change', res.preview);
    }
  } catch (error: any) {
    const errorMsg =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      '上传失败';
    message.error(errorMsg);
  } finally {
    uploading.value = false;
  }
}

// 移除文件
function handleRemove(index: number) {
  if (props.disabled) return;
  if (props.maxCount > 1) {
    const updated = [...fileList.value];
    updated.splice(index, 1);
    emit('update:modelValue', updated);
    emit('change', updated);
  } else {
    emit('update:modelValue', '');
    emit('change', '');
  }
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <!-- 弹窗组件挂载 -->
    <MediaModal @select="handleMediaSelected" />

    <!-- 1. 图片与视频：保持方形卡片网格布局 -->
    <div
      v-if="fileList.length > 0 && (type === 1 || type === 2)"
      class="flex flex-wrap items-center gap-3"
    >
      <div
        v-for="(path, idx) in fileList"
        :key="idx"
        class="group relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-md border border-border bg-muted/20"
      >
        <!-- 图片类型展示缩略图 -->
        <NImage
          v-if="type === 1"
          :src="getFileUrl(path)"
          :preview-src="getFileUrl(path)"
          width="100%"
          height="100%"
          object-fit="cover"
          class="h-full w-full [&>img]:h-full [&>img]:w-full [&>img]:object-cover"
          :img-props="{
            style: {
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            },
            class: 'w-full h-full object-cover',
          }"
        />
        <!-- 视频类型展示首帧缩略图与悬停播放操作 -->
        <div
          v-else-if="type === 2"
          class="relative h-full w-full flex items-center justify-center bg-black/85 overflow-hidden"
        >
          <video
            :src="`${getFileUrl(path)}#t=0.5`"
            preload="metadata"
            class="h-full w-full object-cover pointer-events-none"
          ></video>
          <!-- 视频常驻标识 -->
          <div
            class="absolute bottom-1 right-1 z-0 flex items-center rounded bg-black/60 px-1 py-0.5 text-[9px] text-white"
          >
            <VbenIcon icon="lucide:video" class="size-3" />
          </div>

          <!-- 悬停遮罩：播放预览按钮 -->
          <div
            class="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100"
          >
            <button
              type="button"
              class="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white shadow-md hover:scale-110 transition cursor-pointer"
              title="播放预览"
              @click.stop="handlePlayVideo(path)"
            >
              <VbenIcon
                icon="lucide:play"
                class="size-3.5 fill-current ml-0.5"
              />
            </button>
          </div>
        </div>

        <!-- 悬停删除图标 -->
        <button
          v-if="!disabled"
          type="button"
          class="absolute right-1 top-1 z-10 hidden group-hover:flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white text-xs hover:scale-110 shadow cursor-pointer"
          title="移除"
          @click="handleRemove(idx)"
        >
          ×
        </button>
      </div>
    </div>

    <!-- 2. 音频与文件：方案 B 横向附件信息条 -->
    <div
      v-else-if="fileList.length > 0"
      class="flex flex-col gap-2 w-full max-w-md"
    >
      <div
        v-for="(path, idx) in fileList"
        :key="idx"
        class="group relative flex items-center justify-between rounded-lg border border-border bg-card/60 hover:bg-card px-3 py-2 transition hover:shadow-sm"
      >
        <!-- 左侧图标与文件信息 -->
        <div class="flex items-center gap-3 min-w-0 flex-1 mr-2">
          <!-- 类型专属彩色图标 -->
          <div
            class="flex size-9 shrink-0 items-center justify-center rounded-md border"
            :class="[
              getFileVisual(getFileMeta(path).ext, type).bg,
              getFileVisual(getFileMeta(path).ext, type).color,
            ]"
          >
            <VbenIcon
              :icon="getFileVisual(getFileMeta(path).ext, type).icon"
              class="size-5"
            />
          </div>

          <!-- 文件名与格式信息 -->
          <div class="flex flex-col min-w-0 flex-1">
            <NTooltip trigger="hover">
              <template #trigger>
                <span
                  class="truncate text-xs font-medium text-foreground cursor-default"
                >
                  {{ getFileMeta(path).originName }}
                </span>
              </template>
              {{ getFileMeta(path).originName }}
            </NTooltip>
            <div
              class="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5"
            >
              <span class="font-semibold uppercase text-primary/80">
                {{ getFileVisual(getFileMeta(path).ext, type).tag }}
              </span>
              <span v-if="getFileMeta(path).size">
                · {{ formatFileSize(getFileMeta(path).size) }}
              </span>
            </div>
          </div>
        </div>

        <!-- 右侧操作按钮组 -->
        <div class="flex items-center gap-1 shrink-0">
          <!-- 音频试听按钮 -->
          <NTooltip v-if="type === 3" trigger="hover">
            <template #trigger>
              <button
                type="button"
                class="flex size-7 items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer"
                @click="handlePlayAudio(path, getFileMeta(path).originName)"
              >
                <VbenIcon
                  icon="lucide:play"
                  class="size-4 fill-current ml-0.5 text-violet-500"
                />
              </button>
            </template>
            试听音频
          </NTooltip>

          <!-- 文档预览按钮 -->
          <NTooltip v-if="type === 4" trigger="hover">
            <template #trigger>
              <button
                type="button"
                class="flex size-7 items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer"
                @click="handlePreviewDoc(path, getFileMeta(path))"
              >
                <VbenIcon icon="lucide:eye" class="size-4" />
              </button>
            </template>
            预览文档
          </NTooltip>

          <!-- 通用下载按钮 -->
          <NTooltip trigger="hover">
            <template #trigger>
              <button
                type="button"
                class="flex size-7 items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer"
                @click="handleDownloadFile(path, getFileMeta(path).originName)"
              >
                <VbenIcon icon="lucide:download" class="size-4" />
              </button>
            </template>
            下载文件
          </NTooltip>

          <!-- 移除按钮 -->
          <NTooltip v-if="!disabled" trigger="hover">
            <template #trigger>
              <button
                type="button"
                class="flex size-7 items-center justify-center rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition cursor-pointer"
                @click="handleRemove(idx)"
              >
                <VbenIcon icon="lucide:x" class="size-4" />
              </button>
            </template>
            移除
          </NTooltip>
        </div>
      </div>
    </div>

    <!-- 操作按钮区 -->
    <div v-if="!disabled && fileList.length < maxCount">
      <NSpace align="center" size="small">
        <!-- 本地直接上传 -->
        <NUpload
          :show-file-list="false"
          :accept="computedAccept"
          :custom-request="handleCustomUpload"
          :disabled="disabled || uploading"
        >
          <NButton size="small" type="primary" secondary :loading="uploading">
            直接上传
          </NButton>
        </NUpload>

        <!-- 从媒体库中选择 -->
        <NButton
          size="small"
          type="default"
          :disabled="disabled || uploading"
          @click="openMediaModal"
        >
          从媒体库选择
        </NButton>
      </NSpace>
    </div>

    <!-- 视频播放预览弹窗 -->
    <NModal
      v-model:show="showVideoModal"
      preset="card"
      title="视频预览"
      class="w-[720px] max-w-[92vw]"
      :segmented="{ content: true }"
      @after-leave="previewVideoUrl = ''"
    >
      <div
        class="flex items-center justify-center bg-black rounded overflow-hidden min-h-[300px]"
      >
        <video
          v-if="previewVideoUrl"
          :src="previewVideoUrl"
          controls
          autoplay
          playsinline
          class="w-full max-h-[70vh] object-contain"
        ></video>
      </div>
    </NModal>

    <!-- 音频试听播放弹窗 -->
    <NModal
      v-model:show="showAudioModal"
      preset="card"
      title="音频试听"
      class="!w-[460px] max-w-[80vw]"
      :segmented="{ content: true }"
      @after-leave="previewAudioUrl = ''"
    >
      <div class="flex flex-col items-center gap-4 py-4">
        <div
          class="flex size-16 items-center justify-center rounded-full bg-violet-500/10 text-violet-500"
        >
          <VbenIcon icon="lucide:music" class="size-8" />
        </div>
        <span
          class="text-sm font-medium text-foreground text-center truncate max-w-[360px]"
        >
          {{ previewAudioTitle }}
        </span>
        <audio
          v-if="previewAudioUrl"
          :src="previewAudioUrl"
          controls
          autoplay
          class="w-full"
        ></audio>
      </div>
    </NModal>

    <!-- 文档预览弹窗 -->
    <NModal
      v-model:show="showDocModal"
      preset="card"
      :title="previewDocItem.name || '文档预览'"
      :class="
        previewDocItem.isPdf
          ? '!w-[860px] max-w-[90vw]'
          : '!w-[480px] max-w-[80vw]'
      "
      :segmented="{ content: true }"
      @after-leave="previewDocUrl = ''"
    >
      <!-- PDF 嵌入原生阅读器 -->
      <div
        v-if="previewDocItem.isPdf"
        class="h-[68vh] w-full bg-muted/20 rounded overflow-hidden"
      >
        <iframe :src="previewDocUrl" class="w-full h-full border-0"></iframe>
      </div>
      <!-- 其它文件展示详情卡片并提供下载 -->
      <div v-else class="flex flex-col items-center gap-4 py-6">
        <div
          class="flex size-20 items-center justify-center rounded-2xl bg-primary/10 text-primary"
        >
          <VbenIcon icon="lucide:file-text" class="size-10" />
        </div>
        <div class="flex flex-col items-center gap-1 text-center">
          <span
            class="text-base font-semibold text-foreground max-w-[380px] truncate"
          >
            {{ previewDocItem.name }}
          </span>
          <span class="text-xs text-muted-foreground">
            {{
              previewDocItem.size
                ? formatFileSize(previewDocItem.size)
                : '文档文件'
            }}
          </span>
        </div>
        <div class="flex items-center gap-3 mt-2">
          <NButton
            type="primary"
            @click="handleDownloadFile(previewDocUrl, previewDocItem.name)"
          >
            <template #icon>
              <VbenIcon icon="lucide:download" />
            </template>
            下载此文件
          </NButton>
          <NButton secondary @click="openExternalUrl(previewDocUrl)">
            在新标签页打开
          </NButton>
        </div>
      </div>
    </NModal>
  </div>
</template>

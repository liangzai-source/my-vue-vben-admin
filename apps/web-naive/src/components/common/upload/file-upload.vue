<script setup lang="ts">
import type { UploadCustomRequestOptions } from 'naive-ui';

import type { UploadItem } from '#/api/system/upload';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { VbenIcon } from '@vben-core/shadcn-ui';

import {
  NButton,
  NImage,
  NSpace,
  NTooltip,
  NUpload,
  useMessage,
} from 'naive-ui';

import { getFileUrl, uploadFileApi } from '#/api/system/upload';
import {
  DEFAULT_ACCEPT_MAP,
  downloadFile,
  formatFileSize,
  getFileMetaFromPath,
  getFileVisual,
} from '#/utils/fileHelper';
import { captureVideoPoster } from '#/utils/videoPoster';

import FilePreviewModal from './file-preview-modal.vue';
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

const computedAccept = computed(() => {
  if (props.accept && props.accept.trim()) {
    return props.accept;
  }
  return DEFAULT_ACCEPT_MAP[props.type] || 'image/*';
});

const message = useMessage();
const uploading = ref(false);

// 本地维护已选/上传文件的元信息，方便横向卡片展示名称、格式与体积
const fileMetaMap = ref<
  Record<string, { ext?: string; originName?: string; size?: number }>
>({});

// 统一预览弹窗组件引用
const previewModalRef = ref<InstanceType<typeof FilePreviewModal> | null>(null);

function handlePreview(path: string) {
  const meta = getFileMetaFromPath(path, props.type, fileMetaMap.value[path]);
  previewModalRef.value?.open({
    ext: meta.ext,
    name: meta.originName,
    size: meta.size,
    type: props.type,
    url: path,
  });
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
    <FilePreviewModal ref="previewModalRef" />

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
              @click.stop="handlePreview(path)"
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
              getFileVisual(
                getFileMetaFromPath(path, type, fileMetaMap[path]).ext,
                type,
              ).bg,
              getFileVisual(
                getFileMetaFromPath(path, type, fileMetaMap[path]).ext,
                type,
              ).color,
            ]"
          >
            <VbenIcon
              :icon="
                getFileVisual(
                  getFileMetaFromPath(path, type, fileMetaMap[path]).ext,
                  type,
                ).icon
              "
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
                  {{
                    getFileMetaFromPath(path, type, fileMetaMap[path])
                      .originName
                  }}
                </span>
              </template>
              {{
                getFileMetaFromPath(path, type, fileMetaMap[path]).originName
              }}
            </NTooltip>
            <div
              class="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5"
            >
              <span class="font-semibold uppercase text-primary/80">
                {{
                  getFileVisual(
                    getFileMetaFromPath(path, type, fileMetaMap[path]).ext,
                    type,
                  ).tag
                }}
              </span>
              <span
                v-if="
                  getFileMetaFromPath(path, type, fileMetaMap[path]).size &&
                  getFileMetaFromPath(path, type, fileMetaMap[path]).size! > 0
                "
              >
                ·
                {{
                  formatFileSize(
                    getFileMetaFromPath(path, type, fileMetaMap[path]).size,
                  )
                }}
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
                @click="handlePreview(path)"
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
                @click="handlePreview(path)"
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
                @click="
                  downloadFile(
                    path,
                    getFileMetaFromPath(path, type, fileMetaMap[path])
                      .originName,
                  )
                "
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
  </div>
</template>

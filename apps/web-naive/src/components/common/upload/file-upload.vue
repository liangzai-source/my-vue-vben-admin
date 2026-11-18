<script setup lang="ts">
import type { UploadCustomRequestOptions } from 'naive-ui';

import type { UploadItem } from '#/api/system/upload';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { VbenIcon } from '@vben-core/shadcn-ui';

import { NButton, NImage, NModal, NSpace, NUpload, useMessage } from 'naive-ui';

import { getFileUrl, uploadFileApi } from '#/api/system/upload';
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

// 视频预览播放弹窗
const showVideoModal = ref(false);
const previewVideoUrl = ref('');

function handlePlayVideo(url: string) {
  previewVideoUrl.value = getFileUrl(url);
  showVideoModal.value = true;
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
      maxCount: props.maxCount,
      type: props.type,
      currentValue: props.modelValue,
    })
    .open();
}

// 媒体库选中回调
function handleMediaSelected(items: UploadItem[]) {
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

    <!-- 已上传/已选择文件列表预览 -->
    <div v-if="fileList.length > 0" class="flex flex-wrap items-center gap-3">
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
        <!-- 其它文件类型展示文字标识 -->
        <div
          v-else
          class="flex flex-col items-center justify-center p-1 text-center"
        >
          <span class="text-xs font-semibold truncate max-w-[70px]">{{
            path
          }}</span>
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
  </div>
</template>

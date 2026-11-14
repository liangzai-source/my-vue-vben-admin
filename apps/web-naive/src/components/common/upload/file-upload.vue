<script setup lang="ts">
import type { UploadCustomRequestOptions } from 'naive-ui';

import type { UploadItem } from '#/api/system/upload';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { NButton, NImage, NSpace, NUpload, useMessage } from 'naive-ui';

import { getFileUrl, uploadFileApi } from '#/api/system/upload';

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
  accept: 'image/*',
  disabled: false,
  maxCount: 1,
  minCount: 0,
  modelValue: '',
  type: 1,
});

const emit = defineEmits<{
  (e: 'change' | 'update:modelValue', val: string | string[]): void;
}>();

const message = useMessage();
const uploading = ref(false);

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
    const res = await uploadFileApi(rawFile, props.type);
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
    message.error(error.message || '上传失败');
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
          object-fit="cover"
          class="h-full w-full"
        />
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
          class="absolute right-1 top-1 hidden group-hover:flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white text-xs hover:scale-110 shadow"
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
          :accept="accept"
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

<script setup lang="ts">
import type { DevCrudApi } from '#/api/dev/crud';

import { ref, watch } from 'vue';

import {
  NButton,
  NEmpty,
  NInput,
  NModal,
  NScrollbar,
  NSpace,
  NSpin,
  NTag,
} from 'naive-ui';

import { message } from '#/adapter/naive';
import { devCrudListDirsApi } from '#/api/dev/crud';

interface Props {
  initialPath?: string;
  show: boolean;
  title?: string;
}

const props = withDefaults(defineProps<Props>(), {
  initialPath: '',
  title: '选择文件夹',
});

const emit = defineEmits<{
  select: [path: string];
  'update:show': [value: boolean];
}>();

const loading = ref(false);
const currentPath = ref('');
const parentPath = ref('');
const jumpInput = ref('');
const dirs = ref<DevCrudApi.DirItem[]>([]);

async function loadDirs(targetPath?: string) {
  loading.value = true;
  try {
    const res = await devCrudListDirsApi(targetPath);
    currentPath.value = res.currentPath || '';
    parentPath.value = res.parentPath || '';
    jumpInput.value = res.currentPath || '';
    dirs.value = res.dirs || [];
  } catch (error: any) {
    message.error(error?.message || '读取目录失败');
  } finally {
    loading.value = false;
  }
}

watch(
  () => props.show,
  (visible) => {
    if (visible) {
      loadDirs(props.initialPath);
    }
  },
);

function handleClose() {
  emit('update:show', false);
}

function handleEnterDir(dir: DevCrudApi.DirItem) {
  loadDirs(dir.path);
}

function handleGoUp() {
  loadDirs(parentPath.value);
}

function handleGoRoot() {
  loadDirs('');
}

function handleJump() {
  loadDirs(jumpInput.value.trim());
}

function handleConfirm() {
  if (!currentPath.value) {
    message.warning('请先进入具体目录后再确认');
    return;
  }
  emit('select', currentPath.value);
  handleClose();
}
</script>

<template>
  <NModal
    :show="show"
    preset="card"
    :title="title"
    style="width: 640px; max-width: 92vw"
    @update:show="emit('update:show', $event)"
  >
    <div class="flex flex-col gap-3">
      <div class="flex items-center gap-2">
        <NInput
          v-model:value="jumpInput"
          placeholder="输入目录路径后回车或点击跳转"
          clearable
          @keyup.enter="handleJump"
        />
        <NButton @click="handleJump">跳转</NButton>
        <NButton :disabled="!currentPath" @click="handleGoUp">
          上级目录
        </NButton>
        <NButton @click="handleGoRoot">根目录</NButton>
      </div>

      <div class="flex items-center gap-2 text-xs text-gray-500">
        <span>当前位置：</span>
        <NTag size="small" :bordered="false">
          {{ currentPath || '磁盘根目录' }}
        </NTag>
      </div>

      <NSpin :show="loading">
        <NScrollbar
          class="rounded border border-gray-200 dark:border-gray-700"
          style="height: 320px"
        >
          <div
            v-if="dirs.length > 0"
            class="divide-y divide-gray-100 dark:divide-gray-800"
          >
            <div
              v-for="item in dirs"
              :key="item.path"
              class="flex cursor-pointer items-center justify-between px-3 py-2 text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
              @click="handleEnterDir(item)"
            >
              <span class="truncate font-medium">{{ item.name }}</span>
              <span class="shrink-0 text-xs text-gray-400">进入</span>
            </div>
          </div>
          <div v-else class="flex h-[300px] items-center justify-center">
            <NEmpty description="当前目录下没有子文件夹" />
          </div>
        </NScrollbar>
      </NSpin>
    </div>

    <template #footer>
      <div class="flex items-center justify-between">
        <span class="truncate pr-4 text-xs text-gray-500">
          {{
            currentPath
              ? `将选择: ${currentPath}`
              : '请双击或点击进入目标文件夹'
          }}
        </span>
        <NSpace>
          <NButton @click="handleClose">取消</NButton>
          <NButton
            type="primary"
            :disabled="!currentPath"
            @click="handleConfirm"
          >
            选择此文件夹
          </NButton>
        </NSpace>
      </div>
    </template>
  </NModal>
</template>

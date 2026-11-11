<script setup lang="ts">
import type { UploadCustomRequestOptions } from 'naive-ui';

import type { UploadItem } from '#/api/system/upload';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  NButton,
  NEmpty,
  NImage,
  NInput,
  NPagination,
  NRadio,
  NRadioGroup,
  NSpin,
  NUpload,
  useMessage,
} from 'naive-ui';

import { getFileListApi, getFileUrl, uploadFileApi } from '#/api/system/upload';

const emit = defineEmits<{
  (e: 'select', items: UploadItem[]): void;
}>();

const message = useMessage();
const loading = ref(false);
const uploading = ref(false);

const fileList = ref<UploadItem[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(18);
const currentType = ref<number>(0); // 0: 全部, 1: 图片, 2: 视频, 3: 音频, 4: 文件
const keyword = ref('');

// 选中的文件ID列表
const selectedIds = ref<number[]>([]);
const maxCount = ref(1);

const isMultiple = computed(() => maxCount.value > 1);

// 加载文件列表
async function loadFiles() {
  loading.value = true;
  try {
    const res = await getFileListApi({
      page: page.value,
      pageSize: pageSize.value,
      type: currentType.value,
      keyword: keyword.value,
    });
    fileList.value = res.items || [];
    total.value = res.total || 0;
  } catch (error: any) {
    message.error(error.message || '加载媒体库失败');
  } finally {
    loading.value = false;
  }
}

// 切换分类
function handleTypeChange(val: number) {
  currentType.value = val;
  page.value = 1;
  loadFiles();
}

// 搜索
function handleSearch() {
  page.value = 1;
  loadFiles();
}

// 清空搜索框并重新加载
function handleClear() {
  keyword.value = '';
  page.value = 1;
  loadFiles();
}

// 翻页
function handlePageChange(p: number) {
  page.value = p;
  loadFiles();
}

// 选中/取消选中
function toggleSelect(item: UploadItem) {
  if (!isMultiple.value) {
    selectedIds.value = [item.id];
    return;
  }
  const idx = selectedIds.value.indexOf(item.id);
  if (idx === -1) {
    if (selectedIds.value.length >= maxCount.value) {
      message.warning(`最多只能选择 ${maxCount.value} 个文件`);
      return;
    }
    selectedIds.value.push(item.id);
  } else {
    selectedIds.value.splice(idx, 1);
  }
}

// 格式化文件大小
function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / k ** i).toFixed(1)} ${sizes[i]}`;
}

// 直接在弹窗内上传新文件
async function handleDirectUpload(options: UploadCustomRequestOptions) {
  const rawFile = options.file.file;
  if (!rawFile) return;
  uploading.value = true;
  try {
    const uploaded = await uploadFileApi(
      rawFile,
      currentType.value > 0 ? currentType.value : 1,
    );
    message.success('上传成功');
    // 自动追加并选中新上传的文件
    selectedIds.value = [uploaded.id];
    page.value = 1;
    await loadFiles();
  } catch (error: any) {
    message.error(error.message || '上传失败');
  } finally {
    uploading.value = false;
  }
}

const [Modal, modalApi] = useVbenModal<{
  maxCount?: number;
  type?: number;
  currentValue?: string;
}>({
  onConfirm: () => {
    const selected = fileList.value.filter((item) =>
      selectedIds.value.includes(item.id),
    );
    if (selected.length === 0) {
      message.warning('请先选择文件');
      return;
    }
    emit('select', selected);
    modalApi.close();
  },
  onOpenChange: (isOpen) => {
    if (isOpen) {
      const data = modalApi.getData() as
        | undefined
        | {
            currentValue?: string;
            maxCount?: number;
            type?: number;
          };
      maxCount.value = data?.maxCount || 1;
      currentType.value = data?.type || 0;
      selectedIds.value = [];
      page.value = 1;
      loadFiles();
    }
  },
});
</script>

<template>
  <Modal title="媒体库 / 附件选择" class="w-[900px]">
    <div class="flex flex-col gap-4">
      <!-- 顶部过滤栏 -->
      <div
        class="flex flex-wrap items-center justify-between gap-3 border-b pb-3"
      >
        <NRadioGroup
          :value="currentType"
          size="small"
          @update:value="handleTypeChange"
        >
          <NRadio :value="0">全部</NRadio>
          <NRadio :value="1">图片</NRadio>
          <NRadio :value="2">视频</NRadio>
          <NRadio :value="3">音频</NRadio>
          <NRadio :value="4">文档</NRadio>
        </NRadioGroup>

        <div class="flex items-center gap-2">
          <NInput
            v-model:value="keyword"
            placeholder="搜索文件名称..."
            size="small"
            clearable
            class="w-52"
            @clear="handleClear"
            @keyup.enter="handleSearch"
          />
          <NButton size="small" type="primary" secondary @click="handleSearch">
            搜索
          </NButton>

          <!-- 弹窗内直传按钮 -->
          <NUpload :show-file-list="false" :custom-request="handleDirectUpload">
            <NButton size="small" type="primary" :loading="uploading">
              上传新文件
            </NButton>
          </NUpload>
        </div>
      </div>

      <!-- 文件瀑布流/网格展示 -->
      <NSpin :show="loading">
        <div
          v-if="fileList.length > 0"
          class="grid grid-cols-6 gap-3 min-h-[360px] max-h-[460px] overflow-y-auto pr-1"
        >
          <div
            v-for="item in fileList"
            :key="item.id"
            class="group relative flex flex-col rounded-lg border p-2 cursor-pointer transition-all hover:shadow-md"
            :class="[
              selectedIds.includes(item.id)
                ? 'border-primary ring-2 ring-primary/40 bg-primary/5'
                : 'border-border hover:border-primary/50',
            ]"
            @click="toggleSelect(item)"
          >
            <!-- 缩略图/图标预览 -->
            <div
              class="relative flex items-center justify-center h-24 overflow-hidden rounded bg-muted/30"
            >
              <NImage
                v-if="item.type === 1"
                :src="getFileUrl(item.preview)"
                object-fit="cover"
                preview-disabled
                class="w-full h-full"
              />
              <div
                v-else
                class="flex flex-col items-center justify-center text-muted-foreground"
              >
                <span class="text-2xl font-bold uppercase">{{
                  item.ext.replace('.', '') || 'FILE'
                }}</span>
              </div>

              <!-- 选中对勾徽标 -->
              <div
                v-if="selectedIds.includes(item.id)"
                class="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white text-xs font-bold"
              >
                ✓
              </div>
            </div>

            <!-- 文件信息摘要 -->
            <div class="mt-2 flex flex-col">
              <span
                class="truncate text-xs font-medium"
                :title="item.originName || item.name"
              >
                {{ item.originName || item.name }}
              </span>
              <div
                class="flex items-center justify-between text-[11px] text-muted-foreground mt-0.5"
              >
                <span>{{ formatSize(item.size) }}</span>
                <span class="text-[10px] uppercase opacity-75">{{
                  item.ext
                }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="flex items-center justify-center min-h-[300px]">
          <NEmpty description="暂无文件，点击右上角上传新文件" />
        </div>
      </NSpin>

      <!-- 底部统计与分页 -->
      <div class="flex items-center justify-between border-t pt-3">
        <span class="text-xs text-muted-foreground">
          已选 {{ selectedIds.length }} 项 / 共 {{ total }} 项
        </span>
        <NPagination
          :page="page"
          :page-size="pageSize"
          :item-count="total"
          size="small"
          @update:page="handlePageChange"
        />
      </div>
    </div>
  </Modal>
</template>

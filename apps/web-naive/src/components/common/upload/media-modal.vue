<script setup lang="ts">
import type { UploadCustomRequestOptions } from 'naive-ui';

import type { UploadItem } from '#/api/system/upload';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { VbenIcon } from '@vben-core/shadcn-ui';

import {
  NButton,
  NEmpty,
  NImage,
  NInput,
  NModal,
  NPagination,
  NRadio,
  NRadioGroup,
  NSpin,
  NTooltip,
  NUpload,
  useMessage,
} from 'naive-ui';

import { getFileListApi, getFileUrl, uploadFileApi } from '#/api/system/upload';
import { getFileVisual } from '#/utils/fileHelper';
import { captureVideoPoster } from '#/utils/videoPoster';

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
const lockedType = ref<number>(0); // 若外层指定类型，则锁定该类型不允许切换
const keyword = ref('');

// 选中的文件ID列表
const selectedIds = ref<number[]>([]);
const maxCount = ref(1);

// 视频预览播放弹窗
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

function handlePlayAudio(item: UploadItem) {
  previewAudioUrl.value = getFileUrl(item.preview);
  previewAudioTitle.value = item.originName || item.name || '音频试听';
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

function handlePreviewDoc(item: UploadItem) {
  previewDocUrl.value = getFileUrl(item.preview);
  const ext = (item.ext || '').toLowerCase();
  const isPdf = ext === '.pdf' || item.preview.toLowerCase().endsWith('.pdf');
  previewDocItem.value = {
    ext,
    isPdf,
    name: item.originName || item.name || '文档文件',
    size: item.size,
  };
  showDocModal.value = true;
}

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

const isMultiple = computed(() => maxCount.value > 1);

const acceptMap: Record<number, string> = {
  1: 'image/*',
  2: 'video/*',
  3: 'audio/*',
  4: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv',
};

const currentAccept = computed(() => {
  return acceptMap[currentType.value] || '*/*';
});

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
  if (lockedType.value > 0) return;
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
  if (lockedType.value > 0 && item.type !== lockedType.value) {
    const typeNames: Record<number, string> = {
      1: '图片',
      2: '视频',
      3: '音频',
      4: '文档',
    };
    message.warning(
      `当前字段限定为【${typeNames[lockedType.value] || '指定类型'}】，无法选择此文件`,
    );
    return;
  }
  if (!isMultiple.value) {
    selectedIds.value = selectedIds.value.includes(item.id) ? [] : [item.id];
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

// 触发卡片中的图片原生灯箱预览
function triggerCardImagePreview(event: MouseEvent) {
  const target = event.currentTarget as HTMLElement | null;
  const card = target?.closest('.group');
  const img = card?.querySelector('.n-image img') as HTMLImageElement | null;
  img?.click();
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

  const uploadType = currentType.value > 0 ? currentType.value : 1;
  if (uploadType === 1 && !rawFile.type.startsWith('image/')) {
    message.warning('请选择图片类型文件上传');
    return;
  }
  if (uploadType === 2 && !rawFile.type.startsWith('video/')) {
    message.warning('请选择视频类型文件上传');
    return;
  }
  if (uploadType === 3 && !rawFile.type.startsWith('audio/')) {
    message.warning('请选择音频类型文件上传');
    return;
  }

  uploading.value = true;
  try {
    let coverFile: File | null = null;
    if (uploadType === 2 || rawFile.type.startsWith('video/')) {
      coverFile = await captureVideoPoster(rawFile);
    }
    const uploaded = await uploadFileApi(rawFile, uploadType, coverFile);
    message.success('上传成功');
    // 自动追加并选中新上传的文件
    selectedIds.value = [uploaded.id];
    page.value = 1;
    await loadFiles();
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
      lockedType.value = data?.type || 0;
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
        <!-- 资源类型过滤：若外层已指定类型则固定展示，不可随意切换 -->
        <div
          v-if="lockedType > 0"
          class="flex items-center gap-1.5 text-xs text-muted-foreground font-medium"
        >
          <span>限定类型:</span>
          <span class="rounded bg-primary/10 px-2 py-0.5 text-primary">
            {{
              lockedType === 1
                ? '图片 (image/*)'
                : lockedType === 2
                  ? '视频 (video/*)'
                  : lockedType === 3
                    ? '音频 (audio/*)'
                    : '文档'
            }}
          </span>
        </div>
        <NRadioGroup
          v-else
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

          <!-- 弹窗内直传按钮，绑定当前分类对应的 accept 规则 -->
          <NUpload
            :show-file-list="false"
            :accept="currentAccept"
            :custom-request="handleDirectUpload"
          >
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
          class="grid grid-cols-6 gap-3 max-h-[460px] overflow-y-auto pr-1 items-start"
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
                :preview-src="getFileUrl(item.preview)"
                width="100%"
                height="100%"
                object-fit="cover"
                class="h-full w-full pointer-events-none [&>img]:h-full [&>img]:w-full [&>img]:object-cover"
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
              <!-- 视频类型展示封面图或首帧 -->
              <div
                v-else-if="item.type === 2"
                class="relative h-full w-full flex items-center justify-center bg-black/85 overflow-hidden"
              >
                <img
                  v-if="item.coverUrl || item.cover"
                  :src="item.coverUrl || getFileUrl(item.cover)"
                  class="h-full w-full object-cover pointer-events-none"
                  alt="cover"
                />
                <video
                  v-else
                  :src="`${getFileUrl(item.preview)}#t=0.5`"
                  preload="metadata"
                  class="h-full w-full object-cover pointer-events-none"
                ></video>
                <!-- 视频常驻标识 -->
                <div
                  class="absolute bottom-1 right-1 z-0 flex items-center rounded bg-black/60 px-1 py-0.5 text-[9px] text-white"
                >
                  <VbenIcon icon="lucide:video" class="size-3" />
                </div>
              </div>
              <!-- 音频与文档展示专属彩色图标与格式 -->
              <div
                v-else
                class="flex size-full flex-col items-center justify-center gap-1 p-2"
                :class="getFileVisual(item.ext, item.type).bg"
              >
                <VbenIcon
                  :icon="getFileVisual(item.ext, item.type).icon"
                  class="size-8"
                  :class="getFileVisual(item.ext, item.type).color"
                />
                <span
                  class="text-[11px] font-bold uppercase tracking-wide"
                  :class="getFileVisual(item.ext, item.type).color"
                >
                  {{ getFileVisual(item.ext, item.type).tag }}
                </span>
              </div>

              <!-- 图片悬停快捷预览遮罩 -->
              <div
                v-if="item.type === 1"
                class="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <NTooltip trigger="hover">
                  <template #trigger>
                    <NButton
                      circle
                      size="tiny"
                      quaternary
                      class="pointer-events-auto bg-black/30 hover:bg-black/60"
                      @click.stop="triggerCardImagePreview($event)"
                    >
                      <VbenIcon icon="lucide:eye" class="text-white" />
                    </NButton>
                  </template>
                  预览大图
                </NTooltip>
              </div>

              <!-- 视频悬停播放预览遮罩 -->
              <div
                v-if="item.type === 2"
                class="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <NTooltip trigger="hover">
                  <template #trigger>
                    <button
                      type="button"
                      class="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-md hover:scale-110 transition cursor-pointer"
                      @click.stop="handlePlayVideo(item.preview)"
                    >
                      <VbenIcon
                        icon="lucide:play"
                        class="size-4 fill-current ml-0.5"
                      />
                    </button>
                  </template>
                  播放视频
                </NTooltip>
              </div>

              <!-- 音频悬停试听预览遮罩 -->
              <div
                v-if="item.type === 3"
                class="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <NTooltip trigger="hover">
                  <template #trigger>
                    <button
                      type="button"
                      class="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-white shadow-md hover:scale-110 transition cursor-pointer"
                      @click.stop="handlePlayAudio(item)"
                    >
                      <VbenIcon
                        icon="lucide:play"
                        class="size-4 fill-current ml-0.5"
                      />
                    </button>
                  </template>
                  试听音频
                </NTooltip>
              </div>

              <!-- 文档悬停查看预览遮罩 -->
              <div
                v-if="item.type === 4"
                class="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <NTooltip trigger="hover">
                  <template #trigger>
                    <NButton
                      circle
                      size="tiny"
                      quaternary
                      class="pointer-events-auto bg-black/30 hover:bg-black/60"
                      @click.stop="handlePreviewDoc(item)"
                    >
                      <VbenIcon icon="lucide:eye" class="text-white" />
                    </NButton>
                  </template>
                  查看文档
                </NTooltip>
              </div>

              <!-- 选中对勾徽标 -->
              <div
                v-if="selectedIds.includes(item.id)"
                class="absolute right-1 top-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white text-xs font-bold shadow"
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
    class="w-[460px] max-w-[92vw]"
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
      previewDocItem.isPdf ? 'w-[860px] max-w-[94vw]' : 'w-[480px] max-w-[92vw]'
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
            previewDocItem.size ? formatSize(previewDocItem.size) : '文档文件'
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
</template>

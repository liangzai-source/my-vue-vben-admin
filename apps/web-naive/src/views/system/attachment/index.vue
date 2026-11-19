<script setup lang="ts">
import type { UploadCustomRequestOptions } from 'naive-ui';

import type { UploadItem } from '#/api/system/upload';

import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { VbenIcon } from '@vben-core/shadcn-ui';

import {
  NButton,
  NCard,
  NEmpty,
  NImage,
  NInput,
  NPagination,
  NPopconfirm,
  NRadioButton,
  NRadioGroup,
  NSpace,
  NSpin,
  NTag,
  NTooltip,
  NUpload,
  useMessage,
} from 'naive-ui';

import {
  deleteFileApi,
  getFileListApi,
  getFileUrl,
  uploadFileApi,
} from '#/api/system/upload';
import { FilePreviewModal } from '#/components/common/upload';
import { $t } from '#/locales';
import {
  DEFAULT_ACCEPT_MAP,
  downloadFile,
  formatFileSize,
  getFileVisual,
  getUploadTypeByFile,
} from '#/utils/fileHelper';
import { captureVideoPoster } from '#/utils/videoPoster';

const message = useMessage();

const loading = ref(false);
const uploading = ref(false);

const fileList = ref<UploadItem[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(24);
const currentType = ref<number>(0); // 0: 全部, 1: 图片, 2: 视频, 3: 音频, 4: 文件
const keyword = ref('');
const viewMode = ref<'grid' | 'table'>('grid');

const computedAccept = computed(() => {
  return DEFAULT_ACCEPT_MAP[currentType.value] || '*/*';
});

// 统一预览弹窗组件引用
const previewModalRef = ref<InstanceType<typeof FilePreviewModal> | null>(null);

function handlePreview(item: UploadItem) {
  if (item.type === 1) return;
  previewModalRef.value?.open({
    ext: item.ext,
    name: item.originName || item.name,
    size: item.size,
    storage: item.storage,
    type: item.type,
    url: item.preview,
  });
}

// 触发卡片中的图片原生灯箱预览
function triggerCardImagePreview(event: MouseEvent) {
  const target = event.currentTarget as HTMLElement | null;
  const card = target?.closest('.group');
  const img = card?.querySelector('.n-image img') as HTMLImageElement | null;
  img?.click();
}

// 触发表格行中的图片原生灯箱预览
function triggerTableImagePreview(event: MouseEvent) {
  const target = event.currentTarget as HTMLElement | null;
  const row = target?.closest('tr');
  const img = row?.querySelector('.n-image img') as HTMLImageElement | null;
  img?.click();
}

// 加载文件列表
async function loadFiles() {
  loading.value = true;
  try {
    const res = await getFileListApi({
      keyword: keyword.value.trim(),
      page: page.value,
      pageSize: pageSize.value,
      type: currentType.value,
    });
    fileList.value = res.items || [];
    total.value = res.total || 0;
  } catch (error: any) {
    message.error(error.message || '加载附件列表失败');
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

// 关键词搜索
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

function handlePageSizeChange(ps: number) {
  pageSize.value = ps;
  page.value = 1;
  loadFiles();
}

// 手动上传
async function handleCustomUpload(options: UploadCustomRequestOptions) {
  const rawFile = options.file.file;
  if (!rawFile) return;

  uploading.value = true;
  try {
    const uploadType =
      currentType.value > 0 ? currentType.value : getUploadTypeByFile(rawFile);
    let coverFile: File | null = null;
    if (uploadType === 2 || rawFile.type.startsWith('video/')) {
      coverFile = await captureVideoPoster(rawFile);
    }
    await uploadFileApi(rawFile, uploadType, coverFile);
    message.success('上传成功');
    loadFiles();
  } catch (error: any) {
    message.error(error.message || '上传失败');
  } finally {
    uploading.value = false;
  }
}

// 复制外链地址
async function handleCopyUrl(item: UploadItem) {
  const fullUrl = `${window.location.origin}${getFileUrl(item.preview)}`;
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(fullUrl);
      message.success($t('system.attachment.copySuccess'));
    } else {
      message.warning('浏览器不支持剪贴板写入');
    }
  } catch {
    message.error($t('system.attachment.copyFailed'));
  }
}

// 下载附件
function handleDownload(item: UploadItem) {
  downloadFile(item.preview, item.originName || item.name);
}

// 删除附件
async function handleDelete(item: UploadItem) {
  try {
    await deleteFileApi(item.id);
    message.success($t('system.attachment.deleteSuccess'));
    loadFiles();
  } catch (error: any) {
    message.error(error.message || '删除失败');
  }
}

onMounted(() => {
  loadFiles();
});
</script>

<template>
  <Page
    :title="$t('system.attachment.title')"
    :description="$t('system.attachment.description')"
  >
    <div class="flex flex-col gap-4">
      <!-- 顶部操作与筛选栏 -->
      <NCard size="small" :bordered="false" class="shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <!-- 分类标签单选 -->
          <NRadioGroup
            :value="currentType"
            size="medium"
            @update:value="handleTypeChange"
          >
            <NRadioButton :value="0">
              {{ $t('system.attachment.all') }}
            </NRadioButton>
            <NRadioButton :value="1">
              {{ $t('system.attachment.image') }}
            </NRadioButton>
            <NRadioButton :value="2">
              {{ $t('system.attachment.video') }}
            </NRadioButton>
            <NRadioButton :value="3">
              {{ $t('system.attachment.audio') }}
            </NRadioButton>
            <NRadioButton :value="4">
              {{ $t('system.attachment.document') }}
            </NRadioButton>
          </NRadioGroup>

          <!-- 右侧操作区：关键词搜索、视图切换、上传按钮 -->
          <div class="flex items-center gap-3">
            <NInput
              v-model:value="keyword"
              :placeholder="$t('system.attachment.searchPlaceholder')"
              clearable
              size="small"
              class="w-56"
              @clear="handleClear"
              @keyup.enter="handleSearch"
            >
              <template #prefix>
                <VbenIcon icon="lucide:search" class="text-muted-foreground" />
              </template>
            </NInput>

            <NButton size="small" secondary @click="handleSearch">
              查询
            </NButton>

            <!-- 视图模式切换 (网格 / 列表) -->
            <NRadioGroup v-model:value="viewMode" size="small">
              <NRadioButton value="grid" title="卡片网格">
                卡片网格
              </NRadioButton>
              <NRadioButton value="table" title="表格列表">
                表格列表
              </NRadioButton>
            </NRadioGroup>

            <!-- 统一上传按钮 -->
            <NUpload
              :show-file-list="false"
              multiple
              :accept="computedAccept"
              :custom-request="handleCustomUpload"
              :disabled="uploading"
            >
              <NButton type="primary" size="small" :loading="uploading">
                <template #icon>
                  <VbenIcon icon="lucide:upload" />
                </template>
                {{ $t('system.attachment.upload') }}
              </NButton>
            </NUpload>
          </div>
        </div>
      </NCard>

      <!-- 内容展示区 -->
      <NSpin :show="loading">
        <!-- 1. 卡片网格视图 (items-start 确保自然高度，彻底消除多余垂直空白) -->
        <div v-if="viewMode === 'grid'">
          <div
            v-if="fileList.length > 0"
            class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 items-start"
          >
            <div
              v-for="item in fileList"
              :key="item.id"
              class="group relative flex flex-col overflow-hidden rounded-lg border border-border/70 bg-card p-2.5 transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <!-- 缩略图/图标展示容器 -->
              <div
                class="relative flex h-36 w-full items-center justify-center overflow-hidden rounded-md bg-muted/20"
              >
                <!-- 图片类型：大图预览并占满容器裁剪截取展示 (由 NImage 原生提供预览与缩放) -->
                <NImage
                  v-if="item.type === 1"
                  :src="getFileUrl(item.preview)"
                  :preview-src="getFileUrl(item.preview)"
                  width="100%"
                  height="100%"
                  object-fit="cover"
                  class="h-full w-full cursor-pointer [&>img]:h-full [&>img]:w-full [&>img]:object-cover"
                  :img-props="{
                    style: {
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                      cursor: 'pointer',
                    },
                    class: 'w-full h-full object-cover cursor-pointer',
                  }"
                />
                <!-- 视频类型：展示封面图或首帧，常驻小角标，点击打开视频播放弹窗 -->
                <div
                  v-else-if="item.type === 2"
                  class="relative size-full flex items-center justify-center bg-black/85 overflow-hidden cursor-pointer"
                  @click="handlePreview(item)"
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
                <!-- 非图片与视频类型：展示专属彩色图标与格式，点击打开音视频播放/文件预览弹窗 -->
                <div
                  v-else
                  class="flex size-full flex-col items-center justify-center gap-2 cursor-pointer p-3"
                  :class="getFileVisual(item.ext, item.type).bg"
                  @click="handlePreview(item)"
                >
                  <VbenIcon
                    :icon="getFileVisual(item.ext, item.type).icon"
                    class="size-11"
                    :class="getFileVisual(item.ext, item.type).color"
                  />
                  <span
                    class="text-xs font-bold uppercase tracking-wider"
                    :class="getFileVisual(item.ext, item.type).color"
                  >
                    {{ getFileVisual(item.ext, item.type).tag }}
                  </span>
                </div>

                <!-- 悬停快捷操作遮罩 (pointer-events-none 避免遮挡底层的直接点击大图预览) -->
                <div
                  class="pointer-events-none absolute inset-0 flex items-center justify-center gap-1.5 bg-black/45 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <NTooltip trigger="hover">
                    <template #trigger>
                      <NButton
                        circle
                        size="tiny"
                        quaternary
                        class="pointer-events-auto"
                        @click.stop="
                          item.type === 1
                            ? triggerCardImagePreview($event)
                            : handlePreview(item)
                        "
                      >
                        <VbenIcon
                          icon="lucide:eye"
                          class="text-white hover:bg-white/20"
                        />
                      </NButton>
                    </template>
                    查看预览
                  </NTooltip>

                  <NTooltip trigger="hover">
                    <template #trigger>
                      <NButton
                        circle
                        size="tiny"
                        quaternary
                        class="pointer-events-auto"
                        @click.stop="handleCopyUrl(item)"
                      >
                        <VbenIcon
                          icon="lucide:copy"
                          class="text-white hover:bg-white/20"
                        />
                      </NButton>
                    </template>
                    复制外链
                  </NTooltip>

                  <NTooltip trigger="hover">
                    <template #trigger>
                      <NButton
                        circle
                        size="tiny"
                        quaternary
                        class="pointer-events-auto"
                        @click.stop="handleDownload(item)"
                      >
                        <VbenIcon
                          icon="lucide:download"
                          class="text-white hover:bg-white/20"
                        />
                      </NButton>
                    </template>
                    下载文件
                  </NTooltip>

                  <NPopconfirm
                    v-access:code="'sys:attachment:delete'"
                    :title="$t('system.attachment.deleteConfirmTitle')"
                    @positive-click="handleDelete(item)"
                  >
                    <template #trigger>
                      <NButton
                        circle
                        size="tiny"
                        quaternary
                        class="pointer-events-auto"
                        @click.stop
                      >
                        <VbenIcon
                          icon="lucide:trash-2"
                          class="text-destructive hover:bg-white/20"
                        />
                      </NButton>
                    </template>
                    {{ $t('system.attachment.deleteConfirmContent') }}
                  </NPopconfirm>
                </div>
              </div>

              <!-- 文件信息摘要 -->
              <div class="mt-2 flex flex-col gap-0.5">
                <NTooltip trigger="hover">
                  <template #trigger>
                    <span
                      class="truncate text-xs font-medium text-foreground hover:text-primary cursor-pointer"
                      @click="
                        item.type === 1
                          ? triggerCardImagePreview($event)
                          : handlePreview(item)
                      "
                    >
                      {{ item.originName || item.name }}
                    </span>
                  </template>
                  {{ item.originName || item.name }}
                </NTooltip>
                <div
                  class="flex items-center justify-between text-[11px] text-muted-foreground"
                >
                  <span>{{ formatFileSize(item.size) }}</span>
                  <span class="truncate">{{
                    item.createdAt.slice(0, 10)
                  }}</span>
                </div>
              </div>
            </div>
          </div>

          <NEmpty
            v-else
            description="暂无附件数据，可点击右上角上传"
            class="my-16"
          />
        </div>

        <!-- 2. 表格列表视图 -->
        <div v-else class="overflow-x-auto rounded-lg border bg-card">
          <table class="w-full text-left text-sm">
            <thead class="border-b bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th class="p-3">ID</th>
                <th class="p-3">预览</th>
                <th class="p-3">文件名</th>
                <th class="p-3">类型</th>
                <th class="p-3">大小</th>
                <th class="p-3">存储方式</th>
                <th class="p-3">上传时间</th>
                <th class="p-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              <tr
                v-for="item in fileList"
                :key="item.id"
                class="hover:bg-muted/20"
              >
                <td class="p-3 text-muted-foreground">#{{ item.id }}</td>
                <td class="p-3">
                  <NImage
                    v-if="item.type === 1"
                    :src="getFileUrl(item.preview)"
                    :preview-src="getFileUrl(item.preview)"
                    width="40"
                    height="40"
                    object-fit="cover"
                    class="size-10 rounded border cursor-pointer [&>img]:size-full [&>img]:object-cover"
                    :img-props="{
                      style: {
                        width: '40px',
                        height: '40px',
                        objectFit: 'cover',
                        display: 'block',
                        cursor: 'pointer',
                      },
                      class: 'size-full object-cover cursor-pointer',
                    }"
                  />
                  <!-- 视频类型：展示缩略图与居中播放图标 -->
                  <div
                    v-else-if="item.type === 2"
                    class="relative size-10 flex items-center justify-center rounded border bg-black/85 overflow-hidden cursor-pointer"
                    @click="handlePreview(item)"
                  >
                    <img
                      v-if="item.coverUrl || item.cover"
                      :src="item.coverUrl || getFileUrl(item.cover)"
                      class="size-full object-cover pointer-events-none"
                      alt="cover"
                    />
                    <video
                      v-else
                      :src="`${getFileUrl(item.preview)}#t=0.5`"
                      preload="metadata"
                      class="size-full object-cover pointer-events-none"
                    ></video>
                    <div
                      class="absolute inset-0 flex items-center justify-center bg-black/25"
                    >
                      <VbenIcon
                        icon="lucide:play"
                        class="size-3.5 fill-white text-white ml-0.5"
                      />
                    </div>
                  </div>
                  <div
                    v-else
                    class="flex size-10 items-center justify-center rounded border cursor-pointer"
                    :class="getFileVisual(item.ext, item.type).bg"
                    @click="handlePreview(item)"
                  >
                    <VbenIcon
                      :icon="getFileVisual(item.ext, item.type).icon"
                      class="size-5"
                      :class="getFileVisual(item.ext, item.type).color"
                    />
                  </div>
                </td>
                <td class="p-3 font-medium">
                  <span
                    class="cursor-pointer hover:text-primary"
                    @click="
                      item.type === 1
                        ? triggerTableImagePreview($event)
                        : handlePreview(item)
                    "
                  >
                    {{ item.originName || item.name }}
                  </span>
                </td>
                <td class="p-3">
                  <NTag
                    size="small"
                    round
                    :bordered="false"
                    :type="item.type === 1 ? 'success' : 'info'"
                  >
                    {{ item.ext.toUpperCase() || 'FILE' }}
                  </NTag>
                </td>
                <td class="p-3 text-muted-foreground">
                  {{ formatFileSize(item.size) }}
                </td>
                <td class="p-3 text-muted-foreground">{{ item.storage }}</td>
                <td class="p-3 text-muted-foreground">{{ item.createdAt }}</td>
                <td class="p-3 text-right">
                  <NSpace justify="end" size="small">
                    <NButton
                      size="tiny"
                      quaternary
                      type="primary"
                      @click="
                        item.type === 1
                          ? triggerTableImagePreview($event)
                          : handlePreview(item)
                      "
                    >
                      预览
                    </NButton>
                    <NButton
                      size="tiny"
                      quaternary
                      @click="handleCopyUrl(item)"
                    >
                      复制链接
                    </NButton>
                    <NButton
                      size="tiny"
                      quaternary
                      @click="handleDownload(item)"
                    >
                      下载
                    </NButton>
                    <NPopconfirm
                      v-access:code="'sys:attachment:delete'"
                      :title="$t('system.attachment.deleteConfirmTitle')"
                      @positive-click="handleDelete(item)"
                    >
                      <template #trigger>
                        <NButton size="tiny" quaternary type="error">
                          删除
                        </NButton>
                      </template>
                      {{ $t('system.attachment.deleteConfirmContent') }}
                    </NPopconfirm>
                  </NSpace>
                </td>
              </tr>
              <tr v-if="fileList.length === 0">
                <td colspan="8" class="p-8 text-center text-muted-foreground">
                  暂无附件数据
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </NSpin>

      <!-- 底部翻页控制器 -->
      <div class="flex items-center justify-end border-t pt-3">
        <NPagination
          :page="page"
          :page-size="pageSize"
          :item-count="total"
          :page-sizes="[18, 24, 36, 48, 72]"
          show-size-picker
          show-quick-jumper
          @update:page="handlePageChange"
          @update:page-size="handlePageSizeChange"
        />
      </div>
    </div>

    <!-- 统一附件预览弹窗组件 -->
    <FilePreviewModal ref="previewModalRef" />
  </Page>
</template>

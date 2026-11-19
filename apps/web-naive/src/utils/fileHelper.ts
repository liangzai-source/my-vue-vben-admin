import { getFileUrl } from '#/api/system/upload';

export interface FileVisual {
  bg: string;
  color: string;
  icon: string;
  tag: string;
}

export interface FileMeta {
  ext: string;
  originName: string;
  size?: number;
}

export const DEFAULT_ACCEPT_MAP: Record<number, string> = {
  1: 'image/*',
  2: 'video/*',
  3: 'audio/*',
  4: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv',
};

export const getFileVisual = (
  ext: string = '',
  type: number = 4,
): FileVisual => {
  const clean = (ext || '').toLowerCase().replace('.', '');
  if (type === 2) {
    return {
      bg: 'bg-black/85',
      color: 'text-white',
      icon: 'lucide:video',
      tag: 'VIDEO',
    };
  }
  if (type === 3 || ['aac', 'flac', 'mp3', 'ogg', 'wav'].includes(clean)) {
    return {
      bg: 'bg-violet-500/10',
      color: 'text-violet-500',
      icon: 'lucide:music',
      tag: clean ? clean.toUpperCase() : 'AUDIO',
    };
  }
  if (clean === 'pdf') {
    return {
      bg: 'bg-rose-500/10',
      color: 'text-rose-500',
      icon: 'ant-design:file-pdf-outlined',
      tag: 'PDF',
    };
  }
  if (['doc', 'docx'].includes(clean)) {
    return {
      bg: 'bg-blue-500/10',
      color: 'text-blue-500',
      icon: 'bxs:file-doc',
      tag: 'WORD',
    };
  }
  if (['csv', 'xls', 'xlsx'].includes(clean)) {
    return {
      bg: 'bg-emerald-500/10',
      color: 'text-emerald-500',
      icon: 'bi:filetype-xls',
      tag: 'EXCEL',
    };
  }
  if (['ppt', 'pptx'].includes(clean)) {
    return {
      bg: 'bg-amber-500/10',
      color: 'text-amber-500',
      icon: 'ant-design:file-ppt-outlined',
      tag: 'PPT',
    };
  }
  if (['7z', 'gz', 'rar', 'tar', 'zip'].includes(clean)) {
    return {
      bg: 'bg-yellow-500/10',
      color: 'text-yellow-600',
      icon: 'ant-design:file-zip-outlined',
      tag: 'ZIP',
    };
  }
  return {
    bg: 'bg-slate-500/10',
    color: 'text-slate-500',
    icon: 'akar-icons:file',
    tag: clean ? clean.toUpperCase() : 'FILE',
  };
};

/**
 * 格式化文件体积展示
 */
export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / k ** i).toFixed(1)} ${sizes[i]}`;
}

/**
 * 通用文件下载方法
 */
export function downloadFile(urlOrPath: string, fileName?: string): void {
  const link = document.createElement('a');
  link.href = getFileUrl(urlOrPath);
  link.download = fileName || urlOrPath.split('/').pop() || 'download';
  link.target = '_blank';
  document.body.append(link);
  link.click();
  link.remove();
}

/**
 * 在新标签页打开文件地址
 */
export function openExternalUrl(urlOrPath: string): void {
  window.open(getFileUrl(urlOrPath), '_blank');
}

/**
 * 从文件路径推断名称、扩展名及默认展示名称
 */
export function getFileMetaFromPath(
  path: string,
  type: number = 4,
  cached?: { ext?: string; originName?: string; size?: number },
): FileMeta {
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
    if (type === 1) originName = `图片附件 (${fileName})`;
    else if (type === 2) originName = `视频附件 (${fileName})`;
    else if (type === 3) originName = `音频附件 (${fileName})`;
    else originName = `文档附件 (${fileName})`;
  }
  let fallbackExt = '.file';
  if (type === 1) fallbackExt = '.jpg';
  else if (type === 2) fallbackExt = '.mp4';
  else if (type === 3) fallbackExt = '.mp3';

  return {
    ext: ext || fallbackExt,
    originName,
    size: 0,
  };
}

/**
 * 根据文件对象推断上传类型
 */
export function getUploadTypeByFile(file: File): number {
  const ext = `.${file.name.split('.').pop()?.toLowerCase()}`;
  if (
    ['.gif', '.jpeg', '.jpg', '.png', '.webp'].includes(ext) ||
    file.type.startsWith('image/')
  ) {
    return 1;
  }
  if (['.mp4', '.webm'].includes(ext) || file.type.startsWith('video/')) {
    return 2;
  }
  if (
    ['.aac', '.aiff', '.flac', '.mp3', '.ogg', '.wav'].includes(ext) ||
    file.type.startsWith('audio/')
  ) {
    return 3;
  }
  return 4;
}

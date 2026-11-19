export type FileVisual = {
  bg: string;
  color: string;
  icon: string;
  tag: string;
};
export const getFileVisual = (ext: string, type: number): FileVisual => {
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

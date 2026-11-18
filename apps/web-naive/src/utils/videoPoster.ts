/**
 * 视频封面截帧工具
 *
 * 核心原理与优化：
 * 1. 抓取时间默认 0.5s（若视频超短则抓取中点或 0s），避免首帧为全黑/白屏。
 * 2. 画布最大宽限制为 480px（等比例缩放），并使用 canvas.toBlob('image/jpeg', 0.85)，
 *    产出体积通常只有 20~40KB，相比原始视频体积极小，且无需 base64 编解码损耗。
 * 3. 及时通过 URL.revokeObjectURL 释放内存，并设置超时保护机制（4秒），遇到异常视频不阻塞上传主流程。
 */
export function captureVideoPoster(
  file: File,
  seekTime = 0.5,
  maxWidth = 480,
  quality = 0.85,
): Promise<File | null> {
  return new Promise((resolve) => {
    // 快速拦截非视频类型文件
    if (!file.type || !file.type.startsWith('video/')) {
      resolve(null);
      return;
    }

    const video = document.createElement('video');
    const objectUrl = URL.createObjectURL(file);
    video.src = objectUrl;
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    let timeoutId: null | ReturnType<typeof setTimeout> = null;

    const cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      video.removeAttribute('src');
      video.load();
      URL.revokeObjectURL(objectUrl);
    };

    // 4秒超时兜底保护
    timeoutId = setTimeout(() => {
      cleanup();
      resolve(null);
    }, 4000);

    video.addEventListener('loadedmetadata', () => {
      video.currentTime =
        video.duration && video.duration < seekTime
          ? Math.max(0, video.duration / 2)
          : seekTime;
    });

    video.addEventListener('seeked', () => {
      try {
        const originWidth = video.videoWidth || 480;
        const originHeight = video.videoHeight || 270;

        let width = originWidth;
        let height = originHeight;
        if (width > maxWidth) {
          height = Math.round((originHeight * maxWidth) / originWidth);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          cleanup();
          resolve(null);
          return;
        }

        ctx.drawImage(video, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            cleanup();
            if (blob) {
              const baseName =
                file.name.slice(0, file.name.lastIndexOf('.')) || 'video';
              const posterFile = new File([blob], `${baseName}_cover.jpg`, {
                type: 'image/jpeg',
              });
              resolve(posterFile);
            } else {
              resolve(null);
            }
          },
          'image/jpeg',
          quality,
        );
      } catch {
        cleanup();
        resolve(null);
      }
    });

    video.addEventListener('error', () => {
      cleanup();
      resolve(null);
    });
  });
}

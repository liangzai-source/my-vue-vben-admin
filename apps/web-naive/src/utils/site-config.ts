import { updatePreferences } from '@vben/preferences';

import { getSiteConfigApi } from '#/api/core/auth';

/**
 * 从服务端拉取公开站点配置并同步到前端偏好设置（站点名称、Logo、ICP 备案号）
 */
export async function syncSiteConfig() {
  try {
    const cfg = await getSiteConfigApi();
    if (!cfg) return null;

    const patch: Record<string, any> = {};
    if (cfg.siteName) {
      patch.app = { name: cfg.siteName };
    }
    if (cfg.siteLogo) {
      patch.logo = { source: cfg.siteLogo };
    }
    if (cfg.siteIcp || cfg.siteName) {
      patch.copyright = {
        ...(cfg.siteIcp ? { icp: cfg.siteIcp } : {}),
        ...(cfg.siteName ? { companyName: cfg.siteName } : {}),
      };
    }
    if (Object.keys(patch).length > 0) {
      updatePreferences(patch);
    }
    return cfg;
  } catch {
    return null;
  }
}

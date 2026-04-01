import type { GlobalThemeOverrides } from 'naive-ui';

import { computed } from 'vue';

import { useNaiveDesignTokens } from '@vben/hooks';
import { preferences } from '@vben/preferences';

import {
  createDiscreteApi,
  darkTheme,
  dateEnUS,
  dateZhCN,
  enUS,
  lightTheme,
  zhCN,
} from 'naive-ui';

// 复用 App.vue 中的自定义主题 tokens
const { commonTokens } = useNaiveDesignTokens();

// 复用多语言配置（和 App.vue 保持一致）
const tokenLocale = computed(() =>
  preferences.app.locale === 'zh-CN' ? zhCN : enUS,
);
const tokenDateLocale = computed(() =>
  preferences.app.locale === 'zh-CN' ? dateZhCN : dateEnUS,
);

// 定义主题覆盖配置（彻底避开 BuiltInGlobalTheme 类型问题）
const getThemeOverrides = (): GlobalThemeOverrides => {
  // 直接返回自定义主题配置，无需读取内置主题的 themeOverrides
  // 如果需要区分明暗模式的基础样式，可在这里手动配置
  return {
    common: commonTokens, // 核心：你的自定义主题 tokens
    // 可选：根据明暗模式添加不同的基础样式
    ...(preferences.theme.mode === 'dark'
      ? {
          // dark 模式专属的额外样式覆盖
          Button: {
            textColor: '#fff',
          },
        }
      : {
          // light 模式专属的额外样式覆盖
          Button: {
            textColor: '#333',
          },
        }),
  };
};

// 响应式生成完整的配置 Provider Props
const configProviderProps = computed(() => ({
  // 直接使用内置主题（light/dark），类型为 GlobalTheme
  theme: preferences.theme.mode === 'dark' ? darkTheme : lightTheme,
  // 单独传入自定义的 themeOverrides（Naive UI 推荐用法）
  themeOverrides: getThemeOverrides(),
  // 多语言配置
  locale: tokenLocale.value,
  dateLocale: tokenDateLocale.value,
}));

// 单独的 themeOverrides 配置（供 message/loadingBar 等组件使用）
const themeOverridesProviderProps = computed(() => ({
  themeOverrides: getThemeOverrides(),
}));

// 创建离散 API，完全对齐 App.vue 的配置
export const { dialog, loadingBar, message, modal, notification } =
  createDiscreteApi(
    ['message', 'dialog', 'notification', 'loadingBar', 'modal'],
    {
      configProviderProps, // 核心：传入包含主题+语言的完整配置
      loadingBarProviderProps: themeOverridesProviderProps,
      messageProviderProps: themeOverridesProviderProps,
      notificationProviderProps: themeOverridesProviderProps,
    },
  );

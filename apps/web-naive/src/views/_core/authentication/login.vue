<script lang="ts" setup>
import type { CaptchaPoint, VbenFormSchema } from '@vben/common-ui';
import type { Recordable } from '@vben/types';

import { computed, onMounted, ref } from 'vue';

import { AuthenticationLogin, PointSelectionCaptcha, z } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { NModal, NSpin } from 'naive-ui';

import { message } from '#/adapter/naive';
import { getCaptchaApi } from '#/api';
import { useAuthStore } from '#/store';
import { syncSiteConfig } from '#/utils/site-config';

defineOptions({ name: 'Login' });

const authStore = useAuthStore();

const requireCaptcha = ref(false);
const captchaModalVisible = ref(false);
const captchaLoading = ref(false);
const captchaInfo = ref<null | {
  captchaId: string;
  captchaImage: string;
  count: number;
  height: number;
  hintImage: string;
  width: number;
}>(null);
const pendingValues = ref<null | Recordable<any>>(null);

onMounted(async () => {
  const cfg = await syncSiteConfig();
  if (cfg?.loginCaptcha) {
    requireCaptcha.value = true;
  }
});

const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: $t('authentication.usernameTip'),
      },
      fieldName: 'account',
      label: $t('authentication.username'),
      rules: z.string().min(1, { message: $t('authentication.usernameTip') }),
    },
    {
      component: 'VbenInputPassword',
      componentProps: {
        placeholder: $t('authentication.password'),
      },
      fieldName: 'password',
      label: $t('authentication.password'),
      rules: z.string().min(1, { message: $t('authentication.passwordTip') }),
    },
  ];
});

async function refreshCaptcha() {
  captchaLoading.value = true;
  try {
    captchaInfo.value = await getCaptchaApi();
  } finally {
    captchaLoading.value = false;
  }
}

async function openCaptchaModal() {
  captchaModalVisible.value = true;
  await refreshCaptcha();
}

async function handleSubmit(values: Recordable<any>) {
  pendingValues.value = { ...values };
  if (requireCaptcha.value) {
    await openCaptchaModal();
    return;
  }
  await executeLogin(values);
}

async function executeLogin(values: Recordable<any>, clearPoints?: () => void) {
  try {
    await authStore.authLogin(values);
    captchaModalVisible.value = false;
    requireCaptcha.value = false;
  } catch (error: any) {
    const needCaptcha = Boolean(error?.response?.data?.data?.requireCaptcha);
    if (needCaptcha) {
      requireCaptcha.value = true;
      clearPoints?.();
      await openCaptchaModal();
    } else if (captchaModalVisible.value) {
      captchaModalVisible.value = false;
    }
  }
}

async function handleCaptchaConfirm(points: CaptchaPoint[], clear: () => void) {
  if (!captchaInfo.value || !pendingValues.value) {
    return;
  }
  if (points.length < captchaInfo.value.count) {
    message.warning($t('authentication.verifyRequiredTip'));
    return;
  }
  const payload: Recordable<any> = {
    ...pendingValues.value,
    captchaId: captchaInfo.value.captchaId,
    captchaPoints: points.map((p) => ({ x: p.x, y: p.y })),
  };
  await executeLogin(payload, clear);
}
</script>

<template>
  <div>
    <AuthenticationLogin
      :form-schema="formSchema"
      :loading="authStore.loginLoading"
      :show-code-login="false"
      :show-register="false"
      :show-qrcode-login="false"
      :show-third-party-login="false"
      :show-forget-password="false"
      @submit="handleSubmit"
    />

    <NModal
      v-model:show="captchaModalVisible"
      preset="card"
      :bordered="false"
      :mask-closable="false"
      class="w-fit"
      style="width: auto"
    >
      <NSpin :show="captchaLoading">
        <PointSelectionCaptcha
          v-if="captchaInfo"
          :captcha-image="captchaInfo.captchaImage"
          :hint-image="captchaInfo.hintImage"
          :height="captchaInfo.height"
          :width="captchaInfo.width"
          :show-confirm="true"
          @confirm="handleCaptchaConfirm"
          @refresh="refreshCaptcha"
        />
      </NSpin>
    </NModal>
  </div>
</template>

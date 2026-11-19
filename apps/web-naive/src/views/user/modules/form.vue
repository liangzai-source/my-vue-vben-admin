<script setup lang="ts">
import type { FormInst, FormRules, FormValidationError } from 'naive-ui';

import type { UserApi } from '#/api/user';

import { computed, ref, useTemplateRef } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { $t } from '@vben/locales';

import {
  NDatePicker,
  NForm,
  NFormItemGi,
  NGrid,
  NInput,
  NSwitch,
} from 'naive-ui';

import { userCreateApi, userUpdateApi } from '#/api/user';
import { FileUpload } from '#/components/common/upload';
import { handleFormError, isEmpty, showFormMessage } from '#/utils/tools';

const emits = defineEmits<{
  (e: 'success'): void;
}>();

const defaultFormData: UserApi.UserSaveReq & { id?: number } = {
  nickname: undefined,
  avatar: undefined,
  account: undefined,
  password: undefined,
  mobile: undefined,
  status: undefined,
  lastLoginTime: undefined,
  lastLoginIp: undefined,
  miniOpenid: undefined,
  offOpenid: undefined,
  wechatUnionid: undefined,
};

const formRef = useTemplateRef<FormInst>('form');
const formData = ref<UserApi.UserSaveReq & { id?: number }>({
  ...defaultFormData,
});
const loading = ref<boolean>(false);

const baseRules = {
  nickname: [
    {
      required: true,
      message: $t('ui.formRules.required', [$t('user.nickname')]),
    },
  ],
  account: [
    {
      required: true,
      message: $t('ui.formRules.required', [$t('user.account')]),
    },
  ],
};

const formRules = computed<FormRules>(() => {
  return {
    ...baseRules,
    password: [
      {
        trigger: 'blur',
        required: isEmpty(formData.value?.id) || formData.value?.id === 0,
        message: $t('ui.formRules.required', [$t('user.password')]),
      },
    ],
  };
});

const getDialogTitle = computed(() =>
  formData.value?.id
    ? $t('common.update', [$t('user.entityTitle')])
    : $t('common.create', [$t('user.entityTitle')]),
);

function normalizeFormData(
  raw: Partial<UserApi.UserSaveReq & { id?: number }>,
) {
  const data: UserApi.UserSaveReq & { id?: number } = {
    ...defaultFormData,
    ...raw,
  };
  return data;
}
const [Drawer, drawerApi] = useVbenDrawer<UserApi.User>({
  onConfirm: formConfirm,
  onOpenChange: (isOpen) => {
    const data = drawerApi.getData();
    if (isOpen && !isEmpty(data)) {
      formData.value = normalizeFormData(data);
      formData.value.password = '';
    } else {
      formData.value = { ...defaultFormData };
    }
  },
});

function formConfirm() {
  formRef.value
    ?.validate()
    .then(async () => {
      loading.value = true;
      try {
        await (formData.value?.id
          ? userUpdateApi(formData.value.id, formData.value)
          : userCreateApi(formData.value));
        await drawerApi.close();
        emits('success');
        showFormMessage(formData.value?.id);
      } finally {
        loading.value = false;
      }
    })
    .catch((error: Array<FormValidationError>) => {
      handleFormError(error);
    });
}
</script>

<template>
  <Drawer class="w-[650px] max-w-[90vw]" :title="getDialogTitle">
    <NForm
      ref="form"
      :model="formData"
      :rules="formRules"
      label-placement="left"
      label-width="100"
    >
      <NGrid :cols="24" :x-gap="24">
        <NFormItemGi :span="24" :label="$t('user.nickname')" path="nickname">
          <NInput
            v-model:value="formData.nickname"
            :placeholder="$t('common.placeholder', [$t('user.nickname')])"
          />
        </NFormItemGi>
        <NFormItemGi :span="24" :label="$t('user.avatar')" path="avatar">
          <FileUpload
            v-model:model-value="formData.avatar"
            :max-count="1"
            :type="1"
          />
        </NFormItemGi>
        <NFormItemGi :span="24" :label="$t('user.account')" path="account">
          <NInput
            v-model:value="formData.account"
            :placeholder="$t('common.placeholder', [$t('user.account')])"
          />
        </NFormItemGi>
        <NFormItemGi :span="24" :label="$t('user.password')" path="password">
          <NInput
            v-model:value="formData.password"
            type="password"
            show-password-on="click"
            autocomplete="off"
            clearable
            :placeholder="
              formData?.id
                ? $t('user.passwordPlaceholder')
                : $t('common.placeholder', [$t('user.password')])
            "
          />
        </NFormItemGi>
        <NFormItemGi :span="24" :label="$t('user.mobile')" path="mobile">
          <NInput
            v-model:value="formData.mobile"
            :placeholder="$t('common.placeholder', [$t('user.mobile')])"
          />
        </NFormItemGi>
        <NFormItemGi :span="24" :label="$t('user.status')" path="status">
          <NSwitch v-model:value="formData.status" />
        </NFormItemGi>
        <NFormItemGi
          :span="24"
          :label="$t('user.lastLoginTime')"
          path="lastLoginTime"
        >
          <NDatePicker
            v-model:value="formData.lastLoginTime as any"
            class="w-full"
            type="datetime"
            clearable
          />
        </NFormItemGi>
        <NFormItemGi
          :span="24"
          :label="$t('user.lastLoginIp')"
          path="lastLoginIp"
        >
          <NInput
            v-model:value="formData.lastLoginIp"
            :placeholder="$t('common.placeholder', [$t('user.lastLoginIp')])"
          />
        </NFormItemGi>
        <NFormItemGi
          :span="24"
          :label="$t('user.miniOpenid')"
          path="miniOpenid"
        >
          <NInput
            v-model:value="formData.miniOpenid"
            :placeholder="$t('common.placeholder', [$t('user.miniOpenid')])"
          />
        </NFormItemGi>
        <NFormItemGi :span="24" :label="$t('user.offOpenid')" path="offOpenid">
          <NInput
            v-model:value="formData.offOpenid"
            :placeholder="$t('common.placeholder', [$t('user.offOpenid')])"
          />
        </NFormItemGi>
        <NFormItemGi
          :span="24"
          :label="$t('user.wechatUnionid')"
          path="wechatUnionid"
        >
          <NInput
            v-model:value="formData.wechatUnionid"
            :placeholder="$t('common.placeholder', [$t('user.wechatUnionid')])"
          />
        </NFormItemGi>
      </NGrid>
    </NForm>
  </Drawer>
</template>

<style scoped></style>

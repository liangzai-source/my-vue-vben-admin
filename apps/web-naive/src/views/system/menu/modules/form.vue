<script lang="ts" setup>
import type {
  FormInst,
  FormItemRule,
  FormRules,
  FormValidationError,
} from 'naive-ui';

import { computed, ref, useTemplateRef } from 'vue';

import { IconPicker, useVbenDrawer } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { VbenIcon } from '@vben-core/shadcn-ui';

import {
  NCheckbox,
  NDivider,
  NForm,
  NFormItemGi,
  NGrid,
  NInput,
  NInputNumber,
  NPopover,
  NRadioButton,
  NRadioGroup,
  NSelect,
} from 'naive-ui';

import { z } from '#/adapter/form';
import {
  createMenuApi,
  isMenuNameExists,
  SystemMenuApi,
  updateMenuApi,
} from '#/api/system/menu';
import MenuSelect from '#/components/common/MenuSelect.vue';
import StatusRadios from '#/components/common/StatusRadios.vue';
import {
  getApiMethodList,
  handleFormError,
  isEmpty,
  refreshMenu,
  showFormMessage,
} from '#/utils/tools';

import {
  getBadgeOptions,
  getBadgeTypeOptions,
  getMenuTypeOptions,
} from '../hooks';

const emit = defineEmits<{
  (e: 'success'): void;
}>();
const loading = ref<boolean>(false);
const defaultFormValue = {
  type: 1,
  status: 1,
  api_method: 'POST',
  meta: {},
} as SystemMenuApi.SystemMenu;
const formData = ref<SystemMenuApi.SystemMenu>(defaultFormValue);
const formRef = useTemplateRef<FormInst>('form');
const baseRules: FormRules = {
  name: [
    {
      trigger: 'blur',
      validator: async (_rule: FormItemRule, value: string = '') => {
        const nameSchema = z
          .string()
          .min(2, $t('ui.formRules.minLength', [$t('system.menu.menuName'), 2]))
          .max(
            30,
            $t('ui.formRules.maxLength', [$t('system.menu.menuName'), 30]),
          )
          .refine(
            async (val) => !(await isMenuNameExists(val, formData.value?.id)),
            (val) => ({
              message: $t('ui.formRules.alreadyExists', [
                $t('system.menu.menuName'),
                val,
              ]),
            }),
          );

        const result = await nameSchema.safeParseAsync(value);
        if (!result.success) {
          const issues = result.error.issues;
          throw new Error(issues?.[0]?.message);
        }
      },
    },
  ],
  'meta.title': [
    {
      trigger: 'blur',
      required: true,
      message: $t('ui.formRules.required', [$t('system.menu.menuTitle')]),
    },
  ],
  path: [
    {
      trigger: 'blur',
      required: true,
      message: $t('ui.formRules.required', [$t('system.menu.path')]),
    },
  ],
  component: [
    {
      trigger: 'blur',
      required: true,
      message: $t('ui.formRules.required', [$t('system.menu.component')]),
    },
  ],
};
const formRules = computed<FormRules>(() => {
  return {
    ...baseRules,
    authCode: [
      {
        trigger: 'blur',
        // required: formData.value.type === 2,
        required: true,
        message: $t('ui.formRules.required', [$t('system.menu.authCode')]),
      },
    ],
  };
});

async function formConfirm() {
  formRef.value
    ?.validate()
    .then(async () => {
      drawerApi.lock();
      loading.value = true;
      const data = formData.value;
      if (data.type === 4) {
        data.meta = { ...data.meta, link: data.linkSrc };
      } else if (data.type === 3) {
        data.meta = { ...data.meta, iframeSrc: data.linkSrc };
      }
      delete data.linkSrc;
      try {
        await (formData.value?.id
          ? updateMenuApi(data.id, data)
          : createMenuApi(data));
        await refreshMenu();
        await drawerApi.close();
        loading.value = false;
        emit('success');
        showFormMessage(formData.value?.id);
      } finally {
        drawerApi.unlock();
      }
    })
    .catch((error: Array<FormValidationError>) => {
      loading.value = false;
      handleFormError(error);
    });
}

const [Drawer, drawerApi] = useVbenDrawer({
  onConfirm: formConfirm,
  onOpenChange: (isOpen) => {
    const data = drawerApi.getData<SystemMenuApi.SystemMenu>();
    if (isOpen) {
      if (data?.type === 3) {
        data.linkSrc = data.meta?.link;
      } else if (data?.type === 4) {
        data.linkSrc = data.meta?.iframeSrc;
      }
      if (!isEmpty(data)) {
        if (!data?.meta) {
          data.meta = {};
        }
        if (isEmpty(data.type)) {
          data.type = 1;
        }
        if (isEmpty(data.status)) {
          data.status = 1;
        }
        if (isEmpty(data.api_method)) {
          data.api_method = 'POST';
        }
        formData.value = data;
      }
    }
  },
});
const getDrawerTitle = computed(() =>
  formData.value?.id
    ? $t('common.update', [$t('system.menu.name')])
    : $t('common.create', [$t('system.menu.name')]),
);
</script>
<template>
  <Drawer
    :loading="loading"
    :title="getDrawerTitle"
    class="w-full max-w-[800px]"
  >
    <NForm
      ref="form"
      :model="formData"
      :rules="formRules"
      label-placement="left"
      label-width="100px"
    >
      <NGrid :cols="24" :x-gap="24">
        <NFormItemGi :label="`${$t('system.menu.type')}`" :span="24">
          <NRadioGroup v-model:value="formData.type">
            <template v-for="v in getMenuTypeOptions()" :key="v.value">
              <NRadioButton :value="v.value">{{ v.label }}</NRadioButton>
            </template>
          </NRadioGroup>
        </NFormItemGi>
        <NFormItemGi
          :label="`${$t('system.menu.menuName')}`"
          :span="12"
          path="name"
        >
          <NInput v-model:value="formData.name" />
        </NFormItemGi>
        <NFormItemGi :label="`${$t('system.menu.parent')}`" :span="12">
          <MenuSelect v-model:value="formData.pid" />
        </NFormItemGi>
        <NFormItemGi
          :label="`${$t('system.menu.menuTitle')}`"
          :span="12"
          path="meta.title"
        >
          <NInput v-model:value="formData.meta.title" />
        </NFormItemGi>
        <NFormItemGi
          v-if="[5, 1, 3].includes(formData.type)"
          :label="`${$t('system.menu.path')}`"
          :span="12"
          path="path"
        >
          <NInput v-model:value="formData.path" />
        </NFormItemGi>
        <NFormItemGi v-if="[1, 3].includes(formData.type)" :span="12">
          <template #label>
            <div class="flex items-center">
              <span>{{ $t('system.menu.activePath') }}</span>
              <NPopover>
                <template #trigger>
                  <div class="ml-1">
                    <VbenIcon
                      class="text-lg text-gray-600"
                      icon="stash:question"
                    />
                  </div>
                </template>
                <span>{{ $t('system.menu.activePathHelp') }}</span>
              </NPopover>
            </div>
          </template>
          <NInput v-model:value="formData.meta.activePath" />
        </NFormItemGi>
        <NFormItemGi
          v-if="[5, 1, 3, 4].includes(formData.type)"
          :label="`${$t('system.menu.icon')}`"
          :span="12"
        >
          <IconPicker v-model="formData.meta.icon" />
        </NFormItemGi>
        <NFormItemGi
          v-if="[5, 1, 3].includes(formData.type)"
          :label="`${$t('system.menu.activeIcon')}`"
          :span="12"
        >
          <IconPicker v-model="formData.meta.activeIcon" />
        </NFormItemGi>
        <NFormItemGi
          v-if="formData.type === 1"
          :label="`${$t('system.menu.component')}`"
          :span="12"
          path="component"
        >
          <NInput v-model:value="formData.component" />
        </NFormItemGi>
        <NFormItemGi
          v-if="[3, 4].includes(formData.type)"
          :label="`${$t('system.menu.linkSrc')}`"
          :span="12"
          path="linkSrc"
        >
          <NInput v-model:value="formData.linkSrc" />
        </NFormItemGi>
        <NFormItemGi
          :label="`${$t('system.menu.authCode')}`"
          :span="12"
          path="authCode"
        >
          <NInput v-model:value="formData.authCode" />
        </NFormItemGi>
        <NFormItemGi
          :label="`${$t('system.menu.requestRoute')}`"
          :span="12"
          path="apiPath"
        >
          <NInput v-model:value="formData.api_path" />
        </NFormItemGi>
        <NFormItemGi
          :label="`${$t('system.menu.requestMethod')}`"
          :span="12"
          path="apiMethod"
        >
          <NSelect
            v-model:value="formData.api_method"
            :options="getApiMethodList()"
          />
        </NFormItemGi>
        <NFormItemGi :label="`${$t('system.menu.status')}`" :span="12">
          <StatusRadios v-model:status="formData.status" />
        </NFormItemGi>
        <NFormItemGi
          v-if="formData.type !== 2"
          :label="`${$t('system.menu.badgeType.title')}`"
          :span="12"
        >
          <NSelect
            v-model:value="formData.meta.badgeType"
            :options="getBadgeOptions()"
            clearable
          />
        </NFormItemGi>
        <NFormItemGi
          v-if="formData.type !== 2"
          :label="`${$t('system.menu.badge')}`"
          :span="12"
        >
          <NInput
            v-model:value="formData.meta.badge"
            :disabled="formData.meta?.badgeType !== 'normal'"
          />
        </NFormItemGi>
        <NFormItemGi
          v-if="formData.type !== 2"
          :label="`${$t('system.menu.badgeVariants')}`"
          :span="12"
        >
          <NSelect
            v-model:value="formData.meta.badgeVariants"
            :options="getBadgeTypeOptions()"
            clearable
          />
        </NFormItemGi>
        <NFormItemGi v-if="![2].includes(formData.type)" :span="12">
          <template #label>
            <div class="flex items-center justify-end">
              <span>{{ $t('system.menu.sort') }}</span>
              <NPopover>
                <template #trigger>
                  <div class="ml-1">
                    <VbenIcon
                      class="text-lg text-gray-600"
                      icon="stash:question"
                    />
                  </div>
                </template>
                <span>{{ $t('system.menu.sortHelp') }}</span>
              </NPopover>
            </div>
          </template>
          <NInputNumber v-model:value="formData.sort" />
        </NFormItemGi>
        <NFormItemGi v-if="![2, 4].includes(formData.type)" :span="24">
          <NDivider>其他设置</NDivider>
        </NFormItemGi>
        <NFormItemGi
          v-if="[1].includes(formData.type)"
          :span="12"
          class="pl-10"
          label=""
        >
          <NCheckbox v-model:checked="formData.meta.keepAlive">
            {{ $t('system.menu.keepAlive') }}
          </NCheckbox>
        </NFormItemGi>
        <NFormItemGi
          v-if="[1, 3].includes(formData.type)"
          :span="12"
          class="pl-10"
          label=""
        >
          <NCheckbox v-model:checked="formData.meta.affixTab">
            {{ $t('system.menu.affixTab') }}
          </NCheckbox>
        </NFormItemGi>
        <NFormItemGi
          v-if="![2].includes(formData.type)"
          :span="12"
          class="pl-10"
          label=""
        >
          <NCheckbox v-model:checked="formData.meta.hideInMenu">
            {{ $t('system.menu.hideInMenu') }}
          </NCheckbox>
        </NFormItemGi>
        <NFormItemGi
          v-if="[5, 1].includes(formData.type)"
          :span="12"
          class="pl-10"
          label=""
        >
          <NCheckbox v-model:checked="formData.meta.hideChildrenInMenu">
            {{ $t('system.menu.hideChildrenInMenu') }}
          </NCheckbox>
        </NFormItemGi>
        <NFormItemGi
          v-if="![2, 4].includes(formData.type)"
          :span="12"
          class="pl-10"
          label=""
        >
          <NCheckbox v-model:checked="formData.meta.hideInBreadcrumb">
            {{ $t('system.menu.hideInBreadcrumb') }}
          </NCheckbox>
        </NFormItemGi>
        <NFormItemGi
          v-if="![2, 4].includes(formData.type)"
          :span="12"
          class="pl-10"
          label=""
        >
          <NCheckbox v-model:checked="formData.meta.hideInTab">
            {{ $t('system.menu.hideInTab') }}
          </NCheckbox>
        </NFormItemGi>
      </NGrid>
    </NForm>
  </Drawer>
</template>

<style scoped></style>

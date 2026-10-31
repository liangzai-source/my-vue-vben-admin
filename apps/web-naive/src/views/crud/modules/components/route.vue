<script setup lang="ts">
import type { Route } from '#/crud/types';

import { IconPicker } from '@vben/common-ui';

import { NCard, NForm, NFormItemGi, NGrid, NInput, NSwitch } from 'naive-ui';

import MenuSelect from '#/components/common/MenuSelect.vue';
import { useModelProxy } from '#/utils/tools';

const modelValue = defineModel<Route>({ required: true });
const formData = useModelProxy<Route>(modelValue);
</script>

<template>
  <NCard>
    <NForm :model="formData" label-placement="left" label-width="120">
      <NGrid :cols="24" :x-gap="24">
        <NFormItemGi :span="12" label="生成菜单">
          <NSwitch v-model:value="formData.createMenu" />
        </NFormItemGi>

        <NFormItemGi :span="12" label="生成前端路由">
          <NSwitch v-model:value="formData.createRoute" />
        </NFormItemGi>

        <NFormItemGi :span="12" label="菜单名称">
          <NInput
            v-model:value="formData.menuName"
            placeholder="例如：商品管理"
          />
        </NFormItemGi>

        <NFormItemGi :span="12" label="路由名称">
          <NInput
            v-model:value="formData.routeName"
            placeholder="例如：ProductList"
          />
        </NFormItemGi>

        <NFormItemGi :span="12" label="API 接口路径">
          <NInput
            v-model:value="formData.apiPath"
            placeholder="留空则自动推导，例如：/api/goods"
          />
        </NFormItemGi>

        <NFormItemGi :span="12" label="前端页面路径">
          <NInput
            v-model:value="formData.pagePath"
            placeholder="留空则自动推导，例如：/goods"
          />
        </NFormItemGi>

        <NFormItemGi :span="12" label="上级菜单">
          <MenuSelect v-model:value="formData.parentMenu" />
        </NFormItemGi>

        <NFormItemGi :span="12" label="菜单图标">
          <IconPicker v-model="formData.menuIcon" />
        </NFormItemGi>
      </NGrid>
    </NForm>
  </NCard>
</template>

<style scoped></style>

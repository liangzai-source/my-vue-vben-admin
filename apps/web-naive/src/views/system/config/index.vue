<script lang="ts" setup>
import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';

import type { SystemConfigApi } from '#/api/system/config';

import { onMounted, ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';

import cloneDeep from 'lodash.clonedeep';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  systemConfigDeleteApi,
  systemConfigListApi,
} from '#/api/system/config';
import { systemConfigCategoryAllApi } from '#/api/system/config-category';
import IconButton from '#/components/common/IconButton.vue';
import { useDefaultGridOptions } from '#/hooks/defaultGirdOptions';
import { useTableAction } from '#/hooks/tableAction';
import { checkPermission } from '#/utils/access';
import { useSystemConfigColumns } from '#/views/system/config/hooks';
import Form from '#/views/system/config/modules/form.vue';

const categoryOptions = ref<{ label: string; value: number }[]>([]);

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

const { onActionClick } = useTableAction<SystemConfigApi.SystemConfig>({
  update: onUpdate,
  delete: onDelete,
});

const getGridOptions: VxeTableGridOptions<SystemConfigApi.SystemConfig> =
  useDefaultGridOptions(
    useSystemConfigColumns(onActionClick),
    systemConfigListApi,
  );

// 添加表单搜索项
getGridOptions.formConfig = {
  items: [
    {
      field: 'categoryId',
      title: $t('system.config.category'),
      itemRender: {
        name: 'NSelect',
        props: {
          options: categoryOptions,
          placeholder: '全部所属分类',
          clearable: true,
        },
      },
    },
    {
      field: 'name',
      title: $t('system.config.name'),
      itemRender: {
        name: 'NInput',
        props: {
          placeholder: '请输入配置名称',
          clearable: true,
        },
      },
    },
    {
      field: 'key',
      title: $t('system.config.key'),
      itemRender: {
        name: 'NInput',
        props: {
          placeholder: '请输入Key',
          clearable: true,
        },
      },
    },
  ],
};

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: getGridOptions,
});

onMounted(async () => {
  try {
    const list = await systemConfigCategoryAllApi();
    categoryOptions.value = list.map((c) => ({
      label: c.name,
      value: c.id,
    }));
  } catch (error) {
    console.error(error);
  }
});

function onUpdate(row: SystemConfigApi.SystemConfig) {
  formModalApi.setData(cloneDeep(row)).open();
}

async function onDelete(row: SystemConfigApi.SystemConfig) {
  await systemConfigDeleteApi(row.id);
  gridApi.reload();
}

function handleAdd() {
  formModalApi.setData({}).open();
}
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-tools>
        <IconButton
          v-if="checkPermission('system:config:create')"
          icon="ant-design:plus-outlined"
          type="primary"
          @click="handleAdd"
        >
          {{ $t('common.create', [$t('system.config.entityTitle')]) }}
        </IconButton>
      </template>
    </Grid>
    <FormModal @success="gridApi.reload()" />
  </Page>
</template>

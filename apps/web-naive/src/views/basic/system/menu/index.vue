<script setup lang="ts">
import type { CSSProperties } from 'vue';

import type { OnActionClickParams } from '#/adapter/vxe-table';

import { computed, ref } from 'vue';

import { Page, useVbenDrawer } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { MenuBadge } from '@vben-core/menu-ui';
import { VbenIcon } from '@vben-core/shadcn-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  allMenuApi,
  deleteMenuApi,
  SystemMenuApi,
  updateMenuStatusApi,
} from '#/api/system/menu';
import IconButton from '#/components/common/IconButton.vue';
import { useStatusChange } from '#/hooks/statusConfirm';
import { refreshMenu } from '#/utils/tools';
import { useMenuColumns } from '#/views/basic/system/menu/hooks';

import Form from './modules/form.vue';

const { statusChangeFunc } = useStatusChange<SystemMenuApi.SystemMenu>(
  updateMenuStatusApi,
  refreshMenu,
);
function onActionClick({
  code,
  row,
}: OnActionClickParams<SystemMenuApi.SystemMenu>) {
  switch (code) {
    case 'append': {
      onAppend(row);
      break;
    }
    case 'delete': {
      onDelete(row);
      break;
    }
    case 'update': {
      onUpdate(row);
      break;
    }
    default: {
      break;
    }
  }
}
const statusChangeFun = async (
  newStatus: any,
  row: SystemMenuApi.SystemMenu,
) => {
  await statusChangeFunc(newStatus, row);
};
const defaultExpandStatus: boolean = false;
const expandAllStatus = ref<boolean>(defaultExpandStatus);
const expandIconStyle = computed<CSSProperties>(() => {
  return {
    transform:
      expandAllStatus.value === false ? 'rotate(180deg)' : 'rotate(0deg)',
  };
});
const expandText = computed<string>(() => {
  return expandAllStatus.value === false
    ? $t('common.expandAll')
    : $t('common.foldUpAll');
});

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useMenuColumns(onActionClick, statusChangeFun),
    height: 'auto',
    keepSource: true,
    pagerConfig: {
      enabled: false,
    },
    proxyConfig: {
      ajax: {
        query: async (_params: any) => {
          return await allMenuApi();
        },
      },
    },
    rowConfig: {
      keyField: 'id',
    },
    toolbarConfig: {
      custom: true,
      export: false,
      refresh: true,
      zoom: true,
    },
    treeConfig: {
      parentField: 'pid',
      rowField: 'id',
      transform: false,
      expandAll: expandAllStatus.value,
    },
  },
  gridEvents: {
    initRendered: () => {
      expandAllStatus.value = defaultExpandStatus;
    },
  },
});

function handleExpand() {
  expandAllStatus.value = !expandAllStatus.value;
  gridApi.grid?.setAllTreeExpand(expandAllStatus.value);
}

const [FormDrawer, formDrawerApi] = useVbenDrawer({
  connectedComponent: Form,
  destroyOnClose: true,
});

function onRefresh() {
  gridApi.query();
}

function onUpdate(row: SystemMenuApi.SystemMenu) {
  formDrawerApi.setData(row).open();
}

function onAppend(row: SystemMenuApi.SystemMenu) {
  formDrawerApi.setData({ pid: row.id }).open();
}

function onDelete(row: SystemMenuApi.SystemMenu) {
  deleteMenuApi(row.id).then(() => {
    refreshMenu();
    gridApi.query();
  });
}

function onCreate() {
  formDrawerApi.setData({}).open();
}
</script>

<template>
  <Page auto-content-height>
    <FormDrawer @success="onRefresh" />
    <Grid>
      <template #toolbar-tools>
        <IconButton
          icon="ic:outline-plus"
          @click="onCreate"
          v-access:code="'sys:menu:create'"
        >
          {{ $t('ui.actionTitle.create', [$t('system.menu.name')]) }}
        </IconButton>
        <IconButton
          icon="icon-park-outline:up"
          :icon-style="expandIconStyle"
          @click="handleExpand"
        >
          {{ expandText }}
        </IconButton>
      </template>
      <template #title="{ row }">
        <div class="flex w-full items-center gap-1">
          <div class="size-5 flex-shrink-0">
            <VbenIcon
              v-if="row.type === 'button'"
              icon="carbon:security"
              class="size-full"
            />
            <VbenIcon
              v-else-if="row.meta?.icon"
              :icon="row.meta?.icon || 'carbon:circle-dash'"
              class="size-full"
            />
          </div>
          <span class="flex-auto">{{ $t(row.meta?.title) }}</span>
          <div class="items-center justify-end"></div>
        </div>
        <MenuBadge
          v-if="row.meta?.badgeType"
          class="menu-badge"
          :badge="row.meta.badge"
          :badge-type="row.meta.badgeType"
          :badge-variants="row.meta.badgeVariants"
        />
      </template>
    </Grid>
  </Page>
</template>

<style scoped></style>

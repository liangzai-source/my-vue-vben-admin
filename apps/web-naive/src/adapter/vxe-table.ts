import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';
import type { Recordable } from '@vben/types';

import type { ComponentPropsMap, ComponentType } from './component';

import { h, type VNodeProps } from 'vue';

import { $te } from '@vben/locales';
import {
  setupVbenVxeTable,
  useVbenVxeGrid as useGrid,
} from '@vben/plugins/vxe-table';
import { get, isFunction, isString } from '@vben/utils';

import { VbenIcon } from '@vben-core/shadcn-ui';

import { objectOmit } from '@vueuse/core';
import {
  NImage as Image,
  NButton,
  NPopconfirm as PopConfirm,
  NSwitch as Switch,
  type SwitchProps,
  NTag as Tag,
} from 'naive-ui';

import { $t } from '#/locales';
import { getByPath, getTableDefaultOperation } from '#/utils/tools';

import { useVbenForm } from './form';

setupVbenVxeTable({
  configVxeTable: (vxeUI) => {
    vxeUI.setConfig({
      grid: {
        align: 'center',
        border: false,
        columnConfig: {
          resizable: true,
        },

        formConfig: {
          // 全局禁用vxe-table的表单配置，使用formOptions
          enabled: false,
        },
        minHeight: 180,
        proxyConfig: {
          autoLoad: true,
          response: {
            result: 'items',
            total: 'total',
            list: '',
          },
          showActiveMsg: true,
          showResponseMsg: false,
        },
        round: true,
        showOverflow: true,
        size: 'small',
      } as VxeTableGridOptions,
    });

    /**
     * 解决vxeTable在热更新时可能会出错的问题
     */
    vxeUI.renderer.forEach((_item, key) => {
      if (key.startsWith('Cell')) {
        vxeUI.renderer.delete(key);
      }
    });

    // 表格配置项可以用 cellRender: { name: 'CellImage' },
    vxeUI.renderer.add('CellImage', {
      renderTableDefault(renderOpts, params) {
        const { props } = renderOpts;
        const { column, row } = params;
        return h(Image, { src: row[column.field], ...props });
      },
    });

    // 表格配置项可以用 cellRender: { name: 'CellLink' },
    vxeUI.renderer.add('CellLink', {
      renderTableDefault(renderOpts) {
        const { props } = renderOpts;
        return h(
          NButton,
          { size: 'small', type: 'primary', quaternary: true },
          { default: () => props?.text },
        );
      },
    });

    // 单元格渲染： Tag
    vxeUI.renderer.add('CellTag', {
      renderTableDefault({ options, props }, { column, row }) {
        const value = get(row, column.field);
        const tagOptions = options ?? [
          { type: 'success', label: $t('common.enabled'), value: 1 },
          { type: 'error', label: $t('common.disabled'), value: 0 },
        ];
        const tagItem = tagOptions.find((item) => item.value === value);
        return h(
          Tag,
          {
            bordered: false,
            round: true,
            ...props,
            ...objectOmit(tagItem ?? {}, ['label']),
          },
          { default: () => tagItem?.label ?? value },
        );
      },
    });

    vxeUI.renderer.add('CellSwitch', {
      renderTableDefault({ attrs, props }, { column, row }) {
        const loadingKey = `__loading_${column.field}`;
        const baseSwitchProps: SwitchProps = {
          checkedValue: 1,
          uncheckedValue: 2,
          rubberBand: false,
          loading: row[loadingKey] ?? false,
          value: row[column.field],
          round: true,
          size: 'medium',
          ...(props as Partial<SwitchProps>),
        };

        function onChange(newVal: boolean | number | string) {
          const oldVal = row[column.field];
          const handleChange = async () => {
            row[loadingKey] = true;
            try {
              const result = await attrs?.beforeChange?.(newVal, row);
              if (result !== false) {
                row[column.field] = newVal;
              }
            } catch (error) {
              console.error('Switch change error:', error);
              row[column.field] = oldVal;
            } finally {
              row[loadingKey] = false;
            }
          };
          handleChange().catch((error) => {
            row[column.field] = oldVal;
            console.error('Switch change error:', error);
          });
        }

        // 3. 组合最终 props，明确 onUpdate:value 类型
        const finallyProps = {
          ...baseSwitchProps,
          'onUpdate:value': onChange,
        } as SwitchProps & VNodeProps;

        // 渲染 NSwitch
        return h(Switch, finallyProps, {
          checked: () => $t('common.enabled'),
          unchecked: () => $t('common.disabled'),
        });
      },
    });

    /**
     * 注册表格的操作按钮渲染器
     */
    vxeUI.renderer.add('CellOperation', {
      renderTableDefault({ attrs, options, props }, { column, row }) {
        const defaultProps = {
          size: 'small',
          type: 'primary',
          quaternary: true,
          ...props,
        };
        let align;
        switch (column.align) {
          case 'center': {
            align = 'center';
            break;
          }
          case 'left': {
            align = 'start';
            break;
          }
          default: {
            align = 'end';
            break;
          }
        }
        const [presets, defaultOptions] = getTableDefaultOperation();
        const operations: Array<Recordable<any>> = (options || defaultOptions)
          .map((opt) => {
            if (isString(opt)) {
              return presets[opt]
                ? { code: opt, ...defaultProps, ...presets[opt] }
                : {
                    code: opt,
                    btnText: $te(`common.${opt}`) ? $t(`common.${opt}`) : opt,
                    ...defaultProps,
                  };
            } else {
              return { ...defaultProps, ...presets[opt.code], ...opt };
            }
          })
          .map((opt) => {
            const optBtn: Recordable<any> = {};
            Object.keys(opt).forEach((key) => {
              optBtn[key] = isFunction(opt[key]) ? opt[key](row) : opt[key];
            });
            return optBtn;
          })
          .filter((opt) => opt.show !== false);

        function renderBtn(opt: Recordable<any>, listen = true) {
          // 兜底按钮文本，避免空文本
          const btnText = opt.btnText || $t('common.operate');
          // 兜底按钮点击事件，避免空函数
          const onClick = listen
            ? () =>
                attrs?.onClick?.({
                  code: opt.code || 'unknown',
                  row,
                })
            : undefined;
          type Size = 'large' | 'medium' | 'small' | 'tiny';
          return h(
            NButton,
            {
              ...props,
              ...opt,
              onClick,
              type: opt.type || 'primary',
              size: (opt.size as Size) || 'small',
            },
            {
              default: () => {
                const content = [];
                if (opt.icon) {
                  content.push(
                    h(VbenIcon, { class: 'size-5', icon: opt.icon }),
                  );
                }
                content.push(btnText);
                return content.length > 0 ? content : btnText; // 兜底文本
              },
            },
          );
        }

        // 找到 vxeUI.renderer.add('CellOperation', { ... }) 中的 renderConfirm 方法
        function renderConfirm(opt: Recordable<any>) {
          // 先确保触发按钮存在
          const triggerBtn = renderBtn({ ...opt }, false);
          if (!triggerBtn) {
            return h('span', ''); // 兜底空元素，避免 Popconfirm 无 trigger
          }
          const displayName = getByPath(row, attrs?.nameField);
          return h(
            PopConfirm,
            {
              title: $t('ui.actionTitle.delete', [attrs?.nameTitle || '']),
              ...props,
              ...opt,
              showIcon: true,
              placement: 'top',
              // 补充：确保 Popconfirm 有默认的触发行为
              trigger: 'click',
              'on-positive-click': () => {
                attrs?.onClick?.({
                  code: opt.code,
                  row,
                });
              },
            },
            {
              // 明确命名 trigger 插槽（Naive UI 要求）
              trigger: () => triggerBtn,
              // 内容插槽
              default: () =>
                h(
                  'div',
                  { class: 'truncate' },
                  $t('ui.actionMessage.deleteConfirm', [
                    displayName, // 兜底空值
                  ]),
                ),
            },
          );
        }

        const btns = operations.map((opt) =>
          opt.code === 'delete' ? renderConfirm(opt) : renderBtn(opt),
        );
        return h(
          'div',
          {
            class: 'flex table-operations',
            style: { justifyContent: align },
          },
          btns,
        );
      },
    });

    // 这里可以自行扩展 vxe-table 的全局配置，比如自定义格式化
    // vxeUI.formats.add
  },
  useVbenForm,
});

export const useVbenVxeGrid = <T extends Record<string, any>>(
  ...rest: Parameters<typeof useGrid<T, ComponentType, ComponentPropsMap>>
) => useGrid<T, ComponentType, ComponentPropsMap>(...rest);

export type OnActionClickParams<T = Recordable<any>> = {
  code: string;
  row: T;
};
export type OnActionClickFn<T = Recordable<any>> = (
  params: OnActionClickParams<T>,
) => void;
export type * from '@vben/plugins/vxe-table';

import type { SwitchProps } from 'naive-ui';

import type { VNodeProps } from 'vue';

import type { FormValues } from '@vben/common-ui';
import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';
import type { Recordable } from '@vben/types';

import type { ComponentPropsMap, ComponentType } from './component';

import { h } from 'vue';

import { $te } from '@vben/locales';
import {
  setupVbenVxeTable,
  useVbenVxeGrid as useGrid,
} from '@vben/plugins/vxe-table';
import {
  formatDate,
  formatDateTime,
  get,
  isFunction,
  isString,
} from '@vben/utils';

import { VbenIcon } from '@vben-core/shadcn-ui';

import { objectOmit } from '@vueuse/core';
import {
  NImage as Image,
  NImageGroup as ImageGroup,
  NButton,
  NInput,
  NInputNumber,
  NSpin,
  NPopconfirm as PopConfirm,
  NSwitch as Switch,
  NTag as Tag,
} from 'naive-ui';

import { getFileUrl } from '#/api/system/upload';
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
          showLoading: true,
          showActionMsg: true,
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
        const val = row[column.field];
        if (!val) return '';
        const url = getFileUrl(val);
        return h(Image, {
          height: 40,
          imgProps: {
            style: {
              cursor: 'pointer',
              display: 'block',
              height: '40px',
              objectFit: 'cover',
              width: '40px',
            },
          },
          objectFit: 'cover',
          previewSrc: url,
          src: url,
          style: {
            borderRadius: '4px',
            cursor: 'pointer',
            verticalAlign: 'middle',
          },
          width: 40,
          ...props,
        });
      },
    });

    // 表格配置项：CellAttachment 专属附件/多媒体预览
    vxeUI.renderer.add('CellAttachment', {
      renderTableDefault(_renderOpts, params) {
        const { column, row } = params;
        const rawVal = row[column.field];
        if (!rawVal) return '-';

        let list: string[] = [];
        if (Array.isArray(rawVal)) {
          list = rawVal.map(String).filter(Boolean);
        } else if (typeof rawVal === 'string') {
          const trimmed = rawVal.trim();
          if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            try {
              const parsed = JSON.parse(trimmed);
              if (Array.isArray(parsed)) {
                list = parsed.map(String).filter(Boolean);
              }
            } catch {
              list = [trimmed];
            }
          } else if (trimmed.includes(',')) {
            list = trimmed
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean);
          } else {
            list = [trimmed];
          }
        }

        if (list.length === 0) return '-';

        const isDoc = (p: string) => {
          const l = p.toLowerCase();
          return (
            l.endsWith('.pdf') ||
            l.endsWith('.doc') ||
            l.endsWith('.docx') ||
            l.endsWith('.xls') ||
            l.endsWith('.xlsx') ||
            l.endsWith('.zip') ||
            l.endsWith('.rar') ||
            l.endsWith('.tar') ||
            l.endsWith('.gz') ||
            l.endsWith('.txt')
          );
        };

        const first = list[0] ?? '';
        if (isDoc(first)) {
          const ext = first.split('.').pop()?.toUpperCase() || 'FILE';
          return h(
            Tag,
            {
              bordered: false,
              round: true,
              size: 'small',
              style: { cursor: 'pointer' },
              type: 'info',
              onClick: (e: MouseEvent) => {
                e.stopPropagation();
                window.open(getFileUrl(first), '_blank');
              },
            },
            { default: () => `📄 ${ext}` },
          );
        }

        const imagesNodes = list.map((path, idx) => {
          const url = getFileUrl(path);
          return h(Image, {
            height: 36,
            imgProps: {
              style: {
                cursor: 'pointer',
                display: 'block',
                height: '36px',
                objectFit: 'cover',
                width: '36px',
              },
            },
            key: idx,
            objectFit: 'cover',
            previewSrc: url,
            src: url,
            style: {
              borderRadius: '4px',
              cursor: 'pointer',
              display: idx === 0 ? 'inline-block' : 'none',
              verticalAlign: 'middle',
            },
            width: 36,
          });
        });

        if (list.length > 1) {
          return h(
            ImageGroup,
            {},
            {
              default: () => [
                h(
                  'div',
                  {
                    style: {
                      alignItems: 'center',
                      display: 'inline-flex',
                      gap: '4px',
                    },
                  },
                  [
                    ...imagesNodes,
                    h(
                      Tag,
                      { round: true, size: 'tiny', type: 'primary' },
                      { default: () => `+${list.length}` },
                    ),
                  ],
                ),
              ],
            },
          );
        }

        return imagesNodes[0] || '-';
      },
    });

    // 表格配置项：CellLink 链接展示 (URL在新窗口打开，文本则展示为可点击按钮)
    vxeUI.renderer.add('CellLink', {
      renderTableDefault({ props }, { column, row }) {
        const val = row[column.field];
        if (val === undefined || val === null || val === '') return '-';
        const text = props?.text || String(val);
        const href =
          isString(val) &&
          (val.startsWith('http://') ||
            val.startsWith('https://') ||
            val.startsWith('/'))
            ? val
            : undefined;

        if (href) {
          return h(
            'a',
            {
              class:
                'text-primary hover:underline underline-offset-4 inline-flex items-center gap-1 cursor-pointer',
              href,
              onClick: (e: MouseEvent) => {
                e.stopPropagation();
              },
              rel: 'noopener noreferrer',
              target: '_blank',
            },
            [
              text,
              h(VbenIcon, {
                class: 'size-3.5 opacity-70 shrink-0',
                icon: 'lucide:external-link',
              }),
            ],
          );
        }

        return h(
          NButton,
          { size: 'small', type: 'primary', quaternary: true },
          { default: () => text },
        );
      },
    });

    // 表格配置项：CellDateTime 日期时间 (根据前端浏览器本地时区自动格式化)
    vxeUI.renderer.add('CellDateTime', {
      renderTableDefault(_renderOpts, { column, row }) {
        const val = row[column.field];
        if (
          !val ||
          val === '0001-01-01T00:00:00Z' ||
          val === '1970-01-01T00:00:00Z'
        ) {
          return '-';
        }
        return formatDateTime(val) || '-';
      },
    });

    // 表格配置项：CellInput 可修改文本框 (移入显现编辑图标，点击即改)
    vxeUI.renderer.add('CellInput', {
      renderTableDefault({ attrs }, { column, row }) {
        const isEditKey = `__isEdit_${column.field}`;
        const loadingKey = `__loading_${column.field}`;
        const editValKey = `__editVal_${column.field}`;

        const isEditing = Boolean(row[isEditKey]);
        const isLoading = Boolean(row[loadingKey]);

        const submitChange = async () => {
          if (!row[isEditKey]) return;
          row[isEditKey] = false;
          const oldVal = row[column.field] ?? '';
          const newVal = row[editValKey] ?? '';
          if (newVal === oldVal) return;

          row[loadingKey] = true;
          try {
            const res = await attrs?.beforeChange?.(newVal, row, column.field);
            if (res !== false) {
              row[column.field] = newVal;
            }
          } catch (error) {
            console.error('CellInput save failed:', error);
          } finally {
            row[loadingKey] = false;
          }
        };

        if (isEditing) {
          return h(NInput, {
            autofocus: true,
            class: 'w-full',
            defaultValue: row[editValKey],
            onBlur: () => {
              void submitChange();
            },
            onKeydown: (e: KeyboardEvent) => {
              if (e.key === 'Enter') {
                void submitChange();
              } else if (e.key === 'Escape') {
                row[isEditKey] = false;
              }
            },
            'onUpdate:value': (val: string) => {
              row[editValKey] = val;
            },
            size: 'small',
          });
        }

        return h(
          'div',
          {
            class:
              'group inline-flex items-center justify-center gap-1.5 min-h-[28px] max-w-full px-2 py-0.5 rounded cursor-pointer hover:bg-muted/40 transition-colors',
            onClick: () => {
              row[editValKey] = row[column.field] ?? '';
              row[isEditKey] = true;
            },
            title: '点击可快捷修改',
          },
          [
            isLoading
              ? h(NSpin, { size: 14 })
              : h(
                  'span',
                  { class: 'truncate select-none' },
                  row[column.field] !== undefined &&
                    row[column.field] !== null &&
                    row[column.field] !== ''
                    ? String(row[column.field])
                    : '-',
                ),
            h(VbenIcon, {
              class:
                'size-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0 cursor-pointer',
              icon: 'basil:edit-alt-outline',
            }),
          ],
        );
      },
    });

    // 表格配置项：CellDate 仅日期 (根据前端浏览器本地时区自动格式化)
    vxeUI.renderer.add('CellDate', {
      renderTableDefault(_renderOpts, { column, row }) {
        const val = row[column.field];
        if (
          !val ||
          val === '0001-01-01T00:00:00Z' ||
          val === '1970-01-01T00:00:00Z'
        ) {
          return '-';
        }
        return formatDate(val, 'YYYY-MM-DD') || '-';
      },
    });

    // 表格配置项：CellInputNumber 可修改数字框 (移入显现编辑图标，点击即改)
    vxeUI.renderer.add('CellInputNumber', {
      renderTableDefault({ attrs }, { column, row }) {
        const isEditKey = `__isEdit_${column.field}`;
        const loadingKey = `__loading_${column.field}`;
        const editValKey = `__editVal_${column.field}`;

        const isEditing = Boolean(row[isEditKey]);
        const isLoading = Boolean(row[loadingKey]);

        const submitChange = async () => {
          if (!row[isEditKey]) return;
          row[isEditKey] = false;
          const oldVal = row[column.field];
          const newVal = row[editValKey];
          if (newVal === oldVal) return;

          row[loadingKey] = true;
          try {
            const res = await attrs?.beforeChange?.(newVal, row, column.field);
            if (res !== false) {
              row[column.field] = newVal;
            }
          } catch (error) {
            console.error('CellInputNumber save failed:', error);
          } finally {
            row[loadingKey] = false;
          }
        };

        if (isEditing) {
          return h(NInputNumber, {
            autofocus: true,
            class: 'w-full',
            defaultValue: row[editValKey],
            onBlur: () => {
              void submitChange();
            },
            onKeydown: (e: KeyboardEvent) => {
              if (e.key === 'Enter') {
                void submitChange();
              } else if (e.key === 'Escape') {
                row[isEditKey] = false;
              }
            },
            'onUpdate:value': (val: null | number) => {
              row[editValKey] = val;
            },
            size: 'small',
          });
        }

        return h(
          'div',
          {
            class:
              'group inline-flex items-center justify-center gap-1.5 min-h-[28px] max-w-full px-2 py-0.5 rounded cursor-pointer hover:bg-muted/40 transition-colors',
            onClick: () => {
              row[editValKey] = row[column.field] ?? 0;
              row[isEditKey] = true;
            },
            title: '点击可快捷修改',
          },
          [
            isLoading
              ? h(NSpin, { size: 14 })
              : h(
                  'span',
                  { class: 'truncate select-none' },
                  row[column.field] !== undefined && row[column.field] !== null
                    ? String(row[column.field])
                    : '-',
                ),
            h(VbenIcon, {
              class:
                'size-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0 cursor-pointer',
              icon: 'basil:edit-alt-outline',
            }),
          ],
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
        const val = row[column.field];
        let defaultUncheckedValue: boolean | number | string = 2;
        let defaultCheckedValue: boolean | number | string = 1;
        if (typeof val === 'boolean') {
          defaultCheckedValue = true;
          defaultUncheckedValue = false;
        } else if (val === 0 || val === '0') {
          defaultUncheckedValue = typeof val === 'number' ? 0 : '0';
          defaultCheckedValue = typeof val === 'number' ? 1 : '1';
        }

        const baseSwitchProps: SwitchProps = {
          checkedValue: defaultCheckedValue,
          uncheckedValue: defaultUncheckedValue,
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
              const result = await attrs?.beforeChange?.(
                newVal,
                row,
                column.field,
              );
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
          .filter((opt) => {
            if (typeof opt.show === 'function') {
              return opt.show(row) !== false;
            }
            return true;
          });

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

export const useVbenVxeGrid = <
  T extends Record<string, any>,
  TFormValues extends FormValues = FormValues,
  TSubmitValues extends FormValues = TFormValues,
>(
  ...rest: Parameters<
    typeof useGrid<
      T,
      ComponentType,
      ComponentPropsMap,
      TFormValues,
      TSubmitValues
    >
  >
) =>
  useGrid<T, ComponentType, ComponentPropsMap, TFormValues, TSubmitValues>(
    ...rest,
  );
export type OnActionClickParams<T = Recordable<any>> = {
  code: string;
  row: T;
};
export type OnActionClickFn<T = Recordable<any>> = (
  params: OnActionClickParams<T>,
) => void;
export type * from '@vben/plugins/vxe-table';

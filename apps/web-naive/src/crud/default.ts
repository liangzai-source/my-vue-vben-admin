// defaults.ts
import type { Basic, Field, Page, Route, Schema } from './types';

// Basic 默认值
export const createDefaultBasic = (): Basic => ({
  moduleName: '',
  tableName: '',
  pkField: '',
  pkType: 1, // 默认自增
  genPath: '',
  modelName: '',
  repoName: '',
  serviceName: '',
  handlerName: '',
  inheritBase: true, // 默认继承基类
  hasCreatedAndUpdated: true,
  listShowCreated: true,
  listShowUpdated: true,
  softDelete: false,
  comment: '',
  hasDetail: false,
});

// Route 默认值
export const createDefaultRoute = (): Route => ({
  createMenu: true,
  createRoute: true,
  routeName: '',
  menuName: '',
  parentMenu: 0,
  menuIcon: '',
  apiPath: '',
  pagePath: '',
});

// Page 默认值
export const createDefaultPage = (): Page => ({
  tableType: 'vxe-table', // 统一使用 VXE-Table
  formType: 'naive', // 默认 Naive 原生表单
  dialogType: 'drawer', // 默认 抽屉模式
  dialogSize: 'medium',
  operation: ['create', 'update', 'delete'], // 默认操作按钮
  isTree: false,
  treeLazy: true,
  treeParentField: 'parent_id',
  treeNodeColumn: '',
  hasChildField: 'hasChildren',
});

// Field 默认值（当需要向 FieldsConfig 添加新字段时使用）
export const createDefaultField = (): Field => ({
  name: '',
  goType: 'string',
  gormType: 'varchar(255)',
  jsonTag: '',
  comment: '',
  indexable: '',
  nullable: false,
  tsName: '',
  tsType: 'string',
  label: '',
  listComp: 'NText',
  listable: true,
  width: 150,
  sortable: false,
  searchData: [],
  editable: true,
  formComp: 'NInput',
  default: null,
  showInDetail: false,
  detailComp: 'NText',
  isFile: false,
  relation: {
    enable: false,
    targetTable: '',
    valueField: 'id',
    labelField: 'name',
  },
  optionType: 0,
  optionData: [],
  compOptions: '',
  compLabelField: '',
  compValueField: '',
});

// Schema 整体默认值
export const createDefaultSchema = (): Schema => ({
  basicConfig: createDefaultBasic(),
  routeConfig: createDefaultRoute(),
  fieldsConfig: [],
  pageConfig: createDefaultPage(),
});

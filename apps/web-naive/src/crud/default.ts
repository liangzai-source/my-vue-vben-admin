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
  hasCreatedAndUpdated: false,
  listShowCreated: false,
  listShowUpdated: false,
  softDelete: false,
  comment: '',
  hasDetail: false,
});

// Route 默认值
export const createDefaultRoute = (): Route => ({
  createMenu: false,
  createRoute: false,
  routeName: '',
  menuName: '',
  parentMenu: 0,
  menuIcon: '',
  apiPath: '',
  pagePath: '',
});

// Page 默认值
export const createDefaultPage = (): Page => ({
  formType: '',
  dialogSize: '',
  operation: [], // 操作按钮默认空数组
});

// Field 默认值（当需要向 FieldsConfig 添加新字段时使用）
export const createDefaultField = (): Field => ({
  name: '',
  goType: '',
  gormType: '',
  jsonTag: '',
  comment: '',
  indexable: '',
  nullable: false,
  tsName: '',
  tsType: '',
  label: '',
  listComp: '',
  listable: false,
  width: 0,
  sortable: false,
  searchType: [],
  editable: false,
  FormComp: '',
  default: null,
  showInDetail: false,
  detailComp: '',
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
  fieldsConfig: [], // 初始没有字段
  pageConfig: createDefaultPage(),
});

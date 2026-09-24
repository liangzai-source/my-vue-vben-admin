export interface Basic {
  moduleName: string; // 模块名称
  tableName: string; // 数据库表名
  hasTable: boolean; // 是否已有数据表
  pkField: string; // 主键名称
  pkType: number; // 主键类型  1  自增   2  uuid
  genPath: string; // 生成目录
  modelName: string; // 模型名称
  repoName: string; // 仓库名称
  serviceName: string; // 服务名称
  handlerName: string; // 控制器名称
  hasCreatedAndUpdated: boolean; // 是否拥有创建和编辑时间
  listShowCreated: boolean; // 列表显示创建时间
  listShowUpdated: boolean; // 列表显示编辑时间
  softDelete: boolean; // 是否软删除
  comment: string; // 备注
  hasDetail: boolean; // 是否展示详情
}

export interface Route {
  createMenu: boolean;
  createRoute: boolean;
  routeName: string;
  menuName: string;
  parentMenu: number;
  menuIcon: string;
  apiPath: string;
  pagePath: string;
}

export interface Page {
  formType: string;
  dialogSize: string;
  operation: string[];
}

export interface Enum {
  label: string;
  value: any;
}

export interface OptionSource {
  optionType: number; // 选项类型
  optionData: Enum[]; // 固定选项
  compOptions: string; // 远程数据源
  compLabelField: string; // 显示字段
  compValueField: string; // 值字段
}

export interface SearchOption extends OptionSource {
  type: string; // 类型 1 固定值  2 表单值
  symbol: string; // 搜素符号  = !=
  component: string; // 搜索组件
  label: string; // 搜索label
  name: string; // 参数名
  value: string; // 固定搜索值
}

export interface Field extends OptionSource {
  // 基础
  name: string; // 字段名
  goType: string; // go字段类型
  gormType: string; // gorm类型 varchar(64) / tinyint
  jsonTag: string; // jsonTag
  comment: string; // 字段注释
  indexable: string; // 索引
  nullable: boolean; // 允许空
  tsName: string; // 字段名
  tsType: string; // 字段类型
  label: string; // label
  // 表格
  listComp: string; // 表格组件
  listable: boolean; // 表格是否显示
  width: number; // 表格列宽
  sortable: boolean; // 允许排序
  searchType: SearchOption[]; // 搜索配置
  // 表单
  editable: boolean; // form 显示
  FormComp: string; // 表单组件
  default: any; // 默认值
  // 详情
  showInDetail: boolean; // 是否在详情页显示
  detailComp: string; // 详情页组件
}

export interface Schema {
  BasicConfig: Basic;
  RouteConfig: Route;
  FieldsConfig: Field[];
  PageConfig: Page;
}

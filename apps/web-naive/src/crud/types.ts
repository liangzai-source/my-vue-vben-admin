export interface Basic {
  moduleName: string; // 模块名称
  tableName: string; // 数据库表名
  pkField: string; // 主键名称
  pkType: number; // 主键类型  1  自增   2  uuid
  genPath: string; // 生成目录
  modelName: string; // 模型名称
  repoName: string; // 仓库名称
  serviceName: string; // 服务名称
  handlerName: string; // 控制器名称
  inheritBase: boolean; // 是否继承通用CRUD基类
  hasCreatedAndUpdated: boolean; // 是否拥有创建和编辑时间
  listShowCreated: boolean; // 列表显示创建时间
  listShowUpdated: boolean; // 列表显示编辑时间
  softDelete: boolean; // 是否软删除
  comment: string; // 备注
  commentEn?: string; // 英文备注
  hasDetail: boolean; // 是否展示详情
}

export interface Route {
  createMenu: boolean; // 创建菜单
  createRoute: boolean; // 创建路由
  routeName: string; // 路由名称
  menuName: string; // 菜单名称
  parentMenu: number; // 上级菜单
  menuIcon: string; // 菜单图标
  apiPath: string; // api接口
  pagePath: string; // 页面路径
}

export interface Page {
  tableType: string; // 表格类型: 固定为 vxe-table
  formType: string; // 表单类型: 固定为 naive
  dialogType: string; // 弹窗类型: drawer / modal
  dialogSize: string; // 弹窗尺寸: small / medium / large / custom
  dialogWidth?: string; // 自定义弹窗/抽屉宽度
  dialogHeight?: string; // 自定义弹窗高度
  operation: string[]; // 操作按钮
  isTree?: boolean; // 是否开启树形表格
  treeLazy?: boolean; // 是否远程异步加载子节点
  treeParentField?: string; // 父级关联字段
  treeNodeColumn?: string; // 树折叠节点所在列名
  hasChildField?: string; // 拥有子节点标记字段
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
  columnName?: string; // 数据库物理列名
  goType: string; // go字段类型
  gormType: string; // gorm类型 varchar(64) / tinyint
  jsonTag: string; // jsonTag
  comment: string; // 字段注释
  indexable: string; // 索引
  nullable: boolean; // 允许空
  tsName: string; // 字段名
  tsType: string; // 字段类型
  label: string; // label
  labelEn?: string; // 英文 label
  // 表格
  listComp: string; // 表格组件
  listable: boolean; // 表格是否显示
  width: number; // 表格列宽
  sortable: boolean; // 允许排序
  switchConfirm?: boolean; // 开关切换是否二次确认 (仅 listComp 为 CellSwitch 时有效，默认 true)
  searchData: SearchOption[]; // 搜索配置
  // 表单
  editable: boolean; // form 显示
  formComp: string; // 表单组件
  default: any; // 默认值
  required?: boolean; // 是否必填（数据库非空时强制必填）
  rules?: string[]; // 多选正则校验规则 tag 列表
  // 详情
  showInDetail: boolean; // 是否在详情页显示
  detailComp: string; // 详情页组件
  // 模型与存储
  isFile?: boolean; // 是否是文件/图片字段
  upload?: UploadConfig; // 上传组件详细配置
  // 表关联配置
  relation?: RelationConfig;
}

export interface UploadConfig {
  multiple: boolean; // 是否多选
  minCount: number; // 最少数量
  maxCount: number; // 最多数量
  type: number; // 1: 图片, 2: 视频, 3: 音频, 4: 文件
  accept?: string; // 允许上传格式
}

export interface RelationConfig {
  enable: boolean;
  targetTable: string;
  valueField: string;
  labelField: string;
}

export interface Schema {
  basicConfig: Basic;
  routeConfig: Route;
  fieldsConfig: Field[];
  pageConfig: Page;
}

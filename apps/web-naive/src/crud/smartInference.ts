import type { Enum, Field, Schema } from './types';

export function parseCommentOptions(comment: string): Enum[] {
  if (!comment) return [];
  const reg = /(\d+)\s*[:=-]\s*([\u4E00-\u9FA5\w]+)/g;
  const matches = [...comment.matchAll(reg)];
  if (matches.length < 2) return [];
  return matches.map((m) => {
    const valStr = m[1] ?? '';
    const lblStr = m[2] ?? '';
    const num = Number(valStr);
    return {
      label: lblStr,
      value: Number.isNaN(num) ? valStr : num,
    };
  });
}

export interface SmartInferContext {
  labelField?: string;
  tableName?: string;
}

export function inferSelfLabelField(fields: Field[]): string {
  const names = new Set(
    (fields || []).map((item) =>
      (item.columnName || item.tsName || item.name || '').toLowerCase(),
    ),
  );
  if (names.has('name')) return 'name';
  if (names.has('title')) return 'title';
  if (names.has('label')) return 'label';
  return 'name';
}

export function isSelfParentFieldName(name: string): boolean {
  const lower = (name || '').toLowerCase();
  return lower === 'parent_id' || lower === 'parentid' || lower === 'pid';
}

export function isEnumSemanticName(name: string): boolean {
  const lower = (name || '').toLowerCase();
  return (
    lower.includes('type') ||
    lower.includes('mode') ||
    lower.includes('channel') ||
    lower.includes('level') ||
    lower.includes('gender') ||
    lower.includes('sex')
  );
}

function isBoolOptionSet(options: Enum[]): boolean {
  if (!options || options.length === 0) return true;
  if (options.length !== 2) return false;
  return options.every(
    (opt) =>
      opt.value === 0 ||
      opt.value === 1 ||
      opt.value === '0' ||
      opt.value === '1',
  );
}

function syncEnumSearchData(f: Field) {
  const opts = f.optionData || [];
  if (!f.searchData || f.searchData.length === 0) {
    f.searchData = [
      {
        type: '2',
        symbol: '=',
        component: 'NSelect',
        label: f.label || f.name,
        name: f.tsName || f.name,
        value: '',
        optionType: opts.length > 0 ? 1 : f.optionType,
        optionData: opts,
        compOptions: '',
        compLabelField: '',
        compValueField: '',
      },
    ];
  } else if (f.searchData[0] && opts.length > 0) {
    f.searchData[0] = {
      ...f.searchData[0],
      component: 'NSelect',
      optionType: 1,
      optionData: opts,
    };
  }
}

export function smartInferField(
  field: Field,
  context?: SmartInferContext,
): Field {
  const f: Field = { ...field };
  const name = (f.columnName || f.name || f.tsName || '').toLowerCase();
  const comment = f.comment || '';
  const dt = (f.gormType || '').toLowerCase();

  // 1. 如果有注释中的选项，且当前选项为空，先解析选项
  const options = parseCommentOptions(comment);
  if (options.length > 0 && (!f.optionData || f.optionData.length === 0)) {
    f.optionType = 1;
    f.optionData = options;
  }

  const optLen = f.optionData?.length || 0;

  // 2. 密码/敏感密钥
  if (
    name.includes('password') ||
    name.includes('passwd') ||
    name.includes('secret') ||
    name.includes('token')
  ) {
    f.listable = false;
    f.showInDetail = false;
    f.formComp = 'NInput';
    return f;
  }

  // 3. 布尔/两态开关 (tinyint(1) 或 bool)：仅在未包含多值枚举且非类型/等级字段时生效
  const isStatusName =
    name.includes('status') ||
    name.includes('state') ||
    name.includes('enable') ||
    name.includes('active') ||
    name.startsWith('is_');
  if (
    (dt.includes('tinyint(1)') || f.goType === 'bool') &&
    isStatusName &&
    !isEnumSemanticName(name) &&
    isBoolOptionSet(f.optionData || [])
  ) {
    f.listComp = 'CellSwitch';
    f.formComp = 'NSwitch';
    f.switchConfirm = true;
    f.width = 100;
    const switchOpts =
      optLen === 2
        ? f.optionData
        : [
            { label: '开启', value: 1 },
            { label: '关闭', value: 0 },
          ];
    if (!f.searchData || f.searchData.length === 0) {
      f.searchData = [
        {
          type: '2',
          symbol: '=',
          component: 'NSelect',
          label: f.label || f.name,
          name: f.tsName || f.name,
          value: '',
          optionType: 1,
          optionData: switchOpts,
          compOptions: '',
          compLabelField: '',
          compValueField: '',
        },
      ];
    }
    return f;
  }

  // 若数据库为 tinyint(1) 但实际有多态/多值枚举或类型语义，纠正 bool 为 int8 避免丢失数值
  if (dt.includes('tinyint') && f.goType === 'bool') {
    f.goType = 'int8';
    f.tsType = 'number';
    if (f.formComp === 'NSwitch') {
      f.formComp = 'NInputNumber';
    }
  }

  // 4. 状态字段 (status / state / enable / active / is_)
  if (isStatusName) {
    if (optLen === 2) {
      f.listComp = 'CellSwitch';
      f.formComp = 'NSwitch';
      f.switchConfirm = true;
      f.width = 100;
    } else {
      f.listComp = 'NTag';
      f.formComp = optLen > 0 && optLen <= 4 ? 'NRadioGroup' : 'NSelect';
      f.width = 120;
    }
    syncEnumSearchData(f);
    return f;
  }

  // 5. 类型 / 模式 / 渠道 / 等级 (type / mode / channel / level)
  if (isEnumSemanticName(name)) {
    f.listComp = 'NTag';
    f.formComp = optLen > 0 && optLen <= 4 ? 'NRadioGroup' : 'NSelect';
    f.width = 120;
    syncEnumSearchData(f);
    return f;
  }

  // 6. 图片类 (avatar / image / img / pic / photo / cover / logo / poster / icon)
  if (
    name.includes('avatar') ||
    name.includes('image') ||
    name.includes('img') ||
    name.includes('pic') ||
    name.includes('photo') ||
    name.includes('cover') ||
    name.includes('logo') ||
    name.includes('poster') ||
    name.includes('icon')
  ) {
    f.isFile = true;
    f.formComp = 'FileUpload';
    f.listComp = 'CellImage';
    f.width = 100;
    return f;
  }

  // 7. 附件/文件 (file / attachment / doc / video / audio / pdf / zip)
  if (
    name.includes('file') ||
    name.includes('attachment') ||
    name.includes('doc') ||
    name.includes('video') ||
    name.includes('audio') ||
    name.includes('pdf') ||
    name.includes('zip')
  ) {
    f.isFile = true;
    f.formComp = 'FileUpload';
    f.listComp = 'CellAttachment';
    f.width = 120;
    return f;
  }

  // 8. 富文本正文 (content / detail / body / intro / article / html)
  if (
    (dt.includes('text') ||
      dt.includes('longtext') ||
      dt.includes('mediumtext')) &&
    (name.includes('content') ||
      name.includes('detail') ||
      name.includes('body') ||
      name.includes('intro') ||
      name.includes('article') ||
      name.includes('html'))
  ) {
    f.formComp = 'VbenTiptap';
    f.listComp = 'NText';
    f.width = 200;
    return f;
  }

  // 9. 多行文本域 (remark / desc / description / comment / note / reason / summary / text)
  if (
    name.includes('remark') ||
    name.includes('desc') ||
    name.includes('description') ||
    name.includes('comment') ||
    name.includes('note') ||
    name.includes('reason') ||
    name.includes('summary') ||
    dt.includes('text') ||
    dt.includes('mediumtext') ||
    dt.includes('longtext')
  ) {
    f.formComp = 'NInputTextArea';
    f.listComp = 'NText';
    f.width = 200;
    return f;
  }

  // 10. 日期时间 (time / _at / datetime / timestamp)
  if (
    dt.includes('datetime') ||
    dt.includes('timestamp') ||
    name.endsWith('_time') ||
    name.endsWith('_at') ||
    name.includes('datetime')
  ) {
    f.goType = 'time.Time';
    f.tsType = 'Date';
    f.formComp = 'NDatePicker';
    f.listComp = 'CellDateTime';
    f.width = 180;
    if (!f.searchData || f.searchData.length === 0) {
      f.searchData = [
        {
          type: '2',
          symbol: 'BETWEEN',
          component: 'NDatePickerRange',
          label: f.label || f.name,
          name: f.tsName || f.name,
          value: '',
          optionType: 0,
          optionData: [],
          compOptions: '',
          compLabelField: '',
          compValueField: '',
        },
      ];
    }
    return f;
  }

  // 11. 仅日期 (date / _date / birthday / day)
  if (
    dt === 'date' ||
    name.endsWith('_date') ||
    name.includes('birthday') ||
    name.endsWith('_day')
  ) {
    f.goType = 'time.Time';
    f.tsType = 'Date';
    f.formComp = 'NDate';
    f.listComp = 'CellDate';
    f.width = 130;
    if (!f.searchData || f.searchData.length === 0) {
      f.searchData = [
        {
          type: '2',
          symbol: '=',
          component: 'NDatePicker',
          label: f.label || f.name,
          name: f.tsName || f.name,
          value: '',
          optionType: 0,
          optionData: [],
          compOptions: '',
          compLabelField: '',
          compValueField: '',
        },
      ];
    }
    return f;
  }

  // 12. 排序 (sort / order_no / weight / seq)
  if (
    name.includes('sort') ||
    name.includes('order_no') ||
    name.includes('weight') ||
    name.includes('seq')
  ) {
    f.listComp = 'CellInputNumber';
    f.formComp = 'NInputNumber';
    f.sortable = true;
    f.width = 100;
    return f;
  }

  // 13. 外链 (link / url / href / website)
  if (
    name.includes('link') ||
    name.includes('url') ||
    name.includes('href') ||
    name.includes('website')
  ) {
    f.listComp = 'CellLink';
    f.formComp = 'NInput';
    f.width = 180;
    return f;
  }

  // 14a. 自关联父级字段 (parent_id / parentid / pid) -> 关联当前自身表
  if (isSelfParentFieldName(name)) {
    const selfTable =
      context?.tableName ||
      (f.relation?.targetTable && f.relation.targetTable !== 'y_parent'
        ? f.relation.targetTable
        : '');
    const labelField = context?.labelField || f.relation?.labelField || 'name';
    f.relation = {
      enable: true,
      targetTable: selfTable,
      valueField: 'id',
      labelField,
    };
    f.formComp = 'RelationSelect';
    f.listComp = 'NText';
    if (!f.searchData || f.searchData.length === 0) {
      f.searchData = [
        {
          type: '2',
          symbol: '=',
          component: 'RelationSelect',
          label: f.label || f.name,
          name: f.tsName || f.name,
          value: '',
          optionType: 0,
          optionData: [],
          compOptions: '',
          compLabelField: '',
          compValueField: '',
        },
      ];
    }
    return f;
  }

  // 14b. 外键关联 (_id 且非 id)
  if (name.endsWith('_id') && name !== 'id') {
    const baseName = name.replace(/_id$/, '');
    f.relation = {
      enable: true,
      targetTable: `y_${baseName}`,
      valueField: 'id',
      labelField: 'name',
    };
    f.formComp = 'RelationSelect';
    f.listComp = 'NText';
    if (!f.searchData || f.searchData.length === 0) {
      f.searchData = [
        {
          type: '2',
          symbol: '=',
          component: 'RelationSelect',
          label: f.label || f.name,
          name: f.tsName || f.name,
          value: '',
          optionType: 0,
          optionData: [],
          compOptions: '',
          compLabelField: '',
          compValueField: '',
        },
      ];
    }
    return f;
  }

  return f;
}

export function smartInferSchema(schema: Schema): Schema {
  if (!schema || !Array.isArray(schema.fieldsConfig)) return schema;
  const tableName = schema.basicConfig?.tableName || '';
  const labelField = inferSelfLabelField(schema.fieldsConfig);
  const fields = schema.fieldsConfig.map((field) => {
    const colLower = (
      field.columnName ||
      field.name ||
      field.tsName ||
      ''
    ).toLowerCase();
    // 修正历史/未重启后端解析出的 y_parent 误关联
    if (
      isSelfParentFieldName(colLower) &&
      tableName &&
      (!field.relation?.enable ||
        !field.relation.targetTable ||
        field.relation.targetTable === 'y_parent')
    ) {
      return smartInferField(field, { tableName, labelField });
    }
    // 修正 tinyint(1) 多值枚举（如 level 0-3）被旧后端误识别为开关的问题
    const parsedOpts = parseCommentOptions(field.comment || '');
    const optCount = Math.max(field.optionData?.length || 0, parsedOpts.length);
    if (
      (optCount > 2 || isEnumSemanticName(colLower)) &&
      (field.listComp === 'CellSwitch' || field.formComp === 'NSwitch')
    ) {
      return smartInferField(field, { tableName, labelField });
    }
    // 只有在字段属于常规默认初始状态时，执行推导增强
    if (field.listComp === 'NText' || !field.listComp) {
      return smartInferField(field, { tableName, labelField });
    }
    return field;
  });
  return {
    ...schema,
    fieldsConfig: fields,
  };
}

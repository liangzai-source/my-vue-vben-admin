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

export function smartInferField(field: Field): Field {
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

  // 3. 布尔/两态开关 (tinyint(1) 或 bool)
  if (
    (dt.includes('tinyint(1)') || f.goType === 'bool') &&
    (name.includes('status') ||
      name.includes('state') ||
      name.includes('enable') ||
      name.includes('active') ||
      name.startsWith('is_'))
  ) {
    f.listComp = 'CellSwitch';
    f.formComp = 'NSwitch';
    f.switchConfirm = true;
    f.width = 100;
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
          optionData: [
            { label: '开启', value: 1 },
            { label: '关闭', value: 0 },
          ],
          compOptions: '',
          compLabelField: '',
          compValueField: '',
        },
      ];
    }
    return f;
  }

  // 4. 状态字段 (status / state / enable / active / is_)
  if (
    name.includes('status') ||
    name.includes('state') ||
    name.includes('enable') ||
    name.includes('active') ||
    name.startsWith('is_')
  ) {
    if (optLen === 2) {
      f.listComp = 'CellSwitch';
      f.formComp = 'NSwitch';
      f.switchConfirm = true;
      f.width = 100;
    } else {
      f.listComp = 'CellTag';
      f.formComp = optLen > 0 && optLen <= 4 ? 'NRadioGroup' : 'NSelect';
      f.width = 120;
    }
    if (!f.searchData || f.searchData.length === 0) {
      f.searchData = [
        {
          type: '2',
          symbol: '=',
          component: 'NSelect',
          label: f.label || f.name,
          name: f.tsName || f.name,
          value: '',
          optionType: f.optionType,
          optionData: f.optionData || [],
          compOptions: '',
          compLabelField: '',
          compValueField: '',
        },
      ];
    }
    return f;
  }

  // 5. 类型 / 模式 / 渠道 (type / mode / channel / level)
  if (
    name.includes('type') ||
    name.includes('mode') ||
    name.includes('channel') ||
    name.includes('level')
  ) {
    f.listComp = 'CellTag';
    f.formComp = optLen > 0 && optLen <= 4 ? 'NRadioGroup' : 'NSelect';
    f.width = 120;
    if (!f.searchData || f.searchData.length === 0) {
      f.searchData = [
        {
          type: '2',
          symbol: '=',
          component: 'NSelect',
          label: f.label || f.name,
          name: f.tsName || f.name,
          value: '',
          optionType: f.optionType,
          optionData: f.optionData || [],
          compOptions: '',
          compLabelField: '',
          compValueField: '',
        },
      ];
    }
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

  // 14. 外键关联 (_id 且非 id)
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
  const fields = schema.fieldsConfig.map((field) => {
    // 只有在字段属于常规默认初始状态时，执行推导增强
    if (field.listComp === 'NText' || !field.listComp) {
      return smartInferField(field);
    }
    return field;
  });
  return {
    ...schema,
    fieldsConfig: fields,
  };
}

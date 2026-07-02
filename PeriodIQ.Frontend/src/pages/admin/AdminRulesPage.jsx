import { Badge } from '@/components/ui/badge';
import { adminMasterDataApi } from '@/services/adminMasterDataService';
import { AdminCrudPage, readValue } from './AdminCrudPage';

const emptyRule = {
  id: '',
  category: 'VolumeRule',
  ruleName: '',
  description: '',
  ruleParametersJson: '{}',
  priorityOrder: 10,
  isActive: true,
};

function validateJson(value) {
  JSON.parse(value || '{}');
  return value || '{}';
}

export default function AdminRulesPage() {
  return (
    <AdminCrudPage
      title="Bộ luật"
      description="Các ngưỡng và luật điều phối cho Rule Engine."
      queryKey={['admin-rules']}
      api={adminMasterDataApi.rules}
      emptyItem={emptyRule}
      searchFields={['ruleName', 'category', 'description']}
      fields={[
        { key: 'category', label: 'Loại luật', type: 'select', options: ['VolumeRule', 'CnsConflictRule', 'ProgressionRule', 'DeloadRule'] },
        { key: 'ruleName', label: 'Tên luật' },
        { key: 'description', label: 'Mô tả', type: 'textarea', rows: 3 },
        { key: 'ruleParametersJson', label: 'Parameters JSON', type: 'textarea', rows: 6, monospace: true },
        { key: 'priorityOrder', label: 'Độ ưu tiên', type: 'number', min: 1, step: 1 },
        { key: 'isActive', label: 'Trạng thái', type: 'checkbox', checkboxLabel: 'Đang kích hoạt' },
      ]}
      columns={[
        {
          key: 'ruleName',
          label: 'Tên luật',
          render: (item) => <span className="font-medium">{readValue(item, 'ruleName')}</span>,
        },
        { key: 'category', label: 'Loại' },
        { key: 'priorityOrder', label: 'Ưu tiên' },
        {
          key: 'isActive',
          label: 'Trạng thái',
          render: (item) => (
            <Badge variant={readValue(item, 'isActive') ? 'success' : 'neutral'} dot>
              {readValue(item, 'isActive') ? 'Active' : 'Inactive'}
            </Badge>
          ),
        },
      ]}
      toPayload={(draft) => ({
        ...draft,
        ruleParametersJson: validateJson(draft.ruleParametersJson),
        priorityOrder: Number(draft.priorityOrder) || 1,
        isActive: Boolean(draft.isActive),
      })}
    />
  );
}

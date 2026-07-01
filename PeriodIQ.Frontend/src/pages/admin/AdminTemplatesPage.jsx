import { Badge } from '@/components/ui/badge';
import { adminMasterDataApi } from '@/services/adminMasterDataService';
import { AdminCrudPage, createDraftFromKeys, readValue } from './AdminCrudPage';

const emptyTemplate = {
  id: '',
  templateName: '',
  goal: 'Hypertrophy',
  suitableFitnessLevel: 'Intermediate',
  daysJson: '[]',
};

function toDraft(item) {
  const draft = createDraftFromKeys(item, emptyTemplate);
  const days = readValue(item, 'days', []);
  return {
    ...draft,
    daysJson: JSON.stringify(Array.isArray(days) ? days : [], null, 2),
  };
}

function toPayload(draft) {
  const days = JSON.parse(draft.daysJson || '[]');
  if (!Array.isArray(days)) {
    throw new Error('Days JSON phải là một mảng.');
  }

  return {
    id: draft.id,
    templateName: draft.templateName,
    goal: draft.goal,
    suitableFitnessLevel: draft.suitableFitnessLevel,
    days,
  };
}

export default function AdminTemplatesPage() {
  return (
    <AdminCrudPage
      title="Mẫu giáo án"
      description="Khung ngày tập để Rule Engine fill set, rep, intensity và tạ."
      queryKey={['admin-templates']}
      api={adminMasterDataApi.templates}
      emptyItem={emptyTemplate}
      searchFields={['templateName', 'goal', 'suitableFitnessLevel']}
      toDraft={toDraft}
      toPayload={toPayload}
      fields={[
        { key: 'templateName', label: 'Tên template' },
        { key: 'goal', label: 'Mục tiêu', type: 'select', options: ['Hypertrophy', 'Strength', 'Endurance', 'Fat Loss'] },
        { key: 'suitableFitnessLevel', label: 'Trình độ', type: 'select', options: ['Beginner', 'Intermediate', 'Advanced'] },
        { key: 'daysJson', label: 'Days JSON', type: 'textarea', rows: 12, monospace: true },
      ]}
      columns={[
        {
          key: 'templateName',
          label: 'Template',
          render: (item) => <span className="font-medium">{readValue(item, 'templateName')}</span>,
        },
        { key: 'goal', label: 'Mục tiêu' },
        { key: 'suitableFitnessLevel', label: 'Trình độ' },
        {
          key: 'days',
          label: 'Số ngày',
          render: (item) => <Badge variant="info">{readValue(item, 'days', []).length}</Badge>,
        },
      ]}
    />
  );
}

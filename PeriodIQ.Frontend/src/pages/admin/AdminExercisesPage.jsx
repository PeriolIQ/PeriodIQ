import { Badge } from '@/components/ui/badge';
import { adminMasterDataApi } from '@/services/adminMasterDataService';
import { AdminCrudPage, readValue } from './AdminCrudPage';

const emptyExercise = {
  id: '',
  name: '',
  primaryMuscleGroup: '',
  secondaryMuscleGroup: '',
  equipmentType: 'Barbell',
  cnsStressScore: 5,
  isEligibleForPersonalRecord: false,
};

export default function AdminExercisesPage() {
  return (
    <AdminCrudPage
      title="Bài tập"
      description="Danh mục bài tập dùng cho template và Rule Engine."
      queryKey={['admin-exercises']}
      api={adminMasterDataApi.exercises}
      emptyItem={emptyExercise}
      searchFields={['name', 'primaryMuscleGroup', 'equipmentType']}
      fields={[
        { key: 'name', label: 'Tên bài tập' },
        { key: 'primaryMuscleGroup', label: 'Nhóm cơ chính' },
        { key: 'secondaryMuscleGroup', label: 'Nhóm cơ phụ' },
        { key: 'equipmentType', label: 'Thiết bị', type: 'select', options: ['Barbell', 'Dumbbell', 'Machine', 'Bodyweight'] },
        { key: 'cnsStressScore', label: 'CNS stress score', type: 'number', min: 1, max: 10, step: 1 },
        {
          key: 'isEligibleForPersonalRecord',
          label: 'Personal record',
          type: 'checkbox',
          checkboxLabel: 'Cho phép ghi nhận PR',
        },
      ]}
      columns={[
        {
          key: 'name',
          label: 'Bài tập',
          render: (item) => <span className="font-medium">{readValue(item, 'name')}</span>,
        },
        { key: 'primaryMuscleGroup', label: 'Nhóm cơ chính' },
        { key: 'equipmentType', label: 'Thiết bị' },
        {
          key: 'cnsStressScore',
          label: 'CNS',
          render: (item) => <Badge variant={Number(readValue(item, 'cnsStressScore')) >= 8 ? 'warning' : 'neutral'}>{readValue(item, 'cnsStressScore')}</Badge>,
        },
        {
          key: 'isEligibleForPersonalRecord',
          label: 'PR',
          render: (item) => (
            <Badge variant={readValue(item, 'isEligibleForPersonalRecord') ? 'success' : 'neutral'}>
              {readValue(item, 'isEligibleForPersonalRecord') ? 'Có' : 'Không'}
            </Badge>
          ),
        },
      ]}
      toPayload={(draft) => ({
        ...draft,
        cnsStressScore: Number(draft.cnsStressScore) || 1,
        isEligibleForPersonalRecord: Boolean(draft.isEligibleForPersonalRecord),
      })}
    />
  );
}

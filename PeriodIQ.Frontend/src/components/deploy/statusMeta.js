import { CheckCircle2, XCircle, Loader2, Circle } from 'lucide-react';
import { STATUS_LABEL, getStatusVariant } from '@/services/deployService';

/**
 * Gom nhãn + biến thể badge + icon/màu cho 1 trạng thái pipeline/stage,
 * dùng chung giữa sơ đồ pipeline và panel log của từng stage.
 */
export function statusMeta(status) {
  const label = STATUS_LABEL[status] || status || '—';
  const variant = getStatusVariant(status);

  switch (status) {
    case 'Succeeded':
      return { label, variant, Icon: CheckCircle2, iconClass: 'text-emerald-500', dot: 'bg-emerald-500', spin: false };
    case 'InProgress':
      return { label, variant, Icon: Loader2, iconClass: 'text-amber-500', dot: 'bg-amber-500', spin: true };
    case 'Failed':
    case 'Abandoned':
    case 'Stopped':
      return { label, variant, Icon: XCircle, iconClass: 'text-red-500', dot: 'bg-red-500', spin: false };
    default:
      return { label, variant, Icon: Circle, iconClass: 'text-muted-foreground', dot: 'bg-muted-foreground', spin: false };
  }
}

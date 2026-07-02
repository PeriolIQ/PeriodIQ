import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit3, Plus, RefreshCw, Save, Search, Trash2, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const inputClass =
  'h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20';
const textareaClass =
  'min-h-24 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20';

export function readValue(item, key, fallback = '') {
  if (!item) return fallback;
  if (Object.prototype.hasOwnProperty.call(item, key)) return item[key];
  const pascalKey = `${key.charAt(0).toUpperCase()}${key.slice(1)}`;
  return item[pascalKey] ?? fallback;
}

export function createDraftFromKeys(item, emptyItem) {
  return Object.fromEntries(
    Object.entries(emptyItem).map(([key, fallback]) => [key, readValue(item, key, fallback)])
  );
}

function normalizeList(data) {
  if (Array.isArray(data)) return data;
  return data?.items ?? data?.Items ?? [];
}

export function AdminCrudPage({
  title,
  description,
  queryKey,
  api,
  emptyItem,
  fields,
  columns,
  searchFields,
  toDraft = (item) => createDraftFromKeys(item, emptyItem),
  toPayload = (draft) => draft,
}) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState(emptyItem);
  const [search, setSearch] = useState('');
  const [formError, setFormError] = useState('');

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey,
    queryFn: api.list,
  });

  const items = useMemo(() => normalizeList(data), [data]);
  const filteredItems = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return items;

    return items.filter((item) =>
      searchFields.some((key) => String(readValue(item, key, '')).toLowerCase().includes(keyword))
    );
  }, [items, search, searchFields]);

  const saveMutation = useMutation({
    mutationFn: (item) => api.save(item),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      resetForm();
    },
    onError: (err) => {
      setFormError(err.response?.data?.message || err.response?.data?.Message || err.message || 'Không thể lưu dữ liệu.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      resetForm();
    },
  });

  function updateField(key, value) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function resetForm() {
    setDraft(emptyItem);
    setFormError('');
  }

  function handleEdit(item) {
    setFormError('');
    setDraft(toDraft(item));
  }

  function handleDelete(item) {
    const id = readValue(item, 'id');
    if (!id) return;
    const name = readValue(item, 'name') || readValue(item, 'ruleName') || readValue(item, 'templateName') || id;
    if (window.confirm(`Xóa "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    setFormError('');

    try {
      saveMutation.mutate(toPayload(draft));
    } catch (err) {
      setFormError(err.message);
    }
  }

  const isEditing = Boolean(draft.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader className="gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle>{title}</CardTitle>
            <label className="relative w-full md:w-72">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                className={`${inputClass} pl-9`}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm kiếm"
              />
            </label>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-5 text-sm text-muted-foreground">Đang tải dữ liệu...</div>
            ) : isError ? (
              <div className="p-5 text-sm text-red-500">
                Không thể tải dữ liệu
                {error?.response?.status ? ` (HTTP ${error.response.status})` : ''}.
              </div>
            ) : !filteredItems.length ? (
              <div className="p-5 text-sm text-muted-foreground">Chưa có dữ liệu phù hợp.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
                      {columns.map((column) => (
                        <th key={column.key} className="px-5 py-3 font-medium">
                          {column.label}
                        </th>
                      ))}
                      <th className="w-28 px-5 py-3 text-right font-medium">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item) => {
                      const id = readValue(item, 'id');
                      return (
                        <tr key={id} className="border-b border-border last:border-0 hover:bg-muted/40">
                          {columns.map((column) => (
                            <td key={column.key} className="px-5 py-3 align-top">
                              {column.render ? column.render(item) : String(readValue(item, column.key, '—') || '—')}
                            </td>
                          ))}
                          <td className="px-5 py-3">
                            <div className="flex justify-end gap-1.5">
                              <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(item)} title="Sửa">
                                <Edit3 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="icon-sm"
                                onClick={() => handleDelete(item)}
                                disabled={deleteMutation.isPending}
                                title="Xóa"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>{isEditing ? 'Cập nhật' : 'Tạo mới'}</CardTitle>
            <Badge variant={isEditing ? 'info' : 'success'}>{isEditing ? 'Editing' : 'New'}</Badge>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              {fields.map((field) => (
                <FormField
                  key={field.key}
                  field={field}
                  value={draft[field.key]}
                  onChange={(value) => updateField(field.key, value)}
                />
              ))}

              {formError && <p className="text-sm text-red-500">{formError}</p>}

              <div className="flex gap-2">
                <Button type="submit" disabled={saveMutation.isPending}>
                  {isEditing ? <Save className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                  {saveMutation.isPending ? 'Đang lưu...' : isEditing ? 'Lưu' : 'Tạo'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  <X className="h-3.5 w-3.5" />
                  Hủy
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function FormField({ field, value, onChange }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{field.label}</span>
      {renderControl(field, value, onChange)}
    </label>
  );
}

function renderControl(field, value, onChange) {
  if (field.type === 'textarea') {
    return (
      <textarea
        className={`${textareaClass} ${field.monospace ? 'font-mono text-xs' : ''}`}
        value={value ?? ''}
        rows={field.rows ?? 4}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  if (field.type === 'select') {
    return (
      <select className={inputClass} value={value ?? ''} onChange={(event) => onChange(event.target.value)}>
        {field.options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === 'checkbox') {
    return (
      <span className="flex h-9 items-center gap-2 rounded-lg border border-border px-3">
        <input type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} />
        <span className="text-sm text-muted-foreground">{field.checkboxLabel}</span>
      </span>
    );
  }

  return (
    <input
      className={inputClass}
      type={field.type ?? 'text'}
      min={field.min}
      max={field.max}
      step={field.step}
      value={value ?? ''}
      onChange={(event) => onChange(field.type === 'number' ? Number(event.target.value) : event.target.value)}
    />
  );
}

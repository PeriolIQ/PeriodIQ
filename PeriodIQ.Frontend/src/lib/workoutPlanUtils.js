export function readValue(source, ...keys) {
  for (const key of keys) {
    if (source?.[key] !== undefined && source?.[key] !== null) {
      return source[key];
    }
  }
  return undefined;
}

export function getPlanId(plan) {
  return readValue(plan, 'id', 'Id') ?? '';
}

export function getWeeks(plan) {
  return readValue(plan, 'weeks', 'Weeks') ?? [];
}

export function getDays(week) {
  return readValue(week, 'days', 'Days') ?? [];
}

export function getExercises(day) {
  return readValue(day, 'exercises', 'Exercises') ?? [];
}

export function formatDate(value) {
  if (!value) return 'Chưa có';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Chưa có';

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function formatKg(value) {
  const number = Number(value ?? 0);
  if (number <= 0) return 'BW';
  return `${number.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} kg`;
}

export function sortPlans(plans) {
  return [...plans].sort((a, b) => {
    const aTime = new Date(readValue(a, 'generatedAt', 'GeneratedAt', 'startDate', 'StartDate') ?? 0).getTime();
    const bTime = new Date(readValue(b, 'generatedAt', 'GeneratedAt', 'startDate', 'StartDate') ?? 0).getTime();
    return bTime - aTime;
  });
}

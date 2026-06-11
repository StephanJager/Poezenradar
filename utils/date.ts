const DAY_MS = 24 * 60 * 60 * 1000;

export function formatLastSeen(value?: string) {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const daysAgo = Math.round((startOfToday.getTime() - startOfDate.getTime()) / DAY_MS);

  if (daysAgo === 0) {
    return 'Vandaag gezien';
  }

  if (daysAgo === 1) {
    return 'Gisteren gezien';
  }

  if (daysAgo > 1 && daysAgo < 7) {
    return `${daysAgo} dagen geleden gezien`;
  }

  return `Gezien op ${date.toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'short',
  })}`;
}

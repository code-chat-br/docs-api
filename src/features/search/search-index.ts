export type SearchableEntry = { title: string; search: string };

export function rankSearchEntries<T extends SearchableEntry>(entries: T[], query: string) {
  const normalized = query.toLowerCase().trim();
  const terms = normalized.split(/\s+/).filter(Boolean);
  if (!terms.length) return entries;
  return entries
    .filter((entry) => terms.every((term) => entry.search.includes(term)))
    .sort(
      (a, b) =>
        Number(b.title.toLowerCase().startsWith(normalized)) - Number(a.title.toLowerCase().startsWith(normalized)),
    );
}

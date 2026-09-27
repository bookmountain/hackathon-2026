// Search box on the map: case-insensitive substring match over a few fields

export function matchesQuery(query: string, ...fields: (string | null | undefined)[]): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return fields.some((f) => !!f && f.toLowerCase().includes(q));
}

export type ResultNoun = "room" | "item" | "event";

/** "3 rooms for “ensuite”", "1 event nearby"; image search: "4 similar items nearby" */
export function resultsTitle(
  count: number,
  noun: ResultNoun,
  query: string,
  imageSearch?: { loading: boolean },
): string {
  const plural = count === 1 ? "" : "s";
  const head = imageSearch
    ? imageSearch.loading
      ? "Analysing photo…"
      : `${count} similar item${plural}`
    : `${count} ${noun}${plural}`;
  const q = query.trim();
  return `${head}${q ? ` for “${q}”` : " nearby"}`;
}

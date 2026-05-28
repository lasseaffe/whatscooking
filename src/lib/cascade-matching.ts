export function titleMatchesTerms(title: string, terms: string[]): boolean {
  if (terms.length === 0) return false;
  const normalised = title.toLowerCase();
  return terms
    .filter((t) => t.trim().length > 0)
    .some((term) => normalised.includes(term.toLowerCase()));
}

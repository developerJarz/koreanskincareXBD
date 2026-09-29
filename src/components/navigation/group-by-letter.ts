/** Groups brands under their first letter (A–Z, then "#" for digits/symbols). */
export function groupByLetter<T extends { name: string }>(items: T[]) {
  const groups = new Map<string, T[]>();
  for (const item of [...items].sort((a, b) =>
    a.name.localeCompare(b.name, "en", { sensitivity: "base" }),
  )) {
    const first = item.name.normalize("NFD").replace(/\p{M}/gu, "").charAt(0).toUpperCase();
    const letter = /[A-Z]/.test(first) ? first : "#";
    groups.set(letter, [...(groups.get(letter) ?? []), item]);
  }
  return [...groups.entries()];
}

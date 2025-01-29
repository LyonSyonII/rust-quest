export function reverseIndex(string: string, search: string, start?: number) {
  const chars = [...string.substring(0, start)].reverse();
  let i = chars.length;
  for (const c of chars) {
    i -= 1;
    if (c === search) break;
  }
  return i;
}

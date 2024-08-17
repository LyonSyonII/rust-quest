export function bgToDark(bg: string): string {
  return `#${(Number.parseInt(bg.replace("#", "0x")) - 0xb1b8b8).toString(16)}`
}

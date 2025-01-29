const confettis = await import("confettis");

export async function confetti({ y = 1, count = 100 }: { y?: number; count?: number } = {}) {
  confettis.create({ y, count });
}

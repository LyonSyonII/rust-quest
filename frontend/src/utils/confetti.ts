export async function confetti({
  y = 2,
  count = 100,
}: { y?: number; count?: number } = {}) {
  const confettis = await import("confettis");
  confettis.create({ y, count });
}

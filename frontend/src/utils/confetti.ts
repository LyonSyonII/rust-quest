export async function confetti({
  count = 100,
  x = 0.5,
  y = 0.5,
  targetElement,
}: ConfettyProps = {}) {
  if (targetElement) {
    const rect = targetElement.getBoundingClientRect();
    const clientWidth = document.documentElement.clientWidth;
    const clientHeight = document.documentElement.clientHeight;
    const centerX = rect.left + x*rect.width;
    const centerY = rect.top + y*rect.height;
    x = centerX / clientWidth;
    y = centerY / clientHeight;
  }
  canvasConfetti({
    origin: {
      x,
      y,
    },
    particleCount: count,
    disableForReducedMotion: true
  });
}

const { default: canvasConfetti } = await import("canvas-confetti");

type ConfettyProps = {
  count?: number;
  x?: number;
  y?: number;
  targetElement?: HTMLElement;
};

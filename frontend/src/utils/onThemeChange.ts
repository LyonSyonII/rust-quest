export function onThemeChange(
  callback: (theme: "dark" | "light") => void,
): MutationObserver | undefined {
  const target = document.documentElement;
  const config = { attributeFilter: ["data-theme"] };

  const c: MutationCallback = (_, __) => {
    callback(target.dataset.theme as "dark" | "light");
  };
  const observer = new MutationObserver(c);
  observer.observe(target, config);
  return observer;
}

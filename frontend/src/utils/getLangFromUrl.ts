export const langs = {
  en: 0,
  ca: 1,
  es: 2,
};

const defaultLang = "en";

export function getLangFromUrl(url: string): keyof typeof langs {
  const [, , lang] = new URL(url).pathname.split("/");
  if (lang && lang in Object.keys(langs)) return lang as keyof typeof langs;
  return defaultLang;
}

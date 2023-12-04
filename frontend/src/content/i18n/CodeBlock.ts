import { type Langs } from "./langs";
type Translations = {
  placeholder: string;
  compiling: string;
  error: string;
};

const translations: Record<Langs, Translations> = {
  en: {
    placeholder: "Enter your code here...",
    compiling: "Compiling...",
    error:
      'Woops, something went wrong and the code does not compile!\nIf you\'ve mistakenly messed up the code, click the "Reset" button to return it back to its original state.\n\nRemember to replace ? with your answer.',
  },
  ca: {
    placeholder: "Escriu el teu codi aqui...",
    compiling: "Compilant...",
    error:
      'Ups, alguna cosa ha fallat i el codi no compila!\nSi t\'has equivocat modificant el codi, fes clic al botó de "Reset" per tornar-lo al seu estat original.\n\nRecorda substituïr ? amb la teva resposta.',
  },
  es: {
    placeholder: "Escribe tu código aquí...",
    compiling: "Compilando...",
    error:
      'Vaya, ¡algo ha ido mal y el código no compila!\nSi has estropeado el código por error, haz clic en el botón "Reset" para devolverlo a su estado original.\n\nRecuerda sustituir ? con tu respuesta.',
  },
};

export function translation(lang: Langs): Translations {
  return translations[lang];
}

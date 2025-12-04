/**
 * Idiomas soportados en el CMS
 * Sincronizado con la tabla supported_languages de Supabase
 */

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  isActive: boolean;
  isDefault: boolean;
  sortOrder: number;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    isActive: true,
    isDefault: true,
    sortOrder: 0,
  },
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    isActive: true,
    isDefault: false,
    sortOrder: 1,
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    isActive: true,
    isDefault: false,
    sortOrder: 2,
  },
  {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    flag: '🇧🇷',
    isActive: true,
    isDefault: false,
    sortOrder: 3,
  },
];

export const DEFAULT_LANGUAGE = SUPPORTED_LANGUAGES.find(lang => lang.isDefault) || SUPPORTED_LANGUAGES[0];

export const getLanguageByCode = (code: string): Language | undefined => {
  return SUPPORTED_LANGUAGES.find(lang => lang.code === code);
};

export const getActiveLanguages = (): Language[] => {
  return SUPPORTED_LANGUAGES.filter(lang => lang.isActive);
};

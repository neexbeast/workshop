export const defaultLocale = 'en';
export const locales = ['en', 'sr'] as const;

export type Locale = (typeof locales)[number];

export function getLocalePartsFrom(path: string) {
  const pathParts = path.split('/');
  const locale = pathParts[1] as Locale;
  const pathWithoutLocale = pathParts.slice(2).join('/');

  return {
    locale,
    pathWithoutLocale
  };
} 
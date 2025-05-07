import { getRequestConfig } from 'next-intl/server';
import type { GetRequestConfigParams, RequestConfig } from 'next-intl/server';
import { defaultLocale } from '../i18n.config';

export default getRequestConfig(async ({ locale }: GetRequestConfigParams): Promise<RequestConfig> => {
  const resolvedLocale = locale || defaultLocale;
  return {
    locale: resolvedLocale,
    messages: (await import(`../messages/${resolvedLocale}.json`)).default
  };
}); 
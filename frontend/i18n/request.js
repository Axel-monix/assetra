import { getRequestConfig } from 'next-intl/server';
import { locales, defaultLocale } from './routing';

export default getRequestConfig(async ({ locale }) => {
  try {
    return {
      messages: (await import(`../messages/${locale}.json`)).default
    };
  } catch (error) {
    return {
      messages: (await import(`../messages/${defaultLocale}.json`)).default
    };
  }
});
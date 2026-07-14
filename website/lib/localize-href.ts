import { i18n } from '@/lib/i18n';

/**
 * Prefix internal MDX link hrefs with the current locale so in-content links
 * keep the reader's language. Content authors write locale-neutral paths
 * ("/guides/publish"); the default locale is served without a prefix
 * (hideLocale: 'default-locale'), every other locale needs "/{lang}".
 */
export function localizeHref(href: unknown, lang: string): unknown {
  if (typeof href !== 'string') return href;
  if (!href.startsWith('/') || href.startsWith('//')) return href;
  if (lang === i18n.defaultLanguage) return href;
  if (href === `/${lang}` || href.startsWith(`/${lang}/`)) return href;
  return `/${lang}${href}`;
}

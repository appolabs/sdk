import { i18n } from '@/lib/i18n';
import { source } from '@/lib/source';

/** Public origin and base path the docs are served under (goappo.io rewrites /docs here). */
const DOCS_BASE = 'https://goappo.io/docs';

/**
 * Public URL of a docs page. The default locale is served without a prefix
 * (hideLocale: 'default-locale'); every other locale under "/{lang}".
 */
export function pageUrl(lang: string, slugs: string[]): string {
  const prefix = lang === i18n.defaultLanguage ? '' : `/${lang}`;
  return `${DOCS_BASE}${prefix}/${slugs.join('/')}`;
}

/**
 * hreflang alternates for a page: one entry per locale that has the page,
 * plus x-default pointing at the default-locale version when it exists.
 */
export function languageAlternates(slugs: string[]): Record<string, string> {
  const languages: Record<string, string> = {};

  for (const lang of i18n.languages) {
    if (source.getPage(slugs, lang)) {
      languages[lang] = pageUrl(lang, slugs);
    }
  }

  if (languages[i18n.defaultLanguage]) {
    languages['x-default'] = languages[i18n.defaultLanguage];
  }

  return languages;
}

/** schema.org TechArticle for a docs page. */
export function techArticleSchema(page: {
  lang: string;
  slugs: string[];
  title: string;
  description?: string;
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: page.title,
    description: page.description,
    inLanguage: page.lang,
    url: pageUrl(page.lang, page.slugs),
    isPartOf: { '@type': 'WebSite', name: 'Appo Docs', url: DOCS_BASE },
    publisher: { '@type': 'Organization', name: 'Appo', url: 'https://goappo.io' },
  };
}

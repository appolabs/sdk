import { source } from '@/lib/source';
import type { InferPageType } from 'fumadocs-core/source';
import {
  DocsPage,
  DocsBody,
  DocsTitle,
  DocsDescription,
} from 'fumadocs-ui/page';
import { notFound, redirect } from 'next/navigation';
import type { ComponentProps, ElementType } from 'react';
import { getMDXComponents } from '@/mdx-components';
import { localizeHref } from '@/lib/localize-href';

type Page = InferPageType<typeof source>;

export const revalidate = false;

export default async function DocsSlugPage(props: {
  params: Promise<{ lang: string; slug?: string[] }>;
}) {
  const params = await props.params;

  if (!params.slug) {
    redirect(`/${params.lang}/getting-started`);
  }

  const page = source.getPage(params.slug, params.lang) as Page | undefined;
  if (!page) notFound();

  const MDX = page.data.body;
  const base = getMDXComponents();
  const DefaultAnchor = (base.a ?? 'a') as ElementType;
  const components = getMDXComponents({
    a: ({ href, ...rest }: ComponentProps<'a'>) => (
      <DefaultAnchor
        href={localizeHref(href, params.lang) as string | undefined}
        {...rest}
      />
    ),
  });

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        <MDX components={components} />
      </DocsBody>
    </DocsPage>
  );
}

export function generateStaticParams() {
  return source.getLanguages().flatMap(({ language, pages }) =>
    pages.map((page) => ({
      lang: language,
      slug: page.slugs,
    })),
  );
}

export async function generateMetadata(props: {
  params: Promise<{ lang: string; slug?: string[] }>;
}) {
  const params = await props.params;
  const page = source.getPage(params.slug, params.lang);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
  };
}

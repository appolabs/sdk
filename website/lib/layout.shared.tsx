import Image from 'next/image';
import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

export function baseOptions(lang: string): BaseLayoutProps {
  return {
    nav: {
      title: (
        <>
          <Image
            src="/logo-black.svg"
            alt="Appo"
            width={100}
            height={26}
            className="dark:hidden"
            unoptimized
          />
          <Image
            src="/logo-white.svg"
            alt="Appo"
            width={100}
            height={26}
            className="hidden dark:block"
            unoptimized
          />
        </>
      ),
    },
    links: [
      {
        text: 'Documentation',
        url: `/${lang}/getting-started`,
        active: 'nested-url',
      },
    ],
    i18n: true,
  };
}

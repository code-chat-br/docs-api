/* eslint-disable @next/next/no-img-element */
import { getPageImage, source } from '@/lib/source';
import { notFound } from 'next/navigation';
import { ImageResponse } from 'next/og';
import { generate as DefaultImage } from 'fumadocs-ui/og';
import { appName } from '@/lib/shared';
import { branding } from '@/config/branding';
import { readFileSync } from 'node:fs';
import path from 'node:path';

export const revalidate = false;

export async function GET(_req: Request, { params }: RouteContext<'/og/docs/[...slug]'>) {
  const { slug } = await params;
  const page = source.getPage(slug.slice(0, -1));
  if (!page) notFound();
  const logo = `data:image/png;base64,${readFileSync(path.join(process.cwd(), 'public', branding.logoPath.slice(1))).toString('base64')}`;

  return new ImageResponse(
    <DefaultImage
      title={page.data.title}
      description={page.data.description}
      site={appName}
      icon={<img src={logo} alt="" width={64} height={65} />}
      primaryColor="rgba(16, 185, 129, 0.35)"
      primaryTextColor="#34d399"
    />,
    {
      width: 1200,
      height: 630,
    },
  );
}

export function generateStaticParams() {
  return source.getPages().map((page) => ({
    lang: page.locale,
    slug: getPageImage(page).segments,
  }));
}

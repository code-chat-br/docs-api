import { getPageImage, getPageMarkdownUrl, source } from '@/lib/source';
import { DocsBody, DocsDescription, DocsTitle, MarkdownCopyButton, ViewOptionsPopover } from 'fumadocs-ui/layouts/docs/page';
import { notFound } from 'next/navigation';
import { getMDXComponents } from '@/components/mdx';
import type { Metadata } from 'next';
import { createRelativeLink } from 'fumadocs-ui/mdx';
import { gitConfig } from '@/lib/shared';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { DocumentationShell } from '@/components/layout/documentation-shell';
import { loadApiReference } from '@/features/openapi/openapi-loader';
import { getGuideNavigation, getGuideNeighbours, toPlainText } from '@/lib/navigation';

export default async function Page(props: PageProps<'/docs/[[...slug]]'>) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;
  const markdownUrl = getPageMarkdownUrl(page).url;
  const guideNavigation = getGuideNavigation();
  const neighbours = getGuideNeighbours(page.url, guideNavigation);
  const { spec, webhooks } = await loadApiReference();
  const toc = page.data.toc.map((item) => ({ title: toPlainText(item.title, item.url), url: item.url, depth: item.depth }));

  return (
    <DocumentationShell
      spec={spec}
      webhooks={webhooks}
      guideNavigation={guideNavigation}
      toc={toc}
      context={{ eyebrow: 'Guia editorial', title: page.data.title, description: page.data.description }}
    >
      <article className="editorial-page" data-full={page.data.full}>
        <div className="endpoint-breadcrumb">
          <Link href="/docs">Guias</Link>
          <span>/</span>
          <strong>{page.data.title}</strong>
        </div>
        <header className="editorial-header">
          <span className="endpoint-tag">Documentação</span>
          <DocsTitle>{page.data.title}</DocsTitle>
          <DocsDescription>{page.data.description}</DocsDescription>
        </header>
        <div className="editorial-actions">
          <MarkdownCopyButton markdownUrl={markdownUrl} />
          <ViewOptionsPopover
            markdownUrl={markdownUrl}
            githubUrl={`https://github.com/${gitConfig.user}/${gitConfig.repo}/blob/${gitConfig.branch}/content/docs/${page.path}`}
          />
        </div>
        <DocsBody className="editorial-body">
          <MDX
            components={getMDXComponents({
              a: createRelativeLink(source, page),
            })}
          />
        </DocsBody>
        <nav className="endpoint-pagination editorial-pagination" aria-label="Guia anterior e seguinte">
          {neighbours.previous ? (
            <Link href={neighbours.previous.href}>
              <ArrowLeft size={17} />
              <span>
                <small>Guia anterior</small>
                <strong>{neighbours.previous.title}</strong>
              </span>
            </Link>
          ) : (
            <span />
          )}
          {neighbours.next ? (
            <Link href={neighbours.next.href}>
              <span>
                <small>Próximo guia</small>
                <strong>{neighbours.next.title}</strong>
              </span>
              <ArrowRight size={17} />
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </article>
    </DocumentationShell>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: PageProps<'/docs/[[...slug]]'>): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
    openGraph: {
      images: getPageImage(page).url,
    },
  };
}

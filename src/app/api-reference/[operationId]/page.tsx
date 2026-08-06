import type { Metadata } from 'next';
import { EndpointPage } from '@/components/api/endpoint-page';
import { loadApiReference } from '@/features/openapi/openapi-loader';
import { JsonLd } from '@/components/seo/json-ld';
import { createOperationJsonLd, createPageMetadata } from '@/lib/seo';

export async function generateStaticParams() {
  const { spec } = await loadApiReference();
  return spec.operations.map((operation) => ({ operationId: operation.id }));
}

export async function generateMetadata({ params }: PageProps<'/api-reference/[operationId]'>): Promise<Metadata> {
  const { operationId } = await params;
  const { spec } = await loadApiReference();
  const operation = spec.operations.find((entry) => entry.id === operationId);
  const title = operation?.summary || operation?.id || 'Endpoint CodeChat';
  const description =
    operation?.description ||
    (operation
      ? `Referência do endpoint ${operation.method.toUpperCase()} ${operation.path}.`
      : 'Referência dos endpoints da CodeChat API.');

  return createPageMetadata({
    title,
    description,
    path: `/api-reference/${encodeURIComponent(operationId)}`,
    type: 'article',
    keywords: [
      operation?.id,
      operation?.tag,
      operation?.method.toUpperCase(),
      operation?.path,
      'endpoint CodeChat',
      'referência API CodeChat',
    ],
  });
}

export default async function OperationRoute({ params }: PageProps<'/api-reference/[operationId]'>) {
  const { operationId } = await params;
  const { spec } = await loadApiReference();
  const operation = spec.operations.find((entry) => entry.id === operationId);

  return (
    <>
      {operation ? <JsonLd data={createOperationJsonLd(operation)} /> : null}
      <EndpointPage operationId={operationId} />
    </>
  );
}

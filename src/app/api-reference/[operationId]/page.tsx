import type { Metadata } from 'next';
import { EndpointPage } from '@/components/api/endpoint-page';
import { loadApiReference } from '@/features/openapi/openapi-loader';

export async function generateStaticParams() {
  const { spec } = await loadApiReference();
  return spec.operations.map((operation) => ({ operationId: operation.id }));
}

export async function generateMetadata({ params }: PageProps<'/api-reference/[operationId]'>): Promise<Metadata> {
  const { operationId } = await params;
  const { spec } = await loadApiReference();
  const operation = spec.operations.find((entry) => entry.id === operationId);
  return { title: operation?.summary || 'Endpoint', description: operation?.description };
}

export default async function OperationRoute({ params }: PageProps<'/api-reference/[operationId]'>) {
  const { operationId } = await params;
  return <EndpointPage operationId={operationId} />;
}

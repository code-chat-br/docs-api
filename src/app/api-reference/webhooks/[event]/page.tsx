import type { Metadata } from 'next';
import { WebhookEventPage } from '@/components/api/webhook-page';
import { loadApiReference } from '@/features/openapi/openapi-loader';

export async function generateStaticParams() {
  const { webhooks } = await loadApiReference();
  return webhooks.events.map((event) => ({ event: event.name }));
}

export async function generateMetadata({ params }: PageProps<'/api-reference/webhooks/[event]'>): Promise<Metadata> {
  const { event } = await params;
  return { title: `Webhook ${event}`, description: `Payload e entrega do evento ${event}.` };
}

export default async function WebhookEventRoute({ params }: PageProps<'/api-reference/webhooks/[event]'>) {
  const { event } = await params;
  return <WebhookEventPage eventName={decodeURIComponent(event)} />;
}

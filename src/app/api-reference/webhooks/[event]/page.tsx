import type { Metadata } from 'next';
import { WebhookEventPage } from '@/components/api/webhook-page';
import { loadApiReference } from '@/features/openapi/openapi-loader';
import { JsonLd } from '@/components/seo/json-ld';
import { createPageMetadata, createWebhookJsonLd } from '@/lib/seo';

export async function generateStaticParams() {
  const { webhooks } = await loadApiReference();
  return webhooks.events.map((event) => ({ event: event.name }));
}

export async function generateMetadata({ params }: PageProps<'/api-reference/webhooks/[event]'>): Promise<Metadata> {
  const { event } = await params;
  const eventName = decodeURIComponent(event);
  const { webhooks } = await loadApiReference();
  const webhook = webhooks.events.find((entry) => entry.name === eventName);
  const title = `Webhook ${eventName}`;
  const description = webhook?.description || `Payload e entrega do evento ${eventName}.`;

  return createPageMetadata({
    title,
    description,
    path: `/api-reference/webhooks/${encodeURIComponent(eventName)}`,
    type: 'article',
    keywords: [eventName, webhook?.kind, webhook?.flag, 'webhook CodeChat', 'evento WhatsApp'],
  });
}

export default async function WebhookEventRoute({ params }: PageProps<'/api-reference/webhooks/[event]'>) {
  const { event } = await params;
  const eventName = decodeURIComponent(event);
  const { webhooks } = await loadApiReference();
  const webhook = webhooks.events.find((entry) => entry.name === eventName);

  return (
    <>
      {webhook ? <JsonLd data={createWebhookJsonLd(webhook)} /> : null}
      <WebhookEventPage eventName={eventName} />
    </>
  );
}

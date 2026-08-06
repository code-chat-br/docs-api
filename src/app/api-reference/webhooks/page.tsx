import type { Metadata } from 'next';
import { WebhookOverviewPage } from '@/components/api/webhook-page';
import { JsonLd } from '@/components/seo/json-ld';
import { loadApiReference } from '@/features/openapi/openapi-loader';
import { createApiReferenceJsonLd, createPageMetadata } from '@/lib/seo';

const title = 'Webhooks CodeChat';
const description = 'Eventos, headers, envelopes e política de entrega dos webhooks CodeChat.';

export const metadata: Metadata = createPageMetadata({
  title,
  description,
  path: '/api-reference/webhooks',
  keywords: ['webhooks CodeChat', 'eventos WhatsApp', 'payload webhook', 'entrega webhook'],
});

export default async function WebhooksRoute() {
  const { webhooks } = await loadApiReference();

  return (
    <>
      <JsonLd
        data={createApiReferenceJsonLd({
          title,
          description,
          path: '/api-reference/webhooks',
          webhookCount: webhooks.total,
        })}
      />
      <WebhookOverviewPage />
    </>
  );
}

import type { Metadata } from 'next';
import { WebhookOverviewPage } from '@/components/api/webhook-page';

export const metadata: Metadata = {
  title: 'Webhooks',
  description: 'Eventos, headers, envelopes e política de entrega dos webhooks CodeChat.',
};

export default function WebhooksRoute() {
  return <WebhookOverviewPage />;
}

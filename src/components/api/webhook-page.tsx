'use client';

import { ArrowRight, Clock, Database, RefreshCcw, ShieldAlert, Webhook } from 'lucide-react';
import Link from 'next/link';
import { CodeBlock } from '@/components/common/code-block';
import { useApiReference } from '@/features/openapi/openapi-context';

export function WebhookOverviewPage() {
  const { webhooks } = useApiReference();
  return (
    <article className="webhook-overview endpoint-page">
      <div className="endpoint-breadcrumb">
        <Link href="/api-reference">Referência</Link>
        <span>/</span>
        <strong>Webhooks</strong>
      </div>
      <header className="endpoint-header">
        <span className="endpoint-tag">Eventos</span>
        <h1>Webhooks da CodeChat</h1>
        <p>Requisições HTTP POST assíncronas enviadas para a URL configurada pelo consumidor.</p>
      </header>
      <section className="webhook-summary-grid">
        <article>
          <Webhook />
          <strong>{webhooks.instanceCount} eventos por instância</strong>
          <p>Fila em memória, timeout de 15 segundos e entrega para o webhook da instância ou global.</p>
        </article>
        <article>
          <Database />
          <strong>{webhooks.batchCount} eventos de lote</strong>
          <p>Outbox PostgreSQL, entrega global e retry persistente com backoff.</p>
        </article>
        <article>
          <Clock />
          <strong>Resposta de sucesso</strong>
          <p>Qualquer status HTTP entre 200 e 299 confirma a entrega.</p>
        </article>
        <article>
          <ShieldAlert />
          <strong>Sem assinatura HMAC</strong>
          <p>Use HTTPS e controles de rede. x-request-id não comprova autenticidade.</p>
        </article>
      </section>
      <section className="endpoint-section">
        <div className="section-title">
          <RefreshCcw size={18} />
          <h2>Entrega, retry e idempotência</h2>
        </div>
        <ul className="webhook-guidance">
          <li>Eventos por instância não possuem retry automático nem dead-letter queue.</li>
          <li>Eventos de Message Batch usam retry persistente e podem ser entregues novamente.</li>
          <li>A ordem relativa não é garantida. Consumidores devem ser idempotentes e tolerar duplicidades.</li>
          <li>O header x-request-id é útil para correlação, mas não é uma chave de idempotência garantida.</li>
        </ul>
      </section>
      <section className="endpoint-section">
        <div className="section-title">
          <Webhook size={18} />
          <h2>Headers por instância</h2>
        </div>
        <CodeBlock
          language="http"
          code={
            'Content-Type: application/json\nUser-Agent: CodeChat-Webhook/1.0\nx-request-id: 019f0000-0000-7000-8000-000000000000\nx-owner-jid: 5511999999999@s.whatsapp.net\nx-instance-name: minha-instancia\nx-instance-id: 1\nx-webhook-event: messages.upsert'
          }
        />
      </section>
      <div className="webhook-event-cards">
        {webhooks.events.map((event) => (
          <Link key={event.name} href={`/api-reference/webhooks/${encodeURIComponent(event.name)}`}>
            <span>{event.kind === 'batch' ? 'Message Batch · Pro' : event.flag || 'Instância'}</span>
            <strong>{event.name}</strong>
            <p>{event.description}</p>
            <ArrowRight size={16} />
          </Link>
        ))}
      </div>
    </article>
  );
}

export function WebhookEventPage({ eventName }: { eventName: string }) {
  const { webhooks } = useApiReference();
  const event = webhooks.events.find((entry) => entry.name === eventName);
  if (!event)
    return (
      <div className="reference-not-found">
        <h1>Evento não encontrado</h1>
        <Link href="/api-reference/webhooks">Voltar aos webhooks</Link>
      </div>
    );
  return (
    <article className="endpoint-page webhook-event-page">
      <div className="endpoint-breadcrumb">
        <Link href="/api-reference">Referência</Link>
        <span>/</span>
        <Link href="/api-reference/webhooks">Webhooks</Link>
        <span>/</span>
        <strong>{event.name}</strong>
      </div>
      <header className="endpoint-header">
        <span className="endpoint-tag">{event.kind === 'batch' ? 'Message Batch' : 'Evento por instância'}</span>
        <h1>{event.name}</h1>
        <p>{event.description}</p>
        <div className="endpoint-flags">
          {event.kind === 'batch' && <span className="flag-pro">Pro</span>}
          {event.flag && <span className="flag-event">flag: {event.flag}</span>}
        </div>
      </header>
      <section className="endpoint-section">
        <div className="section-title">
          <Webhook size={18} />
          <h2>Requisição</h2>
        </div>
        <CodeBlock code={event.request} language="http" />
      </section>
      <section className="endpoint-section">
        <div className="section-title">
          <Database size={18} />
          <h2>Payload</h2>
        </div>
        <CodeBlock code={JSON.stringify(event.example, null, 2)} language="json" />
        {event.fields.length > 0 && (
          <div className="event-field-list">
            {event.fields.map((field) => (
              <div key={field.name}>
                <code>{field.name}</code>
                <span>{field.type}</span>
                <p>{field.description}</p>
              </div>
            ))}
          </div>
        )}
      </section>
      <section className="endpoint-section">
        <div className="section-title">
          <RefreshCcw size={18} />
          <h2>Observações de entrega</h2>
        </div>
        <ul className="webhook-guidance">
          {event.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
          <li>Implemente idempotência por chave de negócio e aceite a possibilidade de duplicidades e reordenação.</li>
        </ul>
      </section>
    </article>
  );
}

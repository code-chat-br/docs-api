import type { Metadata } from 'next';
import { ArrowRight, Braces, ExternalLink, Radio, Search, ShieldCheck, Webhook } from 'lucide-react';
import Link from 'next/link';
import { documentationConfig } from '@/config/documentation';
import { loadApiReference } from '@/features/openapi/openapi-loader';

export const metadata: Metadata = {
  title: 'Referência da API',
  description: 'Referência OpenAPI dinâmica da CodeChat com exemplos, schemas e playground seguro.',
};

export default async function ApiReferenceOverview() {
  const { spec, webhooks } = await loadApiReference();
  const first = spec.operations[0];
  return (
    <article className="reference-overview">
      <div className="overview-eyebrow">
        <span /> OpenAPI 3.1 · source-first
      </div>
      <h1>
        Referência da
        <br />
        <em>CodeChat API</em>
      </h1>
      <p className="overview-lead">
        Explore {spec.operations.length} operações HTTP, {Object.keys(spec.schemas).length} schemas e {webhooks.total}{' '}
        eventos de webhook auditados diretamente contra o runtime Go.
      </p>
      <div className="overview-actions">
        {first && (
          <Link className="overview-primary" href={`/api-reference/${first.id}`}>
            Explorar endpoints <ArrowRight size={16} />
          </Link>
        )}
        <Link className="overview-secondary" href="/docs/getting-started">
          Guia de início rápido
        </Link>
        <a
          className="overview-secondary"
          href={documentationConfig.externalLinks.postman}
          target="_blank"
          rel="noreferrer"
        >
          Coleção no Postman <ExternalLink size={15} />
        </a>
      </div>
      <section className="overview-grid">
        <article>
          <Braces />
          <strong>Contrato dinâmico</strong>
          <p>
            Paths, métodos, parâmetros, bodies, respostas e schemas são interpretados do OpenAPI; endpoints não são
            duplicados em componentes.
          </p>
        </article>
        <article>
          <ShieldCheck />
          <strong>Autenticação real</strong>
          <p>
            API key global e Bearer JWT por instância seguem exatamente os headers e aliases confirmados no middleware.
          </p>
        </article>
        <article>
          <Webhook />
          <strong>{webhooks.total} webhooks</strong>
          <p>
            {webhooks.instanceCount} eventos por instância e {webhooks.batchCount} eventos globais persistentes de
            Message Batch.
          </p>
        </article>
        <article>
          <Search />
          <strong>Busca global</strong>
          <p>
            Use Ctrl K ou Cmd K para pesquisar endpoints, paths, operationIds, parâmetros, schemas, guias e eventos.
          </p>
        </article>
      </section>
      <section className="overview-facts">
        <div>
          <span>Base URL local</span>
          <code>http://localhost:8084</code>
        </div>
        <div>
          <span>Autenticação global</span>
          <code>apikey: &lt;GLOBAL_API_KEY&gt;</code>
        </div>
        <div>
          <span>Autenticação de instância</span>
          <code>Authorization: Bearer &lt;INSTANCE_TOKEN&gt;</code>
        </div>
        <div>
          <span>Tempo real</span>
          <p>
            <Radio size={15} /> Webhooks HTTP e WebSocket de eventos.
          </p>
        </div>
      </section>
    </article>
  );
}

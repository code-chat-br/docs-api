'use client';

import { ArrowLeft, ArrowRight, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useApiReference } from '@/features/openapi/openapi-context';
import { AuthenticationSection } from './authentication-section';
import { EndpointUrlBar } from './endpoint-url-bar';
import { ParametersSection } from './parameters-section';
import { RequestBodySection } from './request-body-section';
import { ResponseSection } from './response-section';
import { TryItPanel } from './try-it-panel';

export function EndpointPage({ operationId }: { operationId: string }) {
  const { spec } = useApiReference();
  const operation = spec.operations.find((entry) => entry.id === operationId);
  const [tryOpen, setTryOpen] = useState(false);
  if (!operation)
    return (
      <div className="reference-not-found">
        <h1>Endpoint não encontrado</h1>
        <p>O operationId informado não existe na especificação sincronizada.</p>
        <Link href="/api-reference">Voltar à visão geral</Link>
      </div>
    );
  const previous = spec.operations.find((entry) => entry.id === operation.previousId);
  const next = spec.operations.find((entry) => entry.id === operation.nextId);
  return (
    <article className="endpoint-page">
      <div className="endpoint-breadcrumb">
        <Link href="/api-reference">Referência</Link>
        <span>/</span>
        <span>{operation.tag}</span>
        <span>/</span>
        <strong>{operation.id}</strong>
      </div>
      <header className="endpoint-header">
        <span className="endpoint-tag">{operation.tag}</span>
        <h1>{operation.summary}</h1>
        <p>{operation.description}</p>
        <div className="endpoint-flags">
          {operation.plan === 'pro' && <span className="flag-pro">Pro</span>}
          {operation.experimental && <span className="flag-experimental">Experimental</span>}
          {operation.deprecated && <span className="flag-deprecated">Deprecated</span>}
          {operation.externalDocs && (
            <a href={operation.externalDocs.url} target="_blank" rel="noreferrer">
              Documentação externa <ExternalLink size={13} />
            </a>
          )}
        </div>
      </header>
      <EndpointUrlBar method={operation.method} path={operation.path} onTry={() => setTryOpen(true)} />
      <AuthenticationSection operation={operation} spec={spec} />
      <ParametersSection operation={operation} spec={spec} />
      <RequestBodySection operation={operation} spec={spec} />
      <ResponseSection operation={operation} spec={spec} />
      <nav className="endpoint-pagination" aria-label="Endpoint anterior e seguinte">
        {previous ? (
          <Link href={`/api-reference/${previous.id}`}>
            <ArrowLeft size={17} />
            <span>
              <small>Anterior · {previous.tag}</small>
              <strong>{previous.summary}</strong>
            </span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={`/api-reference/${next.id}`}>
            <span>
              <small>Próximo · {next.tag}</small>
              <strong>{next.summary}</strong>
            </span>
            <ArrowRight size={17} />
          </Link>
        ) : (
          <span />
        )}
      </nav>
      <TryItPanel
        key={operation.id}
        operation={operation}
        spec={spec}
        open={tryOpen}
        onClose={() => setTryOpen(false)}
      />
    </article>
  );
}

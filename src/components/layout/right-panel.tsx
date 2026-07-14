'use client';

import { BookOpen, ChevronRight, Hash } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { CodeBlock } from '@/components/common/code-block';
import { StatusTabs } from '@/components/api/status-tabs';
import { branding } from '@/config/branding';
import { codeLanguages, generateCodeSample, type CodeLanguage } from '@/features/openapi/code-sample-generator';
import { exampleFromMediaType } from '@/features/openapi/example-generator';
import { resolveResponse, schemaFromContent } from '@/features/openapi/openapi-resolver';
import type { NormalizedOperation, ReferenceSpec, WebhookEvent } from '@/features/openapi/openapi-types';
import type { DocumentationContext, DocumentationTocItem } from './documentation-shell';

function languageId(language: CodeLanguage) {
  return { cURL: 'bash', JavaScript: 'javascript', 'Node.js': 'javascript', Go: 'go', Python: 'python', PHP: 'php' }[
    language
  ];
}

export function RightPanel({
  spec,
  operation,
  event,
  eventCount,
  toc = [],
  context,
  collapsed,
  onExpand,
}: {
  spec: ReferenceSpec;
  operation?: NormalizedOperation;
  event?: WebhookEvent;
  eventCount: number;
  toc?: DocumentationTocItem[];
  context?: DocumentationContext;
  collapsed: boolean;
  onExpand: () => void;
}) {
  const [language, setLanguage] = useState<CodeLanguage>('cURL');
  const statuses = useMemo(() => (operation ? Object.keys(operation.responses) : []), [operation]);
  const [status, setStatus] = useState(statuses[0]);
  const activeStatus = statuses.includes(status) ? status : statuses[0];
  const response = operation ? resolveResponse(operation.responses[activeStatus], spec) : undefined;
  const responseMedia = schemaFromContent(response?.content);
  const responseExample = responseMedia ? exampleFromMediaType(responseMedia.media, spec) : undefined;
  const [activeAnchor, setActiveAnchor] = useState(toc[0]?.url);
  const currentAnchor = toc.some((item) => item.url === activeAnchor) ? activeAnchor : toc[0]?.url;

  useEffect(() => {
    const headings = toc
      .map((item) => document.getElementById(item.url.replace(/^#/, '')))
      .filter(Boolean) as HTMLElement[];
    if (!headings.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveAnchor(`#${visible[0].target.id}`);
      },
      { rootMargin: '-76px 0px -68% 0px' },
    );
    headings.forEach((heading) => observer.observe(heading));
    return () => observer.disconnect();
  }, [toc]);

  if (collapsed) {
    return (
      <button type="button" className="right-panel-collapsed" onClick={onExpand} aria-label="Exibir painel contextual">
        <ChevronRight size={18} />
        <span>{operation || event ? 'Exemplos' : 'Contexto'}</span>
      </button>
    );
  }

  if (!operation && !event) {
    const currentOperations = spec.operations.filter((entry) => !entry.deprecated && entry.plan !== 'pro').length;
    const proOperations = spec.operations.filter((entry) => entry.plan === 'pro').length;
    return (
      <aside className="reference-right-panel contextual-right-panel" aria-label="Painel contextual">
        <section className="contextual-panel-scroll">
          <div className="contextual-panel-heading">
            <span>{context?.eyebrow || 'Referência da API'}</span>
            <strong>{context?.title || 'Contrato navegável'}</strong>
            <p>
              {context?.description ||
                'Selecione um endpoint ou evento para explorar exemplos, respostas e payloads gerados do contrato.'}
            </p>
          </div>

          {toc.length > 0 ? (
            <nav className="contextual-toc" aria-label="Nesta página">
              <div>
                <Hash size={14} />
                <strong>Nesta página</strong>
              </div>
              {toc.map((item) => (
                <a
                  key={item.url}
                  href={item.url}
                  className={currentAnchor === item.url ? 'active' : ''}
                  style={{ '--toc-depth': Math.max(item.depth - 2, 0) } as CSSProperties}
                  aria-current={currentAnchor === item.url ? 'location' : undefined}
                >
                  {item.title}
                </a>
              ))}
            </nav>
          ) : (
            <>
              <dl className="contextual-stats">
                <div>
                  <dt>Operações atuais</dt>
                  <dd>{currentOperations}</dd>
                </div>
                <div>
                  <dt>Operações Pro</dt>
                  <dd>{proOperations}</dd>
                </div>
                <div>
                  <dt>Schemas</dt>
                  <dd>{Object.keys(spec.schemas).length}</dd>
                </div>
                <div>
                  <dt>Eventos</dt>
                  <dd>{eventCount}</dd>
                </div>
              </dl>
              <nav className="contextual-links" aria-label="Atalhos do portal">
                <Link href="/docs/getting-started">
                  <BookOpen size={14} /> Primeiros passos
                </Link>
                <Link href="/api-reference">Explorar endpoints</Link>
                <Link href="/api-reference/webhooks">Catálogo de webhooks</Link>
              </nav>
            </>
          )}
        </section>
      </aside>
    );
  }

  if (event) {
    return (
      <aside className="reference-right-panel" aria-label="Exemplo do evento de webhook">
        <section className="right-section">
          <div className="right-section-title">
            <strong>Requisição recebida</strong>
            <span>HTTP</span>
          </div>
          <CodeBlock code={event.request} language="http" />
        </section>
        <section className="right-section right-response">
          <div className="right-section-title">
            <strong>Payload</strong>
            <span>{event.kind === 'batch' ? 'global' : 'instância'}</span>
          </div>
          <CodeBlock code={JSON.stringify(event.example, null, 2)} language="json" />
        </section>
      </aside>
    );
  }

  const code = generateCodeSample(operation!, spec, branding.apiUrl, language);
  return (
    <aside className="reference-right-panel" aria-label="Exemplos de requisição e resposta">
      <section className="right-section">
        <div className="right-section-title">
          <strong>{operation!.summary}</strong>
        </div>
        <label className="language-select">
          Linguagem
          <select value={language} onChange={(event) => setLanguage(event.target.value as CodeLanguage)}>
            {codeLanguages.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <CodeBlock code={code} language={languageId(language)} />
      </section>
      <section className="right-section right-response">
        <div className="right-section-title">
          <strong>Resposta</strong>
          <span>{responseMedia?.contentType || 'sem body'}</span>
        </div>
        <StatusTabs statuses={statuses} value={activeStatus} onChange={setStatus} />
        {responseExample?.value !== undefined ? (
          <CodeBlock
            code={JSON.stringify(responseExample.value, null, 2)}
            language="json"
            generated={responseExample.generated}
          />
        ) : (
          <div className="empty-code-response">
            <strong>{activeStatus}</strong>
            <p>{response?.description || 'Resposta sem corpo documentado.'}</p>
          </div>
        )}
      </section>
    </aside>
  );
}

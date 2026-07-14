'use client';

import { Reply } from 'lucide-react';
import { useState } from 'react';
import { CodeBlock } from '@/components/common/code-block';
import { exampleFromMediaType } from '@/features/openapi/example-generator';
import { resolveResponse, schemaFromContent } from '@/features/openapi/openapi-resolver';
import type { NormalizedOperation, ReferenceSpec } from '@/features/openapi/openapi-types';
import { SchemaViewer } from './schema-viewer';
import { StatusTabs } from './status-tabs';

export function ResponseSection({ operation, spec }: { operation: NormalizedOperation; spec: ReferenceSpec }) {
  const statuses = Object.keys(operation.responses);
  const [status, setStatus] = useState(statuses[0]);
  const activeStatus = statuses.includes(status) ? status : statuses[0];
  const response = resolveResponse(operation.responses[activeStatus], spec);
  const content = schemaFromContent(response?.content);
  const example = content ? exampleFromMediaType(content.media, spec) : undefined;
  return (
    <section className="endpoint-section" id="respostas">
      <div className="section-title">
        <Reply size={18} />
        <h2>Respostas</h2>
        {content?.contentType && <span className="content-type-label">{content.contentType}</span>}
      </div>
      <StatusTabs statuses={statuses} value={activeStatus} onChange={setStatus} />
      <div className="response-description">
        <strong>{activeStatus}</strong>
        <p>{response?.description || 'Sem descrição.'}</p>
      </div>
      {response?.headers && Object.keys(response.headers).length > 0 && (
        <div className="response-headers">
          <h3>Headers de resposta</h3>
          {Object.entries(response.headers).map(([name, header]) => (
            <div key={name}>
              <code>{name}</code>
              <span>{'$ref' in header ? header.$ref : header.description}</span>
            </div>
          ))}
        </div>
      )}
      {content?.schema && <SchemaViewer schema={content.schema} spec={spec} name={`response ${activeStatus}`} />}
      {example?.value !== undefined && (
        <CodeBlock
          code={JSON.stringify(example.value, null, 2)}
          language="json"
          title={`Exemplo ${activeStatus}`}
          generated={example.generated}
        />
      )}
      {!content && <p className="empty-state">Esta resposta não declara corpo.</p>}
    </section>
  );
}

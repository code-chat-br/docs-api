'use client';

import { Braces } from 'lucide-react';
import { useState } from 'react';
import { CodeBlock } from '@/components/common/code-block';
import { exampleFromMediaType } from '@/features/openapi/example-generator';
import { resolveRequestBody } from '@/features/openapi/openapi-resolver';
import type { NormalizedOperation, ReferenceSpec } from '@/features/openapi/openapi-types';
import { SchemaViewer } from './schema-viewer';

export function RequestBodySection({ operation, spec }: { operation: NormalizedOperation; spec: ReferenceSpec }) {
  const body = resolveRequestBody(operation.requestBody, spec);
  const contentTypes = Object.keys(body?.content || {});
  const [selected, setSelected] = useState(contentTypes[0]);
  if (!body || !contentTypes.length) return null;
  const contentType = contentTypes.includes(selected) ? selected : contentTypes[0];
  const media = body.content[contentType];
  const example = exampleFromMediaType(media, spec);
  return (
    <section className="endpoint-section" id="body">
      <div className="section-title">
        <Braces size={18} />
        <h2>Request body</h2>
        {body.required && <span className="required-badge">obrigatório</span>}
      </div>
      <div className="content-type-tabs" role="tablist" aria-label="Content types do request body">
        {contentTypes.map((type) => (
          <button
            role="tab"
            aria-selected={type === contentType}
            className={type === contentType ? 'active' : ''}
            key={type}
            onClick={() => setSelected(type)}
          >
            {type}
          </button>
        ))}
      </div>
      {body.description && <p className="section-description">{body.description}</p>}
      <SchemaViewer schema={media.schema as never} spec={spec} name="body" />
      {example.value !== undefined && (
        <CodeBlock
          code={JSON.stringify(example.value, null, 2)}
          language="json"
          title="Exemplo JSON"
          generated={example.generated}
        />
      )}
    </section>
  );
}

import { describe, expect, it } from 'vitest';
import { normalizeOpenApi } from '@/features/openapi/openapi-normalizer';
import { minimalDocument } from './fixtures';

describe('normalizeOpenApi', () => {
  it('indexa operações, categorias e navegação na ordem configurada', () => {
    const spec = normalizeOpenApi(minimalDocument);

    expect(spec.operations.map((operation) => operation.id)).toEqual(['listInstances', 'sendMessage']);
    expect(spec.tags.map((tag) => tag.name)).toEqual(['Instance', 'Message']);
    expect(spec.operations[0].nextId).toBe('sendMessage');
    expect(spec.operations[1].previousId).toBe('listInstances');
    expect(spec.operations[1].parameters).toHaveLength(1);
  });

  it('rejeita documentos fora de OpenAPI 3.1', () => {
    expect(() => normalizeOpenApi({ ...minimalDocument, openapi: '3.0.3' })).toThrow();
  });
});

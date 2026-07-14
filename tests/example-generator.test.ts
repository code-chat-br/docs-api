import { describe, expect, it } from 'vitest';
import { exampleFromMediaType, generateSchemaExample } from '@/features/openapi/example-generator';
import type { ReferenceSpec } from '@/features/openapi/openapi-types';
import { emptySpec } from './fixtures';

describe('example generator', () => {
  it('prioriza exemplos explícitos', () => {
    expect(exampleFromMediaType({ example: { ok: true } }, emptySpec)).toEqual({
      value: { ok: true },
      generated: false,
    });
  });

  it('gera valores contextuais para JIDs e enums', () => {
    const value = generateSchemaExample(
      {
        type: 'object',
        properties: {
          remoteJid: { type: 'string' },
          kind: { type: 'string', enum: ['text', 'media'] },
        },
      },
      emptySpec,
    ) as Record<string, unknown>;

    expect(value.remoteJid).toBe('5511999999999@s.whatsapp.net');
    expect(value.kind).toBe('text');
  });

  it('interrompe referências recursivas sem loop infinito', () => {
    const spec: ReferenceSpec = {
      ...emptySpec,
      schemas: { Node: { type: 'object', properties: { child: { $ref: '#/components/schemas/Node' } } } },
    };
    const value = generateSchemaExample({ $ref: '#/components/schemas/Node' }, spec) as { child: unknown };

    expect(String(value.child)).toContain('Node');
  });
});

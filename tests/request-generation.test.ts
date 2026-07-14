import { describe, expect, it } from 'vitest';
import { generateCodeSample } from '@/features/openapi/code-sample-generator';
import { normalizeOpenApi } from '@/features/openapi/openapi-normalizer';
import { buildRequest, maskSecret } from '@/features/playground/request-builder';
import { minimalDocument } from './fixtures';

describe('request generation', () => {
  it('gera cURL com rota, autenticação e body reais', () => {
    const spec = normalizeOpenApi(minimalDocument);
    const operation = spec.operations.find((entry) => entry.id === 'sendMessage')!;
    const curl = generateCodeSample(operation, spec, 'https://api.codechat.test', 'cURL');

    expect(curl).toContain('https://api.codechat.test/message/principal');
    expect(curl).toContain('Authorization: Bearer <INSTANCE_TOKEN>');
    expect(curl).toContain('5511999999999@s.whatsapp.net');
  });

  it('monta path e query sem perder caracteres especiais', () => {
    const request = buildRequest({
      baseUrl: 'https://api.codechat.test/',
      method: 'GET',
      path: '/instance/{name}',
      pathParameters: { name: 'minha instância' },
      queryParameters: { limit: '20', empty: '' },
      headers: {},
    });

    expect(request.url).toBe('https://api.codechat.test/instance/minha%20inst%C3%A2ncia?limit=20');
    expect(maskSecret('123456789012')).not.toContain('5678');
  });
});

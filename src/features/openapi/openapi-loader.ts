import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { OpenAPIV3_1 } from 'openapi-types';
import YAML from 'yaml';
import { normalizeOpenApi } from './openapi-normalizer';
import type { ReferenceSpec, WebhookCatalog } from './openapi-types';

let referencePromise: Promise<{ spec: ReferenceSpec; webhooks: WebhookCatalog }> | undefined;

async function readOpenApi() {
  const configuredUrl = process.env.NEXT_PUBLIC_OPENAPI_URL || process.env.VITE_OPENAPI_URL || '/openapi.yml';
  if (/^https?:\/\//.test(configuredUrl)) {
    const response = await fetch(configuredUrl, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Não foi possível carregar o OpenAPI (${response.status}).`);
    return response.text();
  }
  const publicPath = configuredUrl.replace(/^\/+/, '') || 'openapi.yml';
  return readFile(path.join(process.cwd(), 'public', publicPath), 'utf8');
}

async function readReference() {
  const [openApiText, webhookText] = await Promise.all([
    readOpenApi(),
    readFile(path.join(process.cwd(), 'public', 'webhook-events.json'), 'utf8'),
  ]);
  const document = YAML.parse(openApiText) as OpenAPIV3_1.Document;
  const webhooks = JSON.parse(webhookText) as WebhookCatalog;
  return { spec: normalizeOpenApi(document), webhooks };
}

export function loadApiReference() {
  referencePromise ??= readReference();
  return referencePromise;
}

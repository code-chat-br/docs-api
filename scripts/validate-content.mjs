import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import YAML from 'yaml';

const root = path.resolve(import.meta.dirname, '..');
const docsDir = path.join(root, 'content', 'docs');
const files = (await readdir(docsDir)).filter((file) => file.endsWith('.mdx'));
const slugs = new Set(files.map((file) => (file === 'index.mdx' ? '/docs' : `/docs/${file.replace(/\.mdx$/, '')}`)));
const allowedRoutes = new Set([
  '/api-reference',
  '/api-reference/webhooks',
  '/webhooks',
  '/webhooks/events',
  '/realtime',
  '/realtime/events',
  '/websocket',
  '/websocket/events',
  '/changelog',
]);
const docAliases = new Set(['/docs/installation', '/docs/plans', '/docs/legacy', '/docs/passkey']);
const failures = [];
const expectedBatchOperations = new Set([
  'POST /message/batches',
  'POST /message/batches/list',
  'GET /message/batches/{batchId}',
  'GET /message/batches/{batchId}/processing',
  'GET /message/batches/{batchId}/items',
  'GET /message/batches/{batchId}/items/{itemId}',
  'GET /message/batches/{batchId}/attempts',
  'POST /message/batches/{batchId}/start',
  'POST /message/batches/{batchId}/pause',
  'POST /message/batches/{batchId}/stop',
]);
const expectedBatchEvents = new Set([
  'message.batch.created',
  'message.batch.scheduled',
  'message.batch.started',
  'message.batch.window-started',
  'message.batch.waiting-window',
  'message.batch.recovered',
  'message.batch.progress',
  'message.batch.pause-requested',
  'message.batch.paused',
  'message.batch.waiting-instance',
  'message.batch.resumed',
  'message.batch.stop-requested',
  'message.batch.stopped',
  'message.batch.interrupted',
  'message.batch.completed',
  'message.batch.completed-with-errors',
  'message.batch.item.failed',
  'message.batch.item.unknown',
]);

for (const file of files) {
  const body = await readFile(path.join(docsDir, file), 'utf8');
  if (/\b(Hello World|Lorem ipsum|TODO:)\b/i.test(body)) failures.push(`${file}: conteúdo provisório encontrado`);
  for (const match of body.matchAll(/\]\((\.{1,2}\/[^)]+)\)/g))
    failures.push(`${file}: link relativo não normalizado ${match[1]}`);
  for (const match of body.matchAll(/\]\((\/[^)\s]+)\)/g)) {
    const href = match[1].split('#')[0].replace(/\/$/, '') || '/';
    if (href.startsWith('/docs') && !slugs.has(href) && !docAliases.has(href))
      failures.push(`${file}: link interno quebrado ${match[1]}`);
    if (!href.startsWith('/docs') && href !== '/' && !allowedRoutes.has(href))
      failures.push(`${file}: rota local desconhecida ${match[1]}`);
  }
}

for (const required of [
  'index.mdx',
  'getting-started.mdx',
  'environment.mdx',
  'calls.mdx',
  'message-batches.mdx',
  'pro-endpoints.mdx',
  'legacy-endpoints.mdx',
  'realtime.mdx',
  'realtime-events.mdx',
  'security.mdx',
  'rate-limits.mdx',
  'versioning.mdx',
  'faq.mdx',
]) {
  try {
    await stat(path.join(docsDir, required));
  } catch {
    failures.push(`documento obrigatório ausente: ${required}`);
  }
}

const spec = YAML.parse(await readFile(path.join(root, 'public', 'openapi.yml'), 'utf8'));
const batchOperations = new Set();
const callOperations = new Set();
for (const [route, pathItem] of Object.entries(spec.paths || {})) {
  for (const method of ['get', 'post', 'put', 'patch', 'delete']) {
    const operation = pathItem?.[method];
    if (!operation) continue;
    const operationKey = `${method.toUpperCase()} ${route}`;
    if (route.startsWith('/message/batches')) {
      batchOperations.add(operationKey);
      if (operation['x-codechat-plan'] !== 'pro')
        failures.push(`operação de lote sem classificação Pro: ${operationKey}`);
      if (operation['x-codechat-plan-enforced'] !== false)
        failures.push(`operação de lote com enforcement Pro divergente: ${operationKey}`);
    }
    if (route.startsWith('/call')) {
      callOperations.add(operationKey);
      if (operation['x-codechat-plan'] !== 'pro')
        failures.push(`operação de chamada sem classificação Pro: ${operationKey}`);
      if (operation['x-codechat-plan-enforced'] !== false)
        failures.push(`operação de chamada com enforcement Pro divergente: ${operationKey}`);
    }
  }
}
for (const operation of expectedBatchOperations) {
  if (!batchOperations.has(operation)) failures.push(`operação de lote ausente no OpenAPI: ${operation}`);
}
for (const operation of batchOperations) {
  if (!expectedBatchOperations.has(operation)) failures.push(`operação de lote não catalogada: ${operation}`);
}
if (!callOperations.size) failures.push('operações de chamada ausentes no OpenAPI');

const batchEvents = new Set(spec.components?.schemas?.MessageBatchWebhookEvent?.enum || []);
for (const event of expectedBatchEvents) {
  if (!batchEvents.has(event)) failures.push(`evento de lote ausente no OpenAPI: ${event}`);
}
for (const event of batchEvents) {
  if (!expectedBatchEvents.has(event)) failures.push(`evento de lote não catalogado: ${event}`);
}
const batchWebhook = spec.webhooks?.messageBatchEvent?.post;
if (!batchWebhook) failures.push('operação webhook messageBatchEvent ausente no OpenAPI');
if (batchWebhook?.['x-codechat-plan'] !== 'pro') failures.push('webhook messageBatchEvent sem classificação Pro');
if (batchWebhook?.['x-codechat-plan-enforced'] !== false)
  failures.push('webhook messageBatchEvent com enforcement Pro divergente');

if (failures.length) throw new Error(`Validação de conteúdo falhou:\n- ${failures.join('\n- ')}`);
console.log(`${files.length} documentos verificados; links locais e conteúdo obrigatório válidos.`);

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import YAML from 'yaml';

const root = path.resolve(import.meta.dirname, '..');
const markdown = await readFile(path.join(root, 'content', 'docs', 'webhooks.mdx'), 'utf8');
const spec = YAML.parse(await readFile(path.join(root, 'public', 'openapi.yml'), 'utf8'));

function codeBlock(section, language) {
  const fence = '```';
  return section.match(new RegExp(`${fence}${language}\\s*\\n([\\s\\S]*?)\\n${fence}`, 'i'))?.[1]?.trim() || '';
}

function parseJson(value) {
  if (!value) return undefined;
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

function subsection(section, title) {
  const marker = `#### ${title}`;
  const start = section.indexOf(marker);
  if (start < 0) return '';
  const remainder = section.slice(start + marker.length).trimStart();
  const nextHeading = remainder.search(/^#### /m);
  return (nextHeading < 0 ? remainder : remainder.slice(0, nextHeading)).trim();
}

const eventHeading = /^### `([^`]+)`\s*$/gm;
const headings = [...markdown.matchAll(eventHeading)].filter((match) => match[1].includes('.'));
const instanceEvents = headings.map((match, index) => {
  const start = (match.index || 0) + match[0].length;
  const end = headings[index + 1]?.index || markdown.indexOf('## Eventos não suportados', start);
  const section = markdown.slice(start, end > start ? end : undefined).trim();
  const description = section.split(/\n\s*\n/).find((paragraph) => paragraph && !paragraph.startsWith('**')) || '';
  const flag = section.match(/\*\*Flag:\*\*\s*`([^`]+)`/)?.[1] || '';
  const request = codeBlock(subsection(section, 'Requisição'), 'http');
  const body = parseJson(codeBlock(subsection(section, 'Body'), 'json'));
  const fields = [...subsection(section, 'Campos de `data`').matchAll(/^- `([^`]+)`: `([^`]+)`, (.+)$/gm)].map(
    (field) => ({
      name: field[1],
      type: field[2],
      description: field[3],
    }),
  );
  const notes = [...subsection(section, 'Observações').matchAll(/^- (.+)$/gm)].map((note) => note[1]);
  return {
    name: match[1],
    kind: 'instance',
    flag,
    description,
    request,
    example: body,
    fields,
    notes,
  };
});

const batchDescriptions = new Map(
  [...markdown.matchAll(/^\| `(message\.batch\.[^`]+)` \| ([^|]+) \|$/gm)].map((match) => [match[1], match[2].trim()]),
);
const batchOperation = spec.webhooks?.messageBatchEvent?.post;
const batchExamples = Object.values(batchOperation?.requestBody?.content?.['application/json']?.examples || {}).map(
  (entry) => entry.value,
);
const batchNames = spec.components?.schemas?.MessageBatchWebhookEvent?.enum || [];
const batchEvents = batchNames.map((name) => ({
  name,
  kind: 'batch',
  flag: '',
  description: batchDescriptions.get(name) || 'Evento global persistente do envio em lote.',
  request: `POST /webhooks/codechat HTTP/1.1\nContent-Type: application/json\nUser-Agent: CodeChat-MessageBatch-Webhook/1.0\nx-webhook-event: ${name}`,
  example: batchExamples.find((example) => example?.event === name) || {
    event: name,
    timestamp: '2026-07-13T15:10:00Z',
    data: { batchId: '01900000-0000-7000-8000-000000000001' },
  },
  fields: [],
  notes: [
    'Entregue somente ao WEBHOOK_GLOBAL_URL pela outbox PostgreSQL.',
    'Respostas 2xx confirmam a entrega; falhas são reagendadas com backoff persistente.',
  ],
}));

const output = {
  generatedFrom: 'content/docs/webhooks.mdx + public/openapi.yml',
  total: instanceEvents.length + batchEvents.length,
  instanceCount: instanceEvents.length,
  batchCount: batchEvents.length,
  events: [...instanceEvents, ...batchEvents],
};

if (instanceEvents.length !== 27 || batchEvents.length !== 14) {
  throw new Error(
    `Catálogo de webhooks divergente: ${instanceEvents.length} por instância e ${batchEvents.length} de lote.`,
  );
}

await writeFile(path.join(root, 'public', 'webhook-events.json'), `${JSON.stringify(output, null, 2)}\n`, 'utf8');
console.log(`Catálogo de webhooks gerado com ${output.total} eventos.`);

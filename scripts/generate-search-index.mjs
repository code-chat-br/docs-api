import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import YAML from 'yaml';

const root = path.resolve(import.meta.dirname, '..');
const docsDir = path.join(root, 'content', 'docs');
const publicDir = path.join(root, 'public');
const index = [];

function clean(markdown) {
  return markdown
    .replace(/^---[\s\S]*?---\s*/m, '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_`>#|{}[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function frontmatter(markdown, key) {
  const match = markdown.match(new RegExp(`^---[\\s\\S]*?^${key}:\\s*["']?([^\\n"']+)["']?`, 'm'));
  return match?.[1]?.trim();
}

function add(entry) {
  index.push({
    ...entry,
    search: `${entry.title} ${entry.description || ''} ${entry.method || ''} ${entry.path || ''}`.toLowerCase(),
  });
}

for (const file of (await readdir(docsDir)).filter((name) => name.endsWith('.mdx'))) {
  const markdown = await readFile(path.join(docsDir, file), 'utf8');
  const slug = file === 'index.mdx' ? '' : `/${file.replace(/\.mdx$/, '')}`;
  const title = frontmatter(markdown, 'title') || file;
  const description = frontmatter(markdown, 'description') || clean(markdown).slice(0, 180);
  add({
    id: `doc:${file}`,
    type: 'Guia',
    title,
    description: `${description} ${clean(markdown).slice(0, 700)}`,
    href: `/docs${slug}`,
  });

  for (const heading of markdown.matchAll(/^#{2,3}\s+(.+)$/gm)) {
    const label = heading[1].replace(/[`*_]/g, '').trim();
    const anchor = label
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
    add({
      id: `heading:${file}:${anchor}`,
      type: 'Seção',
      title: label,
      description: title,
      href: `/docs${slug}#${anchor}`,
    });
  }
}

const spec = YAML.parse(await readFile(path.join(publicDir, 'openapi.yml'), 'utf8'));
const operations = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'];
for (const [route, pathItem] of Object.entries(spec.paths || {})) {
  for (const method of operations) {
    const operation = pathItem?.[method];
    if (!operation) continue;
    const state = operation.deprecated ? 'LEGADO' : operation['x-codechat-plan'] === 'pro' ? 'PRO' : 'ATUAL';
    const parameterNames = [...(pathItem.parameters || []), ...(operation.parameters || [])]
      .map((parameter) => parameter.name || parameter.$ref?.split('/').at(-1))
      .filter(Boolean)
      .join(' ');
    add({
      id: `operation:${method}:${route}`,
      type: state,
      title: operation.summary || operation.operationId || `${method.toUpperCase()} ${route}`,
      description:
        `${operation.description || ''} ${(operation.tags || []).join(' ')} ${operation.operationId || ''} ${parameterNames}`.trim(),
      href: `/api-reference/${encodeURIComponent(operation.operationId || `${method}-${route}`)}`,
      method: method.toUpperCase(),
      path: route,
    });
  }
}

for (const [name, schema] of Object.entries(spec.components?.schemas || {})) {
  add({
    id: `schema:${name}`,
    type: 'Schema',
    title: name,
    description: `${schema.description || 'Schema OpenAPI'} ${Object.keys(schema.properties || {}).join(' ')}`,
    href: '/api-reference',
  });
}

for (const [name, pathItem] of Object.entries(spec.webhooks || {})) {
  for (const method of operations) {
    const operation = pathItem?.[method];
    if (!operation) continue;
    add({
      id: `webhook:${method}:${name}`,
      type: operation['x-codechat-plan'] === 'pro' ? 'PRO' : 'Webhook',
      title: operation.summary || operation.operationId || name,
      description: `${operation.description || ''} ${(operation.tags || []).join(' ')}`.trim(),
      href: '/api-reference',
      method: method.toUpperCase(),
      path: name,
    });
  }
}

const webhookCatalog = JSON.parse(await readFile(path.join(publicDir, 'webhook-events.json'), 'utf8'));
for (const event of webhookCatalog.events || []) {
  add({
    id: `webhook-event:${event.name}`,
    type: event.kind === 'batch' ? 'PRO' : 'Evento',
    title: event.name,
    description: `${event.description || ''} ${event.flag || ''} ${(event.fields || []).map((field) => field.name).join(' ')}`,
    href: `/api-reference/webhooks/${encodeURIComponent(event.name)}`,
  });
}

await mkdir(publicDir, { recursive: true });
await writeFile(path.join(publicDir, 'search-index.json'), `${JSON.stringify(index, null, 2)}\n`, 'utf8');
console.log(`Índice global gerado com ${index.length} entradas.`);

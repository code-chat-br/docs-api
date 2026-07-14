import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import YAML from 'yaml';

const projectRoot = path.resolve(import.meta.dirname, '..');
const sourceDocs = path.resolve(projectRoot, process.env.CODECHAT_SOURCE_DOCS || './source-docs');
const openApiPath = path.join(sourceDocs, 'openapi.yml');
const publishedOpenApiPath = path.join(projectRoot, 'public', 'openapi.yml');
const reportPath = path.join(projectRoot, 'docs', 'api-reference-audit.md');
const methods = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head', 'trace'];

function extractOperations(container, kind) {
  const operations = [];
  for (const [routePath, pathItem] of Object.entries(container || {})) {
    for (const method of methods) {
      const operation = pathItem?.[method];
      if (!operation) continue;
      operations.push({
        key: kind === 'HTTP' ? `${method.toUpperCase()} ${routePath}` : `${method.toUpperCase()} webhook:${routePath}`,
        kind,
        method: method.toUpperCase(),
        path: routePath,
        pathItem,
        operationId: operation.operationId || '',
        summary: operation.summary || '',
        description: operation.description || '',
        tags: operation.tags || [],
        responses: operation.responses || {},
        parameters: operation.parameters || [],
        deprecated: operation.deprecated === true,
        plan: operation['x-codechat-plan'] || '',
        hasExample: JSON.stringify(operation).includes('"example"'),
      });
    }
  }
  return operations;
}

function resolveParameter(spec, parameter) {
  const prefix = '#/components/parameters/';
  if (!parameter?.$ref?.startsWith(prefix)) return parameter;
  return spec.components?.parameters?.[parameter.$ref.slice(prefix.length)];
}

function validatePathParameters(spec, operation) {
  const placeholders = [...operation.path.matchAll(/\{([^}]+)\}/g)].map((match) => match[1]);
  const parameters = [...(operation.pathItem.parameters || []), ...operation.parameters]
    .map((parameter) => resolveParameter(spec, parameter))
    .filter((parameter) => parameter?.in === 'path');
  const names = parameters.map((parameter) => parameter.name);
  const issues = [];

  for (const placeholder of placeholders) {
    if (!names.includes(placeholder)) issues.push(`parâmetro \`${placeholder}\` não declarado`);
  }
  for (const parameter of parameters) {
    if (!placeholders.includes(parameter.name)) issues.push(`parâmetro \`${parameter.name}\` não existe no caminho`);
    if (parameter.required !== true) issues.push(`parâmetro \`${parameter.name}\` não está marcado como obrigatório`);
  }
  return issues;
}

function bullets(values, emptyText = '- Nenhum.') {
  return values.length ? values.map((value) => `- ${value}`).join('\n') : emptyText;
}

function relativePath(file) {
  return path.relative(projectRoot, file).replaceAll('\\', '/');
}

const [sourceText, publishedText] = await Promise.all([
  readFile(openApiPath, 'utf8'),
  readFile(publishedOpenApiPath, 'utf8'),
]);

if (sourceText !== publishedText) {
  throw new Error(
    `O OpenAPI publicado em ${relativePath(publishedOpenApiPath)} está diferente de ${relativePath(openApiPath)}. Execute pnpm sync:docs.`,
  );
}

const spec = YAML.parse(sourceText);
const documented = extractOperations(spec.paths, 'HTTP');
const webhookOperations = extractOperations(spec.webhooks, 'Webhook');
const allOperations = [...documented, ...webhookOperations];
const operationIds = new Map();
const duplicateOperationIds = [];

for (const operation of allOperations) {
  if (!operation.operationId) continue;
  const previous = operationIds.get(operation.operationId);
  if (previous) duplicateOperationIds.push(`\`${operation.operationId}\` em \`${previous}\` e \`${operation.key}\``);
  else operationIds.set(operation.operationId, operation.key);
}

const operationsWithoutId = allOperations.filter((operation) => !operation.operationId);
const operationsWithoutText = allOperations.filter((operation) => !operation.summary && !operation.description);
const operationsWithoutTags = allOperations.filter((operation) => operation.tags.length === 0);
const operationsWithoutResponses = allOperations.filter((operation) => Object.keys(operation.responses).length === 0);
const pathParameterIssues = documented.flatMap((operation) =>
  validatePathParameters(spec, operation).map((issue) => `\`${operation.key}\`: ${issue}`),
);
const schemasWithoutExamples = Object.entries(spec.components?.schemas || {})
  .filter(([, schema]) => !JSON.stringify(schema).includes('"example"'))
  .map(([name]) => name);
const operationsWithoutExamples = allOperations.filter((operation) => !operation.hasExample);
const deprecated = documented.filter((operation) => operation.deprecated);
const pro = documented.filter((operation) => operation.plan === 'pro');
const current = documented.filter(
  (operation) => !operation.tags.some((tag) => tag.startsWith('Legacy')) && operation.plan !== 'pro',
);
const instanceWebhookEvents = Object.keys(spec.components?.schemas?.WebhookEvents?.properties || {});
const messageBatchWebhookEvents = spec.components?.schemas?.MessageBatchWebhookEvent?.enum || [];

const specRows = documented
  .map(
    (operation) =>
      `| \`${operation.method}\` | \`${operation.path}\` | \`${operation.operationId}\` | ${operation.deprecated ? 'Legado' : operation.plan === 'pro' ? 'Pro' : 'Atual'} |`,
  )
  .join('\n');

const failures = [
  ...operationsWithoutId.map((operation) => `\`${operation.key}\` sem operationId`),
  ...duplicateOperationIds.map((issue) => `operationId duplicado: ${issue}`),
  ...operationsWithoutText.map((operation) => `\`${operation.key}\` sem summary ou description`),
  ...operationsWithoutTags.map((operation) => `\`${operation.key}\` sem tag`),
  ...operationsWithoutResponses.map((operation) => `\`${operation.key}\` sem resposta`),
  ...pathParameterIssues,
];

const report = `# Auditoria da referência de API

Gerado exclusivamente a partir da especificação versionada em \`${relativePath(openApiPath)}\`. A auditoria e o build não leem arquivos de outros repositórios.

## Resumo

| Item | Quantidade |
| --- | ---: |
| Operações HTTP no OpenAPI | ${documented.length} |
| Operações atuais, sem classificação Pro | ${current.length} |
| Operações Pro | ${pro.length} |
| Operações marcadas como deprecated | ${deprecated.length} |
| Operações de webhook no OpenAPI | ${webhookOperations.length} |
| Schemas em components.schemas | ${Object.keys(spec.components?.schemas || {}).length} |
| Eventos de webhook por instância | ${instanceWebhookEvents.length} |
| Eventos globais de Message Batch | ${messageBatchWebhookEvents.length} |

Resultado: ${failures.length === 0 ? '**a especificação local está estruturalmente consistente e sincronizada com a cópia publicada.**' : '**há inconsistências estruturais pendentes na especificação local.**'}

## Validações executadas

- \`${relativePath(openApiPath)}\` existe dentro deste repositório e é a fonte canônica.
- \`${relativePath(publishedOpenApiPath)}\` é uma cópia idêntica à fonte canônica.
- Todos os endpoints e webhooks possuem \`operationId\` único, texto descritivo, tag e resposta.
- Todos os parâmetros de caminho estão declarados e marcados como obrigatórios.
- O relatório, o catálogo de webhooks, o índice de busca e a referência são derivados apenas dos arquivos versionados neste projeto.

## Endpoints encontrados na especificação

| Método | Caminho | operationId | Estado |
| --- | --- | --- | --- |
${specRows}

## Endpoints possivelmente obsoletos

Os ${deprecated.length} endpoints abaixo continuam documentados, mas estão marcados como \`deprecated\` por possuírem substitutos atuais:

${bullets(deprecated.map((operation) => `\`${operation.key}\` (\`${operation.operationId}\`)`))}

## Schemas sem exemplos explícitos

${schemasWithoutExamples.length} schemas não possuem \`example\` explícito. A interface gera exemplos a partir de tipos, enums, formatos, defaults e contexto da CodeChat:

${bullets(schemasWithoutExamples.map((name) => `\`${name}\``))}

## Cobertura editorial

- Operações sem \`summary\` e sem \`description\`: ${operationsWithoutText.length}.
- Operações sem tag: ${operationsWithoutTags.length}.
- Operações sem resposta: ${operationsWithoutResponses.length}.
- Operações sem exemplo explícito no nível da operação: ${operationsWithoutExamples.length}. A referência prioriza exemplos de mídia/schema e usa o gerador como fallback.
- Parâmetros de caminho inconsistentes: ${pathParameterIssues.length}.
- \`operationId\` ausente ou duplicado: ${operationsWithoutId.length + duplicateOperationIds.length}.

## Escopo da auditoria

Esta verificação garante a consistência da documentação autocontida. A comparação com handlers, middlewares e rotas do runtime deve ser feita no momento em que os arquivos de \`source-docs\` forem atualizados; o deploy deste portal não depende do checkout do código Go.

## Inconsistências encontradas

${bullets(failures)}
`;

await mkdir(path.dirname(reportPath), { recursive: true });
await writeFile(reportPath, report, 'utf8');

if (failures.length) {
  throw new Error(`Auditoria do OpenAPI falhou:\n${failures.join('\n')}`);
}

console.log(
  `Auditoria concluída: ${documented.length} operações HTTP e ${webhookOperations.length} webhook validados a partir de ${relativePath(openApiPath)}.`,
);

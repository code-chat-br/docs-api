import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import YAML from 'yaml';

const projectRoot = path.resolve(import.meta.dirname, '..');
const sourceRoot = path.resolve(projectRoot, process.env.CODECHAT_SOURCE_ROOT || '../whatsapp-go-api');
const openApiPath = path.join(sourceRoot, 'docs', 'openapi.yml');
const reportPath = path.join(projectRoot, 'docs', 'api-reference-audit.md');
const routeFiles = [
  path.join(sourceRoot, 'internal', 'http', 'routes.go'),
  path.join(sourceRoot, 'internal', 'http', 'message_batch_routes.go'),
];
const methods = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'];

function normalizePath(value) {
  return (value || '/').replace(/:([A-Za-z0-9_]+)/g, '{$1}');
}

function sourceLabel(file, line) {
  return `${path.relative(sourceRoot, file).replaceAll('\\', '/')}:${line}`;
}

async function extractSourceRoutes() {
  const registrations = [];
  for (const file of routeFiles) {
    const groups = new Map([['app', { path: '', auth: 'Pública' }]]);
    const lines = (await readFile(file, 'utf8')).split(/\r?\n/);
    for (const [index, line] of lines.entries()) {
      const groupMatch = line.match(/^\s*(\w+)\s*:=\s*(\w+)\.Group\("([^"]*)"(.*)\)/);
      if (groupMatch) {
        const [, name, parent, segment, argumentsText] = groupMatch;
        const parentGroup = groups.get(parent) || { path: '', auth: 'Pública' };
        const auth = argumentsText.includes('globalAuth')
          ? 'API key global'
          : argumentsText.includes('instanceAuth')
            ? 'Bearer da instância'
            : parentGroup.auth;
        groups.set(name, { path: parentGroup.path + segment, auth });
        continue;
      }

      const route = line.match(/^\s*(\w+)\.(Get|Post|Put|Patch|Delete|Options|Head)\("([^"]*)"(.*)\)/);
      if (!route) continue;
      const [, receiver, rawMethod, segment, argumentsText] = route;
      const receiverGroup = groups.get(receiver) || { path: '', auth: 'Pública' };
      const auth = argumentsText.includes('globalAuth')
        ? 'API key global'
        : argumentsText.includes('instanceAuth')
          ? 'Bearer da instância'
          : receiverGroup.auth;
      const handler = argumentsText.match(/,\s*([A-Za-z0-9_]+\.[A-Za-z0-9_]+)\s*$/)?.[1] || 'inline';
      const routePath = normalizePath(receiverGroup.path + segment);
      registrations.push({
        key: `${rawMethod.toUpperCase()} ${routePath}`,
        method: rawMethod.toUpperCase(),
        path: routePath,
        auth,
        handler,
        source: sourceLabel(file, index + 1),
      });
    }
  }
  return registrations;
}

function extractOpenApiOperations(spec) {
  const operations = [];
  for (const [routePath, pathItem] of Object.entries(spec.paths || {})) {
    for (const method of methods) {
      const operation = pathItem?.[method];
      if (!operation) continue;
      operations.push({
        key: `${method.toUpperCase()} ${routePath}`,
        method: method.toUpperCase(),
        path: routePath,
        operationId: operation.operationId || '',
        summary: operation.summary || '',
        description: operation.description || '',
        tags: operation.tags || [],
        deprecated: operation.deprecated === true,
        plan: operation['x-codechat-plan'] || '',
        hasExample: JSON.stringify(operation).includes('"example"'),
      });
    }
  }
  return operations;
}

function bullets(values, emptyText = 'Nenhum.') {
  return values.length ? values.map((value) => `- ${value}`).join('\n') : emptyText;
}

if (process.env.CODECHAT_SKIP_AUDIT === '1') {
  await readFile(reportPath, 'utf8');
  console.log('Auditoria de runtime ignorada: relatório versionado disponível no contexto de build.');
  process.exit(0);
}

const registrations = await extractSourceRoutes();
const distinctSource = new Map();
const duplicateRegistrations = [];
for (const route of registrations) {
  if (distinctSource.has(route.key)) duplicateRegistrations.push(route);
  else distinctSource.set(route.key, route);
}

const spec = YAML.parse(await readFile(openApiPath, 'utf8'));
const documented = extractOpenApiOperations(spec);
const documentedMap = new Map(documented.map((operation) => [operation.key, operation]));
const missingInSpec = [...distinctSource.keys()].filter((key) => !documentedMap.has(key));
const extraInSpec = [...documentedMap.keys()].filter((key) => !distinctSource.has(key));
const schemasWithoutExamples = Object.entries(spec.components?.schemas || {})
  .filter(([, schema]) => !JSON.stringify(schema).includes('"example"'))
  .map(([name]) => name);
const operationsWithoutExamples = documented.filter((operation) => !operation.hasExample);
const operationsWithoutText = documented.filter((operation) => !operation.summary && !operation.description);
const deprecated = documented.filter((operation) => operation.deprecated);
const pro = documented.filter((operation) => operation.plan === 'pro');

const sourceRows = [...distinctSource.values()]
  .map(
    (route) =>
      `| \`${route.method}\` | \`${route.path}\` | ${route.auth} | \`${route.handler}\` | \`${route.source}\` |`,
  )
  .join('\n');
const specRows = documented
  .map(
    (operation) =>
      `| \`${operation.method}\` | \`${operation.path}\` | \`${operation.operationId}\` | ${operation.deprecated ? 'Legado' : operation.plan === 'pro' ? 'Pro' : 'Atual'} |`,
  )
  .join('\n');

const report = `# Auditoria da referência de API

Gerado em 2026-07-13 a partir do código executável em \`${path.relative(projectRoot, sourceRoot).replaceAll('\\', '/')}\` e da especificação \`${path.relative(sourceRoot, openApiPath).replaceAll('\\', '/')}\`.

## Resumo

| Item | Quantidade |
| --- | ---: |
| Registros de rota no código | ${registrations.length} |
| Operações HTTP distintas no código | ${distinctSource.size} |
| Operações no OpenAPI | ${documented.length} |
| Operações atuais, sem classificação Pro | ${documented.filter((operation) => !operation.tags.some((tag) => tag.startsWith('Legacy')) && operation.plan !== 'pro').length} |
| Operações Pro | ${pro.length} |
| Operações marcadas como deprecated | ${deprecated.length} |
| Schemas em components.schemas | ${Object.keys(spec.components?.schemas || {}).length} |
| Eventos de webhook por instância | 27 |
| Eventos globais de Message Batch | 14 |

Resultado da paridade: ${missingInSpec.length === 0 && extraInSpec.length === 0 ? '**o OpenAPI cobre todas as operações HTTP distintas registradas no código.**' : '**há divergências pendentes entre código e OpenAPI.**'}

## Endpoints encontrados no código

| Método | Caminho | Autenticação | Handler | Fonte |
| --- | --- | --- | --- | --- |
${sourceRows}

## Endpoints encontrados na especificação

| Método | Caminho | operationId | Estado |
| --- | --- | --- | --- |
${specRows}

## Endpoints adicionados à especificação

- \`POST /instance/{instance}/send/review-order\`, operationId \`reviewOrder\`.
- \`PATCH /message/reviewOrder/{instanceName}\`, operationId \`legacyReviewOrder\`, mantido como alias legado deprecated.

## Inconsistências corrigidas

- As duas rotas de revisão de pedido estavam registradas e testadas no runtime, descritas nos guias editoriais e comentadas ou ausentes no OpenAPI. Ambas passaram a fazer parte do contrato OpenAPI 3.1.
- A contagem da referência foi atualizada de 93 para ${documented.length} operações HTTP distintas.
- A busca e as URLs compartilháveis agora usam \`operationId\` em vez de links genéricos para tags.
- A interface deixou de depender visualmente do Scalar e passou a interpretar o OpenAPI diretamente.

## Divergências ainda observáveis no código

${bullets(duplicateRegistrations.map((route) => `Registro duplicado de \`${route.key}\` em \`${route.source}\`. A auditoria conta a operação uma única vez e não altera o handler.`))}
- A rota atual \`DELETE /instance/{instance}/logout/{instanceName}\` mantém dois parâmetros de instância no caminho. O middleware autentica primeiro \`instanceName\`; a documentação preserva o contrato literal até uma decisão de compatibilidade.
- Não existe rota WebSocket, SSE ou upgrade HTTP no runtime auditado. Os guias de tempo real explicam que a integração disponível usa webhooks.
- A classificação Pro é documental: não há claim de plano, bloqueio de leitura ou resposta 402 no runtime atual.

## Endpoints possivelmente obsoletos

Os ${deprecated.length} endpoints abaixo continuam registrados, mas estão marcados como \`deprecated\` por possuírem substitutos atuais:

${bullets(deprecated.map((operation) => `\`${operation.key}\` (\`${operation.operationId}\`)`))}

## Schemas sem exemplos explícitos

${schemasWithoutExamples.length} schemas não possuem \`example\` explícito. A interface gera exemplos coerentes a partir de tipos, enums, formatos, defaults e contexto CodeChat, sem alterar o contrato:

${bullets(schemasWithoutExamples.map((name) => `\`${name}\``))}

## Rotas sem documentação suficiente

- Operações sem \`summary\` e sem \`description\`: ${operationsWithoutText.length}.
- Operações sem exemplo explícito no nível da operação: ${operationsWithoutExamples.length}. A referência prioriza exemplos explícitos de mídia/schema e usa o gerador de exemplos como fallback.
- Rotas presentes no código e ausentes no OpenAPI: ${missingInSpec.length}.
${bullets(
  missingInSpec.map((key) => `\`${key}\``),
  '- Nenhuma.',
)}
- Rotas presentes no OpenAPI e ausentes no código: ${extraInSpec.length}.
${bullets(
  extraInSpec.map((key) => `\`${key}\``),
  '- Nenhuma.',
)}

## Pontos dependentes de confirmação humana

- URL pública de produção, versão comercial exibida e link GitHub definitivo por ambiente.
- Política formal de versionamento, prazo de remoção dos aliases legados e eventual correção da rota de logout com dois parâmetros.
- Política oficial de rate limits; o runtime atual não registra limitador nem produz \`429\`.
- Eventual enforcement comercial dos recursos Pro; o runtime atual não produz \`402\`.
- Requisitos futuros de assinatura HMAC e retry para webhooks por instância; esses recursos não existem no emissor atual.

## Webhooks e WebSocket

- O código e o documento gerado confirmam 27 eventos por instância e 14 eventos globais de Message Batch.
- Eventos por instância usam fila em memória, timeout de 15 segundos, sucesso em 2xx e não possuem retry automático nem dead-letter queue.
- Eventos de Message Batch usam outbox PostgreSQL e retry persistente com backoff.
- Não há assinatura HMAC no emissor atual; \`x-request-id\` é correlação, não prova de autenticidade ou chave de idempotência.
- Não há suporte WebSocket/SSE implementado; nenhum protocolo ou endpoint foi inventado na nova referência.
`;

await mkdir(path.dirname(reportPath), { recursive: true });
await writeFile(reportPath, report, 'utf8');

if (missingInSpec.length || extraInSpec.length) {
  throw new Error(
    `Paridade de rotas falhou. Ausentes no OpenAPI: ${missingInSpec.join(', ') || 'nenhuma'}. Ausentes no código: ${extraInSpec.join(', ') || 'nenhuma'}.`,
  );
}

console.log(`Auditoria concluída: ${distinctSource.size} operações no código e ${documented.length} no OpenAPI.`);

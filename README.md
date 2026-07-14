# CodeChat API Docs

Portal oficial de documentação e referência técnica da CodeChat. Guias editoriais e referência OpenAPI compartilham o mesmo `DocumentationShell`, mantendo uma única topbar, sidebar, base tipográfica, painel contextual, tema e comportamento responsivo. O conteúdo editorial e o OpenAPI são sincronizados da pasta versionada `source-docs` deste repositório.

## O que está incluído

- Referência dinâmica de 95 operações HTTP, agrupadas pelas tags do OpenAPI.
- URLs compartilháveis baseadas em `operationId`.
- Layout técnico de três colunas centralizado em até 1680 px, tema escuro/claro, sidebar recolhível e navegação mobile.
- Autenticação, parâmetros, request body, schemas, respostas por status e exemplos JSON.
- Exemplos gerados em cURL, JavaScript, Node.js/Axios, Go, Python e PHP.
- Acesso direto à coleção oficial `Go v1.0.0` no Postman.
- Playground no navegador com cancelamento, timeout, resultado formatado e credenciais mascaradas.
- Busca global por endpoint, rota, método, parâmetro, schema e evento (`Ctrl/Cmd + K`).
- Catálogo de 41 webhooks reais: 27 por instância e 14 globais de Message Batch.
- Guias editoriais existentes, changelog, migração e documentação do WebSocket de eventos.

O relatório de consistência da referência fica em [`docs/api-reference-audit.md`](docs/api-reference-audit.md).

## Capturas de tela

As capturas finais de desktop e mobile podem ser adicionadas em `public/screenshots/` após a publicação no ambiente definitivo.

## Tecnologias e decisões

O projeto já existia como portal Next.js; por isso ele foi evoluído em vez de criar um segundo frontend ou remover a documentação atual. A base usa Next.js 16, React 19, TypeScript strict, Tailwind CSS 4, Fumadocs/MDX, Prism, Lucide, Zod, `openapi-types`, YAML, Vitest, Testing Library e Playwright.

O OpenAPI é a fonte única da referência HTTP. Componentes React não contêm listas manuais de endpoints. Regras editoriais como ordem de tags, aliases e flags experimentais ficam centralizadas em `src/config/documentation.ts`. O documento é lido e normalizado uma única vez por processo e as páginas são divididas por rota.

## Estrutura principal

```text
src/
  app/api-reference/       rotas da referência e estilos responsivos
  components/api/          endpoint, schemas, respostas e playground
  components/layout/       DocumentationShell, topbar, sidebar e painel contextual
  components/common/       código, cópia e estados reutilizáveis
  features/openapi/        loader, normalização, exemplos e code samples
  features/playground/     montagem segura de requisições
  features/search/         ranking do índice global
  config/                  branding e ordem documental
content/docs/              conteúdo MDX sincronizado e guias locais
source-docs/               fonte canônica versionada dos guias e do OpenAPI
public/openapi.yml         cópia sincronizada servida pelo portal
public/webhook-events.json catálogo gerado de eventos
scripts/                   sync, auditoria, validação e índices
tests/                     testes unitários, componentes e E2E
```

## Pré-requisitos

- Node.js 22 ou superior;
- pnpm 11.12.

Todos os arquivos necessários para desenvolvimento, validação e build estão versionados neste repositório.

## Desenvolvimento

```bash
pnpm install
cp .env.example .env
pnpm dev
```

O portal abre em `http://localhost:3000`. Antes do desenvolvimento, a documentação fonte, o catálogo de webhooks e o índice de busca são atualizados automaticamente.

Comandos úteis:

```bash
pnpm sync:docs
pnpm audit:api
pnpm validate:openapi
pnpm generate:search-index
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
pnpm start
```

`pnpm check` executa lint, typecheck, testes unitários e build.

## Variáveis de ambiente

| Variável                       | Finalidade                              | Padrão                         |
| ------------------------------ | --------------------------------------- | ------------------------------ |
| `NEXT_PUBLIC_SITE_URL`         | URL pública do portal                   | `http://localhost:3000`        |
| `NEXT_PUBLIC_CODECHAT_API_URL` | Base URL usada em exemplos e playground | `http://localhost:8084`        |
| `NEXT_PUBLIC_DOCS_TITLE`       | Título do portal                        | `CodeChat API`                 |
| `NEXT_PUBLIC_DOCS_VERSION`     | Versão exibida                          | `1.0.0`                        |
| `NEXT_PUBLIC_GITHUB_URL`       | Repositório público da API              | `code-chat-br/whatsapp-api-go` |
| `NEXT_PUBLIC_DOCS_GITHUB_URL`  | Repositório público da documentação     | `code-chat-br/docs-api`        |
| `NEXT_PUBLIC_OPENAPI_URL`      | Caminho ou URL absoluta do OpenAPI      | `/openapi.yml`                 |
| `NEXT_PUBLIC_POSTMAN_URL`      | Coleção oficial da CodeChat no Postman  | coleção `Go v1.0.0`            |
| `CODECHAT_SOURCE_DOCS`         | Fonte local dos guias e do OpenAPI      | `./source-docs`                |

O `docker-compose.yml` também aceita os aliases solicitados `VITE_API_BASE_URL`, `VITE_DOCS_TITLE`, `VITE_DOCS_VERSION`, `VITE_GITHUB_URL`, `VITE_OPENAPI_URL` e `VITE_API_POSTMAN`, mapeando-os para as variáveis públicas do Next.js. Essas variáveis são aplicadas em build time; é necessário reconstruir a imagem ao alterá-las.

## OpenAPI e manutenção

A fonte canônica é `source-docs/openapi.yml`. Não edite apenas a cópia em `public/`.

Para documentar um endpoint:

1. confirme a rota, middleware, DTO, validações e respostas no código da API antes de trazer a alteração para este repositório;
2. atualize o path existente em `source-docs/openapi.yml`, incluindo `operationId`, tag, security e exemplos;
3. execute `pnpm sync:docs && pnpm audit:api && pnpm validate:openapi`;
4. use `src/config/documentation.ts` somente para ordem, aliases ou metadados editoriais — nunca para duplicar a operação.

Para adicionar uma categoria, declare a tag no OpenAPI e inclua seu nome em `tagOrder`. Exemplos explícitos em `content`/`schema` têm prioridade; na ausência deles, o gerador respeita tipo, enum, formato, default e referências recursivas.

## Playground e segurança

As requisições são executadas diretamente pelo navegador contra a Base URL, sem serviço intermediário. A API precisa liberar a origem do portal no CORS. Tokens não são enviados a terceiros nem registrados no console. A sessão usa `sessionStorage` por padrão; `localStorage` só é ativado por escolha explícita.

Não existe proxy remoto inseguro. Um proxy local pode ser configurado por quem desenvolve, mas não faz parte da configuração de produção.

## Docker e produção

O Dockerfile usa múltiplos estágios e produz o servidor standalone do Next.js. O Compose adiciona Nginx com gzip, cache longo apenas para assets versionados, ausência de cache agressivo no OpenAPI, SPA/reverse-proxy fallback e healthchecks.

O build da imagem sincroniza os arquivos de `source-docs`, valida o OpenAPI local e gera novamente o relatório, o catálogo de webhooks e o índice de busca. Nenhum checkout adicional é necessário.

```bash
docker compose up --build -d
curl http://localhost:3000/healthz
```

Para outra porta, use `DOCS_PORT=8080 docker compose up --build -d`. Sem Compose:

```bash
docker build -t codechat-api-docs .
docker run --rm -p 3000:3000 codechat-api-docs
```

## Testes e CI

- Vitest valida normalização, `$ref`, schemas recursivos, exemplos, busca, cURL, request builder e tabs de resposta.
- Playwright valida navegação da sidebar, busca por teclado, playground e ausência de overflow no mobile.
- A auditoria falha quando a fonte local e a cópia publicada divergem ou quando o OpenAPI possui inconsistências estruturais.
- O CI usa apenas este checkout e executa sincronização, lint, typecheck, testes, validação OpenAPI e build.

## Publicação

Publique a imagem gerada pelo Dockerfile ou o servidor standalone atrás do Nginx fornecido. Preserve `public/openapi.yml` e `public/webhook-events.json` no artefato. Depois do deploy, confirme `/healthz`, uma URL de endpoint como `/api-reference/listInstances`, busca, playground/CORS e os viewports desktop e mobile.

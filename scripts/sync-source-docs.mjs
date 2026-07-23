import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const projectRoot = path.resolve(import.meta.dirname, '..');
const sourceDocs = path.resolve(projectRoot, process.env.CODECHAT_SOURCE_DOCS || './source-docs');
const contentDir = path.join(projectRoot, 'content', 'docs');
const publicDir = path.join(projectRoot, 'public');

const documents = {
  'README.md': ['index.mdx', 'Documentação da CodeChat API', 'Contrato, guias e referência técnica da API.'],
  'authentication.md': [
    'authentication.mdx',
    'Autenticação',
    'Token global, JWT da instância e regras de autorização.',
  ],
  'instances.md': ['instances.mdx', 'Instâncias', 'Criação, consulta, token e remoção de instâncias.'],
  'connections.md': ['connections.mdx', 'Conexões', 'QR Code, código de pareamento, Passkey, estado e logout.'],
  'messages.md': ['messages.mdx', 'Mensagens', 'Envio de texto, mídia, áudio, contatos e interações.'],
  'message-batches.md': [
    'message-batches.mdx',
    'Envio em lote',
    'Fila persistente, múltiplas instâncias, controle assíncrono, recovery e progresso.',
  ],
  'chats.md': ['chats.mdx', 'Chats', 'Operações de conversa, leitura, arquivo e edição.'],
  'calls.md': [
    'calls.mdx',
    'Chamadas WhatsApp',
    'Recurso Pro experimental para chamadas individuais com áudio, vídeo, reações, gravações e eventos.',
  ],
  'media.md': ['media.mdx', 'Mídia', 'Download e upload antecipado de arquivos.'],
  'groups.md': ['groups.mdx', 'Grupos', 'Criação, participantes, convites, foto e saída.'],
  'webhooks.md': ['webhooks.mdx', 'Webhooks', 'Configuração, entrega e os 45 eventos implementados.'],
  'websocket.md': [
    'websocket.mdx',
    'WebSocket de eventos',
    'Assinatura em tempo real de eventos por instância e eventos globais de Message Batch.',
  ],
  'pro-endpoints.md': [
    'pro-endpoints.mdx',
    'Recursos Pro',
    'Classificação comercial dos recursos Pro e comportamento real do runtime.',
  ],
  'legacy-endpoints.md': [
    'legacy-endpoints.mdx',
    'Endpoints legados',
    'Aliases compatíveis, substitutos atuais e estado de depreciação.',
  ],
  'errors.md': ['errors.mdx', 'Erros', 'Envelope de erro, códigos HTTP e inconsistências conhecidas.'],
  'environment.md': ['environment.mdx', 'Instalação e ambiente', 'Variáveis de ambiente e configuração do servidor.'],
  'passkey-pairing.md': [
    'passkey-pairing.mdx',
    'Pareamento por Passkey',
    'Fluxo experimental de pareamento com Passkey.',
  ],
  'migrations.md': ['migrations.mdx', 'Migrações', 'Execução e manutenção das migrações de banco de dados.'],
};

function quote(value) {
  return JSON.stringify(value);
}

function rewriteLinks(markdown) {
  return markdown
    .replace(/\]\(\.\/openapi\.yml\)/g, '](/api-reference)')
    .replace(/\]\((?:\.\/)?([^/)#]+\.md)(#[^)]+)?\)/g, (match, file, hash = '') => {
      const mapped = documents[file];
      if (!mapped) return match;
      const slug = mapped[0] === 'index.mdx' ? '' : `/${mapped[0].replace(/\.mdx$/, '')}`;
      return `](/docs${slug}${hash})`;
    });
}

async function exists(file) {
  try {
    await stat(file);
    return true;
  } catch {
    return false;
  }
}

if (process.env.CODECHAT_SKIP_SYNC === '1') {
  const ready = await Promise.all([
    exists(path.join(publicDir, 'openapi.yml')),
    exists(path.join(contentDir, 'index.mdx')),
  ]);
  if (ready.every(Boolean)) {
    console.log('Sincronização ignorada: artefatos versionados disponíveis.');
    process.exit(0);
  }
  throw new Error('CODECHAT_SKIP_SYNC=1, mas os artefatos sincronizados não existem.');
}

if (!(await exists(sourceDocs))) {
  throw new Error(`Diretório fonte não encontrado: ${sourceDocs}. Defina CODECHAT_SOURCE_DOCS.`);
}

const openApiSource = path.join(sourceDocs, 'openapi.yml');
if (!(await exists(openApiSource))) {
  throw new Error(`OpenAPI fonte não encontrado: ${openApiSource}`);
}

await mkdir(contentDir, { recursive: true });
await mkdir(publicDir, { recursive: true });
await cp(openApiSource, path.join(publicDir, 'openapi.yml'));

for (const stale of ['installation.mdx', 'plans.mdx', 'legacy.mdx', 'passkey.mdx']) {
  await rm(path.join(contentDir, stale), { force: true });
}

let copied = 0;
for (const [sourceName, [targetName, title, description]] of Object.entries(documents)) {
  const sourcePath = path.join(sourceDocs, sourceName);
  if (!(await exists(sourcePath))) throw new Error(`Documento obrigatório ausente: ${sourcePath}`);

  let markdown = await readFile(sourcePath, 'utf8');
  markdown = markdown.replace(/^#\s+[^\r\n]+\r?\n+/, '');
  markdown = markdown.replace(/^```env\s*$/gm, '```dotenv');
  markdown = rewriteLinks(markdown).trim();
  const frontmatter = ['---', `title: ${quote(title)}`, `description: ${quote(description)}`, '---', ''].join('\n');
  await writeFile(path.join(contentDir, targetName), `${frontmatter}${markdown}\n`, 'utf8');
  copied += 1;
}

const imageExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp', '.svg', '.ico', '.gif']);
const imagesRoot = path.join(publicDir, 'images');
const sourceAssetsRoot = path.join(publicDir, 'source-assets');
await rm(imagesRoot, { recursive: true, force: true });
await rm(sourceAssetsRoot, { recursive: true, force: true });
let images = 0;
let staticAssets = 0;

async function copyImages(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await copyImages(absolute);
    } else if (imageExtensions.has(path.extname(entry.name).toLowerCase())) {
      const relative = path.relative(sourceDocs, absolute);
      const target = path.join(imagesRoot, relative);
      await mkdir(path.dirname(target), { recursive: true });
      await cp(absolute, target);
      images += 1;
    } else if (path.extname(entry.name).toLowerCase() !== '.md' && entry.name !== 'openapi.yml') {
      const relative = path.relative(sourceDocs, absolute);
      const target = path.join(sourceAssetsRoot, relative);
      await mkdir(path.dirname(target), { recursive: true });
      await cp(absolute, target);
      staticAssets += 1;
    }
  }
}

await copyImages(sourceDocs);
console.log(
  `Sincronizados ${copied} documentos, 1 OpenAPI, ${images} imagens e ${staticAssets} arquivos estáticos de ${sourceDocs}.`,
);

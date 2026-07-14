export const documentationConfig = {
  title: process.env.NEXT_PUBLIC_DOCS_TITLE || process.env.VITE_DOCS_TITLE || 'CodeChat API',
  version: process.env.NEXT_PUBLIC_DOCS_VERSION || process.env.VITE_DOCS_VERSION || '1.0.0',
  openApiUrl: process.env.NEXT_PUBLIC_OPENAPI_URL || process.env.VITE_OPENAPI_URL || '/openapi.yml',
  tagOrder: [
    'System',
    'Instances',
    'Connections',
    'Messages',
    'Chats',
    'Media',
    'Groups',
    'Webhooks',
    'CodeChat API Go Pro',
    'Message Batches',
    'Legacy - Instances',
    'Legacy - Connections',
    'Legacy - Messages',
    'Legacy - Chats',
    'Legacy - Groups',
    'Legacy - Webhooks',
  ],
  introductionPages: [
    { title: 'Visão geral', href: '/api-reference' },
    { title: 'URLs base', href: '/docs/getting-started#url-base' },
    { title: 'Autenticação', href: '/docs/authentication' },
    { title: 'Criar instância', href: '/docs/creating-instance' },
    { title: 'Conectar ao WhatsApp', href: '/docs/connecting-whatsapp' },
    { title: 'Primeira mensagem', href: '/docs/first-message' },
    { title: 'Tratamento de erros', href: '/docs/errors' },
    { title: 'Rate limits', href: '/docs/rate-limits' },
    { title: 'Webhooks', href: '/api-reference/webhooks' },
    { title: 'Tempo real', href: '/docs/realtime' },
    { title: 'Migração Node.js → Go', href: '/docs/migration' },
    { title: 'Versionamento', href: '/docs/versioning' },
    { title: 'Changelog', href: '/docs/changelog' },
    { title: 'FAQ técnica', href: '/docs/faq' },
  ],
  hiddenOperationIds: [] as string[],
  experimentalOperationIds: ['createPasskeyChallenge', 'submitPasskeyAssertion'],
  aliases: {
    legacyReviewOrder: 'reviewOrder',
    legacyCreateInstance: 'createInstance',
    legacyListInstances: 'listInstances',
    legacyGetInstance: 'getInstance',
    legacyDeleteInstance: 'deleteInstance',
  } as Record<string, string>,
  externalLinks: {
    github:
      process.env.NEXT_PUBLIC_GITHUB_URL ||
      process.env.VITE_GITHUB_URL ||
      'https://github.com/jrCleber/whatsapp-api-go',
    changelog: '/docs/changelog',
    postman:
      process.env.NEXT_PUBLIC_POSTMAN_URL ||
      process.env.VITE_API_POSTMAN ||
      'https://www.postman.com/codechat/codechat-api/collection/1yi47fy/go-v1-0-0',
  },
} as const;

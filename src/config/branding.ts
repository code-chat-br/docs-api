export const branding = {
  name: process.env.NEXT_PUBLIC_DOCS_TITLE || process.env.VITE_DOCS_TITLE || 'CodeChat API',
  shortName: 'CodeChat',
  logoPath: '/logo.png',
  description:
    'API moderna para integrar WhatsApp a produtos, operações e automações. Guias completos, referência OpenAPI 3.1 e exemplos prontos.',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://docs.codechat.dev',
  apiUrl: process.env.NEXT_PUBLIC_CODECHAT_API_URL || process.env.VITE_API_BASE_URL || 'http://localhost:8084',
  githubUrl:
    process.env.NEXT_PUBLIC_GITHUB_URL ||
    process.env.VITE_GITHUB_URL ||
    'https://github.com/code-chat-br/whatsapp-api-go',
  openApiUrl: process.env.NEXT_PUBLIC_OPENAPI_URL || process.env.VITE_OPENAPI_URL || '/openapi.yml',
  supportUrl: process.env.NEXT_PUBLIC_SUPPORT_URL || 'https://github.com/code-chat-br/whatsapp-api-go/issues',
} as const;

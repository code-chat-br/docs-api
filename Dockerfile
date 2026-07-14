# syntax=docker/dockerfile:1.7
FROM node:22-alpine AS dependencies
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts

FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN pnpm rebuild && pnpm postinstall
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ARG NEXT_PUBLIC_CODECHAT_API_URL=http://localhost:8084
ARG NEXT_PUBLIC_GITHUB_URL=https://github.com/jrCleber/whatsapp-api-go
ARG NEXT_PUBLIC_SUPPORT_URL=https://github.com/jrCleber/whatsapp-api-go/issues
ARG NEXT_PUBLIC_DOCS_TITLE=CodeChat API
ARG NEXT_PUBLIC_DOCS_VERSION=1.0.0
ARG NEXT_PUBLIC_OPENAPI_URL=/openapi.yml
ARG NEXT_PUBLIC_POSTMAN_URL=https://www.postman.com/codechat/codechat-api/collection/1yi47fy/go-v1-0-0
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_CODECHAT_API_URL=$NEXT_PUBLIC_CODECHAT_API_URL
ENV NEXT_PUBLIC_GITHUB_URL=$NEXT_PUBLIC_GITHUB_URL
ENV NEXT_PUBLIC_SUPPORT_URL=$NEXT_PUBLIC_SUPPORT_URL
ENV NEXT_PUBLIC_DOCS_TITLE=$NEXT_PUBLIC_DOCS_TITLE
ENV NEXT_PUBLIC_DOCS_VERSION=$NEXT_PUBLIC_DOCS_VERSION
ENV NEXT_PUBLIC_OPENAPI_URL=$NEXT_PUBLIC_OPENAPI_URL
ENV NEXT_PUBLIC_POSTMAN_URL=$NEXT_PUBLIC_POSTMAN_URL
ENV CODECHAT_SKIP_SYNC=1
ENV CODECHAT_SKIP_AUDIT=1
ENV NEXT_OUTPUT_STANDALONE=1
RUN pnpm build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD node -e "fetch('http://127.0.0.1:3000/api-reference').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]

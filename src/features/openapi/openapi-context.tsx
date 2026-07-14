'use client';

import { createContext, useContext } from 'react';
import type { ReferenceSpec, WebhookCatalog } from './openapi-types';

const OpenApiContext = createContext<{ spec: ReferenceSpec; webhooks: WebhookCatalog } | null>(null);

export function OpenApiProvider({
  spec,
  webhooks,
  children,
}: {
  spec: ReferenceSpec;
  webhooks: WebhookCatalog;
  children: React.ReactNode;
}) {
  return <OpenApiContext.Provider value={{ spec, webhooks }}>{children}</OpenApiContext.Provider>;
}

export function useApiReference() {
  const value = useContext(OpenApiContext);
  if (!value) throw new Error('useApiReference precisa estar dentro de OpenApiProvider.');
  return value;
}

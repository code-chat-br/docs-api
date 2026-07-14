'use client';

import { Play, Server } from 'lucide-react';
import { CopyButton } from '@/components/common/copy-button';
import { branding } from '@/config/branding';
import { MethodBadge } from './method-badge';

export function EndpointUrlBar({ method, path, onTry }: { method: string; path: string; onTry: () => void }) {
  const url = `${branding.apiUrl.replace(/\/$/, '')}${path}`;
  return (
    <div className="endpoint-url-bar">
      <Server size={17} aria-hidden="true" />
      <MethodBadge method={method} />
      <code>
        {branding.apiUrl.replace(/\/$/, '')}
        <strong>{path}</strong>
      </code>
      <CopyButton value={url} label="URL" />
      <button type="button" className="try-button" onClick={onTry}>
        <Play size={15} fill="currentColor" /> Testar endpoint
      </button>
    </div>
  );
}

import Image from 'next/image';
import { branding } from '@/config/branding';

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="brand-mark group inline-flex items-center gap-2.5 font-semibold no-underline">
      <Image className="brand-logo" src={branding.logoPath} alt="" width={447} height={453} priority />
      {!compact && (
        <span className="brand-wordmark tracking-tight text-fd-foreground">
          CodeChat <span className="text-emerald-500">API</span>
        </span>
      )}
    </span>
  );
}

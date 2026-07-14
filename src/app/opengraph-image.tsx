/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from 'next/og';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { branding } from '@/config/branding';

export const alt = 'CodeChat API — Documentação para integrações confiáveis';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const runtime = 'nodejs';

export default function OpenGraphImage() {
  const background = `data:image/png;base64,${readFileSync(path.join(process.cwd(), 'public', 'og-background.png')).toString('base64')}`;
  const logo = `data:image/png;base64,${readFileSync(path.join(process.cwd(), 'public', branding.logoPath.slice(1))).toString('base64')}`;
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '74px',
        backgroundColor: '#071410',
        backgroundImage: `url(${background})`,
        backgroundPosition: 'center',
        backgroundSize: 'cover',
        color: '#f3fff9',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '22px' }}>
        <img src={logo} alt="" width={108} height={109} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ color: '#f3fff9', fontSize: 31, fontWeight: 750 }}>CodeChat API</span>
          <span style={{ color: '#6ee7b7', fontSize: 20, fontWeight: 700, letterSpacing: '0.08em' }}>
            CONTRATO SOURCE-FIRST
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', marginTop: 34, fontSize: 68, fontWeight: 750, letterSpacing: '-0.055em' }}>
        Documentação para integrações confiáveis
      </div>
      <div style={{ display: 'flex', maxWidth: 560, marginTop: 22, color: '#b7d6c9', fontSize: 29, lineHeight: 1.35 }}>
        Documentação para integrar WhatsApp sem adivinhação.
      </div>
      <div style={{ display: 'flex', gap: 28, marginTop: 66, color: '#82a497', fontSize: 19 }}>
        <span>OpenAPI 3.1</span>
        <span>93 operações</span>
        <span>41 eventos</span>
      </div>
    </div>,
    size,
  );
}

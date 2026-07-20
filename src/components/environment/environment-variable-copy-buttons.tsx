'use client';

import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

async function writeClipboard(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const input = document.createElement('textarea');
  input.value = value;
  input.setAttribute('readonly', '');
  input.style.position = 'fixed';
  input.style.opacity = '0';
  document.body.append(input);
  input.select();
  document.execCommand('copy');
  input.remove();
}

function CopyActionButton({
  value,
  idleLabel,
  copiedLabel,
  ariaLabel,
  title,
}: {
  value: string;
  idleLabel: string;
  copiedLabel: string;
  ariaLabel: string;
  title: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await writeClipboard(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button
      type="button"
      className="environment-variable-action"
      onClick={copy}
      title={copied ? copiedLabel : title}
      aria-label={copied ? copiedLabel : ariaLabel}
      data-copied={copied}
    >
      {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
      <span aria-hidden="true">{copied ? copiedLabel : idleLabel}</span>
    </button>
  );
}

export function CopyEnvironmentVariableButton({ value }: { value: string }) {
  return (
    <CopyActionButton
      value={value}
      idleLabel="Copiar"
      copiedLabel="Copiado"
      ariaLabel={`Copiar variável ${value}`}
      title="Copiar variável"
    />
  );
}

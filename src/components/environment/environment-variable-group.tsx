'use client';

import { ChevronDown } from 'lucide-react';
import { EnvironmentVariableItem } from './environment-variable-item';
import type { EnvironmentVariable } from './environment-variables-types';

export function EnvironmentVariableGroup({
  category,
  variables,
  open,
  highlightedSlug,
  onToggle,
}: {
  category: string;
  variables: readonly EnvironmentVariable[];
  open: boolean;
  highlightedSlug?: string;
  onToggle: () => void;
}) {
  const groupId = `environment-category-${category
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')}`;

  return (
    <section className="environment-variable-group" aria-labelledby={`${groupId}-title`}>
      <header className="environment-variable-group__header">
        <h3 id={`${groupId}-title`}>
          <span>{category}</span>
          {' '}
          <small>{variables.length} {variables.length === 1 ? 'variável' : 'variáveis'}</small>
        </h3>
        <button type="button" onClick={onToggle} aria-expanded={open} aria-controls={groupId}>
          <ChevronDown size={15} aria-hidden="true" data-open={open} />
          <span>{open ? 'Recolher' : 'Expandir'}</span>
        </button>
      </header>
      {open && (
        <div id={groupId} className="environment-variable-group__content">
          {variables.map((variable) => (
            <EnvironmentVariableItem key={variable.name} variable={variable} highlighted={highlightedSlug === variable.slug} />
          ))}
        </div>
      )}
    </section>
  );
}

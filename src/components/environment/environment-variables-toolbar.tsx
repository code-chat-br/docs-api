'use client';

import { Search, X } from 'lucide-react';

export type EnvironmentRequiredFilter = 'all' | 'required' | 'optional';

const requiredFilters: { value: EnvironmentRequiredFilter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'required', label: 'Obrigatórias' },
  { value: 'optional', label: 'Opcionais' },
];

export function EnvironmentVariablesToolbar({
  query,
  requiredFilter,
  categoryFilter,
  categories,
  resultCount,
  totalCount,
  onQueryChange,
  onRequiredFilterChange,
  onCategoryFilterChange,
  onClearQuery,
}: {
  query: string;
  requiredFilter: EnvironmentRequiredFilter;
  categoryFilter: string;
  categories: readonly string[];
  resultCount: number;
  totalCount: number;
  onQueryChange: (query: string) => void;
  onRequiredFilterChange: (filter: EnvironmentRequiredFilter) => void;
  onCategoryFilterChange: (category: string) => void;
  onClearQuery: () => void;
}) {
  return (
    <div className="environment-variables-toolbar">
      <label className="environment-variables-search">
        <span className="sr-only">Pesquisar variável</span>
        <Search size={16} aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Pesquisar por nome, descrição ou exemplo..."
        />
        {query && (
          <button type="button" onClick={onClearQuery} aria-label="Limpar pesquisa" title="Limpar pesquisa">
            <X size={15} aria-hidden="true" />
          </button>
        )}
      </label>

      <div className="environment-variables-toolbar__filters">
        <div className="environment-required-filter" role="radiogroup" aria-label="Filtrar por obrigatoriedade">
          {requiredFilters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              role="radio"
              aria-checked={requiredFilter === filter.value}
              className={requiredFilter === filter.value ? 'is-active' : undefined}
              onClick={() => onRequiredFilterChange(filter.value)}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <label className="environment-category-filter">
          <span className="sr-only">Filtrar por categoria</span>
          <select value={categoryFilter} onChange={(event) => onCategoryFilterChange(event.target.value)}>
            <option value="all">Todas as categorias</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="environment-variables-result-count" aria-live="polite">
        {resultCount} de {totalCount} {totalCount === 1 ? 'variável' : 'variáveis'}
      </p>
    </div>
  );
}

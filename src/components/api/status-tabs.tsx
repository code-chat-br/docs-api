'use client';

import { useState } from 'react';

export function StatusTabs({
  statuses,
  value,
  onChange,
}: {
  statuses: string[];
  value?: string;
  onChange?: (status: string) => void;
}) {
  const [internal, setInternal] = useState(value || statuses[0]);
  const requested = value ?? internal;
  const selected = statuses.includes(requested) ? requested : statuses[0];

  function select(status: string) {
    setInternal(status);
    onChange?.(status);
  }

  return (
    <div className="status-tabs" role="tablist" aria-label="Códigos de resposta HTTP">
      {statuses.map((status) => (
        <button
          type="button"
          role="tab"
          aria-selected={selected === status}
          tabIndex={selected === status ? 0 : -1}
          className={selected === status ? 'active' : ''}
          key={status}
          onClick={() => select(status)}
        >
          {status}
        </button>
      ))}
    </div>
  );
}

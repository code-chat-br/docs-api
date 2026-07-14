export function MethodBadge({ method, compact = false }: { method: string; compact?: boolean }) {
  return (
    <span className={`method-badge method-${method.toLowerCase()}${compact ? ' method-compact' : ''}`}>{method}</span>
  );
}

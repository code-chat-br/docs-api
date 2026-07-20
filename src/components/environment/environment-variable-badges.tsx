import type { EnvironmentVariableType } from './environment-variables-types';

const typeLabels: Record<EnvironmentVariableType, string> = {
  string: 'String',
  integer: 'Integer',
  boolean: 'Boolean',
  number: 'Number',
  duration: 'Duration',
  url: 'URL',
  json: 'JSON',
  enum: 'Enum',
};

export function EnvironmentRequiredBadge({ required }: { required: boolean }) {
  return (
    <span className={`environment-badge environment-badge--${required ? 'required' : 'optional'}`}>
      {required ? 'Obrigatória' : 'Opcional'}
    </span>
  );
}

export function EnvironmentTypeBadge({ type }: { type: EnvironmentVariableType }) {
  return <span className="environment-badge environment-badge--type">{typeLabels[type]}</span>;
}

export function getEnvironmentTypeLabel(type: EnvironmentVariableType) {
  return typeLabels[type];
}

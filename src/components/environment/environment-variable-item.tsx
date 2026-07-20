import { CopyEnvironmentVariableButton } from './environment-variable-copy-buttons';
import { EnvironmentRequiredBadge, EnvironmentTypeBadge } from './environment-variable-badges';
import {
  environmentValueToString,
  renderEnvironmentDescription,
  type EnvironmentVariable,
  type EnvironmentVariableValue,
} from './environment-variables-types';

function MetadataValue({ value }: { value: EnvironmentVariableValue }) {
  return <code>{environmentValueToString(value)}</code>;
}

export function EnvironmentVariableItem({
  variable,
  highlighted,
}: {
  variable: EnvironmentVariable;
  highlighted: boolean;
}) {
  const hasMetadata =
    variable.defaultValue !== undefined ||
    variable.example !== undefined ||
    Boolean(variable.unit) ||
    Boolean(variable.allowedValues?.length);

  return (
    <article
      id={variable.slug}
      className={`environment-variable-item${highlighted ? ' is-highlighted' : ''}`}
      data-testid="environment-variable-item"
    >
      <header className="environment-variable-item__header">
        <code className="environment-variable-item__name">{variable.name}</code>
        <div className="environment-variable-item__actions">
          <CopyEnvironmentVariableButton value={variable.name} />
        </div>
      </header>

      <div className="environment-variable-item__badges">
        <EnvironmentRequiredBadge required={variable.required} />
        <EnvironmentTypeBadge type={variable.type} />
      </div>

      {hasMetadata && (
        <dl className="environment-variable-item__metadata">
          {variable.defaultValue !== undefined && (
            <div>
              <dt>Padrão</dt>
              <dd>
                <MetadataValue value={variable.defaultValue} />
              </dd>
            </div>
          )}
          {variable.example !== undefined && (
            <div>
              <dt>Exemplo</dt>
              <dd>
                <MetadataValue value={variable.example} />
              </dd>
            </div>
          )}
          {variable.unit && (
            <div>
              <dt>Unidade</dt>
              <dd>{variable.unit}</dd>
            </div>
          )}
          {variable.allowedValues?.length ? (
            <div className="environment-variable-item__metadata-wide">
              <dt>Valores permitidos</dt>
              <dd>
                {variable.allowedValues.map((value) => (
                  <code key={environmentValueToString(value)}>{environmentValueToString(value)}</code>
                ))}
              </dd>
            </div>
          ) : null}
        </dl>
      )}

      <div className="environment-variable-item__description">{renderEnvironmentDescription(variable.description)}</div>
    </article>
  );
}

import type { OpenAPIV3_1 } from 'openapi-types';
import { SlidersHorizontal } from 'lucide-react';
import { resolveParameter } from '@/features/openapi/code-sample-generator';
import type { NormalizedOperation, ReferenceSpec } from '@/features/openapi/openapi-types';

function typeLabel(parameter: OpenAPIV3_1.ParameterObject) {
  const schema = parameter.schema && !('$ref' in parameter.schema) ? parameter.schema : undefined;
  const type = Array.isArray(schema?.type) ? schema.type.join(' | ') : schema?.type || 'any';
  return schema?.format ? `${type}<${schema.format}>` : type;
}

export function ParametersSection({ operation, spec }: { operation: NormalizedOperation; spec: ReferenceSpec }) {
  const parameters = operation.parameters
    .map((parameter) => resolveParameter(parameter, spec))
    .filter(Boolean) as OpenAPIV3_1.ParameterObject[];
  if (!parameters.length) return null;
  return (
    <section className="endpoint-section" id="parametros">
      <div className="section-title">
        <SlidersHorizontal size={18} />
        <h2>Parâmetros</h2>
      </div>
      <div className="parameter-list">
        {parameters.map((parameter) => {
          const schema = parameter.schema && !('$ref' in parameter.schema) ? parameter.schema : undefined;
          return (
            <article className="parameter-row" key={`${parameter.in}:${parameter.name}`}>
              <div className="parameter-name">
                <code>{parameter.name}</code>
                <span>{parameter.in}</span>
                {parameter.required && <i>obrigatório</i>}
              </div>
              <div className="parameter-details">
                <strong>{typeLabel(parameter)}</strong>
                <p>{parameter.description || 'Sem descrição adicional.'}</p>
                <div className="constraint-list">
                  {schema?.default !== undefined && (
                    <span>
                      padrão <code>{JSON.stringify(schema.default)}</code>
                    </span>
                  )}
                  {schema?.enum && (
                    <span>
                      enum <code>{schema.enum.map(String).join(' · ')}</code>
                    </span>
                  )}
                  {schema?.minimum !== undefined && <span>mín {schema.minimum}</span>}
                  {schema?.maximum !== undefined && <span>máx {schema.maximum}</span>}
                  {schema?.minLength !== undefined && <span>minLength {schema.minLength}</span>}
                  {schema?.maxLength !== undefined && <span>maxLength {schema.maxLength}</span>}
                  {schema?.pattern && (
                    <span>
                      pattern <code>{schema.pattern}</code>
                    </span>
                  )}
                  {parameter.example !== undefined && (
                    <span>
                      exemplo <code>{JSON.stringify(parameter.example)}</code>
                    </span>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

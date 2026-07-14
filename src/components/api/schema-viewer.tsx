'use client';

import type { ReferenceSpec, SchemaLike, SchemaObject } from '@/features/openapi/openapi-types';
import { isReferenceObject } from '@/features/openapi/openapi-types';

function schemaType(schema: SchemaObject) {
  if (schema.enum) return `enum<${schema.enum.map(String).join(' | ')}>`;
  if (schema.oneOf) return 'oneOf';
  if (schema.anyOf) return 'anyOf';
  if (schema.allOf) return 'allOf';
  if (Array.isArray(schema.type)) return schema.type.join(' | ');
  if (schema.type) return schema.type;
  if (schema.properties) return 'object';
  if ((schema as SchemaObject & { items?: SchemaLike }).items) return 'array';
  return 'any';
}

function constraints(schema: SchemaObject) {
  const values = [
    schema.format && `format: ${schema.format}`,
    schema.default !== undefined && `padrão: ${JSON.stringify(schema.default)}`,
    schema.minimum !== undefined && `mín: ${schema.minimum}`,
    schema.maximum !== undefined && `máx: ${schema.maximum}`,
    schema.minLength !== undefined && `minLength: ${schema.minLength}`,
    schema.maxLength !== undefined && `maxLength: ${schema.maxLength}`,
    schema.pattern && `pattern: ${schema.pattern}`,
    schema.nullable && 'nullable',
  ].filter(Boolean);
  return values.join(' · ');
}

function SchemaNode({
  schema,
  spec,
  name,
  required,
  seen,
  depth,
}: {
  schema: SchemaLike;
  spec: ReferenceSpec;
  name: string;
  required?: boolean;
  seen: Set<string>;
  depth: number;
}) {
  if (depth > 10) return <div className="schema-recursive">Profundidade máxima atingida.</div>;
  if (isReferenceObject(schema)) {
    const refName = schema.$ref.split('/').at(-1) || schema.$ref;
    if (seen.has(schema.$ref))
      return (
        <div className="schema-recursive">
          ↳ referência recursiva para <code>{refName}</code>
        </div>
      );
    const resolved = spec.schemas[refName];
    if (!resolved) return <code>{schema.$ref}</code>;
    return (
      <SchemaNode
        schema={resolved}
        spec={spec}
        name={name || refName}
        required={required}
        seen={new Set(seen).add(schema.$ref)}
        depth={depth + 1}
      />
    );
  }
  const object = schema as SchemaObject;
  const items = (object as SchemaObject & { items?: SchemaLike }).items;
  const properties = Object.entries(object.properties || {});
  const branches = object.oneOf || object.anyOf || object.allOf;
  const expandable = properties.length > 0 || Boolean(items) || Boolean(branches?.length);
  const content = (
    <>
      <div className="schema-line">
        <code>{name}</code>
        <span className="schema-type">{schemaType(object)}</span>
        {required && <span className="required-badge">obrigatório</span>}
        {constraints(object) && <span className="schema-constraints">{constraints(object)}</span>}
      </div>
      {object.description && <p>{object.description}</p>}
      {object.example !== undefined && (
        <small>
          Exemplo: <code>{JSON.stringify(object.example)}</code>
        </small>
      )}
    </>
  );
  if (!expandable) return <div className="schema-leaf">{content}</div>;
  return (
    <details className="schema-node" open={depth < 2}>
      <summary>{content}</summary>
      <div className="schema-children">
        {properties.map(([propertyName, property]) => (
          <SchemaNode
            key={propertyName}
            schema={property}
            spec={spec}
            name={propertyName}
            required={object.required?.includes(propertyName)}
            seen={new Set(seen)}
            depth={depth + 1}
          />
        ))}
        {items && <SchemaNode schema={items} spec={spec} name="items[]" seen={new Set(seen)} depth={depth + 1} />}
        {branches?.map((branch, index) => (
          <SchemaNode
            key={index}
            schema={branch}
            spec={spec}
            name={`opção ${index + 1}`}
            seen={new Set(seen)}
            depth={depth + 1}
          />
        ))}
      </div>
    </details>
  );
}

export function SchemaViewer({
  schema,
  spec,
  name = 'schema',
}: {
  schema?: SchemaLike;
  spec: ReferenceSpec;
  name?: string;
}) {
  if (!schema) return <p className="empty-state">Sem schema declarado para este conteúdo.</p>;
  return (
    <div className="schema-viewer">
      <SchemaNode schema={schema} spec={spec} name={name} seen={new Set()} depth={0} />
    </div>
  );
}

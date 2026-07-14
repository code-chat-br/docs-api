import type { OpenAPIV3_1 } from 'openapi-types';
import type { ReferenceSpec, SchemaLike, SchemaObject } from './openapi-types';
import { isReferenceObject } from './openapi-types';

function refName(ref: string) {
  return ref.split('/').at(-1) || ref;
}

export function resolveSchema(schema: SchemaLike | undefined, spec: ReferenceSpec): SchemaLike | undefined {
  if (!schema || !isReferenceObject(schema)) return schema;
  return spec.schemas[refName(schema.$ref)] || schema;
}

function stringExample(name: string, schema: SchemaObject) {
  const key = name.toLowerCase();
  if (schema.format === 'uuid' || (key.endsWith('id') && key.includes('batch')))
    return '01900000-0000-7000-8000-000000000001';
  if (schema.format === 'date-time' || key.includes('timestamp') || key.endsWith('at')) return '2026-07-13T15:10:00Z';
  if (schema.format === 'uri' || key === 'url') return 'https://api.example.com/webhooks/codechat';
  if (schema.format === 'email') return 'dev@example.com';
  if (key.includes('groupjid')) return '120363000000000000@g.us';
  if (key.includes('jid') || key.includes('remote')) return '5511999999999@s.whatsapp.net';
  if (key.includes('phone') || key === 'number' || key.includes('recipient')) return '5511999999999';
  if (key.includes('instance')) return 'minha-instancia';
  if (key.includes('token')) return '<INSTANCE_TOKEN>';
  if (key.includes('messageid')) return '3EB0CODECHATMESSAGE';
  if (key.includes('text') || key.includes('message')) return 'Olá! Esta é uma mensagem de exemplo da CodeChat.';
  if (key.includes('name')) return 'CodeChat';
  if (schema.pattern?.includes('@g')) return '120363000000000000@g.us';
  return 'string';
}

function mergeAllOf(values: unknown[]) {
  if (values.every((value) => value && typeof value === 'object' && !Array.isArray(value))) {
    return Object.assign({}, ...values);
  }
  return values[0];
}

export function generateSchemaExample(
  input: SchemaLike | undefined,
  spec: ReferenceSpec,
  name = 'value',
  seen = new Set<string>(),
  depth = 0,
): unknown {
  if (!input || depth > 10) return null;
  if (isReferenceObject(input)) {
    const nameFromRef = refName(input.$ref);
    if (seen.has(input.$ref)) return `[Referência recursiva: ${nameFromRef}]`;
    const nextSeen = new Set(seen).add(input.$ref);
    return generateSchemaExample(spec.schemas[nameFromRef], spec, nameFromRef, nextSeen, depth + 1);
  }
  const schema = input as SchemaObject;
  const items = (schema as SchemaObject & { items?: SchemaLike }).items;
  if (schema.example !== undefined) return schema.example;
  if (schema.default !== undefined) return schema.default;
  if (schema.const !== undefined) return schema.const;
  if (schema.enum?.length) return schema.enum[0];
  if (schema.allOf?.length)
    return mergeAllOf(schema.allOf.map((part) => generateSchemaExample(part, spec, name, new Set(seen), depth + 1)));
  if (schema.oneOf?.length) return generateSchemaExample(schema.oneOf[0], spec, name, seen, depth + 1);
  if (schema.anyOf?.length) return generateSchemaExample(schema.anyOf[0], spec, name, seen, depth + 1);

  const type = Array.isArray(schema.type) ? schema.type.find((entry) => entry !== 'null') : schema.type;
  if (type === 'object' || schema.properties) {
    return Object.fromEntries(
      Object.entries(schema.properties || {}).map(([propertyName, property]) => [
        propertyName,
        generateSchemaExample(property, spec, propertyName, new Set(seen), depth + 1),
      ]),
    );
  }
  if (type === 'array' || items) return [generateSchemaExample(items, spec, name, new Set(seen), depth + 1)];
  if (type === 'integer') return typeof schema.minimum === 'number' ? Math.max(1, schema.minimum) : 1;
  if (type === 'number') return typeof schema.minimum === 'number' ? schema.minimum : 1.5;
  if (type === 'boolean') return true;
  if (type === 'null') return null;
  return stringExample(name, schema);
}

export function exampleFromMediaType(media: OpenAPIV3_1.MediaTypeObject | undefined, spec: ReferenceSpec) {
  if (!media) return { value: undefined, generated: true };
  if (media.example !== undefined) return { value: media.example, generated: false };
  const explicit = Object.values(media.examples || {}).find((entry) => entry && !('$ref' in entry));
  if (explicit && 'value' in explicit && explicit.value !== undefined)
    return { value: explicit.value, generated: false };
  return { value: generateSchemaExample(media.schema as SchemaLike, spec), generated: true };
}

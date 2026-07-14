import type { OpenAPIV3_1 } from 'openapi-types';
import type { ReferenceSpec, RequestBodyLike, ResponseLike, SchemaLike, SecuritySchemeLike } from './openapi-types';
import { isReferenceObject } from './openapi-types';

function nameFromRef(ref: string) {
  return ref.split('/').at(-1) || '';
}

export function resolveRequestBody(
  value: RequestBodyLike | undefined,
  spec: ReferenceSpec,
): OpenAPIV3_1.RequestBodyObject | undefined {
  if (!value) return undefined;
  const resolved = isReferenceObject(value) ? spec.requestBodies[nameFromRef(value.$ref)] : value;
  return resolved && !isReferenceObject(resolved) ? resolved : undefined;
}

export function resolveResponse(
  value: ResponseLike | undefined,
  spec: ReferenceSpec,
): OpenAPIV3_1.ResponseObject | undefined {
  if (!value) return undefined;
  const resolved = isReferenceObject(value) ? spec.responses[nameFromRef(value.$ref)] : value;
  return resolved && !isReferenceObject(resolved) ? resolved : undefined;
}

export function resolveSecurityScheme(
  value: SecuritySchemeLike | undefined,
  spec: ReferenceSpec,
): OpenAPIV3_1.SecuritySchemeObject | undefined {
  if (!value) return undefined;
  const resolved = isReferenceObject(value) ? spec.securitySchemes[nameFromRef(value.$ref)] : value;
  return resolved && !isReferenceObject(resolved) ? resolved : undefined;
}

export function schemaFromContent(
  content: Record<string, OpenAPIV3_1.MediaTypeObject> | undefined,
): { contentType: string; schema?: SchemaLike; media?: OpenAPIV3_1.MediaTypeObject } | undefined {
  if (!content) return undefined;
  const contentType = content['application/json'] ? 'application/json' : Object.keys(content)[0];
  if (!contentType) return undefined;
  const media = content[contentType];
  return { contentType, schema: media?.schema as SchemaLike | undefined, media };
}

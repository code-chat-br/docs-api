import type { OpenAPIV3_1 } from 'openapi-types';

export type ReferenceObject = OpenAPIV3_1.ReferenceObject;
export type SchemaObject = OpenAPIV3_1.SchemaObject & {
  nullable?: boolean;
  example?: unknown;
  const?: unknown;
};
export type SchemaLike = SchemaObject | ReferenceObject;
export type ParameterLike = OpenAPIV3_1.ParameterObject | ReferenceObject;
export type RequestBodyLike = OpenAPIV3_1.RequestBodyObject | ReferenceObject;
export type ResponseLike = OpenAPIV3_1.ResponseObject | ReferenceObject;
export type SecuritySchemeLike = OpenAPIV3_1.SecuritySchemeObject | ReferenceObject;

export type NormalizedOperation = {
  id: string;
  method: string;
  path: string;
  tag: string;
  summary: string;
  description: string;
  deprecated: boolean;
  experimental: boolean;
  plan?: string;
  planEnforced?: boolean;
  externalDocs?: OpenAPIV3_1.ExternalDocumentationObject;
  parameters: ParameterLike[];
  requestBody?: RequestBodyLike;
  responses: Record<string, ResponseLike>;
  security?: OpenAPIV3_1.SecurityRequirementObject[];
  previousId?: string;
  nextId?: string;
};

export type NormalizedTag = {
  name: string;
  description: string;
  operations: NormalizedOperation[];
};

export type WebhookField = {
  name: string;
  type: string;
  description: string;
};

export type WebhookEvent = {
  name: string;
  kind: 'instance' | 'batch';
  flag: string;
  description: string;
  request: string;
  example?: unknown;
  fields: WebhookField[];
  notes: string[];
};

export type WebhookCatalog = {
  total: number;
  instanceCount: number;
  batchCount: number;
  events: WebhookEvent[];
};

export type ReferenceSpec = {
  title: string;
  version: string;
  description: string;
  servers: OpenAPIV3_1.ServerObject[];
  tags: NormalizedTag[];
  operations: NormalizedOperation[];
  schemas: Record<string, SchemaLike>;
  parameters: Record<string, ParameterLike>;
  requestBodies: Record<string, RequestBodyLike>;
  responses: Record<string, ResponseLike>;
  securitySchemes: Record<string, SecuritySchemeLike>;
  security?: OpenAPIV3_1.SecurityRequirementObject[];
};

export function isReferenceObject(value: unknown): value is ReferenceObject {
  return Boolean(value && typeof value === 'object' && '$ref' in value);
}

import type { OpenAPIV3_1 } from 'openapi-types';
import { z } from 'zod';
import { documentationConfig } from '@/config/documentation';
import type { NormalizedOperation, NormalizedTag, ReferenceSpec } from './openapi-types';

const documentShape = z.object({
  openapi: z.string().startsWith('3.1'),
  info: z.object({ title: z.string(), version: z.string(), description: z.string().optional() }),
  paths: z.record(z.string(), z.unknown()),
});

const httpMethods = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'] as const;

function fallbackOperationId(method: string, path: string) {
  return `${method}-${path}`
    .toLowerCase()
    .replace(/[{}]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function normalizeOpenApi(document: OpenAPIV3_1.Document): ReferenceSpec {
  documentShape.parse(document);
  const operations: NormalizedOperation[] = [];
  const hiddenOperations = new Set<string>(documentationConfig.hiddenOperationIds);
  const experimentalOperations = new Set<string>(documentationConfig.experimentalOperationIds);
  const declaredTags = new Map((document.tags || []).map((tag) => [tag.name, tag.description || '']));

  for (const [routePath, pathItem] of Object.entries(document.paths || {})) {
    if (!pathItem || '$ref' in pathItem) continue;
    for (const method of httpMethods) {
      const operation = pathItem[method];
      if (!operation) continue;
      const id = operation.operationId || fallbackOperationId(method, routePath);
      if (hiddenOperations.has(id)) continue;
      const tag = operation.tags?.[0] || 'Geral';
      if (!declaredTags.has(tag)) declaredTags.set(tag, '');
      operations.push({
        id,
        method: method.toUpperCase(),
        path: routePath,
        tag,
        summary: operation.summary || id,
        description: operation.description || operation.summary || '',
        deprecated: operation.deprecated === true,
        experimental:
          operation['x-codechat-experimental' as keyof typeof operation] === true || experimentalOperations.has(id),
        plan: operation['x-codechat-plan' as keyof typeof operation] as string | undefined,
        planEnforced: operation['x-codechat-plan-enforced' as keyof typeof operation] as boolean | undefined,
        externalDocs: operation.externalDocs,
        parameters: [...(pathItem.parameters || []), ...(operation.parameters || [])],
        requestBody: operation.requestBody,
        responses: operation.responses || {},
        security: operation.security ?? document.security,
      });
    }
  }

  const tagRank = new Map<string, number>(documentationConfig.tagOrder.map((tag, index) => [tag, index]));
  operations.sort((a, b) => {
    const rank = (tagRank.get(a.tag) ?? Number.MAX_SAFE_INTEGER) - (tagRank.get(b.tag) ?? Number.MAX_SAFE_INTEGER);
    if (rank !== 0) return rank;
    return 0;
  });
  for (const [index, operation] of operations.entries()) {
    operation.previousId = operations[index - 1]?.id;
    operation.nextId = operations[index + 1]?.id;
  }

  const tags: NormalizedTag[] = [...declaredTags.entries()]
    .map(([name, description]) => ({
      name,
      description,
      operations: operations.filter((operation) => operation.tag === name),
    }))
    .filter((tag) => tag.operations.length > 0)
    .sort(
      (a, b) => (tagRank.get(a.name) ?? Number.MAX_SAFE_INTEGER) - (tagRank.get(b.name) ?? Number.MAX_SAFE_INTEGER),
    );

  return {
    title: document.info.title,
    version: document.info.version,
    description: document.info.description || '',
    servers: document.servers || [],
    tags,
    operations,
    schemas: document.components?.schemas || {},
    parameters: document.components?.parameters || {},
    requestBodies: document.components?.requestBodies || {},
    responses: document.components?.responses || {},
    securitySchemes: document.components?.securitySchemes || {},
    security: document.security,
  };
}

import type { OpenAPIV3_1 } from 'openapi-types';
import type { ReferenceSpec } from '@/features/openapi/openapi-types';

export const minimalDocument: OpenAPIV3_1.Document = {
  openapi: '3.1.0',
  info: { title: 'CodeChat API', version: '1.0.0' },
  tags: [{ name: 'Instance' }, { name: 'Message' }],
  servers: [{ url: 'https://api.codechat.test' }],
  paths: {
    '/instance': {
      get: {
        operationId: 'listInstances',
        tags: ['Instance'],
        summary: 'Listar instâncias',
        responses: { '200': { description: 'OK' }, '401': { description: 'Não autorizado' } },
      },
    },
    '/message/{instance}': {
      post: {
        operationId: 'sendMessage',
        tags: ['Message'],
        summary: 'Enviar mensagem',
        parameters: [
          { name: 'instance', in: 'path', required: true, schema: { type: 'string' }, example: 'principal' },
        ],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Message' } } },
        },
        responses: { '201': { description: 'Criada' } },
        security: [{ InstanceBearer: [] }],
      },
    },
  },
  components: {
    schemas: {
      Message: {
        type: 'object',
        required: ['remoteJid', 'text'],
        properties: { remoteJid: { type: 'string' }, text: { type: 'string' } },
      },
    },
  },
};

export const emptySpec: ReferenceSpec = {
  title: 'CodeChat API',
  version: '1.0.0',
  description: '',
  servers: [{ url: 'https://api.codechat.test' }],
  tags: [],
  operations: [],
  schemas: {},
  parameters: {},
  requestBodies: {},
  responses: {},
  securitySchemes: {},
};

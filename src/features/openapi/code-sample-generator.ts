import type { OpenAPIV3_1 } from 'openapi-types';
import type { NormalizedOperation, ReferenceSpec } from './openapi-types';
import { isReferenceObject } from './openapi-types';
import { exampleFromMediaType, generateSchemaExample } from './example-generator';

export const codeLanguages = ['cURL', 'JavaScript', 'Node.js', 'Go', 'Python', 'PHP'] as const;
export type CodeLanguage = (typeof codeLanguages)[number];

function componentParameter(ref: string, spec: ReferenceSpec) {
  return spec.parameters[ref.split('/').at(-1) || ''];
}

export function resolveParameter(
  parameter: NormalizedOperation['parameters'][number],
  spec: ReferenceSpec,
): OpenAPIV3_1.ParameterObject | undefined {
  const value = isReferenceObject(parameter) ? componentParameter(parameter.$ref, spec) : parameter;
  return value && !isReferenceObject(value) ? value : undefined;
}

export function operationExample(operation: NormalizedOperation, spec: ReferenceSpec) {
  if (!operation.requestBody) return undefined;
  const requestBody = isReferenceObject(operation.requestBody)
    ? spec.requestBodies[operation.requestBody.$ref.split('/').at(-1) || '']
    : operation.requestBody;
  if (!requestBody || isReferenceObject(requestBody)) return undefined;
  const media = requestBody.content?.['application/json'] || Object.values(requestBody.content || {})[0];
  return exampleFromMediaType(media, spec).value;
}

function parameterValue(parameter: OpenAPIV3_1.ParameterObject, spec: ReferenceSpec) {
  if (parameter.example !== undefined) return String(parameter.example);
  return String(generateSchemaExample(parameter.schema as never, spec, parameter.name) ?? 'value');
}

export function sampleRequest(operation: NormalizedOperation, spec: ReferenceSpec, baseUrl: string) {
  const parameters = operation.parameters
    .map((parameter) => resolveParameter(parameter, spec))
    .filter(Boolean) as OpenAPIV3_1.ParameterObject[];
  let pathname = operation.path;
  for (const parameter of parameters.filter((entry) => entry.in === 'path')) {
    pathname = pathname.replace(`{${parameter.name}}`, encodeURIComponent(parameterValue(parameter, spec)));
  }
  const query = new URLSearchParams();
  for (const parameter of parameters.filter((entry) => entry.in === 'query' && entry.required))
    query.set(parameter.name, parameterValue(parameter, spec));
  const url = `${baseUrl.replace(/\/$/, '')}${pathname}${query.size ? `?${query}` : ''}`;
  const headers: Record<string, string> = {};
  const securityNames = new Set((operation.security || []).flatMap((item) => Object.keys(item)));
  if (securityNames.has('GlobalApiKey')) headers.apikey = '<GLOBAL_API_KEY>';
  if (securityNames.has('InstanceBearer')) headers.Authorization = 'Bearer <INSTANCE_TOKEN>';
  const body = operationExample(operation, spec);
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  return { method: operation.method, url, headers, body };
}

function jsonBody(value: unknown) {
  return JSON.stringify(value, null, 2);
}

export function generateCodeSample(
  operation: NormalizedOperation,
  spec: ReferenceSpec,
  baseUrl: string,
  language: CodeLanguage,
) {
  const request = sampleRequest(operation, spec, baseUrl);
  const headerEntries = Object.entries(request.headers);
  if (language === 'cURL') {
    const parts = [`curl --request ${request.method} \\\n  --url '${request.url}'`];
    for (const [name, value] of headerEntries) parts.push(`  --header '${name}: ${value}'`);
    if (request.body !== undefined) parts.push(`  --data '${JSON.stringify(request.body)}'`);
    return parts.join(' \\\n');
  }
  if (language === 'JavaScript') {
    return `const response = await fetch(${JSON.stringify(request.url)}, {\n  method: '${request.method}',\n  headers: ${jsonBody(request.headers)}${request.body === undefined ? '' : `,\n  body: JSON.stringify(${jsonBody(request.body)})`}\n});\n\nconst data = await response.json();`;
  }
  if (language === 'Node.js') {
    return `import axios from 'axios';\n\nconst response = await axios({\n  method: '${request.method.toLowerCase()}',\n  url: ${JSON.stringify(request.url)},\n  headers: ${jsonBody(request.headers)}${request.body === undefined ? '' : `,\n  data: ${jsonBody(request.body)}`}\n});\n\nconsole.log(response.data);`;
  }
  if (language === 'Go') {
    const body =
      request.body === undefined ? 'nil' : `strings.NewReader(${JSON.stringify(JSON.stringify(request.body))})`;
    return `package main\n\nimport (\n  "fmt"\n  "io"\n  "net/http"${request.body === undefined ? '' : '\n  "strings"'}\n)\n\nfunc main() {\n  req, _ := http.NewRequest("${request.method}", ${JSON.stringify(request.url)}, ${body})\n${headerEntries.map(([name, value]) => `  req.Header.Set(${JSON.stringify(name)}, ${JSON.stringify(value)})`).join('\n')}\n  res, err := http.DefaultClient.Do(req)\n  if err != nil { panic(err) }\n  defer res.Body.Close()\n  data, _ := io.ReadAll(res.Body)\n  fmt.Println(string(data))\n}`;
  }
  if (language === 'Python') {
    return `import requests\n\nresponse = requests.request(\n    "${request.method}",\n    ${JSON.stringify(request.url)},\n    headers=${JSON.stringify(request.headers, null, 4)}${request.body === undefined ? '' : `,\n    json=${JSON.stringify(request.body, null, 4)}`}\n)\n\nprint(response.json())`;
  }
  return `<?php\n$client = curl_init(${JSON.stringify(request.url)});\ncurl_setopt($client, CURLOPT_CUSTOMREQUEST, '${request.method}');\ncurl_setopt($client, CURLOPT_RETURNTRANSFER, true);\ncurl_setopt($client, CURLOPT_HTTPHEADER, ${JSON.stringify(headerEntries.map(([name, value]) => `${name}: ${value}`))});${request.body === undefined ? '' : `\ncurl_setopt($client, CURLOPT_POSTFIELDS, ${JSON.stringify(JSON.stringify(request.body))});`}\n$response = curl_exec($client);\ncurl_close($client);\necho $response;`;
}

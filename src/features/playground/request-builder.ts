export type RequestBuilderInput = {
  baseUrl: string;
  method: string;
  path: string;
  pathParameters: Record<string, string>;
  queryParameters: Record<string, string>;
  headers: Record<string, string>;
  body?: string;
};

export function buildRequest(input: RequestBuilderInput) {
  let pathname = input.path;
  for (const [name, value] of Object.entries(input.pathParameters))
    pathname = pathname.replace(`{${name}}`, encodeURIComponent(value));
  const url = new URL(`${input.baseUrl.replace(/\/$/, '')}${pathname}`);
  for (const [name, value] of Object.entries(input.queryParameters))
    if (value !== '') url.searchParams.set(name, value);
  const body = input.body?.trim() ? input.body : undefined;
  return { url: url.toString(), method: input.method, headers: input.headers, body };
}

export function maskSecret(value: string) {
  if (value.length < 9) return '••••••••';
  return `${value.slice(0, 4)}••••${value.slice(-4)}`;
}

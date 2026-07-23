'use client';

import type { OpenAPIV3_1 } from 'openapi-types';
import { AlertTriangle, LoaderCircle, Play, Square, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CodeBlock } from '@/components/common/code-block';
import { branding } from '@/config/branding';
import { operationExample, resolveParameter } from '@/features/openapi/code-sample-generator';
import { generateSchemaExample } from '@/features/openapi/example-generator';
import type { NormalizedOperation, ReferenceSpec } from '@/features/openapi/openapi-types';
import { buildRequest } from '@/features/playground/request-builder';

type PlaygroundCredentials = { apiKey: string; bearer: string; persistent: boolean };
type PlaygroundResponse = {
  status: number;
  statusText: string;
  duration: number;
  headers: Record<string, string>;
  body: string;
};
const sessionKey = 'codechat-docs-playground';
const localKey = 'codechat-docs-playground-persistent';

function defaultValue(parameter: OpenAPIV3_1.ParameterObject, spec: ReferenceSpec) {
  if (parameter.example !== undefined) return String(parameter.example);
  return String(generateSchemaExample(parameter.schema as never, spec, parameter.name) ?? '');
}

export function TryItPanel({
  operation,
  spec,
  open,
  onClose,
}: {
  operation: NormalizedOperation;
  spec: ReferenceSpec;
  open: boolean;
  onClose: () => void;
}) {
  const parameters = useMemo(
    () =>
      operation.parameters
        .map((parameter) => resolveParameter(parameter, spec))
        .filter(Boolean) as OpenAPIV3_1.ParameterObject[],
    [operation, spec],
  );
  const initialPathValues = () =>
    Object.fromEntries(
      parameters
        .filter((parameter) => parameter.in === 'path')
        .map((parameter) => [parameter.name, defaultValue(parameter, spec)]),
    );
  const initialQueryValues = () =>
    Object.fromEntries(
      parameters
        .filter((parameter) => parameter.in === 'query')
        .map((parameter) => [parameter.name, parameter.required ? defaultValue(parameter, spec) : '']),
    );
  const initialExample = () => {
    const example = operationExample(operation, spec);
    return example === undefined ? '' : JSON.stringify(example, null, 2);
  };
  const [baseUrl, setBaseUrl] = useState(branding.apiUrl);
  const [credentials, setCredentials] = useState<PlaygroundCredentials>({ apiKey: '', bearer: '', persistent: false });
  const [pathValues, setPathValues] = useState<Record<string, string>>(initialPathValues);
  const [queryValues, setQueryValues] = useState<Record<string, string>>(initialQueryValues);
  const [extraHeaders, setExtraHeaders] = useState('');
  const [body, setBody] = useState(initialExample);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<PlaygroundResponse>();
  const controller = useRef<AbortController | undefined>(undefined);

  useEffect(() => {
    const stored = localStorage.getItem(localKey) || sessionStorage.getItem(sessionKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as PlaygroundCredentials;
        const frame = window.requestAnimationFrame(() => setCredentials(parsed));
        return () => window.cancelAnimationFrame(frame);
      } catch {
        /* armazenamento inválido é ignorado */
      }
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [onClose, open]);

  function saveCredentials(next: PlaygroundCredentials) {
    setCredentials(next);
    const storage = next.persistent ? localStorage : sessionStorage;
    storage.setItem(next.persistent ? localKey : sessionKey, JSON.stringify(next));
    (next.persistent ? sessionStorage : localStorage).removeItem(next.persistent ? sessionKey : localKey);
  }

  const security = useMemo(
    () => new Set((operation.security || []).flatMap((item) => Object.keys(item))),
    [operation.security],
  );
  const headers = useMemo(() => {
    const values: Record<string, string> = {};
    if (security.has('GlobalApiKey') && credentials.apiKey) values.apikey = credentials.apiKey;
    if ((security.has('InstanceBearer') || security.has('UserBearer')) && credentials.bearer)
      values.Authorization = `Bearer ${credentials.bearer}`;
    if (body) values['Content-Type'] = 'application/json';
    for (const line of extraHeaders.split('\n')) {
      const separator = line.indexOf(':');
      if (separator > 0) values[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
    }
    return values;
  }, [body, credentials, extraHeaders, security]);
  const request = useMemo(() => {
    try {
      return buildRequest({
        baseUrl,
        method: operation.method,
        path: operation.path,
        pathParameters: pathValues,
        queryParameters: queryValues,
        headers,
        body,
      });
    } catch {
      return undefined;
    }
  }, [baseUrl, body, headers, operation.method, operation.path, pathValues, queryValues]);
  const authorizationPlaceholder = security.has('UserBearer') ? 'Bearer <USER_TOKEN>' : 'Bearer <INSTANCE_TOKEN>';
  const curl = request
    ? `curl --request ${request.method} '${request.url}'${Object.keys(headers)
        .map(
          (name) =>
            ` \\\n  --header '${name}: ${name.toLowerCase() === 'authorization' ? authorizationPlaceholder : name.toLowerCase().includes('api') ? '<GLOBAL_API_KEY>' : headers[name]}'`,
        )
        .join('')}${request.body ? ` \\\n  --data '${request.body.replace(/\s+/g, ' ')}'` : ''}`
    : '';

  async function execute() {
    if (!request) {
      setError('Base URL ou parâmetros inválidos.');
      return;
    }
    if (body) {
      try {
        JSON.parse(body);
      } catch {
        setError('O request body não contém JSON válido.');
        return;
      }
    }
    setRunning(true);
    setError('');
    setResult(undefined);
    const abort = new AbortController();
    controller.current = abort;
    const timeout = window.setTimeout(() => abort.abort('timeout'), 30000);
    const started = performance.now();
    try {
      const response = await fetch(request.url, {
        method: request.method,
        headers: request.headers,
        body: request.body,
        signal: abort.signal,
      });
      const responseBody = await response.text();
      let formatted = responseBody;
      try {
        formatted = JSON.stringify(JSON.parse(responseBody), null, 2);
      } catch {
        /* resposta não JSON permanece como texto */
      }
      setResult({
        status: response.status,
        statusText: response.statusText,
        duration: Math.round(performance.now() - started),
        headers: Object.fromEntries(response.headers.entries()),
        body: formatted,
      });
    } catch {
      setError(
        abort.signal.aborted
          ? 'Requisição cancelada ou tempo limite de 30 segundos excedido.'
          : 'Erro de rede. Verifique a Base URL e a política CORS da API.',
      );
    } finally {
      window.clearTimeout(timeout);
      setRunning(false);
      controller.current = undefined;
    }
  }

  if (!open) return null;
  return (
    <div className="playground-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="playground-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="playground-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <span>Playground seguro</span>
            <h2 id="playground-title">Testar {operation.summary}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar playground">
            <X />
          </button>
        </header>
        <div className="playground-scroll">
          <label>
            Base URL
            <input type="url" value={baseUrl} onChange={(event) => setBaseUrl(event.target.value)} />
          </label>
          <div className="playground-grid">
            {security.has('GlobalApiKey') && (
              <label>
                API key global
                <input
                  type="password"
                  autoComplete="off"
                  value={credentials.apiKey}
                  onChange={(event) => saveCredentials({ ...credentials, apiKey: event.target.value })}
                />
              </label>
            )}
            {(security.has('InstanceBearer') || security.has('UserBearer')) && (
              <label>
                {security.has('UserBearer') ? 'Bearer token de usuário' : 'Bearer token da instância'}
                <input
                  type="password"
                  autoComplete="off"
                  value={credentials.bearer}
                  onChange={(event) => saveCredentials({ ...credentials, bearer: event.target.value })}
                />
              </label>
            )}
          </div>
          {(security.has('GlobalApiKey') || security.has('InstanceBearer') || security.has('UserBearer')) && (
            <label className="storage-option">
              <input
                type="checkbox"
                checked={credentials.persistent}
                onChange={(event) => saveCredentials({ ...credentials, persistent: event.target.checked })}
              />{' '}
              Salvar credenciais neste navegador com localStorage. Desmarcado usa sessionStorage.
            </label>
          )}
          {parameters.filter((parameter) => parameter.in === 'path').length > 0 && (
            <fieldset>
              <legend>Path parameters</legend>
              <div className="playground-grid">
                {parameters
                  .filter((parameter) => parameter.in === 'path')
                  .map((parameter) => (
                    <label key={parameter.name}>
                      {parameter.name}
                      <input
                        value={pathValues[parameter.name] || ''}
                        onChange={(event) =>
                          setPathValues((values) => ({ ...values, [parameter.name]: event.target.value }))
                        }
                      />
                    </label>
                  ))}
              </div>
            </fieldset>
          )}
          {parameters.filter((parameter) => parameter.in === 'query').length > 0 && (
            <fieldset>
              <legend>Query parameters</legend>
              <div className="playground-grid">
                {parameters
                  .filter((parameter) => parameter.in === 'query')
                  .map((parameter) => (
                    <label key={parameter.name}>
                      {parameter.name}
                      {parameter.required && ' *'}
                      <input
                        value={queryValues[parameter.name] || ''}
                        onChange={(event) =>
                          setQueryValues((values) => ({ ...values, [parameter.name]: event.target.value }))
                        }
                      />
                    </label>
                  ))}
              </div>
            </fieldset>
          )}
          <label>
            Headers adicionais <small>um por linha: Nome: valor</small>
            <textarea rows={3} value={extraHeaders} onChange={(event) => setExtraHeaders(event.target.value)} />
          </label>
          {body && (
            <label>
              Request body
              <textarea
                className="body-editor"
                rows={12}
                value={body}
                onChange={(event) => setBody(event.target.value)}
                spellCheck={false}
              />
            </label>
          )}
          {curl && <CodeBlock code={curl} language="bash" title="cURL equivalente (credenciais mascaradas)" />}
          <div className="cors-note">
            <AlertTriangle size={17} />
            <p>
              O navegador executa a chamada diretamente contra a API. A origem deste portal precisa estar liberada no
              CORS; nenhum proxy externo é usado.
            </p>
          </div>
          <div className="playground-actions">
            <button type="button" className="try-button" onClick={execute} disabled={running}>
              {running ? <LoaderCircle className="spin" size={16} /> : <Play size={16} fill="currentColor" />} Executar
            </button>
            {running && (
              <button type="button" onClick={() => controller.current?.abort()}>
                <Square size={15} /> Cancelar
              </button>
            )}
          </div>
          {error && (
            <p className="playground-error" role="alert">
              {error}
            </p>
          )}
          {result && (
            <section className="playground-result">
              <div>
                <strong>
                  {result.status} {result.statusText}
                </strong>
                <span>{result.duration} ms</span>
              </div>
              <details>
                <summary>Headers da resposta</summary>
                <CodeBlock code={JSON.stringify(result.headers, null, 2)} language="json" />
              </details>
              <CodeBlock code={result.body} language="json" title="Body da resposta" />
            </section>
          )}
        </div>
      </section>
    </div>
  );
}

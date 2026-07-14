import { KeyRound, LockKeyhole, ShieldCheck } from 'lucide-react';
import { resolveSecurityScheme } from '@/features/openapi/openapi-resolver';
import type { NormalizedOperation, ReferenceSpec } from '@/features/openapi/openapi-types';

export function AuthenticationSection({ operation, spec }: { operation: NormalizedOperation; spec: ReferenceSpec }) {
  const names = [...new Set((operation.security || []).flatMap((requirement) => Object.keys(requirement)))];
  return (
    <section className="endpoint-section" id="autenticacao">
      <div className="section-title">
        <ShieldCheck size={18} />
        <h2>Autenticação</h2>
      </div>
      {!names.length && (
        <div className="public-auth">
          <ShieldCheck size={17} />
          <div>
            <strong>Endpoint público</strong>
            <p>Esta operação não exige credenciais.</p>
          </div>
        </div>
      )}
      <div className="auth-grid">
        {names.map((name) => {
          const scheme = resolveSecurityScheme(spec.securitySchemes[name], spec);
          if (!scheme) return null;
          const apiKey = scheme.type === 'apiKey';
          const header = apiKey ? scheme.name : 'Authorization';
          const example = apiKey ? '<GLOBAL_API_KEY>' : 'Bearer <INSTANCE_TOKEN>';
          return (
            <article className="auth-card" key={name}>
              {apiKey ? <KeyRound size={18} /> : <LockKeyhole size={18} />}
              <div>
                <div className="auth-card-title">
                  <strong>{name}</strong>
                  <span>obrigatório</span>
                </div>
                <p>{scheme.description}</p>
                <dl>
                  <div>
                    <dt>Header</dt>
                    <dd>
                      <code>{header}</code>
                    </dd>
                  </div>
                  <div>
                    <dt>Exemplo</dt>
                    <dd>
                      <code>{example}</code>
                    </dd>
                  </div>
                </dl>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

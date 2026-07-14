import Link from 'next/link';
import { ArrowRight, BookOpen, Boxes, KeyRound, Radio, Send, ShieldCheck, Webhook } from 'lucide-react';
import { CodeBlock } from '@/components/common/code-block';
import { DocumentationShell } from '@/components/layout/documentation-shell';
import { loadApiReference } from '@/features/openapi/openapi-loader';
import { getGuideNavigation } from '@/lib/navigation';

const quickLinks = [
  {
    icon: Boxes,
    title: 'Crie uma instância',
    text: 'Registre a integração e receba o JWT que identifica a instância.',
    href: '/docs/creating-instance',
  },
  {
    icon: KeyRound,
    title: 'Conecte o WhatsApp',
    text: 'Use QR Code, código de pareamento ou o fluxo experimental de Passkey.',
    href: '/docs/connecting-whatsapp',
  },
  {
    icon: Send,
    title: 'Envie a primeira mensagem',
    text: 'Faça uma chamada autenticada com o payload real de texto.',
    href: '/docs/first-message',
  },
  {
    icon: Webhook,
    title: 'Receba eventos',
    text: 'Configure webhooks e conheça todos os eventos implementados.',
    href: '/api-reference/webhooks',
  },
];

const curlExample = `curl -X POST "http://localhost:8084/instance/minha-instancia/send/text" \\
  -H "Authorization: Bearer $INSTANCE_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "number": "5531999999999",
    "textMessage": {
      "text": "Olá, enviado pela CodeChat API"
    }
  }'`;

export default async function HomePage() {
  const { spec, webhooks } = await loadApiReference();
  const currentOperations = spec.operations.filter(
    (operation) => !operation.deprecated && operation.plan !== 'pro',
  ).length;
  const proOperations = spec.operations.filter((operation) => operation.plan === 'pro').length;
  const legacyOperations = spec.operations.filter((operation) => operation.deprecated).length;

  return (
    <DocumentationShell
      spec={spec}
      webhooks={webhooks}
      guideNavigation={getGuideNavigation()}
      context={{
        eyebrow: 'Portal CodeChat',
        title: 'Documentação source-first',
        description: 'Guias, referência OpenAPI e eventos no mesmo sistema visual e de navegação.',
      }}
    >
      <article className="portal-home">
        <div className="overview-eyebrow">
          <span /> Contrato executável · OpenAPI 3.1
        </div>
        <h1>
          WhatsApp na sua aplicação, <em>sem adivinhação.</em>
        </h1>
        <p className="overview-lead">
          Guias em português, referência interativa e exemplos validados diretamente contra a implementação da CodeChat
          API Go.
        </p>
        <div className="overview-actions">
          <Link className="overview-primary" href="/docs/getting-started">
            Começar agora <ArrowRight size={16} />
          </Link>
          <Link className="overview-secondary" href="/api-reference">
            <BookOpen size={16} /> Explorar a API
          </Link>
        </div>
        <div className="portal-trust">
          <span>
            <ShieldCheck size={15} /> Autenticação documentada
          </span>
          <span>
            <Radio size={15} /> {spec.operations.length} operações no OpenAPI
          </span>
        </div>

        <div className="portal-code-preview">
          <CodeBlock code={curlExample} language="bash" title="primeira-mensagem.sh · POST" />
        </div>

        <section className="portal-stats" aria-label="Resumo do contrato">
          <div>
            <strong>{currentOperations}</strong>
            <span>operações atuais</span>
          </div>
          <div>
            <strong>{proOperations}</strong>
            <span>operações Pro</span>
          </div>
          <div>
            <strong>{legacyOperations}</strong>
            <span>rotas legadas</span>
          </div>
          <div>
            <strong>{webhooks.total}</strong>
            <span>eventos</span>
          </div>
        </section>

        <section className="portal-section">
          <div className="overview-eyebrow">
            <span /> Caminho recomendado
          </div>
          <h2>Da primeira instância ao primeiro evento.</h2>
          <p>Siga um fluxo curto e abra o detalhe técnico somente quando precisar.</p>
          <div className="portal-quick-grid">
            {quickLinks.map(({ icon: Icon, ...item }, index) => (
              <Link key={item.href} href={item.href} className="portal-card">
                <span className="step-number">0{index + 1}</span>
                <Icon size={21} aria-hidden="true" />
                <strong>{item.title}</strong>
                <p>{item.text}</p>
                <span className="card-link">
                  Abrir guia <ArrowRight size={14} />
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="portal-section portal-truth">
          <div className="overview-eyebrow">
            <span /> Estado atual
          </div>
          <h2>Documentação honesta sobre o runtime.</h2>
          <div className="portal-truth-list">
            <article>
              <strong>Pro é uma classificação</strong>
              <p>O portal separa recursos Pro sem inventar um enforcement que o runtime atual não implementa.</p>
              <Link href="/docs/pro-endpoints">Entender recursos Pro</Link>
            </article>
            <article>
              <strong>Eventos chegam por webhook</strong>
              <p>A implementação auditada não expõe WebSocket nem SSE; o catálogo publicado reflete esse limite.</p>
              <Link href="/docs/realtime">Entender tempo real</Link>
            </article>
            <article>
              <strong>Legado continua visível</strong>
              <p>Aliases ativos permanecem separados das rotas atuais e preservam seus contratos literais.</p>
              <Link href="/docs/migration">Planejar migração</Link>
            </article>
          </div>
        </section>
      </article>
    </DocumentationShell>
  );
}

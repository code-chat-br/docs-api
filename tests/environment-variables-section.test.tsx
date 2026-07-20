import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EnvironmentVariablesSection } from '@/components/environment/environment-variables-section';
import { environmentVariables } from '@/components/environment/environment-variables-data';

function renderSection() {
  return render(<EnvironmentVariablesSection variables={environmentVariables} />);
}

function articleFor(name: string) {
  const article = screen.getByText(name).closest('article');
  if (!article) throw new Error(`Artigo não encontrado para ${name}`);
  return within(article);
}

describe('EnvironmentVariablesSection', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.restoreAllMocks();
    window.history.replaceState(null, '', '/docs/environment');
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
    Element.prototype.scrollIntoView = vi.fn();
  });

  it('renderiza variáveis em grupos e remove a tabela horizontal', () => {
    const { container } = renderSection();

    expect(screen.getByRole('heading', { name: 'Variáveis de ambiente' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Message Batch\s+7 variáveis/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Banco de dados\s+4 variáveis/ })).toBeInTheDocument();
    expect(screen.getAllByTestId('environment-variable-item')).toHaveLength(environmentVariables.length);
    expect(container.querySelector('table')).not.toBeInTheDocument();
  });

  it('exibe obrigatoriedade, tipos String, Integer e Boolean, padrão, exemplo e descrição integral', () => {
    renderSection();

    expect(articleFor('AUTHENTICATION_JWT_SECRET').getByText('Obrigatória')).toBeInTheDocument();
    expect(articleFor('MESSAGE_BATCH_WORKER_ENABLED').getByText('Opcional')).toBeInTheDocument();
    expect(articleFor('AUTHENTICATION_JWT_SECRET').getByText('String')).toBeInTheDocument();
    expect(articleFor('MESSAGE_BATCH_WORKER_POLL_INTERVAL_MS').getByText('Integer')).toBeInTheDocument();
    expect(articleFor('MESSAGE_BATCH_WORKER_ENABLED').getByText('Boolean')).toBeInTheDocument();

    expect(articleFor('MESSAGE_BATCH_WORKER_POLL_INTERVAL_MS').getByText('Padrão')).toBeInTheDocument();
    expect(articleFor('MESSAGE_BATCH_WORKER_POLL_INTERVAL_MS').getByText('1000')).toBeInTheDocument();
    expect(articleFor('AUTHENTICATION_JWT_SECRET').getByText('Exemplo')).toBeInTheDocument();
    expect(articleFor('AUTHENTICATION_JWT_SECRET').getByText('strong-secret')).toBeInTheDocument();
    expect(
      articleFor('MESSAGE_BATCH_WORKER_ENABLED').getByText(
        /os endpoints e os dados continuam disponíveis, mas nenhum item é consumido/i,
      ),
    ).toBeInTheDocument();
  });

  it('copia somente o nome da variável e não exibe ação de link', async () => {
    renderSection();
    const batchWorker = articleFor('MESSAGE_BATCH_WORKER_ENABLED');

    fireEvent.click(batchWorker.getByRole('button', { name: /copiar variável MESSAGE_BATCH_WORKER_ENABLED/i }));
    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledWith('MESSAGE_BATCH_WORKER_ENABLED'));
    expect(batchWorker.queryByRole('button', { name: /copiar link/i })).not.toBeInTheDocument();
  });

  it('abre automaticamente o grupo ao acessar uma âncora de variável', async () => {
    renderSection();

    const applicationGroup = screen.getByRole('heading', { name: /Aplicação\s+6 variáveis/ }).closest('section');
    if (!applicationGroup) throw new Error('Grupo Aplicação não encontrado');
    fireEvent.click(within(applicationGroup).getByRole('button', { name: /recolher/i, expanded: true }));
    expect(screen.queryByText('MESSAGE_PROCESSING_WORKERS')).not.toBeInTheDocument();

    window.history.replaceState(null, '', '/docs/environment#message-processing-workers');
    window.dispatchEvent(new HashChangeEvent('hashchange'));

    await waitFor(() => expect(screen.getByText('MESSAGE_PROCESSING_WORKERS')).toBeInTheDocument());
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });

  it('pesquisa por nome, descrição e exemplo', () => {
    renderSection();
    const input = screen.getByPlaceholderText('Pesquisar por nome, descrição ou exemplo...');

    fireEvent.change(input, { target: { value: 'MEDIA_PRE' } });
    expect(screen.getByText('MEDIA_PRE_UPLOAD_MAX_FILE_SIZE')).toBeInTheDocument();
    expect(screen.queryByText('DATABASE_URL')).not.toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'outbox' } });
    expect(screen.getByText('MESSAGE_BATCH_WORKER_POLL_INTERVAL_MS')).toBeInTheDocument();
    expect(screen.queryByText('MEDIA_PRE_UPLOAD_MAX_FILE_SIZE')).not.toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'strong-secret' } });
    expect(screen.getByText('AUTHENTICATION_JWT_SECRET')).toBeInTheDocument();
  });

  it('combina filtros de obrigatoriedade, categoria e pesquisa e mostra estado vazio', () => {
    renderSection();

    fireEvent.click(screen.getByRole('radio', { name: 'Obrigatórias' }));
    expect(screen.getByText(/14 de 48 variáveis/)).toBeInTheDocument();
    expect(screen.queryByText('MESSAGE_BATCH_WORKER_ENABLED')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('radio', { name: 'Opcionais' }));
    expect(screen.getByText(/34 de 48 variáveis/)).toBeInTheDocument();
    expect(screen.queryByText('AUTHENTICATION_JWT_SECRET')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Filtrar por categoria'), { target: { value: 'Message Batch' } });
    expect(screen.getByText(/7 de 48 variáveis/)).toBeInTheDocument();
    expect(screen.getByText('MESSAGE_BATCH_TIMEZONE')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Pesquisar por nome, descrição ou exemplo...'), {
      target: { value: 'timezone' },
    });
    expect(screen.getByText(/1 de 48 variáveis/)).toBeInTheDocument();
    expect(screen.getByText('MESSAGE_BATCH_TIMEZONE')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Pesquisar por nome, descrição ou exemplo...'), {
      target: { value: 'sem resultado' },
    });
    expect(screen.getByText('Nenhuma variável encontrada para os filtros selecionados.')).toBeInTheDocument();
  });

  it('renderiza dentro dos temas claro e escuro sem duplicar conteúdo para leitores de tela', () => {
    const { rerender } = render(
      <div className="documentation-app">
        <EnvironmentVariablesSection variables={environmentVariables} />
      </div>,
    );

    expect(screen.getAllByText('MESSAGE_BATCH_WORKER_ENABLED')).toHaveLength(1);

    rerender(
      <div className="dark">
        <div className="documentation-app">
          <EnvironmentVariablesSection variables={environmentVariables} />
        </div>
      </div>,
    );

    expect(screen.getAllByText('MESSAGE_BATCH_WORKER_ENABLED')).toHaveLength(1);
  });
});

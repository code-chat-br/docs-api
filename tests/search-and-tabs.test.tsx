import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { StatusTabs } from '@/components/api/status-tabs';
import { rankSearchEntries } from '@/features/search/search-index';

describe('global search', () => {
  it('filtra por todos os termos e prioriza o título', () => {
    const entries = [
      { title: 'Enviar mensagem', search: 'post message enviar mensagem remotejid' },
      { title: 'Listar instâncias', search: 'get instance listar instancias' },
    ];
    expect(rankSearchEntries(entries, 'post remotejid')).toEqual([entries[0]]);
  });
});

describe('StatusTabs', () => {
  it('expõe tabs acessíveis e troca o status selecionado', () => {
    const onChange = vi.fn();
    render(<StatusTabs statuses={['200', '401']} onChange={onChange} />);
    const unauthorized = screen.getByRole('tab', { name: '401' });

    fireEvent.click(unauthorized);

    expect(unauthorized).toHaveAttribute('aria-selected', 'true');
    expect(onChange).toHaveBeenCalledWith('401');
  });
});

import { useState } from 'react';
import type { FinanceSettings, Reserve, Transaction, TransactionType } from './types';
import { RESERVE_LABELS } from './types';
import { aplicarCascata } from './calc';
import { formatBRL } from './format';
import { TabBar, type Tab } from './components/TabBar';

interface LancarProps {
  settings: FinanceSettings;
  reservas: Reserve[];
  transacoes: Transaction[];
  onLancar: (input: {
    tipo: TransactionType;
    valor: number;
    categoria: string;
    contaId: string;
    fixo: boolean;
    diaVencimento?: number;
  }) => void;
  onEditarConta: (transacaoId: string, novaContaId: string) => void;
  onExcluir: (transacaoId: string) => void;
  onNavigate: (tab: Tab) => void;
}

function formatData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export function Lancar({ settings, reservas, transacoes, onLancar, onEditarConta, onExcluir, onNavigate }: LancarProps) {
  const [tipo, setTipo] = useState<TransactionType>('despesa');
  const [valorStr, setValorStr] = useState('');
  const [categoria, setCategoria] = useState('');
  const [contaId, setContaId] = useState(settings.contas[0]?.id ?? '');
  const [fixo, setFixo] = useState(false);
  const [diaVencimentoStr, setDiaVencimentoStr] = useState(String(new Date().getDate()));
  const [ultimaCascata, setUltimaCascata] = useState<ReturnType<typeof aplicarCascata> | null>(null);
  const [ultimoDiaVencimento, setUltimoDiaVencimento] = useState<number | null>(null);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editandoContaId, setEditandoContaId] = useState('');
  const [excluindoId, setExcluindoId] = useState<string | null>(null);

  function contaNome(id: string): string {
    return settings.contas.find((c) => c.id === id)?.nome ?? '—';
  }

  function iniciarEdicao(t: Transaction) {
    setEditandoId(t.id);
    setEditandoContaId(t.contaId);
    setExcluindoId(null);
  }

  function salvarEdicao(transacaoId: string) {
    onEditarConta(transacaoId, editandoContaId);
    setEditandoId(null);
  }

  function confirmarExclusao(transacaoId: string) {
    if (excluindoId !== transacaoId) {
      setExcluindoId(transacaoId);
      setEditandoId(null);
      return;
    }
    onExcluir(transacaoId);
    setExcluindoId(null);
  }

  const valor = parseFloat(valorStr.replace(',', '.')) || 0;
  const podeEnviar = valor > 0 && categoria.trim().length > 0 && contaId !== '';

  function handleSubmit() {
    if (!podeEnviar) return;
    if (tipo === 'receita') {
      setUltimaCascata(aplicarCascata(valor, settings, reservas));
    } else {
      setUltimaCascata(null);
    }
    const diaVencimento = fixo ? Math.min(31, Math.max(1, parseInt(diaVencimentoStr, 10) || 1)) : undefined;
    onLancar({ tipo, valor, categoria: categoria.trim(), contaId, fixo, diaVencimento });
    setUltimoDiaVencimento(tipo === 'receita' && fixo ? (diaVencimento ?? null) : null);
    setValorStr('');
    setCategoria('');
    setFixo(false);
  }

  if (settings.contas.length === 0) {
    return (
      <div className="app">
        <header className="app-header">
          <p className="app-title">Lançar</p>
        </header>
        <div className="step step--with-tabbar">
          <p className="step-helper">
            Cadastre ao menos uma conta na Fase 0 antes de lançar receitas e despesas.
          </p>
        </div>
        <TabBar active="lancar" onNavigate={onNavigate} />
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <p className="app-title">Lançar</p>
      </header>

      <div className="step step--with-tabbar">
        <div className="tipo-toggle">
          <button
            type="button"
            className={`tipo-toggle-btn ${tipo === 'despesa' ? 'active' : ''}`}
            onClick={() => setTipo('despesa')}
          >
            Despesa
          </button>
          <button
            type="button"
            className={`tipo-toggle-btn ${tipo === 'receita' ? 'active' : ''}`}
            onClick={() => setTipo('receita')}
          >
            Receita
          </button>
        </div>

        <div className="tipo-toggle">
          <button
            type="button"
            className={`tipo-toggle-btn ${!fixo ? 'active' : ''}`}
            onClick={() => setFixo(false)}
          >
            Avulso
          </button>
          <button type="button" className={`tipo-toggle-btn ${fixo ? 'active' : ''}`} onClick={() => setFixo(true)}>
            Fixo
          </button>
        </div>

        {fixo && (
          <div className="field">
            <label className="field-label" htmlFor="dia-vencimento-lancamento">
              {tipo === 'despesa' ? 'Dia do vencimento (todo mês)' : 'Dia esperado de recebimento (todo mês)'}
            </label>
            <input
              id="dia-vencimento-lancamento"
              className="plain-input numeric"
              type="number"
              inputMode="numeric"
              min={1}
              max={31}
              value={diaVencimentoStr}
              onChange={(e) => setDiaVencimentoStr(e.target.value)}
            />
            <p className="step-helper" style={{ marginTop: 8, marginBottom: 0, fontSize: 13 }}>
              {tipo === 'despesa'
                ? 'Vai para os fixos da Fase 0 — o Livre Real passa a descontar isso todo mês, mesmo antes de você lançar de novo.'
                : 'Só um lembrete, salvo nesse lançamento — ainda não altera a renda fixa da Fase 0 nem soma no Livre Real antes de cair de verdade.'}
            </p>
          </div>
        )}

        <div className="field">
          <label className="field-label" htmlFor="valor-lancamento">
            Valor
          </label>
          <div className="money-input-wrap">
            <span className="money-prefix">R$</span>
            <input
              id="valor-lancamento"
              className="money-input"
              type="number"
              inputMode="decimal"
              placeholder="0,00"
              value={valorStr}
              onChange={(e) => setValorStr(e.target.value)}
            />
          </div>
        </div>

        <div className="field">
          <label className="field-label" htmlFor="categoria-lancamento">
            Categoria
          </label>
          <input
            id="categoria-lancamento"
            className="plain-input"
            type="text"
            placeholder={tipo === 'receita' ? 'ex.: cliente X' : 'ex.: mercado'}
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
          />
        </div>

        <div className="field">
          <label className="field-label" htmlFor="conta-lancamento">
            Conta
          </label>
          <select
            id="conta-lancamento"
            className="plain-input"
            value={contaId}
            onChange={(e) => setContaId(e.target.value)}
          >
            {settings.contas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>

        <button type="button" className="btn btn-primary ask-btn" onClick={handleSubmit} disabled={!podeEnviar}>
          Lançar
        </button>

        {ultimaCascata && (
          <div className="veredito-card verde">
            <p className="veredito-title">Cascata aplicada</p>
            <p className="veredito-motivo">
              {formatBRL(ultimaCascata.liquido)} foram para a conta em {formatData(new Date().toISOString())}.
              {ultimoDiaVencimento != null && ` Recebimento fixo, esperado todo dia ${ultimoDiaVencimento}.`}
            </p>
            <p className="veredito-saida">
              Doação {formatBRL(ultimaCascata.doacao)} · Provisão {formatBRL(ultimaCascata.provisao)} ·
              Emergência {formatBRL(ultimaCascata.emergencia)} · Oportunidade{' '}
              {formatBRL(ultimaCascata.oportunidade)} · Colchão {formatBRL(ultimaCascata.colchao)}
            </p>
          </div>
        )}

        {transacoes.length > 0 && (
          <>
            <p className="step-helper" style={{ marginTop: 24, marginBottom: 0 }}>
              Últimos lançamentos
            </p>
            <div className="overview-list">
              {transacoes.slice(0, 8).map((t) => (
                <div className="transacao-item" key={t.id}>
                  <div className="overview-row overview-row--static overview-row--nested">
                    <span className="overview-row-title">
                      {formatData(t.data)} · {t.categoria}
                      {t.fixo && <span className="tag-fixo"> fixo</span>}
                      {t.fixo && t.diaVencimento != null && (
                        <span className="overview-row-sub">
                          {' '}
                          · {t.tipo === 'despesa' ? 'vence' : 'recebe'} todo dia {t.diaVencimento}
                        </span>
                      )}
                      {t.tipo === 'receita' && t.cascata && (
                        <span className="overview-row-sub">
                          {' '}
                          → {Object.entries(t.cascata)
                            .filter(([, v]) => (v ?? 0) > 0)
                            .map(([k, v]) => `${RESERVE_LABELS[k as keyof typeof RESERVE_LABELS]} ${formatBRL(v ?? 0)}`)
                            .join(' · ')}
                        </span>
                      )}
                    </span>
                    <span className={`overview-row-value ${t.tipo === 'receita' ? 'valor-receita' : 'valor-despesa'}`}>
                      {t.tipo === 'receita' ? '+' : '−'} {formatBRL(t.valor)}
                    </span>
                  </div>

                  {editandoId === t.id ? (
                    <div className="transacao-conta-row">
                      <select
                        className="plain-input"
                        value={editandoContaId}
                        onChange={(e) => setEditandoContaId(e.target.value)}
                      >
                        {settings.contas.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nome}
                          </option>
                        ))}
                      </select>
                      <button type="button" className="btn-chip" onClick={() => salvarEdicao(t.id)}>
                        Salvar
                      </button>
                      <button type="button" className="link-btn" onClick={() => setEditandoId(null)}>
                        Cancelar
                      </button>
                    </div>
                  ) : excluindoId === t.id ? (
                    <div className="transacao-conta-row">
                      <span className="transacao-conta-label">Excluir este lançamento?</span>
                      <button
                        type="button"
                        className="link-btn link-btn-danger"
                        onClick={() => confirmarExclusao(t.id)}
                      >
                        Confirmar
                      </button>
                      <button type="button" className="link-btn" onClick={() => setExcluindoId(null)}>
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <div className="transacao-conta-row">
                      <span className="transacao-conta-label">Conta: {contaNome(t.contaId)}</span>
                      <button type="button" className="link-btn" onClick={() => iniciarEdicao(t)}>
                        Editar conta
                      </button>
                      <button
                        type="button"
                        className="link-btn link-btn-danger"
                        onClick={() => confirmarExclusao(t.id)}
                      >
                        Excluir
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <TabBar active="lancar" onNavigate={onNavigate} />
    </div>
  );
}

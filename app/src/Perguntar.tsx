import { useState } from 'react';
import type { FinanceSettings, Reserve } from './types';
import { computeSnapshot, semaforoComprometido, tempoDeTrabalho, type Semaforo } from './calc';
import { formatBRL, formatNumber } from './format';
import { TabBar, type Tab } from './components/TabBar';

interface PerguntarProps {
  settings: FinanceSettings;
  reservas: Reserve[];
  onNavigate: (tab: Tab) => void;
}

interface Veredito {
  cor: Semaforo;
  motivo: string;
  saida: string | null;
  horas: number;
  dias: number;
}

function avaliar(settings: FinanceSettings, reservas: Reserve[], valor: number, parcelas: number): Veredito {
  const s = computeSnapshot(settings, reservas);
  const isAVista = parcelas <= 1;
  const parcela = valor / Math.max(parcelas, 1);
  const valorMes = isAVista ? valor : parcela; // impacto no Livre Real deste mês

  const reservaDisponivel = s.reservaEmergencia + s.reservaColchao;
  const excedente = Math.max(valorMes - s.livreReal, 0);
  const naoCabeDeTodoJeito = excedente > reservaDisponivel;
  const novaReserva = Math.max(reservaDisponivel - excedente, 0);
  const novaAutonomia = s.custoEssencial > 0 ? novaReserva / s.custoEssencial : 0;
  const metaMetade = s.metaAutonomiaMeses / 2;
  const autonomiaCritica = excedente > 0 && novaAutonomia < metaMetade;
  const autonomiaAbaixoMeta = excedente > 0 && novaAutonomia < s.metaAutonomiaMeses;

  const novoCompromisso = s.compromissoMensal + (isAVista ? 0 : parcela);
  const novoComprometidoPct = s.rendaTotalMedia > 0 ? (novoCompromisso / s.rendaTotalMedia) * 100 : 0;
  const comprometidoEstoura = !isAVista && semaforoComprometido(novoComprometidoPct) === 'vermelho';

  const { horas, dias } = tempoDeTrabalho(valor, s.taxaHorariaAlvo);

  const reservaMinima = metaMetade * s.custoEssencial;
  const excedenteMax = Math.max(reservaDisponivel - reservaMinima, 0);
  const valorMesMax = Math.max(s.livreReal + excedenteMax, 0);
  const parcelaMaxima = Math.max(0.3 * s.rendaTotalMedia - s.compromissoMensal, 0);

  if (naoCabeDeTodoJeito || autonomiaCritica || comprometidoEstoura) {
    let motivo: string;
    let saida: string;
    if (comprometidoEstoura) {
      motivo = `Sua renda comprometida sobe para ${formatNumber(novoComprometidoPct)}% — acima de 30%.`;
      saida =
        parcelaMaxima > 0
          ? `Cabe até ${formatBRL(parcelaMaxima * parcelas)} parcelado em ${parcelas}x (${formatBRL(parcelaMaxima)}/mês).`
          : 'Sua renda comprometida já está no limite — quite algo antes de parcelar de novo.';
    } else if (naoCabeDeTodoJeito) {
      motivo = 'Nem suas reservas de emergência e colchão cobrem esse valor.';
      saida = isAVista
        ? `Cabe até ${formatBRL(valorMesMax)} à vista.`
        : `Cabe até ${formatBRL(valorMesMax * parcelas)} parcelado em ${parcelas}x.`;
    } else {
      motivo = `Puxa ${formatBRL(excedente)} das reservas e deixa sua autonomia em ${formatNumber(novaAutonomia)} meses — abaixo da metade da meta.`;
      saida = isAVista
        ? `Cabe até ${formatBRL(valorMesMax)} à vista sem passar desse limite.`
        : `Cabe até ${formatBRL(valorMesMax * parcelas)} parcelado em ${parcelas}x.`;
    }
    return { cor: 'vermelho', motivo, saida, horas, dias };
  }

  if (autonomiaAbaixoMeta || (!isAVista && novoComprometidoPct >= 20)) {
    const motivo =
      excedente > 0
        ? `Cabe, mas puxa ${formatBRL(excedente)} das reservas — autonomia cai para ${formatNumber(novaAutonomia)} meses, abaixo da meta de ${formatNumber(s.metaAutonomiaMeses, 0)}.`
        : `Cabe, mas sua renda comprometida sobe para ${formatNumber(novoComprometidoPct)}% — entre 20% e 30%.`;
    return { cor: 'amarelo', motivo, saida: null, horas, dias };
  }

  const motivo = isAVista
    ? `Sobra ${formatBRL(s.livreReal - valor)} no Livre Real sem tocar nas reservas.`
    : `A parcela cabe no Livre Real sem tocar nas reservas, e a renda comprometida fica em ${formatNumber(novoComprometidoPct)}%.`;
  return { cor: 'verde', motivo, saida: null, horas, dias };
}

const VEREDITO_TITLE: Record<Semaforo, string> = {
  verde: 'Pode',
  amarelo: 'Pode, mas custa',
  vermelho: 'Não agora',
};

export function Perguntar({ settings, reservas, onNavigate }: PerguntarProps) {
  const [valorStr, setValorStr] = useState('');
  const [parcelasStr, setParcelasStr] = useState('1');
  const [resultado, setResultado] = useState<Veredito | null>(null);

  const valor = parseFloat(valorStr.replace(',', '.')) || 0;
  const parcelas = Math.max(1, parseInt(parcelasStr, 10) || 1);

  function handleSubmit() {
    if (valor <= 0) return;
    setResultado(avaliar(settings, reservas, valor, parcelas));
  }

  return (
    <div className="app">
      <header className="app-header">
        <p className="app-title">Posso comprar?</p>
      </header>

      <div className="step step--with-tabbar">
        <div className="field">
          <label className="field-label" htmlFor="valor-compra">
            Quanto custa
          </label>
          <div className="money-input-wrap">
            <span className="money-prefix">R$</span>
            <input
              id="valor-compra"
              className="money-input"
              type="number"
              inputMode="decimal"
              placeholder="0,00"
              value={valorStr}
              onChange={(e) => {
                setValorStr(e.target.value);
                setResultado(null);
              }}
            />
          </div>
        </div>

        <div className="field">
          <label className="field-label" htmlFor="parcelas-compra">
            Em quantas vezes (1 = à vista)
          </label>
          <input
            id="parcelas-compra"
            className="plain-input numeric"
            type="number"
            inputMode="numeric"
            min={1}
            value={parcelasStr}
            onChange={(e) => {
              setParcelasStr(e.target.value);
              setResultado(null);
            }}
          />
        </div>

        <button type="button" className="btn btn-primary ask-btn" onClick={handleSubmit} disabled={valor <= 0}>
          Avaliar
        </button>

        {resultado && (
          <div className={`veredito-card ${resultado.cor}`}>
            <p className="veredito-title">{VEREDITO_TITLE[resultado.cor]}</p>
            <p className="veredito-motivo">{resultado.motivo}</p>
            {resultado.saida && <p className="veredito-saida">{resultado.saida}</p>}
            {resultado.horas > 0 && (
              <p className="veredito-tempo">
                Custa {formatNumber(resultado.horas)}h de trabalho (~{formatNumber(resultado.dias)} dias).
              </p>
            )}
          </div>
        )}
      </div>

      <TabBar active="perguntar" onNavigate={onNavigate} />
    </div>
  );
}

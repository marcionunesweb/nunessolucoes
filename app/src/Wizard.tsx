import type { FinanceSettings, Debt, Installment, Account, AnnualCost, Recurring } from './types';
import { newId } from './storage';
import { StepShell } from './components/StepShell';
import { RepeatableList } from './components/RepeatableList';
import { MoneyField, NumberField, PercentSlider, TextField, InlineNumber } from './components/fields';
import { STEP_LABELS, TOTAL_STEPS } from './stepsMeta';
import { formatBRL } from './format';

interface WizardProps {
  settings: FinanceSettings;
  onChange: (patch: Partial<FinanceSettings>) => void;
  index: number;
  onBack: () => void;
  onNext: () => void;
  editMode?: boolean;
  onSaveAndReturn?: () => void;
}

export function Wizard({ settings, onChange, index, onBack, onNext, editMode, onSaveAndReturn }: WizardProps) {
  const shellProps = {
    index,
    total: TOTAL_STEPS,
    onBack: index > 0 ? onBack : undefined,
    onNext,
    nextLabel: index === TOTAL_STEPS - 1 ? (editMode ? 'Salvar' : 'Ver resumo') : 'Continuar',
    onSaveAndReturn: editMode ? onSaveAndReturn : undefined,
  };

  switch (index) {
    case 0:
      return (
        <StepShell
          {...shellProps}
          title="Custo essencial mensal"
          nextDisabled={settings.custoEssencial == null}
          helper={
            <>
              Quanto você precisa por mês para viver <strong>sem lazer nenhum</strong>. É o
              piso da sua sobrevivência — define quantos meses de autonomia suas reservas
              compram.
              <div className="helper-block">
                <span className="label">Entra:</span> moradia, contas de casa, mercado básico,
                transporte necessário, saúde, educação, ferramentas de trabalho essenciais.
              </div>
              <div className="helper-block">
                <span className="label">Não entra:</span> lazer, delivery, roupas, viagem,
                parcela de dívida (isso é contado à parte).
              </div>
            </>
          }
        >
          <MoneyField
            value={settings.custoEssencial}
            onChange={(v) => onChange({ custoEssencial: v })}
            autoFocus
          />
        </StepShell>
      );

    case 1:
      return (
        <StepShell
          {...shellProps}
          title="Renda fixa líquida — fonte 1"
          helper="O que entra todo mês, garantido, já líquido de impostos e descontos. Se você só tem renda variável, deixe em branco."
        >
          <MoneyField
            value={settings.rendaFixa1}
            onChange={(v) => onChange({ rendaFixa1: v })}
            autoFocus
          />
        </StepShell>
      );

    case 2:
      return (
        <StepShell
          {...shellProps}
          title="Renda fixa líquida — fonte 2"
          helper="Uma segunda fonte fixa (outro contrato, aposentadoria, aluguel recebido). Deixe em branco se não existir."
        >
          <MoneyField
            value={settings.rendaFixa2}
            onChange={(v) => onChange({ rendaFixa2: v })}
            autoFocus
          />
        </StepShell>
      );

    case 3:
      return (
        <StepShell
          {...shellProps}
          title="Média da renda variável"
          helper="A média líquida dos seus últimos 3 meses de trabalho variável (freelas, serviços, projetos). É o número que, somado às fontes fixas, financia o mês."
        >
          <MoneyField
            value={settings.mediaVariavel}
            onChange={(v) => onChange({ mediaVariavel: v })}
            autoFocus
          />
        </StepShell>
      );

    case 4:
      return (
        <StepShell
          {...shellProps}
          title="Horas realmente trabalhadas por mês"
          helper="Inclua tudo: execução, proposta, revisão, cobrança, administrativo. É a base da sua taxa horária real — a que revela quanto uma compra custa em tempo de vida."
        >
          <NumberField
            value={settings.horasTrabalhadas}
            onChange={(v) => onChange({ horasTrabalhadas: v })}
            suffix="h / mês"
            autoFocus
          />
        </StepShell>
      );

    case 5: {
      const rendaTotal =
        (settings.rendaFixa1 ?? 0) + (settings.rendaFixa2 ?? 0) + (settings.mediaVariavel ?? 0);
      const sugestao =
        settings.horasTrabalhadas && settings.horasTrabalhadas > 0
          ? rendaTotal / settings.horasTrabalhadas
          : null;
      return (
        <StepShell
          {...shellProps}
          title="Taxa horária alvo"
          helper={
            <>
              Quanto você quer que cada hora sua valha. É o valor usado para converter todo
              preço em tempo de vida.
              {sugestao != null && sugestao > 0 && (
                <div className="helper-block">
                  <span className="label">Sua taxa atual (real):</span> {formatBRL(sugestao)}/h,
                  com base no que você já informou.
                </div>
              )}
            </>
          }
        >
          <MoneyField
            value={settings.taxaHorariaAlvo}
            onChange={(v) => onChange({ taxaHorariaAlvo: v })}
            suffix="/ hora"
            autoFocus
          />
        </StepShell>
      );
    }

    case 6:
      return (
        <StepShell
          {...shellProps}
          title="Pró-labore fixo mensal"
          helper="O valor que você se paga todo mês, igual, mesmo em mês bom. O excedente da renda variável vira colchão — não vira gasto do mês."
        >
          <MoneyField
            value={settings.proLabore}
            onChange={(v) => onChange({ proLabore: v })}
            autoFocus
          />
        </StepShell>
      );

    case 7:
      return (
        <StepShell
          {...shellProps}
          title="Repasse pessoal mensal"
          helper="Se parte da renda do casal é repassada a outra pessoa como um valor fixo mensal (sem rastrear item a item), o valor entra aqui como uma despesa fixa. Deixe em branco se não se aplica."
        >
          <MoneyField
            value={settings.repassePessoal}
            onChange={(v) => onChange({ repassePessoal: v })}
            autoFocus
          />
        </StepShell>
      );

    case 8:
      return (
        <StepShell
          {...shellProps}
          title="Dívidas"
          helper="Toda dívida ativa fora do cartão: empréstimo, financiamento, parcelamento em loja. É a base do simulador de quitação e da estratégia avalanche vs. bola de neve."
        >
          <RepeatableList<Debt>
            items={settings.dividas}
            onChange={(dividas) => onChange({ dividas })}
            makeNew={() => ({ id: newId(), nome: '', saldo: 0, taxaMensal: 0, parcelasRestantes: 0 })}
            emptyHint="Nenhuma dívida cadastrada."
            addLabel="+ Adicionar dívida"
            renderItem={(item, update) => (
              <>
                <div className="list-item-row">
                  <TextField
                    label="Nome"
                    value={item.nome}
                    onChange={(v) => update({ nome: v })}
                    placeholder="Empréstimo, financiamento…"
                  />
                </div>
                <div className="list-item-row">
                  <InlineNumber
                    label="Saldo devedor (R$)"
                    value={item.saldo || null}
                    onChange={(v) => update({ saldo: v ?? 0 })}
                  />
                  <InlineNumber
                    label="Taxa mensal (%)"
                    value={item.taxaMensal || null}
                    onChange={(v) => update({ taxaMensal: v ?? 0 })}
                  />
                  <InlineNumber
                    label="Parcelas restantes"
                    value={item.parcelasRestantes || null}
                    onChange={(v) => update({ parcelasRestantes: v ?? 0 })}
                  />
                </div>
              </>
            )}
          />
        </StepShell>
      );

    case 9:
      return (
        <StepShell
          {...shellProps}
          title="Parcelamentos ativos no cartão"
          helper="Cada compra parcelada que ainda está rodando. É o que revela sua renda comprometida real — o cartão não avalia parcela, avalia quanto do seu futuro já foi vendido."
        >
          <RepeatableList<Installment>
            items={settings.parcelamentos}
            onChange={(parcelamentos) => onChange({ parcelamentos })}
            makeNew={() => ({ id: newId(), descricao: '', valorParcela: 0, parcelasRestantes: 0 })}
            emptyHint="Nenhum parcelamento ativo."
            addLabel="+ Adicionar parcelamento"
            renderItem={(item, update) => (
              <>
                <div className="list-item-row">
                  <TextField
                    label="Descrição"
                    value={item.descricao}
                    onChange={(v) => update({ descricao: v })}
                    placeholder="Notebook, viagem…"
                  />
                </div>
                <div className="list-item-row">
                  <InlineNumber
                    label="Valor da parcela (R$)"
                    value={item.valorParcela || null}
                    onChange={(v) => update({ valorParcela: v ?? 0 })}
                  />
                  <InlineNumber
                    label="Parcelas restantes"
                    value={item.parcelasRestantes || null}
                    onChange={(v) => update({ parcelasRestantes: v ?? 0 })}
                  />
                </div>
              </>
            )}
          />
        </StepShell>
      );

    case 10:
      return (
        <StepShell
          {...shellProps}
          title="Contas e saldos"
          helper="Saldo atual de cada conta, carteira ou reserva onde seu dinheiro está guardado hoje. É o ponto de partida do Livre Real e da autonomia."
        >
          <RepeatableList<Account>
            items={settings.contas}
            onChange={(contas) => onChange({ contas })}
            makeNew={() => ({ id: newId(), nome: '', saldo: 0 })}
            emptyHint="Nenhuma conta cadastrada."
            addLabel="+ Adicionar conta"
            renderItem={(item, update) => (
              <div className="list-item-row">
                <TextField
                  label="Conta"
                  value={item.nome}
                  onChange={(v) => update({ nome: v })}
                  placeholder="Conta corrente, carteira…"
                />
                <InlineNumber
                  label="Saldo (R$)"
                  value={item.saldo || null}
                  onChange={(v) => update({ saldo: v ?? 0 })}
                />
              </div>
            )}
          />
        </StepShell>
      );

    case 11:
      return (
        <StepShell
          {...shellProps}
          title="Gasto pessoal livre"
          helper="O quanto da sua renda já recebida no mês você pode gastar sem pedir satisfação a ninguém — nem ao app. Cresce e encolhe junto com o que você realmente fatura."
        >
          <PercentSlider
            value={settings.pctPessoal}
            onChange={(v) => onChange({ pctPessoal: v })}
            min={3}
            max={15}
            defaultValue={6}
          />
        </StepShell>
      );

    case 12:
      return (
        <StepShell
          {...shellProps}
          title="Meta de reserva de emergência"
          helper="Em quantos meses de custo essencial você quer estar coberto. É a meta da sua Autonomia — 6 meses é o padrão recomendado para renda mista."
        >
          <NumberField
            value={settings.metaEmergenciaMeses}
            onChange={(v) => onChange({ metaEmergenciaMeses: v })}
            suffix="meses"
            autoFocus
          />
        </StepShell>
      );

    case 13:
      return (
        <StepShell
          {...shellProps}
          title="Metas de oportunidade e doação"
          helper="Quanto você quer manter em cada reserva. Oportunidade é o que te deixa dizer sim sem culpa; Doação é o compromisso que sai antes de você ver o dinheiro."
        >
          <MoneyField
            label="Reserva de Oportunidade"
            value={settings.metaOportunidadeValor}
            onChange={(v) => onChange({ metaOportunidadeValor: v })}
            autoFocus
          />
          <MoneyField
            label="Reserva de Doação"
            value={settings.metaDoacaoValor}
            onChange={(v) => onChange({ metaDoacaoValor: v })}
          />
        </StepShell>
      );

    case 14: {
      const doacao = settings.cascataDoacaoPct ?? 0;
      const provisoes = settings.cascataProvisoesPct ?? 0;
      const reservas = settings.cascataReservasPct ?? 0;
      const soma = doacao + provisoes + reservas;
      const sobra = 100 - soma;
      return (
        <StepShell
          {...shellProps}
          title="Cascata de entrada"
          helper="A fatia de toda receita que sai antes de virar mês corrente — na ordem abaixo, assim que o dinheiro entra. É o que impede a sobra de se dissolver no mês seguinte."
        >
          <PercentSlider
            value={settings.cascataDoacaoPct}
            onChange={(v) => onChange({ cascataDoacaoPct: v })}
            min={0}
            max={30}
            defaultValue={10}
          />
          <p className="field-label" style={{ marginTop: -8, marginBottom: 18 }}>
            Doação
          </p>

          <PercentSlider
            value={settings.cascataProvisoesPct}
            onChange={(v) => onChange({ cascataProvisoesPct: v })}
            min={0}
            max={20}
            defaultValue={5}
          />
          <p className="field-label" style={{ marginTop: -8, marginBottom: 18 }}>
            Provisões (IPVA, IPTU, seguros, impostos)
          </p>

          <PercentSlider
            value={settings.cascataReservasPct}
            onChange={(v) => onChange({ cascataReservasPct: v })}
            min={0}
            max={40}
            defaultValue={15}
          />
          <p className="field-label" style={{ marginTop: -8, marginBottom: 8 }}>
            Reservas (emergência + oportunidade + colchão)
          </p>

          <p
            className="summary-note"
            style={{ color: sobra < 0 ? 'var(--vermelho)' : undefined }}
          >
            {sobra < 0
              ? `Soma ${soma}% — passa de 100%, não sobra nada para o mês corrente.`
              : `Sobram ${sobra}% para o mês corrente.`}
          </p>
        </StepShell>
      );
    }

    case 15:
      return (
        <StepShell
          {...shellProps}
          title="Custos anuais a provisionar"
          helper="IPVA, IPTU, seguros, imposto de renda — tudo que cai uma vez por ano e costuma pegar de surpresa. O app rateia por 12 e já desconta do Livre Real todo mês."
        >
          <RepeatableList<AnnualCost>
            items={settings.custosAnuais}
            onChange={(custosAnuais) => onChange({ custosAnuais })}
            makeNew={() => ({ id: newId(), nome: '', valorAnual: 0 })}
            emptyHint="Nenhum custo anual cadastrado."
            addLabel="+ Adicionar custo anual"
            renderItem={(item, update) => (
              <div className="list-item-row">
                <TextField
                  label="Custo"
                  value={item.nome}
                  onChange={(v) => update({ nome: v })}
                  placeholder="IPVA, seguro…"
                />
                <InlineNumber
                  label="Valor anual (R$)"
                  value={item.valorAnual || null}
                  onChange={(v) => update({ valorAnual: v ?? 0 })}
                />
              </div>
            )}
          />
        </StepShell>
      );

    case 16:
      return (
        <StepShell
          {...shellProps}
          title="Fixos mensais com vencimento"
          helper="Contas com dia certo para vencer: aluguel, internet, academia, assinaturas. É o que falta pro Livre Real saber o que ainda vai sair da conta neste mês — depois do dia de vencimento, o app assume que já foi pago."
        >
          <RepeatableList<Recurring>
            items={settings.recorrentes}
            onChange={(recorrentes) => onChange({ recorrentes })}
            makeNew={() => ({ id: newId(), nome: '', valor: 0, diaVencimento: 1 })}
            emptyHint="Nenhum fixo cadastrado."
            addLabel="+ Adicionar fixo"
            renderItem={(item, update) => (
              <div className="list-item-row">
                <TextField
                  label="Conta"
                  value={item.nome}
                  onChange={(v) => update({ nome: v })}
                  placeholder="Aluguel, internet…"
                />
                <InlineNumber
                  label="Valor (R$)"
                  value={item.valor || null}
                  onChange={(v) => update({ valor: v ?? 0 })}
                />
                <InlineNumber
                  label="Dia do vencimento"
                  value={item.diaVencimento || null}
                  onChange={(v) => update({ diaVencimento: Math.min(31, Math.max(1, v ?? 1)) })}
                />
              </div>
            )}
          />
        </StepShell>
      );

    default:
      return null;
  }
}

export { STEP_LABELS };

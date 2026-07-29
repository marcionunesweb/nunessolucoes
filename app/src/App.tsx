import { useEffect, useState } from 'react';
import type { FinanceSettings, Ledger, TransactionType } from './types';
import { loadSettings, saveSettings, loadLedger, saveLedger, newId } from './storage';
import { aplicarCascata, aplicarCascataAoLedger } from './calc';
import { Wizard } from './Wizard';
import { Summary } from './Summary';
import { Hoje } from './Hoje';
import { Perguntar } from './Perguntar';
import { Lancar } from './Lancar';
import { Reservas } from './Reservas';
import { Dividas } from './Dividas';
import { TOTAL_STEPS } from './stepsMeta';
import type { Tab } from './components/TabBar';

type Screen = 'wizard' | Tab;

function jaConfigurado(settings: FinanceSettings): boolean {
  return settings.custoEssencial != null;
}

function App() {
  const [settings, setSettings] = useState<FinanceSettings>(() => loadSettings());
  const [ledger, setLedger] = useState<Ledger>(() => loadLedger());
  const [screen, setScreen] = useState<Screen>(() => (jaConfigurado(loadSettings()) ? 'hoje' : 'wizard'));
  const [stepIndex, setStepIndex] = useState(0);
  const [editReturnTo, setEditReturnTo] = useState<Tab | null>(null);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    saveLedger(ledger);
  }, [ledger]);

  function handleChange(patch: Partial<FinanceSettings>) {
    setSettings((prev) => ({ ...prev, ...patch }));
  }

  function handleNext() {
    if (editReturnTo) {
      setScreen(editReturnTo);
      setEditReturnTo(null);
      return;
    }
    if (stepIndex < TOTAL_STEPS - 1) {
      setStepIndex((i) => i + 1);
    } else {
      setScreen('summary');
    }
  }

  function handleBack() {
    setStepIndex((i) => Math.max(0, i - 1));
  }

  function handleEditStep(index: number, from: Tab) {
    setStepIndex(index);
    setEditReturnTo(from);
    setScreen('wizard');
  }

  function handleNavigate(tab: Tab) {
    setScreen(tab);
  }

  function handleLancar(input: { tipo: TransactionType; valor: number; categoria: string; contaId: string }) {
    const id = newId();
    const data = new Date().toISOString();

    if (input.tipo === 'despesa') {
      setSettings((prev) => ({
        ...prev,
        contas: prev.contas.map((c) => (c.id === input.contaId ? { ...c, saldo: c.saldo - input.valor } : c)),
      }));
      setLedger((prev) => ({
        ...prev,
        transacoes: [
          { id, data, tipo: 'despesa', valor: input.valor, categoria: input.categoria, contaId: input.contaId },
          ...prev.transacoes,
        ],
      }));
      return;
    }

    const resultado = aplicarCascata(input.valor, settings, ledger.reservas);
    setSettings((prev) => ({
      ...prev,
      contas: prev.contas.map((c) => (c.id === input.contaId ? { ...c, saldo: c.saldo + resultado.liquido } : c)),
    }));
    setLedger((prev) => ({
      reservas: aplicarCascataAoLedger(prev.reservas, resultado),
      transacoes: [
        {
          id,
          data,
          tipo: 'receita',
          valor: input.valor,
          categoria: input.categoria,
          contaId: input.contaId,
          cascata: {
            doacao: resultado.doacao,
            provisao: resultado.provisao,
            emergencia: resultado.emergencia,
            oportunidade: resultado.oportunidade,
            colchao: resultado.colchao,
          },
        },
        ...prev.transacoes,
      ],
    }));
  }

  if (screen === 'wizard') {
    return (
      <Wizard
        settings={settings}
        onChange={handleChange}
        index={stepIndex}
        onBack={handleBack}
        onNext={handleNext}
        editMode={editReturnTo != null}
      />
    );
  }

  if (screen === 'summary') {
    return (
      <Summary
        settings={settings}
        reservas={ledger.reservas}
        onEditStep={(i) => handleEditStep(i, 'summary')}
        onNavigate={handleNavigate}
      />
    );
  }

  if (screen === 'perguntar') {
    return <Perguntar settings={settings} reservas={ledger.reservas} onNavigate={handleNavigate} />;
  }

  if (screen === 'lancar') {
    return (
      <Lancar
        settings={settings}
        reservas={ledger.reservas}
        transacoes={ledger.transacoes}
        onLancar={handleLancar}
        onNavigate={handleNavigate}
      />
    );
  }

  if (screen === 'reservas') {
    return (
      <Reservas
        settings={settings}
        reservas={ledger.reservas}
        onChangeReservas={(reservas) => setLedger((prev) => ({ ...prev, reservas }))}
        onNavigate={handleNavigate}
      />
    );
  }

  if (screen === 'dividas') {
    return (
      <Dividas settings={settings} onEditStep={(i) => handleEditStep(i, 'dividas')} onNavigate={handleNavigate} />
    );
  }

  return (
    <Hoje
      settings={settings}
      reservas={ledger.reservas}
      onAskToBuy={() => setScreen('perguntar')}
      onNavigate={handleNavigate}
    />
  );
}

export default App;

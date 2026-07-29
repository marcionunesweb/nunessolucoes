import { useEffect, useState } from 'react';
import type { FinanceSettings } from './types';
import { loadSettings, saveSettings } from './storage';
import { Wizard } from './Wizard';
import { Summary } from './Summary';
import { Hoje } from './Hoje';
import { Perguntar } from './Perguntar';
import { TOTAL_STEPS } from './stepsMeta';
import type { Tab } from './components/TabBar';

type Screen = 'wizard' | 'summary' | 'hoje' | 'perguntar';

function jaConfigurado(settings: FinanceSettings): boolean {
  return settings.custoEssencial != null;
}

function App() {
  const [settings, setSettings] = useState<FinanceSettings>(() => loadSettings());
  const [screen, setScreen] = useState<Screen>(() => (jaConfigurado(loadSettings()) ? 'hoje' : 'wizard'));
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  function handleChange(patch: Partial<FinanceSettings>) {
    setSettings((prev) => ({ ...prev, ...patch }));
  }

  function handleNext() {
    if (stepIndex < TOTAL_STEPS - 1) {
      setStepIndex((i) => i + 1);
    } else {
      setScreen('summary');
    }
  }

  function handleBack() {
    setStepIndex((i) => Math.max(0, i - 1));
  }

  function handleEditStep(index: number) {
    setStepIndex(index);
    setScreen('wizard');
  }

  function handleNavigate(tab: Tab) {
    setScreen(tab);
  }

  if (screen === 'wizard') {
    return (
      <Wizard
        settings={settings}
        onChange={handleChange}
        index={stepIndex}
        onBack={handleBack}
        onNext={handleNext}
      />
    );
  }

  if (screen === 'summary') {
    return <Summary settings={settings} onEditStep={handleEditStep} onNavigate={handleNavigate} />;
  }

  if (screen === 'perguntar') {
    return <Perguntar settings={settings} onNavigate={handleNavigate} />;
  }

  return <Hoje settings={settings} onAskToBuy={() => setScreen('perguntar')} onNavigate={handleNavigate} />;
}

export default App;

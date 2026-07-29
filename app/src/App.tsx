import { useEffect, useState } from 'react';
import type { FinanceSettings } from './types';
import { loadSettings, saveSettings } from './storage';
import { Wizard } from './Wizard';
import { Summary } from './Summary';
import { TOTAL_STEPS } from './stepsMeta';

type Screen = 'wizard' | 'summary';

function App() {
  const [settings, setSettings] = useState<FinanceSettings>(() => loadSettings());
  const [screen, setScreen] = useState<Screen>('wizard');
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

  if (screen === 'summary') {
    return <Summary settings={settings} onEditStep={handleEditStep} />;
  }

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

export default App;

export type Tab = 'hoje' | 'perguntar' | 'summary';

interface TabBarProps {
  active: Tab;
  onNavigate: (tab: Tab) => void;
}

const TABS: { key: Tab; label: string }[] = [
  { key: 'hoje', label: 'Hoje' },
  { key: 'perguntar', label: 'Perguntar' },
  { key: 'summary', label: 'Fase 0' },
];

export function TabBar({ active, onNavigate }: TabBarProps) {
  return (
    <nav className="tab-bar" aria-label="Navegação principal">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          type="button"
          className={`tab-bar-btn ${active === tab.key ? 'active' : ''}`}
          onClick={() => onNavigate(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}

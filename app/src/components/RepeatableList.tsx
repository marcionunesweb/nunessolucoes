import type { ReactNode } from 'react';

interface RepeatableListProps<T extends { id: string }> {
  items: T[];
  onChange: (items: T[]) => void;
  makeNew: () => T;
  renderItem: (item: T, update: (patch: Partial<T>) => void) => ReactNode;
  emptyHint: string;
  addLabel: string;
}

export function RepeatableList<T extends { id: string }>({
  items,
  onChange,
  makeNew,
  renderItem,
  emptyHint,
  addLabel,
}: RepeatableListProps<T>) {
  function updateItem(id: string, patch: Partial<T>) {
    onChange(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }

  function removeItem(id: string) {
    onChange(items.filter((it) => it.id !== id));
  }

  function addItem() {
    onChange([...items, makeNew()]);
  }

  return (
    <div>
      {items.length === 0 && <p className="empty-hint">{emptyHint}</p>}

      {items.map((item) => (
        <div className="list-item" key={item.id}>
          {renderItem(item, (patch) => updateItem(item.id, patch))}
          <button className="remove-btn" type="button" onClick={() => removeItem(item.id)}>
            Remover
          </button>
        </div>
      ))}

      <button className="add-btn" type="button" onClick={addItem}>
        {addLabel}
      </button>
    </div>
  );
}

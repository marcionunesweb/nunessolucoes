import type { ChangeEvent } from 'react';

interface MoneyFieldProps {
  label?: string;
  value: number | null;
  onChange: (value: number | null) => void;
  suffix?: string;
  autoFocus?: boolean;
  placeholder?: string;
}

export function MoneyField({ label, value, onChange, suffix, autoFocus, placeholder }: MoneyFieldProps) {
  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    if (raw === '') {
      onChange(null);
      return;
    }
    const n = Number(raw.replace(',', '.'));
    onChange(Number.isNaN(n) ? null : n);
  }

  return (
    <div className="field">
      {label && <label className="field-label">{label}</label>}
      <div className="money-input-wrap">
        <span className="money-prefix">R$</span>
        <input
          className="money-input"
          type="number"
          inputMode="decimal"
          min={0}
          step="0.01"
          placeholder={placeholder ?? '0,00'}
          value={value ?? ''}
          onChange={handleChange}
          autoFocus={autoFocus}
        />
        {suffix && <span className="money-suffix">{suffix}</span>}
      </div>
    </div>
  );
}

interface NumberFieldProps {
  label?: string;
  value: number | null;
  onChange: (value: number | null) => void;
  suffix?: string;
  autoFocus?: boolean;
  placeholder?: string;
  min?: number;
  step?: number;
}

export function NumberField({
  label,
  value,
  onChange,
  suffix,
  autoFocus,
  placeholder,
  min = 0,
  step = 1,
}: NumberFieldProps) {
  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    if (raw === '') {
      onChange(null);
      return;
    }
    const n = Number(raw.replace(',', '.'));
    onChange(Number.isNaN(n) ? null : n);
  }

  return (
    <div className="field">
      {label && <label className="field-label">{label}</label>}
      <div className="money-input-wrap">
        <input
          className="money-input"
          type="number"
          inputMode="decimal"
          min={min}
          step={step}
          placeholder={placeholder ?? '0'}
          value={value ?? ''}
          onChange={handleChange}
          autoFocus={autoFocus}
        />
        {suffix && <span className="money-suffix">{suffix}</span>}
      </div>
    </div>
  );
}

interface PercentSliderProps {
  value: number | null;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  defaultValue: number;
}

export function PercentSlider({ value, onChange, min, max, step = 1, defaultValue }: PercentSliderProps) {
  const current = value ?? defaultValue;
  return (
    <div className="field">
      <div className="percent-value">
        {current}
        <span>%</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={current}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <div className="range-scale">
        <span>{min}%</span>
        <span>{max}%</span>
      </div>
    </div>
  );
}

interface TextFieldProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function TextField({ label, value, onChange, placeholder }: TextFieldProps) {
  return (
    <div className="list-item-field">
      {label && <label>{label}</label>}
      <input
        className="plain-input"
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

interface InlineNumberProps {
  label?: string;
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder?: string;
}

export function InlineNumber({ label, value, onChange, placeholder }: InlineNumberProps) {
  return (
    <div className="list-item-field">
      {label && <label>{label}</label>}
      <input
        className="plain-input numeric"
        type="number"
        inputMode="decimal"
        min={0}
        step="0.01"
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === '') return onChange(null);
          const n = Number(raw.replace(',', '.'));
          onChange(Number.isNaN(n) ? null : n);
        }}
      />
    </div>
  );
}

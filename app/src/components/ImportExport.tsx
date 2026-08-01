import { useRef, useState, type ChangeEvent } from 'react';
import { parseImportPayload, type ImportResult } from '../storage';

interface ImportExportProps {
  onExport: () => void;
  onImport: (payload: ImportResult) => void;
}

export function ImportExport({ onExport, onImport }: ImportExportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<ImportResult | null>(null);
  const [erro, setErro] = useState(false);

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const payload = parseImportPayload(String(reader.result));
      if (!payload) {
        setErro(true);
        setPending(null);
        return;
      }
      setErro(false);
      setPending(payload);
    };
    reader.readAsText(file);
  }

  function confirmar() {
    if (!pending) return;
    onImport(pending);
    setPending(null);
  }

  return (
    <div className="summary-card">
      <p className="summary-label">Backup</p>
      <p className="summary-note" style={{ marginTop: 0 }}>
        Exporta um arquivo com tudo o que está salvo neste aparelho — Fase 0, reservas e
        lançamentos. Serve para levar seus dados para outro aparelho, ou para guardar uma cópia.
      </p>

      <div className="reserve-form" style={{ marginTop: 12 }}>
        <button type="button" className="btn-chip" onClick={onExport}>
          Exportar dados
        </button>
        <button type="button" className="btn-chip" onClick={() => fileInputRef.current?.click()}>
          Importar dados
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {erro && <p className="reserve-warning">Arquivo inválido — não parece um backup deste app.</p>}

      {pending && (
        <div className="veredito-card vermelho" style={{ marginTop: 12 }}>
          <p className="veredito-title">Confirmar importação</p>
          <p className="veredito-motivo">
            {pending.exportedAt
              ? `Backup de ${new Date(pending.exportedAt).toLocaleDateString('pt-BR')}. `
              : ''}
            Isso substitui TODOS os dados salvos neste aparelho agora — Fase 0, reservas e
            lançamentos. Não tem como desfazer.
          </p>
          <div className="reserve-form">
            <button type="button" className="btn-chip btn-chip-danger" onClick={confirmar}>
              Confirmar e substituir
            </button>
            <button type="button" className="link-btn" onClick={() => setPending(null)}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

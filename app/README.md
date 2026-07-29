# Assistente Financeiro — app

PWA em React + Vite + TypeScript. Ainda na Fase 0: a única tela funcional hoje é o
assistente de configuração inicial (os 16 números descritos em `../PLANO.md`, §18).

Sem backend por enquanto — os dados ficam no `localStorage` do navegador.

## Rodando localmente

```bash
npm install
npm run dev       # servidor de desenvolvimento
npm run build     # build de produção em dist/
npm run preview   # serve o build de produção
npm run lint      # oxlint
```

## Estrutura

- `src/types.ts` — modelo de dados da Fase 0 (`FinanceSettings`)
- `src/storage.ts` — persistência em `localStorage`
- `src/Wizard.tsx` — os 16 passos de configuração, um número por tela
- `src/Summary.tsx` — resumo calculado (meta variável do mês, renda comprometida,
  autonomia provisória, cascata de entrada) com atalho para editar qualquer passo
- `src/App.tsx` — estado do wizard e roteamento entre wizard/resumo
- `src/components/` — campos de formulário e lista repetível genéricos

Ver `../PLANO.md` para o escopo completo do produto (fórmulas, semáforo, telas futuras).

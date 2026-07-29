# Assistente Financeiro — Plano do Produto

> Documento de escopo. Nenhuma linha de código foi escrita ainda.
> Última revisão: julho/2026

---

## 1. O que é

> Um conselheiro que responde **"posso comprar isso?"** com um veredito, um motivo
> e uma alternativa — traduzindo dinheiro em **tempo de trabalho** e em **risco**.

Não é um app de registro de despesas. Registrar gasto é meio, não fim.
O produto existe para dar uma resposta na hora da decisão.

**Critério de corte:** tudo que não serve a essa frase fica fora do MVP.

### O problema real

- Insegurança recorrente na hora de comprar ("posso ou não posso?").
- Dificuldade de avaliar se vale pegar um serviço pelo valor × tempo que consome.
- Renda mista (fixa + variável), o que torna o saldo do banco um péssimo indicador.
- Parcelamento no cartão comprometendo meses futuros sem visibilidade.
- Sobra de um mês se dissolvendo no consumo do mês seguinte.
- Falta de reservas separadas por propósito.

---

## 2. Perfil e decisões travadas

| Item | Definição |
|---|---|
| Renda | Fixa + variável |
| Gestão | **Um único usuário** (a segunda renda entra como fonte, não como sócia) |
| Uso principal | Celular |
| Cartão parcelado | É parte central do problema → módulo obrigatório no MVP |
| Tom do conselheiro | Direto e duro |
| Dados | Sincronizados entre celular e desktop |
| Limite de gasto pessoal | **Percentual da renda líquida realizada no mês** |

---

## 3. Métrica-mestra: Meses de Autonomia

Risco precisa de unidade. A unidade é tempo de sobrevivência.

```
AUTONOMIA = (reserva de emergência + colchão de sobras) ÷ custo essencial mensal
```

Resultado em **meses**. Todo gasto passa a ter leitura de risco automática:

> "Esse notebook de R$ 4.800 derruba sua autonomia de **3,4 → 2,1 meses**.
> É a diferença entre poder recusar um cliente ruim e ter que aceitar."

---

## 4. Livre Real — o número que autoriza a compra

O saldo do banco mente. O número que vale é:

```
   saldo em conta
−  fixos do mês ainda não pagos
−  parcelas de dívidas do mês
−  fatura do cartão em aberto
−  aportes-alvo das reservas do mês
−  provisão rateada de anuais (IPVA, IPTU, seguro, impostos)
=  LIVRE REAL
```

É o único número grande na tela inicial.

---

## 5. Renda mista: a Meta Variável do Mês

```
   custo essencial mensal            R$ 6.400
−  renda fixa líquida (todas fontes) R$ 4.100
=  META VARIÁVEL DO MÊS              R$ 2.300   ← quanto precisa faturar
```

Fica na tela inicial ao lado do Livre Real, e alimenta o avaliador de propostas:
quando aparece um job, o app já sabe se ele fecha o mês.

**Pró-labore fixo:** você se paga o mesmo valor todo mês, inclusive em mês bom.
O excedente vai para o Colchão de Sobras, que cobre os meses fracos.
É o mecanismo que transforma renda instável em vida estável.

---

## 6. O veredito (semáforo)

Toda consulta devolve **três coisas**: veredito, custo real, caminho.

- 🟢 **Pode** — "Sobram R$ 1.240 e sua autonomia continua em 3,4 meses. Custa 6h de trabalho."
- 🟡 **Pode, mas custa** — "Sua reserva cai de 4,2 → 3,6 meses. 2 dias de trabalho. Se esperar 11 dias (entrada do cliente Z), vira verde."
- 🔴 **Não agora** — "Invade a emergência e deixa a parcela do dia 20 descoberta. **Cabe até R$ 340**, ou cabe inteiro a partir de 05/08."

### Regras de classificação

```
VERDE    : cabe no Livre Real
           E autonomia permanece ≥ meta
           E renda comprometida < 20%

AMARELO  : cabe, mas derruba a autonomia abaixo da meta
           OU empurra a renda comprometida para 20–30%

VERMELHO : não cabe no Livre Real
           OU invade a reserva de emergência
           OU deixa algum mês dos próximos 12 negativo
           OU renda comprometida > 30%
```

**Regra de ouro:** vermelho nunca é só "não". Sempre acompanha "não agora, mas assim
sim" — valor que caberia hoje, ou data em que a compra fica verde.

---

## 7. Custo em tempo

```
TAXA HORÁRIA REAL = receita líquida média dos últimos 3 meses
                    ÷ horas realmente trabalhadas
                      (incluindo proposta, revisão, cobrança, administrativo)
```

Todo preço exibido no app carrega a conversão: `R$ 1.200 = 14h = 2 dias`.

---

## 8. Avaliador de proposta de serviço

**Entrada:** valor, horas estimadas, prazo de entrega, prazo de pagamento, custos diretos.

**Saída:**

- **R$/hora efetivo** vs. taxa-alvo → "esse job paga R$ 41/h, sua meta é R$ 75/h"
- **Impacto no caixa** → "paga em 45 dias; suas contas vencem antes — você atravessa queimando R$ 900 da reserva"
- **Custo de oportunidade** → "ocupa 60% da sua capacidade do mês"
- **Contribuição para a meta variável** → "fecha 52% do que falta em julho"
- **Veredito** → aceitar / **negociar para R$ X** / recusar, com o valor mínimo calculado

---

## 9. Cartão e parcelamento

O app **não avalia parcela — avalia comprometimento.**

```
COMPROMISSO FUTURO  = soma de todas as parcelas assumidas, mês a mês, 12 meses à frente
RENDA COMPROMETIDA  = compromisso futuro médio ÷ renda líquida média
```

| Faixa | Status |
|---|---|
| até 20% | ok |
| 20–30% | atenção |
| acima de 30% | crítico |

Exemplo de veredito:

> 🔴 **Não.** 10x de R$ 180 = **R$ 1.800**, não R$ 180. Sua renda comprometida sobe de
> 22% → 31%. Em **3 dos próximos 10 meses** isso deixa o mês negativo, incluindo
> dezembro. À vista com desconto: R$ 1.620, cabe em setembro.

A tela mostra a **fatura futura completa**: quanto de cada mês já está vendido e em
que mês as parcelas acabam.

---

## 10. Reservas

| Caixa | Função | Regra |
|---|---|---|
| **Emergência** | sobreviver | meta medida em *meses*, não em R$; saque exige motivo cadastrado e dupla confirmação |
| **Oportunidade** | dizer "sim" sem culpa | é daqui que sai o desejo; recebe também a sobra do gasto pessoal |
| **Doação** | compromisso | percentual separado **no ato da entrada**, não no fim do mês |
| **Colchão de sobras** | estabilizar renda variável | a sobra do mês sai do fluxo e **não vira orçamento do mês seguinte** |
| **Provisões** | anuais e impostos | rateio mensal automático, já descontado do Livre Real |

### Cascata de entrada

Toda receita é fatiada por percentuais definidos **antes** de o dinheiro ser visto:

```
receita recebida
  → doação          (%)
  → provisões       (%)
  → reservas        (%)
  → o que restar vira mês corrente
```

É esse mecanismo que impede a sobra de se dissolver no mês seguinte.

---

## 11. Gasto pessoal

```
LIVRE PESSOAL DO MÊS = X% da renda líquida JÁ REALIZADA no mês
```

O limite usa renda **realizada**, nunca prevista — com renda variável, no dia 3 do mês
ainda não se sabe quanto vai entrar. Consequência prática: o dinheiro sem pergunta
**cresce conforme o dinheiro entra**. Mês fraco aperta sozinho, sem exigir disciplina.

- Calibragem sugerida: **5% a 8%** da renda líquida.
- Gasto dentro do limite: lança e pronto, sem semáforo.
- Sobra do pessoal **não acumula** para o mês seguinte → vai para a Reserva de Oportunidade.

### Segunda renda e repasse

A segunda renda entra como **fonte de receita** (`income_source`), soma no bolo e conta
na autonomia. O gasto miúdo da outra pessoa **não é rastreado** — isso geraria dado
furado e atrito. Em vez disso, um **repasse pessoal fixo** sai do bolo mensalmente como
qualquer outra despesa fixa, e ali morre: sem veredito, sem categorização.

---

## 12. Dívidas

Cadastro com saldo, taxa mensal e parcelas restantes. O app oferece:

- **Avalanche** (maior juro primeiro — economiza mais) vs **bola de neve** (menor saldo
  primeiro — motiva mais), com a diferença em R$ e em meses explicitada. A escolha é sua.
- **Simulador de aporte extra:** "R$ 200/mês a mais na dívida B → quitação 7 meses antes,
  R$ 1.340 de juros economizados."
- **Alerta de incoerência:** "R$ 3.000 rendendo 0,9%/mês contra dívida a 4,5%/mês —
  quitar rende 5x mais que investir."
- **Data da liberdade:** linha do tempo até a última parcela.

---

## 13. Tom do conselheiro

Tom é decisão de produto, não de gosto. Portanto vira regra:

1. **Número primeiro, consequência depois.** Sem "talvez seja melhor considerar".
2. **Usa o histórico.** "Quarta compra por impulso em julho. R$ 890 no total. Sua meta de reserva atrasou 2 meses."
3. **Ataca o número, nunca o caráter.** Não existe "você é irresponsável"; existe "isso quebra agosto".
4. **Todo vermelho carrega a saída.** Valor que cabe hoje, ou data em que fica verde.
5. **Cobra o descumprimento.** Se o vermelho foi ignorado, o app lembra na próxima consulta.

A regra 5 só funciona porque toda consulta é gravada (§14, tabela `decision`).

---

## 14. Modelo de dados (MVP)

```
user (1)
 ├─ settings          custo_essencial, taxa_horaria, pct_pessoal, pro_labore,
 │                    metas_reserva, meta_autonomia
 ├─ income_source     fixa_1 | fixa_2 | variável   (fonte, não login)
 ├─ account           conta corrente, carteira, cartão
 ├─ category
 ├─ recurring         fixos e receitas fixas (dia, valor) — inclui o repasse pessoal
 ├─ transaction       data, valor, categoria, pote (comum|pessoal), conta, origem
 ├─ card
 │   └─ installment_plan
 │        └─ installment          (uma linha por mês futuro)
 ├─ debt              saldo, taxa, parcelas restantes, estratégia
 ├─ reserve           emergência | oportunidade | doação | colchão | provisão
 ├─ reserve_move      aporte/saque + motivo obrigatório
 ├─ allocation_rule   percentuais da cascata de entrada
 └─ decision      ★   pergunta, valor, veredito, motivo, seguiu? (sim/não)
```

**`decision` é o ativo do produto.** É ela que dá memória ao tom duro e é o único dado
que nenhum app de finanças tem sobre você: o histórico das suas decisões de compra
confrontado com o conselho recebido.

---

## 15. Telas (mobile-first)

| # | Tela | Conteúdo |
|---|---|---|
| 1 | **Hoje** | Livre Real gigante · autonomia em meses · meta variável do mês · botão "Posso comprar?" |
| 2 | **Perguntar** | valor + o quê + comum/pessoal + à vista/parcelado → veredito, custo em tempo, alternativa, e "assumir mesmo assim" (registrado) |
| 3 | **Lançar** | 3 toques: valor, categoria, pote |
| 4 | **Reservas** | 5 cartões com barra de progresso |
| 5 | **Dívidas & Cartão** | linha do tempo das parcelas + data da liberdade |
| 6 | **Mês** | fechamento: sobra → colchão, o que saiu do plano, placar de vereditos ignorados |

### Diretrizes visuais

- Flat, minimalista. **Um número por tela.**
- Fundo neutro, um único acento.
- Tipografia grande nos números; hierarquia por tamanho, não por cor.
- **Cor forte só no semáforo** — é ela que carrega o significado.
- Zero gráfico decorativo, zero gamificação, zero badge.
- Ação primária ao alcance do polegar.

---

## 16. Stack

- **PWA** — React + Vite + TypeScript, instalável no celular
- **Supabase** — Postgres, Auth (magic link), Row Level Security
- **Hospedagem** — GitHub Pages (SPA estática), backend no Supabase
- **Offline** — cache local + fila de sincronização: lançar funciona sem rede e sobe depois

Sem multiusuário: não há convites, permissões por membro nem realtime. Isso encurta o MVP
significativamente.

---

## 17. Faseamento

### Fase 0 — papel (antes de qualquer código)
Levantar os números de §18.

### MVP
Lançamentos · fixos e recorrências · cascata de entrada · Livre Real · autonomia ·
semáforo do "posso comprar" · custo em tempo · parcelas e compromisso futuro · 5 reservas.

### V2
Avaliador de proposta de serviço · simulador de quitação de dívida · fechamento mensal
automático com colchão · alertas proativos · placar de decisões.

### V3
Importação CSV/OFX · previsão de caixa 90 dias · relatórios · PWA offline completo.

### Fora de escopo (deliberadamente)
Open Finance, OCR de nota fiscal, carteira de investimentos, gráficos e relatórios
bonitos, metas de viagem, gamificação, chat com IA.

---

## 18. Fase 0 — checklist dos números

Sem estes valores o app não tem o que responder. Esta conversa muda mais a vida
financeira do que o software.

- [ ] Custo essencial mensal (o mínimo para viver, sem lazer)
- [ ] Renda fixa líquida — fonte 1
- [ ] Renda fixa líquida — fonte 2
- [ ] Média da renda variável dos últimos 3 meses
- [ ] Horas realmente trabalhadas por mês (incluindo administrativo)
- [ ] Taxa horária alvo
- [ ] Valor do pró-labore fixo mensal
- [ ] Valor do repasse pessoal mensal
- [ ] Lista de dívidas: saldo, taxa mensal, parcelas restantes
- [ ] Lista de parcelamentos ativos no cartão, mês a mês
- [ ] Saldo atual de cada conta
- [ ] **X% do gasto pessoal livre** (sugestão: 5–8%)
- [ ] Meta da reserva de emergência, em meses (sugestão: 6)
- [ ] Metas das reservas de oportunidade e doação
- [ ] Percentuais da cascata de entrada (doação / provisões / reservas)
- [ ] Custos anuais a provisionar (IPVA, IPTU, seguros, impostos)

# Assistente Financeiro — servidor

Backend mínimo pra sair do modo "só neste navegador" e virar um app com login,
acessível do celular e do computador, no seu domínio.

- **Node + Express** — API só com o essencial: setup, login, logout, e um par
  de rotas pra ler/gravar os dados (o mesmo formato `{ settings, ledger }` que
  já existia no export/import local).
- **SQLite** (`better-sqlite3`) — um arquivo, sem servidor de banco separado.
- **Login único** — não existe cadastro aberto. A primeira vez que alguém
  acessa sem conta criada, o app oferece criar a única conta. Depois disso,
  `/api/setup` fica bloqueado pra sempre (checa se já existe usuário).
- **Sessão via cookie `httpOnly`** assinado (JWT), 30 dias.

## Rodando local (sem Docker)

```bash
cd server
cp .env.example .env
# edite .env: gere um JWT_SECRET com `openssl rand -hex 32`,
# e deixe NODE_ENV=development pra testar em http://localhost sem HTTPS

npm install
npm run dev          # reinicia sozinho a cada mudança

# em outro terminal, builde o front-end apontando pro modo servidor:
cd ../app
VITE_SERVER_MODE=true npm run build

# o server já serve app/dist automaticamente — abra http://localhost:4000
```

Se preferir editar o front-end com hot-reload durante o desenvolvimento:
`cd app && npm run dev` (roda em outra porta, ex. 5173) — o `vite.config.ts`
já tem um proxy de `/api` pra `http://localhost:4000`, então funciona sem
mexer em nada, mas **lembre de rodar com `VITE_SERVER_MODE=true`** nesse
terminal também.

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `JWT_SECRET` | sim | Assina a sessão. Gere com `openssl rand -hex 32` e nunca reutilize entre ambientes. |
| `PORT` | não (padrão 4000) | Porta que o Node escuta. |
| `DB_PATH` | não (padrão `./data/app.db`) | Onde fica o arquivo SQLite. |
| `NODE_ENV` | não | `production` exige HTTPS pro cookie de sessão — é o que o deploy real usa. |
| `STATIC_DIR` | não | Pasta com o build do front-end a servir. No Docker já vem certo. |

## Deploy no seu VPS com domínio (Docker Compose + Caddy)

O `docker-compose.yml` na raiz do repo sobe dois containers: o app (Node) e
o **Caddy**, que expõe as portas 80/443 e busca o certificado TLS sozinho
via Let's Encrypt — não precisa mexer em certbot nem nginx.

1. **DNS**: no painel do seu registrador, crie um registro **A** apontando
   seu domínio (ex. `financas.seudominio.com`) pro IP do VPS. Espere
   propagar (minutos, às vezes até 1h).

2. **No VPS**, com Docker e Docker Compose instalados, clone o repositório
   e edite o `Caddyfile`, trocando `seudominio.com` pelo seu domínio real:
   ```
   financas.seudominio.com {
   	reverse_proxy app:4000
   }
   ```

3. Crie o `.env` na raiz do repo (mesmo nível do `docker-compose.yml`):
   ```bash
   echo "JWT_SECRET=$(openssl rand -hex 32)" > .env
   ```

4. Suba tudo:
   ```bash
   docker compose up -d --build
   ```

5. Acesse `https://financas.seudominio.com` — a primeira tela vai pedir pra
   criar a conta única. Depois disso, é login normal.

### Backup

Os dados moram no volume Docker `app-data` (arquivo SQLite). Além disso, o
app continua tendo o **Exportar dados** na tela Fase 0 — vale rodar de vez
em quando como cópia extra, já que é literalmente o mesmo formato que o
banco usa por baixo.

### Segurança, resumido

- Rate limit de 20 tentativas / 15 min em `/api/login` e `/api/setup`.
- Cookie de sessão é `httpOnly` (não acessível via JavaScript) e `secure`
  em produção (só trafega em HTTPS).
- Senha com bcrypt (custo 12), nunca fica em texto puro em lugar nenhum.
- Sem cadastro aberto: só existe a conta criada no primeiro acesso.

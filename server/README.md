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

## Deploy no CyberPanel (recomendado — é o seu caso)

CyberPanel roda em cima do **OpenLiteSpeed**, que já ocupa as portas
80/443. Por isso **não** entra o `docker-compose.yml`/Caddy deste repo
aqui — eles tentariam tomar as mesmas portas. Em vez disso: o Node roda
como processo comum numa porta interna, mantido vivo pelo **PM2**, e o
próprio CyberPanel faz o proxy + certificado.

1. **DNS**: no painel do seu registrador, crie um registro **A** apontando
   seu domínio (ex. `financas.seudominio.com`) pro IP do VPS.

2. **Criar o site no CyberPanel**: Websites → Create Website, com o
   domínio `financas.seudominio.com`. Não importa a versão de PHP
   selecionada — o Node não passa pelo PHP, é só pra CyberPanel gerar o
   vhost e liberar o gerenciamento de SSL pra esse domínio.

3. **Clonar e instalar** (via SSH, fora da pasta do site — o Node serve
   os arquivos sozinho, não precisa estar em `public_html`):
   ```bash
   git clone <url-do-seu-repo> /home/financas-app
   cd /home/financas-app/app
   npm ci
   VITE_SERVER_MODE=true npm run build

   cd ../server
   npm ci --omit=dev
   cp .env.example .env
   # edite o .env:
   #   JWT_SECRET=<gere com openssl rand -hex 32>
   #   HOST=127.0.0.1   (importante — sem isso o Node fica exposto direto)
   #   NODE_ENV=production
   ```

4. **Rodar com PM2** (mantém o processo vivo e reinicia sozinho se o VPS
   reiniciar):
   ```bash
   npm install -g pm2
   pm2 start src/server.js --name financas --cwd /home/financas-app/server
   pm2 save
   pm2 startup   # segue a instrução que ele imprime, uma vez só
   ```
   O servidor fica ouvindo em `127.0.0.1:4000` — não exposto direto pra
   internet, só o OpenLiteSpeed enxerga essa porta.

5. **Proxy no CyberPanel**: no site criado no passo 2, vá em
   **Rewrite Rules** e cole:
   ```
   RewriteEngine On
   RewriteCond %{HTTP:Upgrade} !=websocket [NC]
   RewriteRule /(.*) http://127.0.0.1:4000/$1 [P,L]
   ```
   Isso manda tudo que chega no domínio pro processo Node.

   > Se sua versão do CyberPanel tiver uma seção dedicada de **Node.js
   > App** (algumas têm, em Websites → List/Manage), ela faz esse mesmo
   > proxy por uma tela em vez de regra manual — pode usar no lugar do
   > passo 5, mantendo os passos 3 e 4 iguais.

6. **SSL**: no site, aba **SSL** → **Issue SSL** (Let's Encrypt, um
   clique) e depois **Force HTTPS**.

7. Acesse `https://financas.seudominio.com` — a primeira tela pede pra
   criar a conta única. Dali em diante é login normal.

**Atualizar depois de uma mudança no código:**
```bash
cd /home/financas-app && git pull
cd app && VITE_SERVER_MODE=true npm run build
cd ../server && npm ci --omit=dev && pm2 restart financas
```

## Alternativa: VPS genérico sem painel (Docker Compose + Caddy)

Se um dia você rodar isso num VPS **sem** CyberPanel/OpenLiteSpeed (ou
numa porta/IP dedicados), o `docker-compose.yml` na raiz do repo sobe
dois containers: o app (Node) e o **Caddy**, que expõe 80/443 e busca o
certificado TLS sozinho via Let's Encrypt.

```bash
# Caddyfile: troque "seudominio.com" pelo domínio real
echo "JWT_SECRET=$(openssl rand -hex 32)" > .env
docker compose up -d --build
```

## Backup

Os dados moram em `server/data/app.db` (SQLite). Além disso, o app
continua tendo o **Exportar dados** na tela Fase 0 — vale rodar de vez em
quando como cópia extra, já que é literalmente o mesmo formato que o
banco usa por baixo.

## Segurança, resumido

- Rate limit de 20 tentativas / 15 min em `/api/login` e `/api/setup`.
- Cookie de sessão é `httpOnly` (não acessível via JavaScript) e `secure`
  em produção (só trafega em HTTPS).
- Senha com bcrypt (custo 12), nunca fica em texto puro em lugar nenhum.
- Sem cadastro aberto: só existe a conta criada no primeiro acesso.
- O Node escuta só em `127.0.0.1` — quem fala com a internet é o
  OpenLiteSpeed, que já cuida de TLS.

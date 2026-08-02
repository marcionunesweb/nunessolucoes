# Playbook de deploy — VPS com CyberPanel

Roteiro genérico pra colocar qualquer app Node num VPS com CyberPanel
(OpenLiteSpeed + AlmaLinux/CloudLinux). Escrito depois do primeiro deploy
real, com os problemas que apareceram e como foram resolvidos — a ideia é
não repetir a mesma investigação em cada novo projeto.

Preencha os campos entre `< >` com os dados do projeto/VPS específico.
Um preenchido de verdade (com os dados reais dessa VPS) foi entregue
separado, fora do repositório.

---

## 0. Perfil do ambiente (uma vez só, vale pra qualquer app nessa VPS)

- **Painel**: CyberPanel, sobre **OpenLiteSpeed** — que já ocupa as portas
  80/443. Nenhum app novo pode tentar abrir essas portas diretamente;
  todo mundo roda numa porta interna (ex. 4000, 4001...) e o CyberPanel
  faz o proxy.
- **SO**: confirme com `cat /etc/os-release`. Se for AlmaLinux/CloudLinux/
  RHEL, o gerenciador de pacotes é `dnf` (não `apt-get`).
- **SSH**: a porta pode não ser a 22 padrão — confira no painel da
  hospedagem (procure "Acesso SSH"/"SSH Access") antes de tentar conectar.
- **Login do CyberPanel é separado do login SSH.** Usuário raiz do painel
  normalmente é `admin`, senha definida na instalação — se não souber
  qual é, tem uma receita de recuperação na seção 6.
- **Node.js**: confira com `node -v`. Se não tiver, instale (AlmaLinux):
  ```bash
  curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -
  sudo dnf install -y nodejs
  ```
- **PM2**: gerenciador de processo, uma instalação global serve pra todos
  os apps:
  ```bash
  npm install -g pm2
  ```

---

## 1. Registro de apps já publicados nessa VPS

Mantenha essa tabela atualizada (no arquivo com os dados reais) — é o que
evita dois apps tentando usar a mesma porta:

| App | Domínio | Porta interna | Pasta |
|---|---|---|---|
| `<nome>` | `<dominio>` | `<porta, ex. 4000>` | `/home/<pasta>` |

Todo projeto novo pega a **próxima porta livre** (4001, 4002...).

---

## 2. Passo a passo pra um novo app

### 2.1 DNS
Registro **A** do subdomínio apontando pro IP do VPS, no painel do
registrador (ou da Cloudflare, se o domínio estiver lá — nesse caso o
"nuvem laranja"/proxy da Cloudflare pode ficar ligado, não atrapalha).

### 2.2 Criar o site no CyberPanel
**Websites → Create Website**, com o domínio/subdomínio do projeto. A
versão de PHP selecionada não importa se o app não usa PHP — é só pra
gerar o vhost e liberar SSL.

### 2.3 Clonar e buildar
```bash
cd /home
git clone <url-do-repo> <pasta-do-projeto>
cd <pasta-do-projeto>

# se o front-end for Vite com um modo "servidor" (como o assistente
# financeiro tem), builde com a env var correspondente. Ajuste pro
# projeto em questão.
```

### 2.4 Backend
```bash
cd <pasta-do-projeto>/server   # ou onde o backend estiver
npm ci --omit=dev
```
Se der erro de compilação nativa (`node-gyp`, `python`, `make`):
```bash
sudo dnf groupinstall -y "Development Tools"
sudo dnf install -y python3
```

Configure o `.env` do projeto com a **próxima porta livre** da tabela da
seção 1, e gere um segredo novo se o projeto usar algo tipo `JWT_SECRET`:
```bash
openssl rand -hex 32
```

### 2.5 Rodar com PM2
```bash
pm2 start <arquivo-de-entrada> --name <nome-unico> --cwd /home/<pasta-do-projeto>/server
pm2 status                      # confirma "online"
pm2 save
pm2 startup                     # em versões novas do PM2, já faz tudo sozinho;
                                 # em versões antigas, copia e roda o comando
                                 # "sudo env PATH=..." que ele imprimir
```

### 2.6 Proxy no CyberPanel — vá direto pro vHost Conf

**Não perca tempo com a aba "Rewrite Rules"** — na prática, o modelo
`RewriteRule ... [P,L]` não fez o proxy funcionar (testado e confirmado).
Vá direto no mecanismo nativo do OpenLiteSpeed:

1. Site → **Manage** → aba **vHost Conf**.
2. **Sem apagar nada do que já existe**, adicione no final:
   ```
   extprocessor <nome_unico>_node {
     type                    proxy
     address                 127.0.0.1:<porta-do-app>
     maxConns                100
     pcKeepAliveTimeout      60
     initTimeout             60
     retryTimeout            0
     respBuffer              0
   }

   context / {
     type                    proxy
     handler                 <nome_unico>_node
     addDefaultCharset       off
   }
   ```
3. Salvar.
4. **Passo que costuma ser esquecido**: um simples "salvar" na interface
   não recarrega o OpenLiteSpeed de verdade. É preciso reiniciar por
   completo:
   ```bash
   systemctl restart lsws
   ```

### 2.7 SSL

**Pule a tela "SSL v2"** do painel (ela empurra integração com
Cloudflare/Namecheap que não é necessária). Emita direto pelo terminal,
mais rápido e sem depender de DNS API:
```bash
cyberpanel issueSSL --domainName <dominio>
```
Ignore avisos em vermelho vindos do `acme.sh` no meio da saída — o que
importa é a linha final `SSL successfully issued for ...`.

### 2.8 Testar

```bash
# direto no servidor, sem depender de DNS nem de eventual proxy da Cloudflare:
curl -skI -H "Host: <dominio>" https://127.0.0.1
```
Se aparecer o cabeçalho do seu backend (ex. `x-powered-by: Express`) em
vez de `CyberPanel-OLS`, o proxy está funcionando. Depois, testa no
navegador: `https://<dominio>`.

---

## 3. Atualizar um app depois de mudanças no código

```bash
cd /home/<pasta-do-projeto>
git pull
# rebuilda o front-end se o projeto tiver um
cd server && npm ci --omit=dev && pm2 restart <nome-unico>
```

---

## 4. Comandos de diagnóstico

| Sintoma | Comando |
|---|---|
| App não responde | `pm2 status` / `pm2 logs <nome> --lines 50` |
| Proxy não está pegando | `curl -skI -H "Host: <dominio>" https://127.0.0.1` |
| Erro de config do OpenLiteSpeed | `tail -60 /usr/local/lsws/logs/error.log` |
| Log do próprio site | `tail -60 /home/<dominio>/logs/<dominio>.error_log` |
| OpenLiteSpeed está de pé? | `systemctl status lsws` |
| Hora do servidor (pra comparar com timestamps de log) | `date` |

---

## 5. Erros já vistos e o que eram de verdade

- **`ssh: Connection refused` na porta 22** → a porta real não é a
  padrão. Confira no painel da hospedagem.
- **`cd: .../app: No such file or directory` depois do clone** → o
  código pode estar numa branch que não é a padrão. `git branch -a` pra
  ver, `git checkout <branch>` pra trocar.
- **Página padrão "CyberPanel Installed" mesmo com tudo configurado** →
  quase sempre é o proxy (seção 2.6) não recarregado — falta o
  `systemctl restart lsws`.
- **`better-sqlite3` ou outro pacote nativo falha ao instalar** → faltam
  ferramentas de compilação. `sudo dnf groupinstall -y "Development Tools"`.

---

## 6. Recuperar acesso ao CyberPanel, se um dia travar de novo

Se `admin`/senha não funcionar e não existir outro jeito de recuperar
pelo painel da hospedagem:

```bash
# 1. Descobrir o Python interno do CyberPanel
head -1 /usr/local/CyberCP/manage.py
# normalmente: /usr/local/CyberCP/bin/python

# 2. Resetar a senha do usuário admin diretamente no banco (usa bcrypt,
#    função própria do CyberPanel — não é o hasher padrão do Django)
/usr/local/CyberCP/bin/python /usr/local/CyberCP/manage.py shell -c "from loginSystem.models import Administrator; from plogical.hashPassword import hash_password; a = Administrator.objects.get(userName='admin'); a.password = hash_password('SENHA_NOVA_AQUI'); a.save(); print('ok')"
```

Se `admin` nem existir ainda (instalação nova, primeiro acesso), o
comando `cyberpanel createUser` cria a conta única — ver `cyberpanel
createUser --help` pros parâmetros.

**Cuidado**: depois de digitar uma senha em um comando de terminal, ela
fica no histórico do shell. Rode `history -c` depois, e troque a senha
por dentro do painel assim que conseguir entrar.

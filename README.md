# AcheiUmPro — Backend (Next.js API) + MySQL

Este repositório contém o backend (API) do projeto AcheiUmPro. O backend é implementado com Next.js (App Router + API routes) e usa MySQL como banco de dados.

Resumo rápido
- Backend: Next.js (API Routes em `src/app/api` e antigas em `src/pages/api`)
- DB: MySQL (recomendado via Docker Compose para desenvolvimento)
- Autenticação: NextAuth / JWT + bcrypt
- Scripts úteis: `scripts/seed.js` (seed de dados), `scripts/smoke.js` (testes rápidos)

Pré-requisitos
- Node.js >= 18
- npm
- Docker (apenas para rodar o MySQL em container, opcional se você já tiver MySQL local)

Variáveis de ambiente (ex.: `.env.local` na raiz)
- DB_HOST (ex: localhost)
- DB_PORT (ex: 3306)
- DB_USER (ex: acheiuser)
- DB_PASSWORD (ex: acheipass)
- DB_NAME (ex: acheiumpro)
- NEXT_PUBLIC_API_URL (ex: http://localhost:3000)
- JWT_SECRET (secret para tokens — troque em produção)
- NEXTAUTH_SECRET (opcional — usado pelo NextAuth)

Arquivos de inicialização do banco
- `initdb/init.sql` — esquema base (users, providers, services, requests, reviews)
- `initdb/more_tables.sql` — tabelas adicionais (messages, notifications, notification_subscriptions, appointments)

Como subir o MySQL (Docker)
1) Certifique-se de que o Docker está rodando.
2) Inicie apenas o serviço de DB (docker compose):

```powershell
docker compose up -d db
```

Observação: o container inicializa o schema a partir de `initdb/init.sql` na primeira vez. Se quiser as tabelas extras (messages/notifications/appointments), aplique `initdb/more_tables.sql` manualmente (veja abaixo).

Como aplicar `more_tables.sql` (opções)
- Usando cliente MySQL (cmd/powershell):

```powershell
mysql -u <user> -p < "C:\Users\muril\Downloads\AcheiUmPro\initdb\more_tables.sql"
```

(Substitua `<user>`/senha conforme seu `.env.local`.)

- Ou, abra `initdb/more_tables.sql` no seu gerenciador e execute o SQL.

Como rodar o backend localmente
1) Instalar dependências:

```powershell
npm install
```

2) Criar um `.env.local` com as variáveis acima (ou exportá-las no seu shell).

3) Rodar o dev server:

```powershell
npm run dev
```

Scripts úteis (na raiz)
- `npm run dev` — inicia Next.js em modo dev
- `npm run build` / `npm start` — build + start
- `npm run seed` — executa `scripts/seed.js` para criar alguns usuários, provider, serviços e um request (útil para testes locais)
- `node scripts/smoke.js` — script rápido que faz login com as credenciais do seed e chama alguns endpoints (login -> /api/requests -> /api/messages/1 -> /api/notifications)

Notas sobre `seed` e `smoke`
- `scripts/seed.js` lê `.env.local` automaticamente (se existir) e conecta ao DB usando as mesmas credenciais do app.
- O seed cria usuários de teste com as seguintes credenciais:
  - client: email `client@example.com`, senha `password123`
  - provider: email `provider@example.com`, senha `password123`
- `scripts/smoke.js` usa a URL definida em `NEXT_PUBLIC_API_URL` (ou `http://localhost:3000`) para executar as chamadas.

EndPoints importantes para o frontend
- Auth
  - POST `/api/auth/login` — body: { email, password } -> retorna { message, token, user }
  - NextAuth endpoints também disponíveis em `/api/auth/*` (App Router handler em `src/app/api/auth/[...nextauth]/route.ts`)
- Requests
  - GET `/api/requests` — retorna requests do usuário autenticado (Bearer token)
  - POST `/api/requests` — criar solicitação (clients).
  - GET/PATCH `/api/requests/[id]` — detalhes / atualizar status (parâmetros e autorização aplicadas)
- Messages
  - GET `/api/messages/[requestId]` — lista mensagens do request (apenas participantes)
  - POST `/api/messages/[requestId]` — criar mensagem (participants/admin)
- Notifications
  - GET `/api/notifications` (opcional query `?status=unread`) — list notifications
  - PATCH `/api/notifications` — marcar como lidas (body { ids: [..] })
- Appointments
  - GET `/api/appointments` — listar appointments (provider/client/admin)
  - POST `/api/appointments` — criar/atualizar appointment a partir de `request_id`

Autenticação nas chamadas API (frontend)
- Envie header: `Authorization: Bearer <token>` (token obtido no login). Algumas rotas NextAuth também usam cookies quando o frontend integra NextAuth diretamente.

Comportamento atual (notas técnicas)
- O backend agora trata cenários onde algumas tabelas não existem em ambientes dev (ex.: `messages` e `notifications`) — em ambiente sem as tabelas extras, endpoints retornam listas vazias ou códigos 503 para operações de escrita (mensagens) em vez de crashar.
- Adicionei `queryWithRetry` (simples retry de 3 tentativas) para operações de DB críticas (mensagens, notificações, subscriptions) para reduzir erros transitórios no dev.

Boas práticas para o desenvolvedor frontend
- Use o token Bearer retornado por `/api/auth/login` para chamadas de API nos testes locais.
- Para testes completos de mensagens e notificações, certifique-se de aplicar `initdb/more_tables.sql` ou executar um DB de teste já com essas tabelas (o seed tenta inserir, mas pula inserções se a tabela não existir).
- Quando usar WebPush/email/sms em dev, configure as variáveis VAPID e SMTP/Twilio no `.env.local`. Caso não tenha, o envio será ignorado (safely).

Checklist antes de subir alterações front-end que dependem do backend
- [ ] Rodar `npm run seed` (ou aplicar `more_tables.sql`) para garantir que `messages` / `notifications` / `appointments` existam.
- [ ] Iniciar o backend (`npm run dev`) e confirmar login com `client@example.com`.
- [ ] Testar fluxos principais: criar request, enviar mensagem, aceitar request (PATCH), criar appointment.

Troubleshooting rápido
- Erro de permissão DB ao rodar seed: confira `DB_USER` / `DB_PASSWORD` em `.env.local` e as credenciais do container.
- Se vir `ER_NO_SUCH_TABLE` em logs de runtime, aplique `initdb/more_tables.sql`.

Contribuição / Git workflow (sugestão)
- Branches: `main` (produção), `develop` (integração); crie feature branches `feature/xxx` a partir de `develop`.
- Faça PRs da branch de feature para `develop`. Quando `develop` estiver estável, abra PR para `main`.

Se houver algo específico que o time de frontend precisa (component props, shape do JSON ou mocks), diga o que e eu ajusto o backend / README com exemplos de payload/response.

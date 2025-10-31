# AcheiUmPro — Plataforma de Solicitação de Serviços

Este repositório contém uma plataforma completa onde clientes podem solicitar serviços domésticos e profissionais podem aceitar e enviar propostas. O backend é implementado com Next.js (App Router + API routes) e usa MySQL como banco de dados.

## Funcionalidades Principais

### Para Clientes:
- Criar solicitações de serviços (eletricista, encanador, pintor, etc.)
- Receber propostas de profissionais com preços
- Escolher a melhor proposta e contratar o profissional
- Acompanhar o status do serviço
- Excluir suas próprias solicitações do dashboard

### Para Profissionais:
- Ver solicitações disponíveis por categoria
- Enviar propostas com preços personalizados
- Gerenciar trabalhos aceitos
- Histórico de serviços prestados
- Excluir suas próprias propostas dos trabalhos

## Resumo Técnico
- **Frontend**: Next.js 16 (React) com Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MySQL 8.0 (Docker)
- **Auth**: NextAuth + JWT personalizado
- **Scripts**: Seed de dados, testes de fumaça

Pré-requisitos
- Node.js >= 18
- npm
- Docker (apenas para rodar o MySQL em container, opcional se você já tiver MySQL local)

## Configuração do Banco de Dados

O projeto usa MySQL 8.0 rodando em Docker. As credenciais estão configuradas no `docker-compose.yml`:

```env
# Credenciais do MySQL (Docker)
DB_HOST=localhost
DB_PORT=3306  
DB_USER=acheiuser
DB_PASSWORD=acheipass
DB_NAME=acheiumpro
```

> Observação: confirme as variáveis em `.env.local` antes de rodar a aplicação.

### Migrações e tabelas extras
Há scripts e arquivos SQL para criar as tabelas principais e extras necessárias (por exemplo, `service_proposals`, `notifications`, `messages`, `appointments`). Use as ferramentas abaixo para aplicar as migrações quando precisar atualizar o schema.

- `scripts/migrate_db.js` — aplica `initdb/init.sql` e `initdb/more_tables.sql`, e cria a coluna `users.status` se estiver faltando.

Execute (no Windows PowerShell/cmd):

```powershell
# instale dependências se ainda não instalou
npm install
# rode a migração (usa .env.local para credenciais)
node scripts/migrate_db.js
```

Se preferir aplicar manualmente, use o cliente mysql como descrito abaixo para `initdb/more_tables.sql`.

### Estrutura do Banco
- `users` — Usuários (clientes e profissionais). Agora inclui a coluna `status` (active/suspended).
- `requests` / `service_requests` — Solicitações de serviços criadas pelos clientes
- `service_proposals` — Propostas enviadas por prestadores
- `services` — Serviços oferecidos por um prestador
- `notifications` — Sistema de notificações (opcional, contido em `more_tables.sql`)
- `messages` — Chat entre cliente e profissional (opcional)

### Como subir o MySQL (Docker)
1) Certifique-se de que o Docker está rodando.
2) Inicie apenas o serviço de DB (docker compose):

```powershell
docker compose up -d db
```

Observação: o container inicializa o schema a partir de `initdb/init.sql` na primeira vez. Se quiser as tabelas extras (messages/notifications/appointments), aplique `initdb/more_tables.sql` manualmente (veja abaixo).

### Como aplicar `more_tables.sql` (opções)
- Usando cliente MySQL (cmd/powershell):

```powershell
mysql -u <user> -p < "C:\Users\muril\Downloads\AcheiUmPro\initdb\more_tables.sql"
```

(Substitua `<user>`/senha conforme seu `.env.local`.)

- Ou, abra `initdb/more_tables.sql` no seu gerenciador e execute o SQL.

## Como rodar o backend localmente
1) Instalar dependências:

```powershell
npm install
```

2) Criar um `.env.local` com as variáveis acima (ou exportá-las no seu shell).

3) Rodar o dev server:

```powershell
npm run dev
```

## Scripts úteis (na raiz)
- `npm run dev` — inicia Next.js em modo dev
- `npm run build` / `npm start` — build + start
- `node scripts/seed_service_platform.js` — cria dados de teste da plataforma de serviços
- `node scripts/test_api.js` — testa todos os endpoints principais da API
- `node scripts/smoke.js` — script rápido que faz login com as credenciais do seed e chama alguns endpoints (login -> /api/requests -> /api/messages/1 -> /api/notifications)

## Testes e Desenvolvimento

### Credenciais de Teste
Após executar o seed (`node scripts/seed_service_platform.js`), você pode fazer login com:

**Cliente (Precisa de Serviços)**
- Email: `client@example.com`
- Senha: `password123`
- Acesso: Dashboard do cliente para criar solicitações

**Profissional (Prestador de Serviços)**  
- Email: `provider@example.com`
- Senha: `password123`
- Acesso: Dashboard do profissional para ver e aceitar solicitações

> Se desejar, atualize os exemplos de credenciais no seed ou no arquivo `scripts/seed_service_platform.js`.

### Teste da API
Execute `node scripts/test_api.js` para verificar se todos os endpoints estão funcionando:
- ✅ Login de cliente e profissional
- ✅ Busca de solicitações
- ✅ Criação de novas solicitações
- ✅ Listagem de solicitações disponíveis para profissionais

### Fluxo de Teste Completo
1. Login como cliente → Criar solicitação de serviço
2. Login como profissional → Ver solicitação disponível → Enviar proposta
3. Login como cliente → Ver proposta recebida → Aceitar profissional
4. Sistema de mensagens entre cliente e profissional

## Interface e Navegação

### Navegação Unificada
- **Cabeçalho Global**: Único cabeçalho que se adapta ao estado de login
- **Não Logado**: Exibe "Buscar Profissionais", "Para Profissionais", "Cadastre-se", "Entrar"
- **Logado**: Exibe "Dashboard", "Buscar", nome do usuário e "Sair"
- **Dashboards**: Conteúdo limpo sem duplicação de cabeçalhos

### Role-based redirects
Após login, o frontend direciona o usuário ao dashboard correto baseado em seu `role`:
- `client` → `/dashboard/client`
- `provider` → `/dashboard/provider`
- outros (admin) → `/dashboard`

### Dashboards Específicos
- **Cliente** (`/dashboard/client`): Criar e gerenciar solicitações
- **Profissional** (`/dashboard/provider`): Ver oportunidades e gerenciar propostas

## EndPoints da Plataforma de Serviços

### Auth
- `POST /api/auth/login` — Login: `{ email, password }` → `{ token, user }`
- `POST /api/auth/register` — Registro: `{ name, email, password, role, phone, location, services? }`

### Para Clientes
- `GET /api/requests` — Lista suas solicitações de serviço
- `POST /api/requests` — Cria nova solicitação: `{ title, description, category, location, budget?, urgency }`
- `GET /api/requests/[id]` — Detalhes da solicitação com propostas recebidas
- `DELETE /api/requests/[id]` — Excluir solicitação (apenas o dono)

### Para Profissionais  
- `GET /api/provider/requests` — Lista solicitações disponíveis (não respondidas)
- `POST /api/provider/accept` — Envia proposta: `{ requestId, proposedPrice }` (compat)
- `POST /api/requests/[id]/proposals` — Envia proposta (RESTful): `{ proposedPrice, message? }`
- `GET /api/provider/jobs` — Lista trabalhos onde enviou propostas

### Propostas
- `GET /api/requests/[id]/proposals` — Lista propostas de uma solicitação
- `PATCH /api/proposals/[id]` — Aceitar/Rejeitar: `{ action: 'accept' | 'reject' }`
- `DELETE /api/proposals/[id]` — Excluir proposta (apenas o autor da proposta)

### Gerais
- `GET /api/notifications` — Notificações do usuário
- `GET /api/messages/[requestId]` — Chat entre cliente e profissional

Autenticação nas chamadas API (frontend)
- Envie header: `Authorization: Bearer <token>` (token obtido no login). Algumas rotas NextAuth também usam cookies quando o frontend integra NextAuth diretamente.

## Comportamento atual (notas técnicas)
- O backend agora trata cenários onde algumas tabelas não existem em ambientes dev (ex.: `messages` e `notifications`) — em ambiente sem as tabelas extras, endpoints retornam listas vazias ou códigos 503 para operações de escrita (mensagens) em vez de crashar.
- Adicionei `queryWithRetry` (simples retry de 3 tentativas) para operações de DB críticas (mensagens, notificações, subscriptions) para reduzir erros transitórios no dev.

## Boas práticas para o desenvolvedor frontend
- Use o token Bearer retornado por `/api/auth/login` para chamadas de API nos testes locais.
- Para testes completos de mensagens e notificações, certifique-se de aplicar `initdb/more_tables.sql` ou executar um DB de teste já com essas tabelas (o seed tenta inserir, mas pula inserções se a tabela não existir).
- Quando usar WebPush/email/sms em dev, configure as variáveis VAPID e SMTP/Twilio no `.env.local`. Caso não tenha, o envio será ignorado (safely).

## Checklist antes de subir alterações front-end que dependem do backend
- [ ] Rodar `npm run seed` (ou aplicar `more_tables.sql`) para garantir que `messages` / `notifications` / `appointments` existam.
- [ ] Iniciar o backend (`npm run dev`) e confirmar login com `client@example.com`.
- [ ] Testar fluxos principais: criar request, enviar mensagem, aceitar request (PATCH), criar appointment.

## Troubleshooting

### Problemas Comuns Resolvidos
- ✅ **Cabeçalhos Duplicados**: Corrigido - agora há apenas um cabeçalho global
- ✅ **Rotas 404**: Todas as rotas principais funcionando corretamente
- ✅ **Erros de Compilação**: Componente Button e tipos corrigidos
- ✅ **Erro 401 Unauthorized**: Corrigido problema de autenticação na API de requests

### Soluções Rápidas
- **Erro de permissão DB ao rodar seed**: Confira `DB_USER` / `DB_PASSWORD` em `.env.local` e as credenciais do container
- **Se vir `ER_NO_SUCH_TABLE` em logs**: Execute `node scripts/create_service_tables.js` ou aplique `initdb/more_tables.sql`
- **Porta 3000 ocupada**: Use `taskkill /f /im node.exe` no Windows ou mate o processo Node.js

Contribuição / Git workflow (sugestão)
- Branches: `main` (produção), `develop` (integração); crie feature branches `feature/xxx` a partir de `develop`.
- Faça PRs da branch de feature para `develop`. Quando `develop` estiver estável, abra PR para `main`.

## Git workflow e proteção local de branches

Para evitar commits diretos em `main` ou `develop`, seguimos o fluxo onde todo trabalho é feito em feature branches.

Regras:
- Nunca commit ou push diretamente em `main` ou `develop`.
- Crie uma branch com prefixo `feature/`, `fix/` ou `hotfix/` a partir de `develop` e abra PRs para `develop`.

Habilitar hook local (uma vez por máquina de desenvolvimento):

```powershell
# a partir da raiz do projeto (Windows cmd/powershell)
# configura o git para usar os hooks dentro do repositório
git config core.hooksPath .githooks
# torne o hook executável (em git bash ou WSL)
# no Windows você pode apenas garantir que o node.exe esteja no PATH
``` 

O repositório já inclui um pré-commit hook em `.githooks/pre-commit` que impede commits quando você está em `main` ou `develop`. O hook roda `node ./scripts/check-branch.js`.

Se precisar sobrescrever temporariamente, execute um commit com `--no-verify` (não recomendado):

```powershell
git commit -m "mensagem" --no-verify
```

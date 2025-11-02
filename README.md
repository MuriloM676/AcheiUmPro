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
- **Database**: MySQL 8.0 (Docker) com connection pooling e health checks
- **Auth**: NextAuth + JWT personalizado com middleware de validação
- **Error Handling**: Sistema centralizado de tratamento de erros
- **Logging**: Sistema estruturado com níveis e contextos
- **Quality**: Qodana code analysis + CI/CD pipelines
- **Scripts**: Seed de dados, testes de fumaça, migrações automáticas
- **Arquitetura**: TypeScript com tipagem completa, sistema de cache, validação de esquemas

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

## Próximas Fases de Desenvolvimento

### Fase 1: Finalização do Serviço e Avaliações ⭐ (PRÓXIMA)
**Objetivo**: Permitir que o serviço seja finalizado e avaliado após conclusão

**Funcionalidades**:
- [ ] **Sistema de Conclusão de Serviço**
  - Cliente pode marcar serviço como concluído
  - Prestador pode confirmar conclusão
  - Status muda de "Em Andamento" para "Concluído"
  
- [ ] **Sistema de Avaliações (Reviews)**
  - Cliente avalia o prestador (1-5 estrelas + comentário)
  - Prestador avalia o cliente (opcional)
  - Histórico de avaliações no perfil
  - Cálculo de média de avaliações
  - Badge de prestador bem avaliado

- [ ] **Histórico de Serviços**
  - Visualização de serviços concluídos
  - Filtros por status, data, categoria
  - Exportação de histórico (PDF/Excel)

**Endpoints a criar**:
- `PATCH /api/requests/[id]/complete` - Marcar como concluído
- `POST /api/reviews` - Criar avaliação
- `GET /api/reviews/provider/[id]` - Avaliações do prestador
- `GET /api/requests/history` - Histórico de serviços

### Fase 2: Sistema de Mensagens em Tempo Real 💬
**Objetivo**: Comunicação eficiente entre cliente e prestador

**Funcionalidades**:
- [ ] **Chat em Tempo Real**
  - WebSocket ou Server-Sent Events
  - Mensagens instantâneas entre cliente e prestador
  - Indicador de "digitando..."
  - Notificação de mensagens não lidas
  
- [ ] **Anexos e Mídias**
  - Upload de fotos do problema/serviço
  - Compartilhamento de localização
  - Envio de documentos
  
- [ ] **Interface de Chat**
  - Lista de conversas ativas
  - Histórico completo de mensagens
  - Busca dentro das conversas

**Tecnologias**:
- Socket.io ou Pusher para real-time
- Upload: AWS S3, Cloudinary ou storage local
- Tabela `messages` já existe no banco

### Fase 3: Sistema de Pagamentos 💰
**Objetivo**: Processar pagamentos de forma segura

**Funcionalidades**:
- [ ] **Integração com Gateway de Pagamento**
  - Stripe ou Mercado Pago
  - PIX, Cartão de Crédito, Boleto
  - Split payment (plataforma + prestador)
  
- [ ] **Fluxo de Pagamento**
  - Cliente paga ao aceitar proposta ou após conclusão
  - Valor fica retido até confirmação do serviço
  - Liberação automática após avaliação
  
- [ ] **Gestão Financeira**
  - Dashboard financeiro para prestadores
  - Histórico de transações
  - Relatórios de ganhos
  - Solicitação de saque

**Endpoints a criar**:
- `POST /api/payments/create` - Criar pagamento
- `POST /api/payments/webhook` - Webhook do gateway
- `GET /api/payments/history` - Histórico
- `POST /api/withdrawals` - Solicitar saque

### Fase 4: Agendamento e Calendário 📅
**Objetivo**: Melhorar gestão de horários e disponibilidade

**Funcionalidades**:
- [ ] **Calendário do Prestador**
  - Definir disponibilidade por dia/horário
  - Bloqueio de datas indisponíveis
  - Visualização de agenda mensal/semanal
  
- [ ] **Sistema de Agendamento**
  - Cliente escolhe data/hora ao criar solicitação
  - Prestador confirma ou sugere outro horário
  - Lembretes automáticos (24h antes)
  - Integração com Google Calendar
  
- [ ] **Gestão de Conflitos**
  - Detectar sobreposição de agendamentos
  - Sugestão de horários alternativos
  - Reagendamento fácil

**Tabelas necessárias**:
- `availability` - Disponibilidade do prestador
- `appointments` - Agendamentos (já existe)

### Fase 5: Busca Avançada e Filtros 🔍
**Objetivo**: Melhorar descoberta de profissionais

**Funcionalidades**:
- [ ] **Busca Inteligente**
  - Busca por categoria, localização, preço
  - Filtro por avaliação mínima
  - Ordenação (melhor avaliado, menor preço, mais próximo)
  - Busca por palavra-chave
  
- [ ] **Geolocalização**
  - Busca por raio de distância
  - Mapa com prestadores próximos
  - Cálculo de distância até o cliente
  
- [ ] **Perfis Detalhados**
  - Portfólio do prestador (fotos de trabalhos)
  - Certificações e documentos
  - Anos de experiência
  - Especialidades

**Tecnologias**:
- Elasticsearch ou Algolia para busca
- Google Maps API para geolocalização
- Cloudinary para galeria de imagens

### Fase 6: Notificações Push e Email 🔔
**Objetivo**: Manter usuários engajados e informados

**Funcionalidades**:
- [ ] **Notificações Web Push**
  - Nova proposta recebida
  - Proposta aceita/rejeitada
  - Nova mensagem no chat
  - Lembrete de agendamento
  
- [ ] **Notificações por Email**
  - Email de boas-vindas
  - Resumo semanal de atividades
  - Alerta de solicitações próximas ao prestador
  - Newsletter com dicas
  
- [ ] **Notificações SMS** (opcional)
  - Confirmação de agendamento
  - Lembrete 1h antes do serviço

**Serviços**:
- Web Push: OneSignal ou Firebase
- Email: SendGrid, Mailgun ou Amazon SES
- SMS: Twilio

### Fase 7: Dashboard Admin e Analytics 📊
**Objetivo**: Ferramentas para gestão da plataforma

**Funcionalidades**:
- [ ] **Painel Administrativo**
  - Gestão de usuários (suspender, ativar)
  - Moderação de avaliações
  - Gestão de categorias de serviços
  - Resolução de disputas
  
- [ ] **Analytics e Métricas**
  - Total de usuários ativos
  - Solicitações por categoria
  - Taxa de conversão (solicitação → contratação)
  - Receita da plataforma
  - Gráficos e relatórios
  
- [ ] **Sistema de Suporte**
  - Tickets de suporte
  - Chat ao vivo com admin
  - Base de conhecimento (FAQ)

### Fase 8: Mobile App 📱
**Objetivo**: Aplicativo nativo para melhor experiência

**Funcionalidades**:
- [ ] **App React Native ou Flutter**
  - Todas as funcionalidades web
  - Notificações push nativas
  - Câmera para fotos in-app
  - Geolocalização em tempo real
  
- [ ] **Features Mobile-First**
  - Modo offline (cache de dados)
  - Biometria para login
  - Compartilhamento rápido
  - Deep links

### Fase 9: Melhorias de Performance e Segurança 🔒
**Objetivo**: Otimização e proteção da plataforma

**Funcionalidades**:
- [ ] **Performance**
  - Cache com Redis
  - CDN para assets estáticos
  - Lazy loading de imagens
  - Server-Side Rendering otimizado
  
- [ ] **Segurança**
  - Rate limiting nas APIs
  - Validação rigorosa de inputs
  - Sanitização de uploads
  - Auditoria de ações sensíveis
  - 2FA para login
  
- [ ] **Testes**
  - Testes unitários (Jest)
  - Testes E2E (Playwright/Cypress)
  - Testes de carga (k6)
  - Coverage > 80%

### Fase 10: Features Premium e Monetização 💎
**Objetivo**: Gerar receita sustentável

**Funcionalidades**:
- [ ] **Planos Premium para Prestadores**
  - Destaque em buscas
  - Selo de verificado
  - Mais propostas simultâneas
  - Analytics avançado
  
- [ ] **Sistema de Comissões**
  - Taxa da plataforma por serviço
  - Assinatura mensal para prestadores
  - Pacotes de créditos para clientes
  
- [ ] **Programa de Indicação**
  - Cliente indica prestador (bônus)
  - Prestador indica cliente
  - Descontos progressivos

---

## Roadmap Resumido

| Fase | Foco | Prioridade | Tempo Estimado |
|------|------|------------|----------------|
| 1 | Avaliações e Conclusão | 🔥 Alta | 1-2 semanas |
| 2 | Chat em Tempo Real | 🔥 Alta | 2-3 semanas |
| 3 | Pagamentos | ⚡ Média | 3-4 semanas |
| 4 | Agendamento | ⚡ Média | 2 semanas |
| 5 | Busca Avançada | ⚡ Média | 2-3 semanas |
| 6 | Notificações | ✅ Baixa | 1-2 semanas |
| 7 | Admin Dashboard | ✅ Baixa | 3 semanas |
| 8 | Mobile App | 📅 Futura | 6-8 semanas |
| 9 | Performance/Segurança | 📅 Contínua | Ongoing |
| 10 | Monetização | 📅 Futura | 2-3 semanas |

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

## 📚 Documentação Adicional

- **[Error Handling & Logging](docs/ERROR_HANDLING_LOGGING.md)** - Sistema de tratamento de erros e logs estruturados
- **[Qodana Setup](docs/QODANA_SETUP.md)** - Configuração de análise de código
- **[Git Workflow](GIT_WORKFLOW.md)** - Fluxo de trabalho com Git
- **[Contributing](CONTRIBUTING.md)** - Guia de contribuição

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

## Atualizações Recentes

### Correções de Autenticação
- Substituído o uso de `useSession` por `useAuth` na página de avaliações para alinhar com o sistema de autenticação baseado em tokens.
- Adicionado suporte ao `localStorage` para autenticação de usuários.

### Melhorias na API de Avaliações
- Atualizado o método de autenticação para usar `getUserFromRequest`.
- Corrigido problema de inserção na tabela `reviews` para incluir `provider_id` e `client_id` obrigatórios.
- Adicionado tratamento de erros mais robusto para respostas HTTP.

### Testes e Validação
- Testes realizados para garantir que a página de avaliações e a API funcionam corretamente com as novas mudanças.
- Verificado o fluxo de login e acesso restrito para usuários não autenticados.

# AcheiUmPro — Backend (Next.js API + MySQL)

This repository contains a minimal Next.js (API routes) backend that connects to a MySQL database running in Docker. It implements registration and login for clients and providers, profile updates, creating requests, and listing providers.

Features
- Next.js API routes (under `src/pages/api`)
- MySQL schema provided in `initdb/init.sql`
- Authentication with JWT and bcrypt
- Docker Compose with MySQL and backend services
- Basic validation (Joi) and clear success/error messages

Environment (in docker-compose)
- DB_HOST=db
- DB_PORT=3306
- DB_USER=acheiuser
- DB_PASSWORD=acheipass
- DB_NAME=acheiumpro
- JWT_SECRET=change_this_secret

How to run with Docker Compose
1. Ensure Docker is running.
2. From this project root run:

```powershell
docker compose up --build
```

This will launch MySQL (initialized using `initdb/init.sql`) and the Next.js backend on port 3000.

API overview (examples)
- POST /api/auth/register — register a client or provider. Body: { name, email, password, role: 'client'|'provider', ... }
- POST /api/auth/login — login (returns JWT)
- PUT /api/profile — update profile (Authorization: Bearer <token>)
- GET /api/providers — list providers (optional ?service=NAME or ?q=search)
- POST /api/requests — create a request (Authorization: Bearer <token>)

Extras adicionados
- `openapi.yaml` — especificação OpenAPI (subset) em `openapi.yaml` para gerar clientes ou documentação.
- `postman_collection.json` — collection mínima com exemplos de Register/Login/List Providers/Create Request.
- `scripts/seed.js` — script Node para popular o banco com um cliente, um prestador e serviços (usa as helpers do projeto, execute após o banco estar disponível).

Como usar o seed (após subir o MySQL):

```powershell
# no Windows PowerShell, com as variáveis apontando para o DB do Docker (opcional, usa valores do docker-compose por padrão)
setx DB_HOST db
setx DB_USER acheiuser
setx DB_PASSWORD acheipass
setx DB_NAME acheiumpro

# instalar dependências localmente (uma vez)
npm install

# rodar seed (garanta que o container db esteja pronto)
node scripts/seed.js
```


Notes
- Update `JWT_SECRET` in docker-compose.yml for production.
- The init SQL creates required tables and runs only on first-time DB init.

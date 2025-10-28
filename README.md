# AcheiUmPro — Backend (Next.js API) + MySQL (apenas MySQL em Docker)

Este repositório contém um backend em Next.js (API routes) que usa um banco MySQL rodando em Docker. Agora o backend roda localmente (fora do Docker) e apenas o MySQL fica containerizado.

Principais pontos
- Next.js API routes (em `src/pages/api` e novas rotas no App Router em `src/app/api`)
- MySQL inicializado a partir de `initdb/init.sql`
- Autenticação com JWT + bcrypt
- Docker Compose somente para o serviço `db`
- Validação básica (Joi)

Variáveis de ambiente (rodando localmente)
- DB_HOST=localhost
- DB_PORT=3306
- DB_USER=acheiuser
- DB_PASSWORD=acheipass
- DB_NAME=acheiumpro
- JWT_SECRET=change_this_secret

Como subir apenas o MySQL (Docker)
1) Certifique-se de que o Docker Desktop está rodando.
2) Na raiz do projeto, execute:

```powershell
docker compose up -d db
```

Como rodar o backend localmente
1) Instale as dependências:

```powershell
npm install
```

2) (Opcional) Desabilite o Turbopack se encontrar instabilidades no dev server:

```powershell
$env:NEXT_DISABLE_TURBOPACK = "1"
```

3) Exporte as variáveis de ambiente para apontar para o MySQL em Docker (ou crie um `.env.local` com os valores acima):

```powershell
$env:DB_HOST = "localhost"; $env:DB_PORT = "3306"; $env:DB_USER = "acheiuser"; $env:DB_PASSWORD = "acheipass"; $env:DB_NAME = "acheiumpro"; $env:JWT_SECRET = "change_this_secret"
```

4) Rode o servidor de desenvolvimento:

```powershell
npm run dev
```

Seed de dados (opcional)

```powershell
# Com o container do MySQL no ar (db)
node scripts/seed.js
```

Notas
- Ajuste `JWT_SECRET` para um valor seguro em ambientes reais.
- O script de init em `initdb/init.sql` roda apenas na primeira inicialização do volume do MySQL.
